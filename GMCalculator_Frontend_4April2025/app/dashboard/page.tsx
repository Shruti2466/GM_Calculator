"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DashboardProjectGMChart } from "@/components/dashboard-project-gm-chart"
import { ProjectDetailsTable } from "@/components/project-details-table"
import { DollarSign, Percent, TrendingUp, Activity } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getToken, getEmployeeName, getRole } from "@/utils/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { redirect } from "next/navigation"

interface OrganizationMetrics {
  total_revenue: number
  total_cost: number
  total_gm: number
  gm_percentage: number
}

interface AvailableMonthsResponse {
  months: string[]
  financialYears: string[]
  currentFinancialYear: string
}

export default function DashboardPage() {
  useEffect(() => {
    const token = getToken()
    console.log(token)
    if (!token) {
      redirect("/login")
    }
  }, [])

  


  const [selectedDeliveryUnit, setSelectedDeliveryUnit] = useState<string>("all")
  const [selectedMonth, setSelectedMonth] = useState<string>("YTD")
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>("")
  const [metrics, setMetrics] = useState<OrganizationMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deliveryUnits, setDeliveryUnits] = useState<string[]>([])
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [availableFinancialYears, setAvailableFinancialYears] = useState<string[]>([])
  const [currentFinancialYear, setCurrentFinancialYear] = useState<string>("")
  const [isDUListLoading, setIsDUListLoading] = useState(true)
  const [isMonthsLoading, setIsMonthsLoading] = useState(true)
  const [duListError, setDUListError] = useState<string | null>(null)
  const [monthsError, setMonthsError] = useState<string | null>(null)
  const [employeeName, setEmployeeName] = useState<string>("")
  const [employeeRole, setEmployeeRole] = useState<string>("")

  const getCurrentFinancialYear = () => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    if (currentMonth >= 4) {
      return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
    } else {
      return `${currentYear - 1}-${currentYear.toString().slice(-2)}`
    }
  }

  const isMonthDisabled = () => {
    return selectedFinancialYear === "" || isMonthsLoading
  }

  const getMonthPlaceholder = () => {
    if (selectedFinancialYear === "") return "Select Financial Year First"
    if (isMonthsLoading) return "Loading..."
    return "Select Month"
  }

  const getYTDDisplayText = (financialYear: string) => {
    if (financialYear === currentFinancialYear) {
      return "Year To Date"
    } else {
      return "All Months"
    }
  }

  const handleFinancialYearChange = (financialYear: string) => {
    setSelectedFinancialYear(financialYear)
    setSelectedMonth("YTD")
  }

  const handleMonthChange = (month: string) => {
    if (selectedFinancialYear !== "") {
      setSelectedMonth(month)
    }
  }

  const fetchDeliveryUnits = useCallback(async () => {
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
    } finally {
      setIsDUListLoading(false)
    }
  }, [])

  const fetchAvailableMonths = useCallback(async () => {
    setIsMonthsLoading(true)
    setMonthsError(null)
    try {
      const token = getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/interim-dashboard/available-months`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch available months")
      }
      const data: AvailableMonthsResponse = await response.json()

      setAvailableMonths(["YTD", ...data.months])
      setAvailableFinancialYears(data.financialYears || [])
      setCurrentFinancialYear(data.currentFinancialYear || getCurrentFinancialYear())

      const currentFY = data.currentzFinancialYear || getCurrentFinancialYear()
      if (data.financialYears && data.financialYears.includes(currentFY)) {
        setSelectedFinancialYear(currentFY)
        setSelectedMonth("YTD")
      } else if (data.financialYears && data.financialYears.length > 0) {
        setSelectedFinancialYear(data.financialYears[0])
        setSelectedMonth("YTD")
      }
    } catch (err) {
      setMonthsError("Failed to load available months. Please try again later.")
    } finally {
      setIsMonthsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDeliveryUnits()
    fetchAvailableMonths()
    setEmployeeName(getEmployeeName() || "")
    setEmployeeRole(getRole() || "")
  }, [fetchDeliveryUnits, fetchAvailableMonths])

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = getToken()

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/interim-dashboard/organization-metrics?deliveryUnit=${selectedDeliveryUnit}&month=${encodeURIComponent(selectedMonth)}&financialYear=${encodeURIComponent(selectedFinancialYear)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      setMetrics(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
      setError(`Failed to load organization metrics. ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }, [selectedDeliveryUnit, selectedMonth, selectedFinancialYear])

  useEffect(() => {
    if (selectedDeliveryUnit && selectedFinancialYear !== "" && selectedMonth !== "") {
      fetchMetrics()
    }
  }, [selectedDeliveryUnit, selectedMonth, selectedFinancialYear, fetchMetrics])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const getMonthName = (monthNumber: string) => {
    if (monthNumber === "YTD") {
      return getYTDDisplayText(selectedFinancialYear)
    }
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]
    return months[Number.parseInt(monthNumber) - 1] || monthNumber
  }

  const getDisplayPeriod = () => {
    if (selectedFinancialYear === "") {
      return "Please select a financial year"
    }
    if (selectedMonth === "YTD") {
      if (selectedFinancialYear === currentFinancialYear) {
        return `YTD FY ${selectedFinancialYear}`
      } else {
        return `All Months FY ${selectedFinancialYear}`
      }
    } else {
      return `${getMonthName(selectedMonth)} FY ${selectedFinancialYear}`
    }
  }

  return (
    <div className="h-full w-full max-w-full overflow-hidden">
      <div className="h-full flex flex-col p-4 gap-6">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground truncate">
              Welcome back, <span className="font-medium text-foreground">{employeeName}</span>!
              <br />
              Here's an overview of your projects performance.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row flex-shrink-0">
            <Select value={selectedDeliveryUnit} onValueChange={setSelectedDeliveryUnit} disabled={isDUListLoading}>
              <SelectTrigger className="w-full sm:w-[200px]">
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

            <Select value={selectedFinancialYear} onValueChange={handleFinancialYearChange} disabled={isMonthsLoading}>
              <SelectTrigger
                className={`w-full sm:w-[140px] ${selectedFinancialYear === "" ? "border-red-300 bg-red-50" : ""}`}
              >
                <SelectValue placeholder="Select FY *" />
              </SelectTrigger>
              <SelectContent>
                {isMonthsLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  availableFinancialYears.map((fy) => (
                    <SelectItem key={fy} value={fy}>
                      FY {fy}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Select value={selectedMonth} onValueChange={handleMonthChange} disabled={isMonthDisabled()}>
              <SelectTrigger
                className={`w-full sm:w-[160px] ${isMonthDisabled() ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <SelectValue placeholder={getMonthPlaceholder()} />
              </SelectTrigger>
              <SelectContent>
                {isMonthsLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  availableMonths.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month === "YTD" ? getYTDDisplayText(selectedFinancialYear) : getMonthName(month)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedFinancialYear === "" && (
          <Alert className="flex-shrink-0">
            <AlertDescription>
              Please select a financial year to proceed. The financial year selection is required to load the
              appropriate data.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex-1 min-h-0 overflow-auto">
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Direct Costs</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedFinancialYear === "" ? (
                    <div className="text-sm text-muted-foreground">Select financial year to view data</div>
                  ) : isLoading ? (
                    <Skeleton className="h-8 w-[140px]" />
                  ) : error ? (
                    <div className="text-sm text-red-500">Error loading data</div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-foreground">
                        {formatCurrency(Number(metrics?.total_cost) || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">{getDisplayPeriod()}</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Gross Margin</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedFinancialYear === "" ? (
                    <div className="text-sm text-muted-foreground">Select financial year to view data</div>
                  ) : isLoading ? (
                    <Skeleton className="h-8 w-[140px]" />
                  ) : error ? (
                    <div className="text-sm text-red-500">Error loading data</div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-foreground">
                        {formatCurrency(Number(metrics?.total_gm) || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">{getDisplayPeriod()}</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg Gross Margin %</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Percent className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedFinancialYear === "" ? (
                    <div className="text-sm text-muted-foreground">Select financial year to view data</div>
                  ) : isLoading ? (
                    <Skeleton className="h-8 w-[140px]" />
                  ) : error ? (
                    <div className="text-sm text-red-500">Error loading data</div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-foreground">
                        {formatPercentage(Number(metrics?.gm_percentage) || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">{getDisplayPeriod()}</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedFinancialYear === "" ? (
                    <div className="text-sm text-muted-foreground">Select financial year to view data</div>
                  ) : isLoading ? (
                    <Skeleton className="h-8 w-[140px]" />
                  ) : error ? (
                    <div className="text-sm text-red-500">Error loading data</div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-foreground">
                        {formatCurrency(Number(metrics?.total_revenue) || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">{getDisplayPeriod()}</p>
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
            ) : selectedFinancialYear === "" ? (
              <Alert>
                <AlertTitle>Getting Started</AlertTitle>
                <AlertDescription>
                  Please select a financial year from the dropdown above to load your dashboard data. Financial years
                  run from April 1st to March 31st. You can then optionally select a specific month or view all data for
                  the selected financial year.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                <Card className="shadow-sm">
                  <CardHeader className="space-y-2 pb-6">
                    <CardTitle className="text-xl font-semibold">Project Gross Margins</CardTitle>
                    <CardDescription className="text-base">
                      {selectedMonth === "YTD"
                        ? `${getYTDDisplayText(selectedFinancialYear)} analysis of gross margin percentages across all projects for FY ${selectedFinancialYear}`
                        : `Gross margin analysis for ${getDisplayPeriod()}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-[500px] w-full">
                      {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <Skeleton className="h-full w-full rounded-lg" />
                        </div>
                      ) : (
                        <DashboardProjectGMChart
                          deliveryUnit={selectedDeliveryUnit}
                          financialYear={selectedFinancialYear}
                          month={selectedMonth}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="pb-6">
                  <ProjectDetailsTable
                    deliveryUnit={selectedDeliveryUnit}
                    financialYear={selectedFinancialYear}
                    month={selectedMonth}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}