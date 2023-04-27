import {
  BarsArrowUpIcon,
  PaperAirplaneIcon,
  QuestionMarkCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@jfsi/react';

export const SendMessage: React.FC = () => {
  return (
    <div className='p-4'>
      <div className='min-w-0 flex-1 relative'>
        <div className='overflow-hidden rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-primary-600'>
          <label htmlFor='comment' className='sr-only'>
            Add your comment
          </label>
          <textarea
            rows={3}
            name='comment'
            id='comment'
            className='block w-full resize-none border-0 bg-transparent py-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6'
            placeholder='Add your comment...'
            defaultValue={''}
          />

          {/* Spacer element to match the height of the toolbar */}
          <div className='py-2' aria-hidden='true'>
            {/* Matches height of button in toolbar (1px border + 36px content height) */}
            <div className='py-px'>
              <div className='h-9' />
            </div>
          </div>
        </div>

        <div className='absolute inset-x-0 bottom-0 flex justify-between p-2'>
          <div className='flex gap-2'>
            <Button size='sm' startIcon={BarsArrowUpIcon as any}>
              Summarize
            </Button>
            <Button size='sm' startIcon={QuestionMarkCircleIcon as any}>
              Random Question
            </Button>
            <Button size='sm' startIcon={TrashIcon as any}>
              Clear Chat
            </Button>
          </div>
          <div className='flex-shrink-0'>
            <Button startIcon={PaperAirplaneIcon as any} variant='primary'>
              Send
            </Button>
          </div>
        </div>
      </div>
      <p className='mt-2 px-4 text-sm italic text-gray-400'>
        Powered by OpenAI
      </p>
    </div>
  );
};
