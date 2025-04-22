"use client"

import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { motion } from "framer-motion"

interface PdfViewerProps {
  pdfData: string
}

export function PdfViewer({ pdfData }: PdfViewerProps) {
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="w-full">
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading PDF</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full border rounded-md overflow-hidden shadow-lg"
        >
          <iframe
            src={pdfData}
            className="w-full h-[800px]"
            title="PDF Viewer"
            onError={() => setError("Failed to load the PDF. Please try downloading it instead.")}
          />
        </motion.div>
      )}
    </div>
  )
}
