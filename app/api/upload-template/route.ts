import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    // Check if the file is a PDF
    if (file.type !== "application/pdf") {
      return NextResponse.json({ success: false, error: "File must be a PDF" }, { status: 400 })
    }

    // Generate a unique filename
    const filename = `template_${randomUUID()}.pdf`
    const dir = join(process.cwd(), "public", "templates")
    const filePath = join(dir, filename)

    // Ensure the directory exists
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }

    // Convert the file to a Buffer and save it
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Return the path to the saved template
    return NextResponse.json({
      success: true,
      path: `/templates/${filename}`,
    })
  } catch (error) {
    console.error("Error uploading template:", error)
    return NextResponse.json({ success: false, error: "Failed to upload template" }, { status: 500 })
  }
}
