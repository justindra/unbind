import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  RouterProvider,
  createBrowserRouter,
  redirect,
} from 'react-router-dom';

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
  COMPANY_LOGO_LONG,
  COMPANY_NAME,
  REDIRECT_URL,
} from './constants';
import {
  DocumentItemPage,
  documentItemPageLoader,
} from './pages/documents/item';
import { DocumentsHomePage } from './pages/documents';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppRoot />,
    loader: appRootLoader,
    errorElement: <div>Error...</div>,
    children: [
      { index: true, loader: () => redirect('/documents') },
      {
        path: '/documents',
        children: [
          { index: true, element: <DocumentsHomePage /> },
          {
            path: '/documents/:documentId',
            element: <DocumentItemPage />,
            loader: documentItemPageLoader,
          },
        ],
      },
    ],
  },
  {
    path: '/auth/sign-in',
    element: (
      <AuthSignInPage
        logo={COMPANY_LOGO_LONG}
        logoAlt={`${COMPANY_NAME} Logo`}
        authUrl={AUTH_URL}
        redirectUrl={REDIRECT_URL}
        providers={['google']}
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
