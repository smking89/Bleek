import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bleek — chat, voice & cosmetics",
  description:
    "Bleek is a social platform with realtime channels, member profiles, and an animated cosmetic shop.",
  icons: { icon: "/bleek-icon.png", apple: "/bleek-icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
