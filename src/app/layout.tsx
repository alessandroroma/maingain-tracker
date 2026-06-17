import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/navigation";

export const metadata: Metadata = {
  title: "Maingain Tracker",
  description: "Track food, workouts, and body recomp",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background">
        <Nav />
        {children}
      </body>
    </html>
  );
}
