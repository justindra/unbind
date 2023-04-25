import { HomeIcon } from '@heroicons/react/24/outline';
import { AuthUtils, AppSidebarLayout } from '@jfsi/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import React, { useState } from 'react';
import { Outlet, redirect, useLoaderData } from 'react-router-dom';
import { COMPANY_NAME } from '../constants';
import { trpc } from '../utils/trpc';

export const AppRoot: React.FC = () => {
  const { currentUser } = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: import.meta.env.VITE_API_ENDPOINT,
          // You can pass any HTTP headers you wish here
          async headers() {
            return {
              authorization: AuthUtils.getToken() || '',
            };
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AppSidebarLayout
          user={currentUser}
          brand={{
            name: COMPANY_NAME,
            logoUrl: '',
          }}
          navigation={[
            { name: 'Home', href: '/', icon: HomeIcon, current: true },
          ]}
          profileUrl='#'
          title={COMPANY_NAME}>
          <Outlet />
        </AppSidebarLayout>
      </QueryClientProvider>
    </trpc.Provider>
  );
};

export async function loader() {
  const currentUser = AuthUtils.getUser();
  if (!AuthUtils.isSignedIn() || !currentUser) {
    throw redirect('/auth/sign-in');
  }

  return { currentUser };
}
