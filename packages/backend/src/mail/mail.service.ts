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
const LOGO_URL = (process.env.FRONTEND_URL?.split(',')?.[0]?.trim() ?? 'https://oikivo.com') + '/logo.png';

// ─── Security: HTML-escape user-controlled content to prevent XSS ─────────────
function htmlEscape(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Only allow http/https URLs; rejects javascript: and other dangerous schemes. */
function safeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return '#';
}

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
  const fn = htmlEscape(firstName);
  const url = safeUrl(verifyUrl);
  return layout(`
    ${heading('Verify your email address')}
    ${subHeading('One quick step to get started')}
    ${paragraph(`Hi <strong>${fn}</strong>, welcome to Oikivo! Please confirm your email address to activate your account and start exploring unique stays.`)}
    ${btn('✅ Verify Email', url)}
    ${divider()}
    <p style="margin:0;font-size:13px;color:${MUTED};text-align:center;">
      Link expires in <strong>24 hours</strong>. Or copy this URL:<br/>
      <a href="${url}" style="color:${PRIMARY};font-size:11px;word-break:break-all;">${htmlEscape(verifyUrl)}</a>
    </p>
  `);
}

// ─── Template: Password Reset ──────────────────────────────────────────────────
export function tplPasswordReset(firstName: string, resetUrl: string): string {
  const fn = htmlEscape(firstName);
  const url = safeUrl(resetUrl);
  return layout(`
    ${heading('Reset your password')}
    ${subHeading('We received a request to reset your password')}
    ${paragraph(`Hi <strong>${fn}</strong>, click the button below to choose a new password. This link expires in <strong>1 hour</strong>.`)}
    ${btn('🔑 Reset Password', url, ROSE)}
    ${divider()}
    <p style="margin:0;font-size:13px;color:${MUTED};text-align:center;">
      If you didn't request a password reset, you can safely ignore this email.
    </p>
  `);
}

