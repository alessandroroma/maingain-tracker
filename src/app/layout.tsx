import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maingain Tracker",
  description: "Track food, workouts, and body recomp",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
