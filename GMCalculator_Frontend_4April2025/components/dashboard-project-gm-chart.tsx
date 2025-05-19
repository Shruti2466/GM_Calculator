"use client"

import { useState, useEffect, useMemo } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getToken } from "@/utils/auth"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

interface ProjectTrendData {
  project_id: number
  month: number
  year: number
  project_name: string
  avg_percentage_gross_margin: string
}

interface ChartData {
  date: string
  [projectName: string]: string | number
}

interface ChartConfig {
  [key: string]: {
    label: string
    color: string
  }
}

interface DashboardProjectGMChartProps {
  deliveryUnit: string
}

export function DashboardProjectGMChart({ deliveryUnit }: DashboardProjectGMChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    const fetchChartData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const token = getToken()
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/dashboard/project-trends/${deliveryUnit}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal,
          },
        )
        if (!response.ok) {
          throw new Error("Failed to fetch project trend data")
        }
        const data: ProjectTrendData[] = await response.json()

        // Transform the data for the chart
        const transformedData: ChartData[] = []
        const projectSet = new Set<string>()

        data.forEach((item) => {
          const date = `${item.year}-${item.month.toString().padStart(2, "0")}`
          let dataPoint = transformedData.find((d) => d.date === date)
          if (!dataPoint) {
            dataPoint = { date }
            transformedData.push(dataPoint)
          }
          dataPoint[item.project_name] = Number.parseFloat(item.avg_percentage_gross_margin)
          projectSet.add(item.project_name)
        })

        setChartData(transformedData)
      } catch (err) {
        if (!signal.aborted) {
          setError("Failed to load project trend data. Please try again later.")
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchChartData()

    return () => {
      controller.abort()
    }
  }, [deliveryUnit])

  const projects = useMemo(() => {
    return Array.from(new Set(chartData.flatMap((obj) => Object.keys(obj).filter((key) => key !== "date"))))
  }, [chartData])

  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#a4de6c", "#d0ed57"]

  const chartConfig: ChartConfig = useMemo(() => {
    return projects.reduce((acc, project, index) => {
      acc[project] = {
        label: project,
        color: colors[index % colors.length],
      }
      return acc
    }, {} as ChartConfig)
  }, [projects])

  if (isLoading) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Gross Margin Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const [year, month] = value.split("-")
                  return `${month}/${year.slice(2)}`
                }}
              />
              <YAxis tickFormatter={(value) => `${value}%`} domain={["auto", "auto"]} />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend />
              {projects.map((project) => (
                <Line
                  key={project}
                  type="monotone"
                  dataKey={project}
                  stroke={chartConfig[project].color}
                  name={project}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
