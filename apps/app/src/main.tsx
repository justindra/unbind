import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import './index.css';

import { AppRoot, loader as appRootLoader } from './pages/app-root';
import {
  AuthCallbackPage,
  AuthSignInPage,
  AuthSignOutPage,
  createCallbackLoader,
  createSignOutLoader,
} from '@jfsi/react';
import {
  AUTH_ENDPOINT,
  AUTH_URL,
  COMPANY_NAME,
  REDIRECT_URL,
} from './constants';
import { DocumentItemPage } from './pages/documents/item';
import { HomePage } from './pages';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppRoot />,
    loader: appRootLoader,
    errorElement: <div>Error...</div>,
    children: [
      { index: true, element: <HomePage /> },
      { path: '/documents/:id', element: <DocumentItemPage /> },
    ],
  },
  {
    path: '/auth/sign-in',
    element: (
      <AuthSignInPage
        logo={'COMPANY_LOGO_LONG'}
        logoAlt={`${COMPANY_NAME} Logo`}
        authUrl={AUTH_URL}
        redirectUrl={REDIRECT_URL}
        providers={['google', 'facebook']}
      />
    ),
  },
  {
    path: '/auth/sign-out',
    element: <AuthSignOutPage />,
    loader: createSignOutLoader({ homeUrl: '/auth/sign-in' }),
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />,
    loader: createCallbackLoader({
      authEndpoint: AUTH_ENDPOINT,
      homeUrl: '/',
      signInUrl: '/auth/sign-in',
    }),
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
