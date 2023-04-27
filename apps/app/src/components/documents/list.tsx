import type { DocumentInfo } from '@unbind/core/documents';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { DocumentStatusBadge } from './badge';
import { Link } from 'react-router-dom';
import { DateTime } from 'luxon';
import { classNames } from '@jfsi/react';

type DocumentListProps = {
  documents: DocumentInfo[];
  className?: React.HTMLAttributes<HTMLUListElement>['className'];
};

export const DocumentList: React.FC<DocumentListProps> = ({
  className = '',
  documents,
}) => {
  return (
    <ul
      role='list'
      className={classNames(
        'divide-y divide-gray-100 overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl',
        className
      )}>
      {documents.map((doc) => (
        <li
          key={doc.documentId}
          className='relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6'>
          <div className='flex gap-x-4'>
            <DocumentTextIcon className='h-12 w-12 flex-none' />
            <div className='min-w-0 flex-auto'>
              <p className='text-sm font-semibold leading-6 text-gray-900'>
                <Link to={`/documents/${doc.documentId}`}>
                  <span className='absolute inset-x-0 -top-px bottom-0' />
                  {doc.name || 'Untitled Document'}
                </Link>
              </p>
              <p className='mt-1 flex text-xs leading-5 text-gray-500'>
                {doc.summary || 'No summary provided'}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-x-4'>
            <div className='hidden sm:flex sm:flex-col sm:items-end'>
              <DocumentStatusBadge status={doc.status} />
              {doc.createdAt && (
                <p className='mt-1 text-xs leading-5 text-gray-500'>
                  Created on{' '}
                  <time dateTime={doc.createdAt}>
                    {DateTime.fromISO(doc.createdAt).toLocaleString(
                      DateTime.DATE_MED
                    )}
                  </time>
                </p>
              )}
            </div>
            <ChevronRightIcon
              className='h-5 w-5 flex-none text-gray-400'
              aria-hidden='true'
            />
          </div>
        </li>
      ))}
    </ul>
  );
};
