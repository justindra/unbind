import { classNames } from '@jfsi/react';
import {
  FieldPath,
  FieldValues,
  PathValue,
  useController,
  UseControllerProps,
} from 'react-hook-form';
import { FieldBase, FieldBaseProps } from './field-base';

type FieldTextareaProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = FieldBaseProps & {
  inputProps?: React.InputHTMLAttributes<HTMLTextAreaElement>;
  controlProps: UseControllerProps<TFieldValues, TName>;
};

export const FieldTextarea = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  inputProps = {},
  controlProps,
  ...props
}: FieldTextareaProps<TFieldValues, TName>) => {
  const { field, fieldState } = useController({
    ...controlProps,
    defaultValue:
      controlProps.defaultValue || ('' as PathValue<TFieldValues, TName>),
  });

  const error = fieldState.error?.message || props.error;
  return (
    <FieldBase {...props} error={error}>
      <textarea
        id={props.name}
        rows={3}
        className={classNames(
          'block w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:py-1.5 sm:text-sm sm:leading-6',
          error
            ? 'ring-red-500 focus:ring-red-500'
            : 'ring-gray-300 focus:ring-primary-600'
        )}
        {...field}
      />
    </FieldBase>
  );
};
