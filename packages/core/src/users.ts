import { EntityItem } from 'electrodb';
import { generateUserEntityDetails } from 'jfsi/node/entities';
import { Configuration } from './dynamo';

export const Users = generateUserEntityDetails(Configuration, {
  version: '1',
  service: 'unbind',
});

export type Info = EntityItem<typeof Users.UserEntity>;

export type UserAuthInfo = EntityItem<typeof Users.UserAuthEntity>;
