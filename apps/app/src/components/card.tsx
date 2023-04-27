import { classNames } from '@jfsi/react';
import React from 'react';

export const Card: React.FC<
  React.PropsWithChildren<{
    className: React.HTMLAttributes<HTMLDivElement>['className'];
  }>
> = ({ className = '', children }) => {
  return (
    <div
      className={classNames(
        className,
        'bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl'
      )}>
      {children}
    </div>
  );
};
