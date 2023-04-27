import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Entity, EntityItem, Service } from 'electrodb';
import { AUDIT_FIELDS, DDB_KEYS, generateId } from 'jfsi/node/entities';
import { Bucket } from 'sst/node/bucket';
import { z } from 'zod';
import { assertActor } from './actors';
import { zod } from './zod';
import { Configuration } from './dynamo';

const s3 = new S3Client({});

const DOCUMENT_STATUS = ['created', 'processing', 'ready', 'failed'] as const;
const FILE_STATUS = [
  'created',
  'uploaded',
  'processing',
  'ready',
  'failed',
] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUS)[number];
export type FileStatus = (typeof FILE_STATUS)[number];

const DocumentsEntity = new Entity(
  {
    model: {
      version: '1',
      service: 'unbind',
      entity: 'doc',
    },
    attributes: {
      ...AUDIT_FIELDS,
      /** The organization this document belongs to */
      organizationId: { type: 'string', required: true },
      /** The document's unique id */
      documentId: { type: 'string', required: true },
      name: { type: 'string' },
      /** A summary of what this file contains */
      summary: { type: 'string' },
      status: {
        type: DOCUMENT_STATUS,
        required: true,
      },
    },
    indexes: {
      documentsById: {
        collection: 'documents',
        pk: {
          field: DDB_KEYS.defaultIndex.partitionKey,
          composite: ['organizationId', 'documentId'],
        },
        sk: { field: DDB_KEYS.defaultIndex.sortKey, composite: [] },
      },
      documentsByOrganizationId: {
        index: DDB_KEYS.gsi1.indexName,
        pk: {
          field: DDB_KEYS.gsi1.partitionKey,
          composite: ['organizationId'],
        },
        sk: { field: DDB_KEYS.gsi1.sortKey, composite: [] },
      },
    },
  },
  Configuration
);

export type DocumentInfo = EntityItem<typeof DocumentsEntity>;

const FilesEntity = new Entity(
  {
    model: {
      version: '1',
      service: 'unbind',
      entity: 'file',
    },
    attributes: {
      ...AUDIT_FIELDS,
      /** The organization this file belongs to */
      organizationId: { type: 'string', required: true },
      /** The document this file belongs to */
      documentId: { type: 'string', required: true },
      /** The file's unique ID */
      fileId: { type: 'string', required: true },
      /** The original filename */
      filename: { type: 'string' },
      /** The S3 Bucket this file is saved in */
      s3Bucket: { type: 'string', required: true },
      /** The S3 Key this file is saved under */
      s3Key: { type: 'string', required: true },
      /** The file type */
      type: { type: 'string' },
      /** The file's size in bytes */
      size_bytes: { type: 'number' },
      /** The number of pages this file contains, it's mainly used for pdf type */
      pageCount: { type: 'number' },
      /** A summary of what this file contains */
      summary: { type: 'string' },
      status: {
        type: FILE_STATUS,
        required: true,
      },
      /** A message to explain the status, generally used for 'failed' */
      statusMessage: { type: 'string' },
    },
    indexes: {
      filesByOrganizationId: {
        collection: 'documents',
        pk: {
          field: DDB_KEYS.defaultIndex.partitionKey,
          composite: ['organizationId', 'documentId'],
        },
        sk: {
          field: DDB_KEYS.defaultIndex.sortKey,
          composite: ['fileId'],
        },
      },
    },
  },
  Configuration
);

const DocumentService = new Service({
  documents: DocumentsEntity,
  files: FilesEntity,
});

export const listDocuments = zod(z.void(), async () => {
  const actor = assertActor('user');

  const res = await DocumentsEntity.query
    .documentsByOrganizationId({
      organizationId: actor.properties.organizationId,
    })
    .go();

  return res.data;
});

/** Create a new document */
export const createDocument = zod(z.string().optional(), async (name) => {
  const actor = assertActor('user');

  const res = await DocumentsEntity.create({
    organizationId: actor.properties.organizationId,
    documentId: generateId('docu'),
    status: 'created',
    createdBy: actor.properties.userId,
    name,
  }).go();

  return res.data;
});

/**
 * Generate the Key for a file inside of S3
 * @param organizationId The id of the organization this file belongs to
 * @param documentId The id of the document this file belongs to
 * @param fileId The id of the file
 * @returns
 */
export function generateFileS3Key(
  organizationId: string,
  documentId: string,
  fileId: string
) {
  return `${organizationId}/${documentId}/${fileId}`;
}

/**
 * Get the metadata from the S3 key, basically a reverse of `generateFileS3Key`
 * @param key The S3 key to get the metadata from
 * @returns
 */
export function getMetadataFromS3Key(key: string) {
  const [organizationId, documentId, fileId] = key.split('/');
  return { organizationId, documentId, fileId };
}

/**
 * Get a pre-signed url that we can use to upload the file into S3
 * @param documentId The document's id to add the file to
 */
