import { redirect } from 'next/navigation';

// Redirect from old /packages/[slug] to new /tour/[slug]
export default async function PackageRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/tour/${slug}`);
}
