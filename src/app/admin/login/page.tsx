export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Strike Admin</h1>
      <form method="POST" action="/api/admin/login">
        <label htmlFor="password" style={{ display: "block", marginBottom: 4 }}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoFocus
          required
          style={{ width: "100%", padding: 8, marginBottom: 12, boxSizing: "border-box" }}
        />
        {error && (
          <p style={{ color: "#b91c1c", marginBottom: 12, fontSize: 14 }}>
            Incorrect password.
          </p>
        )}
        <button type="submit" style={{ width: "100%", padding: 8 }}>
          Log in
        </button>
      </form>
    </div>
  );
}
