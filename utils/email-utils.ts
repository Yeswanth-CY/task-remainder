import nodemailer from "nodemailer"

type ReminderType = "day_before" | "hour_before" | "five_min_before"

export async function sendEventReminder(
  email: string,
  eventTitle: string,
  eventDate: string,
  eventTime: string,
  eventLocation: string,
  reminderType: ReminderType,
) {
  // Create a transporter using Outlook SMTP
  const transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      ciphers: "SSLv3",
    },
  })

  // Customize subject and message based on reminder type
  let timeframe: string
  let urgencyColor: string

  switch (reminderType) {
    case "day_before":
      timeframe = "tomorrow"
      urgencyColor = "#3b82f6" // blue
      break
    case "hour_before":
      timeframe = "in 1 hour"
      urgencyColor = "#f59e0b" // amber
      break
    case "five_min_before":
      timeframe = "in 5 minutes"
      urgencyColor = "#ef4444" // red
      break
    default:
      timeframe = "soon"
      urgencyColor = "#3b82f6"
  }

  // Email content
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Reminder: ${eventTitle} starting ${timeframe}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: ${urgencyColor};">Event Reminder</h2>
        <p>Your event is starting <strong>${timeframe}</strong>:</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid ${urgencyColor};">
          <h3 style="margin-top: 0; color: #1e40af;">${eventTitle}</h3>
          <p><strong>Date:</strong> ${eventDate}</p>
          <p><strong>Time:</strong> ${eventTime}</p>
          ${eventLocation ? `<p><strong>Location:</strong> ${eventLocation}</p>` : ""}
        </div>
        <p>${reminderType === "five_min_before" ? "Time to prepare for your event!" : "Don't forget to prepare for this event!"}</p>
        <p>Best regards,<br>Your Calendar App</p>
      </div>
    `,
  }

  try {
    // Send the email
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error }
  }
}
