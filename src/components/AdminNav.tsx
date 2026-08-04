import Link from "next/link";

const NAV_ITEMS = [
  { href: "/admin", label: "Influenciadores" },
  { href: "/admin/analytics", label: "Análises" },
  { href: "/admin/shipments", label: "Envios" },
  { href: "/admin/videos", label: "Vídeos" },
] as const;

/** Shared top-level nav + logout for the four admin sections, rendered inside <TopBar>. */
export function AdminNav({ active }: { active: (typeof NAV_ITEMS)[number]["href"] }) {
  return (
    <>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={item.href === active ? "text-strike-yellow" : "text-white/70 hover:text-white"}
        >
          {item.label}
        </Link>
      ))}
      <form method="POST" action="/api/admin/logout">
        <button type="submit" className="text-white/70 hover:text-white">
          Sair
        </button>
      </form>
    </>
  );
}
