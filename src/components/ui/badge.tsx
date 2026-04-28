import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-pea-blue text-white hover:bg-pea-blue/80",
        secondary: "border-transparent bg-pea-gray/15 text-pea-gray hover:bg-pea-gray/25",
        destructive: "border-transparent bg-pea-rust/15 text-pea-rust hover:bg-pea-rust/25",
        outline: "text-foreground border-pea-gray/30",
        success: "border-transparent bg-pea-teal/15 text-pea-teal",
        warning: "border-transparent bg-pea-gold/20 text-[#7a5530]",
        info: "border-transparent bg-pea-blue/10 text-pea-blue",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
