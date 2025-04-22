export interface Attendee {
  name: string
  department: string
  title: string
}

export interface OtherAttendee {
  name: string
  affiliation: string
  title: string
}

// Renamed from FormData to ExpenseFormData to avoid conflict with built-in FormData
export interface ExpenseFormData {
  expenseType?: string
  location: string
  eventDate: string
  businessPurpose: string
  costCenter: string
  poNumber: string
  totalAmount: string
  paymentMethod: string
  supplierName: string
  largeGroupInfo?: string
  requesterName: string
  requesterPhone: string
  requesterDate: string
  textSignature?: string // Keep only the text signature field
  asuAttendees?: Attendee[]
  otherAttendees?: OtherAttendee[]
  directInquiriesTo?: string
  directInquiriesDate?: string
  costCenterManager?: string
  costCenterManagerDate?: string
  deanDirector?: string
  deanDirectorDate?: string
  other?: string
  otherDate?: string
}
