import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const helveticaNowDisplay = localFont({
  variable: "--font-helvetica-now",
  src: [
    { path: "../fonts/HelveticaNowDisplay-Light.otf", weight: "300", style: "normal" },
    { path: "../fonts/HelveticaNowDisplay-Regular.otf", weight: "400", style: "normal" },
    { path: "../fonts/HelveticaNowDisplay-Medium.otf", weight: "500", style: "normal" },
    { path: "../fonts/HelveticaNowDisplay-Bold.otf", weight: "700", style: "normal" },
    { path: "../fonts/HelveticaNowDisplay-ExtraBold.otf", weight: "800", style: "normal" },
    { path: "../fonts/HelveticaNowDisplay-Black.otf", weight: "900", style: "normal" },
  ],
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
    <html lang="pt-BR" className={`${helveticaNowDisplay.variable} antialiased`}>
      <body className="min-h-screen flex flex-col bg-strike-bg text-strike-black font-sans">
        {children}
      </body>
    </html>
  );
}
