import { SSTConfig } from 'sst';
import { APIStack } from './stacks/api';

export default {
  config(_input) {
    return {
      name: 'unbind',
      region: 'us-west-2',
    };
  },
  stacks(app) {
    app.stack(APIStack, { id: 'api' });
  },
} satisfies SSTConfig;
