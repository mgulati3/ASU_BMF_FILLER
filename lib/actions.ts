"use server"

import { PDFDocument, type PDFForm, rgb, StandardFonts } from "pdf-lib"
import { writeFile, mkdir, readFile } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"
import { existsSync } from "fs"

export async function fillPdfForm(
  formData: FormData,
): Promise<{ success: boolean; url?: string; base64?: string; error?: string; fieldNames?: string[] }> {
  try {
    // Extract the form data
    const formDataJson = formData.get("formData") as string
    const formDataObj = JSON.parse(formDataJson)
    const useBuiltInTemplate = formData.get("useBuiltInTemplate") === "true"

    let templateBuffer: ArrayBuffer

    if (useBuiltInTemplate) {
      // Use the built-in template
      const templatePath = join(process.cwd(), "public", "templates", "asu_business_meals_template.pdf")
      const fileBuffer = await readFile(templatePath)
      templateBuffer = fileBuffer.buffer
    } else {
      // Use the uploaded template
      const templateFile = formData.get("template") as File
      templateBuffer = await templateFile.arrayBuffer()
    }

    // Try to load the PDF document
    let pdfDoc
    try {
      pdfDoc = await PDFDocument.load(templateBuffer)
    } catch (pdfError) {
      console.error("Error loading PDF:", pdfError)
      return {
        success: false,
        error: "The PDF template is not valid or is corrupted. Please try a different PDF template.",
      }
    }

    const form = pdfDoc.getForm()

    // Get all field names from the PDF
    const fieldNames = form.getFields().map((field) => field.getName())

    // If no fields were found, return an error
    if (fieldNames.length === 0) {
      return {
        success: false,
        error: "No fillable form fields found in the PDF. Please ensure you're using a fillable PDF form template.",
        fieldNames: [],
      }
    }

    console.log("Available PDF form fields:", fieldNames)

    // Try to map our form data to the PDF fields
    // First, try exact matches
    const fieldMappings = createFieldMappings(fieldNames)

    // Fill the form using the mappings
    let filledFieldCount = 0

    // Format date properly for PDF
    const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        })
      } catch (e) {
        return dateString
      }
    }

    // Basic information
    filledFieldCount += trySetFormField(
      form,
      fieldMappings,
      "expenseType",
      formDataObj.expenseType || "Financial Services",
    )
    filledFieldCount += trySetFormField(form, fieldMappings, "location", formDataObj.location)
    filledFieldCount += trySetFormField(form, fieldMappings, "eventDate", formatDate(formDataObj.eventDate))
    filledFieldCount += trySetFormField(form, fieldMappings, "businessPurpose", formDataObj.businessPurpose)
    filledFieldCount += trySetFormField(form, fieldMappings, "costCenter", formDataObj.costCenter)
    filledFieldCount += trySetFormField(form, fieldMappings, "poNumber", formDataObj.poNumber)
    filledFieldCount += trySetFormField(form, fieldMappings, "totalAmount", formDataObj.totalAmount)

    // Payment method
    if (formDataObj.paymentMethod === "1") {
      filledFieldCount += trySetCheckBox(form, fieldMappings, "paymentMethodCard", true)
    } else {
      filledFieldCount += trySetCheckBox(form, fieldMappings, "paymentMethodInvoice", true)
    }

    filledFieldCount += trySetFormField(form, fieldMappings, "supplierName", formDataObj.supplierName)

    // ASU Attendees - Ensure we're handling them properly
    if (formDataObj.asuAttendees && Array.isArray(formDataObj.asuAttendees)) {
      for (let i = 0; i < Math.min(formDataObj.asuAttendees.length, 5); i++) {
        const attendee = formDataObj.asuAttendees[i]
        if (attendee && typeof attendee === "object") {
          // Try multiple field name patterns for ASU attendees
          const namePatterns = [
            `asuName${i + 1}`,
            `asu_name_${i + 1}`,
            `asuAttendee${i + 1}Name`,
            `asuAttendee${i + 1}`,
            `asu${i + 1}Name`,
            `asu${i + 1}`,
          ]

          const deptPatterns = [
            `asuDepartment${i + 1}`,
            `asu_dept_${i + 1}`,
            `asuAttendee${i + 1}Department`,
            `asuDept${i + 1}`,
            `asu${i + 1}Department`,
            `asu${i + 1}Dept`,
          ]

          const titlePatterns = [
            `asuTitle${i + 1}`,
            `asu_title_${i + 1}`,
            `asuAttendee${i + 1}Title`,
            `asu${i + 1}Title`,
          ]

          // Try each pattern
          for (const pattern of namePatterns) {
            if (trySetFormField(form, fieldMappings, pattern, attendee.name) > 0) break
          }

          for (const pattern of deptPatterns) {
            if (trySetFormField(form, fieldMappings, pattern, attendee.department) > 0) break
          }

          for (const pattern of titlePatterns) {
            if (trySetFormField(form, fieldMappings, pattern, attendee.title) > 0) break
          }
        }
      }
    }

    // Other Attendees - Ensure we're handling them properly
    if (formDataObj.otherAttendees && Array.isArray(formDataObj.otherAttendees)) {
      for (let i = 0; i < Math.min(formDataObj.otherAttendees.length, 5); i++) {
        const attendee = formDataObj.otherAttendees[i]
        if (attendee && typeof attendee === "object") {
          // Try multiple field name patterns for other attendees
          const namePatterns = [
            `otherName${i + 1}`,
            `other_name_${i + 1}`,
            `otherAttendee${i + 1}Name`,
            `otherAttendee${i + 1}`,
            `other${i + 1}Name`,
            `other${i + 1}`,
          ]

          const affiliationPatterns = [
            `otherAffiliation${i + 1}`,
            `other_affiliation_${i + 1}`,
            `otherAttendee${i + 1}Affiliation`,
            `otherAffil${i + 1}`,
            `other${i + 1}Affiliation`,
            `other${i + 1}Affil`,
          ]

          const titlePatterns = [
            `otherTitle${i + 1}`,
            `other_title_${i + 1}`,
            `otherAttendee${i + 1}Title`,
            `other${i + 1}Title`,
          ]

          // Try each pattern
          for (const pattern of namePatterns) {
            if (trySetFormField(form, fieldMappings, pattern, attendee.name) > 0) break
          }

          for (const pattern of affiliationPatterns) {
            if (trySetFormField(form, fieldMappings, pattern, attendee.affiliation) > 0) break
          }

          for (const pattern of titlePatterns) {
            if (trySetFormField(form, fieldMappings, pattern, attendee.title) > 0) break
          }
        }
      }
    }

    // Large Group Information
    if (formDataObj.largeGroupInfo) {
      filledFieldCount += trySetFormField(form, fieldMappings, "largeGroupInfo", formDataObj.largeGroupInfo)
    }

    // Required Certification
    filledFieldCount += trySetFormField(form, fieldMappings, "requesterName", formDataObj.requesterName)
    filledFieldCount += trySetFormField(form, fieldMappings, "requesterPhone", formDataObj.requesterPhone)

    // Handle the requester date field - try multiple approaches to find the right field
    if (formDataObj.requesterDate) {
      const formattedDate = formatDate(formDataObj.requesterDate)
      let dateFieldFound = false

      // First try: Common date field patterns
      const datePatterns = [
        "date",
        "Date",
        "DATE",
        "requesterDate",
        "requester_date",
        "requestorDate",
        "requestor_date",
        "certificationDate",
        "certification_date",
        "requestDate",
        "request_date",
      ]

      // Try direct field names first
      for (const pattern of datePatterns) {
        if (trySetFormField(form, fieldMappings, pattern, formattedDate) > 0) {
          dateFieldFound = true
          break
        }
      }

      // Second try: Look for any field with "date" in the name
      if (!dateFieldFound) {
        for (const fieldName of fieldNames) {
          const lowerFieldName = fieldName.toLowerCase()
          if (lowerFieldName.includes("date")) {
            try {
              const field = form.getTextField(fieldName)
              if (field) {
                field.setText(formattedDate)
                console.log(`Successfully filled date field: ${fieldName}`)
                filledFieldCount++
                dateFieldFound = true
                break
              }
            } catch (error) {
              // Field not found or not a text field
            }
          }
        }
      }

      // Third try: Look for fields positioned near the signature or requester fields
      if (!dateFieldFound) {
        // Find fields that might be related to the requester
        const requesterFields = fieldNames.filter(
          (name) =>
            name.toLowerCase().includes("requester") ||
            name.toLowerCase().includes("signature") ||
            name.toLowerCase().includes("name") ||
            name.toLowerCase().includes("phone"),
        )

        if (requesterFields.length > 0) {
          // Try to find a nearby empty field that might be the date field
          for (const fieldName of fieldNames) {
            if (
              !fieldName.toLowerCase().includes("name") &&
              !fieldName.toLowerCase().includes("phone") &&
              !fieldName.toLowerCase().includes("signature")
            ) {
              try {
                const field = form.getTextField(fieldName)
                if (field) {
                  // Check if the field is empty
                  const text = field.getText()
                  if (!text || text.trim() === "") {
                    field.setText(formattedDate)
                    console.log(`Filled potential date field: ${fieldName}`)
                    filledFieldCount++
                    dateFieldFound = true
                    break
                  }
                }
              } catch (error) {
                // Field not found or not a text field
              }
            }
          }
        }
      }

      // Last resort: Add the date directly to the PDF
      if (!dateFieldFound) {
        try {
          // Load a font
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

          // Get the first page
          const pages = pdfDoc.getPages()
          const page = pages[0]

          // Try to find a good position for the date
          // Look for the signature field or requester name field
          const signatureField = fieldNames.find(
            (name) => name.toLowerCase().includes("signature") || name.toLowerCase().includes("sign"),
          )

          let dateX = 500 // Default X position (right side of page)
          let dateY = 100 // Default Y position

          if (signatureField) {
            try {
              const field = form.getTextField(signatureField)
              const fieldRect = field.acroField.getRectangle()

              // Position date to the right of the signature
              dateX = fieldRect[2] + 20 // Right of signature field
              dateY = fieldRect[1] + (fieldRect[3] - fieldRect[1]) / 2 // Middle height of signature field
            } catch (error) {
              // Continue with default position
            }
          }

          // Draw the date text
          page.drawText(formattedDate, {
            x: dateX,
            y: dateY,
            size: 10,
            font,
            color: rgb(0, 0, 0),
          })

          console.log(`Added date directly to page at position (${dateX}, ${dateY})`)
          filledFieldCount++
        } catch (error) {
          console.warn("Error adding date directly to page:", error)
        }
      }
    }

    // Handle signature - only use text signature
    let signatureAdded = false

    // Add text signature
    if (formDataObj.textSignature) {
      try {
        // Try to find signature field
        const signatureFieldNames = fieldNames.filter(
          (name) => name.toLowerCase().includes("sign") || name.toLowerCase().includes("signature"),
        )

        if (signatureFieldNames.length > 0) {
          // For each potential signature field, try to add the text signature
          for (const fieldName of signatureFieldNames) {
            try {
              // Get the field
              const field = form.getTextField(fieldName)
              if (field) {
                // Set the text signature
                field.setText(formDataObj.textSignature)
                console.log(`Successfully added text signature to field: ${fieldName}`)
                filledFieldCount++
                signatureAdded = true
                break // Stop after successfully adding to one field
              }
            } catch (error) {
              console.warn(`Could not add text signature to field ${fieldName}:`, error)
            }
          }
        }

        // If no signature field was found, try to add the signature as text directly to the page
        if (!signatureAdded) {
          try {
            // Load a font
            const font = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)

            // Get the first page
            const pages = pdfDoc.getPages()
            const page = pages[0]

            // Find a good position for the signature (this is a guess - might need adjustment)
            // Look for fields that might be near the signature area
            const potentialNearbyFields = fieldNames.filter(
              (name) =>
                name.toLowerCase().includes("date") ||
                name.toLowerCase().includes("name") ||
                name.toLowerCase().includes("requester") ||
                name.toLowerCase().includes("certification"),
            )

            let signatureX = 100
            let signatureY = 100

            // If we found potential nearby fields, try to position near them
            if (potentialNearbyFields.length > 0) {
              for (const fieldName of potentialNearbyFields) {
                try {
                  const field = form.getTextField(fieldName)
                  const fieldRect = field.acroField.getRectangle()

                  // Position signature near this field
                  signatureX = fieldRect[0]
                  signatureY = fieldRect[1] - 20 // Position below the field

                  break
                } catch (error) {
                  // Continue to next field
                }
              }
            }

            // Draw the text signature
            page.drawText(formDataObj.textSignature, {
              x: signatureX,
              y: signatureY,
              size: 12,
              font,
              color: rgb(0, 0, 0),
            })

            console.log(`Added text signature directly to page at position (${signatureX}, ${signatureY})`)
            filledFieldCount++
            signatureAdded = true
          } catch (error) {
            console.warn("Error adding text signature directly to page:", error)
          }
        }
      } catch (error) {
        console.warn("Error adding text signature:", error)
      }
    }

    // If no fields were filled, return a warning
    if (filledFieldCount === 0) {
      return {
        success: false,
        error: "Could not match any form fields with the PDF. Please check the field mapping.",
        fieldNames,
      }
    }

    // Save the filled PDF
    const filledPdfBytes = await pdfDoc.save()

    // Convert to base64 for direct viewing in the browser
    const base64String = Buffer.from(filledPdfBytes).toString("base64")
    const base64 = `data:application/pdf;base64,${base64String}`

    // Generate a unique filename
    const filename = `filled_form_${randomUUID()}.pdf`

    try {
      // Save to public directory for download
      const dir = join(process.cwd(), "public", "filled_pdfs")
      const filePath = join(dir, filename)

      // Ensure the directory exists
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true })
      }

      // Write the file
      await writeFile(filePath, Buffer.from(filledPdfBytes))
      console.log(`PDF saved successfully to ${filePath}`)

      // Return both the URL and base64 data
      return {
        success: true,
        url: `/filled_pdfs/${filename}`,
        base64,
        fieldNames,
      }
    } catch (fileError) {
      console.error("Error saving PDF file:", fileError)
      // Even if file saving fails, return the base64 data so the user can still view the PDF
      return {
        success: true,
        base64,
        error: "Could not save the PDF file for download, but you can view it in the browser.",
        fieldNames,
      }
    }
  } catch (error) {
    console.error("Error filling PDF form:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Create potential field mappings based on available PDF fields
function createFieldMappings(pdfFieldNames: string[]): Record<string, string> {
  const mappings: Record<string, string> = {}
  const normalizedPdfFields = pdfFieldNames.map((name) => ({
    original: name,
    normalized: name.toLowerCase().replace(/[^a-z0-9]/g, ""),
  }))

  // Common field name patterns to try
  const fieldPatterns: Record<string, string[]> = {
    // Basic information
    expenseType: ["expensetype", "type", "typeofexpense", "expense"],
    location: ["location", "eventlocation", "place", "venue"],
    eventDate: ["eventdate", "date", "event_date", "dateofmeeting"],
    businessPurpose: ["businesspurpose", "purpose", "reason", "description", "justification"],
    costCenter: ["costcenter", "cost", "center", "account", "accountnumber"],
    poNumber: ["ponumber", "po", "purchaseorder", "ordernumber"],
    totalAmount: ["totalamount", "amount", "total", "cost", "expense"],

    // Payment method
    paymentMethodCard: ["card", "purchasingcard", "creditcard", "asucard"],
    paymentMethodInvoice: ["invoice", "directinvoice", "supplier", "vendor"],
    supplierName: ["suppliername", "supplier", "vendor", "vendorname"],

    // Large group information
    largeGroupInfo: ["largegroup", "groupinfo", "attendeecount", "approximatecount"],

    // Required certification
    requesterName: ["requestername", "requester", "name"],
    requesterPhone: ["requesterphone", "phone", "phoneno", "phonenumber"],
    requesterDate: ["requesterdate", "certificationdate", "certdate"],

    // Attendees and approvals have too many variations to list here
    // We'll try to match them based on position and naming patterns
  }

  // Try to find matches for our form fields in the PDF fields
  for (const [formField, patterns] of Object.entries(fieldPatterns)) {
    // First try exact match
    const exactMatch = pdfFieldNames.find((name) => name.toLowerCase() === formField.toLowerCase())
    if (exactMatch) {
      mappings[formField] = exactMatch
      continue
    }

    // Then try pattern matches
    for (const pattern of patterns) {
      const match = normalizedPdfFields.find((field) => field.normalized.includes(pattern))
      if (match) {
        mappings[formField] = match.original
        break
      }
    }
  }

  return mappings
}

// Try to set a form field using our mappings
function trySetFormField(form: PDFForm, mappings: Record<string, string>, fieldName: string, value: string): number {
  if (!value) return 0

  const pdfFieldName = mappings[fieldName]
  if (pdfFieldName) {
    try {
      const field = form.getTextField(pdfFieldName)
      if (field) {
        field.setText(value)
        console.log(`Successfully filled field: ${fieldName} -> ${pdfFieldName}`)
        return 1
      }
    } catch (error) {
      console.warn(`Field ${pdfFieldName} not found or could not be set`)
    }
  }

  // If no mapping found, try direct field name
  try {
    const field = form.getTextField(fieldName)
    if (field) {
      field.setText(value)
      console.log(`Successfully filled field: ${fieldName} (direct match)`)
      return 1
    }
  } catch (error) {
    // Field not found with direct name either
  }

  return 0
}

// Try to set a checkbox using our mappings
function trySetCheckBox(form: PDFForm, mappings: Record<string, string>, fieldName: string, checked: boolean): number {
  const pdfFieldName = mappings[fieldName]
  if (pdfFieldName) {
    try {
      const field = form.getCheckBox(pdfFieldName)
      if (field) {
        if (checked) {
          field.check()
        } else {
          field.uncheck()
        }
        console.log(`Successfully set checkbox: ${fieldName} -> ${pdfFieldName}`)
        return 1
      }
    } catch (error) {
      console.warn(`Checkbox ${pdfFieldName} not found or could not be set`)
    }
  }

  // If no mapping found, try direct field name
  try {
    const field = form.getCheckBox(fieldName)
    if (field) {
      if (checked) {
        field.check()
      } else {
        field.uncheck()
      }
      console.log(`Successfully set checkbox: ${fieldName} (direct match)`)
      return 1
    }
  } catch (error) {
    // Field not found with direct name either
  }

  return 0
}
