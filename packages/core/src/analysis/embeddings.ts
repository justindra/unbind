import { PineconeClient } from '@pinecone-database/pinecone';
import { loadSummarizationChain } from 'langchain/chains';
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { OpenAI } from 'langchain/llms/openai';
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

/**
 * Load the vector embeddings from a file and store them in Pinecone so that
 * it can be used to search for similar documents.
 */
export async function loadEmbeddingsFromDocuments(
  documents: Document[],
  { organizationId, documentId, fileId, openAIApiKey, filename }: FileDetails
) {
  const pageCount = documents.length;

  const textSplitter = new RecursiveCharacterTextSplitter({});

  const texts = (await textSplitter.splitDocuments(documents)).map(
    (text, i) => ({
      ...text,
      metadata: {
        ...text.metadata,
        fileId,
        documentId,
        filename,
      },
    })
  );

  const embeddings = new OpenAIEmbeddings({ openAIApiKey });

  await pcClient.init({
    apiKey: Config.PINECONE_API_KEY,
    environment: Config.PINECONE_ENV,
  });
  const pineconeIndex = pcClient.Index(Config.PINECONE_INDEX);

  await PineconeStore.fromDocuments(texts, embeddings, {
    pineconeIndex,
    namespace: organizationId,
  });

  return { pageCount };
}
