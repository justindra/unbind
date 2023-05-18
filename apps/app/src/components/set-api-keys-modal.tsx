import { Dialog } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@jfsi/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { trpc } from '../utils/trpc';
import { Modal } from './modal';
import { FieldText } from './forms';

type Inputs = {
  openAIApiKey: string;
  pineconeApiKey: string;
  pineconeEnvironment: string;
  pineconeIndex: string;
};

function removeEmpty(obj: Record<string, string>) {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => Boolean(v)));
}

export const SetAPIKeysModal: React.FC<{
  requireOpenAI: boolean;
  requirePinecone: boolean;
}> = ({ requireOpenAI, requirePinecone }) => {
  const [open, setOpen] = useState(true);
  const { handleSubmit, control } = useForm<Inputs>({
    defaultValues: { openAIApiKey: '' },
  });

  const setApiKeys = trpc.set_api_keys.useMutation({
    onSuccess: ({
      openAIApiKey,
      pineconeApiKey,
      pineconeEnvironment,
      pineconeIndex,
    }) => {
      if (
        !openAIApiKey ||
        !pineconeApiKey ||
        !pineconeEnvironment ||
        !pineconeIndex
      )
        return;
      setOpen(false);
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    setApiKeys.mutate(removeEmpty(data));
  });

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      actions={
        <Button
          loading={setApiKeys.isLoading}
          variant='primary'
          onClick={onSubmit}>
          Set API Keys
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
            There are some missing API Keys
          </Dialog.Title>
          {requireOpenAI && (
            <>
              <div className='mt-2'>
                <p className='text-sm text-gray-500'>
                  You need to set an API key from OpenAI to use this app. You
                  can get one from{' '}
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
                  controlProps={{ control, name: 'openAIApiKey' }}
                  label='OpenAI API Key'
                  placeholder='sk-**********************************'
                  error={setApiKeys.error?.shape?.message}
                />
              </div>
            </>
          )}
          {requirePinecone && (
            <>
              <div className='mt-2'>
                <p className='text-sm text-gray-500'>
                  You need to specify your Pinecone API Key, Environment and
                  Index to use this app. You can follow this guide to get
                  started:{' '}
                  <a
                    href='https://docs.pinecone.io/docs/quickstart#2-get-and-verify-your-pinecone-api-key'
                    target='_blank'
                    rel='noreferrer'
                    className='font-medium text-gray-900 underline'>
                    https://docs.pinecone.io/docs/quickstart#2-get-and-verify-your-pinecone-api-key
                  </a>
                </p>
              </div>
              <div className='mt-2'>
                <FieldText
                  controlProps={{ control, name: 'pineconeApiKey' }}
                  label='Pinecone API Key'
                  placeholder=''
                  error={setApiKeys.error?.shape?.message}
                />
                <FieldText
                  controlProps={{ control, name: 'pineconeEnvironment' }}
                  label='Pinecone Environment'
                  placeholder=''
                  error={setApiKeys.error?.shape?.message}
                />
                <FieldText
                  controlProps={{ control, name: 'pineconeIndex' }}
                  label='Pinecone Index'
                  placeholder=''
                  error={setApiKeys.error?.shape?.message}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
