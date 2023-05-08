import { generateDefaultTableOptions } from 'jfsi/constructs';
import { Bucket, Config, EventBus, StackContext, Table } from 'sst/constructs';

export function DataStack({ app, stack }: StackContext) {
  // The DDB table that stores all the data
  const table = new Table(stack, 'table', generateDefaultTableOptions(app, 1));
  // The S3 bucket that stores all the files
  const filesBucket = new Bucket(stack, 'files', {
    cors: [
      // Allow to upload file from the frontend
      // TODO: set the origin to not be 'localhost'
      {
        allowedMethods: ['PUT'],
        allowedOrigins: ['http://localhost:5173'],
        allowedHeaders: ['*'],
      },
    ],
  });

  const eventBus = new EventBus(stack, 'event-bus', {});

  const pinecone = Config.Secret.create(
    stack,
    'PINECONE_API_KEY',
    'PINECONE_ENV',
    'PINECONE_INDEX'
  );

  filesBucket.addNotifications(stack, {
    fileUploaded: {
      function: {
        handler: 'packages/functions/src/file-uploaded.handler',
        bind: [
          table,
          filesBucket,
          pinecone.PINECONE_API_KEY,
          pinecone.PINECONE_ENV,
          pinecone.PINECONE_INDEX,
          eventBus,
        ],
      },
      events: ['object_created'],
    },
  });

  return { table, filesBucket, eventBus };
}
