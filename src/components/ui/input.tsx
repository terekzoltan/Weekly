import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/60 selection:bg-primary/20 selection:text-foreground",
        "h-10 w-full min-w-0 rounded-xl border border-border/60 bg-background/50 backdrop-blur-sm px-4 py-2 text-base shadow-sm transition-all duration-200 outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-background/80",
        "hover:border-primary/30 hover:bg-background/70",
        "dark:bg-input/30 dark:hover:bg-input/50 dark:focus:bg-input/60",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