export const getUploadUrl = zod(
  z.object({
    documentId: z.string(),
    filename: z.string().optional(),
    type: z.string().optional(),
  }),
  async ({ documentId, filename, type }) => {
    const actor = assertActor('user');

    const fileId = generateId('file');
    const key = generateFileS3Key(
      actor.properties.organizationId,
      documentId,
      fileId
    );

    const file = await FilesEntity.create({
      organizationId: actor.properties.organizationId,
      documentId,
      fileId,
      filename,
      s3Bucket: Bucket.files.bucketName,
      s3Key: key,
      status: 'created',
      type,
      createdBy: actor.properties.userId,
    }).go();

    const command = new PutObjectCommand({
      Bucket: Bucket.files.bucketName,
      Key: key,
      ContentType: type,
      Metadata: {
        organizationId: file.data.organizationId,
        documentId: file.data.documentId,
        fileId: file.data.fileId,
        fileName: file.data.filename || 'no-original-filename',
      },
    });

    return getSignedUrl(s3, command, { expiresIn: 3600 });
  }
);

/**
 * Get a pre-signed urls that we can use to upload multiple files into S3. This
 * also creates a new document and places all the files under the same document.
 * @param fileNames The file names to upload
 */
export const getUploadUrlsForNewDocument = zod(
  z.array(z.object({ filename: z.string(), type: z.string() })),
  async (files) => {
    // Create a new document which defaults to the name of the first file
    const document = await createDocument(files[0].filename);

    // Get the upload urls for each file
    const fileUploadUrls = await Promise.all(
      files.map(async ({ filename, type }) => {
        return getUploadUrl({
          documentId: document.documentId,
          filename,
          type,
        });
      })
    );

    return {
      documentId: document.documentId,
      fileUploadUrls,
    };
  }
);

/**
 * Get a document and all of it's related files by the document's id.
 * @param documentId The document's id
 */
export const getDocumentById = zod(
  z.object({ documentId: z.string(), organizationId: z.string().optional() }),
  async ({ documentId, organizationId }) => {
    const organizationIdToUse =
      organizationId ?? assertActor('user').properties.organizationId;

    const res = await DocumentService.collections
      .documents({
        organizationId: organizationIdToUse,
        documentId,
      })
      .go();

    return res.data;
  }
);

/**
 * Get a file
 */
export const getFile = zod(
  z.object({
    organizationId: z.string(),
    documentId: z.string(),
    fileId: z.string(),
  }),
  async ({ organizationId, documentId, fileId }) => {
    const res = await FilesEntity.get({
      organizationId,
      documentId,
      fileId,
    }).go();

    return res.data;
  }
);

/**
 * Work out what the document status should be based on the provided list of
 * file statuses.
 * @param fileStatuses List of file statuses
 * @returns
 */
function getDocumentStatusFromFileStatuses(
  fileStatuses: FileStatus[]
): DocumentStatus {
  if (fileStatuses.some((status) => status === 'failed')) {
    return 'failed';
  }
  if (fileStatuses.every((status) => status === 'ready')) {
    return 'ready';
  }

  if (
    fileStatuses.some(
      (status) => status === 'uploaded' || status === 'processing'
    )
  ) {
    return 'processing';
  }

  return 'created';
}

/**
 * Update the document's status based on the file's statuses.
 */
const updateDocumentStatusFromFile = zod(
  z.object({
    organizationId: z.string(),
    documentId: z.string(),
  }),
  async ({ organizationId, documentId }) => {
    // Get the document and every other file that belongs to that document
    const data = await getDocumentById({ documentId, organizationId });
    // Work out the document's status based on the file statuses
    const documentStatus = getDocumentStatusFromFileStatuses(
      data.files.map((file) => file.status)
    );

    // If the document's status has changed, update it
    if (documentStatus !== data.documents[0].status) {
      await DocumentsEntity.update({
        organizationId,
        documentId,
      })
        .set({ status: documentStatus })
        .go();
    }
  }
);

/**
 * Update a file's status and inherently update the document's status as well.
 */
export const updateFileStatus = zod(
  z.object({
    organizationId: z.string(),
    documentId: z.string(),
    fileId: z.string(),
    status: z.enum(FILE_STATUS),
    statusMessage: z.string().optional(),
  }),
  async ({
    organizationId,
    documentId,
    fileId,
    status,
    statusMessage = '',
  }) => {
    // Update the file's status
    const res = await FilesEntity.update({
      organizationId,
      documentId,
      fileId,
    })
      .set({ status, statusMessage: statusMessage })
      .go({ response: 'all_new' });

    await updateDocumentStatusFromFile({ organizationId, documentId });

    return res.data;
  }
);

/**
 * Update a file's metadata after it has been processed via AI and make sure we
 * have the most up to date information about the file.
 */
export const updateFileAfterProcessing = zod(
  z.object({
    organizationId: z.string(),
    documentId: z.string(),
    fileId: z.string(),
    size: z.number(),
    summary: z.string(),
    pageCount: z.number(),
  }),
  async ({ organizationId, documentId, fileId, size, summary, pageCount }) => {
    const res = await FilesEntity.update({
      organizationId,
      documentId,
      fileId,
    })
      .set({
        size_bytes: size,
        summary,
        pageCount,
        status: 'ready',
        statusMessage: '',
      })
      .go({ response: 'all_new' });

    await updateDocumentStatusFromFile({ organizationId, documentId });

    return res.data;
  }
);

export * as Documents from './documents';
