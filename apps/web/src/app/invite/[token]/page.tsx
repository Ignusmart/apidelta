import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AcceptInviteForm } from './AcceptInviteForm';

const API_BASE = process.env.API_URL ?? 'http://localhost:3001/api';

interface InvitePreview {
  email: string;
  teamName: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
}

async function fetchPreview(token: string): Promise<InvitePreview | null> {
  const res = await fetch(`${API_BASE}/team/invites/by-token/${encodeURIComponent(token)}`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const preview = await fetchPreview(token);
  const session = await auth();

  // Branch on what we know.
  let body: React.ReactNode;

  if (!preview) {
    body = (
      <Message
        title="Invite not found"
        description="This invite link is invalid. Ask the team owner to send you a new one."
      />
    );
  } else if (preview.status === 'accepted') {
    // The invite was already claimed — usually by NextAuth's createUser hook
    // when a brand-new user signed up via this email. Send them onward.
    body = (
      <Message
        title="You're already on the team"
        description={`This invite to join ${preview.teamName} has already been accepted.`}
        cta={{ href: '/dashboard', label: 'Go to dashboard' }}
      />
    );
  } else if (preview.status === 'revoked') {
    body = (
      <Message
        title="Invite revoked"
        description={`The owner of ${preview.teamName} revoked this invite. Ask them to send you a new one.`}
      />
    );
  } else if (preview.status === 'expired') {
    body = (
      <Message
        title="Invite expired"
        description={`This invite to ${preview.teamName} has expired. Ask the owner to send you a new one.`}
      />
    );
  } else if (!session?.user) {
    // Signed out — kick to /sign-in with the invite email pre-filled and
    // bring them right back here after the magic link.
    const callbackUrl = `/invite/${encodeURIComponent(token)}`;
    body = (
      <Message
        title={`Join ${preview.teamName} on APIDelta`}
        description={`This invite is for ${preview.email}. Sign in with that email to accept.`}
        cta={{
          href: `/sign-in?email=${encodeURIComponent(preview.email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`,
          label: 'Sign in to accept',
        }}
      />
    );
  } else {
    // Signed in — confirm email match, then either show "you're already on
    // this team" or an accept form for the cross-team move case.
    const userEmail = session.user.email?.toLowerCase() ?? '';
    if (userEmail !== preview.email.toLowerCase()) {
      body = (
        <Message
          title="Wrong account"
          description={`This invite is for ${preview.email}, but you're signed in as ${session.user.email}. Sign out and sign back in with the invited email.`}
          cta={{ href: '/api/auth/signout', label: 'Sign out' }}
        />
      );
    } else {
      // Match — figure out if they're already on the inviting team.
      const userId = (session.user as Record<string, unknown>).id as string | undefined;
      const sessionTeamId =
        (session.user as Record<string, unknown>).teamId as string | undefined;

      // Look up the invite's teamId so we can compare against session.teamId.
      const invite = await prisma.teamInvite.findUnique({
        where: { token },
        select: { teamId: true },
      });

      if (invite && sessionTeamId === invite.teamId) {
        body = (
          <Message
            title={`You're on ${preview.teamName}`}
            description="The invite was accepted automatically when you signed up. Welcome aboard."
            cta={{ href: '/dashboard', label: 'Go to dashboard' }}
          />
        );
      } else if (!userId) {
        body = (
          <Message
            title="Session error"
            description="Could not read your user id from the session. Please sign out and sign back in."
            cta={{ href: '/api/auth/signout', label: 'Sign out' }}
          />
        );
      } else {
        body = (
          <AcceptInviteForm
            token={token}
            teamName={preview.teamName}
            currentTeamId={sessionTeamId ?? null}
          />
        );
      }
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-16 text-white">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900/40 p-8">
        {body}
      </div>
    </main>
  );
}

function Message({
  title,
  description,
  cta,
}: {
  title: string;
  description: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-gray-400">{description}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-2 inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
