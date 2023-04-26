import { DocumentPlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@jfsi/react';
import React, { useState } from 'react';
import { Modal } from './modal';
import { FieldFileUpload } from './forms/field-file-upload';
import { useForm } from 'react-hook-form';
import { Dialog } from '@headlessui/react';
import { trpc } from '../utils/trpc';
import { useNavigate } from 'react-router-dom';

type Inputs = {
  files: File[];
};

const uploadToPreSignedUrl = async (file: File, url: string) => {
  // const formData = new FormData();
  // formData.append('Content-Type', file.type);
  // formData.append('file', file); // The file has be the last element

  return fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
};

export const DocumentUploadButton: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [filesUploading, setFilesUploading] = useState<File[]>([]);
  const [open, setOpen] = useState(false);
  const { control, handleSubmit, setError } = useForm<Inputs>({
    defaultValues: { files: [] },
  });

  const getUploadUrls = trpc.get_upload_urls_for_new_document.useMutation({
    onSuccess: async ({ documentId, fileUploadUrls }) => {
      try {
        await Promise.all(
          filesUploading.map(async (file, index) =>
            uploadToPreSignedUrl(file, fileUploadUrls[index])
          )
        );
        setOpen(false);
        navigate(`/documents/${documentId}`);
      } catch (error) {
        setError('files', { message: (error as Error).message });
      }
      setLoading(false);
    },
  });

  const onSubmit = handleSubmit(async ({ files }) => {
    setLoading(true);
    setFilesUploading(files);
    getUploadUrls.mutate(
      files.map((file) => ({ filename: file.name, type: file.type }))
    );
  });

  return (
    <>
      <Button
        startIcon={DocumentPlusIcon as any}
        onClick={() => setOpen(true)}
        variant='primary'>
        Upload Document
      </Button>
      <Modal
        open={open}
        setOpen={setOpen}
        actions={
          <>
            <Button variant='primary' onClick={onSubmit} loading={loading}>
              Upload
            </Button>
            <Button onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
          </>
        }>
        <Dialog.Title
          as='h3'
          className='text-base font-semibold leading-6 text-gray-900'>
          Upload a new document.
        </Dialog.Title>
        <div className='mt-2'>
          <p className='text-sm text-gray-500'>
            A document is a file (or multiple files) that you want our AI to
            analyze. It can be a book, a blog post, a training document or
            anything else. At this time we only support PDF files, but we are
            working on adding more formats.
          </p>
        </div>
        <FieldFileUpload controlProps={{ control, name: 'files' }} />
        {/* <p className='text-sm text-gray-500 italic'>
          Your files will be uploaded to our servers and will be kept private.
          Contents will also be sent to OpenAI's servers for analysis. If you
          would like to host the files on your own servers, please contact us at{' '}
          <a
            href='mailto:hello@unbind.io'
            className='font-medium text-gray-900 underline'>
            hello@unbind.io
          </a>
          .
        </p> */}
      </Modal>
    </>
  );
};
