import { AppPageTitle, DescriptionList, FileList } from '@jfsi/react';
import React from 'react';

export const DocumentItemPage: React.FC = () => {
  return (
    <div className='flex gap-4'>
      <div className='flex-1 border-r-2 border-gray-200'>
        <AppPageTitle>Test Document</AppPageTitle>
      </div>
      <div className='max-w-sm'>
        <DescriptionList
          title='Document #1 - Test Document...'
          items={[
            { label: 'Status', value: 'Ready' },
            {
              label: 'Summary',
              value:
                'This is the summary of this document. This is the summary of this document. This is the summary of this document. This is the summary of this document. This is the summary of this document. This is the summary of this document. ',
            },
            {
              label: 'Files',
              value: (
                <FileList
                  files={[
                    {
                      name: 'Part 1.pdf',
                      size: '5 pages',
                      // action: { label: 'Download', href: '#' },
                    },
                    {
                      name: 'Part 2.pdf',
                      size: '389 pages',
                      // action: { label: 'Download', href: '#' },
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};
