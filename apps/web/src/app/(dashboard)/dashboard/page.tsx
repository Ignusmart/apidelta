import { redirect } from 'next/navigation';

export default async function DashboardIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const params = await searchParams;
  const target =
    params.demo === 'true'
      ? '/dashboard/changes?demo=true'
      : '/dashboard/changes';
  redirect(target);
}
