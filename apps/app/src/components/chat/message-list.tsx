import { AuthUtils } from '@jfsi/react';
import ReactMarkdown from 'react-markdown';
import { COMPANY_NAME } from '../../constants';
import { DateTime } from 'luxon';

type MessageListProps = {
  messages: {
    content: string;
    role: 'user' | 'assistant' | 'system';
    timestamp?: string;
    userId?: string;
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
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
