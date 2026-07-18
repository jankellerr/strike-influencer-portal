export default async function InfluencerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;

  if (sent) {
    return (
      <div style={{ maxWidth: 360, margin: "80px auto", fontFamily: "sans-serif" }}>
        <h1 style={{ fontSize: 20, marginBottom: 16 }}>Check your email</h1>
        <p style={{ color: "#444", fontSize: 14 }}>
          If that email is registered, we sent a login link. It expires in 15 minutes.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Strike Influencer Portal</h1>
      <form method="POST" action="/api/login">
        <label htmlFor="email" style={{ display: "block", marginBottom: 4 }}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoFocus
          required
          style={{ width: "100%", padding: 8, marginBottom: 12, boxSizing: "border-box" }}
        />
        {error === "expired" && (
          <p style={{ color: "#b91c1c", marginBottom: 12, fontSize: 14 }}>
            That link expired or was already used. Request a new one below.
          </p>
        )}
        <button type="submit" style={{ width: "100%", padding: 8 }}>
          Send login link
        </button>
      </form>
    </div>
  );
}
