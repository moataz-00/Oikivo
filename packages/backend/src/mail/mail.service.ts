import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

// ─── Brand colours ────────────────────────────────────────────────────────────
const PRIMARY = '#4f46e5';          // indigo-600
const PRIMARY_DARK = '#3730a3';     // indigo-800
const ACCENT = '#7c3aed';           // violet-600
const ROSE = '#f43f5e';             // rose-500
const BG = '#f1f5f9';               // slate-100
const CARD = '#ffffff';
const TEXT = '#0f172a';             // slate-900
const MUTED = '#64748b';            // slate-500
const BORDER = '#e2e8f0';           // slate-200
const SUCCESS = '#16a34a';          // green-600
const WARNING = '#d97706';          // amber-600
const DANGER = '#dc2626';           // red-600

// ─── Logo URL (served from the web frontend /public/) ─────────────────────────
const LOGO_URL = (process.env.FRONTEND_URL?.split(',')?.[0]?.trim() ?? 'https://oikivo.com') + '/favicon-96x96.png';

// ─── Base layout ──────────────────────────────────────────────────────────────
function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Oikivo</title>
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${TEXT};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 0;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,${PRIMARY} 0%,${ACCENT} 100%);padding:32px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${LOGO_URL}" alt="Oikivo" width="48" height="48" style="width:48px;height:48px;border-radius:12px;display:block;margin:0 auto 12px;" />
          <span style="font-family:'Dancing Script','Magnolia Script',cursive;font-size:28px;font-weight:700;color:#fff;letter-spacing:0.5px;">Oikivo</span>
        </td></tr>

        <!-- Body card -->
        <tr><td style="background:${CARD};padding:36px 36px 28px;border-left:1px solid ${BORDER};border-right:1px solid ${BORDER};">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 32px;border:1px solid ${BORDER};border-top:none;border-radius:0 0 16px 16px;text-align:center;">
          <p style="margin:0;font-size:12px;color:${MUTED};">© ${new Date().getFullYear()} Oikivo. All rights reserved.</p>
          <p style="margin:4px 0 0;font-size:12px;color:${MUTED};">If you did not request this email, you can safely ignore it.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:${TEXT};line-height:1.2;">${text}</h1>`;
}

function subHeading(text: string): string {
  return `<p style="margin:0 0 20px;font-size:15px;color:${MUTED};">${text}</p>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:${TEXT};line-height:1.6;">${text}</p>`;
}

function btn(label: string, href: string, color = PRIMARY): string {
  return `<div style="text-align:center;margin:28px 0;">
  <a href="${href}" style="display:inline-block;background:${color};color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.2px;">${label}</a>
</div>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
  <td style="padding:10px 14px;font-size:13px;color:${MUTED};width:40%;vertical-align:top;">${label}</td>
  <td style="padding:10px 14px;font-size:13px;color:${TEXT};font-weight:600;">${value}</td>
</tr>`;
}

function infoTable(rows: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:12px;margin:20px 0;overflow:hidden;">
  <tbody>${rows}</tbody>
</table>`;
}

function badge(text: string, color = PRIMARY): string {
  return `<span style="display:inline-block;padding:4px 12px;border-radius:999px;background:${color}18;color:${color};font-size:12px;font-weight:700;letter-spacing:0.3px;">${text}</span>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid ${BORDER};margin:24px 0;" />`;
}

function currencyNote(currency: string): string {
  if (currency.toUpperCase() === 'EGP') {
    return `<p style="margin:0;font-size:11px;color:${MUTED};text-align:center;font-style:italic;">All amounts are in Egyptian Pounds (EGP). If you paid by card in another currency, your bank may show the equivalent in your local currency.</p>`;
  }
  return '';
}

// ─── Template: Email Verification ─────────────────────────────────────────────
export function tplEmailVerification(firstName: string, verifyUrl: string): string {
  return layout(`
    ${heading('Verify your email address')}
    ${subHeading('One quick step to get started')}
    ${paragraph(`Hi <strong>${firstName}</strong>, welcome to Oikivo! Please confirm your email address to activate your account and start exploring unique stays.`)}
    ${btn('✅ Verify Email', verifyUrl)}
    ${divider()}
    <p style="margin:0;font-size:13px;color:${MUTED};text-align:center;">
      Link expires in <strong>24 hours</strong>. Or copy this URL:<br/>
      <a href="${verifyUrl}" style="color:${PRIMARY};font-size:11px;word-break:break-all;">${verifyUrl}</a>
    </p>
  `);
}

// ─── Template: Password Reset ──────────────────────────────────────────────────
export function tplPasswordReset(firstName: string, resetUrl: string): string {
  return layout(`
    ${heading('Reset your password')}
    ${subHeading('We received a request to reset your password')}
    ${paragraph(`Hi <strong>${firstName}</strong>, click the button below to choose a new password. This link expires in <strong>1 hour</strong>.`)}
    ${btn('🔑 Reset Password', resetUrl, ROSE)}
    ${divider()}
    <p style="margin:0;font-size:13px;color:${MUTED};text-align:center;">
      If you didn't request a password reset, you can safely ignore this email.
    </p>
  `);
}

// ─── Template: Welcome after registration ─────────────────────────────────────
export function tplWelcome(firstName: string, loginUrl: string): string {
  return layout(`
    ${heading(`Welcome to Oikivo, ${firstName}! 🎉`)}
    ${subHeading('Your account is ready')}
    ${paragraph(`Your email has been verified and your Oikivo account is now fully active. Start exploring thousands of unique homes and experiences across the Middle East and beyond.`)}
    ${btn('🏠 Explore Stays', loginUrl)}
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="text-align:center;padding:8px;">
          <span style="font-size:28px;">🔍</span>
          <p style="margin:6px 0 0;font-size:12px;font-weight:600;color:${TEXT};">Search & filter</p>
          <p style="margin:2px 0 0;font-size:11px;color:${MUTED};">Find the perfect spot</p>
        </td>
        <td style="text-align:center;padding:8px;">
          <span style="font-size:28px;">✅</span>
          <p style="margin:6px 0 0;font-size:12px;font-weight:600;color:${TEXT};">Book instantly</p>
          <p style="margin:2px 0 0;font-size:11px;color:${MUTED};">Secure &amp; protected</p>
        </td>
        <td style="text-align:center;padding:8px;">
          <span style="font-size:28px;">🏡</span>
          <p style="margin:6px 0 0;font-size:12px;font-weight:600;color:${TEXT};">Check in &amp; enjoy</p>
          <p style="margin:2px 0 0;font-size:11px;color:${MUTED};">Memorable stays</p>
        </td>
      </tr>
    </table>
  `);
}

