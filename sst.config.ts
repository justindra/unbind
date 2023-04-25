import { SSTConfig } from 'sst';
import { APIStack } from './stacks/api';
import { WebStack } from './stacks/web';

export default {
  config(_input) {
    return {
      name: 'unbind',
      region: 'us-west-2',
    };
  },
  stacks(app) {
    app.stack(APIStack, { id: 'api' }).stack(WebStack, { id: 'web' });
  },
} satisfies SSTConfig;
