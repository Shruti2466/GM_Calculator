"use client"
import * as React from "react"
import { useRef } from "react"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { AddProjectDialog } from "@/components/add-project-dialog"
import { ProjectsTable } from "@/components/projects-table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getToken } from "@/utils/auth"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectsPage() {
  React.useEffect(() => {
    const token = getToken()
    if (!token) {
      redirect("/login")
    }
  }, [])

  // Ref for accessing ProjectsTable functions
  const projectsTableRef = useRef<{ fetchProjects: () => void }>(null)

  const handleProjectAdded = () => {
    if (projectsTableRef.current) {
      projectsTableRef.current.fetchProjects() // Call the fetchProjects function
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your projects and calculate gross margins</p>
        </div>
        <AddProjectDialog onProjectAdded={handleProjectAdded} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>View, edit, and manage all your projects from one place</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            }
          >
            <ProjectsTable ref={projectsTableRef} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
