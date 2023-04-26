import { StackContext, Api, Config, use } from 'sst/constructs';
import { DataStack } from './data';
import { AuthStack } from './auth';

export function APIStack({ app, stack }: StackContext) {
  const { table, filesBucket } = use(DataStack);
  const { auth } = use(AuthStack);

  // const openAI = Config.Secret.create(stack, 'OPENAI_API_KEY');
  // const pinecone = Config.Secret.create(
  //   stack,
  //   'PINECONE_API_KEY',
  //   'PINECONE_ENV',
  //   'PINECONE_INDEX'
  // );

  // new Function(stack, 'TestFunction', {
  //   handler: 'packages/functions/src/test.handler',
  //   bind: [
  //     openAI.OPENAI_API_KEY,
  //     pinecone.PINECONE_API_KEY,
  //     pinecone.PINECONE_ENV,
  //     pinecone.PINECONE_INDEX,
  //   ],
  // });

  const api = new Api(stack, 'api', {
    defaults: {
      function: {
        bind: [table, auth, filesBucket],
      },
    },
    routes: {
      'GET /{proxy+}': {
        function: {
          handler: 'packages/functions/src/trpc.handler',
          bind: [],
        },
      },
      'POST /{proxy+}': {
        function: {
          handler: 'packages/functions/src/trpc.handler',
          bind: [],
        },
      },
    },
  });

  return {
    api,
  };
}
