import { loadSummarizationChain } from 'langchain/chains';
import { Document } from 'langchain/document';
import { OpenAI } from 'langchain/llms/openai';

/**
 * Generate a summary given a list of documents.
 *
 * @param docs The list of documents
 * @param openAIApiKey The OpenAI API Key to use
 * @returns
 */
export async function generateSummary(docs: Document[], openAIApiKey: string) {
  const llm = new OpenAI({
    temperature: 0,
    openAIApiKey,
    modelName: 'gpt-3.5-turbo',
  });

  // TODO: Should probably do something else when the number of characters or documents is too large
  // look at the kmeans stuff that Greg has in his YouTube video
  const chain = loadSummarizationChain(llm, {
    type: 'map_reduce',
  });

  const summary = await chain.call({
    input_documents: docs,
  });

  return summary.text;
}
