import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { AuthUtils, AppSidebarLayout } from '@jfsi/react';
import { QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { Outlet, redirect, useLoaderData } from 'react-router-dom';
import { COMPANY_LOGO_LONG, COMPANY_NAME } from '../constants';
import { queryClient, trpc, trpcClient } from '../utils/trpc';
import { SetAPIKeysModal } from '../components/set-api-keys-modal';

function hasFalseValue(obj?: Record<string, boolean>) {
  if (!obj) return true;
  return Object.values(obj).some((value) => value === false);
}

const OpenAIApiKeyModal = () => {
  const { isLoading, data, refetch } = trpc.get_api_keys.useQuery(undefined, {
    enabled: false,
  });
  // Refetch once on mount
  useEffect(() => {
    refetch();
  }, []);
  if (isLoading || !hasFalseValue(data)) return null;

  return (
    <SetAPIKeysModal
      requireOpenAI={!data?.openAIApiKey}
      requirePinecone={
        !data?.pineconeApiKey ||
        !data?.pineconeEnvironment ||
        !data?.pineconeIndex
      }
    />
  );
};

export const AppRoot: React.FC = () => {
  const { currentUser } = useLoaderData() as Awaited<ReturnType<typeof loader>>;

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AppSidebarLayout
          user={currentUser}
          brand={{
            name: COMPANY_NAME,
            logoUrl: COMPANY_LOGO_LONG,
          }}
          navigation={[
            {
              name: 'Documents',
              href: '/documents',
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
