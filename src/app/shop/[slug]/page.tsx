import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import ShopProductClient from "./ShopProductClient";

// Server component — validates slug DB-side before rendering.
// Calls notFound() (HTTP 404) for invalid/inactive slugs,
// eliminating the soft-404 problem where Google saw HTTP 200
// on a "product not found" page.

export default async function ShopProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug, active: true },
    select: { id: true },
  });

  if (!product) {
    notFound();
  }

  return <ShopProductClient />;
}
