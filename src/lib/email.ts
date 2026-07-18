import "server-only";
import { Resend } from "resend";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export async function sendMagicLinkEmail(to: string, magicLinkUrl: string): Promise<void> {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = requireEnv("EMAIL_FROM");
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to,
    subject: "Seu link de acesso — Strike Influencer Portal",
    html: `
      <p>Clique no link abaixo para acessar seu painel de resultados:</p>
      <p><a href="${magicLinkUrl}">${magicLinkUrl}</a></p>
      <p>Este link expira em 15 minutos e só pode ser usado uma vez.</p>
    `,
  });

  if (error) {
    throw new Error(`Failed to send magic link email: ${error.message}`);
  }
}
