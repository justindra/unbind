import {
  FieldPath,
  FieldValues,
  PathValue,
  UseControllerProps,
  useController,
} from 'react-hook-form';
import { FieldBase, FieldBaseProps } from '../field-base';
import { DocumentArrowUpIcon } from '@heroicons/react/20/solid';
import { useEffect } from 'react';
import { classNames } from '@jfsi/react';
import { useFileUpload } from './state';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

type FieldFileUploadProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = FieldBaseProps & {
  controlProps: UseControllerProps<TFieldValues, TName>;
};

export const FieldFileUpload = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  controlProps,
  ...props
}: FieldFileUploadProps<TFieldValues, TName>) => {
  const { field, fieldState } = useController({
    ...controlProps,
    defaultValue:
      controlProps.defaultValue || ('' as PathValue<TFieldValues, TName>),
  });

  const { data, eventHandlers, addFileToList } = useFileUpload();

  useEffect(() => {
    field.onChange(data.fileList);
  }, [data.fileList]);

  const error = fieldState.error?.message || props.error;

  return (
    <FieldBase
      {...props}
      className={classNames(props.className || '', 'w-full')}
      error={error}>
      <div
        className={classNames(
          'mt-2 flex justify-center rounded-lg border border-dashed  px-6 py-10',
          data.inDropZone
            ? 'border-primary-600 bg-gray-100'
            : 'border-gray-900/25',
          props.disabled ? 'pointer-events-none opacity-30' : ''
        )}
        {...eventHandlers}>
        <div className='text-center'>
          <DocumentArrowUpIcon
            className='mx-auto h-12 w-12 text-gray-300'
            aria-hidden='true'
          />
          <div className='mt-4 text-sm leading-6 text-gray-600'>
            <label
              htmlFor={props.name}
              className='inline relative cursor-pointer rounded-md font-semibold text-primary-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-600 focus-within:ring-offset-2 hover:text-primary-500'>
              <span>Choose a file</span>
              <input
                id={props.name}
                type='file'
                className='sr-only'
                onChange={(e) => addFileToList(e.target.files)}
              />
            </label>
            <p className='inline pl-1'>or drag and drop your files here</p>
          </div>
          <p className='text-xs leading-5 text-gray-600'>PDF, MD up to 10MB</p>
        </div>
      </div>
      <ol className='grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3'>
        {data.fileList.map((f) => {
          return (
            <li
              key={f.name}
              className='col-span-1 border border-solid border-gray-900/25 rounded-md p-3 text-center overflow-clip overflow-ellipsis'>
              <DocumentTextIcon className='w-10 h-10 text-gray-400 mx-auto' />
              <span className='text-sm font-normal whitespace-nowrap '>
                {f.name}
              </span>
            </li>
          );
        })}
      </ol>
    </FieldBase>
  );
};
