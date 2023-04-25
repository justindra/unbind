import {
  StackContext,
  Api,
  Function,
  Bucket,
  Config,
  Table,
} from 'sst/constructs';
import { Auth } from 'sst/constructs/future';
import { generateDefaultTableOptions } from 'jfsi/constructs';

export function APIStack({ app, stack }: StackContext) {
  const api = new Api(stack, 'api', {
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

  const openAI = Config.Secret.create(stack, 'OPENAI_API_KEY');
  const pinecone = Config.Secret.create(
    stack,
    'PINECONE_API_KEY',
    'PINECONE_ENV',
    'PINECONE_INDEX'
  );
  const google = Config.Secret.create(stack, 'GOOGLE_CLIENT_ID');
  const facebook = Config.Secret.create(
    stack,
    'FACEBOOK_APP_ID',
    'FACEBOOK_APP_SECRET'
  );

  const table = new Table(stack, 'table', generateDefaultTableOptions(app, 1));

  const auth = new Auth(stack, 'auth', {
    authenticator: {
      handler: 'packages/functions/src/auth.handler',
      bind: [
        google.GOOGLE_CLIENT_ID,
        // facebook.FACEBOOK_APP_ID,
        // facebook.FACEBOOK_APP_SECRET,
        table,
      ],
    },
    // customDomain: {
    //   domainName: DomainUtils.getWebDomain(app, 'auth'),
    //   hostedZone: HOSTED_ZONE,
    // },
  });

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
    AuthEndpoint: auth.url,
    // ApiEndpoint: api.url,
  });

  return {
    auth,
    api,
  };
}
