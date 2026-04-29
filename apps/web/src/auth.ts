import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Nodemailer from 'next-auth/providers/nodemailer';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/sign-in',
    verifyRequest: '/verify-request',
    error: '/sign-in',
  },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    Nodemailer({
      server: process.env.EMAIL_SERVER ?? {
        host: process.env.SMTP_HOST ?? 'smtp.resend.com',
        port: Number(process.env.SMTP_PORT ?? 465),
        auth: {
          user: process.env.SMTP_USER ?? 'resend',
          pass: process.env.SMTP_PASS ?? '',
        },
      },
      from: process.env.EMAIL_FROM ?? 'APIDelta <noreply@apidelta.dev>',
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      // Attach teamId to token if available
      if (token.id && !token.teamId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { teamId: true },
        });
        if (dbUser?.teamId) {
          token.teamId = dbUser.teamId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      if (token.teamId) {
        (session.user as unknown as Record<string, unknown>).teamId = token.teamId;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id || !user.email) return;
      const email = user.email.toLowerCase();

      // If this email has a pending team invite, claim it instead of
      // auto-creating a default team. This is the team-invite happy path:
      // owner sends /invite/<token> → invitee follows magic link → on
      // first signup we land them directly on the inviter's team.
      const pendingInvite = await prisma.teamInvite.findFirst({
        where: {
          email,
          acceptedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (pendingInvite) {
        await prisma.$transaction(async (tx) => {
          await tx.teamInvite.update({
            where: { id: pendingInvite.id },
            data: { acceptedAt: new Date(), acceptedById: user.id! },
          });
          await tx.user.update({
            where: { id: user.id! },
            data: { teamId: pendingInvite.teamId, isOwner: false },
          });
        });
        return;
      }

      // No invite — default behavior: auto-create a team and mark this user owner.
      const team = await prisma.team.create({
        data: {
          name: `${user.name ?? user.email.split('@')[0]}'s Team`,
        },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { teamId: team.id, isOwner: true },
      });
    },
  },
});
