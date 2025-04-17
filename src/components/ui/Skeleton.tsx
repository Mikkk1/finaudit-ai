import { cn } from "../../lib/utils.ts";
import { HTMLAttributes, forwardRef } from "react";

export const Skeleton = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  )
);
Skeleton.displayName = "Skeleton";