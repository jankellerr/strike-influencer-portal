import Link from "next/link";
import { Wordmark } from "@/components/ui";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <Wordmark />
        <p className="mt-1 mb-8 text-xs font-medium uppercase tracking-wide text-strike-muted">
          Portal de influenciadores
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="rounded-md bg-strike-black px-4 py-3 text-sm font-semibold text-strike-white transition-colors hover:bg-black"
          >
            Sou influenciador
          </Link>
          <Link
            href="/admin/login"
            className="rounded-md border border-strike-border bg-strike-white px-4 py-3 text-sm font-semibold text-strike-black transition-colors hover:bg-white"
          >
            Sou da equipe Strike
          </Link>
        </div>
      </div>
    </div>
  );
}
