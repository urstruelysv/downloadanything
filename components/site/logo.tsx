"use client";

import * as React from "react";

export const Logo = ({ size = 32 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="lg-blue" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1e6fd9" />
        <stop offset="100%" stopColor="#3a8db8" />
      </linearGradient>
      <linearGradient id="lg-green" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2d8a4e" />
        <stop offset="100%" stopColor="#3aa86a" />
      </linearGradient>
      <linearGradient id="lg-handle" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1e6fd9" />
        <stop offset="100%" stopColor="#2d8a4e" />
      </linearGradient>
    </defs>
    <circle cx="26" cy="26" r="20" stroke="url(#lg-blue)" strokeWidth="6" fill="none" />
    <circle cx="26" cy="26" r="9" fill="url(#lg-green)" />
    <circle cx="26" cy="26" r="2.5" fill="white" />
    <path
      d="M40 40 L54 54"
      stroke="url(#lg-handle)"
      strokeWidth="7"
      strokeLinecap="round"
    />
  </svg>
);

export const LogoLockup = ({
  size = 28,
  color = "#0a0a0a",
}: {
  size?: number;
  color?: string;
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <Logo size={size} />
    <span
      style={{
        fontFamily: "'Instrument Serif', serif",
        fontSize: size * 0.95,
        color,
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}
    >
      download
      <span style={{ fontStyle: "italic", color: "#1e6fd9" }}>any</span>
      thing
    </span>
  </div>
);

export type IconName =
  | "arrow-down"
  | "arrow-right"
  | "check"
  | "x"
  | "link"
  | "sparkles"
  | "shield"
  | "bolt"
  | "globe"
  | "gem"
  | "play"
  | "pause"
  | "download"
  | "film"
  | "music"
  | "image"
  | "plus"
  | "menu"
  | "star"
  | "chev-down"
  | "clock"
  | "trash"
  | "paste"
  | "lock"
  | "infinity";

export const Icon = ({
  name,
  size = 18,
  stroke = "currentColor",
  strokeWidth = 1.6,
}: {
  name: IconName;
  size?: number;
  stroke?: string;
  strokeWidth?: number;
}) => {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "arrow-down":
      return (
        <svg {...props}>
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg {...props}>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      );
    case "check":
      return (
        <svg {...props}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    case "x":
      return (
        <svg {...props}>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      );
    case "link":
      return (
        <svg {...props}>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...props}>
          <path d="m12 3-1.5 4.5L6 9l4.5 1.5L12 15l1.5-4.5L18 9l-4.5-1.5L12 3Z" />
          <path d="M5 17v4M3 19h4M19 3v4M17 5h4" />
        </svg>
      );
    case "shield":
      return (
        <svg {...props}>
          <path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "bolt":
      return (
        <svg {...props}>
          <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
        </svg>
      );
    case "globe":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
        </svg>
      );
    case "gem":
      return (
        <svg {...props}>
          <path d="m6 3 6 18 6-18M3 9h18M8 9l4-6 4 6" />
        </svg>
      );
    case "play":
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <path d="M6 4v16l14-8-14-8Z" />
        </svg>
      );
    case "pause":
      return (
        <svg {...props}>
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      );
    case "download":
      return (
        <svg {...props}>
          <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
        </svg>
      );
    case "film":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M7 3v18M17 3v18M3 8h4M17 8h4M3 16h4M17 16h4" />
        </svg>
      );
    case "music":
      return (
        <svg {...props}>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );
    case "image":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      );
    case "plus":
      return (
        <svg {...props}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "menu":
      return (
        <svg {...props}>
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      );
    case "star":
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <path d="m12 2 3 7 7 .8-5.2 4.6 1.6 7L12 17.8 5.6 21.4l1.6-7L2 9.8 9 9l3-7Z" />
        </svg>
      );
    case "chev-down":
      return (
        <svg {...props}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
    case "clock":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      );
    case "trash":
      return (
        <svg {...props}>
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        </svg>
      );
    case "paste":
      return (
        <svg {...props}>
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        </svg>
      );
    case "lock":
      return (
        <svg {...props}>
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      );
    case "infinity":
      return (
        <svg {...props}>
          <path d="M18.178 8c-2.022 0-3.766 1.244-5.066 3-1.3 1.756-3.044 3-5.066 3a3.444 3.444 0 1 1 0-6c2.022 0 3.766 1.244 5.066 3 1.3 1.756 3.044 3 5.066 3a3.444 3.444 0 1 0 0-6Z" />
        </svg>
      );
    default:
      return null;
  }
};
