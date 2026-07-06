'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from '@/hooks/use-toast';
import {
  DEFAULT_CHECKLIST_CATEGORIES,
} from '@/lib/checklist-catalog';
import {
  Plane,
  Calendar,
  Globe,
  User,
  Mail,
  Package,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Lock,
  Download,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

const BRAND = '#c5a643';
const INK = '#1a1a1a';
const CREAM = '#FDFBF7';

interface SelectedItem {
  category: string;
  name: string;
  qty: number;
}

export default function ChecklistPage() {
  const { t, lang, dir } = useTranslation();
  const searchParams = useSearchParams();
  const refParam = searchParams.get('ref');
  const sourceParam = searchParams.get('source');

  // ─── Form state ───
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [airline, setAirline] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItem>>({});
  const [activeCategory, setActiveCategory] = useState<string>(DEFAULT_CHECKLIST_CATEGORIES[0].id);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    code: string;
    publicUrl: string;
    verificationKey: string;
    emailSent: boolean;
  } | null>(null);

  const selectedList = useMemo(() => Object.values(selectedItems), [selectedItems]);
  const selectedCount = selectedList.length;

  // Toggle an item
  const toggleItem = useCallback((category: string, name: string) => {
    const key = `${category}__${name}`;
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = { category, name, qty: 1 };
      }
      return next;
    });
  }, []);

  // Change quantity
  const changeQty = useCallback((category: string, name: string, delta: number) => {
    const key = `${category}__${name}`;
    setSelectedItems((prev) => {
      const item = prev[key];
      if (!item) return prev;
      const newQty = Math.max(1, Math.min(99, item.qty + delta));
      return { ...prev, [key]: { ...item, qty: newQty } };
    });
  }, []);

  // Select/unselect all items in current category
  const toggleCategoryAll = useCallback((categoryId: string) => {
    const cat = DEFAULT_CHECKLIST_CATEGORIES.find((c) => c.id === categoryId);
    if (!cat) return;
    const allSelected = cat.items.every((name) => selectedItems[`${categoryId}__${name}`]);
    setSelectedItems((prev) => {
      const next = { ...prev };
      for (const name of cat.items) {
        const key = `${categoryId}__${name}`;
        if (allSelected) {
          delete next[key];
        } else {
          next[key] = { category: categoryId, name, qty: 1 };
        }
      }
      return next;
    });
  }, [selectedItems]);

  // ─── Submit ───
  const handleSubmit = useCallback(async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !departureDate || !destinationCountry.trim()) {
      toast({ title: t('checklist.need_fields'), variant: 'destructive' });
      return;
    }
    if (selectedCount === 0) {
      toast({ title: t('checklist.need_items'), variant: 'destructive' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: t('checklist.need_fields'), variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          departureDate,
          destinationCountry: destinationCountry.trim(),
          airline: airline.trim() || null,
          items: selectedList.map((it) => ({ ...it, checked: true })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || t('checklist.error'));
      }
      setSuccess({
        code: data.code,
        publicUrl: data.publicUrl,
        verificationKey: data.verificationKey,
        emailSent: data.emailSent !== false,
      });
      toast({ title: t('checklist.success_title') });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('checklist.error');
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [firstName, lastName, email, departureDate, destinationCountry, airline, selectedList, selectedCount, t]);

  // ─── Success screen ───
  if (success) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] flex flex-col" dir={dir}>
        <header className="sticky top-0 z-30 bg-white border-b-2 border-[#1a1a1a] px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🎒</span>
              <span className="font-bold text-[#1a1a1a] text-lg">QRBag</span>
            </Link>
            <LanguageSelector />
          </div>
        </header>

        <section className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
          <div className="bg-white border-2 border-solid border-[#1a1a1a] rounded-2xl p-6 md:p-8 shadow-lg">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-[#c5a643] flex items-center justify-center border-2 border-[#1a1a1a]">
                <CheckCircle2 className="w-9 h-9 text-[#1a1a1a]" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[#1a1a1a] text-center mb-2">
              {t('checklist.success_title')}
            </h1>
            <p className="text-center text-[#1a1a1a]/70 mb-6">
              {t('checklist.success_desc')}
            </p>

            <div className="bg-[#fffbe6] border-2 border-dashed border-[#1a1a1a] rounded-xl p-4 mb-3">
              <div className="text-xs uppercase tracking-widest text-[#1a1a1a]/60 mb-1">{t('checklist.success_code')}</div>
              <div className="font-mono font-bold text-xl text-[#1a1a1a]">{success.code}</div>
            </div>

            <div className="bg-[#fef2f2] border-2 border-[#c0392b] rounded-xl p-4 mb-3">
              <div className="text-xs uppercase tracking-widest text-[#c0392b] mb-1 flex items-center gap-1">
                <Lock className="w-3 h-3" /> {t('checklist.success_key')}
              </div>
              <div className="font-mono font-bold text-2xl text-[#c0392b] tracking-widest">{success.verificationKey}</div>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6">
              <div className="text-xs uppercase tracking-widest text-[#c5a643] mb-1">{t('checklist.success_url')}</div>
              <div className="text-white text-sm font-mono break-all">{success.publicUrl}</div>
            </div>

            <div className="flex flex-col gap-2.5">
              <Link
                href={`/checklist/${success.code}`}
                className="w-full py-3 px-4 bg-[#c5a643] hover:bg-[#b59633] text-[#1a1a1a] rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-[#1a1a1a] transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {t('checklist.view_public_page')}
              </Link>
              <button
                onClick={() => {
                  setSuccess(null);
                  setFirstName('');
                  setLastName('');
                  setEmail('');
                  setDepartureDate('');
                  setDestinationCountry('');
                  setAirline('');
                  setSelectedItems({});
                }}
                className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-[#1a1a1a] rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-[#1a1a1a] transition-colors"
              >
                {t('checklist.create_another')}
              </button>
            </div>

            {!success.emailSent && (
              <p className="text-xs text-amber-700 text-center mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                ⚠️ L'email n'a pas pu être envoyé automatiquement. Notez votre clé de vérification et l'URL publique ci-dessus.
              </p>
            )}
          </div>
        </section>

        <footer className="bg-[#1a1a1a] text-[#c5a643] text-center py-3 mt-auto">
          <p className="text-xs">QRBag — Protection intelligente des bagages • qrbags.com</p>
        </footer>
      </main>
    );
  }

  // ─── Form screen ───
  const activeCat = DEFAULT_CHECKLIST_CATEGORIES.find((c) => c.id === activeCategory) || DEFAULT_CHECKLIST_CATEGORIES[0];
  const allCatSelected = activeCat.items.every((name) => selectedItems[`${activeCat.id}__${name}`]);

  return (
    <main className="min-h-screen bg-[#FDFBF7] flex flex-col" dir={dir}>
      <header className="sticky top-0 z-30 bg-white border-b-2 border-[#1a1a1a] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎒</span>
            <span className="font-bold text-[#1a1a1a] text-lg">QRBag</span>
          </Link>
          <LanguageSelector />
        </div>
      </header>

      <section className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <div className="text-center mb-6">
          <div className="inline-block bg-[#c5a643] text-[#1a1a1a] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border-2 border-[#1a1a1a] mb-3">
            {refParam && sourceParam === 'tracking_page' ? '✨ Checklist gratuite' : '✨ Service gratuit QRBag'}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] mb-2">
            {t('checklist.title')}
          </h1>
          <p className="text-[#1a1a1a]/70 text-sm">{t('checklist.subtitle')}</p>
        </div>

        {/* STEP 1 */}
        <div className="bg-white border-2 border-solid border-[#1a1a1a] rounded-2xl p-5 md:p-6 mb-4 shadow-md">
          <h2 className="flex items-center gap-2 text-[#1a1a1a] font-bold text-base mb-4">
            <span className="w-7 h-7 rounded-full bg-[#c5a643] border-2 border-[#1a1a1a] flex items-center justify-center text-xs font-bold">1</span>
            <User className="w-4 h-4" />
            {t('checklist.step_passenger')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#1a1a1a]/70 mb-1 block">{t('checklist.first_name')} *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FDFBF7] border-2 border-[#1a1a1a] rounded-xl text-[#1a1a1a] text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a643] min-h-[44px]"
                placeholder="Aïssatou"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#1a1a1a]/70 mb-1 block">{t('checklist.last_name')} *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FDFBF7] border-2 border-[#1a1a1a] rounded-xl text-[#1a1a1a] text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a643] min-h-[44px]"
                placeholder="Diallo"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-[#1a1a1a]/70 mb-1 block flex items-center gap-1">
                <Mail className="w-3 h-3" /> {t('checklist.email')} *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FDFBF7] border-2 border-[#1a1a1a] rounded-xl text-[#1a1a1a] text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a643] min-h-[44px]"
                placeholder="aissatou@email.com"
              />
              <p className="text-[10px] text-[#1a1a1a]/60 mt-1">{t('checklist.email_hint')}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-[#1a1a1a]/70 mb-1 block flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {t('checklist.departure_date')} *
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FDFBF7] border-2 border-[#1a1a1a] rounded-xl text-[#1a1a1a] text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a643] min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#1a1a1a]/70 mb-1 block flex items-center gap-1">
                <Globe className="w-3 h-3" /> {t('checklist.destination_country')} *
              </label>
              <input
                type="text"
                value={destinationCountry}
                onChange={(e) => setDestinationCountry(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FDFBF7] border-2 border-[#1a1a1a] rounded-xl text-[#1a1a1a] text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a643] min-h-[44px]"
                placeholder="France"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-[#1a1a1a]/70 mb-1 block flex items-center gap-1">
                <Plane className="w-3 h-3" /> {t('checklist.airline')}
              </label>
              <input
                type="text"
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FDFBF7] border-2 border-[#1a1a1a] rounded-xl text-[#1a1a1a] text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a643] min-h-[44px]"
                placeholder={t('checklist.airline_placeholder')}
              />
            </div>
          </div>
        </div>

        {/* STEP 2 */}
        <div className="bg-white border-2 border-solid border-[#1a1a1a] rounded-2xl p-5 md:p-6 mb-4 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-[#1a1a1a] font-bold text-base">
              <span className="w-7 h-7 rounded-full bg-[#c5a643] border-2 border-[#1a1a1a] flex items-center justify-center text-xs font-bold">2</span>
              <Package className="w-4 h-4" />
              {t('checklist.step_items')}
            </h2>
            <span className="text-xs font-bold text-[#1a1a1a] bg-[#c5a643] px-2 py-1 rounded-full border border-[#1a1a1a]">
              {t('checklist.items_count', { count: selectedCount })}
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
            {DEFAULT_CHECKLIST_CATEGORIES.map((cat) => {
              const isActive = cat.id === activeCategory;
              const catSelectedCount = cat.items.filter((name) => selectedItems[`${cat.id}__${name}`]).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold border-2 transition-colors ${
                    isActive
                      ? 'bg-[#c5a643] border-[#1a1a1a] text-[#1a1a1a]'
                      : 'bg-white border-[#1a1a1a]/20 text-[#1a1a1a]/70 hover:border-[#1a1a1a]'
                  }`}
                >
                  <span className="mr-1">{cat.emoji}</span>
                  {cat.label[lang as keyof typeof cat.label] || cat.label.fr}
                  {catSelectedCount > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-[#1a1a1a] text-[#c5a643] rounded-full text-[10px]">
                      {catSelectedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => toggleCategoryAll(activeCat.id)}
            className="text-xs font-bold text-[#1a1a1a] underline mb-3 hover:text-[#c5a643]"
          >
            {allCatSelected ? t('checklist.unselect_all') : t('checklist.select_all')}
          </button>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {activeCat.items.map((name) => {
              const key = `${activeCat.id}__${name}`;
              const isSelected = !!selectedItems[key];
              return (
                <button
                  key={key}
                  onClick={() => toggleItem(activeCat.id, name)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'bg-[#fffbe6] border-[#c5a643] shadow-sm'
                      : 'bg-[#FDFBF7] border-[#1a1a1a]/15 hover:border-[#1a1a1a]/40'
                  }`}
                >
                  <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isSelected ? 'bg-[#c5a643] border-[#1a1a1a]' : 'bg-white border-[#1a1a1a]/30'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#1a1a1a]" />}
                  </div>
                  <span className="text-xs font-medium text-[#1a1a1a]">{name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 3 */}
        {selectedCount > 0 && (
          <div className="bg-[#1a1a1a] text-white border-2 border-solid border-[#1a1a1a] rounded-2xl p-5 md:p-6 mb-4 shadow-md">
            <h2 className="flex items-center gap-2 font-bold text-base mb-3">
              <span className="w-7 h-7 rounded-full bg-[#c5a643] border-2 border-white flex items-center justify-center text-xs font-bold text-[#1a1a1a]">3</span>
              <Package className="w-4 h-4" />
              {t('checklist.step_selection')} ({selectedCount})
            </h2>
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {DEFAULT_CHECKLIST_CATEGORIES.map((cat) => {
                const catItems = selectedList.filter((it) => it.category === cat.id);
                if (catItems.length === 0) return null;
                return (
                  <div key={cat.id}>
                    <div className="text-[10px] uppercase tracking-wider text-[#c5a643] font-bold mt-2 mb-1">
                      {cat.emoji} {cat.label[lang as keyof typeof cat.label] || cat.label.fr}
                    </div>
                    {catItems.map((it) => {
                      const key = `${it.category}__${it.name}`;
                      return (
                        <div key={key} className="flex items-center justify-between py-1.5 px-2 bg-white/5 rounded-md">
                          <span className="text-xs">{it.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-white/10 rounded">
                              <button
                                onClick={() => changeQty(it.category, it.name, -1)}
                                className="w-6 h-6 flex items-center justify-center text-[#c5a643] hover:bg-white/10 rounded-l"
                              >
                                −
                              </button>
                              <span className="text-xs font-bold w-5 text-center">{it.qty}</span>
                              <button
                                onClick={() => changeQty(it.category, it.name, 1)}
                                className="w-6 h-6 flex items-center justify-center text-[#c5a643] hover:bg-white/10 rounded-r"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => toggleItem(it.category, it.name)}
                              className="text-red-400 hover:text-red-300 text-xs"
                              aria-label={t('checklist.remove')}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || selectedCount === 0}
          className="w-full py-4 px-6 bg-[#c5a643] hover:bg-[#b59633] text-[#1a1a1a] rounded-xl font-bold text-base md:text-lg transition-colors flex items-center justify-center gap-2 border-2 border-[#1a1a1a] shadow-md disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px]"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('checklist.submitting')}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              {t('checklist.submit')}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="mt-6 text-center text-xs text-[#1a1a1a]/60">
          <p>🔒 Vos données restent confidentielles • 📧 PDF envoyé par email • ✅ Attestation horodatée</p>
        </div>
      </section>

      <footer className="bg-[#1a1a1a] text-[#c5a643] text-center py-3 mt-auto">
        <p className="text-xs">QRBag — Protection intelligente des bagages • qrbags.com</p>
      </footer>
    </main>
  );
}
