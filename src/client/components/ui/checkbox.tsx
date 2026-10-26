import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "grid place-content-center peer h-4 w-4 shrink-0 rounded border border-[#7b2d32]/45 bg-[#eef0e9] shadow-[inset_2px_2px_4px_rgba(97,85,68,0.14),inset_-2px_-2px_4px_rgba(255,255,250,0.82)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7b2d32]/25 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#7b2d32] data-[state=checked]:text-[#fffaf1] data-[state=checked]:shadow-[5px_5px_10px_rgba(92,31,37,0.2),-3px_-3px_8px_rgba(255,255,250,0.72)]",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("grid place-content-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
