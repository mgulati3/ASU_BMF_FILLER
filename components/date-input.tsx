"use client"

import type React from "react"

import { forwardRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(({ className, error, ...props }, ref) => {
  const [focused, setFocused] = useState(false)

  return (
    <Input
      type="date"
      ref={ref}
      className={cn("date-input", error ? "border-red-500" : "", focused ? "date-input-focused" : "", className)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...props}
    />
  )
})

DateInput.displayName = "DateInput"
