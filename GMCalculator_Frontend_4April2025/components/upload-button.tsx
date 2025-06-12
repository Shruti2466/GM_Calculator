"use client"

import type React from "react"
import { useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function UploadButton() {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return
  }

  return (
    <div className="flex items-center gap-2">
      <Input id="gm-calculation" type="file" accept=".xlsx" onChange={handleFileChange} className="hidden" />
      <Label htmlFor="gm-calculation">
        <Button variant="outline" className="cursor-pointer">
          <Upload className="mr-2 h-4 w-4" />
          {file ? file.name : "Upload GM-Calculation.xlsx"}
        </Button>
      </Label>
      {file && (
        <Button onClick={handleUpload} className="bg-primary hover:bg-primary/90">
          Calculate Margin
        </Button>
      )}
    </div>
  )
}
