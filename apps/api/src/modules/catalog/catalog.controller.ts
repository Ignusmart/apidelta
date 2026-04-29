import { Controller, Get, Query, Param } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  async list(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('popular') popular?: string,
    @Query('featured') featured?: string,
  ) {
    return this.catalog.list({
      q,
      category,
      popular: popular === 'true',
      featured: featured === 'true',
    });
  }

  @Get('categories')
  async categories() {
    return this.catalog.listCategories();
  }

  @Get(':slug')
  async bySlug(@Param('slug') slug: string) {
    return this.catalog.getBySlug(slug);
  }
}
