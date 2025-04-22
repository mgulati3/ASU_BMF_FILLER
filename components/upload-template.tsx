"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileUp, Upload } from "lucide-react"
import { motion } from "framer-motion"

interface UploadTemplateProps {
  onUpload: (file: File) => void
}

export function UploadTemplate({ onUpload }: UploadTemplateProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type === "application/pdf") {
        onUpload(file)
      } else {
        alert("Please upload a PDF file")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (file.type === "application/pdf") {
        onUpload(file)
      } else {
        alert("Please upload a PDF file")
      }
    }
  }

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm">
        <p className="text-lg font-medium text-gray-800">Upload the ASU Business Meals and Related Expenses Form</p>
        <p className="text-muted-foreground mt-1">This should be the empty form template that you want to fill out.</p>
      </div>

      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <Card
          className={`border-2 border-dashed ${
            isDragging ? "border-teal-500 bg-teal-50" : "border-gray-300"
          } hover:border-teal-500 hover:bg-teal-50 transition-all cursor-pointer`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <CardContent className="flex flex-col items-center justify-center py-16">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1,
              }}
            >
              <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mb-4">
                <FileUp className="h-10 w-10 text-teal-600" />
              </div>
            </motion.div>
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <p className="text-xl font-medium mb-1 text-gray-800">Upload PDF Template</p>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                Drag and drop your PDF file here, or click to browse
              </p>
            </motion.div>
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
              <Button className="gap-2 bg-teal-600 hover:bg-teal-700">
                <Upload className="h-4 w-4" />
                Select PDF
              </Button>
            </motion.div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf"
              className="hidden"
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
