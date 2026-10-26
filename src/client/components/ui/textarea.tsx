import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'min-h-28 w-full rounded-lg border border-[#cdbfae] bg-[#fffdf8] px-3.5 py-2.5 text-sm leading-6 text-[#231b17] shadow-[0_1px_2px_rgba(35,27,23,0.05)] transition-[border-color,box-shadow,background-color] placeholder:text-[#9a8b7f] hover:border-[#b8a692] focus-visible:border-[#7b2d32] focus-visible:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7b2d32]/10 disabled:cursor-not-allowed disabled:bg-[#eee9e0] disabled:opacity-60',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export { Textarea };
