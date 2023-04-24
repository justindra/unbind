import { Outlet, redirect, useLoaderData } from 'react-router-dom';
import { AuthUtils, AppSidebarLayout } from '@jfsi/react';
import { COMPANY_NAME } from '../constants';
import { HomeIcon } from '@heroicons/react/24/outline';

export const AppRoot: React.FC = () => {
  const { currentUser } = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  return (
    <AppSidebarLayout
      user={currentUser}
      brand={{
        name: COMPANY_NAME,
        logoUrl: '',
      }}
      navigation={[{ name: 'Home', href: '/', icon: HomeIcon, current: true }]}
      profileUrl='#'
      title={COMPANY_NAME}>
      <Outlet />
    </AppSidebarLayout>
  );
};

export async function loader() {
  const currentUser = AuthUtils.getUser();
  if (!AuthUtils.isSignedIn() || !currentUser) {
    throw redirect('/auth/sign-in');
  }

  return { currentUser };
}
