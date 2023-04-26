import { classNames } from '@jfsi/react';
import {
  FieldPath,
  FieldValues,
  PathValue,
  useController,
  UseControllerProps,
} from 'react-hook-form';
import { FieldBase, FieldBaseProps } from './field-base';

type FieldTextProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = FieldBaseProps & {
  controlProps: UseControllerProps<TFieldValues, TName>;
};

export const FieldText = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  controlProps,
  ...props
}: FieldTextProps<TFieldValues, TName>) => {
  const { field, fieldState } = useController({
    ...controlProps,
    defaultValue:
      controlProps.defaultValue || ('' as PathValue<TFieldValues, TName>),
  });
  const error = fieldState.error?.message || props.error;
  return (
    <FieldBase {...props} error={error}>
      <input
        type='text'
        id={props.name}
        {...field}
        className={classNames(
          'block w-full min-w-0 flex-1 rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6',
          error
            ? 'ring-red-500 focus:ring-red-500'
            : 'ring-gray-300 focus:ring-primary-600'
        )}
        placeholder={props.placeholder}
      />
    </FieldBase>
  );
};
