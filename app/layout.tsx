import type { Metadata } from "next";
import "./globals.css";

const FAVICON =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%231e6fd9'/><stop offset='1' stop-color='%232d8a4e'/></linearGradient></defs><circle cx='26' cy='26' r='20' stroke='url(%23g)' stroke-width='6' fill='none'/><circle cx='26' cy='26' r='9' fill='%232d8a4e'/><circle cx='26' cy='26' r='2.5' fill='white'/><path d='M40 40 L54 54' stroke='url(%23g)' stroke-width='7' stroke-linecap='round'/></svg>";

export const metadata: Metadata = {
  title: "Download Anything — Universal Download Solution",
  description:
    "Paste a link. Get the file. Download videos, music, images, posts and playlists from YouTube, Instagram, TikTok, X, Facebook, Reddit, Pinterest, Vimeo, and SoundCloud — original quality, up to 8K on Pro.",
  icons: {
    icon: FAVICON,
    shortcut: FAVICON,
    apple: FAVICON,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
