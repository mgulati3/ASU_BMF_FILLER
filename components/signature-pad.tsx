"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void
  onTextSignatureChange: (text: string) => void
  value?: string | null
  textSignature?: string
}

export function SignaturePad({ onTextSignatureChange, textSignature = "" }: SignaturePadProps) {
  const [textValue, setTextValue] = useState(textSignature)

  // Initialize text value from prop (only once)
  useEffect(() => {
    if (textSignature) {
      setTextValue(textSignature)
    }
  }, []) // Empty dependency array to run only once

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setTextValue(newValue)
    onTextSignatureChange(newValue)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="textSignature">Type your name as signature</Label>
        <Input id="textSignature" value={textValue} onChange={handleTextChange} placeholder="Type your full name" />
      </div>
      <div className="border rounded-md p-4 bg-gray-50">
        <p className="font-medium text-sm text-gray-500">Preview:</p>
        <p className="font-italic text-xl mt-2 font-serif italic">{textValue || "Your Signature"}</p>
      </div>
    </div>
  )
}
