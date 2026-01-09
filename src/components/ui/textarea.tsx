import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground/60 selection:bg-primary/20 selection:text-foreground",
        "flex field-sizing-content min-h-24 w-full rounded-xl border border-border/60 bg-background/50 backdrop-blur-sm px-4 py-3 text-base shadow-sm transition-all duration-200 outline-none",
        "focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-background/80",
        "hover:border-primary/30 hover:bg-background/70",
        "dark:bg-input/30 dark:hover:bg-input/50 dark:focus:bg-input/60",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
