"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { getToken } from "@/utils/auth"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface Employee {
  id: number
  employee_id: string
  employee_email: string
  employee_name: string
  role_id: number
}

const formSchema = z.object({
  project_id: z.string().min(1, { message: "Project ID is required." }),
  engagement_type: z.string().min(1, { message: "Engagement Type is required." }),
  staffingmodel: z.string().min(1, { message: "Staffing Model is required." }),
  service_type: z.string().min(1, { message: "Service Type is required." }),
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

interface AddProjectFormProps {
  onSuccess: () => void
  onProjectAdded: () => void
}

export function AddProjectForm({ onSuccess, onProjectAdded }: AddProjectFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [deliveryManagers, setDeliveryManagers] = useState<Employee[]>([])
  const [deliveryHeads, setDeliveryHeads] = useState<Employee[]>([])
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      project_id: "",
      engagement_type: "",
      staffingmodel: "",
      service_type: "",
      delivery_unit: "",
      account_name: "",
      project_name: "",
      delivery_manager_id: "",
      delivery_head_id: "",
      start_date: "",
      end_date: "",
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const token = getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error("Failed to add project")
      }

      toast({
        title: "Project added successfully",
        description: "The new project has been added to the system.",
      })
      onSuccess()
      onProjectAdded() // Call this to refresh the project table
      form.reset()
    } catch (error) {
      
      toast({
        title: "Error",
        description: "There was a problem adding the project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Project ID */}
          <FormField
            control={form.control}
            name="project_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project ID</FormLabel>
                <FormControl>
                  <Input placeholder="Enter project ID" {...field} required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
  
          {/* Engagement Type */}
          <FormField
            control={form.control}
            name="engagement_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Engagement Type</FormLabel>
                <FormControl>
                  <Input placeholder="Enter engagement type" {...field} required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
  
          {/* Staffing Model */}
          <FormField
            control={form.control}
            name="staffingmodel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Staffing Model</FormLabel>
                <FormControl>
                  <Input placeholder="Enter staffing model" {...field} required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
  
          {/* Service Type */}
          <FormField
            control={form.control}
            name="service_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Type</FormLabel>
                <FormControl>
                  <Input placeholder="Enter service type" {...field} required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
  
          {/* Existing Fields */}
          <FormField
            control={form.control}
            name="delivery_unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Unit</FormLabel>
                <FormControl>
                  <Input placeholder="Enter delivery unit" {...field} required />
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
                  <Input placeholder="Enter account name" {...field} required />
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
                  <Input placeholder="Enter project name" {...field} required />
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
          <div className="grid gap-4 md:grid-cols-2">
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
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isLoading}>
            {isLoading ? "Adding..." : "Save Project"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
