import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4fb8ad] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#171b45] text-white hover:bg-[#242b60]",
        secondary: "bg-[#e7f3ef] text-[#315c5a] hover:bg-[#dceee8]",
        outline: "border border-[#ebe9e1] bg-white text-[#171b45] hover:bg-[#f7f6f2]",
        destructive: "bg-[#bd4549] text-white hover:bg-[#a83d42]",
        gold: "bg-[#d9b36b] text-[#171b45] hover:bg-[#e3c27e]",
        ghost: "text-[#171b45] hover:bg-[#f0efe9]",
      },
      size: { default: "", sm: "min-h-9 rounded-lg px-3 text-xs", lg: "min-h-12 rounded-2xl px-6", icon: "h-11 w-11 p-0" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
