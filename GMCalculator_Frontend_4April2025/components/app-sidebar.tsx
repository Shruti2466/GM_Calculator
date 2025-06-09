"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { LayoutDashboard, FolderKanban, LogOut, FileText, FileUp } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { getEmail, removeAuth, getRole } from "@/utils/auth"

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userRole, setUserRole] = useState("")

  useEffect(() => {
    const role = getRole()
    if (role) setUserRole(role)
  }, [])

  const handleLogout = () => {
    removeAuth()
    router.push("/login")
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
//   if (userRole === "Admin") {
//     navItems.push({
//       title: "Audit Trail",
//       href: "/audit-trail",
//       icon: FileText,
//     })
//   }

  return (
    <Sidebar className="w-[25vw] min-w-[180px] max-w-[260px]">
      <SidebarHeader className="px-3 py-3">
        <div className="px-2">
          <h2 className="text-lg font-semibold">GM Calculator</h2>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup className="px-0">
          <SidebarGroupLabel className="px-2 py-1 text-xs">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="px-3 py-2 h-9"
                  >
                    <a href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-2 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="px-3 py-2 h-9">
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}