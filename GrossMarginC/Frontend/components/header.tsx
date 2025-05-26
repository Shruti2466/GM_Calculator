"use client"

import Image from "next/image"
import { MenuIcon, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { removeAuth } from "@/utils/auth"

interface HeaderProps {
  onMenuClick: () => void
  showMenu: boolean
  employeeName: string
  employeeRole: string
  isLoggedIn: boolean
}

export function Header({ onMenuClick, showMenu, employeeName, employeeRole, isLoggedIn }: HeaderProps) {
  const router = useRouter()

  const handleLogout = () => {
    removeAuth()
    router.push("/login")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-secondary text-white shadow-sm">
      <div className="relative h-16 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {showMenu && (
            <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-secondary/80">
              <MenuIcon className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}
          <div className="flex items-center space-x-4">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo_new-qX4MzRWNyD1UK8uR4yBdfWjnxm9lJu.png"
              alt="Harbinger Group Logo"
              width={140}
              height={40}
              className="h-10 w-auto"
            />
            <div className="hidden md:block h-6 w-px bg-white/20" />
            <h1 className="hidden md:block text-xl font-semibold text-white">Gross Margin Calculator</h1>
          </div>
        </div>

        {isLoggedIn && (
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-3 hover:bg-secondary/80 text-white rounded-full px-3 py-2"
                >
                  <Avatar className="h-8 w-8 border-2 border-white/20">
                    <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                      {getInitials(employeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-white">{employeeName}</p>
                    <p className="text-xs text-white/70">{employeeRole}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-white/70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2 md:hidden">
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium">{employeeName}</p>
                    <p className="text-xs text-muted-foreground">{employeeRole}</p>
                  </div>
                </div>
                <DropdownMenuSeparator className="md:hidden" />
                <DropdownMenuItem onClick={() => router.push("/dashboard")} className="py-2">
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/projects")} className="py-2">
                  Projects
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 py-2">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  )
}
