'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from './client';
import { createQueryClient, createTRPCLinks } from './queryClient';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { useState, useMemo } from 'react';
import type { AppRouter } from '../../../api/trpc';

interface TRPCProviderProps {
  children: React.ReactNode;
}

export function TRPCProvider({ children }: TRPCProviderProps) {
  const [queryClient] = useState(() => createQueryClient());

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: createTRPCLinks(),
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}