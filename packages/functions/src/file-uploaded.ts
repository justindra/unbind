import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  generateEmbeddingsAndDocuments,
  generateSummary,
  loadDocumentFromS3Object,
  saveEmbeddings,
} from '@unbind/core/analysis';
import {
  getFile,
  getMetadataFromS3Key,
  updateFileAfterProcessing,
  updateFileStatus,
} from '@unbind/core/entities/documents';
import { assertApiKeys, getApiKeys } from '@unbind/core/entities/organizations';
import { S3Handler } from 'aws-lambda';

const client = new S3Client({});

async function getObject(key: string, bucketName: string) {
  const params = {
    Bucket: bucketName,
    Key: key,
  };
  const data = await client.send(new GetObjectCommand(params));
  return data;
}

/**
 * Handle when a file or multiple file(s) are uploaded to S3.
 */
export const handler: S3Handler = async (event) => {
  await Promise.all(
    event.Records.map(async (record) => {
      // Get the key and bucket name from the event
      const key = decodeURIComponent(record.s3.object.key);
      const bucket = record.s3.bucket.name;
      // Get the organizationId, documentId and fileId from the key
      const { organizationId, documentId, fileId } = getMetadataFromS3Key(key);

      try {
        const s3Object = await getObject(key, bucket);

        if (
          s3Object.ContentType &&
          s3Object.ContentType !== 'application/pdf'
        ) {
          throw new Error(
            `File ${key} is not a PDF, therefore unable to process at this time.`
          );
        }

        // Double check that the file has not already been processed
        const currentFile = await getFile({
          organizationId,
          documentId,
          fileId,
        });

        if (!currentFile) {
          throw new Error(`File ${key} does not exist in DDB`);
        }

        if (currentFile.status === 'ready') {
          throw new Error(
            `File ${key} has already been processed and is ready to be used`
          );
        }

        // Update the file in DDB to be 'processing'
        await updateFileStatus({
          organizationId,
          documentId,
          fileId,
          status: 'processing',
        });

        const keys = await getApiKeys(organizationId);
        assertApiKeys(keys);

        const filename = s3Object.Metadata?.fileName || '';

        const docs = await loadDocumentFromS3Object(s3Object);
        const { embeddings, vectors, documents, pageCount } =
          await generateEmbeddingsAndDocuments(docs, {
            fileId,
            documentId,
            filename,
            openAIApiKey: keys.openAIApiKey,
            organizationId,
          });

        const res = await Promise.all([
          // Analyze the file and save embeddings to Pinecone
          saveEmbeddings(embeddings, vectors, documents, {
            organizationId,
            pineconeApiKey: keys.pineconeApiKey,
            pineconeEnvironment: keys.pineconeEnvironment,
            pineconeIndex: keys.pineconeIndex,
          }),
          // Analyze the file to have a summary of the file
          generateSummary(documents, keys.openAIApiKey, vectors),
        ]);

        // Update the file in DDB with all the new details that we have analyzed
        await updateFileAfterProcessing({
          organizationId,
          documentId,
          fileId,
          pageCount,
          size: s3Object.ContentLength || 0,
          summary: res[1] || '',
        });
      } catch (error) {
        console.error(
          `Error processing file ${key} in bucket ${bucket}`,
          error
        );
        // Update the file in DDB to be 'failed'
        await updateFileStatus({
          organizationId,
          documentId,
          fileId,
          status: 'failed',
          statusMessage: (error as Error).message,
        });
      }
    })
  );
};
