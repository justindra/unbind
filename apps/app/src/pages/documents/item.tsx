import { AppPageTitle, AuthUtils, Button, Empty } from '@jfsi/react';
import React, { useState } from 'react';
import { queryClient, trpc, trpcClient } from '../../utils/trpc';
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
import {
  ChatBubbleLeftRightIcon,
  DocumentIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { useInterval } from '../../utils/hooks';
import { ChatWindow } from '../../components/chat/window';

const CreateNewChatButton: React.FC<{ documentId: string }> = ({
  documentId,
}) => {
  const [loading, setLoading] = useState(false);
  const { mutate } = trpc.create_chat.useMutation({
    onSettled() {
      setLoading(false);
    },
    onSuccess(data) {
      const key = getQueryKey(trpc.get_document_by_id, { documentId }, 'query');
      queryClient.setQueryData(key, (oldData: any) => {
        console.log(oldData, data);
        return {
          ...oldData,
          chats: [...(oldData?.chats ?? []), data],
        };
      });
    },
  });

  const handleCreateChat = () => {
    setLoading(true);
    mutate({ documentId });
  };
  return (
    <Button
      variant='primary'
      startIcon={ChatBubbleLeftRightIcon}
      onClick={handleCreateChat}
      loading={loading}>
      Start Chat
    </Button>
  );
};

export const DocumentItemPage: React.FC = () => {
  const {
    documentId,
    query: { documents, files, chats },
  } = useLoaderData() as ReturnType<typeof documentItemPageLoader>;
  const doc = documents?.[0];
  const { data, refetch } = trpc.get_document_by_id.useQuery(
    { documentId },
    { enabled: false }
  );

  const documentToUse = data?.documents?.[0] || doc;

  // Keep refetching until the document is no longer processing
  useInterval(
    () => {
      refetch();
    },
    ['created', 'processing'].includes(documentToUse.status) ? 5000 : null
  );

  const chatId = chats?.[0]?.chatId || data?.chats?.[0]?.chatId;
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
          {['created', 'processing'].includes(documentToUse.status) && (
            <Empty
              title='Document Processing...'
              description='Your document is currently being processed. Depending on the size, it may take a few minutes before it will be ready.'
              icon={DocumentIcon}
            />
          )}
          {documentToUse.status === 'failed' && (
            <Empty
              title='Document Processing Failed'
              description='Your document failed to process. Please try again. If the problem persists, please contact support.'
              icon={DocumentIcon}
            />
          )}
          {documentToUse.status === 'ready' ? (
            chatId ? (
              <ChatWindow
                chatId={chatId}
                documentId={documentToUse.documentId}
              />
            ) : (
              <Empty
                title='Document Ready'
                description='Your document is now ready to be queried. Start a chat to get started.'
                icon={DocumentIcon}
                actions={
                  <CreateNewChatButton documentId={documentToUse.documentId} />
                }
              />
            )
          ) : null}
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
