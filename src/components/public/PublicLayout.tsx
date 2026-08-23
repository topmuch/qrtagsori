'use client';

import { useState, useEffect } from 'react';
import QRTagsLogo from "@/components/qrtags/QRTagsLogo";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
  QrCode,
  Menu,
  X,
  Facebook,
  Twitter,
  Instagram,
  MapPin,
  Play,
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
      <TravelerAuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </nav>
  );
}

// Footer Component (Dark but Refined)
export function PublicFooter() {
  return (
    <footer className="bg-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo */}
          <div>
            <div className="mb-4">
              <QRTagsLogo size="md" variant="dark" />
            </div>
            <p className="text-white/50 text-sm">
              Protection intelligente des bagages pour voyageurs et pèlerins.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h4 className="font-bold text-sm tracking-wider uppercase text-white/80 mb-4">Produit</h4>
            <ul className="space-y-2 text-white/50 text-sm">
              <li><a href="/#solutions" className="hover:text-white transition-colors">Solutions</a></li>
              <li><a href="/#comment" className="hover:text-white transition-colors">Comment ça marche</a></li>
              <li><a href="/#tarifs" className="hover:text-white transition-colors">Tarifs</a></li>
              <li><Link href="/demo" className="hover:text-white transition-colors">Démo</Link></li>
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <h4 className="font-bold text-sm tracking-wider uppercase text-white/80 mb-4">Entreprise</h4>
            <ul className="space-y-2 text-white/50 text-sm">
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/a-propos" className="hover:text-white transition-colors">À propos</Link></li>
              <li><Link href="/avis" className="hover:text-white transition-colors">Avis ⭐</Link></li>
              <li><Link href="/devenir-partenaire" className="hover:text-white transition-colors">Partenaires</Link></li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className="font-bold text-sm tracking-wider uppercase text-white/80 mb-4">Légal</h4>
            <ul className="space-y-2 text-white/50 text-sm">
              <li><Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link></li>
              <li><Link href="/confidentialite" className="hover:text-white transition-colors">Politique de confidentialité</Link></li>
              <li><Link href="/cgu" className="hover:text-white transition-colors">CGU</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} QRTags. Tous droits réservés.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            <a href="#" className="w-9 h-9 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg flex items-center justify-center transition-all">
              <Facebook className="w-4 h-4 text-white/50 hover:text-white transition-colors" />
            </a>
            <a href="#" className="w-9 h-9 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg flex items-center justify-center transition-all">
              <Instagram className="w-4 h-4 text-white/50 hover:text-white transition-colors" />
            </a>
            <a href="#" className="w-9 h-9 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg flex items-center justify-center transition-all">
              <Twitter className="w-4 h-4 text-white/50 hover:text-white transition-colors" />
            </a>
          </div>

          {/* Map Link */}
          <a
            href="https://maps.google.com/?q=Poissy+France"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-white text-sm flex items-center gap-1 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Nous trouver
          </a>
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
