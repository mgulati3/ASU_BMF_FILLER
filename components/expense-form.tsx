"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { ExpenseFormData, Attendee, OtherAttendee } from "@/lib/types"
import { Loader2, Plus, Trash2, HelpCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { motion } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DateInput } from "@/components/date-input"
import { SignaturePad } from "@/components/signature-pad"

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData) => void
  isSubmitting: boolean
}

export function ExpenseForm({ onSubmit, isSubmitting }: ExpenseFormProps) {
  const [isMounted, setIsMounted] = useState(false)

  // Set up form with default values
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ExpenseFormData>({
    defaultValues: {
      paymentMethod: "1",
      expenseType: "Financial Services", // Pre-fill the expense type
    },
  })

  // Set requester date on client-side only to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true)
    setValue("requesterDate", new Date().toISOString().split("T")[0])
  }, [setValue])

  const [asuAttendees, setAsuAttendees] = useState<Attendee[]>([{ name: "", department: "", title: "" }])
  const [otherAttendees, setOtherAttendees] = useState<OtherAttendee[]>([{ name: "", affiliation: "", title: "" }])
  const textSignature = watch("textSignature")

  const addAsuAttendee = () => {
    if (asuAttendees.length < 5) {
      setAsuAttendees([...asuAttendees, { name: "", department: "", title: "" }])
    }
  }

  const removeAsuAttendee = (index: number) => {
    if (asuAttendees.length > 1) {
      const newAttendees = [...asuAttendees]
      newAttendees.splice(index, 1)
      setAsuAttendees(newAttendees)
    }
  }

  const updateAsuAttendee = (index: number, field: keyof Attendee, value: string) => {
    const updatedAttendees = [...asuAttendees]
    updatedAttendees[index][field] = value
    setAsuAttendees(updatedAttendees)
  }

  const addOtherAttendee = () => {
    if (otherAttendees.length < 5) {
      setOtherAttendees([...otherAttendees, { name: "", affiliation: "", title: "" }])
    }
  }

  const removeOtherAttendee = (index: number) => {
    if (otherAttendees.length > 1) {
      const newAttendees = [...otherAttendees]
      newAttendees.splice(index, 1)
      setOtherAttendees(newAttendees)
    }
  }

  const updateOtherAttendee = (index: number, field: keyof OtherAttendee, value: string) => {
    const updatedAttendees = [...otherAttendees]
    updatedAttendees[index][field] = value
    setOtherAttendees(updatedAttendees)
  }

  const handleFormSubmit = (data: ExpenseFormData) => {
    const formData = {
      ...data,
      asuAttendees,
      otherAttendees,
    }
    onSubmit(formData)
  }

  const handleTextSignatureChange = (text: string) => {
    setValue("textSignature", text || undefined)
  }

  // Don't render until client-side to prevent hydration mismatch with dates
  if (!isMounted) {
    return <div className="py-4">Loading form...</div>
  }

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 py-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Type of Expense - Read-only field */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="space-y-2">
              <Label htmlFor="expenseType">Type of Expense</Label>
              <Input
                id="expenseType"
                value="Financial Services"
                readOnly
                className="bg-gray-50"
                {...register("expenseType")}
              />
            </div>
          </div>

          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-lg border border-teal-100">
            <h3 className="text-lg font-medium text-teal-800 flex items-center">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-200 text-teal-700 mr-2">
                1
              </span>
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location of Event</Label>
                <Input
                  id="location"
                  {...register("location", { required: "Location is required" })}
                  className={errors.location ? "border-red-500" : ""}
                />
                {errors.location && <p className="text-red-500 text-xs">{errors.location.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventDate">Event Date</Label>
                <DateInput
                  id="eventDate"
                  error={!!errors.eventDate}
                  {...register("eventDate", { required: "Event date is required" })}
                />
                {errors.eventDate && <p className="text-red-500 text-xs">{errors.eventDate.message}</p>}
              </div>
            </div>
          </div>

          {/* Rest of the form remains the same */}
          {/* ... */}

          <div className="bg-white p-4 rounded-lg border">
            <div className="space-y-2">
              <Label htmlFor="businessPurpose">Business (Public) Purpose</Label>
              <Textarea
                id="businessPurpose"
                placeholder="Please explain the public purpose. If only ASU-employed personnel are present at the meal, clearly justify why this expenditure is appropriate."
                className={`min-h-[100px] ${errors.businessPurpose ? "border-red-500" : ""}`}
                {...register("businessPurpose", { required: "Business purpose is required" })}
              />
              {errors.businessPurpose && <p className="text-red-500 text-xs">{errors.businessPurpose.message}</p>}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costCenter">Cost Center plus Program</Label>
                <Input
                  id="costCenter"
                  {...register("costCenter", { required: "Cost center is required" })}
                  className={errors.costCenter ? "border-red-500" : ""}
                />
                {errors.costCenter && <p className="text-red-500 text-xs">{errors.costCenter.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="poNumber">PO # (if applicable)</Label>
                <Input id="poNumber" {...register("poNumber")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount</Label>
                <Input
                  id="totalAmount"
                  {...register("totalAmount", { required: "Total amount is required" })}
                  className={errors.totalAmount ? "border-red-500" : ""}
                />
                {errors.totalAmount && <p className="text-red-500 text-xs">{errors.totalAmount.message}</p>}
              </div>
            </div>
          </div>
        </motion.div>

        <Separator className="my-8" />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-6"
        >
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-blue-800 flex items-center">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-200 text-blue-700 mr-2">
                  2
                </span>
                ASU Faculty, Staff or Students
              </h3>
              {asuAttendees.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAsuAttendee}
                  className="gap-1 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <Plus className="h-4 w-4" />
                  Add Attendee
                </Button>
              )}
            </div>

            <div className="mt-4 space-y-4">
              {asuAttendees.map((attendee, index) => (
                <motion.div
                  key={`asu-attendee-${index}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 border rounded-md bg-white"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-blue-700">Attendee {index + 1}</h4>
                    {asuAttendees.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAsuAttendee(index)}
                        className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`asuName-${index}`}>Name</Label>
                      <Input
                        id={`asuName-${index}`}
                        value={attendee.name}
                        onChange={(e) => updateAsuAttendee(index, "name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`asuDepartment-${index}`}>Department</Label>
                      <Input
                        id={`asuDepartment-${index}`}
                        value={attendee.department}
                        onChange={(e) => updateAsuAttendee(index, "department", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`asuTitle-${index}`}>Title</Label>
                      <Input
                        id={`asuTitle-${index}`}
                        value={attendee.title}
                        onChange={(e) => updateAsuAttendee(index, "title", e.target.value)}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-purple-800 flex items-center">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-200 text-purple-700 mr-2">
                  3
                </span>
                Other Attendees
              </h3>
              {otherAttendees.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOtherAttendee}
                  className="gap-1 border-purple-200 text-purple-700 hover:bg-purple-100"
                >
                  <Plus className="h-4 w-4" />
                  Add Attendee
                </Button>
              )}
            </div>

            <div className="mt-4 space-y-4">
              {otherAttendees.map((attendee, index) => (
                <motion.div
                  key={`other-attendee-${index}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 border rounded-md bg-white"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-purple-700">Attendee {index + 1}</h4>
                    {otherAttendees.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOtherAttendee(index)}
                        className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`otherName-${index}`}>Name</Label>
                      <Input
                        id={`otherName-${index}`}
                        value={attendee.name}
                        onChange={(e) => updateOtherAttendee(index, "name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`otherAffiliation-${index}`}>Affiliation</Label>
                      <Input
                        id={`otherAffiliation-${index}`}
                        value={attendee.affiliation}
                        onChange={(e) => updateOtherAttendee(index, "affiliation", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`otherTitle-${index}`}>Title</Label>
                      <Input
                        id={`otherTitle-${index}`}
                        value={attendee.title}
                        onChange={(e) => updateOtherAttendee(index, "title", e.target.value)}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="space-y-2">
              <Label htmlFor="largeGroupInfo" className="flex items-center">
                Large Group Information
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-[250px]">
                      If a large group is present at an event and an attendee list is not available, state the
                      approximate count of attendees and ASU department or affiliation.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Textarea
                id="largeGroupInfo"
                placeholder="If a large group is present at an event and an attendee list is not available, state the approximate count of attendees and ASU department or affiliation."
                className="min-h-[80px]"
                {...register("largeGroupInfo")}
              />
            </div>
          </div>
        </motion.div>

        <Separator className="my-8" />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="space-y-6"
        >
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-100">
            <h3 className="text-lg font-medium text-amber-800 flex items-center">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-200 text-amber-700 mr-2">
                4
              </span>
              Payment Information
            </h3>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <RadioGroup defaultValue="1" {...register("paymentMethod")} className="bg-white p-3 rounded-md border">
                  <div className="flex items-center space-x-2 p-2 hover:bg-amber-50 rounded-md transition-colors">
                    <RadioGroupItem value="1" id="paymentMethod1" />
                    <Label htmlFor="paymentMethod1" className="cursor-pointer">
                      Paid by ASU Purchasing Card
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 hover:bg-amber-50 rounded-md transition-colors">
                    <RadioGroupItem value="2" id="paymentMethod2" />
                    <Label htmlFor="paymentMethod2" className="cursor-pointer">
                      Direct supplier invoice
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierName">Name of Supplier</Label>
                <Input
                  id="supplierName"
                  {...register("supplierName", { required: "Supplier name is required" })}
                  className={errors.supplierName ? "border-red-500" : ""}
                />
                {errors.supplierName && <p className="text-red-500 text-xs">{errors.supplierName.message}</p>}
              </div>
            </div>
          </div>
        </motion.div>

        <Separator className="my-8" />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="space-y-6"
        >
          <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border border-red-100">
            <h3 className="text-lg font-medium text-red-800 flex items-center">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-200 text-red-700 mr-2">
                5
              </span>
              Required Certification
            </h3>
            <div className="p-4 bg-white border rounded-md mt-4">
              <p className="text-sm">
                No reimbursement for alcoholic purchases is allowed on university accounts. For reimbursements over $40
                per person, attach itemized receipts to the supplier invoice.
              </p>
              <p className="text-sm font-medium mt-2 text-red-700">
                I certify that no reimbursement for alcoholic purchases is being sought.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="requesterName">Requester's Name</Label>
                <Input
                  id="requesterName"
                  {...register("requesterName", { required: "Requester name is required" })}
                  className={errors.requesterName ? "border-red-500" : ""}
                />
                {errors.requesterName && <p className="text-red-500 text-xs">{errors.requesterName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="requesterPhone">Phone No.</Label>
                <Input
                  id="requesterPhone"
                  {...register("requesterPhone", { required: "Phone number is required" })}
                  className={errors.requesterPhone ? "border-red-500" : ""}
                />
                {errors.requesterPhone && <p className="text-red-500 text-xs">{errors.requesterPhone.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="requesterDate">Date</Label>
                <DateInput
                  id="requesterDate"
                  error={!!errors.requesterDate}
                  {...register("requesterDate", { required: "Date is required" })}
                />
                {errors.requesterDate && <p className="text-red-500 text-xs">{errors.requesterDate.message}</p>}
              </div>
            </div>

            {/* Add signature pad */}
            <div className="mt-4">
              <Label htmlFor="requesterSignature">Signature</Label>
              <div className="mt-2">
                <SignaturePad
                  onChange={() => {}}
                  onTextSignatureChange={handleTextSignatureChange}
                  textSignature={textSignature}
                />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="pt-4"
        >
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 h-12 text-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating PDF...
              </>
            ) : (
              "Generate PDF"
            )}
          </Button>
        </motion.div>
      </form>
    </TooltipProvider>
  )
}
