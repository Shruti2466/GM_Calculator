"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { getToken } from "@/utils/auth"

interface Role {
  id: number
  role_name: string
}

interface AddUserFormProps {
  onSuccess: () => void
  onUserAdded: () => void
}

export function AddUserForm({ onSuccess, onUserAdded }: AddUserFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [roleId, setRoleId] = useState("")
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = getToken()
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch roles")
        }

        const rolesData = await response.json()
        setRoles(rolesData)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load roles. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchRoles()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/admin/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          role_id: parseInt(roleId),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create user and employee")
      }

      toast({
        title: "Success",
        description: "User and employee created successfully",
      })

      // Reset form
      setName("")
      setEmail("")
      setRoleId("")
      
      onSuccess()
      onUserAdded()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user and employee",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select value={roleId} onValueChange={setRoleId} required disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id.toString()}>
                {role.role_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create User & Employee"}
      </Button>
    </form>
  )
}
