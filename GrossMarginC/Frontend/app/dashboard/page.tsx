"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DashboardProjectGMChart } from "@/components/dashboard-project-gm-chart"
import { DollarSign, Percent, TrendingUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getToken, getEmployeeName, getRole } from "@/utils/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { redirect } from "next/navigation"

interface OrganizationMetrics {
  totalDirectCost: string
  totalGrossMargin: string
  avgGrossMarginPercentage: string
}

export default function DashboardPage() {
  // Check authentication first
  useEffect(() => {
    const token = getToken()
    if (!token) {
      redirect("/login")
    }
  }, [])

  const [selectedDeliveryUnit, setSelectedDeliveryUnit] = useState<string>("all")
  const [metrics, setMetrics] = useState<OrganizationMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deliveryUnits, setDeliveryUnits] = useState<string[]>([])
  const [isDUListLoading, setIsDUListLoading] = useState(true)
  const [duListError, setDUListError] = useState<string | null>(null)
  const [employeeName, setEmployeeName] = useState<string>("")
  const [employeeRole, setEmployeeRole] = useState<string>("")

  useEffect(() => {
    const fetchDeliveryUnits = async () => {
      setIsDUListLoading(true)
      setDUListError(null)
      try {
        const token = getToken()
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/dashboard/dulist`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!response.ok) {
          throw new Error("Failed to fetch delivery units")
        }
        const data = await response.json()
        setDeliveryUnits(["all", ...data])
      } catch (err) {
        setDUListError("Failed to load delivery units. Please try again later.")
        console.error("Error fetching delivery units:", err)
      } finally {
        setIsDUListLoading(false)
      }
    }
    fetchDeliveryUnits()

    // Set employee name and role
    setEmployeeName(getEmployeeName() || "")
    setEmployeeRole(getRole() || "")
  }, [])

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const token = getToken()
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/dashboard/organization-metrics/${selectedDeliveryUnit}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        if (!data || data.length === 0) {
          throw new Error("No data received from the API")
        }
        console.log("Metrics data:", data)
        setMetrics(data[0])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
        setError(`Failed to load organization metrics. ${errorMessage}`)
        console.error("Error fetching metrics:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [selectedDeliveryUnit])

  useEffect(() => {
    if (error) {
      console.error("Dashboard error state:", error)
    }
  }, [error])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {employeeName}! Here's an overview of your projects' performance.
          </p>
        </div>
        <Select value={selectedDeliveryUnit} onValueChange={setSelectedDeliveryUnit} disabled={isDUListLoading}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Delivery Unit" />
          </SelectTrigger>
          <SelectContent>
            {isDUListLoading ? (
              <SelectItem value="loading" disabled>
                Loading...
              </SelectItem>
            ) : (
              deliveryUnits.map((du) => (
                <SelectItem key={du} value={du}>
                  {du === "all" ? "All Delivery Units" : du}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Direct Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-[120px]" />
            ) : error ? (
              <div className="text-sm text-red-500">Error loading data</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(Number(metrics?.totalDirectCost) || 0)}</div>
                <p className="text-xs text-muted-foreground">Last 6 months</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gross Margin</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-[120px]" />
            ) : error ? (
              <div className="text-sm text-red-500">Error loading data</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(Number(metrics?.totalGrossMargin) || 0)}</div>
                <p className="text-xs text-muted-foreground">Last 6 months</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Gross Margin %</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-[120px]" />
            ) : error ? (
              <div className="text-sm text-red-500">Error loading data</div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatPercentage(Number(metrics?.avgGrossMarginPercentage) || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Last 6 months</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Trend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-[120px]" />
            ) : error ? (
              <div className="text-sm text-red-500">Error loading data</div>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {Number(metrics?.avgGrossMarginPercentage) > 50 ? "Positive" : "Needs Attention"}
                </div>
                <p className="text-xs text-muted-foreground">Based on margin percentage</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Project Gross Margins - Last 6 Months</CardTitle>
            <CardDescription>Trend analysis of gross margin percentages across all projects</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <DashboardProjectGMChart deliveryUnit={selectedDeliveryUnit} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
