import type React from "react"
import ClientLayout from "./clientLayout"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TooltipProvider>
      <ClientLayout>{children}</ClientLayout>
    </TooltipProvider>
  )
}


import './globals.css'

export const metadata = {
      generator: 'v0.dev'
    };
