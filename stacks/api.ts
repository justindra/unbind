import { StackContext, Api, Function, Bucket, Config } from 'sst/constructs';

export function APIStack({ stack }: StackContext) {
  // const api = new Api(stack, 'api', {
  //   routes: {
  //     'GET /': 'packages/functions/src/lambda.handler',
  //   },
  // });

  const openAI = Config.Secret.create(stack, 'OPENAI_API_KEY');
  const pinecone = Config.Secret.create(
    stack,
    'PINECONE_API_KEY',
    'PINECONE_ENV',
    'PINECONE_INDEX'
  );

  const documentBucket = new Bucket(stack, 'documents');

  new Function(stack, 'TestFunction', {
    handler: 'packages/functions/src/test.handler',
    bind: [
      documentBucket,
      openAI.OPENAI_API_KEY,
      pinecone.PINECONE_API_KEY,
      pinecone.PINECONE_ENV,
      pinecone.PINECONE_INDEX,
    ],
  });

  stack.addOutputs({
    // ApiEndpoint: api.url,
  });
}
