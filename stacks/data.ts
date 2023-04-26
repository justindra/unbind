import { generateDefaultTableOptions } from 'jfsi/constructs';
import { Bucket, StackContext, Table } from 'sst/constructs';

export function DataStack({ app, stack }: StackContext) {
  // The DDB table that stores all the data
  const table = new Table(stack, 'table', generateDefaultTableOptions(app, 1));
  // The S3 bucket that stores all the files
  const filesBucket = new Bucket(stack, 'files');

  return { table, filesBucket };
}