// ─── Template: Phone OTP ───────────────────────────────────────────────────────
export function tplPhoneOtp(firstName: string, phone: string, code: string): string {
  return layout(`
    ${heading('Phone verification code')}
    ${subHeading(`To verify ${phone}`)}
    ${paragraph(`Hi <strong>${firstName}</strong>, use the code below to verify your phone number.`)}
    <div style="text-align:center;margin:28px 0;">
      <div style="display:inline-block;background:${BG};border:2px dashed ${PRIMARY};border-radius:14px;padding:20px 40px;">
        <span style="font-size:40px;font-weight:800;letter-spacing:10px;font-family:monospace;color:${PRIMARY};">${code}</span>
      </div>
    </div>
    ${paragraph(`<span style="color:${MUTED};font-size:13px;">Expires in <strong>10 minutes</strong>. Do not share this code with anyone.</span>`)}
  `);
}

// ─── Template: Confirm Email Change ───────────────────────────────────────────
export function tplConfirmEmailChange(firstName: string, newEmail: string, confirmUrl: string): string {
  return layout(`
    ${heading('Confirm your new email')}
    ${subHeading('Action required')}
    ${paragraph(`Hi <strong>${firstName}</strong>, you requested to change your email address to <strong>${newEmail}</strong>.`)}
    ${paragraph('Click the button below to confirm this change:')}
    ${btn('📧 Confirm Email Change', confirmUrl)}
    ${divider()}
    <p style="margin:0;font-size:13px;color:${MUTED};text-align:center;">
      This link expires in <strong>24 hours</strong>. If you did not request this, ignore this email.
    </p>
  `);
}

// ─── Template: Booking Confirmed (Guest) ──────────────────────────────────────
export function tplBookingConfirmed(
  guestName: string,
  propertyTitle: string,
  checkIn: string,
  checkOut: string,
  guests: number,
  totalAmount: string,
  currency: string,
  bookingRef: string,
  tripsUrl: string,
): string {
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">🎉</span>
    </div>
    ${heading('Your booking is confirmed!')}
    ${subHeading(`Booking reference: ${badge(bookingRef)}`)}
    ${paragraph(`Hi <strong>${guestName}</strong>, your stay at <strong>${propertyTitle}</strong> has been confirmed. Here are your booking details:`)}
    ${infoTable(
      infoRow('Property', propertyTitle) +
      infoRow('Check-in', checkIn) +
      infoRow('Check-out', checkOut) +
      infoRow('Guests', String(guests)) +
      infoRow('Total paid', `${totalAmount} ${currency}`) +
      infoRow('Status', badge('Confirmed', SUCCESS))
    )}
    ${btn('📅 View My Trips', tripsUrl)}
    ${currencyNote(currency)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">Please contact your host directly for check-in instructions. Have a wonderful stay!</span>`)}
  `);
}

// ─── Template: Booking Request Received (Host) ────────────────────────────────
export function tplBookingRequestReceived(
  hostName: string,
  guestName: string,
  propertyTitle: string,
  checkIn: string,
  checkOut: string,
  guests: number,
  totalAmount: string,
  currency: string,
  reservationsUrl: string,
  specialRequests?: string,
): string {
  const specialRequestsRow = specialRequests
    ? infoRow('Special Requests', specialRequests)
    : '';

  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">🏠</span>
    </div>
    ${heading('New booking request!')}
    ${subHeading('A guest wants to stay at your property')}
    ${paragraph(`Hi <strong>${hostName}</strong>, <strong>${guestName}</strong> has requested a booking at <strong>${propertyTitle}</strong>. Review and respond within 24 hours.`)}
    ${infoTable(
      infoRow('Guest', guestName) +
      infoRow('Property', propertyTitle) +
      infoRow('Check-in', checkIn) +
      infoRow('Check-out', checkOut) +
      infoRow('Guests', String(guests)) +
      specialRequestsRow +
      infoRow('Payout', `${totalAmount} ${currency}`) +
      infoRow('Status', badge('Pending Review', WARNING))
    )}
    ${btn('✅ Review Booking', reservationsUrl, SUCCESS)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">Respond within 24 hours to maintain your response rate.</span>`)}
  `);
}

// ─── Template: Booking Cancelled ──────────────────────────────────────────────
export function tplBookingCancelled(
  userName: string,
  role: 'guest' | 'host',
  propertyTitle: string,
  checkIn: string,
  checkOut: string,
  bookingRef: string,
  refundAmount?: string,
  refundCurrency?: string,
): string {
  const roleNote = role === 'guest'
    ? (refundAmount ? `A refund of <strong>${refundAmount} ${refundCurrency}</strong> will be processed within 5–10 business days.` : 'No refund applies based on the cancellation policy.')
    : 'The reservation has been cancelled. The guest has been notified.';

  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">❌</span>
    </div>
    ${heading('Booking Cancelled')}
    ${subHeading(`Reference: ${badge(bookingRef, DANGER)}`)}
    ${paragraph(`Hi <strong>${userName}</strong>, the following booking has been cancelled:`)}
    ${infoTable(
      infoRow('Property', propertyTitle) +
      infoRow('Check-in', checkIn) +
      infoRow('Check-out', checkOut) +
      infoRow('Status', badge('Cancelled', DANGER))
    )}
    ${paragraph(roleNote)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">If you have any questions, please contact us via the in-app messaging system.</span>`)}
  `);
}

// ─── Template: Payment Invoice ────────────────────────────────────────────────
export function tplPaymentInvoice(
  guestName: string,
  bookingRef: string,
  invoiceDate: string,
  propertyTitle: string,
  checkIn: string,
  checkOut: string,
  nights: number,
  pricePerNight: string,
  cleaningFee: string,
  serviceFee: string,
  totalAmount: string,
  currency: string,
  paymentMethod: string,
  paymentIntentId: string,
  tripsUrl: string,
): string {
  return layout(`
    <!-- Invoice header -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td>
          <p style="margin:0;font-size:20px;font-weight:800;color:${TEXT};">Invoice</p>
          <p style="margin:4px 0 0;font-size:13px;color:${MUTED};">Ref: <strong>${bookingRef}</strong></p>
          <p style="margin:2px 0 0;font-size:13px;color:${MUTED};">Date: ${invoiceDate}</p>
        </td>
        <td style="text-align:right;">
          <div style="background:linear-gradient(135deg,${PRIMARY},${ACCENT});display:inline-block;padding:10px 18px;border-radius:10px;">
            <img src="${LOGO_URL}" alt="Oikivo" width="28" height="28" style="width:28px;height:28px;border-radius:6px;vertical-align:middle;margin-right:6px;" /><span style="font-family:'Dancing Script','Magnolia Script',cursive;font-size:22px;font-weight:700;color:#fff;">Oikivo</span>
          </div>
        </td>
      </tr>
    </table>
    ${divider()}

    ${paragraph(`Billed to: <strong>${guestName}</strong>`)}

    <!-- Line items -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <thead>
        <tr style="background:${BG};">
          <th style="padding:10px 14px;text-align:left;font-size:12px;color:${MUTED};font-weight:600;border-bottom:1px solid ${BORDER};">Description</th>
          <th style="padding:10px 14px;text-align:right;font-size:12px;color:${MUTED};font-weight:600;border-bottom:1px solid ${BORDER};">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:12px 14px;font-size:14px;color:${TEXT};border-bottom:1px solid ${BORDER};">
            ${propertyTitle}<br/>
            <span style="font-size:12px;color:${MUTED};">${checkIn} → ${checkOut} · ${nights} night${nights !== 1 ? 's' : ''}</span>
          </td>
          <td style="padding:12px 14px;text-align:right;font-size:14px;color:${TEXT};border-bottom:1px solid ${BORDER};">${pricePerNight} ${currency} × ${nights}</td>
        </tr>
        <tr>
          <td style="padding:12px 14px;font-size:14px;color:${TEXT};border-bottom:1px solid ${BORDER};">Cleaning fee</td>
          <td style="padding:12px 14px;text-align:right;font-size:14px;color:${TEXT};border-bottom:1px solid ${BORDER};">${cleaningFee} ${currency}</td>
        </tr>
        <tr>
          <td style="padding:12px 14px;font-size:14px;color:${TEXT};border-bottom:1px solid ${BORDER};">Service fee</td>
          <td style="padding:12px 14px;text-align:right;font-size:14px;color:${TEXT};border-bottom:1px solid ${BORDER};">${serviceFee} ${currency}</td>
        </tr>
        <!-- Total row -->
        <tr style="background:${BG};">
          <td style="padding:14px;font-size:16px;font-weight:800;color:${TEXT};">Total</td>
          <td style="padding:14px;text-align:right;font-size:16px;font-weight:800;color:${PRIMARY};">${totalAmount} ${currency}</td>
        </tr>
      </tbody>
    </table>

    ${infoTable(
      infoRow('Payment status', badge('Paid', SUCCESS)) +
      infoRow('Payment method', paymentMethod) +
      infoRow('Transaction ID', `<code style="font-size:11px;background:${BG};padding:2px 6px;border-radius:4px;">${paymentIntentId}</code>`)
    )}

    ${btn('📋 View My Trips', tripsUrl)}
    ${currencyNote(currency)}
  `);
}

// ─── Template: Payout Notification (Host) ─────────────────────────────────────
export function tplPayoutNotification(
  hostName: string,
  amount: string,
  currency: string,
  propertyTitle: string,
  checkIn: string,
  checkOut: string,
  payoutDate: string,
  payoutRef: string,
  earningsUrl: string,
): string {
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">💸</span>
    </div>
    ${heading('Payment sent to your account!')}
    ${subHeading('Your payout is on the way')}
    ${paragraph(`Hi <strong>${hostName}</strong>, a payout has been initiated for a completed stay at <strong>${propertyTitle}</strong>.`)}
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:linear-gradient(135deg,${SUCCESS}18,${SUCCESS}10);border:1px solid ${SUCCESS}40;border-radius:14px;padding:20px 40px;">
        <p style="margin:0;font-size:13px;color:${SUCCESS};font-weight:600;text-transform:uppercase;letter-spacing:1px;">Payout Amount</p>
        <p style="margin:8px 0 0;font-size:36px;font-weight:900;color:${SUCCESS};">${amount} ${currency}</p>
        <p style="margin:4px 0 0;font-size:12px;color:${MUTED};">Ref: ${payoutRef}</p>
      </div>
    </div>
    ${infoTable(
      infoRow('Property', propertyTitle) +
      infoRow('Stay dates', `${checkIn} → ${checkOut}`) +
      infoRow('Payout date', payoutDate) +
      infoRow('Status', badge('Sent', SUCCESS))
    )}
    ${btn('💰 View Earnings', earningsUrl, SUCCESS)}
  `);
}

