"use client"
import type * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getToken } from "@/utils/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Check,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calculator,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import Swal from "sweetalert2"

interface UploadedFile {
  id: number
  fileName: string
  uploadedBy: string
  uploadedAt: string
  sheetType: string
  sheetName: string
  version: number
  is_current: boolean
  filePath?: string
}

interface AdditionalCost {
  id: number
  cost_name: string
  cost: string
  created_at?: string
  created_by?: string
  updated_at?: string
  updated_by?: string
}

interface ExchangeRate {
  id: number
  rate: number
  updated_at: string
  updated_by: string
}

type SortConfig = {
  key: keyof UploadedFile | null
  direction: "asc" | "desc"
}

export default function UploadMonthlyDataPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({})
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File | null }>({
    sheet1: null,
    sheet2: null,
    sheet3: null,
    sheet4: null,
    sheet5: null,
    sheet6: null,
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "asc",
  })
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>([])
  const [newCostName, setNewCostName] = useState("")
  const [newCostValue, setNewCostValue] = useState("")
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null)
  const [newExchangeRate, setNewExchangeRate] = useState("")
  const [isEditingCost, setIsEditingCost] = useState<number | null>(null)
  const [editCostName, setEditCostName] = useState("")
  const [editCostValue, setEditCostValue] = useState("")
  const [isLoadingCosts, setIsLoadingCosts] = useState(false)
  const [isLoadingRate, setIsLoadingRate] = useState(false)
  const [isSubmittingCost, setIsSubmittingCost] = useState(false)
  const [isSubmittingRate, setIsSubmittingRate] = useState(false)
  const [isDownloading, setIsDownloading] = useState<{ [key: number]: boolean }>({})
  const [isCalculatingGM, setIsCalculatingGM] = useState(false)

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    sheetKey: "",
    file: null as File | null,
    message: "",
  })

  const sheetNames = {
    sheet1: "Delivery Investment Report",
    sheet2: "Salary Sheet",
    sheet3: "Revenue",
    sheet4: "Project Metrics",
    sheet5: "Client Feedback",
    sheet6: "Team Utilization",
  }

  const sheetMappings = {
    sheet1: { id: 1, name: "Delivery Investment Report" },
    sheet2: { id: 2, name: "Salary Sheet" },
    sheet3: { id: 3, name: "Revenue" },
    sheet4: { id: 4, name: "Project Metrics" },
    sheet5: { id: 5, name: "Client Feedback" },
    sheet6: { id: 6, name: "Team Utilization" },
  }

  const getPreviousMonthName = () => {
    const now = new Date()
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return previousMonth.toLocaleString("en-US", { month: "long", year: "numeric" })
  }

  const fetchUploadedFiles = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/upload/monthly-data/uploaded-sheets`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch uploaded files")

      const data = await response.json()
      const transformedData = data.map((file: any) => {
        const sheetKey = Object.entries(sheetMappings).find(([key, value]) => value.name === file.sheet_name)?.[0]

        return {
          id: file.id,
          fileName: file.file_name,
          uploadedBy: file.uploaded_by || "Unknown",
          uploadedAt: file.uploaded_at,
          sheetType: sheetKey || "unknown",
          sheetName: file.sheet_name || "Unknown Sheet",
          version: file.version || 1,
          is_current: file.is_current === 1,
          filePath: file.file_path || `/uploads/monthly-data/${file.file_name}`,
        }
      })
      setUploadedFiles(transformedData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load uploaded files. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const fetchAdditionalCosts = useCallback(async () => {
    setIsLoadingCosts(true)
    try {
      const token = getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/upload/monthly-data/additional-costs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch additional costs")

      const data = await response.json()
      setAdditionalCosts(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load additional costs. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingCosts(false)
    }
  }, [toast])

  const fetchExchangeRate = useCallback(async () => {
    setIsLoadingRate(true)
    try {
      const token = getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/upload/monthly-data/exchange-rate/usd`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch exchange rate")

      const data = await response.json()
      setExchangeRate(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load exchange rate. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingRate(false)
    }
  }, [toast])

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push("/login")
      return
    }

    fetchUploadedFiles()
    fetchExchangeRate()
    fetchAdditionalCosts()
  }, [router, fetchUploadedFiles, fetchExchangeRate, fetchAdditionalCosts])

  const handleDownloadFile = async (fileId: number, fileName: string, filePath: string) => {
    setIsDownloading((prev) => ({ ...prev, [fileId]: true }))
    try {
      const token = getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/upload/monthly-data/download`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filePath }),
      })

      if (!response.ok) throw new Error("Failed to download file")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()

      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download Started",
        description: `Downloading ${fileName}`,
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading((prev) => ({ ...prev, [fileId]: false }))
    }
  }

  const handleFileChange = async (sheetKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Check if file already exists for this sheet type
      const uploadedFile = uploadedFiles.find((file) => file.sheetType === sheetKey)

      if (uploadedFile) {
        // Show confirmation dialog for ALL sheets (including sheet1, sheet2, sheet3)
        setConfirmDialog({
          isOpen: true,
          sheetKey: sheetKey,
          file: file,
          message: `${uploadedFile.sheetName} has already been uploaded by ${uploadedFile.uploadedBy}. Do you wish to replace it?`,
        })
        return
      }

      // If no existing file, upload directly
      setSelectedFiles((prev) => ({ ...prev, [sheetKey]: file }))
      await handleUpload(sheetKey, file)
    }
  }

  const handleCancelUpload = () => {
    // Reset the file input that triggered the confirmation
    const fileInput = document.getElementById(`${confirmDialog.sheetKey}-upload`) as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }

    // Reset the dialog state
    setConfirmDialog({
      isOpen: false,
      sheetKey: "",
      file: null,
      message: "",
    })

    // Clear the selected file for this sheet
    setSelectedFiles((prev) => ({
      ...prev,
      [confirmDialog.sheetKey]: null,
    }))
  }

  const handleConfirmUpload = async () => {
    const { sheetKey, file } = confirmDialog
    
    // Close the dialog first
    setConfirmDialog({
      isOpen: false,
      sheetKey: "",
      file: null,
      message: "",
    })
    
    if (sheetKey && file) {
      // Set the selected file and upload
      setSelectedFiles((prev) => ({ ...prev, [sheetKey]: file }))
      await handleUpload(sheetKey, file)
    }
  }

  const handleUpload = async (sheetKey: string, file: File) => {
    if (!file) return
    
    setIsUploading((prev) => ({ ...prev, [sheetKey]: true }))
    
    try {
      const token = getToken()
      const formData = new FormData()
      formData.append("file", file)
      formData.append("sheet_name", sheetMappings[sheetKey as keyof typeof sheetMappings].name)

      const apiEndpoint =
        sheetKey === "sheet2"
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/upload/monthly-data/salary-sheet`
          : sheetKey === "sheet3"
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/upload/monthly-data/revenue-sheet`
            : `${process.env.NEXT_PUBLIC_API_BASE_URL}/upload/monthly-data`

      const uploadResponse = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || "Failed to upload file")
      }

      const uploadData = await uploadResponse.json()
      const actualFilePath = uploadData.filePath ? uploadData.filePath.replace(/^.*[\\/]/, "") : file.name
      const relativePath = `/uploads/monthly-data/${actualFilePath}`

      const trackResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/upload/monthly-data/track-upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheet_name: sheetMappings[sheetKey as keyof typeof sheetMappings].name,
          file_name: file.name,
          file_path: relativePath,
        }),
      })

      if (!trackResponse.ok) {
        const errorData = await trackResponse.json()
        throw new Error(errorData.error || "Failed to track upload")
      }

      const uploadedFile = await trackResponse.json()

      // ✅ REFRESH THE UPLOADED FILES LIST AFTER SUCCESSFUL UPLOAD
      await fetchUploadedFiles()

      toast({
        title: "Upload Successful",
        description: `${sheetMappings[sheetKey as keyof typeof sheetMappings].name} uploaded successfully.`,
      })

      // Clear the selected file
      setSelectedFiles((prev) => ({ ...prev, [sheetKey]: null }))

      // Reset file input
      const fileInput = document.getElementById(`${sheetKey}-upload`) as HTMLInputElement
      if (fileInput) {
        fileInput.value = ""
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: `Failed to upload the file: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
      
      // Reset file input on error as well
      const fileInput = document.getElementById(`${sheetKey}-upload`) as HTMLInputElement
      if (fileInput) {
        fileInput.value = ""
      }
    } finally {
      setIsUploading((prev) => ({ ...prev, [sheetKey]: false }))
    }
  }

  const isFileUploaded = (sheetKey: string) => uploadedFiles.some((file) => file.sheetType === sheetKey)

  const getUploadedFileInfo = (sheetKey: string) => {
    return uploadedFiles
      .filter((file) => file.sheetType === sheetKey)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return "Invalid Date"
    }
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const requestSort = (key: keyof UploadedFile) => {
    let direction: "asc" | "desc" = "asc"

    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }

    setSortConfig({ key, direction })
  }

  const getSortedItems = () => {
    if (!sortConfig.key) return uploadedFiles

    return [...uploadedFiles].sort((a, b) => {
      if (a[sortConfig.key!] === null) return 1
      if (b[sortConfig.key!] === null) return -1

      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]

      if (sortConfig.key === "version") {
        return sortConfig.direction === "asc" ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue)
      }

      if (sortConfig.key === "is_current") {
        return sortConfig.direction === "asc"
          ? a.is_current === b.is_current
            ? 0
            : a.is_current
              ? -1
              : 1
          : a.is_current === b.is_current
            ? 0
            : a.is_current
              ? 1
              : -1
      }

      if (sortConfig.key === "uploadedAt") {
        const dateA = new Date(a.uploadedAt).getTime()
        const dateB = new Date(b.uploadedAt).getTime()
        return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      return 0
    })
  }

  const sortedItems = getSortedItems()
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1))

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCostName.trim() || !newCostValue.trim()) {
      toast({
        title: "Error",
        description: "Please enter both name and value for the additional cost.",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingCost(true)
    try {
      const token = getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/upload/monthly-data/additional-costs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cost_name: newCostName,
          cost: newCostValue,
        }),
      })

      if (!response.ok) throw new Error("Failed to add additional cost")

      // ✅ REFRESH THE COSTS LIST INSTEAD OF MANUAL UPDATE
      await fetchAdditionalCosts()
      
      setNewCostName("")
      setNewCostValue("")
      toast({
        title: "Success",
        description: "Additional cost added successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add additional cost. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingCost(false)
    }
  }

  const handleEditCost = (cost: AdditionalCost) => {
    setIsEditingCost(cost.id)
    setEditCostName(cost.cost_name)
    setEditCostValue(cost.cost)
  }

  const handleUpdateCost = async (id: number) => {
    if (!editCostName.trim() || !editCostValue.trim()) {
      toast({
        title: "Error",
        description: "Please enter both name and value for the additional cost.",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingCost(true)
    try {
      const token = getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/upload/monthly-data/additional-costs/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cost_name: editCostName,
          cost: editCostValue,
        }),
      })

      if (!response.ok) throw new Error("Failed to update additional cost")

      // ✅ REFRESH THE COSTS LIST INSTEAD OF MANUAL UPDATE
      await fetchAdditionalCosts()
      
      setIsEditingCost(null)
      toast({
        title: "Success",
        description: "Additional cost updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update additional cost. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingCost(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingCost(null)
  }

  const handleUpdateExchangeRate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExchangeRate.trim()) {
      toast({
        title: "Error",
        description: "Please enter a value for the exchange rate.",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingRate(true)
    try {
      const token = getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/upload/monthly-data/exchange-rate/usd`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rate: Number.parseFloat(newExchangeRate),
        }),
      })

      if (!response.ok) throw new Error("Failed to update exchange rate")

      // ✅ REFRESH THE EXCHANGE RATE INSTEAD OF MANUAL UPDATE
      await fetchExchangeRate()
      
      setNewExchangeRate("")
      toast({
        title: "Success",
        description: "Exchange rate updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update exchange rate. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingRate(false)
    }
  }

  const getSortIcon = (key: keyof UploadedFile) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="ml-1 h-4 w-4 inline" />
    }

    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-1 h-4 w-4 inline text-primary" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4 inline text-primary" />
    )
  }

  const renderUploadCard = (sheetKey: string, index: number) => {
    const sheetData = sheetMappings[sheetKey as keyof typeof sheetMappings]
    const displayName = sheetData.name
    const isUploaded = isFileUploaded(sheetKey)
    const uploadedFile = getUploadedFileInfo(sheetKey)

    return (
      <Card key={sheetKey} className="shadow-sm relative">
        {isUploaded && (
          <div className="absolute top-2 right-2 z-10">
            <Check className="h-6 w-6 text-green-500" />
          </div>
        )}
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">{displayName}</CardTitle>
          <CardDescription>
            {isUploaded
              ? `Last uploaded on ${formatDate(uploadedFile?.uploadedAt || "")} by ${uploadedFile?.uploadedBy}`
              : `Upload the ${displayName} Excel file`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor={`${sheetKey}-upload`} className="text-sm font-medium">
                {isUploaded ? "Replace file" : "Select file"}
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id={`${sheetKey}-upload`}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => handleFileChange(sheetKey, e)}
                    className="cursor-pointer"
                    disabled={isUploading[sheetKey]}
                  />
                </div>
              </div>
              {isUploading[sheetKey] && <p className="text-xs text-blue-600">Uploading...</p>}
              {selectedFiles[sheetKey] && !isUploading[sheetKey] && (
                <p className="text-xs text-green-600">✓ {selectedFiles[sheetKey]?.name} selected</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleCalculateGM = async () => {
    setIsCalculatingGM(true)
    try {
      const token = getToken()

      const costResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/upload/monthly-data/interim-cost`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!costResponse.ok) {
        throw new Error("Failed to calculate interim cost")
      }

      const gmResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/upload/monthly-data/interim-project-gm`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!gmResponse.ok) {
        throw new Error("Failed to calculate interim project GM")
      }

      if (gmResponse.status === 201) {
        await Swal.fire({
          title: "Success!",
          text: "GM Calculated Successfully",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#10b981",
          timer: 3000,
          timerProgressBar: true,
          showClass: {
            popup: "animate__animated animate__fadeInDown",
          },
          hideClass: {
            popup: "animate__animated animate__fadeOutUp",
          },
        })
      }

      toast({
        title: "Success",
        description: "GM calculation completed successfully",
      })
    } catch (error) {
      await Swal.fire({
        title: "Error!",
        text: `Failed to calculate GM: ${error instanceof Error ? error.message : "Unknown error"}`,
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#ef4444",
      })

      toast({
        title: "Error",
        description: `Failed to calculate GM: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsCalculatingGM(false)
    }
  }

  return (
    <div className="h-full w-full max-w-full overflow-hidden">
      <div className="h-full flex flex-col space-y-4 p-4">
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 shrink-0">
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground truncate">Upload monthly Excel sheets for reporting and analysis</p>
          </div>
          <div className="shrink-0">
            <Button onClick={handleCalculateGM} disabled={isCalculatingGM} className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              {isCalculatingGM ? "Calculating..." : "Calculate GM"}
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <Tabs defaultValue="upload" className="h-full flex flex-col">
            <TabsList className="flex-shrink-0 mb-4">
              <TabsTrigger value="upload">Upload Files</TabsTrigger>
              <TabsTrigger value="history">Upload History</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0">
              <TabsContent value="upload" className="h-full m-0">
                <div className="h-full flex flex-col gap-4">
                  <Alert className="flex-shrink-0 bg-muted/50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please upload Excel files (.xlsx or .xls) for each required sheet. Files will be stored in the
                      system and accessible to all users.
                    </AlertDescription>
                  </Alert>
                  <Alert className="flex-shrink-0 bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      You are uploading the sheets for <strong>{getPreviousMonthName()}</strong>.
                    </AlertDescription>
                  </Alert>

                  <div className="flex-1 min-h-0">
                    {isLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 h-full">
                        {Array(6)
                          .fill(0)
                          .map((_, i) => (
                            <Card key={i} className="shadow-sm h-full">
                              <CardHeader className="pb-3">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-full mt-2" />
                              </CardHeader>
                              <CardContent className="flex-1">
                                <Skeleton className="h-10 w-full mb-2" />
                                <Skeleton className="h-10 w-full" />
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 h-full auto-rows-fr">
                        {Object.keys(sheetNames).map((sheetKey, index) => renderUploadCard(sheetKey, index))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="h-full m-0">
                <Card className="h-full flex flex-col">
                  <CardHeader className="flex-shrink-0">
                    <CardTitle>Upload History</CardTitle>
                    <CardDescription>View all previously uploaded monthly data files</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 p-6">
                    {isLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : sortedItems.length > 0 ? (
                      <div className="h-full flex flex-col">
                        <div className="flex-1 min-h-0 overflow-auto">
                          <div className="rounded-md border">
                            <table className="min-w-full divide-y divide-border">
                              <thead className="sticky top-0 bg-muted/50 z-10">
                                <tr>
                                  <th
                                    className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/80"
                                    onClick={() => requestSort("sheetName")}
                                  >
                                    Sheet Name {getSortIcon("sheetName")}
                                  </th>
                                  <th
                                    className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/80"
                                    onClick={() => requestSort("fileName")}
                                  >
                                    File Name {getSortIcon("fileName")}
                                  </th>
                                  <th
                                    className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/80"
                                    onClick={() => requestSort("version")}
                                  >
                                    Version {getSortIcon("version")}
                                  </th>
                                  <th
                                    className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/80"
                                    onClick={() => requestSort("uploadedBy")}
                                  >
                                    Uploaded By {getSortIcon("uploadedBy")}
                                  </th>
                                  <th
                                    className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/80"
                                    onClick={() => requestSort("uploadedAt")}
                                  >
                                    Uploaded At {getSortIcon("uploadedAt")}
                                  </th>
                                  <th
                                    className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/80"
                                    onClick={() => requestSort("is_current")}
                                  >
                                    Status {getSortIcon("is_current")}
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {currentItems.map((file) => (
                                  <tr key={file.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 text-sm">{file.sheetName}</td>
                                    <td className="px-4 py-3 text-sm">
                                      <button
                                        className="text-primary hover:text-primary/80 hover:underline flex items-center gap-1"
                                        onClick={() => handleDownloadFile(file.id, file.fileName, file.filePath || "")}
                                        disabled={isDownloading[file.id]}
                                      >
                                        {file.fileName}
                                        {isDownloading[file.id] ? (
                                          <Skeleton className="h-4 w-4 rounded-full animate-spin" />
                                        ) : (
                                          <Download className="h-4 w-4 inline ml-1" />
                                        )}
                                      </button>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{file.version}</td>
                                    <td className="px-4 py-3 text-sm">{file.uploadedBy}</td>
                                    <td className="px-4 py-3 text-sm">{formatDate(file.uploadedAt)}</td>
                                    <td className="px-4 py-3 text-sm">
                                      {file.is_current ? (
                                        <span className="text-green-600 font-medium">Active</span>
                                      ) : (
                                        <span className="text-red-600 font-medium">Inactive</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t flex-shrink-0">
                          <div className="text-sm text-muted-foreground">
                            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedItems.length)} of{" "}
                            {sortedItems.length} files
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={prevPage}
                              disabled={currentPage === 1}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              <span className="sr-only">Previous page</span>
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => (
                              <Button
                                key={i + 1}
                                variant={currentPage === i + 1 ? "default" : "outline"}
                                size="sm"
                                onClick={() => paginate(i + 1)}
                                className="h-8 w-8 p-0"
                              >
                                {i + 1}
                              </Button>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={nextPage}
                              disabled={currentPage === totalPages}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronRight className="h-4 w-4" />
                              <span className="sr-only">Next page</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-center text-muted-foreground">No uploaded files found.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="h-full m-0">
                <div className="grid gap-6 lg:grid-cols-2 h-full">
                  <Card className="flex flex-col h-full">
                    <CardHeader className="flex-shrink-0">
                      <CardTitle>Additional Costs</CardTitle>
                      <CardDescription>Manage additional costs for financial calculations</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0 flex flex-col">
                      <form onSubmit={handleAddCost} className="space-y-4 flex-shrink-0">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cost-name">Cost Name</Label>
                            <Input
                              id="cost-name"
                              value={newCostName}
                              onChange={(e) => setNewCostName(e.target.value)}
                              placeholder="Enter cost name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cost-value">Value</Label>
                            <Input
                              id="cost-value"
                              value={newCostValue}
                              onChange={(e) => setNewCostValue(e.target.value)}
                              placeholder="Enter value"
                              type="number"
                              step="0.01"
                            />
                          </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmittingCost}>
                          {isSubmittingCost ? "Adding..." : "Add Cost"}
                        </Button>
                      </form>

                      <div className="mt-6 flex-1 min-h-0 flex flex-col">
                        <h3 className="text-sm font-medium mb-2 flex-shrink-0">Existing Costs</h3>
                        {isLoadingCosts ? (
                          <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                          </div>
                        ) : additionalCosts.length > 0 ? (
                          <div className="rounded-md border divide-y flex-1 min-h-0 overflow-auto">
                            {additionalCosts.map((cost) => (
                              <div key={cost.id} className="p-3">
                                {isEditingCost === cost.id ? (
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                      <Input
                                        value={editCostName}
                                        onChange={(e) => setEditCostName(e.target.value)}
                                        placeholder="Cost name"
                                      />
                                      <Input
                                        value={editCostValue}
                                        onChange={(e) => setEditCostValue(e.target.value)}
                                        placeholder="Value"
                                        type="number"
                                        step="0.01"
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => handleUpdateCost(cost.id)}
                                        disabled={isSubmittingCost}
                                      >
                                        {isSubmittingCost ? "Saving..." : "Save"}
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium">{cost.cost_name}</p>
                                        <p className="text-sm text-muted-foreground">${cost.cost}</p>
                                      </div>
                                      {/* <Button variant="ghost" size="sm" onClick={() => handleEditCost(cost)}>
                                        Edit
                                      </Button> */}
                                    </div>
                                    <div className="mt-2 space-y-1">
                                      <div className="flex items-center text-xs text-muted-foreground">
                                        Created on {formatDate(cost.created_at)} by {cost.created_by}
                                      </div>
                                      {cost.updated_at && cost.updated_by && (
                                        <div className="flex items-center text-xs text-muted-foreground">
                                          <Clock className="h-3 w-3 mr-1" />
                                          Last updated on {formatDate(cost.updated_at)} by {cost.updated_by}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center flex-1">
                            <p className="text-sm text-muted-foreground">No additional costs found.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="flex flex-col h-full">
                    <CardHeader className="flex-shrink-0">
                      <CardTitle>US Exchange Rate</CardTitle>
                      <CardDescription>Manage the USD exchange rate for financial calculations</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <div className="space-y-4 flex-1">
                        {isLoadingRate ? (
                          <Skeleton className="h-20 w-full" />
                        ) : (
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Current Exchange Rate</p>
                            <div className="flex items-baseline mt-1">
                              <p className="text-3xl font-bold">{exchangeRate?.rate || "N/A"}</p>
                              <p className="ml-2 text-sm text-muted-foreground">USD</p>
                            </div>
                            {exchangeRate && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Last updated on {formatDate(exchangeRate.updated_at)} by {exchangeRate.updated_by}
                              </p>
                            )}
                          </div>
                        )}

                        <form onSubmit={handleUpdateExchangeRate} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="exchange-rate">Update Exchange Rate</Label>
                            <Input
                              id="exchange-rate"
                              value={newExchangeRate}
                              onChange={(e) => setNewExchangeRate(e.target.value)}
                              placeholder="Enter new exchange rate"
                              type="number"
                              step="0.0001"
                            />
                          </div>
                          <Button type="submit" className="w-full" disabled={isSubmittingRate}>
                            {isSubmittingRate ? "Updating..." : "Update Rate"}
                          </Button>
                        </form>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCancelUpload}
        onConfirm={handleConfirmUpload}
        title="Confirm File Replacement"
        description={confirmDialog.message}
        confirmText="Replace File"
        cancelText="Cancel"
      />
    </div>
  )
}
