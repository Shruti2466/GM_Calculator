"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getToken } from "@/utils/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Download, FileSpreadsheet } from "lucide-react"
import * as XLSX from 'xlsx'

interface ProjectDetail {
  project_name: string
  project_code: string
  delivery_unit: string
  account_name: string
  month_year?: string
  total_revenue: number | string
  total_cost: number | string
  total_gm: number | string
  gm_percentage: number | string | null
  delivery_manager_name: string
  delivery_head_name: string
}

interface ProjectDetailsTableProps {
  deliveryUnit: string
  month: string
  financialYear: string
}

const ITEMS_PER_PAGE = 5

export function ProjectDetailsTable({ deliveryUnit, month, financialYear }: ProjectDetailsTableProps) {
  const [data, setData] = useState<ProjectDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    const fetchProjectDetails = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const token = getToken()

        console.log("=== TABLE COMPONENT ===")
        console.log("Table fetching data with:", { deliveryUnit, month, financialYear })

        // Validate financialYear before making request
        if (!financialYear || financialYear === "undefined" || financialYear === "") {
          console.error("Missing or invalid financial year in table component")
          setError("Financial year is required")
          return
        }

        // INCLUDE FINANCIAL YEAR IN API CALL
        const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/interim-dashboard/project-details?deliveryUnit=${deliveryUnit}&month=${encodeURIComponent(month)}&financialYear=${encodeURIComponent(financialYear)}`
        console.log("Table API URL:", apiUrl)

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("Table API error:", errorText)
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const projectData = await response.json()
        console.log("Table data received:", projectData)

        setData(projectData || [])
        setCurrentPage(1) // Reset to first page when data changes
      } catch (err) {
        console.error("Error fetching project details:", err)
        setError(err instanceof Error ? err.message : "Failed to load table data")
      } finally {
        setIsLoading(false)
      }
    }

    // Only fetch if all required props are available
    if (deliveryUnit && financialYear && month) {
      fetchProjectDetails()
    } else {
      console.log("Missing required props for table:", { deliveryUnit, month, financialYear })
      setIsLoading(false)
    }
  }, [deliveryUnit, month, financialYear])

  const formatCurrency = (value: number | string | null) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : (value || 0);
    return new Intl.NumberFormat("en-US", { 
      style: "currency", 
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  }

  const formatPercentage = (value: number | string | null) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : (value || 0);
    if (isNaN(numValue)) return "0.00%";
    return `${numValue.toFixed(2)}%`;
  }

  // Format currency for Excel (without $ symbol)
  const formatCurrencyForExcel = (value: number | string | null) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : (value || 0);
    return numValue;
  }

  // Helper function to get current financial year
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

  // Helper function to get YTD display text
  const getYTDDisplayText = () => {
    const currentFY = getCurrentFinancialYear()
    if (financialYear === currentFY) {
      return "Year To Date"
    } else {
      return "All Months"
    }
  }

  // Update the export filename generation
  const exportToExcel = async () => {
    if (data.length === 0) return;

    setIsExporting(true);
    try {
      // Prepare data for Excel
      const excelData = data.map(project => ({
        'Project Name': project.project_name,
        'Project Code': project.project_code,
        'Account': project.account_name,
        'Delivery Unit': project.delivery_unit,
        'Revenue': formatCurrencyForExcel(project.total_revenue),
        'Cost': formatCurrencyForExcel(project.total_cost),
        'Gross Margin': formatCurrencyForExcel(project.total_gm),
        'GM %': project.gm_percentage,
        'Delivery Manager': project.delivery_manager_name || "-",
        'Delivery Head': project.delivery_head_name || "-",
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const columnWidths = [
        { wch: 25 }, // Project Name
        { wch: 15 }, // Project Code
        { wch: 20 }, // Account
        { wch: 15 }, // Delivery Unit
        { wch: 15 }, // Revenue
        { wch: 15 }, // Cost
        { wch: 15 }, // Gross Margin
        { wch: 10 }, // GM %
        { wch: 20 }, // Delivery Manager
        { wch: 20 }, // Delivery Head
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Project Details');

      // Generate filename with appropriate text
      const timestamp = new Date().toISOString().split('T')[0];
      const deliveryUnitText = deliveryUnit === 'all' ? 'All-Units' : deliveryUnit;
      const monthText = month === 'YTD' ? getYTDDisplayText().replace(' ', '-') : month.replace('/', '-');
      const fyText = `FY${financialYear}`;
      const filename = `Project-Details_${deliveryUnitText}_${monthText}_${fyText}_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data to Excel. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentData = data.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pageNumbers.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pageNumbers.push(i);
        }
      }
    }
    
    return pageNumbers;
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="text-xl font-bold text-gray-800">Project Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="shadow-lg border-red-200">
        <CardHeader className="bg-red-50 border-b border-red-200">
          <CardTitle className="text-xl font-bold text-red-800">Project Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
            <strong>Error:</strong> {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-gray-800">Project Details</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {data.length} project{data.length !== 1 ? 's' : ''} found
            </p>
          </div>
          {data.length > 0 && (
            <Button
              onClick={exportToExcel}
              disabled={isExporting}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300"
            >
              {isExporting ? (
                <Download className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
              )}
              {isExporting ? "Exporting..." : "Export Excel"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium mb-2">No Data Available</h3>
            <p className="text-sm">No project data found for the selected criteria</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Project Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Account & Unit
                    </th>
                    {/* REMOVED Period column header */}
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Financial Metrics
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Management Team
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.map((project, index) => {
                    const gmPercentage = parseFloat(project.gm_percentage?.toString() || '0');
                    const isGoodMargin = gmPercentage >= 35;
                    
                    return (
                      <tr key={`${project.project_code}-${startIndex + index}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{project.project_name}</div>
                            <div className="text-xs text-gray-500 font-mono">{project.project_code}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm text-gray-900">{project.account_name}</div>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {project.delivery_unit}
                            </Badge>
                          </div>
                        </td>
                        {/* REMOVED Period column cell */}
                        <td className="px-6 py-4 text-right">
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="text-xs text-gray-500">Revenue: </span>
                              <span className="font-medium text-blue-600">{formatCurrency(project.total_revenue)}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-xs text-gray-500">Cost: </span>
                              <span className="font-medium text-orange-600">{formatCurrency(project.total_cost)}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-xs text-gray-500">GM: </span>
                              <span className={`font-semibold ${gmPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(project.total_gm)}
                              </span>
                            </div>
                            <div className="flex items-center justify-end gap-1">
                              <span className={`text-sm font-bold ${isGoodMargin ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPercentage(project.gm_percentage)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="text-xs text-gray-500">Delivery Manager: </span>
                              <span className="text-gray-900">{project.delivery_manager_name || "-"}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-xs text-gray-500">Delivery Head: </span>
                              <span className="text-gray-900">{project.delivery_head_name || "-"}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {data.length > 0 && (
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-semibold">{startIndex + 1}</span> to{" "}
                    <span className="font-semibold">{Math.min(endIndex, data.length)}</span> of{" "}
                    <span className="font-semibold">{data.length}</span> results
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 text-xs"
                      >
                        <ChevronLeft className="h-3 w-3" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {getPageNumbers().map((pageNumber) => (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNumber)}
                            className={`w-8 h-8 p-0 text-xs ${
                              currentPage === pageNumber 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 text-xs"
                      >
                        Next
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  {totalPages <= 1 && (
                    <div className="text-xs text-gray-500">
                      Showing all results on one page
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}