import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7b2d32]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef0e9] active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#7b2d32] text-[#fffaf1] shadow-[8px_8px_18px_rgba(92,31,37,0.28),-4px_-4px_12px_rgba(255,255,250,0.72),inset_1px_1px_1px_rgba(255,255,255,0.2),inset_-2px_-2px_4px_rgba(60,16,18,0.22)] hover:bg-[#70252b] hover:shadow-[10px_10px_24px_rgba(92,31,37,0.32),-5px_-5px_14px_rgba(255,255,250,0.78)]",
        destructive:
          "bg-[#8c2f2f] text-[#fffaf1] shadow-[7px_7px_16px_rgba(92,31,37,0.24),-4px_-4px_12px_rgba(255,255,250,0.7)] hover:bg-[#6f2424]",
        outline:
          "border border-white/60 bg-[#eef0e9] text-[#231b17] shadow-[7px_7px_16px_rgba(97,85,68,0.16),-6px_-6px_14px_rgba(255,255,250,0.8)] hover:bg-[#f5f6f1] hover:shadow-[9px_9px_20px_rgba(97,85,68,0.18),-7px_-7px_16px_rgba(255,255,250,0.86)]",
        secondary:
          "border border-white/50 bg-[#e5e9df] text-[#5c1f25] shadow-[5px_5px_12px_rgba(97,85,68,0.14),-4px_-4px_10px_rgba(255,255,250,0.76)] hover:bg-[#eef0e9]",
        ghost: "text-[#5c4b3d] hover:bg-[#e5e9df] hover:text-[#7b2d32] hover:shadow-[inset_4px_4px_9px_rgba(97,85,68,0.12),inset_-4px_-4px_9px_rgba(255,255,250,0.8)]",
        link: "text-[#7b2d32] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-7",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
