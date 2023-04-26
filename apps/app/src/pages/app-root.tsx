import { DocumentDuplicateIcon, HomeIcon } from '@heroicons/react/24/outline';
import { AuthUtils, AppSidebarLayout } from '@jfsi/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import React, { useEffect, useState } from 'react';
import { Outlet, redirect, useLoaderData } from 'react-router-dom';
import { COMPANY_NAME } from '../constants';
import { trpc } from '../utils/trpc';
import { SetOpenAIKeyModal } from '../components/set-open-ai-key-modal';

const OpenAIApiKeyModal = () => {
  const { isLoading, data, refetch } = trpc.get_open_ai_key.useQuery(
    undefined,
    { enabled: false }
  );
  // Refetch once on mount
  useEffect(() => {
    refetch();
  }, []);
  if (isLoading || !!data) return null;

  return <SetOpenAIKeyModal />;
};

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
              authorization: `Bearer ${AuthUtils.getToken()}` || '',
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
            {
              name: 'Documents',
              href: '/',
              icon: DocumentDuplicateIcon,
              current: true,
            },
          ]}
          profileUrl='#'
          title={COMPANY_NAME}>
          <Outlet />
        </AppSidebarLayout>
        <OpenAIApiKeyModal />
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
