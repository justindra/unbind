export type FieldBaseProps = React.PropsWithChildren<{
  label: string;
  name?: string;
  helperText?: string;
  error?: string;
  placeholder?: string;
}>;

export const FieldBase: React.FC<FieldBaseProps> = ({
  label,
  name,
  helperText,
  error,
  children,
}) => {
  return (
    <div className='sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5'>
      <label
        htmlFor={name}
        className='block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5'>
        {label}
      </label>
      <div className='mt-2 sm:col-span-2 sm:mt-0'>
        {children}
        {error ? (
          <p className='mt-2 text-sm text-red-500'>{error}</p>
        ) : helperText ? (
          <p className='mt-2 text-sm text-gray-500'>{helperText}</p>
        ) : null}
      </div>
    </div>
  );
};
