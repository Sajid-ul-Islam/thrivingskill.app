// app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./styles/globals.css"; // Import global styles
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Diary",
  description: "A simple blog site",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{metadata.title}</title>
      </head>
      <body
        className={`${inter.className} bg-black text-white min-h-screen flex flex-col`}
      >
        <Navbar />
        <main className="flex-grow container mx-auto px-4">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
