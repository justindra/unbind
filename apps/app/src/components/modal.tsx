import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Fragment, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { trpc } from '../utils/trpc';
import { FieldText } from './forms';
import { Button } from '@jfsi/react';

type Inputs = {
  apiKey: string;
};

export const Modal: React.FC = () => {
  const [open, setOpen] = useState(true);
  const cancelButtonRef = useRef(null);
  const { handleSubmit, control } = useForm<Inputs>({
    defaultValues: { apiKey: '' },
  });

  const setOpenAIKey = trpc.set_open_ai_key.useMutation({
    onSuccess: () => setOpen(false),
  });

  const onSubmit = handleSubmit(async ({ apiKey }) => {
    setOpenAIKey.mutate(apiKey);
  });

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as='div'
        className='relative z-[60]'
        initialFocus={cancelButtonRef}
        onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'>
          <div className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity' />
        </Transition.Child>

        <div className='fixed inset-0 z-10 overflow-y-auto'>
          <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
              enterTo='opacity-100 translate-y-0 sm:scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 translate-y-0 sm:scale-100'
              leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'>
              <Dialog.Panel className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6'>
                <div className='sm:flex sm:items-start'>
                  <div className='mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 sm:mx-0 sm:h-10 sm:w-10'>
                    <ExclamationTriangleIcon
                      className='h-6 w-6 text-amber-600'
                      aria-hidden='true'
                    />
                  </div>
                  <div className='mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left'>
                    <Dialog.Title
                      as='h3'
                      className='text-base font-semibold leading-6 text-gray-900'>
                      No OpenAI API Key was found
                    </Dialog.Title>
                    <div className='mt-2'>
                      <p className='text-sm text-gray-500'>
                        You need to set an API key from OpenAI to use this app.
                        You can get one from{' '}
                        <a
                          href='https://platform.openai.com/account/api-keys'
                          target='_blank'
                          rel='noreferrer'
                          className='font-medium text-gray-900 underline'>
                          https://platform.openai.com/account/api-keys
                        </a>
                      </p>
                    </div>
                    {JSON.stringify(setOpenAIKey.error?.shape?.message)}
                    <div className='mt-2'>
                      <FieldText
                        controlProps={{ control, name: 'apiKey' }}
                        label='API Key'
                        placeholder='sk-**********************************'
                        error={setOpenAIKey.error?.shape?.message}
                      />
                    </div>
                  </div>
                </div>
                <div className='mt-5 sm:mt-4 sm:flex sm:flex-row-reverse'>
                  <Button
                    loading={setOpenAIKey.isLoading}
                    variant='primary'
                    onClick={onSubmit}>
                    Set API Key
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
