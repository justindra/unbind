import { classNames } from '@jfsi/react';
import React from 'react';

export type BadgeVariants =
  | 'primary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'default';

export type BadgeProps = React.PropsWithChildren<{
  variant?: BadgeVariants;
  className?: React.HTMLAttributes<HTMLSpanElement>['className'];
}>;

function getColourClasses(variant: BadgeVariants) {
  switch (variant) {
    case 'primary':
      return 'bg-primary-50 text-primary-700 ring-primary-700/10 dark:bg-primary-400/10 dark:text-primary-400 dark:ring-primary-400/30';
    case 'success':
      return 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20';
    case 'danger':
      return 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/20';
    case 'warning':
      return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-400/10 dark:text-yellow-500 dark:ring-yellow-400/20';
    case 'info':
      return 'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30';
    case 'default':
    default:
      return 'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20';
  }
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const colourClasses = getColourClasses(variant);
  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
        colourClasses,
        className
      )}>
      {children}
    </span>
  );
};
