import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...rest } = props;
  return (
    <select
      className={cn('h-11 w-full cursor-pointer rounded-lg border border-[#cdbfae] bg-[#fffdf8] px-3.5 text-sm text-[#231b17] shadow-[0_1px_2px_rgba(35,27,23,0.05)] transition-[border-color,box-shadow,background-color] hover:border-[#b8a692] focus-visible:border-[#7b2d32] focus-visible:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7b2d32]/10 disabled:cursor-not-allowed disabled:bg-[#eee9e0] disabled:opacity-60', className)}
      {...rest}
    >
      {children}
    </select>
  );
}
