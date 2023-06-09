import { isProduction } from 'jfsi/constructs';
import { StackContext, StaticSite, use } from 'sst/constructs';
import { APIStack } from './api';
import { AuthStack } from './auth';
import { DomainUtils, HOSTED_ZONE } from './constants';

export function WebStack({ app, stack }: StackContext) {
  const { api, ws } = use(APIStack);
  const { auth } = use(AuthStack);

  const appSite = new StaticSite(stack, 'app', {
    path: 'apps/app',
    buildOutput: 'dist',
    buildCommand: 'npm run build',
    environment: {
      VITE_API_ENDPOINT: api.customDomainUrl || api.url,
      VITE_AUTH_ENDPOINT: auth.url,
      VITE_WS_ENDPOINT: ws.customDomainUrl || ws.url,
      VITE_APP_ENDPOINT: isProduction(app.stage)
        ? DomainUtils.getWebUrl(app, 'app')
        : 'http://localhost:5173',
    },
    customDomain: {
      domainName: DomainUtils.getWebDomain(app, 'app'),
      hostedZone: HOSTED_ZONE,
    },
  });

  const landingPage = new StaticSite(stack, 'landing-page', {
    path: 'apps/landing-page',
    buildOutput: 'dist',
    buildCommand: 'npm run build',
    environment: {
      VITE_API_ENDPOINT: api.customDomainUrl || api.url,
      VITE_AUTH_ENDPOINT: auth.url,
      VITE_APP_ENDPOINT:
        appSite.customDomainUrl || appSite.url || 'http://localhost:5173',
      PUBLIC_STAGE: app.stage,
      PUBLIC_SITE_DOMAIN: DomainUtils.getWebDomain(app),
    },
    customDomain: {
      domainName: DomainUtils.getWebDomain(app),
      hostedZone: HOSTED_ZONE,
    },
  });

  stack.addOutputs({
    AppSiteEndpoint:
      appSite.customDomainUrl || appSite.url || 'http://localhost:5173',
    LandingPageEndpoint:
      landingPage.customDomainUrl || landingPage.url || 'http://localhost:3000',
  });
}
