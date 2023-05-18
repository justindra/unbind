import { PineconeClient } from '@pinecone-database/pinecone';
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PineconeStore } from 'langchain/vectorstores/pinecone';

const pcClient = new PineconeClient();

type FileDetails = {
  organizationId: string;
  documentId: string;
  fileId: string;
  openAIApiKey: string;
  filename: string;
};

export async function generateEmbeddingsAndDocuments(
  documents: Document[],
  { fileId, documentId, filename, openAIApiKey }: FileDetails
) {
  const pageCount = documents.length;
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 2000,
  });

  const texts = (await textSplitter.splitDocuments(documents)).map(
    (text) =>
      ({
        ...text,
        metadata: {
          ...text.metadata,
          fileId,
          documentId,
          filename,
        },
      } as Document)
  );
  const embeddings = new OpenAIEmbeddings({ openAIApiKey });

  const vectors = await embeddings.embedDocuments(
    texts.map((t) => t.pageContent)
  );

  return { embeddings, vectors, documents: texts, pageCount };
}

export async function saveEmbeddings(
  embeddings: OpenAIEmbeddings,
  vectors: number[][],
  documents: Document[],
  {
    organizationId,
    pineconeApiKey,
    pineconeEnvironment,
    pineconeIndex,
  }: Pick<FileDetails, 'organizationId'> & {
    pineconeApiKey: string;
    pineconeEnvironment: string;
    pineconeIndex: string;
  }
) {
  await pcClient.init({
    apiKey: pineconeApiKey,
    environment: pineconeEnvironment,
  });
  const pcIndex = pcClient.Index(pineconeIndex);

  const store = new PineconeStore(embeddings, {
    pineconeIndex: pcIndex,
    namespace: organizationId,
  });

  await store.addVectors(vectors, documents);
}
