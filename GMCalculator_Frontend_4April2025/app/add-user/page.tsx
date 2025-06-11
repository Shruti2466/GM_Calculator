"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AddUserForm } from "@/components/add-user-form"
import { getRole, isAuthenticated } from "@/utils/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function AddUserPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    // Check authentication and authorization
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }

    const userRole = getRole()
    if (userRole !== "Admin") {
      setIsAuthorized(false)
      return
    }

    setIsAuthorized(true)
  }, [router])

  const handleSuccess = () => {
    // Redirect to dashboard or show success message
    setTimeout(() => {
      router.push("/dashboard")
    }, 1000)
  }

  const handleCancel = () => {
    router.back()
  }

  // Loading state
  if (isAuthorized === null) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  // Unauthorized access
  if (isAuthorized === false) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Access denied. You need admin privileges to access this page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <AddUserForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  )
}
