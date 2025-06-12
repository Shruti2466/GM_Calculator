"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProjectMarginChart } from "./project-margin-chart"

interface MarginHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectName: string
}

export function MarginHistoryDialog({ open, onOpenChange, projectId, projectName }: MarginHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{projectName} - Margin History</DialogTitle>
        </DialogHeader>
        <ProjectMarginChart projectId={projectId} />
      </DialogContent>
    </Dialog>
  )
}
