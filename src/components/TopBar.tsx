import type { ReactNode } from "react";
import Image from "next/image";

export function TopBar({ label, children }: { label?: string; children?: ReactNode }) {
  return (
    <header className="bg-strike-black text-strike-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-baseline gap-2">
          <Image src="/strike-logo.png" alt="Strike" width={544} height={220} className="h-5 w-auto" priority />
          {label && (
            <span className="text-xs font-medium uppercase tracking-wide text-white/60">
              {label}
            </span>
          )}
        </div>
        {children && <div className="flex items-center gap-4 text-sm">{children}</div>}
      </div>
    </header>
  );
}
