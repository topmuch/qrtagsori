import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import BlogPostClient from "./BlogPostClient";

// Server component — validates slug DB-side before rendering.
// Calls notFound() (HTTP 404) for invalid/unpublished slugs,
// eliminating the soft-404 problem where Google saw HTTP 200
// on an "article not found" page.

export default async function PublicBlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: { id: true, status: true, publishedAt: true },
  });

  // Only render if the post exists, is published, and has a publishedAt date
  if (!post || post.status !== "published" || !post.publishedAt) {
    notFound();
  }

  return <BlogPostClient />;
}
