import { loadSummarizationChain } from 'langchain/chains';
import { Document } from 'langchain/document';
import { PromptTemplate } from 'langchain/prompts';
import { OpenAI } from 'langchain/llms/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { kmeans } from 'ml-kmeans';

// Average number of words per chapter in a book is 3000 to 4000 words
// Average number of characters per chapter in a book is 15000 to 20000 characters
const MAX_CHARACTERS_PER_SUMMARY = 20000;

// Maximum number of clusters to use for clustering
const MAX_CLUSTERS = 10;

/**
 * Generate a summary given a list of documents.
 *
 * @param docs The list of documents
 * @param openAIApiKey The OpenAI API Key to use
 * @returns
 */
export async function generateSummary(
  docs: Document[],
  openAIApiKey: string,
  vectors: number[][]
) {
  const llm = new OpenAI({
    temperature: 0,
    openAIApiKey,
    modelName: 'gpt-3.5-turbo',
  });

  const characterCount = docs.reduce(
    (acc, curr) => acc + curr.pageContent.length,
    0
  );

  const numberOfClusters = Math.min(
    Math.round(characterCount / MAX_CHARACTERS_PER_SUMMARY),
    MAX_CLUSTERS
  );

  console.log(
    `characterCount: ${characterCount}, numberOfClusters: ${numberOfClusters}, numberOfDocuments: ${docs.length}`
  );

  // For smaller amounts of text, we can just use the summarization chain
  if (characterCount <= MAX_CHARACTERS_PER_SUMMARY) {
    const chain = loadSummarizationChain(llm, {
      type: 'map_reduce',
    });

    const summary = await chain.call({ input_documents: docs });

    return summary.text;
  }

  // Otherwise, we need to do some clustering to find the most relevant documents
  // before we can summarize them. This is because the summarization chain is
  // very slow and expensive to run, so we want to minimize the number of times
  // we run it.

  // Here we use the Best Vector Representation method from Greg (Data Independent)
  // https://youtu.be/qaPMdcCqtWk

  // Use k-means clustering to cluster the documents into the number of clusters
  const kmeansRes = kmeans(vectors, numberOfClusters, {
    // Random seed to keep the clustering to be more consistent
    seed: 42,
  });

  // Now we want to find the closest document to each cluster centroid
  // as we would make the assumption that the closest document to the centroid
  // is the most representative of that cluster
  const closestIndices: number[] = [];

  for (let i = 0; i < numberOfClusters; i++) {
    const distances = vectors.map((vector) => {
      const distance = Math.sqrt(
        vector.reduce(
          (sum, value, index) =>
            sum + Math.pow(value - kmeansRes.centroids[i][index], 2),
          0
        )
      );
      return distance;
    });

    const closestIndex = distances.findIndex(
      (distance) => distance === Math.min(...distances)
    );

    closestIndices.push(closestIndex);
  }

  // Sort the indices so that we can get the documents in order
  const sortedIndices = closestIndices.sort((a, b) => a - b);

  const selectedDocs = sortedIndices.map((index) => docs[index]);

  // Now, go through every document and summarize it
  const chain = loadSummarizationChain(llm, {
    type: 'stuff',
    prompt: new PromptTemplate({
      template: `You will be given a single passage of a book. This section will be enclosed in triple backticks (\`\`\`)
  Your goal is to give a summary of this section so that a reader will have a full understanding of what happened.
  Your response should be at least two paragraphs and fully encompass what was said in the passage.

  \`\`\`{text}\`\`\`
  FULL SUMMARY:`,
      inputVariables: ['text'],
    }),
  });

  const summaryList = [];

  for (let i = 0; i < selectedDocs.length; i++) {
    const summary = await chain.call({
      input_documents: [selectedDocs[i]],
    });

    summaryList.push(summary.text);

    // console.log(`Summary ${i} (chunk ${sortedIndices[i]}): ${summary.text}`);
  }

  // Now we want to summarize the summaries
  const summaries = summaryList.join('\n');
  const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 2000 });

  const summaryDocs = await textSplitter.createDocuments([summaries]);

  console.log(`summaryDocs: ${summaryDocs.length}`);

  const finalSummaryChain = loadSummarizationChain(llm, {
    type: 'map_reduce',
    combinePrompt: new PromptTemplate({
      template: `You will be given a series of summaries from a book. The summaries will be enclosed in triple backticks (\`\`\`)
  Your goal is to give a verbose summary of what the book contains.
  The reader should be able to grasp what happened in the book.

  \`\`\`{text}\`\`\`
  VERBOSE SUMMARY:`,
      inputVariables: ['text'],
    }),
  });
  try {
    const final = await finalSummaryChain.call({
      input_documents: summaryDocs,
    });

    //   console.log(`Final Summary:

    // ${final.text}`);
  } catch (error) {
    if ((error as any).isAxiosError) {
      console.log((error as any).response.data);
    } else {
      console.log((error as Error).message);
    }
  }
}
