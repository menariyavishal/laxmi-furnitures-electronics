import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono", 
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Laxmi Electronics & Furnitures",
  description: "Laxmi Electronics & Furnitures - Billing, Inventory and Customer Management",
  openGraph: {
    title: "Laxmi Electronics & Furnitures",
    description: "Laxmi Electronics & Furnitures - Billing, Inventory and Customer Management",
    type: "website",
    locale: "en_IN",
    siteName: "Laxmi Electronics & Furnitures",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