// ─── Template: Refund Notification (Guest) ────────────────────────────────────
export function tplRefundNotification(
  guestName: string,
  refundAmount: string,
  currency: string,
  propertyTitle: string,
  bookingRef: string,
  refundDate: string,
  paymentMethod: string,
  tripsUrl: string,
): string {
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">💳</span>
    </div>
    ${heading('Your refund is being processed')}
    ${subHeading('We\'re sorry to see you go')}
    ${paragraph(`Hi <strong>${guestName}</strong>, a refund has been initiated for your cancelled booking at <strong>${propertyTitle}</strong>.`)}
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:${BG};border:2px solid ${PRIMARY};border-radius:14px;padding:20px 40px;">
        <p style="margin:0;font-size:13px;color:${MUTED};font-weight:600;text-transform:uppercase;letter-spacing:1px;">Refund Amount</p>
        <p style="margin:8px 0 0;font-size:36px;font-weight:900;color:${PRIMARY};">${refundAmount} ${currency}</p>
      </div>
    </div>
    ${infoTable(
      infoRow('Booking ref', bookingRef) +
      infoRow('Property', propertyTitle) +
      infoRow('Refund initiated', refundDate) +
      infoRow('Refund to', paymentMethod) +
      infoRow('Processing time', '5–10 business days')
    )}
    ${btn('📅 View My Trips', tripsUrl)}
    ${currencyNote(currency)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">Refunds may take 5–10 business days to appear in your account depending on your bank.</span>`)}
  `);
}

// ─── Template: New Message ────────────────────────────────────────────────────
export function tplNewMessage(
  recipientName: string,
  senderName: string,
  preview: string,
  inboxUrl: string,
): string {
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">💬</span>
    </div>
    ${heading('You have a new message')}
    ${subHeading(`From ${senderName}`)}
    ${paragraph(`Hi <strong>${recipientName}</strong>, <strong>${senderName}</strong> sent you a message:`)}
    <blockquote style="margin:0 0 20px;padding:16px 20px;background:${BG};border-left:4px solid ${PRIMARY};border-radius:0 10px 10px 0;font-size:14px;color:${TEXT};font-style:italic;">${preview}</blockquote>
    ${btn('💬 Reply in Inbox', inboxUrl)}
  `);
}

