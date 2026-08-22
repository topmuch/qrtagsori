'use client';

import { TravelerAuthProvider } from '@/contexts/TravelerAuthContext';

export default function TravelerProvider({ children }: { children: React.ReactNode }) {
  return <TravelerAuthProvider>{children}</TravelerAuthProvider>;
}
