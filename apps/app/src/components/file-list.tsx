import React from 'react';
import { classNames } from '@jfsi/react';

type DotVariants = 'success' | 'danger' | 'warning' | 'default';
type DotProps = {
  variant?: DotVariants;
};

const dotVariants: Record<DotVariants, string> = {
  success: 'fill-green-500 dark:fill-green-400',
  danger: 'fill-red-500 dark:fill-red-400',
  warning: 'fill-yellow-500 dark:fill-yellow-400',
  default: 'fill-gray-500 dark:fill-gray-400',
};

const Dot: React.FC<DotProps> = ({ variant = 'default' }) => {
  return (
    <svg
      className={classNames('h-1.5 w-1.5', dotVariants[variant])}
      viewBox='0 0 6 6'
      aria-hidden='true'>
      <circle cx={3} cy={3} r={3} />
    </svg>
  );
};

type FileListProps = {
  files: {
    id?: string;
    name: string;
    description?: string;
    action?: {
      label: string;
      href: string;
    };
    status?: DotVariants;
  }[];
};

export const FileList: React.FC<FileListProps> = ({ files }) => {
  return (
    <ul
      role='list'
      className='divide-y divide-gray-100 dark:divide-white/10 rounded-md border border-gray-200 dark:border-white/20'>
      {files.map((file) => (
        <li
          key={file.id || file.name}
          className='flex items-center justify-between py-4 pl-4 pr-5 text-sm leading-6'>
          <div className='flex w-0 flex-1 items-center'>
            <Dot variant={file.status} />
            <div className='ml-4 min-w-0 flex-1 gap-2'>
              <p className='block truncate font-medium'>{file.name}</p>
              <p className='text-gray-400'>{file.description}</p>
            </div>
          </div>
          {file.action && (
            <div className='ml-4 flex-shrink-0'>
              <a
                href={file.action.href}
                className='font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300'>
                {file.action.label}
              </a>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};