// ─── Template: Host Activation (became a host) ────────────────────────────────
export function tplHostActivation(
  hostName: string,
  dashboardUrl: string,
): string {
  return layout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:linear-gradient(135deg,${PRIMARY}18,${ACCENT}12);border-radius:50%;padding:20px;">
        <span style="font-size:52px;line-height:1;">🏠</span>
      </div>
    </div>
    ${heading(`Welcome aboard, ${hostName}!`)}
    <p style="margin:0 0 24px;font-size:16px;color:${TEXT};text-align:center;line-height:1.5;">Your host account on <strong style="color:${PRIMARY};">Oikivo</strong> is now active. Start listing your properties and earning today.</p>

    <!-- Hero stat banner -->
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:linear-gradient(135deg,${PRIMARY},${ACCENT});border-radius:16px;padding:24px 48px;">
        <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.8);font-weight:600;text-transform:uppercase;letter-spacing:1.5px;">Platform Commission</p>
        <p style="margin:8px 0 0;font-size:48px;font-weight:900;color:#fff;letter-spacing:-1px;">0%</p>
        <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">Keep 100% of your earnings</p>
      </div>
    </div>

    <!-- Feature cards -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr>
        <td style="padding:8px;width:33%;" valign="top">
          <div style="background:${BG};border:1px solid ${BORDER};border-radius:14px;padding:20px 14px;text-align:center;">
            <div style="display:inline-block;background:linear-gradient(135deg,${SUCCESS}18,${SUCCESS}08);border-radius:12px;padding:10px;margin-bottom:10px;">
              <span style="font-size:24px;">💸</span>
            </div>
            <p style="margin:0;font-size:13px;font-weight:700;color:${TEXT};">Zero Fees</p>
            <p style="margin:4px 0 0;font-size:11px;color:${MUTED};line-height:1.4;">No hidden charges or platform cuts</p>
          </div>
        </td>
        <td style="padding:8px;width:33%;" valign="top">
          <div style="background:${BG};border:1px solid ${BORDER};border-radius:14px;padding:20px 14px;text-align:center;">
            <div style="display:inline-block;background:linear-gradient(135deg,${WARNING}18,${WARNING}08);border-radius:12px;padding:10px;margin-bottom:10px;">
              <span style="font-size:24px;">⚡</span>
            </div>
            <p style="margin:0;font-size:13px;font-weight:700;color:${TEXT};">Fast Payouts</p>
            <p style="margin:4px 0 0;font-size:11px;color:${MUTED};line-height:1.4;">Get paid within 24 hours</p>
          </div>
        </td>
        <td style="padding:8px;width:33%;" valign="top">
          <div style="background:${BG};border:1px solid ${BORDER};border-radius:14px;padding:20px 14px;text-align:center;">
            <div style="display:inline-block;background:linear-gradient(135deg,${PRIMARY}18,${PRIMARY}08);border-radius:12px;padding:10px;margin-bottom:10px;">
              <span style="font-size:24px;">🛡️</span>
            </div>
            <p style="margin:0;font-size:13px;font-weight:700;color:${TEXT};">Host Protection</p>
            <p style="margin:4px 0 0;font-size:11px;color:${MUTED};line-height:1.4;">Up to $1M host coverage</p>
          </div>
        </td>
      </tr>
    </table>

    <!-- Steps to get started -->
    ${divider()}
    <p style="margin:0 0 16px;font-size:16px;font-weight:800;color:${TEXT};text-align:center;">Get started in 3 easy steps</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:10px 14px;vertical-align:top;width:36px;">
          <div style="display:inline-block;background:${PRIMARY};color:#fff;width:28px;height:28px;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:800;">1</div>
        </td>
        <td style="padding:10px 14px;">
          <p style="margin:0;font-size:14px;font-weight:700;color:${TEXT};">Create your listing</p>
          <p style="margin:2px 0 0;font-size:12px;color:${MUTED};">Add photos, description, pricing &amp; amenities</p>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 14px;vertical-align:top;width:36px;">
          <div style="display:inline-block;background:${ACCENT};color:#fff;width:28px;height:28px;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:800;">2</div>
        </td>
        <td style="padding:10px 14px;">
          <p style="margin:0;font-size:14px;font-weight:700;color:${TEXT};">Set your availability</p>
          <p style="margin:2px 0 0;font-size:12px;color:${MUTED};">Choose dates, set rules &amp; cancellation policy</p>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 14px;vertical-align:top;width:36px;">
          <div style="display:inline-block;background:${SUCCESS};color:#fff;width:28px;height:28px;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:800;">3</div>
        </td>
        <td style="padding:10px 14px;">
          <p style="margin:0;font-size:14px;font-weight:700;color:${TEXT};">Start earning</p>
          <p style="margin:2px 0 0;font-size:12px;color:${MUTED};">Guests will find you &amp; book — get paid instantly</p>
        </td>
      </tr>
    </table>

    ${btn('🏠 Go to Your Dashboard', dashboardUrl)}
  `);
}

// ─── Template: InstaPay Payment Confirmed (Admin) ───────────────────────────
export function tplInstapayPaymentConfirmed(
  guestName: string,
  bookingRef: string,
  propertyTitle: string,
  checkIn: string,
  checkOut: string,
  totalAmount: string,
  currency: string,
  tripsUrl: string,
): string {
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">✅</span>
    </div>
    ${heading('Payment Confirmed!')}
    ${subHeading('Your InstaPay transfer has been verified')}
    ${paragraph(`Hi <strong>${guestName}</strong>, great news! Your InstaPay payment for the following booking has been verified and confirmed by our team.`)}
    ${infoTable(
      infoRow('Booking ref', bookingRef) +
      infoRow('Property', propertyTitle) +
      infoRow('Check-in', checkIn) +
      infoRow('Check-out', checkOut) +
      infoRow('Total paid', `${totalAmount} ${currency}`) +
      infoRow('Payment method', badge('InstaPay', SUCCESS)) +
      infoRow('Status', badge('Confirmed', SUCCESS))
    )}
    ${paragraph('Your stay is fully booked and confirmed. We look forward to welcoming you!')}
    ${btn('📅 View My Trips', tripsUrl, SUCCESS)}
    ${currencyNote(currency)}
  `);
}

