import nodemailer from 'nodemailer'
import { prisma } from './db'
import { EmailType, EmailStatus } from '@prisma/client'

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface EmailParams {
  to: string
  subject: string
  html: string
  type: EmailType
  orderId?: string
  userId?: string
}

export async function sendEmail({
  to,
  subject,
  html,
  type,
  orderId,
  userId,
}: EmailParams) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    })

    // Log successful email
    await prisma.emailLog.create({
      data: {
        to,
        subject,
        type,
        status: EmailStatus.SENT,
        orderId,
        userId,
        sentAt: new Date(),
      },
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Log failed email
    await prisma.emailLog.create({
      data: {
        to,
        subject,
        type,
        status: EmailStatus.FAILED,
        errorMessage,
        orderId,
        userId,
      },
    })

    console.error('Email sending failed:', errorMessage)
    return { success: false, error: errorMessage }
  }
}

// Email templates
export function orderConfirmationEmail(
  customerName: string,
  orderNumber: string,
  total: number,
  items: Array<{ name: string; quantity: number; price: number }>
) {
  const itemsHtml = items
    .map(
      (item) =>
        `<tr><td>${item.name}</td><td>${item.quantity}</td><td>$${item.price.toFixed(2)}</td></tr>`
    )
    .join('')

  return `
    <h2>Order Confirmation</h2>
    <p>Dear ${customerName},</p>
    <p>Thank you for your order! Your order number is <strong>${orderNumber}</strong></p>
    
    <h3>Order Items:</h3>
    <table border="1" cellpadding="5">
      <thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    
    <p><strong>Total: $${total.toFixed(2)}</strong></p>
    <p>We will send you a shipping confirmation soon.</p>
    <p>Best regards,<br/>${process.env.APP_NAME}</p>
  `
}

export function orderShippedEmail(
  customerName: string,
  orderNumber: string,
  trackingNumber?: string
) {
  return `
    <h2>Your Order Has Shipped!</h2>
    <p>Dear ${customerName},</p>
    <p>Your order <strong>${orderNumber}</strong> has been shipped.</p>
    ${
      trackingNumber
        ? `<p>Tracking Number: <strong>${trackingNumber}</strong></p>`
        : ''
    }
    <p>You can track your package status on our website.</p>
    <p>Best regards,<br/>${process.env.APP_NAME}</p>
  `
}

export function orderDeliveredEmail(
  customerName: string,
  orderNumber: string
) {
  return `
    <h2>Order Delivered</h2>
    <p>Dear ${customerName},</p>
    <p>Your order <strong>${orderNumber}</strong> has been delivered.</p>
    <p>We hope you enjoy your purchase! If you have any questions, please contact our support team.</p>
    <p>Best regards,<br/>${process.env.APP_NAME}</p>
  `
}

export function paymentFailedEmail(
  customerName: string,
  orderNumber: string
) {
  return `
    <h2>Payment Failed</h2>
    <p>Dear ${customerName},</p>
    <p>Payment for order <strong>${orderNumber}</strong> could not be processed.</p>
    <p>Please try again or contact our support team for assistance.</p>
    <p>Best regards,<br/>${process.env.APP_NAME}</p>
  `
}

export function resetPasswordEmail(
  customerName: string,
  resetLink: string
) {
  return `
    <h2>Reset Your Password</h2>
    <p>Dear ${customerName},</p>
    <p>We received a request to reset your password.</p>
    <p><a href="${resetLink}">Click here to reset your password</a></p>
    <p>This link expires in 1 hour.</p>
    <p>If you did not request this, please ignore this email.</p>
    <p>Best regards,<br/>${process.env.APP_NAME}</p>
  `
}

export function welcomeEmail(customerName: string) {
  return `
    <h2>Welcome to ${process.env.APP_NAME}!</h2>
    <p>Dear ${customerName},</p>
    <p>Your account has been successfully created. You can now start shopping.</p>
    <p>Best regards,<br/>${process.env.APP_NAME}</p>
  `
}
