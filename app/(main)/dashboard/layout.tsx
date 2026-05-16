import type { Metadata } from "next"
import DashboardLayoutClient from "@/components/layout/DashboardLayoutClient";

export const metadata: Metadata = { title: "iRoomReserve | Dashboard" }

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}