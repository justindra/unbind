import type {
  DocumentStatus,
  FileStatus,
} from '@unbind/core/entities/documents';
import { capitalCase } from 'change-case';
import React from 'react';
import { Badge, BadgeVariants, BadgeProps } from '../badge';

const docStatusToVariant: Record<DocumentStatus, BadgeVariants> = {
  created: 'default',
  processing: 'warning',
  ready: 'success',
  failed: 'danger',
};

export const DocumentStatusBadge: React.FC<
  { status: DocumentStatus } & Omit<BadgeProps, 'variant'>
> = ({ status, ...props }) => {
  return (
    <Badge variant={docStatusToVariant[status]} {...props}>
      {capitalCase(status)}
    </Badge>
  );
};

export const fileStatusToVariant: Record<FileStatus, BadgeVariants> = {
  created: 'default',
  uploaded: 'warning',
  processing: 'warning',
  ready: 'success',
  failed: 'danger',
};
