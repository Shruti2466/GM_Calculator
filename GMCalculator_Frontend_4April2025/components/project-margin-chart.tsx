"use client"

import { useState, useEffect } from "react"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getToken } from "@/utils/auth"
import { ChartContainer } from "@/components/ui/chart"

interface ChartData {
  name: string
  total_direct_cost: string
  gross_margin: string
  gross_margin_percentage: string
}

interface ProjectMarginChartProps {
  projectId: string
}

// Custom Tooltip Formatter
const tooltipFormatter = (value: any, name: any) => {
  if (name === "Gross Margin Percentage") {
    return `${value}%`
  } else {
    return value
  }
}

// Function to convert "MM/YYYY" format into a Date object
const parseDate = (dateString: string) => {
  const [month, year] = dateString.split("/").map(Number)
  return new Date(year, month - 1) // Months in JS Date are 0-indexed
}

// Function to filter data based on range
const filterDataByMonths = (data: ChartData[], months: number) => {
  const now = new Date()
  const startDate = new Date()
  startDate.setMonth(now.getMonth() - months) // Covers 'months' including the current one
  
  return data.filter((item) => {
    const itemDate = parseDate(item.name)
   
    return itemDate >= startDate && itemDate <= now
  })
}

export function ProjectMarginChart({ projectId }: ProjectMarginChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [filteredData, setFilteredData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRange, setSelectedRange] = useState("last_6_months") // Default: Last 6 months

  useEffect(() => {
    const fetchChartData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const token = getToken()
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${projectId}/chart-data`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!response.ok) {
          throw new Error("Failed to fetch chart data")
        }
        const data = await response.json()
        setChartData(data)

        // Default: Filter last 6 months of data
        setFilteredData(filterDataByMonths(data, 6))
      } catch (err) {
        setError("Failed to load chart data. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchChartData()
  }, [projectId])

  // Function to filter data based on dropdown selection
  const handleRangeChange = (range: string) => {
    setSelectedRange(range)

    let months = 6 // Default to last 6 months

    if (range === "last_1_month") {
      months = 1
    } else if (range === "last_3_months") {
      months = 3
    } else if (range === "last_6_months") {
      months = 6
    }

    setFilteredData(filterDataByMonths(chartData, months))
  }

  if (isLoading) {
    return <div>Loading chart data...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Margin History</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Dropdown for Range Selection */}
        <div className="mb-4">
          <label htmlFor="range-select" className="mr-2">
            Select Range:
          </label>
          <select
            id="range-select"
            value={selectedRange}
            onChange={(e) => handleRangeChange(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="last_1_month">Last 1 Month</option>
            <option value="last_3_months">Last 3 Months</option>
            <option value="last_6_months">Last 6 Months</option>
          </select>
        </div>

        <ChartContainer
          config={{
            total_direct_cost: {
              label: "Total Direct Cost",
              color: "hsl(var(--chart-1))",
            },
            gross_margin: {
              label: "Gross Margin",
              color: "hsl(var(--chart-2))",
            },
            gross_margin_percentage: {
              label: "Gross Margin Percentage",
              color: "hsl(var(--chart-3))",
            },
          }}
          className="h-[400px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData}>
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background p-2 border border-border rounded-md shadow-md">
                        <p className="font-bold">{label}</p>
                        {payload.map((entry, index) => (
                          <p key={index} style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                            {entry.name === "Gross Margin Percentage" ? "%" : ""}
                          </p>
                        ))}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend />
              <Bar dataKey="total_direct_cost" yAxisId="left" fill="#03fc88" name="Total Direct Cost" />
              <Bar dataKey="gross_margin" yAxisId="left" fill="#fccf03" name="Gross Margin" />
              <Bar dataKey="gross_margin_percentage" yAxisId="right" fill="#0394fc" name="Gross Margin Percentage" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
