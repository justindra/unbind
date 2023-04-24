// import RuruLongLogo from './assets/ruru-long-logo.png';
// import RuruLogo from './assets/ruru-logo.png';

export const COMPANY_NAME = 'Unbind';
// export const COMPANY_LOGO = RuruLogo;
// export const COMPANY_LOGO_LONG = RuruLongLogo;

// Auth constants
export const AUTH_ENDPOINT = import.meta.env.VITE_AUTH_ENDPOINT;
export const AUTH_URL = import.meta.env.VITE_AUTH_ENDPOINT + '/authorize';
export const REDIRECT_URL = `${
  import.meta.env.VITE_APP_ENDPOINT || 'http://localhost:5173'
}/auth/callback`;
