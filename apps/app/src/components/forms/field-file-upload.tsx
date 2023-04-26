import {
  FieldPath,
  FieldValues,
  PathValue,
  UseControllerProps,
  useController,
} from 'react-hook-form';
import { FieldBase, FieldBaseProps } from './field-base';
import { DocumentArrowUpIcon } from '@heroicons/react/20/solid';
import React, { useRef, useState } from 'react';
import { classNames } from '@jfsi/react';

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

  const dropzoneRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [counter, setCounter] = useState(0);
  const error = fieldState.error?.message || props.error;

  const handleDrag: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDragIn: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCounter(counter + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragging(true);
    }
  };
  const handleDragOut: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (counter > 0) {
      setCounter(counter - 1);
      return;
    }
    setCounter(0);
    setDragging(false);
  };
  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    setCounter(0);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      field.onChange(e.dataTransfer.files);
    }
  };

  return (
    <div className='col-span-full'>
      <FieldBase {...props} error={error}>
        <div
          ref={dropzoneRef}
          className={classNames(
            'mt-2 flex justify-center rounded-lg border border-dashed  px-6 py-10',
            dragging ? 'border-primary-600 bg-gray-100' : 'border-gray-900/25'
          )}
          onDrop={handleDrop}
          onDragOver={handleDrag}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}>
          <div className='text-center'>
            <DocumentArrowUpIcon
              className='mx-auto h-12 w-12 text-gray-300'
              aria-hidden='true'
            />
            <div className='mt-4 flex text-sm leading-6 text-gray-600'>
              <label
                htmlFor={props.name}
                className='relative cursor-pointer rounded-md font-semibold text-primary-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-600 focus-within:ring-offset-2 hover:text-primary-500'>
                <span>Upload a file</span>
                <input
                  id={props.name}
                  type='file'
                  className='sr-only'
                  onChange={(e) => field.onChange(e.target.files)}
                />
              </label>
              <p className='pl-1'>or drag and drop</p>
            </div>
            <p className='text-xs leading-5 text-gray-600'>
              PDF, MD up to 10MB
            </p>
          </div>
        </div>
      </FieldBase>
    </div>
  );
};
