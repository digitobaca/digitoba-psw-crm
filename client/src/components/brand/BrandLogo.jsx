import { cn } from '@/lib/utils';

const SIZES = {
  xs: 36,
  sm: 52,
  md: 64,
  lg: 92,
  xl: 128,
};

// /logo.png is 1080×1350 with large transparent margins. Artwork inside is
// ~854×780, so we crop via overflow and scale the file up to fill `size`.
const CANVAS_H = 1350;
const ART_W = 854;
const ART_H = 780;

export default function BrandLogo({ size = 'md', className, alt = 'Capital Immigration Canada' }) {
  const height = typeof size === 'number' ? size : SIZES[size] ?? SIZES.md;
  const width = Math.round(height * (ART_W / ART_H));
  const imgHeight = height * (CANVAS_H / ART_H);

  return (
    <span className={cn('relative inline-block shrink-0 overflow-hidden', className)} style={{ height, width }}>
      <img
        src="/logo.png"
        alt={alt}
        className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
        style={{ height: imgHeight }}
      />
    </span>
  );
}
