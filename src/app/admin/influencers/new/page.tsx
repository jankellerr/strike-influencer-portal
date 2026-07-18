import { verifyAdminSession } from "@/lib/dal";
import { listUnmappedActivePromocodes } from "@/lib/yampi/listUnmappedPromocodes";

export default async function NewInfluencerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await verifyAdminSession();
  const { error } = await searchParams;
  const promocodes = await listUnmappedActivePromocodes();

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>New influencer</h1>
      <form method="POST" action="/api/admin/influencers">
        <label htmlFor="name" style={{ display: "block", marginBottom: 4 }}>
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          style={{ width: "100%", padding: 8, marginBottom: 12, boxSizing: "border-box" }}
        />

        <label htmlFor="email" style={{ display: "block", marginBottom: 4 }}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          style={{ width: "100%", padding: 8, marginBottom: 12, boxSizing: "border-box" }}
        />

        <label htmlFor="yampiPromoId" style={{ display: "block", marginBottom: 4 }}>
          Yampi coupon
        </label>
        <select
          id="yampiPromoId"
          name="yampiPromoId"
          required
          style={{ width: "100%", padding: 8, marginBottom: 12 }}
        >
          <option value="">Select a coupon…</option>
          {promocodes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} ({p.discount_type} {p.value})
            </option>
          ))}
        </select>
        {promocodes.length === 0 && (
          <p style={{ color: "#666", fontSize: 14, marginBottom: 12 }}>
            No unmapped active coupons found in Yampi. Create one in Yampi first.
          </p>
        )}

        {error && (
          <p style={{ color: "#b91c1c", marginBottom: 12, fontSize: 14 }}>
            {error === "coupon_taken"
              ? "That coupon was just mapped to another influencer. Pick a different one."
              : error === "email_taken"
                ? "An influencer with that email already exists."
                : "Something went wrong. Check the fields and try again."}
          </p>
        )}

        <button type="submit" style={{ width: "100%", padding: 8 }}>
          Create influencer
        </button>
      </form>
    </div>
  );
}
