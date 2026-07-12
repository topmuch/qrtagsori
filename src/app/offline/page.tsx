'use client';

import Link from 'next/link';
import { Luggage } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[#0047d6] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-[#fcd616] rounded-2xl flex items-center justify-center mx-auto mb-8 border-2 border-[#1a1a1a]">
          <Luggage className="w-10 h-10 text-[#1a1a1a]" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">
          Vous êtes hors ligne
        </h1>
        <p className="text-white/80 text-sm mb-6">
          QRBag fonctionne hors ligne. Vos données de suivi sont en cache.
          Reconnectez-vous pour recevoir les dernières mises à jour.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#fcd616] text-[#1a1a1a] px-6 py-3 rounded-xl font-bold border-2 border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#fcd616] transition-colors"
        >
          Réessayer
        </button>
      </div>
    </main>
  );
}
