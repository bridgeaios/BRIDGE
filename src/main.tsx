import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { TRPCProvider } from './lib/trpc/react';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <TRPCProvider>
    <App />
  </TRPCProvider>
);
