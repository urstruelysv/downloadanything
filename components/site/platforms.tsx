"use client";

import * as React from "react";

export type PlatformName =
  | "YouTube"
  | "Instagram"
  | "TikTok"
  | "Twitter"
  | "X"
  | "Facebook"
  | "Vimeo"
  | "SoundCloud"
  | "Spotify"
  | "Reddit"
  | "LinkedIn"
  | "Pinterest"
  | "Twitch"
  | "Dailymotion";

export const Platform = ({
  name,
  size = 28,
}: {
  name: PlatformName | string;
  size?: number;
}) => {
  const s = size;
  const wrap = (children: React.ReactNode, bg: string) => (
    <div
      style={{
        width: s,
        height: s,
        borderRadius: s * 0.28,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
  switch (name) {
    case "YouTube":
      return wrap(
        <svg width={s * 0.55} height={s * 0.55} viewBox="0 0 24 24" fill="white">
          <path d="M9 17V7l8 5-8 5Z" />
        </svg>,
        "#ff0033"
      );
    case "Instagram":
      return wrap(
        <svg
          width={s * 0.55}
          height={s * 0.55}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="white" />
        </svg>,
        "linear-gradient(135deg,#feda75,#fa7e1e 30%,#d62976 60%,#962fbf 80%,#4f5bd5)"
      );
    case "TikTok":
      return wrap(
        <svg width={s * 0.55} height={s * 0.55} viewBox="0 0 24 24" fill="white">
          <path d="M14 3v9.5a3 3 0 1 1-3-3v-2.5a5.5 5.5 0 1 0 5.5 5.5V8a6 6 0 0 0 4 1.5V7a4 4 0 0 1-4-4h-2.5Z" />
        </svg>,
        "#000000"
      );
    case "Twitter":
    case "X":
      return wrap(
        <svg width={s * 0.5} height={s * 0.5} viewBox="0 0 24 24" fill="white">
          <path d="M18 3h3l-7 8 8 10h-6l-5-6-5 6H3l8-9-8-9h6l4 5 5-5Z" />
        </svg>,
        "#000000"
      );
    case "Facebook":
      return wrap(
        <svg width={s * 0.55} height={s * 0.55} viewBox="0 0 24 24" fill="white">
          <path d="M14 8h3V5h-3a3 3 0 0 0-3 3v2H8v3h3v8h3v-8h3l1-3h-4V8.5c0-.3.2-.5.5-.5H14Z" />
        </svg>,
        "#1877f2"
      );
    case "Vimeo":
      return wrap(
        <svg width={s * 0.55} height={s * 0.55} viewBox="0 0 24 24" fill="white">
          <path d="M3 8c1-1 3-2 4-2 2 0 2 2 3 6 .5 2 1 3 2 3 1 0 3-2 4-4-2 0-3-1-2-3 0-2 2-3 4-3 3 0 4 3 3 6-2 5-7 11-11 11-3 0-4-3-5-7-1-3-1-5-2-5Z" />
        </svg>,
        "#1ab7ea"
      );
    case "SoundCloud":
      return wrap(
        <svg width={s * 0.6} height={s * 0.6} viewBox="0 0 24 24" fill="white">
          <path d="M2 16v-3M5 17v-5M8 18V9M11 18V7M14 18V8c2 0 3 1 3 3v7M17 18h3a2 2 0 1 0-1-4" />
        </svg>,
        "#ff5500"
      );
    case "Spotify":
      return wrap(
        <svg
          width={s * 0.6}
          height={s * 0.6}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M7 9c4-1 8-1 11 1M7.5 12.5c3-1 6-1 9 .5M8 16c2-.5 5-.5 7 .5" />
        </svg>,
        "#1db954"
      );
    case "Reddit":
      return wrap(
        <svg width={s * 0.6} height={s * 0.6} viewBox="0 0 24 24" fill="white">
          <circle cx="12" cy="13" r="8" />
          <circle cx="9" cy="13" r="1.2" fill="#ff4500" />
          <circle cx="15" cy="13" r="1.2" fill="#ff4500" />
          <path
            d="M9 16c1 1 5 1 6 0"
            stroke="#ff4500"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="18" cy="7" r="1.5" fill="white" />
        </svg>,
        "#ff4500"
      );
    case "LinkedIn":
      return wrap(
        <svg width={s * 0.55} height={s * 0.55} viewBox="0 0 24 24" fill="white">
          <rect x="3" y="9" width="3" height="11" />
          <circle cx="4.5" cy="5" r="1.5" />
          <path d="M9 9h3v2c1-1.5 2.5-2.2 4-2 3 0 4 2 4 5v6h-3v-5c0-2-1-3-2.5-3S12 13 12 15v5H9V9Z" />
        </svg>,
        "#0a66c2"
      );
    case "Pinterest":
      return wrap(
        <svg width={s * 0.55} height={s * 0.55} viewBox="0 0 24 24" fill="white">
          <path d="M12 2a10 10 0 0 0-3.5 19.4c0-1 0-2 .2-3 .3-1 1.5-6 1.5-6s-.4-.7-.4-1.8c0-1.7 1-3 2.2-3 1 0 1.5.8 1.5 1.7 0 1-.6 2.6-1 4-.3 1.2.6 2.2 1.8 2.2 2.1 0 3.7-2.2 3.7-5.4 0-2.8-2-4.8-5-4.8-3.4 0-5.4 2.5-5.4 5.2 0 1 .4 2.1.9 2.7l.1.4-.4 1.5c-.1.2-.3.3-.5.2-1.7-.8-2.7-3.2-2.7-5.2 0-4.2 3-8 8.8-8 4.6 0 8.2 3.3 8.2 7.7 0 4.6-2.9 8.3-7 8.3-1.3 0-2.6-.7-3-1.5l-.8 3.2c-.3 1.2-1.1 2.6-1.7 3.5A10 10 0 1 0 12 2Z" />
        </svg>,
        "#e60023"
      );
    case "Twitch":
      return wrap(
        <svg width={s * 0.55} height={s * 0.55} viewBox="0 0 24 24" fill="white">
          <path d="M4 3h17v11l-5 5h-3l-3 3H7v-3H3V6l1-3Zm2 2v11h3v3l3-3h4l3-3V5H6Zm5 3h2v5h-2V8Zm5 0h2v5h-2V8Z" />
        </svg>,
        "#9146ff"
      );
    case "Dailymotion":
      return wrap(
        <svg width={s * 0.5} height={s * 0.5} viewBox="0 0 24 24" fill="white">
          <circle cx="12" cy="12" r="6" />
        </svg>,
        "#0066dc"
      );
    default:
      return wrap(
        <span style={{ fontSize: s * 0.4, fontWeight: 700 }}>{String(name)[0]}</span>,
        "#999"
      );
  }
};
