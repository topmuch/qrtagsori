'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QrCode, RefreshCw, CheckCircle, User, Building2, Package,
  AlertCircle, Shield, Loader2, Upload, Download, FileText,
  Ruler, Image, Eye, Palette, Archive,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────

interface Agency {
  id: string; name: string; slug: string; email: string | null;
  phone: string | null; active: boolean; createdAt: string;
}

type StickerSize = 2 | 4 | 5 | 6 | 7 | 10 | 12 | 15;

interface TemplateInfo {
  exists: boolean; width: number; height: number;
  format: string; size: number;
}

// ─── Constants ─────────────────────────────────────────────────────

const SIZES: { value: StickerSize; label: string; gridInfo: string }[] = [
  { value: 2,  label: '2 × 2 cm',  gridInfo: '~126 par page A4' },
  { value: 4,  label: '4 × 4 cm',  gridInfo: '~28 par page A4' },
  { value: 5,  label: '5 × 5 cm',  gridInfo: '~16 par page A4' },
  { value: 6,  label: '6 × 6 cm',  gridInfo: '~11 par page A4' },
  { value: 7,  label: '7 × 7 cm',  gridInfo: '~8 par page A4' },
  { value: 10, label: '10 × 10 cm', gridInfo: '~4 par page A4' },
  { value: 12, label: '12 × 12 cm', gridInfo: '~2 par page A4' },
  { value: 15, label: '15 × 15 cm', gridInfo: '~1 par page A4' },
];

const QUICK_QTYS = [10, 25, 50, 100];

// ─── Page Component ────────────────────────────────────────────────

