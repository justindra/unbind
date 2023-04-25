import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { EntityConfiguration } from 'electrodb';
import { Table } from 'sst/node/table';

export const Client = new DynamoDBClient({
  region: process.env.MODE === 'test' ? 'us-west-2' : undefined,
});

export const Configuration: EntityConfiguration = {
  table: Table.table.tableName,
  client: Client,
};
