import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Entity, Service } from 'electrodb';
import { AUDIT_FIELDS, DDB_KEYS, generateId } from 'jfsi/node/entities';
import { Bucket } from 'sst/node/bucket';
import { z } from 'zod';
import { assertActor } from './actors';
import { zod } from './zod';

const s3 = new S3Client({});

const DocumentsEntity = new Entity({
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
      type: ['created', 'processing', 'ready', 'failed'] as const,
      required: true,
    },
  },
  indexes: {
    documentsByOrganizationId: {
      collection: 'documents',
      pk: {
        field: DDB_KEYS.defaultIndex.partitionKey,
        composite: ['organizationId', 'documentId'],
      },
      sk: { field: DDB_KEYS.defaultIndex.sortKey, composite: [] },
    },
  },
});

const FilesEntity = new Entity({
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
    type: { type: ['application/pdf'] as const },
    /** The file's size in bytes */
    size_bytes: { type: 'number' },
    /** The number of pages this file contains, it's mainly used for pdf type */
    pages: { type: 'number' },
    /** A summary of what this file contains */
    summary: { type: 'string' },
    status: {
      type: ['created', 'uploaded', 'processing', 'ready', 'failed'] as const,
      required: true,
    },
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
});

const DocumentService = new Service({
  documents: DocumentsEntity,
  files: FilesEntity,
});

/** Create a new document */
export const createDocument = zod(z.void(), async () => {
  const actor = assertActor('user');

  const res = await DocumentsEntity.create({
    organizationId: actor.properties.organizationId,
    documentId: generateId('docu'),
    status: 'created',
    createdBy: actor.properties.userId,
  }).go();

  return res;
});

/**
 * Get a pre-signed url that we can use to upload the file into S3
 * @param documentId The document's id to add the file to
 */
export const getUploadUrl = zod(z.string(), async (documentId) => {
  const actor = assertActor('user');

  const fileId = generateId('file');
  const key = `${actor.properties.organizationId}/${documentId}/${fileId}`;

  const file = await FilesEntity.create({
    organizationId: actor.properties.organizationId,
    documentId,
    fileId,
    s3Bucket: Bucket.files.bucketName,
    s3Key: key,
    status: 'created',
  }).go();

  const command = new PutObjectCommand({
    Bucket: Bucket.files.bucketName,
    Key: key,
    Metadata: {
      organizationId: file.data.organizationId,
      documentId: file.data.documentId,
      fileId: file.data.fileId,
    },
  });

  return getSignedUrl(s3, command, { expiresIn: 3600 });
});

/**
 * Get a document and all of it's related files by the document's id.
 * @param documentId The document's id
 */
export const getDocumentById = zod(z.string(), async (documentId) => {
  const actor = assertActor('user');

  const res = await DocumentService.collections
    .documents({
      organizationId: actor.properties.organizationId,
      documentId,
    })
    .go();

  return res.data;
});

export * as Documents from './documents';
