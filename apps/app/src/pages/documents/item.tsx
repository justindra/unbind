import { AppPageTitle, Button } from '@jfsi/react';
import React from 'react';
import { trpc } from '../../utils/trpc';
import { getQueryKey } from '@trpc/react-query';
import { trpcClient } from '../app-root';
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
import { SendMessage } from '../../components/chat/send-message';

export const DocumentItemPage: React.FC = () => {
  const { documents, files } = useLoaderData() as ReturnType<
    typeof documentItemPageLoader
  >;
  const doc = documents[0];
  return (
    <div className='flex flex-col h-full'>
      <AppPageTitle>
        <div className='flex justify-between items-center'>
          <div className='flex items-center'>
            {doc.name || 'Untitled Document'}
            <DocumentStatusBadge className='ml-2' status={doc.status} />
          </div>
          <div>
            <Button startIcon={PencilIcon as any} disabled>
              Edit
            </Button>
          </div>
        </div>
      </AppPageTitle>
      <div className='flex gap-4 flex-1'>
        {/* Chat Card */}
        <Card className='flex-1'>
          <SendMessage />
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

export const documentItemPageLoader: LoaderFunction = ({
  params: { documentId },
}): any => {
  const key = getQueryKey(trpc.get_document_by_id, { documentId });
  return trpcClient.query(key[0].join('.') as never, key[1]?.input as any);
};
