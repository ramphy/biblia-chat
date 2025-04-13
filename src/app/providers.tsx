'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';

interface ProvidersProps {
  children: React.ReactNode;
  // You might pass the session fetched on the server here if needed,
  // but SessionProvider can also fetch it automatically on the client.
  // session?: Session | null;
}

export default function Providers({ children }: ProvidersProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
