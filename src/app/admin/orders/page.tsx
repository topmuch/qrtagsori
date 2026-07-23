'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Phone,
  Package,
  Filter,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Truck,
  XCircle,
  Clock,
  ChevronDown,
  ShoppingBag,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

// ════════════════════════════════════════════════════════════════
// COULEURS — Noir + Jaune Moutarde (admin boutique)
// ════════════════════════════════════════════════════════════════
const COLORS = {
  bg: '#111111',
  bgCard: '#1a1a1a',
  mustard: '#E3B23C',
  black: '#000000',
  white: '#FFFFFF',
  whiteMuted: '#aaaaaa',
  border: '#333333',
  green: '#22C55E',
  red: '#ef4444',
  blue: '#3b82f6',
  orange: '#f97316',
};

interface OrderWithProduct {
  id: string;
  customerName: string;
  customerPhone: string;
  city: string | null;
  quartier: string | null;
  quantity: number;
  total: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    slug: string;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { label: 'En attente', color: COLORS.orange, icon: Clock },
  CONFIRMED: { label: 'Confirmée', color: COLORS.blue, icon: CheckCircle2 },
  SHIPPED: { label: 'Expédiée', color: COLORS.mustard, icon: Truck },
  DELIVERED: { label: 'Livrée', color: COLORS.green, icon: CheckCircle2 },
  CANCELLED: { label: 'Annulée', color: COLORS.red, icon: XCircle },
};

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ─── Load orders ───
  const loadOrders = async (status?: string) => {
    try {
      const url = `/api/shop/admin/orders${status ? `?status=${status}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch {
      console.error('Error loading orders');
    }
  };

  useEffect(() => {
    loadOrders(filterStatus).then(() => setLoading(false));
  }, [filterStatus]);

  // ─── Refresh ───
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders(filterStatus);
    setRefreshing(false);
  };

  // ─── Update status ───
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/shop/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');

      setOrders(orders.map(o => o.id === orderId ? data : o));
    } catch {
      console.error('Error updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  // ─── Delete order ───
  const handleDelete = async (orderId: string) => {
    if (!confirm('Supprimer cette commande ?')) return;
    try {
      const res = await fetch('/api/shop/admin/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId }),
      });
      if (!res.ok) throw new Error('Erreur');
      setOrders(orders.filter(o => o.id !== orderId));
      setTotal(total - 1);
    } catch {
      console.error('Error deleting order');
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR').format(price);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  // ─── Stats rapides ───
  const stats = {
    pending: orders.filter(o => o.status === 'PENDING').length,
    confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
    totalRevenue: orders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.total, 0),
  };

  if (loading) {
    return (
      <div style={{ background: COLORS.bg, minHeight: '100vh' }} className="flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: COLORS.mustard }} />
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.white }}>
      {/* ─── Nav ─── */}
      <nav className="sticky top-0 z-50 px-5" style={{ background: COLORS.bg, borderBottom: `2px solid ${COLORS.border}` }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <QRTagsLogo size="sm" variant="dark" />
            <span className="text-sm font-bold" style={{ color: COLORS.mustard }}>Commandes</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/products" className="text-sm font-medium" style={{ color: COLORS.mustard }}>
              Produits
            </Link>
            <Link href="/admin" className="text-sm" style={{ color: COLORS.whiteMuted }}>
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-5 py-8">
        {/* ─── Stats cards ─── */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-4"
            style={{ background: COLORS.bgCard, border: `2px solid ${COLORS.orange}30` }}
          >
            <Clock className="w-6 h-6 mb-2" style={{ color: COLORS.orange }} />
            <div className="text-2xl font-black" style={{ color: COLORS.orange }}>{stats.pending}</div>
            <div className="text-xs" style={{ color: COLORS.whiteMuted }}>En attente</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl p-4"
            style={{ background: COLORS.bgCard, border: `2px solid ${COLORS.blue}30` }}
          >
            <CheckCircle2 className="w-6 h-6 mb-2" style={{ color: COLORS.blue }} />
            <div className="text-2xl font-black" style={{ color: COLORS.blue }}>{stats.confirmed}</div>
            <div className="text-xs" style={{ color: COLORS.whiteMuted }}>Confirmées</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl p-4"
            style={{ background: COLORS.mustard, border: `4px solid ${COLORS.black}` }}
          >
            <ShoppingBag className="w-6 h-6 mb-2" style={{ color: COLORS.black }} />
            <div className="text-2xl font-black" style={{ color: COLORS.black }}>{formatPrice(stats.totalRevenue)}</div>
            <div className="text-xs" style={{ color: COLORS.black }}>FCFA revenus</div>
          </motion.div>
        </div>

        {/* ─── Filters ─── */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Filter className="w-5 h-5" style={{ color: COLORS.mustard }} />
          <div className="flex gap-2">
            {['', ...STATUS_OPTIONS].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: filterStatus === status ? COLORS.mustard : COLORS.bgCard,
                  color: filterStatus === status ? COLORS.black : COLORS.whiteMuted,
                  border: `1px solid ${filterStatus === status ? COLORS.mustard : COLORS.border}`,
                }}
              >
                {status || 'Tous'}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg"
            style={{ background: COLORS.bgCard, color: COLORS.mustard }}
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-xs" style={{ color: COLORS.whiteMuted }}>
            {total} commandes
          </span>
        </div>

        {/* ─── Orders list ─── */}
        <div className="space-y-4">
          {orders.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto mb-4" style={{ color: COLORS.whiteMuted }} />
              <p className="text-sm" style={{ color: COLORS.whiteMuted }}>Aucune commande pour ce filtre.</p>
            </div>
          )}

          {orders.map(order => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
            const StatusIcon = config.icon;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl p-4"
                style={{ background: COLORS.bgCard, border: `2px solid ${COLORS.border}` }}
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* ─── Customer info ─── */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusIcon className="w-4 h-4" style={{ color: config.color }} />
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: config.color + '20', color: config.color }}>
                        {config.label}
                      </span>
                      <span className="text-xs" style={{ color: COLORS.whiteMuted }}>{formatDate(order.createdAt)}</span>
                    </div>

                    <h3 className="text-sm font-bold mb-1" style={{ color: COLORS.white }}>
                      {order.customerName}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="text-sm font-bold flex items-center gap-1"
                        style={{ color: COLORS.mustard }}
                      >
                        <Phone className="w-3 h-3" />
                        {order.customerPhone}
                      </a>
                    </div>
                    <p className="text-xs" style={{ color: COLORS.whiteMuted }}>
                      {order.city || '—'} · {order.quartier || '—'}
                    </p>
                  </div>

                  {/* ─── Product & total ─── */}
                  <div className="flex-shrink-0 text-right md:text-right">
                    <p className="text-sm font-bold mb-1" style={{ color: COLORS.white }}>
                      {order.product.name}
                    </p>
                    <p className="text-xs mb-2" style={{ color: COLORS.whiteMuted }}>
                      {order.product.quantity} stickers · {order.quantity} pack
                    </p>
                    <p className="text-xl font-black" style={{ color: COLORS.mustard }}>
                      {formatPrice(order.total)} FCFA
                    </p>
                  </div>

                  {/* ─── Actions ─── */}
                  <div className="flex flex-col gap-2 flex-shrink-0 md:min-w-[140px]">
                    {/* Status dropdown */}
                    <div className="relative">
                      <select
                        value={order.status}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                        disabled={updatingId === order.id}
                        className="w-full px-3 py-2 rounded-lg text-xs font-bold appearance-none cursor-pointer"
                        style={{
                          background: COLORS.bg,
                          color: config.color,
                          border: `1px solid ${config.color}30`,
                        }}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s} style={{ background: COLORS.bg, color: COLORS.white }}>
                            {STATUS_CONFIG[s]?.label || s}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 absolute right-2 top-3 pointer-events-none" style={{ color: config.color }} />
                      {updatingId === order.id && <Loader2 className="w-4 h-4 animate-spin absolute right-8 top-2.5" style={{ color: COLORS.mustard }} />}
                    </div>

                    {/* Call button */}
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                      style={{ background: COLORS.mustard, color: COLORS.black }}
                    >
                      <Phone className="w-3 h-3" />
                      Appeler
                    </a>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                      style={{ background: COLORS.red + '20', color: COLORS.red }}
                    >
                      <XCircle className="w-3 h-3" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
