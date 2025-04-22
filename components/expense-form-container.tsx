"use client"

import { useState, useEffect } from "react"
import { ExpenseForm } from "@/components/expense-form"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ExpenseFormData } from "@/lib/types"
import { fillPdfForm } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { AlertCircle, Download, Eye, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PdfViewer } from "@/components/pdf-viewer"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"

export function ExpenseFormContainer() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filledPdfUrl, setFilledPdfUrl] = useState<string | null>(null)
  const [filledPdfBase64, setFilledPdfBase64] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("fill")
  const [error, setError] = useState<string | null>(null)
  const [formProgress, setFormProgress] = useState(50)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<ExpenseFormData | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const { toast } = useToast()

  // Handle client-side mounting to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Update progress based on active tab
  useEffect(() => {
    if (activeTab === "fill") setFormProgress(50)
    else if (activeTab === "view") setFormProgress(100)
  }, [activeTab])

  const triggerConfetti = () => {
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      // Since particles fall down, start a bit higher than random
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0.1, 0.3) },
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0.1, 0.3) },
      })
    }, 250)
  }

  const handleFormSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true)
    setError(null)
    setFormData(data) // Store form data for filename generation

    try {
      const formData = new FormData()
      // Use the built-in template instead of an uploaded one
      formData.append("useBuiltInTemplate", "true")
      formData.append("formData", JSON.stringify(data))

      const response = await fillPdfForm(formData)

      if (response.success) {
        if (response.url) {
          setFilledPdfUrl(response.url)
        }

        if (response.base64) {
          setFilledPdfBase64(response.base64)
        }

        toast({
          title: "Success!",
          description: "Your PDF has been generated successfully.",
        })

        // Switch to the view tab if we have a PDF to show
        if (response.base64) {
          setActiveTab("view")
          triggerConfetti() // Celebrate success with confetti
        }
      } else {
        setError(response.error || "Failed to generate PDF")

        toast({
          title: "Error",
          description: response.error || "Failed to generate PDF. Please check the field mapping.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error generating PDF:", error)
      setError(error instanceof Error ? error.message : "Unknown error")
      toast({
        title: "Error",
        description: "Failed to generate the PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownload = () => {
    if (!formData) return

    // Format the date for the filename
    const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString)
        return date.toISOString().split("T")[0] // Format as YYYY-MM-DD
      } catch (e) {
        return dateString.replace(/[/\s]/g, "-") // Replace slashes and spaces with hyphens
      }
    }

    // Create a sanitized filename
    const sanitizeFilename = (name: string) => {
      return name.replace(/[^a-z0-9]/gi, "_").toLowerCase()
    }

    // Generate filename based on location and event date
    const location = sanitizeFilename(formData.location || "unknown")
    const eventDate = formatDate(formData.eventDate || "")
    const filename = `${location}_${eventDate}.pdf`

    if (filledPdfBase64) {
      // Create a download link from the base64 data
      const link = document.createElement("a")
      link.href = filledPdfBase64
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else if (filledPdfUrl) {
      // Use the URL if base64 is not available
      const link = document.createElement("a")
      link.href = filledPdfUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Don't render until client-side to prevent hydration mismatch
  if (!isMounted) {
    return <div className="min-h-screen bg-gray-50 py-8"></div>
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="relative pt-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-teal-600 bg-teal-200">
                Form Progress
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-teal-600">{formProgress}%</span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-teal-200">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${formProgress}%` }}
              transition={{ duration: 0.5 }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-teal-500"
            />
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="w-full border-0 shadow-lg overflow-hidden bg-gradient-to-br from-white to-gray-50">
          <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-6 text-white">
            <h1 className="text-2xl md:text-3xl font-bold">ASU Business Meals and Related Expenses</h1>
            <p className="mt-2 opacity-90">Fill out the form to generate a completed PDF document</p>
          </div>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12">
                <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-lg font-medium text-gray-700">Loading form template...</p>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b">
                  <TabsList className="w-full justify-start rounded-none bg-transparent h-14 p-0">
                    <TabsTrigger
                      value="fill"
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-teal-500 data-[state=active]:shadow-none rounded-none h-14 px-6"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 text-teal-700">
                          1
                        </div>
                        Fill Form
                      </div>
                    </TabsTrigger>
                    <TabsTrigger
                      value="view"
                      disabled={!filledPdfBase64}
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-teal-500 data-[state=active]:shadow-none rounded-none h-14 px-6"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 text-teal-700">
                          2
                        </div>
                        View PDF
                      </div>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="fill" className="p-6 mt-0">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ExpenseForm onSubmit={handleFormSubmit} isSubmitting={isSubmitting} />

                    {(filledPdfUrl || filledPdfBase64) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                            <p className="text-blue-700 font-medium">Your PDF has been generated successfully!</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setActiveTab("view")} className="gap-2">
                              <Eye className="h-4 w-4" />
                              View PDF
                            </Button>
                            <Button onClick={handleDownload} className="gap-2 bg-blue-600 hover:bg-blue-700">
                              <Download className="h-4 w-4" />
                              Download PDF
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {error && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </motion.div>
                </TabsContent>

                <TabsContent value="view" className="p-6 mt-0">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {filledPdfBase64 ? (
                      <div className="py-4">
                        <div className="flex justify-end mb-4">
                          <Button onClick={handleDownload} className="gap-2 bg-teal-600 hover:bg-teal-700">
                            <Download className="h-4 w-4" />
                            Download PDF
                          </Button>
                        </div>
                        <PdfViewer pdfData={filledPdfBase64} />
                      </div>
                    ) : (
                      <Alert className="my-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No PDF Available</AlertTitle>
                        <AlertDescription>Please fill out the form and generate a PDF first.</AlertDescription>
                      </Alert>
                    )}
                  </motion.div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
