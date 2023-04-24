import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PineconeClient } from '@pinecone-database/pinecone';
import { loadQAMapReduceChain, loadQAStuffChain } from 'langchain/chains';
import { PDFLoader } from 'langchain/document_loaders';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { OpenAI } from 'langchain/llms/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { Bucket } from 'sst/node/bucket';
import { Config } from 'sst/node/config';
import streamToBlob from 'stream-to-blob';

const OPENAI_API_KEY = Config.OPENAI_API_KEY;
const PINECONE_API_KEY = Config.PINECONE_API_KEY;
const PINECONE_ENV = Config.PINECONE_ENV;
const PINECONE_INDEX = Config.PINECONE_INDEX;

const client = new S3Client({});

const getObject = async (key: string) => {
  const params = {
    Bucket: Bucket.documents.bucketName,
    Key: key,
  };
  const data = await client.send(new GetObjectCommand(params));
  return data;
};

async function loadEmbeddingsFromFile(key: string) {
  // Get document from S3
  const s3Object = await getObject(key);
  const document = await streamToBlob(s3Object.Body, s3Object.ContentType);

  console.log(document);

  const loader = new PDFLoader(document);

  const data = await loader.load();
  console.log(`You have ${data.length} documents!`);
  console.log(
    `There are ${data[0].pageContent.length} characters in the first document!`
  );

  const textSplitter = new RecursiveCharacterTextSplitter({});

  const texts = await textSplitter.splitDocuments(data);

  console.log(`You have ${texts.length} texts!`);

  console.log(texts[0].metadata);
  console.log(texts[0].pageContent);

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: OPENAI_API_KEY,
  });

  const client = new PineconeClient();
  await client.init({
    apiKey: PINECONE_API_KEY,
    environment: PINECONE_ENV,
  });
  const pineconeIndex = client.Index(PINECONE_INDEX);

  await PineconeStore.fromDocuments(texts, embeddings, {
    pineconeIndex,
    namespace: key,
  });

  console.log('Document loaded...');
}

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
    namespace: key,
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
