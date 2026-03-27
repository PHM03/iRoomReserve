import type { Metadata, Viewport } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f8f9fa",
};

export const metadata: Metadata = {
  title: "iRoomReserve - Smart Room Reservation System",
  description: "Smart Room Reservation and Occupancy Monitoring System for St. Dominic College of Asia",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#f8f9fa]">
      <body className="min-h-screen bg-[#f8f9fa]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
