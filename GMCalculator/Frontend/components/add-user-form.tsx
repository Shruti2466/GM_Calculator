"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, UserPlus, AlertCircle, CheckCircle } from "lucide-react"
import { getToken } from "@/utils/auth"

interface Role {
  id: number
  role_name: string
  role_description: string
}

interface AddUserFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function AddUserForm({ onSuccess, onCancel }: AddUserFormProps) {
  const [formData, setFormData] = useState({
    employee_id: "",
    employee_email: "",
    employee_name: "",
    role_id: "",
  })
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [rolesLoading, setRolesLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Fetch roles on component mount
  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const token = getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      } else {
        setError("Failed to fetch roles")
      }
    } catch (err) {
      setError("Error fetching roles")
    } finally {
      setRolesLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error when user starts typing
    if (error) setError("")
    if (success) setSuccess("")
  }

  const validateForm = () => {
    if (!formData.employee_id.trim()) {
      setError("Employee ID is required")
      return false
    }
    if (!formData.employee_email.trim()) {
      setError("Email is required")
      return false
    }
    if (!formData.employee_name.trim()) {
      setError("Employee name is required")
      return false
    }
    if (!formData.role_id) {
      setError("Role selection is required")
      return false
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.employee_email)) {
      setError("Please enter a valid email address")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const token = getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employee/admin/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          role_id: Number.parseInt(formData.role_id),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Employee created successfully!")
        setFormData({
          employee_id: "",
          employee_email: "",
          employee_name: "",
          role_id: "",
        })

        // Call success callback after a short delay
        setTimeout(() => {
          onSuccess?.()
        }, 1500)
      } else {
        setError(data.error || "Failed to create employee")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      employee_id: "",
      employee_email: "",
      employee_name: "",
      role_id: "",
    })
    setError("")
    setSuccess("")
  }

  if (rolesLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading roles...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Add New User
        </CardTitle>
        <CardDescription>Create a new employee account. All fields are required.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee ID</Label>
              <Input
                id="employee_id"
                type="text"
                placeholder="e.g., EMP001"
                value={formData.employee_id}
                onChange={(e) => handleInputChange("employee_id", e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee_name">Full Name</Label>
              <Input
                id="employee_name"
                type="text"
                placeholder="Enter full name"
                value={formData.employee_name}
                onChange={(e) => handleInputChange("employee_name", e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee_email">Email Address</Label>
            <Input
              id="employee_email"
              type="email"
              placeholder="employee@harbingergroup.com"
              value={formData.employee_email}
              onChange={(e) => handleInputChange("employee_email", e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role_id">Role</Label>
            <Select
              value={formData.role_id}
              onValueChange={(value) => handleInputChange("role_id", value)}
              disabled={loading}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{role.role_name}</span>
                      <span className="text-sm text-muted-foreground">{role.role_description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Employee
                </>
              )}
            </Button>

            <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
              Reset
            </Button>

            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
