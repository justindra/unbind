import { classNames } from '@jfsi/react';
import React from 'react';

type DescriptionListProps = {
  className?: React.HTMLAttributes<HTMLDivElement>['className'];
  title?: string;
  description?: string;
  items: {
    label: string;
    value: React.ReactNode;
  }[];
};

export const DescriptionList: React.FC<DescriptionListProps> = ({
  className,
  title,
  description,
  items,
}) => {
  return (
    <div className={className}>
      {title && (
        <div className='px-4 sm:px-0'>
          <h3 className='text-base font-semibold leading-7 text-gray-900'>
            {title}
          </h3>
          {description && (
            <p className='mt-1 max-w-2xl text-sm leading-6 text-gray-500'>
              {description}
            </p>
          )}
        </div>
      )}
      <div className={classNames(title ? 'mt-6' : '')}>
        <dl className='grid grid-cols-1'>
          {items.map((item, index) => {
            const showTopBorder = !!title ? index >= 0 : index > 0;
            return (
              <div
                key={item.label}
                className={classNames(
                  showTopBorder ? 'border-t border-gray-100 pt-6' : '',
                  'px-4 pb-4 sm:col-span-1 sm:px-0'
                )}>
                <dt className='text-sm font-medium leading-6 text-gray-900'>
                  {item.label}
                </dt>
                <dd className='mt-1 text-sm leading-6 text-gray-700 sm:mt-2'>
                  {item.value}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </div>
  );
};
