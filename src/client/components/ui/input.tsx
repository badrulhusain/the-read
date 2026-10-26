import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-[#cdbfae] bg-[#fffdf8] px-3.5 py-2 text-base text-[#231b17] shadow-[0_1px_2px_rgba(35,27,23,0.05)] transition-[border-color,box-shadow,background-color] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#231b17] placeholder:text-[#9a8b7f] hover:border-[#b8a692] focus-visible:border-[#7b2d32] focus-visible:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7b2d32]/10 disabled:cursor-not-allowed disabled:bg-[#eee9e0] disabled:opacity-60 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
