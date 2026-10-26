import type { TableHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-white/60 bg-[#eef0e9] shadow-[12px_12px_26px_rgba(97,85,68,0.16),-9px_-9px_22px_rgba(255,255,250,0.84)]">
      <table className={cn('w-full min-w-[680px] text-left text-sm text-[#231b17] [&_td]:border-t [&_td]:border-[#5c4b3d]/10 [&_td]:px-4 [&_td]:py-3 [&_th]:bg-[#e5e9df] [&_th]:px-4 [&_th]:py-3 [&_th]:font-semibold [&_th]:text-[#5c4b3d]', className)} {...props} />
    </div>
  );
}
