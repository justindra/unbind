import React from 'react';
import { trpc } from '../../utils/trpc';
import { Empty } from '@jfsi/react';
import { DocumentIcon } from '@heroicons/react/24/outline';
import { DocumentUploadButton } from '../../components/document-upload-modal';

export const DocumentsHomePage: React.FC = () => {
  const { data, isLoading } = trpc.list_documents.useQuery();
  if (isLoading) return null;
  console.log(data);

  if (!data || !data.length) {
    return (
      <Empty
        title='No documents found'
        icon={DocumentIcon as any}
        description='Get started by uploading your first document.'
        actions={<DocumentUploadButton />}
      />
    );
  }

  return <div className='h-screen'>Documents Home Page</div>;
};
