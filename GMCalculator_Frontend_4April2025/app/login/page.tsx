"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { setAuth } from "@/utils/auth"
import { Loader2, LogIn, UserPlus, Lock } from "lucide-react"
import Swal from "sweetalert2"
import { getToken } from "@/utils/auth"

interface Role {
  id: number
  role_name: string
}

export default function LoginPage() {
  // Login state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Register state
  const [registerName, setRegisterName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const [isRegistering, setIsRegistering] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)

  const router = useRouter()

  // Add a useEffect to check if the user is already logged in and redirect if needed
  useEffect(() => {
    const token = getToken()
    if (token) {
      router.push("/dashboard")
    }
  }, [router])

  // Fetch roles for registration
  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoadingRoles(true)
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles`)
        if (!response.ok) {
          throw new Error("Failed to fetch roles")
        }
        const data = await response.json()
        setRoles(data)
      } catch (error) {
        console.error("Error fetching roles:", error)
        toast({
          title: "Error",
          description: "Failed to load roles. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingRoles(false)
      }
    }

    fetchRoles()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setAuth({
          token: data.token,
          email: data.email,
          role: data.role,
          role_id: data.role_id,
          employeeName: data.employeeName,
          employeeId: data.employeeId,
          employeeTableId: data.employeeTableId,
        })

        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.employeeName}!`,
        })

        router.push("/dashboard")
      } else {
        if (response.status === 401) {
          Swal.fire({
            icon: "error",
            title: "Login Failed",
            text: "Password is incorrect. Please try again.",
          })
        } else {
          toast({
            title: "Login Failed",
            description: data.message || "Invalid email or password",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Login error", error)
      toast({
        title: "Login Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate passwords match
    if (registerPassword !== confirmPassword) {
      toast({
        title: "Password Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    setIsRegistering(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
          role_id: Number.parseInt(selectedRole),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "User Registered Successfully",
          text: "The user has been registered successfully!",
        })

        // Reset form and switch to login tab
        setRegisterName("")
        setRegisterEmail("")
        setRegisterPassword("")
        setConfirmPassword("")
        setSelectedRole("")

        // Switch to login tab
        document.getElementById("login-tab")?.click()
      } else {
        const errorData = await response.json()
        Swal.fire({
          icon: "error",
          title: "Registration Failed",
          text: errorData.message || "An error occurred during registration.",
        })
      }
    } catch (error) {
      console.error("Registration error", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An unexpected error occurred.",
      })
    } finally {
      setIsRegistering(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background w-full">
      <Card className="w-full max-w-md shadow-lg border-border">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" id="login-tab" className="text-base font-medium">
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="text-base font-medium">
              Register
            </TabsTrigger>
          </TabsList>

          {/* Login */}
          <TabsContent value="login">
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-2 md:hidden">
                <Lock className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl text-center font-bold">Sign In</CardTitle>
              <CardDescription className="text-center">Access your account by signing in</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Button variant="link" className="p-0 h-auto text-xs" type="button">
                      Forgot password?
                    </Button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </TabsContent>

          {/* Register */}
          <TabsContent value="register">
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-2 md:hidden">
                <UserPlus className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl text-center font-bold">Create Account</CardTitle>
              <CardDescription className="text-center">Fill in your information to register</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Full Name</Label>
                  <Input
                    id="register-name"
                    placeholder="John Doe"
                    required
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {/* <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole} disabled={isLoadingRoles}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingRoles ? (
                        <SelectItem value="loading" disabled>
                          Loading roles...
                        </SelectItem>
                      ) : (
                        roles.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.role_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div> */}
                <Button type="submit" className="w-full" disabled={isRegistering}>
                  {isRegistering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex justify-center border-t p-4">
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
