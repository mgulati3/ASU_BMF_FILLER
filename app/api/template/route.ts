import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"

export async function GET() {
  try {
    // Path to the preloaded template
    const templatePath = join(process.cwd(), "public", "templates", "asu_business_meals_template.pdf")

    // Read the file
    const fileBuffer = await readFile(templatePath)

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=asu_business_meals_template.pdf",
      },
    })
  } catch (error) {
    console.error("Error serving template:", error)
    return NextResponse.json({ error: "Failed to serve template" }, { status: 500 })
  }
}
