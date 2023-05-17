import { generateDomainUtils } from 'jfsi/constructs';

export const COMPANY_NAME = 'Unbind';
export const HOSTED_ZONE = 'unbind.dev';

export const DomainUtils = generateDomainUtils(HOSTED_ZONE);
