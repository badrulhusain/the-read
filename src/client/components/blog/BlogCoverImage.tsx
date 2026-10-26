import { useEffect, useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { coverImageAlt, coverImageUrl } from '@/lib/blog-content';
import { cn } from '@/lib/utils';
import type { Blog } from '@/types/blog';

interface BlogCoverImageProps {
  blog: Blog;
  className?: string;
  imageClassName?: string;
  eager?: boolean;
}

export function BlogCoverImage({ blog, className, imageClassName, eager = false }: BlogCoverImageProps) {
  const src = coverImageUrl(blog);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  return (
    <div
      className={cn(
        'relative grid overflow-hidden bg-[linear-gradient(135deg,#53693a,#7b2d32)] text-[#fffaf1]',
        className,
      )}
    >
      <div className="grid h-full min-h-24 place-items-center" aria-hidden="true">
        <ImageIcon className="h-10 w-10 stroke-[1.25] opacity-45" />
      </div>
      {src && !failed ? (
        <img
          src={src}
          alt={coverImageAlt(blog)}
          loading={eager ? 'eager' : 'lazy'}
          onError={() => setFailed(true)}
          className={cn('absolute inset-0 h-full w-full object-cover', imageClassName)}
        />
      ) : null}
    </div>
  );
}
