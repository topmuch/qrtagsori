'use client'

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Luggage, 
  QrCode, 
  ArrowLeft, 
  CheckCircle,
  Camera,
  FileText,
  Sparkles
} from "lucide-react";

// TRANSPORT-FEATURE: Import transport utilities
import { useTranslation } from '@/hooks/useTranslation';
import TransportModeSelector from '@/components/inscrire/TransportModeSelector';
import type { TransportMode } from '@/lib/transport';
import { TRANSPORT_ICONS, TRANSPORT_FIELDS } from '@/lib/transport';

function InscrireContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrFromUrl = searchParams.get('qr') || '';
  
  // TRANSPORT-FEATURE: Translation hook + transport mode + step state
  const { t, lang } = useTranslation();
  const [transportMode, setTransportMode] = useState<TransportMode | ''>('');
  const [step, setStep] = useState(1);

  const [loading, setLoading] = useState(false);
  // TRANSPORT-FEATURE: Extended formData with all transport fields
  const [formData, setFormData] = useState({
    reference: '',
    firstName: '',
    lastName: '',
    destination: '',
    departureDate: '',
    departureTime: '',
    whatsapp: '',
    // TRANSPORT-FEATURE: Conditional fields (all modes)
    airlineName: '',
    flightNumber: '',
    trainCompany: '',
    trainNumber: '',
    shipName: '',
    shipCabin: '',
    busCompany: '',
    busLineNumber: '',
  });

  // Pre-fill reference from URL
  useEffect(() => {
    if (qrFromUrl) {
      setFormData(prev => ({ ...prev, reference: qrFromUrl.toUpperCase() }));
    }
  }, [qrFromUrl]);

  // TRANSPORT-FEATURE: Get dynamic fields for current transport mode
  const currentFields = transportMode ? TRANSPORT_FIELDS[transportMode] : [];

  // TRANSPORT-FEATURE: Handle transport mode selection → advance to step 2
  const handleModeSelect = (mode: TransportMode) => {
    setTransportMode(mode);
    setStep(2);
  };

  // TRANSPORT-FEATURE: Go back to mode selector
  const handleBackToMode = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transportMode) return;
    setLoading(true);

    try {
      const response = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: formData.reference.toUpperCase(),
          travelerFirstName: formData.firstName,
          travelerLastName: formData.lastName,
          whatsappOwner: formData.whatsapp,
          // TRANSPORT-FEATURE: Send transportMode + all conditional fields
          transportMode: transportMode,
          airlineName: formData.airlineName,
          flightNumber: formData.flightNumber,
          trainCompany: formData.trainCompany,
          trainNumber: formData.trainNumber,
          shipName: formData.shipName,
          shipCabin: formData.shipCabin,
          busCompany: formData.busCompany,
          busLineNumber: formData.busLineNumber,
          destination: formData.destination,
          departureDate: formData.departureDate || undefined,
          departureTime: formData.departureTime || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store activation data for success page
        sessionStorage.setItem('activationData', JSON.stringify({
          reference: formData.reference.toUpperCase(),
          firstName: formData.firstName,
          lastName: formData.lastName,
          whatsapp: formData.whatsapp,
          airlineName: formData.airlineName,
          flightNumber: formData.flightNumber,
          destination: formData.destination,
          // TRANSPORT-FEATURE: Store transportMode in session
          transportMode: transportMode,
          type: 'voyageur',
          activatedAt: new Date().toISOString(),
          expiresAt: data.baggage?.expiresAt,
        }));
        router.push('/success?type=voyageur');
      } else {
        const error = await response.json();
        alert(error.message || t('inscrire.error_activation'));
      }
    } catch (error) {
      console.error('Activation error:', error);
      alert(t('inscrire.error_activation'));
    } finally {
      setLoading(false);
    }
  };

  // TRANSPORT-FEATURE: Dynamic icon based on selected transport mode
  const TransportIcon = transportMode ? TRANSPORT_ICONS[transportMode] : '✈️';

  return (
    <main className="min-h-screen bg-[#6613e3]">
      {/* Navigation */}
      <nav className="bg-[#6613e3]/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white min-h-[48px]">
            <ArrowLeft className="w-5 h-5" />
            <span>{t('inscrire.back')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white">QRBag</span>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Welcome Banner if QR from URL */}
        {qrFromUrl && (
          <div className="mb-6 md:mb-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 md:p-6 text-center animate-fade-in shadow-xl">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#fbbf24]/20 rounded-full mb-4">
              <Sparkles className="w-7 h-7 text-[#fbbf24]" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
              {t('inscrire.welcome_title')}
            </h2>
            <p className="text-white/70 text-base md:text-lg">
              {t('inscrire.welcome_desc')}
            </p>
            <Badge className="mt-3 bg-[#f59e0b]/20 text-[#fbbf24] text-sm md:text-base">
              {t('inscrire.voyageur_badge')}
            </Badge>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8 md:mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full mb-4 md:mb-6 border border-white/20">
            <Luggage className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 md:mb-4">
            {t('inscrire.title')}
          </h1>
          <p className="text-white/85 text-base md:text-lg">
            {t('inscrire.subtitle')}
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="manual" className="mb-6 md:mb-8">
          <TabsList className="flex flex-col sm:flex-row w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl h-auto p-1 gap-1 sm:gap-0">
            <TabsTrigger 
              value="manual" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=inactive]:bg-white/10 data-[state=inactive]:text-white/70 text-white rounded-lg sm:rounded-lg min-h-[48px] text-sm md:text-base font-medium flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              {t('inscrire.manual_tab')}
            </TabsTrigger>
            <TabsTrigger 
              value="scan" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=inactive]:bg-white/10 data-[state=inactive]:text-white/70 text-white rounded-lg sm:rounded-lg min-h-[48px] text-sm md:text-base font-medium flex-1"
            >
              <Camera className="w-4 h-4 mr-2" />
              {t('inscrire.scan_tab')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="mt-6">
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl">
              <CardContent className="pt-6 text-center p-5 md:p-6">
                <div className="w-24 h-24 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/20">
                  <Camera className="w-12 h-12 text-white/60" />
                </div>
                <h3 className="text-white font-semibold text-lg md:text-xl mb-2">
                  {t('inscrire.scan_title')}
                </h3>
                <p className="text-white/60 text-base md:text-lg mb-6">
                  {t('inscrire.scan_desc')}
                </p>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold min-h-[48px] text-base md:text-lg px-6">
                  <Camera className="w-4 h-4 mr-2" />
                  {t('inscrire.scan_button')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual">
            {/* Form Card - Glassmorphism */}
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl">
              {/* TRANSPORT-FEATURE: Dynamic CardHeader with transport icon */}
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
                  <span>{TransportIcon}</span>
                  {t('transport.traveler_info')}
                </CardTitle>
                {/* TRANSPORT-FEATURE: Step indicator */}
                <p className="text-white/60 text-sm mt-1">
                  {step === 1 ? t('inscrire.step_1_subtitle') : t('inscrire.step_2_subtitle')}
                </p>
              </CardHeader>
              <CardContent className="p-5 md:p-6">

                {/* TRANSPORT-FEATURE: Step 1 — Transport Mode Selector */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div className="text-center mb-4">
                      <h3 className="text-white font-semibold text-lg md:text-xl mb-1">
                        {t('transport.select_mode')}
                      </h3>
                      <p className="text-white/60 text-sm md:text-base">
                        {t('transport.select_mode_desc')}
                      </p>
                    </div>
                    <TransportModeSelector
                      selectedMode={transportMode}
                      onSelect={handleModeSelect}
                      t={t}
                      lang={lang}
                    />
                    {/* TRANSPORT-FEATURE: Continue button (disabled until mode selected) */}
                    <Button
                      type="button"
                      disabled={!transportMode}
                      onClick={() => transportMode && setStep(2)}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-white/10 disabled:text-white/40 text-white font-semibold min-h-[48px] text-base md:text-lg rounded-xl"
                    >
                      {t('inscrire.next_step')}
                    </Button>
                  </div>
                )}

                {/* TRANSPORT-FEATURE: Step 2 — Form fields */}
                {step === 2 && (
                  <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                    {/* TRANSPORT-FEATURE: Back to mode selector */}
                    <button
                      type="button"
                      onClick={handleBackToMode}
                      className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm min-h-[44px]"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      {t('inscrire.back_step')}
                    </button>

                    {/* TRANSPORT-FEATURE: Mode indicator badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{TRANSPORT_ICONS[transportMode]}</span>
                      <Badge className="bg-white/10 text-white/90 border border-white/20 text-sm">
                        {t(`transport.mode_${transportMode}`)}
                      </Badge>
                    </div>

                    {/* QR Reference */}
                    <div className="space-y-2">
                      <Label htmlFor="reference" className="text-white text-sm md:text-base font-medium">
                        {t('inscrire.reference_label')}
                      </Label>
                      <Input
                        id="reference"
                        placeholder={t('inscrire.reference_placeholder')}
                        value={formData.reference}
                        onChange={(e) => setFormData({ ...formData, reference: e.target.value.toUpperCase() })}
                        className={`bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-orange-400 focus:border-transparent min-h-[48px] text-base md:text-lg font-mono ${qrFromUrl ? 'border-[#fbbf24]/50 bg-[#fbbf24]/5' : ''}`}
                        required
                        readOnly={!!qrFromUrl}
                      />
                      <p className="text-white/60 text-sm md:text-base">
                        {qrFromUrl 
                          ? t('inscrire.reference_detected') 
                          : t('inscrire.reference_hint')}
                      </p>
                    </div>

                    {/* Name Fields - Responsive Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-white text-sm md:text-base font-medium">
                          {t('inscrire.first_name_label')}
                        </Label>
                        <Input
                          id="firstName"
                          placeholder={t('inscrire.first_name_placeholder')}
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-orange-400 focus:border-transparent min-h-[48px] text-base md:text-lg"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-white text-sm md:text-base font-medium">
                          {t('inscrire.last_name_label')}
                        </Label>
                        <Input
                          id="lastName"
                          placeholder={t('inscrire.last_name_placeholder')}
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-orange-400 focus:border-transparent min-h-[48px] text-base md:text-lg"
                          required
                        />
                      </div>
                    </div>

                    {/* TRANSPORT-FEATURE: Dynamic conditional fields based on selected transport mode */}
                    {currentFields.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentFields.map((field) => (
                          <div key={field.key} className="space-y-2">
                            <Label htmlFor={field.key} className="text-white text-sm md:text-base font-medium">
                              {t(field.labelKey)}
                            </Label>
                            <Input
                              id={field.key}
                              placeholder={t(field.placeholderKey)}
                              value={(formData as Record<string, string>)[field.key] || ''}
                              onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                              className="bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-orange-400 focus:border-transparent min-h-[48px] text-base md:text-lg"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Destination - Universal field */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="destination" className="text-white text-sm md:text-base font-medium">
                          {t('inscrire.destination_label')}
                        </Label>
                        <Input
                          id="destination"
                          placeholder={t('inscrire.destination_placeholder')}
                          value={formData.destination}
                          onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                          className="bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-orange-400 focus:border-transparent min-h-[48px] text-base md:text-lg"
                        />
                      </div>
                    </div>

                    {/* Departure Date & Time - Universal fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="departureDate" className="text-white text-sm md:text-base font-medium">
                          {t('inscrire.departure_date_label')}
                        </Label>
                        <Input
                          id="departureDate"
                          type="date"
                          value={formData.departureDate}
                          onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                          className="bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-orange-400 focus:border-transparent min-h-[48px] text-base md:text-lg [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="departureTime" className="text-white text-sm md:text-base font-medium">
                          {t('inscrire.departure_time_label')}
                        </Label>
                        <Input
                          id="departureTime"
                          type="time"
                          value={formData.departureTime}
                          onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                          className="bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-orange-400 focus:border-transparent min-h-[48px] text-base md:text-lg [color-scheme:dark]"
                        />
                      </div>
                    </div>

                    {/* WhatsApp - Universal field */}
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp" className="text-white text-sm md:text-base font-medium">
                        {t('inscrire.whatsapp_label')}
                      </Label>
                      <Input
                        id="whatsapp"
                        type="tel"
                        placeholder={t('inscrire.whatsapp_placeholder')}
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        className="bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-orange-400 focus:border-transparent min-h-[48px] text-base md:text-lg"
                        required
                      />
                      <p className="text-white/60 text-sm md:text-base">
                        {t('inscrire.whatsapp_hint')}
                      </p>
                    </div>

                    {/* Info Box - Glassmorphism */}
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 md:p-5 space-y-2">
                      <div className="flex items-center gap-2 text-white">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm md:text-base font-medium">{t('inscrire.protection_title')}</span>
                      </div>
                      <p className="text-white/60 text-sm md:text-base">
                        {t('inscrire.protection_desc')}
                      </p>
                    </div>

                    {/* Submit Button - TRANSPORT-FEATURE: disabled if no transportMode */}
                    <Button
                      type="submit"
                      disabled={loading || !transportMode}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-white/10 disabled:text-white/40 text-white font-semibold min-h-[48px] text-base md:text-lg rounded-xl"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {t('inscrire.submit_loading')}
                        </span>
                      ) : (
                        t('inscrire.submit')
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-white/60 text-sm md:text-base">
            {t('inscrire.no_qr')}{' '}
            <Link href="/#pricing" className="text-white underline">
              {t('inscrire.order_sticker')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function InscrirePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#6613e3] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
          <p className="text-base md:text-lg">Chargement...</p>
        </div>
      </main>
    }>
      <InscrireContent />
    </Suspense>
  );
}
