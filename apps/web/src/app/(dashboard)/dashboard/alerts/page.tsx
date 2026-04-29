import { redirect } from 'next/navigation';

export default async function AlertsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const params = await searchParams;
  const target =
    params.demo === 'true'
      ? '/dashboard/settings?demo=true#alert-rules'
      : '/dashboard/settings#alert-rules';
  redirect(target);
}
