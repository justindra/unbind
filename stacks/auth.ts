import { Config, StackContext, use } from 'sst/constructs';
import { Auth } from 'sst/constructs/future';
import { DataStack } from './data';
import { DomainUtils, HOSTED_ZONE } from './constants';

export function AuthStack({ app, stack }: StackContext) {
  const { table } = use(DataStack);

  const google = Config.Secret.create(stack, 'GOOGLE_CLIENT_ID');
  const github = Config.Secret.create(
    stack,
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET'
  );
  // const facebook = Config.Secret.create(
  //   stack,
  //   'FACEBOOK_APP_ID',
  //   'FACEBOOK_APP_SECRET'
  // );

  const auth = new Auth(stack, 'auth', {
    authenticator: {
      handler: 'packages/functions/src/auth.handler',
      bind: [
        table,
        google.GOOGLE_CLIENT_ID,
        github.GITHUB_CLIENT_ID,
        github.GITHUB_CLIENT_SECRET,
        // facebook.FACEBOOK_APP_ID,
        // facebook.FACEBOOK_APP_SECRET,
      ],
    },
    customDomain: {
      domainName: DomainUtils.getWebDomain(app, 'auth'),
      hostedZone: HOSTED_ZONE,
    },
  });

  stack.addOutputs({ AuthEndpoint: auth.url });

  return { auth };
}
