import type { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const buttonVariants = {
  primary: "bg-strike-black text-strike-white hover:bg-black",
  secondary: "bg-strike-yellow text-strike-black hover:brightness-95",
  ghost: "bg-transparent text-strike-black border border-strike-border hover:bg-white",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonVariants }) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        buttonVariants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx("rounded-lg border border-strike-border bg-strike-white p-5", className)}>
      {children}
    </div>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="flex-1 min-w-[160px]">
      <div className="text-xs font-medium uppercase tracking-wide text-strike-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {hint && <div className="mt-1 text-xs text-strike-muted">{hint}</div>}
    </Card>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        "w-full rounded-md border border-strike-border bg-strike-white px-3 py-2 text-sm outline-none focus:border-strike-black",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cx(
        "w-full rounded-md border border-strike-border bg-strike-white px-3 py-2 text-sm outline-none focus:border-strike-black",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cx("mb-1 block text-xs font-medium uppercase tracking-wide text-strike-muted", className)}
      {...props}
    />
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-sm font-medium text-strike-danger">{children}</p>;
}

export function Wordmark({ className }: { className?: string }) {
  return <span className={cx("text-xl font-black uppercase tracking-tight", className)}>Strike</span>;
}
