import { StackContext, StaticSite, use } from 'sst/constructs';
import { APIStack } from './api';

export function WebStack({ app, stack }: StackContext) {
  const { auth } = use(APIStack);
  const appSite = new StaticSite(stack, 'app', {
    path: 'apps/app',
    buildOutput: 'dist',
    buildCommand: 'npm run build',
    environment: {
      //   VITE_API_ENDPOINT: api.customDomainUrl || api.url,
      VITE_AUTH_ENDPOINT: auth.url,
      //   VITE_APP_ENDPOINT: isProduction(app.stage)
      //     ? DomainUtils.getWebUrl(app)
      //     : 'http://localhost:5173',
    },
    // customDomain: {
    //   domainName: DomainUtils.getWebDomain(app),
    //   hostedZone: HOSTED_ZONE,
    // },
  });

  stack.addOutputs({
    AppSiteEndpoint:
      appSite.customDomainUrl || appSite.url || 'http://localhost:5173',
  });
}
