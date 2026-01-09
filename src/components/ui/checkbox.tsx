"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-5 shrink-0 rounded-md border-2 border-border/60 bg-background/50 shadow-sm transition-all duration-200 outline-none",
        "hover:border-primary/50 hover:bg-primary/5",
        "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50",
        "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
        "data-[state=checked]:hover:bg-primary/90",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:bg-input/30 dark:data-[state=checked]:bg-primary",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current animate-scale-in"
      >
        <CheckIcon className="size-3.5 stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