// ─── Template: Welcome after registration ─────────────────────────────────────
export function tplWelcome(firstName: string, loginUrl: string): string {
  const fn = htmlEscape(firstName);
  const url = safeUrl(loginUrl);
  return layout(`
    ${heading(`Welcome to Oikivo, ${fn}! 🎉`)}
    ${subHeading('Your account is ready')}
    ${paragraph(`Your email has been verified and your Oikivo account is now fully active. Start exploring thousands of unique homes and experiences across the Middle East and beyond.`)}
    ${btn('🏠 Explore Stays', url)}
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
  const fn = htmlEscape(firstName);
  const ph = htmlEscape(phone);
  const cd = htmlEscape(code);
  return layout(`
    ${heading('Phone verification code')}
    ${subHeading(`To verify ${ph}`)}
    ${paragraph(`Hi <strong>${fn}</strong>, use the code below to verify your phone number.`)}
    <div style="text-align:center;margin:28px 0;">
      <div style="display:inline-block;background:${BG};border:2px dashed ${PRIMARY};border-radius:14px;padding:20px 40px;">
        <span style="font-size:40px;font-weight:800;letter-spacing:10px;font-family:monospace;color:${PRIMARY};">${cd}</span>
      </div>
    </div>
    ${paragraph(`<span style="color:${MUTED};font-size:13px;">Expires in <strong>10 minutes</strong>. Do not share this code with anyone.</span>`)}
  `);
}

// ─── Template: Confirm Email Change ───────────────────────────────────────────
export function tplConfirmEmailChange(firstName: string, newEmail: string, confirmUrl: string): string {
  const fn = htmlEscape(firstName);
  const em = htmlEscape(newEmail);
  const url = safeUrl(confirmUrl);
  return layout(`
    ${heading('Confirm your new email')}
    ${subHeading('Action required')}
    ${paragraph(`Hi <strong>${fn}</strong>, you requested to change your email address to <strong>${em}</strong>.`)}
    ${paragraph('Click the button below to confirm this change:')}
    ${btn('📧 Confirm Email Change', url)}
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
  const gn = htmlEscape(guestName);
  const pt = htmlEscape(propertyTitle);
  const br = htmlEscape(bookingRef);
  const url = safeUrl(tripsUrl);
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">🎉</span>
    </div>
    ${heading('Your booking is confirmed!')}
    ${subHeading(`Booking reference: ${badge(br)}`)}
    ${paragraph(`Hi <strong>${gn}</strong>, your stay at <strong>${pt}</strong> has been confirmed. Here are your booking details:`)}
    ${infoTable(
      infoRow('Property', pt) +
      infoRow('Check-in', checkIn) +
      infoRow('Check-out', checkOut) +
      infoRow('Guests', String(guests)) +
      infoRow('Total paid', `${totalAmount} ${currency}`) +
      infoRow('Status', badge('Confirmed', SUCCESS))
    )}
    ${btn('📅 View My Trips', url)}
    ${currencyNote(currency)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">Please contact your host directly for check-in instructions. Have a wonderful stay!</span>`)}
  `);
}

// ─── Template: Booking Accepted — Please Pay (Request-to-Book / Instant-Book) ─
export function tplBookingAccepted(
  guestName: string,
  propertyTitle: string,
  checkIn: string,
  checkOut: string,
  guests: number,
  totalAmount: string,
  currency: string,
  bookingRef: string,
  paymentUrl: string,
): string {
  const gn = htmlEscape(guestName);
  const pt = htmlEscape(propertyTitle);
  const br = htmlEscape(bookingRef);
  const url = safeUrl(paymentUrl);
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">🎉</span>
    </div>
    ${heading('Your booking has been confirmed!')}
    ${subHeading('Complete your payment to lock in your stay')}
    ${paragraph(`Hi <strong>${gn}</strong>, great news — your booking at <strong>${pt}</strong> has been confirmed. Please complete your payment within <strong>24 hours</strong> to secure your reservation.`)}
    ${infoTable(
      infoRow('Property', pt) +
      infoRow('Check-in', checkIn) +
      infoRow('Check-out', checkOut) +
      infoRow('Guests', String(guests)) +
      infoRow('Total due', `${totalAmount} ${currency}`) +
      infoRow('Booking ref', br) +
      infoRow('Status', badge('Awaiting Payment', WARNING))
    )}
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin:20px 0;">
      <p style="margin:0;font-size:13px;color:#92400e;">⚠️ <strong>Important:</strong> Your reservation will be automatically cancelled if payment is not received within 24 hours of this confirmation.</p>
    </div>
    ${btn('💳 Pay Now', url)}
    ${currencyNote(currency)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">You can pay via OPay or InstaPay from your Trips page. If you have any questions, please message your host directly.</span>`)}
  `);
}

// ─── Template: Payment Reminder (sent 4 h after host confirms, if still unpaid) ─
export function tplPaymentReminder(
  guestName: string,
  propertyTitle: string,
  checkIn: string,
  bookingRef: string,
  totalAmount: string,
  currency: string,
  paymentUrl: string,
): string {
  const gn = htmlEscape(guestName);
  const pt = htmlEscape(propertyTitle);
  const br = htmlEscape(bookingRef);
  const url = safeUrl(paymentUrl);
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">⏰</span>
    </div>
    ${heading('Reminder: Complete your payment')}
    ${subHeading('Your reservation is awaiting payment')}
    ${paragraph(`Hi <strong>${gn}</strong>, this is a friendly reminder that your confirmed booking at <strong>${pt}</strong> (check-in: ${checkIn}) is still awaiting payment.`)}
    ${infoTable(
      infoRow('Property', pt) +
      infoRow('Check-in', checkIn) +
      infoRow('Booking ref', br) +
      infoRow('Total due', `${totalAmount} ${currency}`) +
      infoRow('Status', badge('Payment Required', WARNING))
    )}
    <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:10px;padding:14px 18px;margin:20px 0;">
      <p style="margin:0;font-size:13px;color:#9f1239;">🚨 <strong>Action required:</strong> If payment is not completed within 20 hours, your booking will be automatically cancelled and the dates released.</p>
    </div>
    ${btn('💳 Pay Now', url, DANGER)}
    ${currencyNote(currency)}
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
  const hn = htmlEscape(hostName);
  const gn = htmlEscape(guestName);
  const pt = htmlEscape(propertyTitle);
  const sr = specialRequests ? htmlEscape(specialRequests) : undefined;
  const url = safeUrl(reservationsUrl);
  const specialRequestsRow = sr
    ? infoRow('Special Requests', sr)
    : '';

  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">🏠</span>
    </div>
    ${heading('New booking request!')}
    ${subHeading('A guest wants to stay at your property')}
    ${paragraph(`Hi <strong>${hn}</strong>, <strong>${gn}</strong> has requested a booking at <strong>${pt}</strong>. Review and respond within 24 hours.`)}
    ${infoTable(
      infoRow('Guest', gn) +
      infoRow('Property', pt) +
      infoRow('Check-in', checkIn) +
      infoRow('Check-out', checkOut) +
      infoRow('Guests', String(guests)) +
      specialRequestsRow +
      infoRow('Payout', `${totalAmount} ${currency}`) +
      infoRow('Status', badge('Pending Review', WARNING))
    )}
    ${btn('✅ Review Booking', url, SUCCESS)}
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
  const un = htmlEscape(userName);
  const pt = htmlEscape(propertyTitle);
  const br = htmlEscape(bookingRef);
  const roleNote = role === 'guest'
    ? (refundAmount ? `A refund of <strong>${refundAmount} ${refundCurrency}</strong> will be processed within 5–10 business days.` : 'No refund applies based on the cancellation policy.')
    : 'The reservation has been cancelled. The guest has been notified.';

  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">❌</span>
    </div>
    ${heading('Booking Cancelled')}
    ${subHeading(`Reference: ${badge(br, DANGER)}`)}
    ${paragraph(`Hi <strong>${un}</strong>, the following booking has been cancelled:`)}
    ${infoTable(
      infoRow('Property', pt) +
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
  const gn = htmlEscape(guestName);
  const pt = htmlEscape(propertyTitle);
  const br = htmlEscape(bookingRef);
  const url = safeUrl(tripsUrl);
  return layout(`
    <!-- Invoice header -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td>
          <p style="margin:0;font-size:20px;font-weight:800;color:${TEXT};">Invoice</p>
          <p style="margin:4px 0 0;font-size:13px;color:${MUTED};">Ref: <strong>${br}</strong></p>
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

    ${paragraph(`Billed to: <strong>${gn}</strong>`)}

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
            ${pt}<br/>
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

    ${btn('📋 View My Trips', url)}
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
  const hn = htmlEscape(hostName);
  const pt = htmlEscape(propertyTitle);
  const url = safeUrl(earningsUrl);
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">💸</span>
    </div>
    ${heading('Payment sent to your account!')}
    ${subHeading('Your payout is on the way')}
    ${paragraph(`Hi <strong>${hn}</strong>, a payout has been initiated for a completed stay at <strong>${pt}</strong>.`)}
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:linear-gradient(135deg,${SUCCESS}18,${SUCCESS}10);border:1px solid ${SUCCESS}40;border-radius:14px;padding:20px 40px;">
        <p style="margin:0;font-size:13px;color:${SUCCESS};font-weight:600;text-transform:uppercase;letter-spacing:1px;">Payout Amount</p>
        <p style="margin:8px 0 0;font-size:36px;font-weight:900;color:${SUCCESS};">${amount} ${currency}</p>
        <p style="margin:4px 0 0;font-size:12px;color:${MUTED};">Ref: ${payoutRef}</p>
      </div>
    </div>
    ${infoTable(
      infoRow('Property', pt) +
      infoRow('Stay dates', `${checkIn} → ${checkOut}`) +
      infoRow('Payout date', payoutDate) +
      infoRow('Status', badge('Sent', SUCCESS))
    )}
    ${btn('💰 View Earnings', url, SUCCESS)}
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
  const gn = htmlEscape(guestName);
  const pt = htmlEscape(propertyTitle);
  const br = htmlEscape(bookingRef);
  const url = safeUrl(tripsUrl);
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">💳</span>
    </div>
    ${heading('Your refund is being processed')}
    ${subHeading('We\'re sorry to see you go')}
    ${paragraph(`Hi <strong>${gn}</strong>, a refund has been initiated for your cancelled booking at <strong>${pt}</strong>.`)}
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:${BG};border:2px solid ${PRIMARY};border-radius:14px;padding:20px 40px;">
        <p style="margin:0;font-size:13px;color:${MUTED};font-weight:600;text-transform:uppercase;letter-spacing:1px;">Refund Amount</p>
        <p style="margin:8px 0 0;font-size:36px;font-weight:900;color:${PRIMARY};">${refundAmount} ${currency}</p>
      </div>
    </div>
    ${infoTable(
      infoRow('Booking ref', br) +
      infoRow('Property', pt) +
      infoRow('Refund initiated', refundDate) +
      infoRow('Refund to', paymentMethod) +
      infoRow('Processing time', '5–10 business days')
    )}
    ${btn('📅 View My Trips', url)}
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
  const rn = htmlEscape(recipientName);
  const sn = htmlEscape(senderName);
  const pv = htmlEscape(preview);
  const url = safeUrl(inboxUrl);
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">💬</span>
    </div>
    ${heading('You have a new message')}
    ${subHeading(`From ${sn}`)}
    ${paragraph(`Hi <strong>${rn}</strong>, <strong>${sn}</strong> sent you a message:`)}
    <blockquote style="margin:0 0 20px;padding:16px 20px;background:${BG};border-left:4px solid ${PRIMARY};border-radius:0 10px 10px 0;font-size:14px;color:${TEXT};font-style:italic;">${pv}</blockquote>
    ${btn('💬 Reply in Inbox', url)}
  `);
}

// ─── Template: Host Activation (became a host) ────────────────────────────────
export function tplHostActivation(
  hostName: string,
  dashboardUrl: string,
): string {
  const hn = htmlEscape(hostName);
  const url = safeUrl(dashboardUrl);
  return layout(`
    ${heading(`You're now a Host, ${hn}! 🏠`)}
    ${subHeading('Your host account is active')}
    ${paragraph(`Welcome to the Oikivo host community! Your account is now fully activated. Start listing your properties and connecting with guests today.`)}
    ${infoTable(
      infoRow('Commission', badge('0% — Keep 100%', SUCCESS)) +
      infoRow('Payouts', 'Within 24 hours of check-in') +
      infoRow('Host Protection', 'Up to $1M coverage')
    )}
    ${btn('🏠 Go to Your Dashboard', url)}
    ${divider()}
    <p style="margin:0;font-size:13px;color:${MUTED};text-align:center;">
      Need help getting started? Contact us at <a href="mailto:oikivo.support@gmail.com" style="color:${PRIMARY};">oikivo.support@gmail.com</a>
    </p>
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
  const gn = htmlEscape(guestName);
  const pt = htmlEscape(propertyTitle);
  const br = htmlEscape(bookingRef);
  const url = safeUrl(tripsUrl);
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">✅</span>
    </div>
    ${heading('Payment Confirmed!')}
    ${subHeading('Your InstaPay transfer has been verified')}
    ${paragraph(`Hi <strong>${gn}</strong>, great news! Your InstaPay payment for the following booking has been verified and confirmed by our team.`)}
    ${infoTable(
      infoRow('Booking ref', br) +
      infoRow('Property', pt) +
      infoRow('Check-in', checkIn) +
      infoRow('Check-out', checkOut) +
      infoRow('Total paid', `${totalAmount} ${currency}`) +
      infoRow('Payment method', badge('InstaPay', SUCCESS)) +
      infoRow('Status', badge('Confirmed', SUCCESS))
    )}
    ${paragraph('Your stay is fully booked and confirmed. We look forward to welcoming you!')}
    ${btn('📅 View My Trips', url, SUCCESS)}
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
  const gn = htmlEscape(guestName);
  const br = htmlEscape(bookingRef);
  const pt = htmlEscape(propertyTitle);
  const url = safeUrl(tripsUrl);
  const reasonNote = reason
    ? `<blockquote style="margin:0 0 16px;padding:12px 16px;background:#fef2f2;border-left:4px solid ${DANGER};border-radius:0 8px 8px 0;font-size:14px;color:${DANGER};">${htmlEscape(reason)}</blockquote>`
    : '';
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">⚠️</span>
    </div>
    ${heading('Payment Could Not Be Verified')}
    ${subHeading('Action required — please retry your payment')}
    ${paragraph(`Hi <strong>${gn}</strong>, unfortunately our team was unable to verify your InstaPay payment for booking <strong>${br}</strong> at <strong>${pt}</strong>.`)}
    ${reasonNote}
    ${paragraph('Your booking is still reserved. Please go to My Trips and try again — you can submit a new InstaPay reference or pay by card.')}
    ${btn('🔄 Retry Payment', url, WARNING)}
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
  const gn = htmlEscape(guestName);
  const pt = htmlEscape(propertyTitle);
  const br = htmlEscape(bookingRef);
  const url = safeUrl(tripsUrl);
  const policyNote: Record<string, string> = {
    flexible: 'Full refund if cancelled within 48 hours of booking.',
    moderate: 'Full refund if cancelled 5 days before check-in.',
    strict: 'No refund within 48 hours of check-in.',
  };
  const policyText = `<strong>Cancellation policy (${htmlEscape(cancellationPolicy)}):</strong> ${policyNote[cancellationPolicy] ?? 'See cancellation terms on the property page.'}`;
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">📬</span>
    </div>
    ${heading('Booking request sent!')}
    ${subHeading('Awaiting host confirmation')}
    ${paragraph(`Hi <strong>${gn}</strong>, your booking request for <strong>${pt}</strong> has been received. The host will confirm shortly — you'll be notified by email and in-app.`)}
    ${infoTable(
      infoRow('Property', pt) +
      infoRow('Check-in', checkIn) +
      infoRow('Check-out', checkOut) +
      infoRow('Guests', String(guests)) +
      infoRow('Total amount', `${totalAmount} ${currency}`) +
      infoRow('Booking ref', br) +
      infoRow('Status', badge('Pending confirmation', WARNING))
    )}
    ${divider()}
    <p style="margin:0 0 16px;font-size:13px;color:${MUTED};">
      ${policyText}
    </p>
    ${btn('📅 View My Trips', url)}
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
  const hn = htmlEscape(hostName);
  const ad = htmlEscape(accountDetails);
  const url = safeUrl(earningsUrl);
  const methodLabel = method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">✅</span>
    </div>
    ${heading('Your payout has been processed!')}
    ${subHeading('The funds have been transferred to your account')}
    ${paragraph(`Hi <strong>${hn}</strong>, your payout request has been approved and the funds have been sent to your account.`)}
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:linear-gradient(135deg,${SUCCESS}18,${SUCCESS}10);border:1px solid ${SUCCESS}40;border-radius:14px;padding:20px 40px;">
        <p style="margin:0;font-size:13px;color:${SUCCESS};font-weight:600;text-transform:uppercase;letter-spacing:1px;">Amount Transferred</p>
        <p style="margin:8px 0 0;font-size:36px;font-weight:900;color:${SUCCESS};">${amount} ${currency}</p>
        <p style="margin:4px 0 0;font-size:12px;color:${MUTED};">Ref: ${payoutRef}</p>
      </div>
    </div>
    ${infoTable(
      infoRow('Transfer method', methodLabel) +
      infoRow('Account / handle', ad) +
      infoRow('Processed on', processedAt) +
      infoRow('Status', badge('Completed', SUCCESS))
    )}
    ${btn('💰 View Earnings', url, SUCCESS)}
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
  const gn = htmlEscape(guestName);
  const pt = htmlEscape(propertyTitle);
  const br = htmlEscape(bookingRef);
  const url = safeUrl(tripsUrl);
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">✅</span>
    </div>
    ${heading('Your InstaPay refund has been sent!')}
    ${subHeading('The transfer is complete')}
    ${paragraph(`Hi <strong>${gn}</strong>, great news! Our team has completed the manual InstaPay refund for your cancelled booking at <strong>${pt}</strong>.`)}
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:linear-gradient(135deg,${SUCCESS}18,${SUCCESS}10);border:1px solid ${SUCCESS}40;border-radius:14px;padding:20px 40px;">
        <p style="margin:0;font-size:13px;color:${SUCCESS};font-weight:600;text-transform:uppercase;letter-spacing:1px;">Amount Refunded</p>
        <p style="margin:8px 0 0;font-size:36px;font-weight:900;color:${SUCCESS};">${refundAmount} ${currency}</p>
      </div>
    </div>
    ${infoTable(
      infoRow('Booking ref', br) +
      infoRow('Property', pt) +
      infoRow('Refund method', badge('InstaPay', SUCCESS)) +
      infoRow('Status', badge('Completed', SUCCESS))
    )}
    ${paragraph('The funds should appear in your InstaPay account immediately. If you do not see them within 24 hours, please contact our support team.')}
    ${btn('📅 View My Trips', url, SUCCESS)}
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
  const gn = htmlEscape(guestName);
  const pt = htmlEscape(propertyTitle);
  const br = htmlEscape(bookingRef);
  const url = safeUrl(tripsUrl);
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">⏳</span>
    </div>
    ${heading('Your refund is being arranged')}
    ${subHeading('Manual InstaPay refund in progress')}
    ${paragraph(`Hi <strong>${gn}</strong>, your booking at <strong>${pt}</strong> has been cancelled and a refund is being processed manually by our team.`)}
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:${BG};border:2px solid ${WARNING};border-radius:14px;padding:20px 40px;">
        <p style="margin:0;font-size:13px;color:${MUTED};font-weight:600;text-transform:uppercase;letter-spacing:1px;">Refund Amount</p>
        <p style="margin:8px 0 0;font-size:36px;font-weight:900;color:${WARNING};">${refundAmount} ${currency}</p>
      </div>
    </div>
    ${infoTable(
      infoRow('Booking ref', br) +
      infoRow('Property', pt) +
      infoRow('Refund method', badge('InstaPay', WARNING)) +
      infoRow('Processing time', '2–3 business days')
    )}
    ${paragraph('Our team will process the InstaPay transfer to your registered account within 2–3 business days. You will receive a confirmation once the transfer is complete.')}
    ${btn('📅 View My Trips', url, WARNING)}
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
  const ie = htmlEscape(inviteeName);
  const hn = htmlEscape(hostName);
  const pt = htmlEscape(propertyTitle);
  const url = safeUrl(invitesUrl);
  const roleLabel = role === 'cleaner' ? 'Cleaner' : 'Co-host';
  const roleDesc = role === 'cleaner'
    ? 'As a cleaner, you will receive turnover notifications to help prepare the unit between guest stays.'
    : 'As a co-host, you will have access to manage bookings, reply to guests, and help maintain the listing.';
  return layout(`
    ${heading(`You've been invited as a ${roleLabel}`)}
    ${subHeading(`${hn} wants you to help manage a listing`)}
    ${paragraph(`Hi <strong>${ie}</strong>, you have received an invitation to join the team for the listing below.`)}
    ${infoTable(
      infoRow('Property', pt) +
      infoRow('Host', hn) +
      infoRow('Your role', badge(roleLabel, role === 'cleaner' ? '#0d9488' : '#4f46e5')),
    )}
    ${paragraph(roleDesc)}
    ${btn('✅ View Invitation', url)}
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
  const cn = htmlEscape(consultantName);
  const cl = htmlEscape(clientName);
  const sn = htmlEscape(serviceName);
  const url = safeUrl(dashboardUrl);
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">📋</span>
    </div>
    ${heading('New consultation request!')}
    ${subHeading('A client wants to book a session with you')}
    ${paragraph(`Hi <strong>${cn}</strong>, <strong>${cl}</strong> has requested a consultation session. Please review and respond within 24 hours.`)}
    ${infoTable(
      infoRow('Client', cl) +
      infoRow('Service', sn) +
      infoRow('Scheduled', scheduledAt) +
      infoRow('Duration', `${durationMinutes} minutes`) +
      infoRow('Your payout', `${payout} ${currency}`) +
      infoRow('Status', badge('Pending Review', WARNING))
    )}
    ${btn('✅ Accept or Decline', url, SUCCESS)}
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
  const cl = htmlEscape(clientName);
  const cn = htmlEscape(consultantName);
  const sn = htmlEscape(serviceName);
  const url = safeUrl(bookingsUrl);
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">🎓</span>
    </div>
    ${heading('Consultation request submitted!')}
    ${subHeading('Waiting for the consultant to confirm')}
    ${paragraph(`Hi <strong>${cl}</strong>, your request has been sent to <strong>${cn}</strong>. You will be notified once they respond.`)}
    ${infoTable(
      infoRow('Consultant', cn) +
      infoRow('Service', sn) +
      infoRow('Scheduled', scheduledAt) +
      infoRow('Duration', `${durationMinutes} minutes`) +
      infoRow('Total', `${totalAmount} ${currency}`) +
      infoRow('Status', badge('Pending Confirmation', WARNING))
    )}
    ${btn('📅 View My Bookings', url)}
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
  const cl = htmlEscape(clientName);
  const cn = htmlEscape(consultantName);
  const sn = htmlEscape(serviceName);
  const url = safeUrl(bookingsUrl);
  const meetingSection = meetingLink
    ? `${paragraph(`Your session link is ready:`)}
       ${btn('🎥 Join Session', safeUrl(meetingLink), '#0d9488')}`
    : `${paragraph(`<span style="color:${MUTED};">The consultant will share a meeting link before the session.</span>`)}`;

  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">🎉</span>
    </div>
    ${heading('Your consultation is confirmed!')}
    ${subHeading(`Session with ${cn}`)}
    ${paragraph(`Hi <strong>${cl}</strong>, your consultation session has been confirmed. Here are your details:`)}
    ${infoTable(
      infoRow('Consultant', cn) +
      infoRow('Service', sn) +
      infoRow('Scheduled', scheduledAt) +
      infoRow('Duration', `${durationMinutes} minutes`) +
      infoRow('Total paid', `${totalAmount} ${currency}`) +
      infoRow('Status', badge('Confirmed', SUCCESS))
    )}
    ${meetingSection}
    ${btn('📅 View My Bookings', url)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">Please be ready a few minutes before the session. If you need to reschedule, contact the consultant directly.</span>`)}
  `);
}

// ─────────────────────────────────────────────────────────────────────────────
export function tplConsultationDeclined(
  clientName: string,
  consultantName: string,
  serviceName: string,
  scheduledAt: string,
  reason: string | null,
  bookingsUrl: string,
): string {
  const cl = htmlEscape(clientName);
  const cn = htmlEscape(consultantName);
  const sn = htmlEscape(serviceName);
  const url = safeUrl(bookingsUrl);
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">❌</span>
    </div>
    ${heading('Consultation request declined')}
    ${subHeading(`${cn} was unable to accept your request`)}
    ${paragraph(`Hi <strong>${cl}</strong>, unfortunately your consultation request was not accepted.`)}
    ${infoTable(
      infoRow('Consultant', cn) +
      infoRow('Service', sn) +
      infoRow('Scheduled', scheduledAt) +
      (reason ? infoRow('Reason', htmlEscape(reason)) : '') +
      infoRow('Status', badge('Declined', DANGER))
    )}
    ${btn('🔍 Browse Other Consultants', url)}
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
  const un = htmlEscape(userName);
  const on = htmlEscape(otherName);
  const sn = htmlEscape(serviceName);
  const url = safeUrl(sessionUrl);
  const roleNote = role === 'client'
    ? `Your consultation with <strong>${on}</strong> is in 24 hours.`
    : `You have a consultation session with <strong>${on}</strong> in 24 hours.`;

  const meetingSection = meetingLink
    ? `${btn('🎥 Join Session', safeUrl(meetingLink), '#0d9488')}`
    : `${paragraph(`<span style="color:${MUTED};">A meeting link will be shared before the session if not already provided.</span>`)}`;

  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">⏰</span>
    </div>
    ${heading('Reminder: Session tomorrow')}
    ${subHeading('Make sure you are ready')}
    ${paragraph(`Hi <strong>${un}</strong>, ${roleNote}`)}
    ${infoTable(
      infoRow(role === 'client' ? 'Consultant' : 'Client', on) +
      infoRow('Service', sn) +
      infoRow('Scheduled', scheduledAt) +
      infoRow('Duration', `${durationMinutes} minutes`)
    )}
    ${meetingSection}
    ${btn('📅 View Details', url)}
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
  const cl = htmlEscape(clientName);
  const cn = htmlEscape(consultantName);
  const sn = htmlEscape(serviceName);
  const url = safeUrl(reviewUrl);
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">✅</span>
    </div>
    ${heading('Session completed!')}
    ${subHeading(`How was your session with ${cn}?`)}
    ${paragraph(`Hi <strong>${cl}</strong>, your consultation session is now complete. We hope it was valuable!`)}
    ${infoTable(
      infoRow('Consultant', cn) +
      infoRow('Service', sn) +
      infoRow('Total charged', `${payout} ${currency}`) +
      infoRow('Status', badge('Completed', SUCCESS))
    )}
    ${paragraph('Your feedback helps other hosts find the right consultant. It only takes 30 seconds!')}
    ${btn('⭐ Leave a Review', url, WARNING)}
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
  const cl = htmlEscape(clientName);
  const cn = htmlEscape(consultantName);
  const sn = htmlEscape(serviceName);
  const ip = htmlEscape(instapayPhone);
  const iname = htmlEscape(instapayName);
  const br = htmlEscape(bookingRef);
  const url = safeUrl(bookingsUrl);
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">💳</span>
    </div>
    ${heading('Complete your payment via InstaPay')}
    ${subHeading(`Booking reference: ${badge(br)}`)}
    ${paragraph(`Hi <strong>${cl}</strong>, your consultation session is reserved — please complete payment via InstaPay within <strong>24 hours</strong> to confirm your booking.`)}
    ${infoTable(
      infoRow('Consultant', cn) +
      infoRow('Service', sn) +
      infoRow('Scheduled', scheduledAt) +
      infoRow('Amount to pay', `<strong style="color:#16a34a;">${totalAmount} ${currency}</strong>`) +
      infoRow('Booking Ref', `<strong>${br}</strong>`)
    )}
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;border:2px solid #fde047;border-radius:12px;padding:16px;margin:20px 0;">
      <tr><td>
        <p style="margin:0 0 8px;font-weight:700;font-size:14px;color:#92400e;">📱 InstaPay Transfer Details</p>
        <p style="margin:0 0 4px;font-size:14px;color:#78350f;">Phone: <strong>${ip}</strong></p>
        <p style="margin:0 0 4px;font-size:14px;color:#78350f;">Name: <strong>${iname}</strong></p>
        <p style="margin:0;font-size:13px;color:#a16207;">Include <strong>${br}</strong> as the transfer note</p>
      </td></tr>
    </table>
    ${paragraph('Once you transfer the amount, upload your InstaPay receipt in-app to confirm your booking.')}
    ${btn('📤 Upload Receipt', url)}
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
  const gn = htmlEscape(guestName);
  const pt = htmlEscape(propertyTitle);
  const br = htmlEscape(bookingRef);
  const url = safeUrl(propertyUrl);
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">🏠</span>
    </div>
    ${heading('Your booking was cancelled by the host')}
    ${subHeading(`Reference: ${badge(br, DANGER)}`)}
    ${paragraph(`Hi <strong>${gn}</strong>, unfortunately the host had to cancel your upcoming stay. We're sorry for the inconvenience.`)}
    ${infoTable(
      infoRow('Property', pt) +
      infoRow('Check-in', checkIn) +
      infoRow('Check-out', checkOut) +
      infoRow('Status', badge('Cancelled by host', DANGER))
    )}
    ${paragraph('The good news: this property may have availability on other dates. Click below to explore alternatives.')}
    ${btn('🔍 Find alternative dates', url)}
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
  const cl = htmlEscape(clientName);
  const cd = htmlEscape(consultantDisplayName);
  const br = htmlEscape(bookingRef);
  const url = safeUrl(browsUrl);
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">⚠️</span>
    </div>
    ${heading('Your consultation booking has been cancelled')}
    ${subHeading(`Reference: ${badge(br, WARNING)}`)}
    ${paragraph(`Hi <strong>${cl}</strong>, we regret to inform you that <strong>${cd}</strong>'s account has been suspended. As a result, your upcoming session has been automatically cancelled.`)}
    ${infoTable(
      infoRow('Consultant', cd) +
      infoRow('Scheduled', scheduledAt) +
      infoRow('Booking Ref', br) +
      infoRow('Status', badge('Cancelled — refund pending', WARNING))
    )}
    ${paragraph('A full refund will be processed for any amount paid. You can browse our other verified consultants and rebook.')}
    ${btn('🔍 Browse consultants', url)}
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

// ─── Template: Monthly Earnings Summary (HW7) ────────────────────────────────
export function tplMonthlyEarningsSummary(
  hostName: string,
  month: string,
  totalEarnings: string,
  currency: string,
  totalBookings: number,
  totalPaid: string,
  totalPending: string,
  earningsUrl: string,
): string {
  return layout(`
    ${heading(`Your ${month} Earnings Summary`)}
    ${subHeading(`Here's how your properties performed, ${hostName}.`)}
    ${infoTable(
      infoRow('Month', month) +
      infoRow('Total Earnings', `${totalEarnings} ${currency}`) +
      infoRow('Completed Bookings', String(totalBookings)) +
      infoRow('Paid Out', badge(`${totalPaid} ${currency}`, SUCCESS)) +
      infoRow('Pending', badge(`${totalPending} ${currency}`, WARNING))
    )}
    ${paragraph('Keep up the great work! Respond quickly and keep your listing updated to maximize your bookings.')}
    ${btn('📊 View Earnings Dashboard', earningsUrl)}
    ${divider()}
    ${currencyNote(currency)}
  `);
}

// ─── Template: Host Activation Request (link-based) ──────────────────────────
export function tplHostActivationRequest(firstName: string, isArabic: boolean, activationUrl: string): string {
  if (isArabic) {
    return layout(`
      ${heading('تفعيل حساب الاستضافة')}
      ${subHeading('خطوة سريعة لبدء الاستضافة على Oikivo')}
      ${paragraph(`مرحباً <strong>${firstName}</strong>، اضغط على الزر أدناه لتفعيل حساب الاستضافة والبدء بإنشاء إعلانك.`)}
      ${btn('🏠 تفعيل الاستضافة', activationUrl)}
      ${divider()}
      <p style="margin:0;font-size:13px;color:${MUTED};text-align:center;">
        إذا لم تطلب هذا الإجراء، يمكنك تجاهل هذه الرسالة.
      </p>
    `);
  }
  return layout(`
    ${heading('Activate your hosting account')}
    ${subHeading('One quick step to start listing your property on Oikivo')}
    ${paragraph(`Hi <strong>${firstName}</strong>, click the button below to activate hosting and start creating your listing.`)}
    ${btn('🏠 Activate Hosting', activationUrl)}
    ${divider()}
    <p style="margin:0;font-size:13px;color:${MUTED};text-align:center;">
      If you did not request this, you can safely ignore this email.
    </p>
  `);
}

// ─── Admin: Property submitted for review ────────────────────────────────────
export function tplAdminPropertyPendingReview(
  propertyTitle: string,
  hostName: string,
  hostEmail: string,
  adminUrl: string,
): string {
  return layout(`
    ${heading('New Listing Submitted for Review')}
    ${paragraph('A host has submitted a property listing and it is now awaiting your review.')}
    ${infoTable(
      infoRow('Property', htmlEscape(propertyTitle)) +
      infoRow('Host', htmlEscape(hostName)) +
      infoRow('Host Email', htmlEscape(hostEmail))
    )}
    ${btn('Review in Admin Panel', safeUrl(adminUrl))}
    ${divider()}
    ${paragraph('Please log in to the admin panel to approve or reject this listing.')}
  `);
}

// ─── Admin: InstaPay proof submitted — action required ───────────────────────
export function tplAdminInstapaySubmitted(
  guestName: string,
  guestEmail: string,
  bookingRef: string,
  propertyTitle: string,
  checkIn: string,
  checkOut: string,
  totalAmount: string,
  currency: string,
  reference: string,
  proofUrl: string | null | undefined,
  deadlineHours: number,
  adminBookingsUrl: string,
): string {
  const gn = htmlEscape(guestName);
  const ge = htmlEscape(guestEmail);
  const br = htmlEscape(bookingRef);
  const pt = htmlEscape(propertyTitle);
  const ref = htmlEscape(reference);
  const url = safeUrl(adminBookingsUrl);
  const proofLink = proofUrl
    ? `<a href="${safeUrl(proofUrl)}" style="color:${PRIMARY};">View proof image</a>`
    : '<span style="color:#94a3b8;">No image uploaded</span>';
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">🔔</span>
    </div>
    ${heading('InstaPay Payment — Action Required')}
    ${subHeading('A guest has submitted an InstaPay transfer proof')}
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin:0 0 20px;">
      <p style="margin:0;font-size:14px;color:#92400e;font-weight:600;">⏰ You have ${deadlineHours} hours to accept or decline this payment before it is auto-declined.</p>
    </div>
    ${infoTable(
      infoRow('Booking ref', br) +
      infoRow('Guest', `${gn} &lt;${ge}&gt;`) +
      infoRow('Property', pt) +
      infoRow('Check-in', checkIn) +
      infoRow('Check-out', checkOut) +
      infoRow('Total', `${totalAmount} ${htmlEscape(currency)}`) +
      infoRow('InstaPay ref', ref) +
      infoRow('Proof', proofLink) +
      infoRow('Payment status', badge('Submitted — Pending Verification', WARNING))
    )}
    ${btn('✅ Review in Admin Panel', url, PRIMARY)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${MUTED};">If no action is taken within ${deadlineHours} hours, the payment will be automatically declined and the booking cancelled.</span>`)}
  `);
}

// ─── Admin: ID document submitted ────────────────────────────────────────────
export function tplAdminIdDocumentPending(
  hostName: string,
  hostEmail: string,
  adminUrl: string,
): string {
  return layout(`
    ${heading('New ID Verification Request')}
    ${paragraph('A host has submitted their ID document and is awaiting verification.')}
    ${infoTable(
      infoRow('Host', htmlEscape(hostName)) +
      infoRow('Email', htmlEscape(hostEmail))
    )}
    ${btn('Review in Admin Panel', safeUrl(adminUrl))}
    ${divider()}
    ${paragraph('Please log in to the admin panel to approve or reject the ID document.')}
  `);
}

// ─── Admin: Account Suspended ────────────────────────────────────────────────
export function tplAccountSuspended(
  firstName: string,
  reason: string,
  supportUrl: string,
): string {
  const fn = htmlEscape(firstName);
  const re = htmlEscape(reason);
  const url = safeUrl(supportUrl);
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">⚠️</span>
    </div>
    ${heading('Your account has been suspended')}
    ${subHeading('Action taken by the Oikivo moderation team')}
    ${paragraph(`Hi <strong>${fn}</strong>, your Oikivo account has been temporarily suspended by our moderation team. Access to your account has been restricted.`)}
    ${infoTable(
      infoRow('Status', badge('Suspended', DANGER)) +
      infoRow('Reason', re)
    )}
    <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:10px;padding:16px 18px;margin:20px 0;">
      <p style="margin:0;font-size:14px;color:#9f1239;line-height:1.6;">If you believe this suspension was made in error or you have questions, please contact our support team. We are committed to reviewing all appeals fairly and promptly.</p>
    </div>
    ${btn('Contact Support', url, DANGER)}
    ${divider()}
    <p style="margin:0;font-size:13px;color:${MUTED};text-align:center;">
      This action was taken in accordance with Oikivo's <a href="#" style="color:${PRIMARY};">Terms of Service</a>. Appeals must be submitted within 30 days.
    </p>
  `);
}

// ─── Admin: Account Banned ────────────────────────────────────────────────────
export function tplAccountBanned(
  firstName: string,
  reason: string,
  supportUrl: string,
): string {
  const fn = htmlEscape(firstName);
  const re = htmlEscape(reason);
  const url = safeUrl(supportUrl);
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">🚫</span>
    </div>
    ${heading('Your account has been permanently banned')}
    ${subHeading('Action taken by the Oikivo moderation team')}
    ${paragraph(`Hi <strong>${fn}</strong>, your Oikivo account has been permanently banned due to a serious violation of our Terms of Service. All active listings, bookings, and sessions have been deactivated.`)}
    ${infoTable(
      infoRow('Status', badge('Permanently Banned', DANGER)) +
      infoRow('Reason', re)
    )}
    <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:10px;padding:16px 18px;margin:20px 0;">
      <p style="margin:0;font-size:14px;color:#9f1239;line-height:1.6;">This ban is permanent. If you believe this action was taken in error, you may contact our support team to submit a formal appeal. All appeals are reviewed by senior staff.</p>
    </div>
    ${btn('Submit an Appeal', url, DANGER)}
    ${divider()}
    <p style="margin:0;font-size:13px;color:${MUTED};text-align:center;">
      Oikivo reserves the right to permanently terminate accounts that violate our community standards. See our <a href="#" style="color:${PRIMARY};">Terms of Service</a> for more details.
    </p>
  `);
}

// ─── Admin: Account Deleted ───────────────────────────────────────────────────
export function tplAccountDeleted(
  firstName: string,
  reason: string,
  supportUrl: string,
): string {
  const fn = htmlEscape(firstName);
  const re = htmlEscape(reason);
  const url = safeUrl(supportUrl);
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">👋</span>
    </div>
    ${heading('Your Oikivo account has been deleted')}
    ${subHeading("We\u2019re sorry to see you go")}
    ${paragraph(`Hi <strong>${fn}</strong>, we want to let you know that your Oikivo account has been permanently deleted by our moderation team. All your data, listings, and bookings have been removed from our platform.`)}
    ${infoTable(
      infoRow('Status', badge('Account Deleted', DANGER)) +
      infoRow('Reason', re),
    )}
    <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:10px;padding:16px 18px;margin:20px 0;">
      <p style="margin:0;font-size:14px;color:#9f1239;line-height:1.6;">If you believe this was done in error or have any questions, please reach out to our support team. We take every case seriously and are happy to review your situation.</p>
    </div>
    ${btn('Contact Support', url, DANGER)}
    ${divider()}
    <p style="margin:0;font-size:13px;color:${MUTED};text-align:center;">
      This action was taken in accordance with Oikivo's <a href="#" style="color:${PRIMARY};">Terms of Service</a>.
    </p>
  `);
}

