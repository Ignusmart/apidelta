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
      from: process.env.EMAIL_FROM ?? 'DriftWatch <noreply@driftwatch.dev>',
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
      // Auto-create a team for new users
      if (user.id && user.email) {
        const team = await prisma.team.create({
          data: {
            name: `${user.name ?? user.email.split('@')[0]}'s Team`,
          },
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { teamId: team.id, isOwner: true },
        });
      }
    },
  },
});
