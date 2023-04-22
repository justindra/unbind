import { StackContext, Api, Function, Bucket } from 'sst/constructs';

export function APIStack({ stack }: StackContext) {
  // const api = new Api(stack, 'api', {
  //   routes: {
  //     'GET /': 'packages/functions/src/lambda.handler',
  //   },
  // });

  const documentBucket = new Bucket(stack, 'documents');

  new Function(stack, 'TestFunction', {
    handler: 'packages/functions/src/test.handler',
    bind: [documentBucket],
  });

  stack.addOutputs({
    // ApiEndpoint: api.url,
  });
}
