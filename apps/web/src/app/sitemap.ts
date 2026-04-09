import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://apidelta.dev';

  return [
    {
      url: baseUrl,
      lastModified: '2026-04-09',
      changeFrequency: 'weekly',
      priority: 1,
    },
    // SEO: Use-case pages (tier 1)
    {
      url: `${baseUrl}/use-cases/api-changelog-monitoring`,
      lastModified: '2026-04-09',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/use-cases/breaking-change-detection`,
      lastModified: '2026-04-09',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/use-cases/api-dependency-management`,
      lastModified: '2026-04-09',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // SEO: Comparison pages
    {
      url: `${baseUrl}/compare/manual-vs-automated`,
      lastModified: '2026-04-09',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/compare/generic-vs-api-specific`,
      lastModified: '2026-04-09',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // SEO: Tier 2 use-case pages
    {
      url: `${baseUrl}/use-cases/saas-api-integrations`,
      lastModified: '2026-04-09',
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/use-cases/devops-api-monitoring`,
      lastModified: '2026-04-09',
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // SEO: Guide pages
    {
      url: `${baseUrl}/guides/api-versioning-best-practices`,
      lastModified: '2026-04-09',
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/guides/handling-breaking-api-changes`,
      lastModified: '2026-04-09',
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Legal pages
    {
      url: `${baseUrl}/terms`,
      lastModified: '2026-04-06',
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: '2026-04-06',
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
