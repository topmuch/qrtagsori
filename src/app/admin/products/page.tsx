'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Edit3,
  Trash2,
  Save,
  X,
  ShoppingBag,
  Loader2,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Upload,
  ImagePlus,
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════
// COULEURS — Noir + Jaune Moutarde (admin boutique)
// ════════════════════════════════════════════════════════════════
const COLORS = {
  bgCard: '#1a1a1a',
  mustard: '#E3B23C',
  black: '#000000',
  white: '#FFFFFF',
  whiteMuted: '#aaaaaa',
  border: '#333333',
  inputBg: '#F9FAFB',
  inputBorder: '#000000',
  green: '#22C55E',
  red: '#ef4444',
};

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  description: string | null;
  image: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formSortOrder, setFormSortOrder] = useState('0');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load products
  useEffect(() => {
    fetch('/api/shop/admin/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setMessage({ text: 'Erreur de connexion au serveur', type: 'error' });
        setLoading(false);
      });
  }, []);

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Upload image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/shop/admin/products/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur upload');

      setFormImage(data.url);
      setMessage({ text: 'Image uploadée !', type: 'success' });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur upload';
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setUploading(false);
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Save product (create or update)
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    const payload = {
      name: formName,
      slug: formSlug || generateSlug(formName),
      price: Number(formPrice),
      quantity: Number(formQuantity),
      description: formDescription || null,
      image: formImage || null,
      sortOrder: Number(formSortOrder) || 0,
    };

    try {
      if (editingId) {
        const res = await fetch('/api/shop/admin/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur');
        setProducts(products.map(p => p.id === editingId ? data : p));
        setMessage({ text: 'Produit mis a jour !', type: 'success' });
      } else {
        const res = await fetch('/api/shop/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur');
        setProducts([...products, data]);
        setMessage({ text: 'Produit cree ! Il apparaitra sur la page d\'accueil.', type: 'success' });
      }
      resetForm();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Delete product
  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
      const res = await fetch('/api/shop/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Erreur suppression');
      setProducts(products.filter(p => p.id !== id));
      setMessage({ text: 'Produit supprime !', type: 'success' });
    } catch {
      setMessage({ text: 'Erreur suppression', type: 'error' });
    }
  };

  // Toggle active
  const handleToggleActive = async (product: Product) => {
    try {
      const res = await fetch('/api/shop/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, active: !product.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error('Erreur');
      setProducts(products.map(p => p.id === product.id ? data : p));
    } catch {
      setMessage({ text: 'Erreur toggle', type: 'error' });
    }
  };

  // Start editing
  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setFormName(product.name);
    setFormSlug(product.slug);
    setFormPrice(String(product.price));
    setFormQuantity(String(product.quantity));
    setFormDescription(product.description || '');
    setFormImage(product.image || '');
    setFormSortOrder(String(product.sortOrder));
  };

  // Reset form
  const resetForm = () => {
    setEditingId(null);
    setFormName('');
    setFormSlug('');
    setFormPrice('');
    setFormQuantity('');
    setFormDescription('');
    setFormImage('');
    setFormSortOrder('0');
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR').format(price);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.mustard }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Page Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: COLORS.mustard }}
          >
            <ShoppingBag className="w-5 h-5" style={{ color: COLORS.black }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Produits Boutique</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gerer les packs stickers QRTags ({products.length} produits)
            </p>
          </div>
        </div>
        <Link
          href="/admin/orders"
          className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all hover:scale-105"
          style={{ background: COLORS.mustard, color: COLORS.black }}
        >
          Commandes
        </Link>
      </div>

      {/* ─── Message ─── */}
      {message && (
        <div
          className="rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2"
          style={{
            background: message.type === 'success' ? '#22C55E20' : '#ef444420',
            color: message.type === 'success' ? COLORS.green : COLORS.red,
            border: `1px solid ${message.type === 'success' ? COLORS.green : COLORS.red}`,
          }}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* ─── Section 1 : Formulaire ajout/edition ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6"
        style={{ background: COLORS.mustard, border: `4px solid ${COLORS.black}` }}
      >
        <h2 className="text-lg font-black mb-4" style={{ color: COLORS.black }}>
          {editingId ? 'Modifier le produit' : 'Ajouter un produit'}
        </h2>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: COLORS.black }}>Nom *</label>
            <input
              type="text"
              value={formName}
              onChange={e => {
                setFormName(e.target.value);
                if (!editingId) setFormSlug(generateSlug(e.target.value));
              }}
              placeholder="Pack 5 Stickers"
              className="w-full px-3 py-2 rounded-xl text-sm font-medium outline-none"
              style={{ background: COLORS.inputBg, color: COLORS.black, border: `2px solid ${COLORS.inputBorder}` }}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: COLORS.black }}>Slug *</label>
            <input
              type="text"
              value={formSlug}
              onChange={e => setFormSlug(e.target.value)}
              placeholder="pack-5-stickers"
              className="w-full px-3 py-2 rounded-xl text-sm font-medium outline-none"
              style={{ background: COLORS.inputBg, color: COLORS.black, border: `2px solid ${COLORS.inputBorder}` }}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: COLORS.black }}>Prix (FCFA) *</label>
            <input
              type="number"
              value={formPrice}
              onChange={e => setFormPrice(e.target.value)}
              placeholder="3000"
              className="w-full px-3 py-2 rounded-xl text-sm font-medium outline-none"
              style={{ background: COLORS.inputBg, color: COLORS.black, border: `2px solid ${COLORS.inputBorder}` }}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: COLORS.black }}>Quantite (stickers) *</label>
            <input
              type="number"
              value={formQuantity}
              onChange={e => setFormQuantity(e.target.value)}
              placeholder="5"
              className="w-full px-3 py-2 rounded-xl text-sm font-medium outline-none"
              style={{ background: COLORS.inputBg, color: COLORS.black, border: `2px solid ${COLORS.inputBorder}` }}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold mb-1" style={{ color: COLORS.black }}>Description</label>
          <input
            type="text"
            value={formDescription}
            onChange={e => setFormDescription(e.target.value)}
            placeholder="5 etiquettes QR indestructibles. Le plus populaire."
            className="w-full px-3 py-2 rounded-xl text-sm font-medium outline-none"
            style={{ background: COLORS.inputBg, color: COLORS.black, border: `2px solid ${COLORS.inputBorder}` }}
          />
        </div>

        {/* ─── IMAGE UPLOAD ─── */}
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" style={{ color: COLORS.black }}>
            <ImagePlus className="w-4 h-4 inline mr-1" />
            Image du produit
          </label>
          <div className="flex flex-col gap-3">
            {/* Upload button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: COLORS.black, color: COLORS.mustard, border: `2px solid ${COLORS.mustard}` }}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Upload en cours...' : 'Choisir une image'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                className="hidden"
              />
              {/* Or manually enter URL */}
              <span className="text-xs" style={{ color: COLORS.black, opacity: 0.6 }}>ou</span>
              <input
                type="text"
                value={formImage}
                onChange={e => setFormImage(e.target.value)}
                placeholder="/images/shop/pack-5.png"
                className="flex-1 px-3 py-2 rounded-xl text-sm font-medium outline-none"
                style={{ background: COLORS.inputBg, color: COLORS.black, border: `2px solid ${COLORS.inputBorder}` }}
              />
            </div>

            {/* Image preview */}
            {formImage && (
              <div className="relative inline-block">
                <img
                  src={formImage}
                  alt="Preview"
                  className="w-24 h-24 rounded-xl object-cover"
                  style={{ border: `3px solid ${COLORS.black}`, background: '#f3f4f6' }}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.opacity = '0.3';
                    img.alt = 'Image introuvable';
                  }}
                />
                <button
                  onClick={() => setFormImage('')}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: COLORS.red, color: '#fff' }}
                  title="Supprimer l'image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold mb-1" style={{ color: COLORS.black }}>Ordre d'affichage</label>
          <input
            type="number"
            value={formSortOrder}
            onChange={e => setFormSortOrder(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 rounded-xl text-sm font-medium outline-none"
            style={{ background: COLORS.inputBg, color: COLORS.black, border: `2px solid ${COLORS.inputBorder}` }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !formName || !formPrice || !formQuantity}
            className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
            style={{ background: COLORS.black, color: COLORS.mustard, border: `2px solid ${COLORS.mustard}` }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editingId ? 'Mettre a jour' : 'Creer le produit'}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2"
              style={{ background: COLORS.black, color: COLORS.whiteMuted }}
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
          )}
        </div>
      </motion.div>

      {/* ─── Section 2 : Liste des produits ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-lg font-black mb-4 dark:text-slate-100 text-slate-800">
          <ShoppingBag className="w-5 h-5 inline mr-2" />
          Produits existants ({products.length})
        </h2>

        <div className="space-y-3">
          {products.length === 0 && (
            <div className="text-center py-12 rounded-xl dark:bg-slate-800/50 bg-slate-100">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-slate-400" />
              <p className="text-sm text-slate-500">Aucun produit. Ajoutez votre premier pack !</p>
            </div>
          )}

          {products.map(product => (
            <div
              key={product.id}
              className="rounded-xl p-4 flex items-center gap-4 dark:bg-slate-800/70 bg-white border dark:border-slate-700 border-slate-200"
            >
              {/* Product image or quantity badge */}
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  style={{ border: `2px solid ${product.active ? COLORS.mustard : '#555'}` }}
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: product.active ? COLORS.mustard : '#555', color: COLORS.black }}
                >
                  <span className="text-lg font-black">{product.quantity}</span>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold truncate dark:text-slate-100 text-slate-800">
                    {product.name}
                  </h3>
                  {!product.active && (
                    <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                      Desactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {product.slug} · {formatPrice(product.price)} FCFA · {product.quantity} stickers · Ordre {product.sortOrder}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggleActive(product)}
                  className="p-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                  style={{ color: COLORS.mustard }}
                  title={product.active ? 'Desactiver' : 'Activer'}
                >
                  {product.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => startEdit(product)}
                  className="p-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                  style={{ color: COLORS.mustard }}
                  title="Editer"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-2 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                  style={{ color: COLORS.red }}
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
