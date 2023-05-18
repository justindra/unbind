import { SSTConfig } from 'sst';
import { APIStack } from './stacks/api';
import { WebStack } from './stacks/web';
import { DataStack } from './stacks/data';
import { AuthStack } from './stacks/auth';

export default {
  config(_input) {
    return {
      profile: 'unbind',
      name: 'unbind',
      region: 'us-west-2',
    };
  },
  stacks(app) {
    app.setDefaultFunctionProps({
      runtime: 'nodejs18.x',
    });

    app
      .stack(DataStack, { id: 'data' })
      .stack(AuthStack, { id: 'auth' })
      .stack(APIStack, { id: 'api' })
      .stack(WebStack, { id: 'web' });
  },
} satisfies SSTConfig;
