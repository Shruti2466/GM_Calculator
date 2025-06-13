"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { getToken } from "@/utils/auth"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Employee {
  id: number
  employee_id: string
  employee_email: string
  employee_name: string
  role_id: number
}

interface Project {
  id: string
  delivery_unit: string
  account_name: string
  project_name: string
  delivery_manager_id: number
  delivery_head_id: number
  start_date: string
  end_date: string
}

interface EditProjectDialogProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updatedProject: Project) => void
  onProjectUpdated: () => void
}

const formSchema = z.object({
  delivery_unit: z.string().min(2, {
    message: "Delivery unit is required and must be at least 2 characters.",
  }),
  account_name: z.string().min(2, {
    message: "Account name is required and must be at least 2 characters.",
  }),
  project_name: z.string().min(2, {
    message: "Project name is required and must be at least 2 characters.",
  }),
  delivery_manager_id: z.string().min(1, { message: "Delivery Manager is required." }),
  delivery_head_id: z.string().min(1, { message: "Delivery Head is required." }),
  start_date: z.string().min(1, { message: "Start date is required." }),
  end_date: z.string().min(1, { message: "End date is required." }),
})

export function EditProjectDialog({ project, open, onOpenChange, onSave, onProjectUpdated }: EditProjectDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [deliveryManagers, setDeliveryManagers] = useState<Employee[]>([])
  const [deliveryHeads, setDeliveryHeads] = useState<Employee[]>([])
  const { toast } = useToast()

  const formatDateForInput = (isoDate: string) => {
    if (!isoDate) return ""
    
    const [day, month, year] = isoDate.split("T")[0].split("-").map(Number)

    const formattedDate = new Date(year, month - 1, day)
    const dd = String(formattedDate.getDate()).padStart(2, "0")
    const mm = String(formattedDate.getMonth() + 1).padStart(2, "0")
    // Months are 0-based
    const yyyy = formattedDate.getFullYear()
    const finalDate = `${yyyy}-${mm}-${dd}`
  
    return finalDate // Extract YYYY-MM-DD from YYYY-MM-DDTHH:MM:SSZ
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      delivery_unit: project.delivery_unit,
      account_name: project.account_name,
      project_name: project.project_name,
      delivery_manager_id: project.delivery_manager_id.toString(),
      delivery_head_id: project.delivery_head_id.toString(),
      start_date: formatDateForInput(project.start_date),
      end_date: formatDateForInput(project.end_date),
    },
  })

  useEffect(() => {
    const fetchEmployees = async () => {
      const token = getToken()
      try {
        const [dmResponse, dhResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employee/role/dm`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employee/role/dh`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (!dmResponse.ok || !dhResponse.ok) {
          throw new Error("Failed to fetch employee data")
        }

        const dmData = await dmResponse.json()
        const dhData = await dhResponse.json()

        setDeliveryManagers(dmData)
        setDeliveryHeads(dhData)
      } catch (error) {
        
        toast({
          title: "Error",
          description: "Failed to load employee data. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchEmployees()
  }, [toast])

  const handleSave = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    try {
      const token = getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...values,
          delivery_manager_id: Number.parseInt(values.delivery_manager_id),
          delivery_head_id: Number.parseInt(values.delivery_head_id),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update project")
      }

      const updatedProject = await response.json()
      onSave(updatedProject)
      onOpenChange(false)
      onProjectUpdated()
      toast({
        title: "Project Updated",
        description: "The project has been successfully updated.",
      })
    } catch (error) {
     
      toast({
        title: "Error",
        description: "Failed to update the project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="delivery_unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Unit</FormLabel>
                  <FormControl>
                    <Input {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="account_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="project_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="delivery_manager_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Manager</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Delivery Manager" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {deliveryManagers.map((dm) => (
                        <SelectItem key={dm.id} value={dm.id.toString()}>
                          {dm.employee_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="delivery_head_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Head</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Delivery Head" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {deliveryHeads.map((dh) => (
                        <SelectItem key={dh.id} value={dh.id.toString()}>
                          {dh.employee_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