// ─── Template: InstaPay Payment Declined (Admin) ─────────────────────────────
export function tplInstapayPaymentDeclined(
  guestName: string,
  bookingRef: string,
  propertyTitle: string,
  reason: string | undefined,
  tripsUrl: string,
): string {
  const reasonNote = reason
    ? `<blockquote style="margin:0 0 16px;padding:12px 16px;background:#fef2f2;border-left:4px solid ${DANGER};border-radius:0 8px 8px 0;font-size:14px;color:${DANGER};">${reason}</blockquote>`
    : '';
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">⚠️</span>
    </div>
    ${heading('Payment Could Not Be Verified')}
    ${subHeading('Action required — please retry your payment')}
    ${paragraph(`Hi <strong>${guestName}</strong>, unfortunately our team was unable to verify your InstaPay payment for booking <strong>${bookingRef}</strong> at <strong>${propertyTitle}</strong>.`)}
    ${reasonNote}
    ${paragraph('Your booking is still reserved. Please go to My Trips and try again — you can submit a new InstaPay reference or pay by card.')}
    ${btn('🔄 Retry Payment', tripsUrl, WARNING)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">If you believe this is an error, please contact our support team via the in-app chat.</span>`)}
  `);
}

// ─── Template: Booking Request Submitted (Guest acknowledgment) ───────────────
export function tplBookingRequestSubmitted(
  guestName: string,
  propertyTitle: string,
  checkIn: string,
  checkOut: string,
  guests: number,
  totalAmount: string,
  currency: string,
  bookingRef: string,
  cancellationPolicy: string,
  tripsUrl: string,
): string {
  const policyNote: Record<string, string> = {
    flexible: 'Full refund if cancelled within 48 hours of booking.',
    moderate: 'Full refund if cancelled 5 days before check-in.',
    strict: 'No refund within 48 hours of check-in.',
  };
  const policyText = `<strong>Cancellation policy (${cancellationPolicy}):</strong> ${policyNote[cancellationPolicy] ?? 'See cancellation terms on the property page.'}`;
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">📬</span>
    </div>
    ${heading('Booking request sent!')}
    ${subHeading('Awaiting host confirmation')}
    ${paragraph(`Hi <strong>${guestName}</strong>, your booking request for <strong>${propertyTitle}</strong> has been received. The host will confirm shortly — you'll be notified by email and in-app.`)}
    ${infoTable(
      infoRow('Property', propertyTitle) +
      infoRow('Check-in', checkIn) +
      infoRow('Check-out', checkOut) +
      infoRow('Guests', String(guests)) +
      infoRow('Total amount', `${totalAmount} ${currency}`) +
      infoRow('Booking ref', bookingRef) +
      infoRow('Status', badge('Pending confirmation', WARNING))
    )}
    ${divider()}
    <p style="margin:0 0 16px;font-size:13px;color:${MUTED};">
      ${policyText}
    </p>
    ${btn('📅 View My Trips', tripsUrl)}
    ${currencyNote(currency)}
  `);
}

// ─── Template: Payout Processed (Host — admin confirmed transfer) ─────────────
export function tplPayoutProcessed(
  hostName: string,
  amount: string,
  currency: string,
  method: string,
  accountDetails: string,
  payoutRef: string,
  processedAt: string,
  earningsUrl: string,
): string {
  const methodLabel = method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">✅</span>
    </div>
    ${heading('Your payout has been processed!')}
    ${subHeading('The funds have been transferred to your account')}
    ${paragraph(`Hi <strong>${hostName}</strong>, your payout request has been approved and the funds have been sent to your account.`)}
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:linear-gradient(135deg,${SUCCESS}18,${SUCCESS}10);border:1px solid ${SUCCESS}40;border-radius:14px;padding:20px 40px;">
        <p style="margin:0;font-size:13px;color:${SUCCESS};font-weight:600;text-transform:uppercase;letter-spacing:1px;">Amount Transferred</p>
        <p style="margin:8px 0 0;font-size:36px;font-weight:900;color:${SUCCESS};">${amount} ${currency}</p>
        <p style="margin:4px 0 0;font-size:12px;color:${MUTED};">Ref: ${payoutRef}</p>
      </div>
    </div>
    ${infoTable(
      infoRow('Transfer method', methodLabel) +
      infoRow('Account / handle', accountDetails) +
      infoRow('Processed on', processedAt) +
      infoRow('Status', badge('Completed', SUCCESS))
    )}
    ${btn('💰 View Earnings', earningsUrl, SUCCESS)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">If you have not received the funds within 24 hours, please contact support.</span>`)}
  `);
}

// ─── Template: InstaPay Refund Completed (Guest — admin confirms transfer done) ─
export function tplInstapayRefundCompleted(
  guestName: string,
  propertyTitle: string,
  refundAmount: string,
  currency: string,
  bookingRef: string,
  tripsUrl: string,
): string {
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">✅</span>
    </div>
    ${heading('Your InstaPay refund has been sent!')}
    ${subHeading('The transfer is complete')}
    ${paragraph(`Hi <strong>${guestName}</strong>, great news! Our team has completed the manual InstaPay refund for your cancelled booking at <strong>${propertyTitle}</strong>.`)}
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:linear-gradient(135deg,${SUCCESS}18,${SUCCESS}10);border:1px solid ${SUCCESS}40;border-radius:14px;padding:20px 40px;">
        <p style="margin:0;font-size:13px;color:${SUCCESS};font-weight:600;text-transform:uppercase;letter-spacing:1px;">Amount Refunded</p>
        <p style="margin:8px 0 0;font-size:36px;font-weight:900;color:${SUCCESS};">${refundAmount} ${currency}</p>
      </div>
    </div>
    ${infoTable(
      infoRow('Booking ref', bookingRef) +
      infoRow('Property', propertyTitle) +
      infoRow('Refund method', badge('InstaPay', SUCCESS)) +
      infoRow('Status', badge('Completed', SUCCESS))
    )}
    ${paragraph('The funds should appear in your InstaPay account immediately. If you do not see them within 24 hours, please contact our support team.')}
    ${btn('📅 View My Trips', tripsUrl, SUCCESS)}
  `);
}