// ─── Admin: ID Verification Approved ─────────────────────────────────────────
export function tplIdVerificationApproved(firstName: string, dashboardUrl: string): string {
  const fn = htmlEscape(firstName);
  const url = safeUrl(dashboardUrl);
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">✅</span>
    </div>
    ${heading('Your identity has been verified!')}
    ${subHeading('Welcome to the verified community')}
    ${paragraph(`Hi <strong>${fn}</strong>, great news! Our team has reviewed your submitted ID document and your identity is now <strong>verified</strong>.`)}
    ${infoTable(infoRow('Verification Status', badge('Approved', SUCCESS)))}
    ${paragraph('You now have full access to all platform features — you can book properties and create listings without any restrictions.')}
    ${btn('Go to Dashboard', url)}
    ${divider()}
    <p style="margin:0;font-size:13px;color:${MUTED};text-align:center;">
      Thank you for helping us keep Oikivo safe and trustworthy for everyone.
    </p>
  `);
}

// ─── Admin: ID Verification Rejected ─────────────────────────────────────────
export function tplIdVerificationRejected(firstName: string, reason: string | null, resubmitUrl: string): string {
  const fn = htmlEscape(firstName);
  const re = reason
    ? htmlEscape(reason)
    : 'The document could not be verified. Please ensure it is clear, unobstructed, and valid.';
  const url = safeUrl(resubmitUrl);
  return layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">❌</span>
    </div>
    ${heading('ID verification was not approved')}
    ${subHeading('Action required — please resubmit')}
    ${paragraph(`Hi <strong>${fn}</strong>, unfortunately we could not verify your identity based on the submitted document.`)}
    ${infoTable(
      infoRow('Verification Status', badge('Rejected', DANGER)) +
      infoRow('Reason', re),
    )}
    <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:10px;padding:16px 18px;margin:20px 0;">
      <p style="margin:0;font-size:14px;color:#9f1239;line-height:1.6;">
        Please upload a new, clear photo of your government-issued ID. For a National ID include both <strong>front and back</strong>; for a Passport include the main photo page. Make sure the document is fully visible, not blurry, and not expired.
      </p>
    </div>
    ${btn('Resubmit ID Document', url)}
    ${divider()}
    <p style="margin:0;font-size:13px;color:${MUTED};text-align:center;">
      If you have questions, please contact our support team. We are here to help.
    </p>
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

// ─── UX-08 / P1-07: Post-checkout review request ─────────────────────────────
export function tplReviewRequest(
  firstName: string,
  propertyTitle: string,
  bookingRef: string,
  reviewUrl: string,
): string {
  return layout(`
    ${heading('How was your stay?')}
    ${paragraph(`Hi <strong>${firstName}</strong>,`)}
    ${paragraph(`Your stay at <strong>${propertyTitle}</strong> is now complete. We'd love to hear about your experience!`)}
    ${paragraph('Honest reviews help other guests make informed decisions and help hosts improve their listings. It only takes a minute.')}
    ${infoTable(
      infoRow('Booking', bookingRef) +
      infoRow('Property', propertyTitle)
    )}
    ${btn('Leave a Review', reviewUrl)}
    ${divider()}
    ${paragraph('Reviews can be submitted within 14 days of check-out. Thank you for staying with Oikivo!')}
  `);
}
