"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Copy, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PdfFieldViewerProps {
  fields: string[]
}

export function PdfFieldViewer({ fields }: PdfFieldViewerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [copied, setCopied] = useState<string | null>(null)

  const filteredFields = fields.filter((field) => field.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleCopy = (field: string) => {
    navigator.clipboard.writeText(field)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle>PDF Form Fields</CardTitle>
          <CardDescription>
            These are the actual field names found in your PDF template. Use this information to understand how to map
            your form data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search fields..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredFields.length === 0 ? (
            <Alert>
              <AlertDescription>
                {searchTerm ? "No fields match your search." : "No fields found in the PDF."}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 font-medium">Field Name</th>
                    <th className="text-right p-2 font-medium w-20">Copy</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFields.map((field, index) => (
                    <tr key={field} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="p-2 font-mono text-sm break-all">{field}</td>
                      <td className="p-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(field)} className="h-8 w-8 p-0">
                          {copied === field ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-sm text-muted-foreground mt-4">
            Total: {filteredFields.length} {filteredFields.length === 1 ? "field" : "fields"}
            {searchTerm && fields.length !== filteredFields.length && ` (filtered from ${fields.length})`}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
