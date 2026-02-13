import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EcomIA - Plataforma de Comercio Electrónico con IA",
  description: "Plataforma inteligente para crear y gestionar tiendas online, landing pages y productos con inteligencia artificial para LATAM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* <Script src="https://js.puter.com/v2/" strategy="afterInteractive" /> */}
        {children}
      </body>
    </html>
  );
}
