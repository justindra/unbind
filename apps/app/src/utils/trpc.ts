import { createTRPCReact } from '@trpc/react-query';
import type { Router } from '@unbind/functions/trpc'; // your router type

export const trpc = createTRPCReact<Router>();
