"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AddProjectForm } from "./add-project-form"
import { toast } from "@/components/ui/use-toast"

interface AddProjectDialogProps {
  onProjectAdded: () => void
}

export function AddProjectDialog({ onProjectAdded }: AddProjectDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-secondary hover:bg-secondary/90">Add New Project</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
        </DialogHeader>
        <AddProjectForm
          onSuccess={() => {
            setOpen(false)
            onProjectAdded()
            toast({
              title: "Project Added",
              description: "The new project has been successfully added.",
            })
          }}
          onProjectAdded={onProjectAdded}
        />
      </DialogContent>
    </Dialog>
  )
}
