import { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { PineconeClient } from '@pinecone-database/pinecone';
import { PDFLoader } from 'langchain/document_loaders';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { Config } from 'sst/node/config';
import streamToBlob from 'stream-to-blob';

const pcClient = new PineconeClient();

type FileDetails = {
  organizationId: string;
  documentId: string;
  fileId: string;
  openAIApiKey: string;
};

/**
 * Load the vector embeddings from a file and store them in Pinecone so that
 * it can be used to search for similar documents.
 * @returns
 */
export async function loadEmbeddingsFromS3Object(
  s3Object: GetObjectCommandOutput,
  { organizationId, documentId, fileId, openAIApiKey }: FileDetails
) {
  const file = await streamToBlob(s3Object.Body, s3Object.ContentType);
  const loader = new PDFLoader(file);

  const data = await loader.load();
  const pageCount = data.length;

  const textSplitter = new RecursiveCharacterTextSplitter({});

  const texts = (await textSplitter.splitDocuments(data)).map((text, i) => ({
    ...text,
    metadata: {
      ...text.metadata,
      fileId,
    },
  }));

  const embeddings = new OpenAIEmbeddings({ openAIApiKey });

  await pcClient.init({
    apiKey: Config.PINECONE_API_KEY,
    environment: Config.PINECONE_ENV,
  });
  const pineconeIndex = pcClient.Index(Config.PINECONE_INDEX);

  await PineconeStore.fromDocuments(texts, embeddings, {
    pineconeIndex,
    namespace: documentId,
  });

  return { pageCount };
}
