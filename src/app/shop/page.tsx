import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  ShoppingBag,
  Truck,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Phone,
} from "lucide-react";

// ════════════════════════════════════════════════════════════════
// COULEURS BOUTIQUE — Noir + Jaune Moutarde
// ════════════════════════════════════════════════════════════════
const COLORS = {
  bg: "#111111",
  bgCard: "#1a1a1a",
  mustard: "#E3B23C",
  mustardDark: "#c89a00",
  black: "#000000",
  white: "#FFFFFF",
  whiteMuted: "#aaaaaa",
  border: "#333333",
  green: "#22C55E",
};

export const metadata: Metadata = {
  title: "Boutique QRTags — Étiquettes QR anti-perte",
  description:
    "Achetez des étiquettes QR QRTags à partir de 1500 FCFA. Packs de 3, 5, 10 ou 15 stickers. Livraison en Afrique de l'Ouest et en France. Paiement à la livraison.",
  alternates: { canonical: "https://qrtags.com/shop" },
};

export default async function ShopPage() {
  // Fetch active products server-side
  let products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    quantity: number;
    description: string | null;
    image: string | null;
  }[] = [];

  try {
    products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        quantity: true,
        description: true,
        image: true,
      },
    });
  } catch (error) {
    console.error("[shop] Error fetching products:", error);
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fr-FR").format(price);

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh" }}>
      {/* ─── Header ─── */}
      <nav
        className="sticky top-0 z-50 px-5"
        style={{
          background: COLORS.bg,
          borderBottom: `2px solid ${COLORS.border}`,
        }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.png?v=20260726"
              alt="QRTags"
              className="h-10 w-auto object-contain brightness-0 invert"
              width={335}
              height={100}
            />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 text-sm font-medium"
            style={{ color: COLORS.mustard }}
          >
            <ArrowLeft className="w-4 h-4" />
            Accueil
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-5 py-8 md:py-12">
        {/* ─── Hero Section ─── */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ShoppingBag
              className="w-8 h-8"
              style={{ color: COLORS.mustard }}
            />
            <h1
              className="text-3xl md:text-4xl font-black"
              style={{ color: COLORS.white }}
            >
              Boutique QRTags
            </h1>
          </div>
          <p
            className="text-base md:text-lg max-w-2xl mx-auto"
            style={{ color: COLORS.whiteMuted }}
          >
            Étiquettes QR anti-perte — Collez, activez en 30 secondes,
            recevez une alerte WhatsApp si votre objet est trouvé.
            <br />
            <strong style={{ color: COLORS.mustard }}>
              Paiement à la livraison
            </strong>{" "}
            — aucun paiement en ligne.
          </p>
        </div>

        {/* ─── Products Grid ─── */}
        {products.length === 0 ? (
          <div
            className="text-center py-16 rounded-2xl"
            style={{
              background: COLORS.bgCard,
              border: `2px solid ${COLORS.border}`,
            }}
          >
            <ShoppingBag
              className="w-12 h-12 mx-auto mb-4"
              style={{ color: COLORS.whiteMuted }}
            />
            <p className="text-lg font-bold mb-2" style={{ color: COLORS.white }}>
              Boutique en préparation
            </p>
            <p style={{ color: COLORS.whiteMuted }}>
              Les produits arrivent bientôt. Revenez vite !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/shop/${product.slug}`}
                className="group rounded-2xl overflow-hidden transition-all hover:scale-[1.02]"
                style={{
                  background: COLORS.mustard,
                  border: `4px solid ${COLORS.black}`,
                }}
              >
                {/* Product image or quantity icon */}
                <div className="p-6 pb-4">
                  {product.image ? (
                    <div
                      className="w-full aspect-square rounded-xl overflow-hidden mb-4"
                      style={{ border: `4px solid ${COLORS.black}` }}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-full aspect-square rounded-xl flex items-center justify-center mb-4"
                      style={{ background: COLORS.black }}
                    >
                      <span
                        className="text-7xl md:text-8xl font-black"
                        style={{ color: COLORS.mustard }}
                      >
                        {product.quantity}
                      </span>
                    </div>
                  )}

                  {/* Product name */}
                  <h2
                    className="text-xl font-black mb-1"
                    style={{ color: COLORS.black }}
                  >
                    {product.name}
                  </h2>

                  {/* Description */}
                  {product.description && (
                    <p
                      className="text-sm mb-3 line-clamp-2"
                      style={{ color: COLORS.black }}
                    >
                      {product.description}
                    </p>
                  )}

                  {/* Price */}
                  <div
                    className="text-2xl font-black"
                    style={{ color: COLORS.black }}
                  >
                    {formatPrice(product.price)} FCFA
                  </div>
                </div>

                {/* CTA strip */}
                <div
                  className="px-6 py-3 flex items-center justify-between"
                  style={{ background: COLORS.black }}
                >
                  <span
                    className="text-sm font-bold"
                    style={{ color: COLORS.mustard }}
                  >
                    <Truck className="w-4 h-4 inline mr-1" />
                    Livraison incluse
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: COLORS.mustard }}
                  >
                    Commander →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ─── Trust Badges ─── */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <div
            className="rounded-xl p-5"
            style={{
              background: COLORS.bgCard,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <Truck className="w-6 h-6 mb-2" style={{ color: COLORS.mustard }} />
            <h3
              className="text-sm font-bold mb-1"
              style={{ color: COLORS.white }}
            >
              Livraison à Dakar
            </h3>
            <p className="text-xs" style={{ color: COLORS.whiteMuted }}>
              Nous livrons directement chez vous à Dakar et environs.
            </p>
          </div>
          <div
            className="rounded-xl p-5"
            style={{
              background: COLORS.bgCard,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <ShieldCheck
              className="w-6 h-6 mb-2"
              style={{ color: COLORS.mustard }}
            />
            <h3
              className="text-sm font-bold mb-1"
              style={{ color: COLORS.white }}
            >
              Cash on Delivery
            </h3>
            <p className="text-xs" style={{ color: COLORS.whiteMuted }}>
              Pas de paiement en ligne. Vous payez quand vous recevez vos
              stickers.
            </p>
          </div>
          <div
            className="rounded-xl p-5"
            style={{
              background: COLORS.bgCard,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <Phone className="w-6 h-6 mb-2" style={{ color: COLORS.mustard }} />
            <h3
              className="text-sm font-bold mb-1"
              style={{ color: COLORS.white }}
            >
              Confirmation sous 24h
            </h3>
            <p className="text-xs" style={{ color: COLORS.whiteMuted }}>
              Nous vous appelons pour confirmer la commande avant livraison.
            </p>
          </div>
        </div>

        {/* ─── How it works ─── */}
        <div
          className="rounded-2xl p-6 md:p-8 text-center"
          style={{
            background: COLORS.bgCard,
            border: `2px solid ${COLORS.border}`,
          }}
        >
          <h2
            className="text-xl md:text-2xl font-black mb-6"
            style={{ color: COLORS.mustard }}
          >
            Comment ça marche ?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-black"
                style={{ background: COLORS.mustard, color: COLORS.black }}
              >
                1
              </div>
              <h3
                className="text-sm font-bold mb-1"
                style={{ color: COLORS.white }}
              >
                Commandez votre pack
              </h3>
              <p className="text-xs" style={{ color: COLORS.whiteMuted }}>
                Choisissez le pack adapté à vos besoins (3, 5, 10 ou 15
                stickers).
              </p>
            </div>
            <div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-black"
                style={{ background: COLORS.mustard, color: COLORS.black }}
              >
                2
              </div>
              <h3
                className="text-sm font-bold mb-1"
                style={{ color: COLORS.white }}
              >
                Collez & activez
              </h3>
              <p className="text-xs" style={{ color: COLORS.whiteMuted }}>
                Collez l&apos;étiquette sur votre objet et activez-la en 30
                secondes via WhatsApp.
              </p>
            </div>
            <div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-black"
                style={{ background: COLORS.mustard, color: COLORS.black }}
              >
                3
              </div>
              <h3
                className="text-sm font-bold mb-1"
                style={{ color: COLORS.white }}
              >
                Objet trouvé ? Alerte WhatsApp
              </h3>
              <p className="text-xs" style={{ color: COLORS.whiteMuted }}>
                Le trouveur scanne le QR, vous recevez une alerte instantanée
                avec sa position GPS.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <CheckCircle2
              className="w-5 h-5 inline mr-2"
              style={{ color: COLORS.green }}
            />
            <span className="text-sm" style={{ color: COLORS.whiteMuted }}>
              98% des objets QRTags sont retrouvés
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
