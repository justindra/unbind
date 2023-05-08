import { AuthUtils } from '@jfsi/react';
import { QueryClient } from '@tanstack/react-query';
import { createTRPCReact, httpBatchLink } from '@trpc/react-query';
import type { Router } from '@unbind/functions/trpc'; // your router type

export const trpc = createTRPCReact<Router>();
export const queryClient = new QueryClient();
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_API_ENDPOINT,
      // You can pass any HTTP headers you wish here
      async headers() {
        return {
          authorization: `Bearer ${AuthUtils.getToken()}` || '',
        };
      },
    }),
  ],
});
