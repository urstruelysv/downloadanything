import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Download anything",
  description:
    "DownloadAnything by Saivamshi Gannoju | AVL - Aethos Vision Labs. Effortlessly download videos and reels from YouTube, Facebook, Instagram, and more with a sleek, minimalistic UI.",
  icons: {
    icon: "/anything.png",
    shortcut: "/anything.png",
    apple: "/anything.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
