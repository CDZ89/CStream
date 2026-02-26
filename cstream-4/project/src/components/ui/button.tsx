import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground font-semibold hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1 active:scale-[0.96] active:translate-y-0 border border-primary/30 shadow-md shadow-primary/20",
        destructive: "bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white font-semibold hover:from-red-500 hover:via-rose-500 hover:to-red-500 hover:shadow-xl hover:shadow-red-500/40 hover:-translate-y-1 active:scale-[0.96] border border-red-400/30 shadow-md shadow-red-500/20",
        outline: "border-2 border-primary/30 bg-transparent backdrop-blur-xl hover:bg-primary/10 hover:border-primary/60 hover:text-foreground hover:shadow-xl hover:shadow-primary/15 hover:-translate-y-1 active:scale-[0.96] shadow-sm",
        secondary: "bg-secondary text-secondary-foreground backdrop-blur-xl border border-border hover:bg-secondary/80 hover:border-primary/25 hover:shadow-lg hover:-translate-y-1 active:scale-[0.96] shadow-sm",
        ghost: "hover:bg-accent/20 hover:text-accent-foreground hover:backdrop-blur-sm active:scale-[0.96] rounded-lg",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 hover:drop-shadow-sm",
        discord: "bg-[#5865F2] text-white font-semibold hover:bg-[#4752C4] hover:shadow-xl hover:shadow-[#5865F2]/50 hover:-translate-y-1 active:scale-[0.96] shadow-md shadow-[#5865F2]/30",
        success: "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-500 text-white font-semibold hover:from-emerald-400 hover:via-green-400 hover:to-emerald-400 hover:shadow-xl hover:shadow-emerald-500/50 hover:-translate-y-1 active:scale-[0.96] border border-emerald-400/30 shadow-md shadow-emerald-500/25",
        warning: "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white font-semibold hover:from-amber-400 hover:via-orange-400 hover:to-amber-400 hover:shadow-xl hover:shadow-amber-500/50 hover:-translate-y-1 active:scale-[0.96] border border-amber-400/30 shadow-md shadow-amber-500/25",
        gradient: "bg-primary text-primary-foreground font-semibold hover:bg-primary/85 hover:shadow-2xl hover:shadow-primary/50 hover:-translate-y-1 active:scale-[0.96] border border-primary/30 shadow-md shadow-primary/25",
        glow: "bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/40 hover:shadow-[0_0_40px_hsl(var(--primary)/0.6),0_0_80px_hsl(var(--primary)/0.3)] hover:-translate-y-1 active:scale-[0.96] border border-primary/40",
        premium: "bg-primary text-primary-foreground font-bold hover:bg-primary/85 hover:shadow-2xl hover:shadow-primary/60 hover:-translate-y-1 active:scale-[0.96] border border-primary/40 shadow-xl shadow-primary/30",
        neon: "bg-transparent border-2 border-primary text-primary font-semibold hover:bg-primary/20 hover:shadow-[0_0_35px_hsl(var(--primary)/0.7),0_0_70px_hsl(var(--primary)/0.4)] hover:-translate-y-1 active:scale-[0.96]",
        soft: "bg-primary/18 text-foreground backdrop-blur-xl hover:bg-primary/30 hover:shadow-lg hover:-translate-y-1 active:scale-[0.96] border border-primary/15 shadow-sm",
        watch: "bg-primary text-primary-foreground font-bold hover:bg-primary/85 hover:shadow-2xl hover:shadow-primary/60 hover:scale-[1.04] active:scale-[0.96] rounded-2xl border border-primary/40 shadow-xl shadow-primary/30",
        source: "bg-white/8 text-foreground border-2 border-border backdrop-blur-xl hover:bg-primary/15 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/15 hover:-translate-y-1 active:scale-[0.96] shadow-sm",
        friend: "bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 text-white font-semibold hover:from-blue-400 hover:via-cyan-400 hover:to-blue-400 hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-[1.04] active:scale-[0.96] rounded-2xl border border-cyan-400/30 shadow-lg shadow-blue-500/25",
        glass: "bg-card/50 backdrop-blur-2xl text-foreground border border-border hover:bg-card/70 hover:border-primary/45 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 active:scale-[0.96] shadow-lg",
        primary3d: "bg-primary text-primary-foreground font-semibold shadow-[0_5px_0_0_hsl(var(--primary)/0.7),0_8px_15px_0_rgba(0,0,0,0.5)] hover:shadow-[0_3px_0_0_hsl(var(--primary)/0.7),0_5px_10px_0_rgba(0,0,0,0.5)] hover:translate-y-0.5 active:shadow-[0_1px_0_0_hsl(var(--primary)/0.7)] active:translate-y-1",
        shimmer: "bg-primary bg-[length:200%_100%] animate-shimmer text-primary-foreground font-bold hover:shadow-2xl hover:shadow-primary/50 hover:-translate-y-1 active:scale-[0.96] border border-primary/30 shadow-lg shadow-primary/25",
        pro: "bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white font-semibold border border-white/15 hover:border-white/30 hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-1 active:scale-[0.96] shadow-lg",
        cta: "bg-primary text-primary-foreground font-bold hover:bg-primary/85 hover:shadow-2xl hover:shadow-primary/50 hover:scale-[1.04] active:scale-[0.96] border border-primary/30 shadow-xl shadow-primary/30",
        minimal: "bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent/10 active:scale-[0.96] rounded-lg",
        animated: "bg-primary text-primary-foreground font-semibold bg-[length:200%_100%] animate-shimmer hover:shadow-2xl hover:shadow-primary/50 hover:-translate-y-1 active:scale-[0.96] border border-primary/30 shadow-lg shadow-primary/25",
        cyber: "bg-black/90 text-primary font-bold border-2 border-primary hover:bg-primary/15 hover:shadow-[0_0_40px_hsl(var(--primary)/0.6),inset_0_0_25px_hsl(var(--primary)/0.15)] hover:-translate-y-1 active:scale-[0.96] uppercase tracking-wider shadow-lg shadow-primary/20",
        rainbow: "bg-primary text-primary-foreground font-bold hover:bg-primary/85 hover:shadow-2xl hover:shadow-primary/60 hover:-translate-y-1 active:scale-[0.96] border border-primary/40 shadow-lg shadow-primary/25",
        ice: "bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 text-white font-semibold hover:from-cyan-300 hover:via-blue-400 hover:to-indigo-500 hover:shadow-2xl hover:shadow-cyan-500/50 hover:-translate-y-1 active:scale-[0.96] border border-cyan-300/30 shadow-lg shadow-cyan-500/25",
        fire: "bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 text-white font-semibold hover:from-orange-400 hover:via-red-400 hover:to-rose-500 hover:shadow-2xl hover:shadow-orange-500/50 hover:-translate-y-1 active:scale-[0.96] border border-orange-400/30 shadow-lg shadow-orange-500/25",
        nature: "bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 text-white font-semibold hover:from-green-400 hover:via-emerald-400 hover:to-teal-500 hover:shadow-2xl hover:shadow-green-500/50 hover:-translate-y-1 active:scale-[0.96] border border-green-400/30 shadow-lg shadow-green-500/25",
        royal: "bg-primary text-primary-foreground font-bold hover:bg-primary/85 hover:shadow-2xl hover:shadow-primary/60 hover:-translate-y-1 active:scale-[0.96] border border-primary/40 shadow-xl shadow-primary/30",
        sunset: "bg-primary text-primary-foreground font-semibold hover:bg-primary/85 hover:shadow-2xl hover:shadow-primary/60 hover:-translate-y-1 active:scale-[0.96] border border-primary/30 shadow-lg shadow-primary/25",
        player: "bg-primary text-primary-foreground font-bold hover:bg-primary/85 hover:shadow-2xl hover:shadow-primary/60 hover:scale-[1.04] active:scale-[0.96] rounded-2xl border border-primary/40 shadow-xl shadow-primary/35",
        control: "bg-card/50 backdrop-blur-2xl text-foreground border border-border hover:bg-card/70 hover:text-foreground hover:border-primary/35 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.96] rounded-xl shadow-sm",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-12 text-base font-semibold",
        "2xl": "h-16 rounded-2xl px-16 text-lg font-bold",
        icon: "h-10 w-10 rounded-xl",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-xl",
        "icon-xs": "h-6 w-6 rounded-md",
        "icon-xl": "h-14 w-14 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
