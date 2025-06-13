"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { getToken } from "@/utils/auth"

interface ProjectTrendData {
  month: string
  total_revenue: number
  total_cost: number
  total_gm: number
}

interface DashboardProjectGMChartProps {
  deliveryUnit: string
  financialYear?: string
  month?: string
}

export function DashboardProjectGMChart({ deliveryUnit, financialYear, month }: DashboardProjectGMChartProps) {
  const [data, setData] = useState<ProjectTrendData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjectTrends = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const token = getToken()



        // Validate financialYear before making request
        if (!financialYear || financialYear === "undefined" || financialYear === "") {
          console.error("Missing or invalid financial year in chart component")
          setError("Financial year is required")
          return
        }

        // INCLUDE FINANCIAL YEAR IN API CALL
        const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/interim-dashboard/project-trends?deliveryUnit=${deliveryUnit}&month=${encodeURIComponent(month)}&financialYear=${encodeURIComponent(financialYear)}`


        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("Chart API error:", errorText)
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const trendsData = await response.json()
    

        if (Array.isArray(trendsData) && trendsData.length > 0) {
          setData(trendsData)
        } else {
          
          setData([])
        }
      } catch (err) {
        console.error("Error fetching project trends:", err)
        setError(err instanceof Error ? err.message : "Failed to load chart data")
      } finally {
        setIsLoading(false)
      }
    }

    // Only fetch if all required props are available
    if (deliveryUnit && financialYear && month) {
      fetchProjectTrends()
    } else {

      setIsLoading(false)
    }
  }, [deliveryUnit, month, financialYear]) // ADD financialYear TO DEPENDENCIES

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading chart data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">No data available for the selected period</div>
      </div>
    )
  }

  // Helper function to get display text for chart title
  const getChartTitle = () => {
    if (month === "YTD") {
      // The parent component will determine if it's "Year To Date" or "All Months"
      return `Project trends for FY ${financialYear}`
    }
    return `Project trends for ${month}/${financialYear?.split('-')[0]}`
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip
          formatter={(value, name) => {
            return [`$${Number(value).toLocaleString()}`, name]
          }}
        />
        <Legend />
        <Line type="monotone" dataKey="total_revenue" stroke="#8884d8" strokeWidth={2} name="Revenue" />
        <Line type="monotone" dataKey="total_cost" stroke="#82ca9d" strokeWidth={2} name="Cost" />
        <Line type="monotone" dataKey="total_gm" stroke="#ffc658" strokeWidth={2} name="Gross Margin" />
      </LineChart>
    </ResponsiveContainer>
  )
}