// ─── Template: InstaPay Refund Pending (Guest — manual refund acknowledgment) ──
export function tplInstapayRefundPending(
  guestName: string,
  propertyTitle: string,
  refundAmount: string,
  currency: string,
  bookingRef: string,
  tripsUrl: string,
): string {
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">⏳</span>
    </div>
    ${heading('Your refund is being arranged')}
    ${subHeading('Manual InstaPay refund in progress')}
    ${paragraph(`Hi <strong>${guestName}</strong>, your booking at <strong>${propertyTitle}</strong> has been cancelled and a refund is being processed manually by our team.`)}
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:${BG};border:2px solid ${WARNING};border-radius:14px;padding:20px 40px;">
        <p style="margin:0;font-size:13px;color:${MUTED};font-weight:600;text-transform:uppercase;letter-spacing:1px;">Refund Amount</p>
        <p style="margin:8px 0 0;font-size:36px;font-weight:900;color:${WARNING};">${refundAmount} ${currency}</p>
      </div>
    </div>
    ${infoTable(
      infoRow('Booking ref', bookingRef) +
      infoRow('Property', propertyTitle) +
      infoRow('Refund method', badge('InstaPay', WARNING)) +
      infoRow('Processing time', '2–3 business days')
    )}
    ${paragraph('Our team will process the InstaPay transfer to your registered account within 2–3 business days. You will receive a confirmation once the transfer is complete.')}
    ${btn('📅 View My Trips', tripsUrl, WARNING)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">If you have questions, contact our support team via the in-app messaging system.</span>`)}
  `);
}

// ─── Template: Co-host / Cleaner Invitation ───────────────────────────────────
export function tplCohostInvite(
  inviteeName: string,
  hostName: string,
  propertyTitle: string,
  role: 'co_host' | 'cleaner',
  invitesUrl: string,
): string {
  const roleLabel = role === 'cleaner' ? 'Cleaner' : 'Co-host';
  const roleDesc = role === 'cleaner'
    ? 'As a cleaner, you will receive turnover notifications to help prepare the unit between guest stays.'
    : 'As a co-host, you will have access to manage bookings, reply to guests, and help maintain the listing.';
  return layout(`
    ${heading(`You've been invited as a ${roleLabel}`)}
    ${subHeading(`${hostName} wants you to help manage a listing`)}
    ${paragraph(`Hi <strong>${inviteeName}</strong>, you have received an invitation to join the team for the listing below.`)}
    ${infoTable(
      infoRow('Property', propertyTitle) +
      infoRow('Host', hostName) +
      infoRow('Your role', badge(roleLabel, role === 'cleaner' ? '#0d9488' : '#4f46e5')),
    )}
    ${paragraph(roleDesc)}
    ${btn('✅ View Invitation', invitesUrl)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">You can accept or decline this invitation from your account. If you did not expect this, you can safely ignore it.</span>`)}
  `);
}

// ─── Template: Consultation Booking Request (to consultant) ──────────────────
export function tplConsultationRequestReceived(
  consultantName: string,
  clientName: string,
  serviceName: string,
  scheduledAt: string,
  durationMinutes: number,
  payout: string,
  currency: string,
  dashboardUrl: string,
): string {
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">📋</span>
    </div>
    ${heading('New consultation request!')}
    ${subHeading('A client wants to book a session with you')}
    ${paragraph(`Hi <strong>${consultantName}</strong>, <strong>${clientName}</strong> has requested a consultation session. Please review and respond within 24 hours.`)}
    ${infoTable(
      infoRow('Client', clientName) +
      infoRow('Service', serviceName) +
      infoRow('Scheduled', scheduledAt) +
      infoRow('Duration', `${durationMinutes} minutes`) +
      infoRow('Your payout', `${payout} ${currency}`) +
      infoRow('Status', badge('Pending Review', WARNING))
    )}
    ${btn('✅ Accept or Decline', dashboardUrl, SUCCESS)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">Respond within 24 hours to maintain your response rate.</span>`)}
  `);
}

// ─── Template: Consultation Booking Submitted (to client) ────────────────────
export function tplConsultationRequestSubmitted(
  clientName: string,
  consultantName: string,
  serviceName: string,
  scheduledAt: string,
  durationMinutes: number,
  totalAmount: string,
  currency: string,
  bookingsUrl: string,
): string {
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">🎓</span>
    </div>
    ${heading('Consultation request submitted!')}
    ${subHeading('Waiting for the consultant to confirm')}
    ${paragraph(`Hi <strong>${clientName}</strong>, your request has been sent to <strong>${consultantName}</strong>. You will be notified once they respond.`)}
    ${infoTable(
      infoRow('Consultant', consultantName) +
      infoRow('Service', serviceName) +
      infoRow('Scheduled', scheduledAt) +
      infoRow('Duration', `${durationMinutes} minutes`) +
      infoRow('Total', `${totalAmount} ${currency}`) +
      infoRow('Status', badge('Pending Confirmation', WARNING))
    )}
    ${btn('📅 View My Bookings', bookingsUrl)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">You will receive an email once the consultant accepts or declines your request.</span>`)}
  `);
}

// ─── Template: Consultation Confirmed (to client) ────────────────────────────
export function tplConsultationConfirmed(
  clientName: string,
  consultantName: string,
  serviceName: string,
  scheduledAt: string,
  durationMinutes: number,
  totalAmount: string,
  currency: string,
  meetingLink: string | null,
  bookingsUrl: string,
): string {
  const meetingSection = meetingLink
    ? `${paragraph(`Your session link is ready:`)}
       ${btn('🎥 Join Session', meetingLink, '#0d9488')}`
    : `${paragraph(`<span style="color:${MUTED};">The consultant will share a meeting link before the session.</span>`)}`;

  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">🎉</span>
    </div>
    ${heading('Your consultation is confirmed!')}
    ${subHeading(`Session with ${consultantName}`)}
    ${paragraph(`Hi <strong>${clientName}</strong>, your consultation session has been confirmed. Here are your details:`)}
    ${infoTable(
      infoRow('Consultant', consultantName) +
      infoRow('Service', serviceName) +
      infoRow('Scheduled', scheduledAt) +
      infoRow('Duration', `${durationMinutes} minutes`) +
      infoRow('Total paid', `${totalAmount} ${currency}`) +
      infoRow('Status', badge('Confirmed', SUCCESS))
    )}
    ${meetingSection}
    ${btn('📅 View My Bookings', bookingsUrl)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">Please be ready a few minutes before the session. If you need to reschedule, contact the consultant directly.</span>`)}
  `);
}

// ─── Template: Consultation Declined (to client) ─────────────────────────────
export function tplConsultationDeclined(
  clientName: string,
  consultantName: string,
  serviceName: string,
  scheduledAt: string,
  reason: string | null,
  bookingsUrl: string,
): string {
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">❌</span>
    </div>
    ${heading('Consultation request declined')}
    ${subHeading(`${consultantName} was unable to accept your request`)}
    ${paragraph(`Hi <strong>${clientName}</strong>, unfortunately your consultation request was not accepted.`)}
    ${infoTable(
      infoRow('Consultant', consultantName) +
      infoRow('Service', serviceName) +
      infoRow('Scheduled', scheduledAt) +
      (reason ? infoRow('Reason', reason) : '') +
      infoRow('Status', badge('Declined', DANGER))
    )}
    ${btn('🔍 Browse Other Consultants', bookingsUrl)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">No payment has been charged. You can book with another consultant at any time.</span>`)}
  `);
}

// ─── Template: Consultation Session Reminder (to both) ───────────────────────
export function tplConsultationReminder(
  userName: string,
  role: 'client' | 'consultant',
  otherName: string,
  serviceName: string,
  scheduledAt: string,
  durationMinutes: number,
  meetingLink: string | null,
  sessionUrl: string,
): string {
  const roleNote = role === 'client'
    ? `Your consultation with <strong>${otherName}</strong> is in 24 hours.`
    : `You have a consultation session with <strong>${otherName}</strong> in 24 hours.`;

  const meetingSection = meetingLink
    ? `${btn('🎥 Join Session', meetingLink, '#0d9488')}`
    : `${paragraph(`<span style="color:${MUTED};">A meeting link will be shared before the session if not already provided.</span>`)}`;

  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">⏰</span>
    </div>
    ${heading('Reminder: Session tomorrow')}
    ${subHeading('Make sure you are ready')}
    ${paragraph(`Hi <strong>${userName}</strong>, ${roleNote}`)}
    ${infoTable(
      infoRow(role === 'client' ? 'Consultant' : 'Client', otherName) +
      infoRow('Service', serviceName) +
      infoRow('Scheduled', scheduledAt) +
      infoRow('Duration', `${durationMinutes} minutes`)
    )}
    ${meetingSection}
    ${btn('📅 View Details', sessionUrl)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">Please be on time. If you need to cancel, do so as early as possible out of respect for the other party.</span>`)}
  `);
}

// ─── Template: Consultation Completed + Review Prompt (to client) ─────────────
export function tplConsultationCompleted(
  clientName: string,
  consultantName: string,
  serviceName: string,
  payout: string,
  currency: string,
  reviewUrl: string,
): string {
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">✅</span>
    </div>
    ${heading('Session completed!')}
    ${subHeading(`How was your session with ${consultantName}?`)}
    ${paragraph(`Hi <strong>${clientName}</strong>, your consultation session is now complete. We hope it was valuable!`)}
    ${infoTable(
      infoRow('Consultant', consultantName) +
      infoRow('Service', serviceName) +
      infoRow('Total charged', `${payout} ${currency}`) +
      infoRow('Status', badge('Completed', SUCCESS))
    )}
    ${paragraph('Your feedback helps other hosts find the right consultant. It only takes 30 seconds!')}
    ${btn('⭐ Leave a Review', reviewUrl, WARNING)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">Thank you for using Oikivo's consultation marketplace. We hope to see you grow your property income!</span>`)}
  `);
}

// ─── Template: Consultation InstaPay Payment Instructions ─────────────────────
export function tplConsultationInstapayPending(
  clientName: string,
  consultantName: string,
  serviceName: string,
  scheduledAt: string,
  totalAmount: string,
  currency: string,
  instapayPhone: string,
  instapayName: string,
  bookingRef: string,
  bookingsUrl: string,
): string {
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">💳</span>
    </div>
    ${heading('Complete your payment via InstaPay')}
    ${subHeading(`Booking reference: ${badge(bookingRef)}`)}
    ${paragraph(`Hi <strong>${clientName}</strong>, your consultation session is reserved — please complete payment via InstaPay within <strong>24 hours</strong> to confirm your booking.`)}
    ${infoTable(
      infoRow('Consultant', consultantName) +
      infoRow('Service', serviceName) +
      infoRow('Scheduled', scheduledAt) +
      infoRow('Amount to pay', `<strong style="color:#16a34a;">${totalAmount} ${currency}</strong>`) +
      infoRow('Booking Ref', `<strong>${bookingRef}</strong>`)
    )}
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;border:2px solid #fde047;border-radius:12px;padding:16px;margin:20px 0;">
      <tr><td>
        <p style="margin:0 0 8px;font-weight:700;font-size:14px;color:#92400e;">📱 InstaPay Transfer Details</p>
        <p style="margin:0 0 4px;font-size:14px;color:#78350f;">Phone: <strong>${instapayPhone}</strong></p>
        <p style="margin:0 0 4px;font-size:14px;color:#78350f;">Name: <strong>${instapayName}</strong></p>
        <p style="margin:0;font-size:13px;color:#a16207;">Include <strong>${bookingRef}</strong> as the transfer note</p>
      </td></tr>
    </table>
    ${paragraph('Once you transfer the amount, upload your InstaPay receipt in-app to confirm your booking.')}
    ${btn('📤 Upload Receipt', bookingsUrl)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">Booking will be automatically released if payment is not received within 24 hours. For help, contact support.</span>`)}
  `);
}

// ─── Template: Host-cancelled — rebooking invite (H12) ────────────────────────
export function tplHostCancelledRebooking(
  guestName: string,
  propertyTitle: string,
  checkIn: string,
  checkOut: string,
  bookingRef: string,
  propertyUrl: string,
): string {
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">🏠</span>
    </div>
    ${heading('Your booking was cancelled by the host')}
    ${subHeading(`Reference: ${badge(bookingRef, DANGER)}`)}
    ${paragraph(`Hi <strong>${guestName}</strong>, unfortunately the host had to cancel your upcoming stay. We're sorry for the inconvenience.`)}
    ${infoTable(
      infoRow('Property', propertyTitle) +
      infoRow('Check-in', checkIn) +
      infoRow('Check-out', checkOut) +
      infoRow('Status', badge('Cancelled by host', DANGER))
    )}
    ${paragraph('The good news: this property may have availability on other dates. Click below to explore alternatives.')}
    ${btn('🔍 Find alternative dates', propertyUrl)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">Any eligible refund will be processed automatically. Contact us via in-app messaging for questions.</span>`)}
  `);
}

// ─── Template: Consultant suspended — client notification (H15) ───────────────
export function tplConsultantSuspendedClientNotice(
  clientName: string,
  consultantDisplayName: string,
  scheduledAt: string,
  bookingRef: string,
  browsUrl: string,
): string {
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">⚠️</span>
    </div>
    ${heading('Your consultation booking has been cancelled')}
    ${subHeading(`Reference: ${badge(bookingRef, WARNING)}`)}
    ${paragraph(`Hi <strong>${clientName}</strong>, we regret to inform you that <strong>${consultantDisplayName}</strong>'s account has been suspended. As a result, your upcoming session has been automatically cancelled.`)}
    ${infoTable(
      infoRow('Consultant', consultantDisplayName) +
      infoRow('Scheduled', scheduledAt) +
      infoRow('Booking Ref', bookingRef) +
      infoRow('Status', badge('Cancelled — refund pending', WARNING))
    )}
    ${paragraph('A full refund will be processed for any amount paid. You can browse our other verified consultants and rebook.')}
    ${btn('🔍 Browse consultants', browsUrl)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">We apologise for the inconvenience. Please contact support if you have questions.</span>`)}
  `);
}

// ─── Template: Pre-Arrival Reminder (BUG-GL1 fix) ────────────────────────────
export function tplPreArrivalReminder(
  guestName: string,
  propertyTitle: string,
  checkIn: string,
  checkOut: string,
  checkInTime: string,
  hostName: string,
  hostPhone: string | null,
  checkInInstructions: string | null,
  address: string,
  bookingRef: string,
  tripsUrl: string,
): string {
  const instructionsSection = checkInInstructions
    ? `${infoTable(infoRow('Check-in Instructions', checkInInstructions))}`
    : '';

  const hostContactSection = hostPhone
    ? `${infoTable(infoRow('Host Contact', `${hostName} — ${hostPhone}`))}`
    : `${infoTable(infoRow('Host', hostName))}`;

  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">🏡</span>
    </div>
    ${heading('Your stay is coming up!')}
    ${subHeading(`Check-in: ${checkIn} at ${checkInTime}`)}
    ${paragraph(`Hi <strong>${guestName}</strong>, your reservation at <strong>${propertyTitle}</strong> is just around the corner. Here's everything you need to know.`)}
    ${infoTable(
      infoRow('Property', propertyTitle) +
      infoRow('Check-in', `${checkIn} after ${checkInTime}`) +
      infoRow('Check-out', checkOut) +
      infoRow('Address', address) +
      infoRow('Booking Ref', badge(bookingRef, PRIMARY))
    )}
    ${hostContactSection}
    ${instructionsSection}
    ${btn('📋 View Trip Details', tripsUrl, SUCCESS)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">Have a wonderful stay! If you encounter any issues, contact your host or reach out to support.</span>`)}
  `);
}


// ─── Template: Consultant application approved/rejected (C9) ─────────────────
export function tplConsultantApplicationDecision(
  firstName: string,
  decision: 'approved' | 'rejected' | 'suspended',
  rejectionReason: string | null,
  dashboardUrl: string,
  applyUrl: string,
): string {
  const approved = decision === 'approved';
  const suspended = decision === 'suspended';
  const emoji = approved ? '🎉' : '😔';
  const title = approved
    ? 'Your consultant application is approved!'
    : suspended
    ? 'Your consultant account has been suspended'
    : 'Your consultant application was not approved';

  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">${emoji}</span>
    </div>
    ${heading(title)}
    ${paragraph(
      approved
        ? `Hi <strong>${firstName}</strong>, great news! Your consultant application on Oikivo has been reviewed and <strong>approved</strong>. You can now set up your availability, add services, and start accepting consultation bookings.`
        : suspended
        ? `Hi <strong>${firstName}</strong>, your consultant account has been <strong>suspended</strong>. All pending bookings have been cancelled and clients have been notified.${rejectionReason ? ` <br><br><strong>Reason:</strong> ${rejectionReason}` : ''}`
        : `Hi <strong>${firstName}</strong>, thank you for applying to become a consultant on Oikivo. After reviewing your application, we were unable to approve it at this time.${rejectionReason ? ` <br><br><strong>Reason:</strong> ${rejectionReason}` : ''}`,
    )}
    ${approved
      ? `${btn('🚀 Go to your dashboard', dashboardUrl)}`
      : !suspended
      ? `${paragraph('You are welcome to update your profile and reapply once the concerns above have been addressed.')}${btn('🔄 Update & reapply', applyUrl)}`
      : ''
    }
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">If you believe this decision was an error, please contact our support team.</span>`)}
  `);
}

// ─── Template: Consultation payment received (C10) ───────────────────────────
export function tplConsultationPaymentReceived(
  consultantName: string,
  clientName: string,
  sessionLabel: string,
  scheduledAt: string,
  amount: string,
  currency: string,
  bookingRef: string,
  dashboardUrl: string,
): string {
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">💰</span>
    </div>
    ${heading('Payment received for your consultation')}
    ${paragraph(`Hi <strong>${consultantName}</strong>, great news! Payment has been confirmed for your upcoming session with <strong>${clientName}</strong>.`)}
    ${infoTable(
      infoRow('Client', clientName) +
      infoRow('Session', sessionLabel) +
      infoRow('Scheduled', scheduledAt) +
      infoRow('Booking Ref', `#${bookingRef}`) +
      infoRow('Your Payout', badge(`${amount} ${currency}`, SUCCESS))
    )}
    ${paragraph('Your payout will be held for 48 hours after session completion and then becomes available for withdrawal.')}
    ${btn('📊 View your dashboard', dashboardUrl)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">Reminder: this booking is now confirmed. Please ensure you are available at the scheduled time.</span>`)}
  `);
}

// ─── Template: Consultant now approved — client notification (C11) ────────────
export function tplConsultantApprovedClientNotice(
  clientName: string,
  consultantDisplayName: string,
  consultantUrl: string,
): string {
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">✅</span>
    </div>
    ${heading('A consultant you\'re interested in is now available!')}
    ${paragraph(`Hi <strong>${clientName}</strong>, we wanted to let you know that <strong>${consultantDisplayName}</strong>, whose services you previously engaged with, has been verified and approved on Oikivo. You can now book a consultation with them.`)}
    ${btn('📅 Book a consultation', consultantUrl)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">You are receiving this because you had a previous interaction with this consultant.</span>`)}
  `);
}

// ─── Template: Consultant payout processed (C12) ─────────────────────────────
export function tplConsultantPayoutProcessed(
  consultantName: string,
  amount: string,
  currency: string,
  method: string,
  status: 'completed' | 'failed',
  note: string | null,
  dashboardUrl: string,
): string {
  const success = status === 'completed';
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">${success ? '💸' : '⚠️'}</span>
    </div>
    ${heading(success ? 'Your payout has been processed!' : 'Payout processing failed')}
    ${paragraph(
      success
        ? `Hi <strong>${consultantName}</strong>, your payout of <strong>${amount} ${currency}</strong> via <strong>${method}</strong> has been processed successfully.`
        : `Hi <strong>${consultantName}</strong>, unfortunately your payout request of <strong>${amount} ${currency}</strong> could not be processed.${note ? ` Reason: ${note}` : ''}`,
    )}
    ${infoTable(
      infoRow('Amount', `${amount} ${currency}`) +
      infoRow('Method', method) +
      infoRow('Status', badge(success ? 'Completed' : 'Failed', success ? SUCCESS : DANGER))
    )}
    ${success
      ? paragraph('Funds should appear in your account within 1–2 business days depending on your payment method.')
      : paragraph('Please log in to your dashboard to review your payout details and try again or contact support.')}
    ${btn('📊 View your dashboard', dashboardUrl)}
  `);
}

