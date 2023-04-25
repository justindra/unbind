import { EntityItem } from 'electrodb';
import { generateUserEntityDetails } from 'jfsi/node/entities';
import { Configuration } from './dynamo';
import { zod } from './zod';
import { z } from 'zod';

const UsersBase = generateUserEntityDetails(Configuration, {
  version: '1',
  service: 'unbind',
});

export type Info = EntityItem<typeof UsersBase.UserEntity>;

export type UserAuthInfo = EntityItem<typeof UsersBase.UserAuthEntity>;

export const getUserById = zod(z.string(), async (userId: string) => {
  return UsersBase.getUserById(userId);
});

export const Users = {
  ...UsersBase,
  getUserById,
};
