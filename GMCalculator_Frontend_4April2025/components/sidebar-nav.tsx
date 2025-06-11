"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { LayoutDashboard, FolderKanban, LogOut, FileText, FileUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getEmail, removeAuth, getRole } from "@/utils/auth"

export function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)
  const [userEmail, setUserEmail] = useState("")
  const [userName, setUserName] = useState("")
  const [userRole, setUserRole] = useState("")

  useEffect(() => {
    const email = getEmail()
    const role = getRole()
    const name = localStorage.getItem("employeeName") || ""

    if (email) setUserEmail(email)
    if (role) setUserRole(role)
    if (name) setUserName(name)
  }, [])

  const handleLogout = () => {
    removeAuth()
    router.push("/login")
  }

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Projects",
      href: "/projects",
      icon: FolderKanban,
    },
    {
      title: "Upload Monthly Data",
      href: "/upload-monthly-data",
      icon: FileUp,
    },
  ]

  // Add Audit Trail for Admin users
  if (userRole === "Admin") {
    navItems.push({
      title: "Audit Trail",
      href: "/audit-trail",
      icon: FileText,
    })
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-background transition-all duration-300 relative",
        isOpen ? "w-62" : "w-16",
      )}
    >
      <div className="flex flex-col h-full py-4">
        {/* Navigation items */}
        <div className="space-y-1 px-2 flex-1">
          <TooltipProvider delayDuration={0}>
            {navItems.map((item) => (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <Button
                      variant={pathname === item.href ? "secondary" : "ghost"}
                      className={cn("w-full justify-start mb-1", !isOpen && "justify-center px-2")}
                    >
                      <item.icon className={cn("h-5 w-5", isOpen && "mr-2")} />
                      {isOpen && <span>{item.title}</span>}
                    </Button>
                  </Link>
                </TooltipTrigger>
                {!isOpen && (
                  <TooltipContent side="right">
                    <p>{item.title}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>

        {/* Logout button */}
        <div className="mt-auto px-2">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100/50",
                  !isOpen && "justify-center px-2",
                )}
                onClick={handleLogout}
              >
                <LogOut className={cn("h-5 w-5", isOpen && "mr-2")} />
                {isOpen && <span>Logout</span>}
              </Button>
            </TooltipTrigger>
            {!isOpen && (
              <TooltipContent side="right">
                <p>Logout</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
