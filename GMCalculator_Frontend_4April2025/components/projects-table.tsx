"use client"

import React, { forwardRef, useImperativeHandle, useCallback, useEffect, useState } from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  MoreHorizontal,
  Edit,
  Trash2,
  Calculator,
  LineChart,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EditProjectDialog } from "./edit-project-dialog"
import { MarginHistoryDialog } from "./margin-history-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { getToken } from "@/utils/auth"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

type Project = {
  id: string
  project_code: string   // New field
  delivery_unit: string
  account_name: string
  project_name: string
  engagement_type: string  // New field
  staffingmodel: string   // New field
  service_type: string    // New field
  delivery_manager_id: number
  delivery_head_id: number
  start_date: string
  end_date: string
}


interface Employee {
  id: number
  employee_id: string
  employee_email: string
  employee_name: string
  role_id: number
}

interface EmployeeMap {
  [key: number]: string
}

export const ProjectsTable = forwardRef((_, ref) => {
  const [projects, setProjects] = React.useState<Project[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [selectedProject, setSelectedProject] = React.useState<{ id: string; name: string } | null>(null)
  const [editingProject, setEditingProject] = React.useState<Project | null>(null)
  const [deletingProject, setDeletingProject] = React.useState<Project | null>(null)
  const [uploadingGM, setUploadingGM] = React.useState<Project | null>(null)
  const [selectedFile1, setSelectedFile1] = React.useState<File | null>(null)
  const [selectedFile2, setSelectedFile2] = React.useState<File | null>(null)
  const [selectedFile3, setSelectedFile3] = React.useState<File | null>(null)
  const [uploadConfirmation, setUploadConfirmation] = React.useState<string | null>(null)
  const [employeeMap, setEmployeeMap] = useState<EmployeeMap>({})
  const { toast } = useToast()
  const router = useRouter()

  useImperativeHandle(ref, () => ({
    fetchProjects, // Expose the fetchProjects function to the parent
  }))

  React.useEffect(() => {
    fetchProjects()
  }, []) // Removed employeeMap from dependencies

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = getToken()
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employee`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!response.ok) {
          throw new Error("Failed to fetch employees")
        }
        const employees: Employee[] = await response.json()
        const map: EmployeeMap = {}
        employees.forEach((emp) => {
          map[emp.id] = emp.employee_name
        })
        setEmployeeMap(map)
      } catch (error) {
        
      }
    }

    fetchEmployees()
  }, [])

  const formatMuddyDate = (dateString: string) => {
    if (!dateString) return "Unknown Date"

    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Invalid Date"

    const suffix = (d: number) => {
      if (d > 3 && d < 21) return "th"
      switch (d % 10) {
        case 1:
          return "st"
        case 2:
          return "nd"
        case 3:
          return "rd"
        default:
          return "th"
      }
    }

    const month = (date.getMonth() + 1).toString().padStart(2, "0") // Ensures two digits
    const day = date.getDate().toString().padStart(2, "0")
    const year = date.getFullYear()

    return `${day}-${month}-${year}`
  }

  const fetchProjects = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch projects")
      }
      const data = await response.json()
      const formattedData = data.map((project: Project) => ({
        ...project,
        start_date: formatMuddyDate(project.start_date),
        end_date: formatMuddyDate(project.end_date),
        delivery_manager_name:
          employeeMap[project.delivery_manager_id] || `Unknown (ID: ${project.delivery_manager_id})`,
        delivery_head_name: 
          employeeMap[project.delivery_head_id] || `Unknown (ID: ${project.delivery_head_id})`,
      }))
  
      setProjects(formattedData)
    } catch (err) {
      setError("Failed to load projects. Please try again later.")
      toast({
        title: "Error",
        description: "Failed to load projects. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  

  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: "project_code",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left font-bold p-0"
          >
            Project ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return <div className="font-medium">{row.getValue("project_code")}</div>
      },
    },
    {
      accessorKey: "engagement_type",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left font-bold p-0"
          >
            Engagement Type
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return <div>{row.getValue("engagement_type")}</div>
      },
    },
    {
      accessorKey: "staffingmodel",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left font-bold p-0"
          >
            Staffing Model
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return <div>{row.getValue("staffingmodel")}</div>
      },
    },
    {
      accessorKey: "service_type",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left font-bold p-0"
          >
            Service Type
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return <div>{row.getValue("service_type")}</div>
      },
    },
    {
      accessorKey: "delivery_unit",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left font-bold p-0"
          >
            Delivery Unit
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return <div className="font-medium">{row.getValue("delivery_unit")}</div>
      },
    },
    {
      accessorKey: "account_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left font-bold p-0"
          >
            Account Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "project_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left font-bold p-0"
          >
            Project Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return <div className="font-medium text-secondary">{row.getValue("project_name")}</div>
      },
    },
    {
      accessorKey: "delivery_manager_id",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left font-bold p-0"
          >
            Delivery Manager
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const managerId = row.getValue("delivery_manager_id") as number
        return <div>{employeeMap[managerId] || `Unknown (ID: ${managerId})`}</div>
      },
    },
    {
      accessorKey: "delivery_head_id",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left font-bold p-0"
          >
            Delivery Head
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const headId = row.getValue("delivery_head_id") as number
        return <div>{employeeMap[headId] || `Unknown (ID: ${headId})`}</div>
      },
    },
    {
      accessorKey: "start_date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left font-bold p-0"
          >
            Start Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return (
          <Badge variant="outline" className="font-normal">
            {row.getValue("start_date")}
          </Badge>
        )
      },
    },
    {
      accessorKey: "end_date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left font-bold p-0"
          >
            End Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return (
          <Badge variant="outline" className="font-normal">
            {row.getValue("end_date")}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const project = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuItem onClick={() => setEditingProject(project)} className="cursor-pointer py-2">
                <Edit className="mr-2 h-4 w-4" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeletingProject(project)} className="cursor-pointer py-2">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Project
              </DropdownMenuItem>
              {/* <DropdownMenuItem onClick={() => setUploadingGM(project)} className="cursor-pointer py-2">
                <Calculator className="mr-2 h-4 w-4" />
                Calculate GM
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedProject({ id: project.id, name: project.project_name })}
                className="cursor-pointer py-2"
              >
                <LineChart className="mr-2 h-4 w-4" />
                View Gross Margin
              </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: projects,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  const handleSaveProject = async (updatedProject: Project) => {
    try {
      const token = getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${updatedProject.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedProject),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to update project: ${response.status} ${response.statusText}. ${errorText}`)
      }

      const updatedData = await response.json()
      toast({
        title: "Project Updated",
        description: "The project has been successfully updated.",
      })
      fetchProjects() // Refresh the projects list
    } catch (error) {
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update the project. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProject = async () => {
    if (deletingProject) {
      try {
        const token = getToken()
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${deletingProject.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to delete project")
        }

        toast({
          title: "Project Deleted",
          description: "The project has been successfully deleted.",
        })
        fetchProjects() // Refresh the projects list
        setDeletingProject(null)
        router.refresh() // Refresh the page to update any server-side rendered content
      } catch (error) {
        
        toast({
          title: "Error",
          description: "Failed to delete the project. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleUploadGM = useCallback(async () => {
    if (uploadingGM && selectedFile1 && selectedFile2 && selectedFile3) {
      if (
        (!selectedFile1.type.includes("sheet") && !selectedFile1.type.includes("excel")) ||
        (!selectedFile2.type.includes("sheet") && !selectedFile2.type.includes("excel")) ||
        (!selectedFile3.type.includes("sheet") && !selectedFile3.type.includes("excel"))
      ) {
        toast({
          title: "Invalid File Type",
          description: "Please upload Excel files (.xlsx or .xls)",
          variant: "destructive",
        })
        return
      }

      try {
        const formData = new FormData()
        formData.append("file1", selectedFile1)
        formData.append("file2", selectedFile2)
        formData.append("file3", selectedFile3)

        const token = getToken()
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${uploadingGM.id}/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Failed to upload GM calculation")
        }

        toast({
          title: "Files Uploaded",
          description: "GM calculation files have been successfully uploaded and processed.",
        })
        setSelectedFile1(null)
        setSelectedFile2(null)
        setSelectedFile3(null)
        fetchProjects() // Refresh the projects list
      } catch (error) {
        
        toast({
          title: "Error",
          description: "Failed to upload and process the GM calculation. Please try again.",
          variant: "destructive",
        })
      } finally {
        setUploadingGM(null)
      }
    }
  }, [uploadingGM, selectedFile1, selectedFile2, selectedFile3, toast])

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading projects...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500 bg-red-50 rounded-md">{error}</div>
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <h2 className="text-lg font-semibold">Project List</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by delivery unit..."
            value={(table.getColumn("delivery_unit")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("delivery_unit")?.setFilterValue(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="py-3">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="hover:bg-muted/30">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length > 0
            ? `Showing ${table.getFilteredRowModel().rows.length > 0 ? "1" : "0"} - ${
                table.getFilteredRowModel().rows.length
              } of ${table.getFilteredRowModel().rows.length}`
            : "No"}{" "}
          row(s) displayed.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 px-3"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 px-3"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
      <MarginHistoryDialog
        open={!!selectedProject}
        onOpenChange={(open) => !open && setSelectedProject(null)}
        projectId={selectedProject?.id || ""}
        projectName={selectedProject?.name || ""}
      />
      {editingProject && (
        <EditProjectDialog
          project={editingProject}
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
          onSave={handleSaveProject}
          onProjectUpdated={fetchProjects}
        />
      )}
      <AlertDialog open={!!deletingProject} onOpenChange={(open) => !open && setDeletingProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project and remove the data from our
              servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={!!uploadingGM}
        onOpenChange={(open) => {
          if (!open) {
            setUploadingGM(null)
            setSelectedFile1(null)
            setSelectedFile2(null)
            setSelectedFile3(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload GM Calculation for {uploadingGM?.project_name}</DialogTitle>
          </DialogHeader>
          <div className="grid w-full items-center gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="gm-file-1" className="font-medium">
                Upload Finance Sheet (Excel)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="gm-file-1"
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (
                      file &&
                      (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                        file.type === "application/vnd.ms-excel")
                    ) {
                      setSelectedFile1(file)
                    } else {
                      toast({
                        title: "Invalid File Type",
                        description: "Please upload an Excel file (.xlsx or .xls)",
                        variant: "destructive",
                      })
                    }
                  }}
                  className="cursor-pointer"
                />
              </div>
              {selectedFile1 && <p className="text-xs text-green-600">✓ {selectedFile1.name} selected</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gm-file-2" className="font-medium">
                Upload RM Sheet (Excel)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="gm-file-2"
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (
                      file &&
                      (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                        file.type === "application/vnd.ms-excel")
                    ) {
                      setSelectedFile2(file)
                    } else {
                      toast({
                        title: "Invalid File Type",
                        description: "Please upload an Excel file (.xlsx or .xls)",
                        variant: "destructive",
                      })
                    }
                  }}
                  className="cursor-pointer"
                />
              </div>
              {selectedFile2 && <p className="text-xs text-green-600">✓ {selectedFile2.name} selected</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gm-file-3" className="font-medium">
                Upload Salary Sheet (Excel)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="gm-file-3"
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (
                      file &&
                      (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                        file.type === "application/vnd.ms-excel")
                    ) {
                      setSelectedFile3(file)
                    } else {
                      toast({
                        title: "Invalid File Type",
                        description: "Please upload an Excel file (.xlsx or .xls)",
                        variant: "destructive",
                      })
                    }
                  }}
                  className="cursor-pointer"
                />
              </div>
              {selectedFile3 && <p className="text-xs text-green-600">✓ {selectedFile3.name} selected</p>}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setUploadingGM(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleUploadGM}
                disabled={!selectedFile1 || !selectedFile2 || !selectedFile3}
                className="bg-secondary hover:bg-secondary/90"
              >
                Upload & Calculate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
})