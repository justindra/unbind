import { AuthUtils } from '@jfsi/react';
import ReactMarkdown from 'react-markdown';
import { COMPANY_NAME } from '../../constants';
import { DateTime } from 'luxon';
import React from 'react';
import { Badge } from '../badge';

type MessageListProps = {
  messages: {
    content: string;
    role: 'user' | 'assistant' | 'system';
    timestamp?: string;
    userId?: string;
    resources?: string[];
  }[];
};

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const user = AuthUtils.getUser();
  return (
    <div className='px-4 py-6 sm:px-6 overflow-y-auto flex-1 flex flex-col-reverse'>
      <ul role='list' className='space-y-8'>
        {messages.map((message, index) => {
          return (
            <li key={index}>
              <div className='flex space-x-3'>
                <div className='flex-shrink-0'>
                  {message.role === 'user' ? (
                    <img
                      className='h-10 w-10 rounded-full'
                      src={user?.avatarUrl || ''}
                      alt={`Avatar of ${user?.name}`}
                      referrerPolicy='no-referrer'
                    />
                  ) : (
                    <img
                      className='h-10 w-10 rounded-full'
                      src={
                        'https://avatars.dicebear.com/api/avataaars/ruru.svg'
                      }
                      alt={`${COMPANY_NAME} Avatar`}
                    />
                  )}
                </div>
                <div>
                  <div className='text-sm'>
                    <a href='#' className='font-medium text-gray-900'>
                      {message.role === 'user' ? user?.name : 'Unbind'}
                    </a>
                  </div>
                  <div className='mt-1 text-sm text-gray-700 prose max-w-full'>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  {message.timestamp && (
                    <div className='mt-2 space-x-2 text-sm'>
                      <span className='font-medium text-gray-500'>
                        {DateTime.fromISO(message.timestamp).toLocaleString(
                          DateTime.DATETIME_MED
                        )}
                      </span>
                    </div>
                  )}
                  {message.resources?.length && (
                    <div className='mt-2 border-t-2'>
                      <p className='text-sm italic my-2'>Sources: </p>
                      {message.resources.map((resource, index) => (
                        <ResourceLink key={index} resource={resource} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const parseResource = (resource: string) => {
  try {
    const obj = JSON.parse(resource);
    return {
      fileId: obj.fileId,
      documentId: obj.documentId,
      pageNumber: obj['loc.pageNumber'],
      lines: {
        from: obj['loc.lines.from'],
        to: obj['loc.lines.to'],
      },
      filename: obj.filename || obj['pdf.info.Title'],
    };
  } catch (error) {
    return {
      fileId: '',
      documentId: '',
      pageNumber: 0,
      lines: { from: 0, to: 0 },
      filename: '',
    };
  }
};

const ResourceLink: React.FC<{ resource: string }> = ({ resource }) => {
  const obj = parseResource(resource);
  if (!obj.fileId) return null;
  return (
    <Badge className='mr-2'>
      {obj.filename} - Page {obj.pageNumber} ({obj.lines.from}:{obj.lines.to})
    </Badge>
  );
};
