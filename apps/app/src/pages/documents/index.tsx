import React from 'react';
import { trpc } from '../../utils/trpc';
import { AppPageTitle, Empty } from '@jfsi/react';
import { DocumentIcon } from '@heroicons/react/24/outline';
import { DocumentUploadButton } from '../../components/document-upload-modal';
import { DocumentList } from '../../components/documents/list';

export const DocumentsHomePage: React.FC = () => {
  const { data, isLoading } = trpc.list_documents.useQuery();
  if (isLoading) return null;

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

  return (
    <div className='flex flex-col h-full max-w-6xl mx-auto'>
      <AppPageTitle>
        <div className='flex'>
          <span className='flex-1'>Documents</span>
          <DocumentUploadButton />
        </div>
      </AppPageTitle>
      <DocumentList className='overflow-y-auto' documents={data} />
      {/* Sort of like a hack so that the document list stays small but will fill up the available space as needed */}
      <div className='flex-1'></div>
    </div>
  );
};
