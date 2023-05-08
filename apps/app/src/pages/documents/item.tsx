import { AppPageTitle, AuthUtils, Button } from '@jfsi/react';
import React from 'react';
import { trpc, trpcClient } from '../../utils/trpc';
import { getQueryKey } from '@trpc/react-query';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import { Card } from '../../components/card';
import { DescriptionList } from '../../components/description-list';
import {
  DocumentStatusBadge,
  fileStatusToVariant,
} from '../../components/documents/badge';
import { FileList } from '../../components/file-list';
import humanFormat from 'human-format';
import { PencilIcon } from '@heroicons/react/24/outline';
import { useInterval } from '../../utils/hooks';
import { ChatWindow } from '../../components/chat/window';

export const DocumentItemPage: React.FC = () => {
  const mutation = trpc.send_message.useMutation();
  const {
    documentId,
    query: { documents, files, chats },
    userId,
  } = useLoaderData() as ReturnType<typeof documentItemPageLoader>;
  const doc = documents[0];
  const { data, refetch } = trpc.get_document_by_id.useQuery(
    { documentId },
    { enabled: false }
  );

  const documentToUse = data?.documents[0] || doc;

  // Keep refetching until the document is no longer processing
  useInterval(
    () => {
      refetch();
    },
    ['created', 'processing'].includes(documentToUse.status) ? 5000 : null
  );

  // TODO: If created or processing, show a loading indicator

  // TODO: If failed, show message and what to do next
  return (
    <div className='flex flex-col h-full'>
      <AppPageTitle>
        <div className='flex justify-between items-center'>
          <div className='flex items-center'>
            {documentToUse.name || 'Untitled Document'}
            <DocumentStatusBadge
              className='ml-2'
              status={documentToUse.status}
            />
          </div>
          <div>
            <Button startIcon={PencilIcon as any} disabled>
              Edit
            </Button>
          </div>
        </div>
      </AppPageTitle>
      <div className='flex gap-4 flex-1 h-[calc(100%_-_36px)]'>
        {/* Chat Card */}
        <Card className='flex-1 flex flex-col'>
          <ChatWindow chatId={chats?.[0].chatId} />
          {/* <div className='flex-1'>hello</div>
          <div className='border-b-2'></div>
          <SendMessage onSendMessage={handleSendMessage} /> */}
        </Card>
        {/* Information Card */}
        <div className='hidden lg:block w-96 '>
          <Card className='p-3'>
            <DescriptionList
              items={[
                {
                  label: 'Files',
                  value: (
                    <FileList
                      files={files.map((file: any) => ({
                        name: file.filename,
                        description: `${
                          file.pageCount || 0
                        } page(s) - ${humanFormat.bytes(file.size_bytes || 0)}`,
                        status: (fileStatusToVariant as any)[file.status],
                      }))}
                    />
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export const documentItemPageLoader: LoaderFunction = async ({
  params: { documentId },
}): Promise<any> => {
  const user = AuthUtils.getUser();
  const key = getQueryKey(trpc.get_document_by_id, { documentId });
  return {
    documentId,
    query: await trpcClient.query(
      key[0].join('.') as never,
      key[1]?.input as any
    ),
    userId: user?.userId,
  };
};
