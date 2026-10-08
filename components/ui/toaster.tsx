"use client";

import { Toaster as HotToaster } from "react-hot-toast";

/** App-wide toast outlet (react-hot-toast), styled to the design tokens. */
export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          fontFamily: "var(--font-instrument-sans), sans-serif",
          fontSize: "13.5px",
          color: "var(--ink)",
          background: "var(--surface)",
          border: "1px solid var(--line-soft)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-lg)",
          padding: "12px 14px",
        },
        success: { iconTheme: { primary: "var(--success-solid)", secondary: "var(--surface)" } },
        error: { iconTheme: { primary: "var(--error-solid)", secondary: "var(--surface)" } },
      }}
    />
  );
}
