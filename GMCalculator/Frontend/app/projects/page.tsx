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
    <div className="h-full w-full max-w-full overflow-hidden">
      <div className="h-full flex flex-col space-y-4 p-4">
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 shrink-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight truncate">Projects</h1>
            <p className="text-muted-foreground truncate">Manage your projects and calculate gross margins</p>
          </div>
          <div className="shrink-0">
            <AddProjectDialog onProjectAdded={handleProjectAdded} />
          </div>
        </div>

        <Card className="flex-1 min-h-0 flex flex-col">
          <CardHeader className="shrink-0">
            <CardTitle>All Projects</CardTitle>
            <CardDescription>View, edit, and manage all your projects from one place</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-hidden">
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
              <div className="h-full overflow-auto">
                <ProjectsTable ref={projectsTableRef} />
              </div>
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}