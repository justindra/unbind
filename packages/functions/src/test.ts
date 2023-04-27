import { PineconeClient } from '@pinecone-database/pinecone';
import { loadQAMapReduceChain } from 'langchain/chains';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { OpenAI } from 'langchain/llms/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { Config } from 'sst/node/config';

const OPENAI_API_KEY = Config.OPENAI_API_KEY;
const PINECONE_API_KEY = Config.PINECONE_API_KEY;
const PINECONE_ENV = Config.PINECONE_ENV;
const PINECONE_INDEX = Config.PINECONE_INDEX;

async function queryDocument(key: string, query: string) {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: OPENAI_API_KEY,
  });

  const client = new PineconeClient();
  await client.init({
    apiKey: PINECONE_API_KEY,
    environment: PINECONE_ENV,
  });
  const pineconeIndex = client.Index(PINECONE_INDEX);

  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    namespace: key, // organizationId
    filter: { documentId: '' },
  });

  const relevantDocs = await vectorStore.similaritySearch(query, 5);

  console.log(`Found ${relevantDocs.length} relevant documents!`);

  //   console.log(relevantDocs.map((val) => val.metadata));

  const llm = new OpenAI({
    temperature: 0,
    openAIApiKey: OPENAI_API_KEY,
  });
  const chain = loadQAMapReduceChain(llm);
  const res = await chain.call({
    input_documents: relevantDocs,
    question: query,
  });
  return res;
}

export const handler = async () => {
  const res = await queryDocument(
    'namespace-here',
    'Should I create multiple tables?'
  );
  console.log(res);
};
