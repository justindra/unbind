import { Dialog } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@jfsi/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { trpc } from '../utils/trpc';
import { Modal } from './modal';
import { FieldText } from './forms';

type Inputs = {
  apiKey: string;
};

export const SetOpenAIKeyModal: React.FC = () => {
  const [open, setOpen] = useState(true);
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
    <Modal
      open={open}
      setOpen={setOpen}
      actions={
        <Button
          loading={setOpenAIKey.isLoading}
          variant='primary'
          onClick={onSubmit}>
          Set API Key
        </Button>
      }>
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
              You need to set an API key from OpenAI to use this app. You can
              get one from{' '}
              <a
                href='https://platform.openai.com/account/api-keys'
                target='_blank'
                rel='noreferrer'
                className='font-medium text-gray-900 underline'>
                https://platform.openai.com/account/api-keys
              </a>
            </p>
          </div>
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
    </Modal>
  );
};
