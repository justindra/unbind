import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  getFile,
  getMetadataFromS3Key,
  updateFileAfterProcessing,
  updateFileStatus,
} from '@unbind/core/documents';
import { loadEmbeddingsFromS3Object } from '@unbind/core/analysis';
import { S3Handler } from 'aws-lambda';
import { getOpenAIKey } from '@unbind/core/organizations';

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
  console.log(event);

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

        const openAIApiKey = await getOpenAIKey(organizationId);
        if (!openAIApiKey) {
          throw new Error(
            `No OpenAI API key found for organization ${organizationId}`
          );
        }

        const res = await Promise.all([
          // Analyze the file and save embeddings to Pinecone
          loadEmbeddingsFromS3Object(s3Object, {
            organizationId,
            documentId,
            fileId,
            openAIApiKey,
          }),
          // TODO: Analyze the file to have a summary of the file
        ]);

        // Update the file in DDB with all the new details that we have analyzed
        await updateFileAfterProcessing({
          organizationId,
          documentId,
          fileId,
          pageCount: res[0].pageCount,
          size: s3Object.ContentLength || 0,
          summary: '',
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