export default function GenererQRPage() {
  const [activeTab, setActiveTab] = useState<'classic' | 'design'>('design');

  // Shared state
  const [agencies, setAgencies] = useState<Agency[]>([]);

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    try {
      const res = await fetch('/api/admin/agencies');
      const data = await res.json();
      setAgencies(data.agencies || []);
    } catch (e) {
      console.error('Error fetching agencies:', e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Génération QRTags</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Générez des étiquettes QR avec ou sans design personnalisé</p>
      </div>

      {/* Tab Switcher */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'classic' | 'design')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="design" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Avec Design
          </TabsTrigger>
          <TabsTrigger value="classic" className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            Classique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="design">
          <DesignGeneration agencies={agencies} />
        </TabsContent>

        <TabsContent value="classic">
          <ClassicGeneration agencies={agencies} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// DESIGN GENERATION COMPONENT
// ═══════════════════════════════════════════════════════════════════════

function DesignGeneration({ agencies }: { agencies: Agency[] }) {
  // Template state
  const [templateInfo, setTemplateInfo] = useState<TemplateInfo | null>(null);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generation state
  const [agencyId, setAgencyId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [sizeCm, setSizeCm] = useState<StickerSize>(4);
  const [generating, setGenerating] = useState(false);
  const [references, setReferences] = useState<string[]>([]);

  // Export state
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingZip, setExportingZip] = useState(false);

  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Load template info on mount
  useEffect(() => {
    loadTemplateInfo();
  }, []);

  // Auto-preview when we have a reference and template
  useEffect(() => {
    if (references.length > 0 && templateInfo?.exists) {
      loadPreview(references[0]);
    } else {
      setPreviewUrl(null);
    }
  }, [references, templateInfo?.exists, sizeCm]);

  const loadTemplateInfo = async () => {
    setTemplateLoading(true);
    try {
      const res = await fetch('/api/admin/qr-design/upload');
      const data = await res.json();
      setTemplateInfo(data.template);
    } catch {
      setTemplateInfo(null);
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('template', file);

    try {
      const res = await fetch('/api/admin/qr-design/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg('Template de design enregistré !');
        setTemplateInfo(data.template);
      } else {
        setErrorMsg(data.error || "Erreur lors de l'upload");
      }
    } catch {
      setErrorMsg("Erreur lors de l'upload du template.");
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!templateInfo?.exists) {
      setErrorMsg('Veuillez d\'abord uploader un template de design.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setGenerating(true);

    try {
      const res = await fetch('/api/admin/qr-design/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId: agencyId && agencyId !== '__none__' ? agencyId : undefined,
          quantity,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setReferences(data.references || []);
        setSuccessMsg(`${data.generated} QR code(s) généré(s) avec succès !`);
      } else {
        setErrorMsg(data.error || 'Erreur lors de la génération.');
      }
    } catch {
      setErrorMsg('Erreur lors de la génération.');
    } finally {
      setGenerating(false);
    }
  };

  const loadPreview = async (ref: string) => {
    setPreviewLoading(true);
    try {
      const url = `/api/admin/qr-design/preview?reference=${ref}&sizeCm=${sizeCm}`;
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return objectUrl;
        });
      }
    } catch {
      // Silent fail for preview
    } finally {
      setPreviewLoading(false);
    }
  };

  const downloadFile = async (url: string, filename: string) => {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ references, sizeCm }) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur' }));
      setErrorMsg(err.error || "Erreur lors de l'export.");
      return;
    }
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  };

  const handleExportPdf = async () => {
    if (references.length === 0) return;
    setExportingPdf(true);
    setErrorMsg('');
    try {
      const date = new Date().toISOString().slice(0, 10);
      await downloadFile('/api/admin/qr-design/export-pdf', `QRTags-Design-${sizeCm}cm-${references.length}QR-${date}.pdf`);
      setSuccessMsg(`PDF exporté avec ${references.length} QR codes en grille A4 !`);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportZip = async () => {
    if (references.length === 0) return;
    setExportingZip(true);
    setErrorMsg('');
    try {
      const date = new Date().toISOString().slice(0, 10);
      await downloadFile('/api/admin/qr-design/export-zip', `QRTags-Design-${sizeCm}cm-${references.length}QR-${date}.zip`);
      setSuccessMsg(`ZIP exporté avec ${references.length} PNG haute résolution !`);
    } finally {
      setExportingZip(false);
    }
  };

  const hasTemplate = templateInfo?.exists ?? false;
  const canExport = references.length > 0 && hasTemplate;

  return (
    <div className="space-y-6">
      {/* ─── Step 1: Upload Template ─── */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">1</div>
            Template de Design
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {hasTemplate ? (
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">Template configuré</p>
                  <p className="text-sm text-slate-500">
                    {templateInfo!.width}×{templateInfo!.height}px • {templateInfo!.format.toUpperCase()}
                    • {(templateInfo!.size / 1024).toFixed(0)} Ko
                  </p>
                </div>
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-1" /> Remplacer
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <Image className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">Aucun template</p>
                  <p className="text-sm text-slate-500">Uploadez un design PNG (carré, fond transparent)</p>
                </div>
                <Button
                  className="ml-auto bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-1" /> Uploader le design
                </Button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
        </CardContent>
      </Card>

      {/* ─── Step 2: Configure & Generate ─── */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">2</div>
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Agency Selection */}
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">Agence (optionnel)</Label>
            <Select value={agencyId} onValueChange={setAgencyId}>
              <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder="Sans agence (stock général)" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900">
                <SelectItem value="__none__">Sans agence (stock général)</SelectItem>
                {agencies.filter((a) => a.active).map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">
              Nombre de QR codes <span className="text-slate-400 font-normal">(max 100)</span>
            </Label>
            <div className="flex gap-2 items-center">
              <Input
                type="number" min={1} max={100} value={quantity}
                onChange={(e) => setQuantity(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-28 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
              <div className="flex gap-1.5 flex-wrap">
                {QUICK_QTYS.map((q) => (
                  <button
                    key={q} onClick={() => setQuantity(q)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      quantity === q
                        ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}
                  >{q}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Size Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Ruler className="w-4 h-4" />
              Taille du sticker (cercle complet)
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {SIZES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSizeCm(s.value)}
                  className={cn(
                    'relative p-4 rounded-xl border-2 transition-all text-center',
                    sizeCm === s.value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  )}
                >
                  <div className={cn(
                    'text-2xl font-bold',
                    sizeCm === s.value ? 'text-orange-600' : 'text-slate-700 dark:text-slate-300'
                  )}>
                    {s.value} cm
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{s.gridInfo}</div>
                  {sizeCm === s.value && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white rounded-xl h-12 text-base font-semibold shadow-lg"
            onClick={handleGenerate}
            disabled={generating || !hasTemplate}
          >
            {generating ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Génération en cours...</>
            ) : (
              <><QrCode className="w-5 h-5 mr-2" /> Générer {quantity} QR code(s)</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ─── Messages ─── */}
      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      {/* ─── Step 3: Preview & Export ─── */}
      {references.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">3</div>
              Aperçu & Export
              <Badge variant="secondary" className="ml-2">{references.length} QR</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Preview */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-slate-500 font-medium">Aperçu — {sizeCm} × {sizeCm} cm</p>
              <div className="relative w-48 h-48 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-lg">
                {previewLoading && (
                  <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                  </div>
                )}
                {previewUrl && (
                  <img src={previewUrl} alt="Aperçu QR" className="w-full h-full object-cover" />
                )}
              </div>
              <p className="text-xs font-mono text-slate-400">{references[0]}</p>
              {/* Preview navigation */}
              {references.length > 1 && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => loadPreview(references[0])}>
                    <Eye className="w-3 h-3 mr-1" /> Premier
                  </Button>
                  <span className="text-xs text-slate-400">1/{references.length}</span>
                </div>
              )}
            </div>

            {/* References list (scrollable) */}
            <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <div className="flex flex-wrap gap-1.5">
                {references.map((ref, i) => (
                  <Badge key={ref} variant="outline" className="font-mono text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => loadPreview(ref)}>
                    {ref}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Export Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="h-12 bg-slate-800 hover:bg-slate-900 text-white rounded-xl"
                onClick={handleExportPdf}
                disabled={exportingPdf || !canExport}
              >
                {exportingPdf ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> PDF en cours...</>
                ) : (
                  <><FileText className="w-5 h-5 mr-2" /> Télécharger PDF</>
                )}
              </Button>
              <Button
                className="h-12 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white rounded-xl"
                onClick={handleExportZip}
                disabled={exportingZip || !canExport}
              >
                {exportingZip ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> ZIP en cours...</>
                ) : (
                  <><Download className="w-5 h-5 mr-2" /> Télécharger ZIP</>
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-400 text-center">
              PDF = Grille A4 prête à imprimer • ZIP = PNG haute résolution (600 DPI) individuels
            </p>
          </CardContent>
        </Card>
      )}

      {/* ─── Empty State (no template) ─── */}
      {!hasTemplate && !templateLoading && (
        <div className="text-center py-12 px-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700">
          <Palette className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Commencez par uploader votre design</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Votre design circulaire en PNG (avec fond transparent) servira de template
            pour générer les QR codes personnalisés.
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CLASSIC GENERATION COMPONENT (original code preserved)
// ═══════════════════════════════════════════════════════════════════════

function ClassicGeneration({ agencies }: { agencies: Agency[] }) {
  const [loading] = useState(false);
  const [qrGenerating, setQrGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastGeneratedRefs, setLastGeneratedRefs] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const [context, setContext] = useState<'individual' | 'agency'>('agency');
  const [individualForm, setIndividualForm] = useState({
    firstName: '', lastName: '', whatsapp: '', duration: '1y' as '1y', productType: 'laptop',
  });
  const [agencyForm, setAgencyForm] = useState({
    type: 'qrtags' as 'hajj' | 'qrtags', agencyId: '', travelerCount: 1, productType: 'laptop',
  });

  const getQrCount = () => context === 'individual' ? 1 : agencyForm.travelerCount;

  const handleExportGenerated = async () => {
    if (lastGeneratedRefs.length === 0) return;
    setIsExporting(true);
    try {
      const QRCode = (await import('qrcode')).default;
      const baseUrl = window.location.origin;
      for (let i = 0; i < lastGeneratedRefs.length; i++) {
        const ref = lastGeneratedRefs[i];
        const targetUrl = `${baseUrl}/scan/${ref}`;
        const dataUrl = await QRCode.toDataURL(targetUrl, {
          errorCorrectionLevel: 'H', margin: 2, width: 512,
          color: { dark: '#111111', light: '#E3B23C' },
        });
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `QRTags-${ref}.png`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        await new Promise((r) => setTimeout(r, 300));
      }
      setSuccessMessage(`${lastGeneratedRefs.length} QR codes exportés en PNG`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch {
      setErrorMessage("Erreur lors de l'export des QR codes");
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateQR = async () => {
    setErrorMessage('');
    if (context === 'individual') {
      if (!individualForm.firstName.trim()) { setErrorMessage('Le prénom est requis'); return; }
      if (!individualForm.lastName.trim()) { setErrorMessage('Le nom est requis'); return; }
      if (!individualForm.whatsapp.trim()) { setErrorMessage('Le WhatsApp est requis'); return; }
    } else {
      if (!agencyForm.agencyId) { setErrorMessage('Sélectionnez une agence'); return; }
    }
    setQrGenerating(true);
    try {
      const payload = context === 'individual'
        ? { context: 'individual', firstName: individualForm.firstName.trim(), lastName: individualForm.lastName.trim(), whatsapp: individualForm.whatsapp.trim(), duration: '1y', baggageCount: 1 }
        : { context: 'agency', type: agencyForm.type, agencyId: agencyForm.agencyId, travelerCount: agencyForm.travelerCount, count: 1 };
      const response = await fetch('/api/admin/baggages/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage(`${data.generated} tag(s) généré(s) !`);
        setLastGeneratedRefs(data.references || []);
        setTimeout(() => { setSuccessMessage(''); setLastGeneratedRefs([]); }, 10000);
      } else {
        setErrorMessage(data.error || 'Erreur lors de la génération');
      }
    } catch {
      setErrorMessage('Erreur lors de la génération');
    } finally {
      setQrGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && lastGeneratedRefs.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-600/10 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-4 rounded-xl">
          <div className="flex items-center gap-2 mb-3"><CheckCircle className="w-5 h-5" /><span className="font-medium">{successMessage}</span></div>
          <div className="flex gap-2">
            <button onClick={handleExportGenerated} disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1e7e34] to-[#0d5e34] text-white rounded-lg text-sm shadow-lg disabled:opacity-50">
              {isExporting ? <><Loader2 className="w-4 h-4 animate-spin" />Export...</> : <><Archive className="w-4 h-4" />Exporter en ZIP</>}
            </button>
            <a href="/admin/qrcodes" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
              <QrCode className="w-4 h-4" />Voir tous les QR
            </a>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-600" /> {context === 'individual' ? 'Tag individuel' : 'Lot pour agence'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Context Selector */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setContext('individual')}
                className={cn('flex items-center gap-2 p-3 rounded-xl border transition-all text-sm',
                  context === 'individual' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300')}
              ><User className="w-4 h-4" /> Individuel</button>
              <button onClick={() => setContext('agency')}
                className={cn('flex items-center gap-2 p-3 rounded-xl border transition-all text-sm',
                  context === 'agency' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300')}
              ><Building2 className="w-4 h-4" /> Agence</button>
            </div>

            {context === 'individual' ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label className="text-xs">Prénom *</Label><Input value={individualForm.firstName} onChange={(e) => setIndividualForm({...individualForm, firstName: e.target.value})} placeholder="Ahmed" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Nom *</Label><Input value={individualForm.lastName} onChange={(e) => setIndividualForm({...individualForm, lastName: e.target.value})} placeholder="Diop" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" /></div>
                </div>
                <div className="space-y-1.5"><Label className="text-xs">WhatsApp *</Label><Input value={individualForm.whatsapp} onChange={(e) => setIndividualForm({...individualForm, whatsapp: e.target.value})} placeholder="+33612345678" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" /></div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Agence *</Label>
                  <Select value={agencyForm.agencyId} onValueChange={(v) => setAgencyForm({...agencyForm, agencyId: v})}>
                    <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900">
                      {agencies.filter(a => a.active).map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs">Nombre</Label>
                  <Input type="number" min={1} max={1000} value={agencyForm.travelerCount} onChange={(e) => setAgencyForm({...agencyForm, travelerCount: parseInt(e.target.value) || 1})} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
                </div>
              </>
            )}

            {errorMessage && <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 text-rose-600 px-3 py-2 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{errorMessage}</div>}
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl" onClick={handleGenerateQR} disabled={qrGenerating}>
              <RefreshCw className={cn('w-4 h-4 mr-2', qrGenerating && 'animate-spin')} /> {qrGenerating ? 'Génération...' : `Générer ${getQrCount()} tag(s)`}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-white flex items-center gap-2"><Package className="w-5 h-5" /> Résumé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">QR à générer</span><Badge variant="secondary" className="text-lg font-bold">{getQrCount()}</Badge></div>
              <div className="flex justify-between"><span className="text-slate-500">Mode</span><span className="text-slate-800 dark:text-white font-medium">{context === 'individual' ? 'Individuel' : 'Agence'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Agence</span><span className="text-slate-800 dark:text-white font-medium">{context === 'agency' ? (agencies.find(a => a.id === agencyForm.agencyId)?.name || '-') : 'Aucune'}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 text-white flex items-center gap-3">
          <QrCode className="w-7 h-7" /><div><p className="text-xl font-bold">{getQrCount()}</p><p className="text-xs text-white/80">QR à générer</p></div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white flex items-center gap-3">
          <Building2 className="w-7 h-7" /><div><p className="text-xl font-bold">{agencies.filter(a => a.active).length}</p><p className="text-xs text-white/80">Agences actives</p></div>
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-amber-600 rounded-2xl p-4 text-white flex items-center gap-3">
          <Shield className="w-7 h-7" /><div><p className="text-base font-bold">Anti-fraude</p><p className="text-xs text-white/80">Codes uniques</p></div>
        </div>
      </div>
    </div>
  );
}
