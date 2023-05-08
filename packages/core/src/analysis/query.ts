import { PineconeClient } from '@pinecone-database/pinecone';
import {
  ConversationalRetrievalQAChain,
  loadQAMapReduceChain,
} from 'langchain/chains';
import { OpenAI } from 'langchain/llms/openai';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { Config } from 'sst/node/config';
import { zod } from '../zod';
import { z } from 'zod';
import { zMessage } from '../entities/chats/functions';
import { CHAT_MESSAGE_ROLE, ChatMessageRole } from '../entities/chats/base';
import type { Document } from 'langchain/document';

const zCallbackFn = z
  .function()
  .args(z.string(), z.string(), z.string().optional())
  .returns(z.void())
  .optional();

const setMessageFromContent = zod(
  z.object({
    content: z.string(),
    role: z.enum(CHAT_MESSAGE_ROLE).default('assistant'),
    timestamp: z.string().default(new Date().toISOString()),
    resources: z.array(z.string()).optional(),
  }),
  ({ content, role, timestamp, resources }) => ({
    content,
    role: role as ChatMessageRole,
    timestamp,
    resources,
  })
);

/**
 * Get a vector store for a given document so that we can use it to query for
 * the embeddings.
 */
const getVectorStore = zod(
  z.object({
    openAIApiKey: z.string(),
    organizationId: z.string(),
    documentId: z.string(),
  }),
  async ({ openAIApiKey, organizationId, documentId }) => {
    const embeddings = new OpenAIEmbeddings({ openAIApiKey });

    const client = new PineconeClient();
    await client.init({
      apiKey: Config.PINECONE_API_KEY,
      environment: Config.PINECONE_ENV,
    });
    const pineconeIndex = client.Index(Config.PINECONE_INDEX);

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      namespace: organizationId,
      filter: { documentId },
    });

    return vectorStore;
  }
);

/**
 * Query a given document with a message
 */
export const queryDocument = zod(
  z.object({
    /** The id of the organization */
    organizationId: z.string(),
    /** The id of the document */
    documentId: z.string(),
    /** The query to use */
    query: z.string(),
    /** The OpenAI API Key to use */
    openAIApiKey: z.string(),
    /** Callback to use when streaming results */
    callback: zCallbackFn,
    /** The timestamp to use for the query */
    timestamp: z.string().optional(),
  }),
  async ({
    organizationId,
    documentId,
    query,
    openAIApiKey,
    callback,
    timestamp,
  }) => {
    const streamResults = !!callback;

    const vectorStore = await getVectorStore({
      openAIApiKey,
      organizationId,
      documentId,
    });

    const relevantDocs = await vectorStore.similaritySearch(query, 4);

    const llm = new OpenAI({
      temperature: 0,
      openAIApiKey,
      streaming: streamResults,
    });
    const chain = loadQAMapReduceChain(llm);
    const res = await chain.call(
      {
        input_documents: relevantDocs,
        question: query,
      },
      streamResults ? [{ handleLLMNewToken: callback }] : undefined
    );

    const content = (res?.text?.trim() as string) || '';

    return {
      text: content,
      messages: [
        setMessageFromContent({ content: query, role: 'user', timestamp }),
        setMessageFromContent({
          content,
          resources: relevantDocs.map((val) => JSON.stringify(val.metadata)),
        }),
      ],
    };
  }
);

/**
 * Query a given document with a message, including a chat history. So that it
 * can reference the chat history when answering the question.
 */
export const queryDocumentChat = zod(
  z.object({
    /** The id of the organization */
    organizationId: z.string(),
    /** The id of the document */
    documentId: z.string(),
    chatHistory: z.array(zMessage),
    /** The query to use */
    query: z.string(),
    /** The OpenAI API Key to use */
    openAIApiKey: z.string(),
    /** Callback to use when streaming results */
    callback: zCallbackFn,
    /** The timestamp to use for the query */
    timestamp: z.string().optional(),
  }),
  async ({
    organizationId,
    documentId,
    query,
    openAIApiKey,
    callback,
    chatHistory,
    timestamp,
  }) => {
    // No chat history, let's just use the basic document query for now
    if (!chatHistory.length)
      return queryDocument({
        organizationId,
        documentId,
        query,
        openAIApiKey,
        callback,
        timestamp,
      });
    const streamResults = !!callback;

    const vectorStore = await getVectorStore({
      openAIApiKey,
      organizationId,
      documentId,
    });

    const llm = new OpenAI({
      temperature: 0,
      openAIApiKey,
      streaming: streamResults,
    });

    const chain = ConversationalRetrievalQAChain.fromLLM(
      llm,
      vectorStore.asRetriever(),
      { returnSourceDocuments: true }
    );

    // Because this current chain calls the LLM multiple times, we want to make
    // sure that we are just streaming the last result that was asked
    let actualResultRunId: string | null = null;

    const res = await chain.call(
      {
        question: query,
        chat_history: chatHistory
          .map((val) => ` - ${val.role}: ${val.content}`)
          .join('\n'),
      },
      streamResults
        ? [
            {
              handleLLMNewToken: (token, runId, parentRunId) => {
                // Only call the callback when we are on that last prompt
                if (runId === actualResultRunId) {
                  callback(token, runId, parentRunId);
                }
              },
              handleLLMStart: (_llm, prompts, runId) => {
                // Super crude way of finding the last prompt, we can probably
                // make this a bit better at some point.
                const isLastPrompt = prompts.find((val) =>
                  val.startsWith(
                    'Use the following pieces of context to answer the question at the end.'
                  )
                );
                if (isLastPrompt) {
                  actualResultRunId = runId;
                }
              },
            },
          ]
        : undefined
    );

    const content = (res?.text?.trim() as string) || '';

    return {
      text: content,
      messages: [
        ...chatHistory,
        setMessageFromContent({ content: query, role: 'user', timestamp }),
        setMessageFromContent({
          content,
          role: 'assistant',
          resources: res?.sourceDocuments?.map((val: Document) =>
            JSON.stringify(val.metadata)
          ),
        }),
      ],
    };
  }
);
