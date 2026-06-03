import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-card-strong text-foreground hover:border-primary/40 hover:bg-white/[0.07]",
        primary: "border-primary/60 bg-gradient-to-r from-[#ff6b2c] to-[#f5a623] text-[#170b00] hover:brightness-110",
        ghost: "border-transparent bg-transparent text-muted hover:bg-white/5 hover:text-foreground",
        danger: "border-danger/40 bg-danger/10 text-red-100"
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-5"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
);

type ButtonProps = ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export function Card({ className, ...props }: ComponentPropsWithoutRef<"section">) {
  return <section className={cn("dd-surface rounded-[14px]", className)} {...props} />;
}

export function CardHeader({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("flex items-start justify-between gap-3 border-b border-white/10 p-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentPropsWithoutRef<"h2">) {
  return <h2 className={cn("text-base font-semibold text-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("p-4", className)} {...props} />;
}

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", {
  variants: {
    tone: {
      neutral: "border-white/12 bg-white/5 text-slate-200",
      warn: "border-primary/35 bg-primary/10 text-amber-100",
      ok: "border-success/35 bg-success/10 text-emerald-100",
      danger: "border-danger/35 bg-danger/10 text-red-100",
      info: "border-info/35 bg-info/10 text-blue-100"
    }
  },
  defaultVariants: {
    tone: "neutral"
  }
});

export function Badge({ className, tone, ...props }: ComponentPropsWithoutRef<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export function Input(props: ComponentPropsWithoutRef<"input">) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-[10px] border border-white/10 bg-[#0f1530] px-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary/50 focus:bg-[#161d3e]",
        props.className
      )}
    />
  );
}

export function Select(props: ComponentPropsWithoutRef<"select">) {
  return (
    <select
      {...props}
      className={cn(
        "h-10 w-full rounded-[10px] border border-white/10 bg-[#0f1530] px-3 text-sm text-foreground outline-none transition focus:border-primary/50 focus:bg-[#161d3e]",
        props.className
      )}
    />
  );
}

export function Textarea(props: ComponentPropsWithoutRef<"textarea">) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-24 w-full resize-none rounded-[10px] border border-white/10 bg-[#0f1530] px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary/50 focus:bg-[#161d3e]",
        props.className
      )}
    />
  );
}

export function Label({ className, ...props }: ComponentPropsWithoutRef<"label">) {
  return <label className={cn("text-xs font-medium uppercase tracking-wide text-muted", className)} {...props} />;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

export function MetricCard({ label, value, tone = "warn" }: { label: string; value: string; tone?: VariantProps<typeof badgeVariants>["tone"] }) {
  return (
    <Card>
      <CardContent>
        <Badge tone={tone}>{label}</Badge>
        <strong className="mt-3 block text-2xl font-black text-primary">{value}</strong>
      </CardContent>
    </Card>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-white/10", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#ff6b2c] to-[#f5a623] transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
