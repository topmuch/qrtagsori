'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// ─── Types ───────────────────────────────────────────────────────
export interface TravelerUser {
  id: string;
  phone: string;
  name: string | null;
}

export interface TravelerBaggage {
  reference: string;
  status: string;
  scanCount: number;
  lastScanLocation: string | null;
  lastScanDate: string | null;
  expiresAt: string | null;
  customData: {
    object_name?: string;
    category_label?: string;
    color?: string;
    photo?: string;
    category?: string;
    [key: string]: unknown;
  } | null;
  trackingToken: string | null;
}

interface TravelerAuthContextType {
  traveler: TravelerUser | null;
  baggages: TravelerBaggage[];
  loading: boolean;
  isLoggedIn: boolean;
  login: (phone: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  signup: (phone: string, pin: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshBaggages: () => Promise<void>;
  linkBaggage: (reference: string) => Promise<boolean>;
}

const TravelerAuthContext = createContext<TravelerAuthContextType | null>(null);

const TOKEN_KEY = 'qrtags_traveler_token';

// ─── Provider ────────────────────────────────────────────────────
export function TravelerAuthProvider({ children }: { children: ReactNode }) {
  const [traveler, setTraveler] = useState<TravelerUser | null>(null);
  const [baggages, setBaggages] = useState<TravelerBaggage[]>([]);
  const [loading, setLoading] = useState(true);

  const getToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }, []);

  const fetchMe = useCallback(async (token: string) => {
    try {
      const res = await fetch(`/api/traveler/me?token=${token}`);
      if (!res.ok) {
        // Token invalide ou expiré
        localStorage.removeItem(TOKEN_KEY);
        setTraveler(null);
        setBaggages([]);
        return null;
      }
      const data = await res.json();
      setTraveler(data.traveler);
      setBaggages(data.baggages || []);
      return data.traveler;
    } catch {
      return null;
    }
  }, []);

  // ─── Au montage, vérifier le token existant ───
  useEffect(() => {
    const token = getToken();
    if (token) {
      fetchMe(token).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [getToken, fetchMe]);

  const login = async (phone: string, pin: string) => {
    try {
      const res = await fetch('/api/traveler/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Erreur de connexion' };
      localStorage.setItem(TOKEN_KEY, data.token);
      setTraveler(data.traveler);
      // Charger les baggages
      await fetchMe(data.token);
      return { success: true };
    } catch {
      return { success: false, error: 'Erreur réseau' };
    }
  };

  const signup = async (phone: string, pin: string, name?: string) => {
    try {
      const res = await fetch('/api/traveler/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin, name }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Erreur lors de la création' };
      localStorage.setItem(TOKEN_KEY, data.token);
      setTraveler(data.traveler);
      setBaggages([]);
      return { success: true };
    } catch {
      return { success: false, error: 'Erreur réseau' };
    }
  };

  const logout = async () => {
    const token = getToken();
    if (token) {
      try {
        await fetch('/api/traveler/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
    localStorage.removeItem(TOKEN_KEY);
    setTraveler(null);
    setBaggages([]);
  };

  const refreshBaggages = async () => {
    const token = getToken();
    if (token) await fetchMe(token);
  };

  const linkBaggage = async (reference: string) => {
    const token = getToken();
    if (!token) return false;
    try {
      const res = await fetch('/api/traveler/link-baggage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reference }),
      });
      if (res.ok) {
        await refreshBaggages();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <TravelerAuthContext.Provider
      value={{
        traveler,
        baggages,
        loading,
        isLoggedIn: !!traveler,
        login,
        signup,
        logout,
        refreshBaggages,
        linkBaggage,
      }}
    >
      {children}
    </TravelerAuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────
export function useTravelerAuth() {
  const ctx = useContext(TravelerAuthContext);
  if (!ctx) throw new Error('useTravelerAuth must be used within TravelerAuthProvider');
  return ctx;
}