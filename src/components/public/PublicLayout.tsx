'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRTagsLogo from "@/components/qrtags/QRTagsLogo";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  Luggage,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import RGPDConsent from './RGPDConsent';
import { useTravelerAuth } from '@/contexts/TravelerAuthContext';
import TravelerAuthModal from '@/components/traveler/TravelerAuthModal';

// Navigation Component (Light, Clean)
export function PublicNavigation() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { traveler, isLoggedIn, logout } = useTravelerAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-slate-100' : 'bg-white/70 backdrop-blur-lg'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <QRTagsLogo size="md" variant="light" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <a href="/#solutions" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Solutions</a>
            <a href="/#comment" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Comment ça marche</a>
            <a href="/#tarifs" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Tarifs</a>
            <Link href="/avis" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Avis</Link>
            <Link href="/contact" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Contact</Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link href="/mes-bagages">
                  <Button variant="ghost" className="text-slate-600 hover:text-slate-900 font-medium text-sm gap-1.5">
                    <Luggage className="w-4 h-4" />
                    Mes objets
                  </Button>
                </Link>
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <User className="w-3.5 h-3.5" />
                  <span className="max-w-[120px] truncate">{traveler?.name || traveler?.phone}</span>
                </div>
                <button
                  onClick={logout}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button onClick={() => setAuthModalOpen(true)}>
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900 font-medium text-sm gap-1.5">
                  <LogIn className="w-4 h-4" />
                  Connexion
                </Button>
              </button>
            )}
            <Link href="/devenir-partenaire">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-full px-5 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300">
                Devenir Partenaire
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-slate-700"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-slate-100">
            <div className="flex flex-col gap-3">
              <a href="/#solutions" className="text-slate-600 hover:text-slate-900 font-medium py-2" onClick={() => setIsOpen(false)}>Solutions</a>
              <a href="/#comment" className="text-slate-600 hover:text-slate-900 font-medium py-2" onClick={() => setIsOpen(false)}>Comment ça marche</a>
              <a href="/#tarifs" className="text-slate-600 hover:text-slate-900 font-medium py-2" onClick={() => setIsOpen(false)}>Tarifs</a>
              <Link href="/avis" className="text-slate-600 hover:text-slate-900 font-medium py-2" onClick={() => setIsOpen(false)}>Avis</Link>
              <Link href="/contact" className="text-slate-600 hover:text-slate-900 font-medium py-2" onClick={() => setIsOpen(false)}>Contact</Link>
              <hr className="border-slate-100 my-1" />
              {isLoggedIn ? (
                <>
                  <Link href="/mes-bagages" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full text-slate-600 font-medium justify-start gap-2">
                      <Luggage className="w-4 h-4" />
                      Mes objets
                    </Button>
                  </Link>
                  <div className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500">
                    <User className="w-3.5 h-3.5" />
                    {traveler?.name || traveler?.phone}
                  </div>
                  <button onClick={() => { logout(); setIsOpen(false); }}>
                    <Button variant="ghost" className="w-full text-red-500 font-medium justify-start gap-2">
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </Button>
                  </button>
                </>
              ) : (
                <button onClick={() => { setAuthModalOpen(true); setIsOpen(false); }}>
                  <Button variant="ghost" className="w-full text-slate-600 font-medium justify-start gap-2">
                    <LogIn className="w-4 h-4" />
                    Connexion / Inscription
                  </Button>
                </button>
              )}
              <Link href="/devenir-partenaire" onClick={() => setIsOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-full">
                  Devenir Partenaire
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Modal connexion voyageur */}
      <TravelerAuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} onSuccess={() => router.push('/mes-bagages')} />
    </nav>
  );
}

// Footer Component (QRTags Brand)
export function PublicFooter() {
  return (
    <footer className="py-12 px-5 border-t bg-white" style={{ borderColor: '#e5e5e5' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <QRTagsLogo size="md" variant="light" />
            </div>
            <p className="text-[#525252] text-sm max-w-md">
              QRTags — étiquettes QR pour objets perdus. Trouvez, rendez, protégez.
              Simple, rapide, citoyen. Sans app, sans batterie.
            </p>
          </div>

          {/* Pour particuliers */}
          <div>
            <h4 className="font-bold mb-3 text-sm" style={{ color: '#c89a00' }}>Pour particuliers</h4>
            <ul className="space-y-2 text-sm text-[#525252]">
              <li><a href="/#comment" className="hover:text-[#1a1a1a] transition-colors">Comment ça marche</a></li>
              <li><a href="/#contact-whatsapp" className="hover:text-[#1a1a1a] transition-colors">Comment suis-je contacté ?</a></li>
              <li><a href="/#tarifs" className="hover:text-[#1a1a1a] transition-colors">Tarifs</a></li>
              <li><Link href="/avis" className="hover:text-[#1a1a1a] transition-colors">Avis ⭐</Link></li>
              <li><Link href="/mes-bagages" className="hover:text-[#1a1a1a] transition-colors">Mes objets</Link></li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className="font-bold mb-3 text-sm" style={{ color: '#c89a00' }}>Légal</h4>
            <ul className="space-y-2 text-sm text-[#525252]">
              <li><Link href="/mentions-legales" className="hover:text-[#1a1a1a] transition-colors">Mentions légales</Link></li>
              <li><Link href="/confidentialite" className="hover:text-[#1a1a1a] transition-colors">Politique de confidentialité</Link></li>
              <li><Link href="/cgu" className="hover:text-[#1a1a1a] transition-colors">CGU</Link></li>
              <li><Link href="/contact" className="hover:text-[#1a1a1a] transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderColor: '#e5e5e5' }}>
          <p className="text-[#525252] text-xs">
            © {new Date().getFullYear()} QRTags. Tous droits réservés.
          </p>
          <div className="flex gap-4 text-xs text-[#525252]">
            <Link href="/cgu" className="hover:text-[#1a1a1a] transition-colors">CGU</Link>
            <Link href="/confidentialite" className="hover:text-[#1a1a1a] transition-colors">Confidentialité</Link>
            <Link href="/mentions-legales" className="hover:text-[#1a1a1a] transition-colors">Mentions légales</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Full Layout Component
interface PublicLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
  paddingTop?: string;
}

export default function PublicLayout({ 
  children, 
  showFooter = true,
  paddingTop = "pt-16"
}: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicNavigation />
      <main className={`flex-1 ${paddingTop}`}>
        {children}
      </main>
      {showFooter && <PublicFooter />}
      <RGPDConsent />
    </div>
  );
}
