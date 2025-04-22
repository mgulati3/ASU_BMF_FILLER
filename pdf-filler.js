import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import { createInterface } from 'readline';

const readline = createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => readline.question(query, resolve));

async function collectFormData() {
  console.log("Business Meals and Related Expenses Form Filler");
  console.log("==============================================");
  
  const formData = {
    expenseType: await question("Type of Expense [Financial Services]: ") || "Financial Services",
    eventLocation: await question("Location of Event: "),
    eventDate: await question("Event Date: "),
    businessPurpose: await question("Business (Public) Purpose: "),
    costCenter: await question("Cost Center plus Program: "),
    poNumber: await question("PO # (if applicable): "),
    totalAmount: await question("Total Amount: "),
    asuAttendees: [],
    otherAttendees: [],
    paymentMethod: (await question("Payment Method (1 for ASU Purchasing Card, 2 for Direct supplier invoice) [1]: ")) || "1",
    supplierName: await question("Name of Supplier: "),
    requesterName: await question("Requester's Name: "),
    requesterPhone: await question("Phone No.: "),
    requesterDate: await question("Requester Date: "),
    directInquiriesTo: await question("Direct Inquiries To: "),
    inquiriesDate: await question("Inquiries Date: "),
    costCenterManager: await question("Cost Center Manager Name: "),
    costCenterManagerDate: await question("Cost Center Manager Date: "),
    deanDirector: await question("Dean or Director Name (If Required): "),
    deanDirectorDate: await question("Dean or Director Date: "),
    other: await question("Other Name (If Required): "),
    otherDate: await question("Other Date: ")
  };
  
  // Collect ASU Attendees
  console.log("\nASU Faculty, Staff or Students (up to 5):");
  for (let i = 0; i < 5; i++) {
    console.log(`\nAttendee ${i+1}:`);
    const name = await question("Name (leave empty to skip): ");
    if (!name) break;
    
    const department = await question("Department: ");
    const title = await question("Title: ");
    
    formData.asuAttendees.push({ name, department, title });
  }
  
  // Collect Other Attendees
  console.log("\nOther Attendees (up to 5):");
  for (let i = 0; i < 5; i++) {
    console.log(`\nAttendee ${i+1}:`);
    const name = await question("Name (leave empty to skip): ");
    if (!name) break;
    
    const affiliation = await question("Affiliation: ");
    const title = await question("Title: ");
    
    formData.otherAttendees.push({ name, affiliation, title });
  }
  
  return formData;
}

async function fillPdfForm(formData, templatePath, outputPath) {
  try {
    // Load the PDF template
    const pdfBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    
    // Map form field names to your PDF's actual field names
    // Note: These field names are examples and would need to be adjusted for your specific PDF
    const fieldMap = {
      expenseType: 'expense_type',
      eventLocation: 'event_location',
      eventDate: 'event_date',
      businessPurpose: 'business_purpose',
      costCenter: 'cost_center',
      poNumber: 'po_number',
      totalAmount: 'total_amount',
      // ASU Attendees
      'asuName1': 'asu_name_1',
      'asuDepartment1': 'asu_dept_1',
      'asuTitle1': 'asu_title_1',
      // ... and so on for all fields
    };
    
    // Fill in the form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value === 'string' && fieldMap[key]) {
        try {
          const field = form.getTextField(fieldMap[key]);
          if (field) {
            field.setText(value);
          }
        } catch (error) {
          console.warn(`Field ${fieldMap[key]} not found or could not be set`);
        }
      }
    });
    
    // Fill ASU Attendees
    formData.asuAttendees.forEach((attendee, index) => {
      if (index < 5) {
        try {
          const nameField = form.getTextField(fieldMap[`asuName${index+1}`]);
          const deptField = form.getTextField(fieldMap[`asuDepartment${index+1}`]);
          const titleField = form.getTextField(fieldMap[`asuTitle${index+1}`]);
          
          if (nameField) nameField.setText(attendee.name);
          if (deptField) deptField.setText(attendee.department);
          if (titleField) titleField.setText(attendee.title);
        } catch (error) {
          console.warn(`Error setting ASU attendee ${index+1} fields`, error);
        }
      }
    });
    
    // Fill Other Attendees
    formData.otherAttendees.forEach((attendee, index) => {
      if (index < 5) {
        try {
          const nameField = form.getTextField(fieldMap[`otherName${index+1}`]);
          const affiliationField = form.getTextField(fieldMap[`otherAffiliation${index+1}`]);
          const titleField = form.getTextField(fieldMap[`otherTitle${index+1}`]);
          
          if (nameField) nameField.setText(attendee.name);
          if (affiliationField) affiliationField.setText(attendee.affiliation);
          if (titleField) titleField.setText(attendee.title);
        } catch (error) {
          console.warn(`Error setting Other attendee ${index+1} fields`, error);
        }
      }
    });
    
    // Set payment method checkbox
    try {
      if (formData.paymentMethod === '1') {
        const field = form.getCheckBox(fieldMap.paymentMethodCard);
        if (field) field.check();
      } else {
        const field = form.getCheckBox(fieldMap.paymentMethodInvoice);
        if (field) field.check();
      }
    } catch (error) {
      console.warn('Error setting payment method checkbox', error);
    }
    
    // Save the filled PDF
    const filledPdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, filledPdfBytes);
    
    console.log(`\nPDF successfully filled and saved to ${outputPath}`);
  } catch (error) {
    console.error('Error filling PDF form:', error);
    throw error;
  }
}

async function main() {
  try {
    const templatePath = await question("\nEnter the path to your PDF template: ");
    const outputPath = await question("Enter the path for the output PDF: ");
    
    const formData = await collectFormData();
    await fillPdfForm(formData, templatePath, outputPath);
    
    console.log("\nForm filling complete!");
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    readline.close();
  }
}

main();
