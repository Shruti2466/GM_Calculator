"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SidebarNav } from "@/components/sidebar-nav"
import { usePathname } from "next/navigation"
import { getEmployeeName, getRole } from "@/utils/auth"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [employeeName, setEmployeeName] = useState("")
  const [employeeRole, setEmployeeRole] = useState("")

  useEffect(() => {
    const loggedIn = pathname !== "/login"
    setIsLoggedIn(loggedIn)
    if (loggedIn) {
      setEmployeeName(getEmployeeName() || "")
      setEmployeeRole(getRole() || "")
    }
  }, [pathname])

  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col ">
          <Header
            showMenu={false}
            onMenuClick={() => {}}
            employeeName={employeeName}
            employeeRole={employeeRole}
            isLoggedIn={isLoggedIn}
          />

          <div className="flex flex-1">
            {isLoggedIn && (
              <aside className="sticky top-0 h-[calc(100vh-4rem)] w-64 border-r bg-background">
                <SidebarNav />
              </aside>
            )}
            <main className="flex-1 overflow-auto">
              <div className="container py-4 md:py-6 px-4">{children}</div>
            </main>
          </div>
        </div>
        <Footer />
        <Toaster />
      </body>
    </html>
  )
}
