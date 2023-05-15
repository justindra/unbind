import { PineconeClient } from '@pinecone-database/pinecone';
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { Config } from 'sst/node/config';

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
  { organizationId }: Pick<FileDetails, 'organizationId'>
) {
  await pcClient.init({
    apiKey: Config.PINECONE_API_KEY,
    environment: Config.PINECONE_ENV,
  });
  const pineconeIndex = pcClient.Index(Config.PINECONE_INDEX);

  const store = new PineconeStore(embeddings, {
    pineconeIndex,
    namespace: organizationId,
  });

  await store.addVectors(vectors, documents);
}
