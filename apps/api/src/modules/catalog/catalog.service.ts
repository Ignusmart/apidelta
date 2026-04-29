import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CatalogQuery {
  /** Free-text query — matches name, description, tags, slug. */
  q?: string;
  /** Exact category filter, e.g. "Payments". */
  category?: string;
  /** Limit to popular=true entries. */
  popular?: boolean;
  /** Limit to featured=true entries (homepage hero / catalog top). */
  featured?: boolean;
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List catalog entries. Public — no auth header required.
   * Sorted by featured first, then popular, then name.
   */
  async list(query: CatalogQuery) {
    const where: Prisma.CatalogEntryWhereInput = {};

    if (query.category) where.category = query.category;
    if (query.popular) where.popular = true;
    if (query.featured) where.featured = true;

    if (query.q) {
      const q = query.q.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q.toLowerCase(), mode: 'insensitive' } },
        { tags: { has: q.toLowerCase() } },
      ];
    }

    return this.prisma.catalogEntry.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { popular: 'desc' }, { name: 'asc' }],
    });
  }

  /** Distinct list of categories present in the catalog, sorted alphabetically. */
  async listCategories(): Promise<string[]> {
    const rows = await this.prisma.catalogEntry.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return rows.map((r) => r.category);
  }

  async getBySlug(slug: string) {
    const entry = await this.prisma.catalogEntry.findUnique({ where: { slug } });
    if (!entry) throw new NotFoundException(`Catalog entry "${slug}" not found`);
    return entry;
  }
}
