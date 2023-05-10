import { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { PDFLoader } from 'langchain/document_loaders';
import streamToBlob from 'stream-to-blob';

/**
 * Load a document from S3 and return it as a LangChain Document.
 *
 * For now it just supports PDFs, but eventually we can support other types of
 * documents.
 * @param s3Object  The S3 Object to parse
 * @returns
 */
export async function loadDocumentFromS3Object(
  s3Object: GetObjectCommandOutput
) {
  const file = await streamToBlob(s3Object.Body, s3Object.ContentType);
  const loader = new PDFLoader(file);

  return loader.load();
}