// ─── Mailer ───────────────────────────────────────────────────────────────────
@Injectable()
export class MailService {
  constructor(private config: ConfigService) {}

  private createTransporter() {
    const smtpUser = this.config.get<string>('SMTP_USER') ?? this.config.get<string>('EMAIL_USER');
    const smtpPass = this.config.get<string>('SMTP_PASS') ?? this.config.get<string>('EMAIL_PASS');
    const smtpHost = this.config.get<string>('SMTP_HOST') ?? (smtpUser ? 'smtp.gmail.com' : undefined);
    const smtpPort = Number(this.config.get<string>('SMTP_PORT', '587'));

    return { smtpHost, smtpUser, smtpPass, smtpPort };
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    const { smtpHost, smtpUser, smtpPass, smtpPort } = this.createTransporter();
    const from = this.config.get<string>('SMTP_FROM', `Oikivo <${smtpUser || 'no-reply@oikivo.com'}>`);
    const isDev = this.config.get('NODE_ENV', 'development') === 'development';

    if (!smtpHost || !smtpUser || !smtpPass) {
      if (isDev) {
        console.warn(`[DEV] Email not sent (SMTP unconfigured): ${subject} → ${to}`);
        return;
      }
      throw new BadRequestException('Email service not configured.');
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost, port: smtpPort, secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const info = await transporter.sendMail({ from, to, subject, html });
    console.log(`[MAIL] Sent "${subject}" → ${to} (messageId: ${info.messageId})`);
  }

  async sendAdminBlast(to: string, firstName: string, subject: string, htmlBody: string): Promise<void> {
    const html = layout(`
      ${heading(subject)}
      ${paragraph(`Hi <strong>${firstName}</strong>,`)}
      ${paragraph(htmlBody)}
      ${divider()}
      <p style="margin:0;font-size:12px;color:${MUTED};text-align:center;">
        This message was sent by the Oikivo admin team. If you believe this was sent in error, please contact support.
      </p>
    `);
    await this.send(to, subject, html);
  }
}
