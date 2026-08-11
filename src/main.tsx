import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/router';
import '@/shared/styles/tokens.css';
import '@/shared/styles/global.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found in the document.');
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);