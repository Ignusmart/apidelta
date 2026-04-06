import { PrismaClient, SourceType, PlanTier } from '@prisma/client';

const prisma = new PrismaClient();

const API_SOURCES = [
  {
    name: 'Stripe',
    url: 'https://stripe.com/docs/changelog',
    sourceType: SourceType.HTML_CHANGELOG,
  },
  {
    name: 'Twilio',
    url: 'https://www.twilio.com/en-us/changelog',
    sourceType: SourceType.HTML_CHANGELOG,
  },
  {
    name: 'GitHub',
    url: 'https://github.blog/changelog/',
    sourceType: SourceType.HTML_CHANGELOG,
  },
  {
    name: 'Slack API',
    url: 'https://api.slack.com/changelog',
    sourceType: SourceType.HTML_CHANGELOG,
  },
  {
    name: 'SendGrid',
    url: 'https://docs.sendgrid.com/release-notes',
    sourceType: SourceType.HTML_CHANGELOG,
  },
  {
    name: 'OpenAI',
    url: 'https://platform.openai.com/docs/changelog',
    sourceType: SourceType.HTML_CHANGELOG,
  },
  {
    name: 'Vercel',
    url: 'https://vercel.com/changelog',
    sourceType: SourceType.HTML_CHANGELOG,
  },
  {
    name: 'Prisma',
    url: 'https://github.com/prisma/prisma/releases',
    sourceType: SourceType.GITHUB_RELEASES,
  },
];

async function main() {
  console.log('Seeding APIDelta database...');

  // Create a demo team
  const team = await prisma.team.upsert({
    where: { stripeCustomerId: 'demo-team' },
    update: {},
    create: {
      name: 'Demo Team',
      plan: PlanTier.FREE_TRIAL,
      stripeCustomerId: 'demo-team',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    },
  });

  console.log(`Created team: ${team.name} (${team.id})`);

  // Create a demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@apidelta.dev' },
    update: {},
    create: {
      email: 'demo@apidelta.dev',
      name: 'Demo User',
      teamId: team.id,
      isOwner: true,
    },
  });

  console.log(`Created user: ${user.email} (${user.id})`);

  // Create API sources
  for (const source of API_SOURCES) {
    const created = await prisma.apiSource.upsert({
      where: {
        teamId_url: {
          teamId: team.id,
          url: source.url,
        },
      },
      update: {},
      create: {
        ...source,
        teamId: team.id,
      },
    });
    console.log(`Created source: ${created.name} — ${created.url}`);
  }

  console.log(`\nSeeding complete. ${API_SOURCES.length} API sources created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
