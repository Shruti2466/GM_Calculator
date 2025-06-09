"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ChevronLeft, ChevronRight, FileText, Search, Calendar, RefreshCw } from "lucide-react"
import { getToken, getRole } from "@/utils/auth"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface AuditEntry {
  id: number
  projectName: string
  uploadedPath: string
  createdBy: string
  createdAt: string
}

export default function AuditTrailPage() {
  const [auditData, setAuditData] = useState<AuditEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortColumn, setSortColumn] = useState<keyof AuditEntry>("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  // Add pagination state at the beginning of the component
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [isRefreshing, setIsRefreshing] = useState(false)

  const filteredAuditData = auditData.filter((entry) =>
    Object.values(entry).some(
      (value) => typeof value === "string" && value.toLowerCase().includes(searchTerm.toLowerCase()),
    ),
  )

  // Update the pagination logic
  const totalPages = Math.ceil(filteredAuditData.length / pagination.pageSize)
  const indexOfLastEntry = (pagination.pageIndex + 1) * pagination.pageSize
  const indexOfFirstEntry = indexOfLastEntry - pagination.pageSize
  const currentEntries = filteredAuditData.slice(indexOfFirstEntry, indexOfLastEntry)

  const fetchAuditData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = getToken()
      const role = getRole()

      if (role !== "Admin") {
        router.push("/dashboard")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/auditlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch audit data")
      }
      const data = await response.json()
      setAuditData(data)
    } catch (err) {
      setError("Failed to load audit data. Please try again later.")
      console.error("Error fetching audit data:", err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAuditData()
  }, [router])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchAuditData()
  }

  const handleSort = (column: keyof AuditEntry) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const sortedData = [...auditData].sort((a, b) => {
    if (a[sortColumn] < b[sortColumn]) return sortDirection === "asc" ? -1 : 1
    if (a[sortColumn] > b[sortColumn]) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getFileType = (path: string) => {
    const extension = path.split(".").pop()?.toLowerCase()
    return extension === "xlsx" || extension === "xls" ? "Excel" : "File"
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Audit Trail</h1>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Project Uploads</CardTitle>
            <CardDescription>Track all file uploads across projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-[400px] w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Audit Trail</h1>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Trail</h1>
        <p className="text-muted-foreground mt-1">Track and monitor all file uploads across projects</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Project Uploads</CardTitle>
            <CardDescription>A comprehensive log of all files uploaded to the system</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing} className="h-9 w-9">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh data</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search audit entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="rounded-md border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("projectName")} className="flex items-center">
                      Project Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("uploadedPath")} className="flex items-center">
                      Uploaded File
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("createdBy")} className="flex items-center">
                      Created By
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("createdAt")} className="flex items-center">
                      Created At
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No audit entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  currentEntries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{entry.projectName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          <a
                            href={`${String(process.env.NEXT_PUBLIC_API_BASE_URL).replace("api", "")}${entry.uploadedPath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {entry.uploadedPath.split("/").pop()}
                          </a>
                          <Badge variant="outline" className="ml-2">
                            {getFileType(entry.uploadedPath)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{entry.createdBy}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(entry.createdAt)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Update the pagination controls */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredAuditData.length)} of{" "}
              {filteredAuditData.length} entries
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={pagination.pageSize}
                onChange={(e) => {
                  setPagination((prev) => ({ ...prev, pageSize: Number(e.target.value), pageIndex: 0 }))
                }}
                className="border rounded px-2 py-1 text-sm"
              >
                {[5, 10, 20, 30].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    Show {pageSize}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, pageIndex: Math.max(0, prev.pageIndex - 1) }))}
                disabled={pagination.pageIndex === 0}
                className="h-8 px-3"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm">
                Page {pagination.pageIndex + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({ ...prev, pageIndex: Math.min(totalPages - 1, prev.pageIndex + 1) }))
                }
                disabled={pagination.pageIndex >= totalPages - 1}
                className="h-8 px-3"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
