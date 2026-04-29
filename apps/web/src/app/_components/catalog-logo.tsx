import Image from 'next/image';
import { Globe } from 'lucide-react';

type Size = 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<Size, { wrap: string; img: string; icon: string }> = {
  sm: { wrap: 'h-9 w-9 rounded-lg', img: 'h-6 w-6', icon: 'h-4 w-4' },
  md: { wrap: 'h-10 w-10 rounded-lg', img: 'h-7 w-7', icon: 'h-5 w-5' },
  lg: { wrap: 'h-14 w-14 rounded-xl', img: 'h-10 w-10', icon: 'h-6 w-6' },
};

const PIXELS: Record<Size, number> = { sm: 24, md: 32, lg: 40 };

export function CatalogLogo({
  logoUrl,
  name,
  size = 'md',
}: {
  logoUrl: string | null;
  name?: string;
  size?: Size;
}) {
  const cls = SIZE_CLASS[size];
  const px = PIXELS[size];
  if (logoUrl) {
    return (
      <div className={`flex shrink-0 items-center justify-center overflow-hidden bg-white/95 ${cls.wrap}`}>
        <Image
          src={logoUrl}
          alt={name ? `${name} logo` : ''}
          width={px}
          height={px}
          className={`${cls.img} object-contain`}
          unoptimized
        />
      </div>
    );
  }
  return (
    <div className={`flex shrink-0 items-center justify-center bg-gray-800 text-violet-400 ${cls.wrap}`}>
      <Globe aria-hidden="true" className={cls.icon} />
    </div>
  );
}
