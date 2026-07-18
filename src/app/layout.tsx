import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Strike Influencer Portal",
  description: "Painel de resultados e comissões para influenciadores Strike",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${barlow.variable} antialiased`}>
      <body className="min-h-screen flex flex-col bg-strike-bg text-strike-black font-sans">
        {children}
      </body>
    </html>
  );
}
