import { EntityItem } from 'electrodb';
import { generateOrganizationEntityDetails } from 'jfsi/node/entities';
import { Configuration } from './dynamo';
import { Users } from './users';

export const Organizations = generateOrganizationEntityDetails(
  Configuration,
  { version: '1', service: 'unbind' },
  Users
);

export type Info = EntityItem<typeof Organizations.OrganizationEntity>;
