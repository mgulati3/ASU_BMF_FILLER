import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Check if the request is for a PDF file in the filled_pdfs directory
  if (path.startsWith("/filled_pdfs/") && path.endsWith(".pdf")) {
    // Clone the response and set the content type header
    const response = NextResponse.next()
    response.headers.set("Content-Type", "application/pdf")
    response.headers.set("Content-Disposition", "inline")
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/filled_pdfs/:path*"],
}
