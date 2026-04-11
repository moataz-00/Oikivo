import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');

@Injectable()
export class InvoiceService {
  async generateInvoice(booking: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const currency = booking.currency ?? 'EGP';
      const fmt = (n: number) => `${currency} ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

      // Header
      doc.fontSize(22).font('Helvetica-Bold').text('Oikivo', 50, 50);
      doc.fontSize(10).font('Helvetica').fillColor('#666666')
        .text('Booking Invoice', 50, 78);

      // Invoice meta
      doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
      doc.text(`Invoice #${booking.bookingRef || booking.id}`, 350, 50, { align: 'right' });
      doc.font('Helvetica').fontSize(9).fillColor('#666666');
      doc.text(`Date: ${new Date(booking.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 350, 66, { align: 'right' });
      doc.text(`Status: ${(booking.paymentStatus ?? booking.status ?? '').toUpperCase()}`, 350, 80, { align: 'right' });

      // Divider
      doc.moveTo(50, 105).lineTo(545, 105).strokeColor('#E5E7EB').stroke();

      // Property info
      let y = 120;
      doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold');
      doc.text('Property', 50, y);
      y += 18;
      doc.fontSize(10).font('Helvetica').fillColor('#333333');
      doc.text(booking.property?.title ?? 'N/A', 50, y);
      y += 14;
      doc.fontSize(9).fillColor('#666666');
      const addr = [booking.property?.city, booking.property?.governorate].filter(Boolean).join(', ');
      if (addr) { doc.text(addr, 50, y); y += 14; }

      // Guest info
      y += 6;
      doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold');
      doc.text('Guest', 50, y);
      y += 18;
      doc.fontSize(10).font('Helvetica').fillColor('#333333');
      const guestName = booking.guest ? `${booking.guest.firstName ?? ''} ${booking.guest.lastName ?? ''}`.trim() : 'N/A';
      doc.text(guestName, 50, y);
      y += 14;
      if (booking.guest?.email) { doc.fontSize(9).fillColor('#666666').text(booking.guest.email, 50, y); y += 14; }

      // Booking details
      y += 10;
      doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold');
      doc.text('Booking Details', 50, y);
      y += 18;
      doc.fontSize(10).font('Helvetica').fillColor('#333333');
      doc.text(`Check-in: ${booking.checkIn}`, 50, y); y += 14;
      doc.text(`Check-out: ${booking.checkOut}`, 50, y); y += 14;
      doc.text(`Guests: ${booking.guestsCount ?? 1}`, 50, y); y += 14;
      if (booking.paymentMethod) {
        doc.text(`Payment Method: ${booking.paymentMethod}`, 50, y); y += 14;
      }

      // Price breakdown
      y += 10;
      doc.moveTo(50, y).lineTo(545, y).strokeColor('#E5E7EB').stroke();
      y += 12;
      doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold');
      doc.text('Price Breakdown', 50, y);
      y += 20;

      const rows: [string, string][] = [];
      if (booking.baseAmount) rows.push(['Accommodation', fmt(booking.baseAmount)]);
      if (booking.cleaningFee && Number(booking.cleaningFee) > 0) rows.push(['Cleaning Fee', fmt(booking.cleaningFee)]);
      if (booking.serviceFee && Number(booking.serviceFee) > 0) rows.push(['Service Fee', fmt(booking.serviceFee)]);
      if (booking.depositAmount && Number(booking.depositAmount) > 0) rows.push(['Security Deposit', fmt(booking.depositAmount)]);
      if (booking.discountAmount && Number(booking.discountAmount) > 0) rows.push(['Discount', `- ${fmt(booking.discountAmount)}`]);

      doc.fontSize(10).font('Helvetica');
      for (const [label, val] of rows) {
        doc.fillColor('#333333').text(label, 50, y);
        doc.text(val, 350, y, { align: 'right' });
        y += 16;
      }

      // Total
      y += 4;
      doc.moveTo(50, y).lineTo(545, y).strokeColor('#E5E7EB').stroke();
      y += 10;
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000');
      doc.text('Total', 50, y);
      doc.text(fmt(booking.totalAmount), 350, y, { align: 'right' });

      // Refund line
      if (booking.cancellationRefundAmount && Number(booking.cancellationRefundAmount) > 0) {
        y += 20;
        doc.fontSize(10).font('Helvetica').fillColor('#DC2626');
        doc.text('Refund', 50, y);
        doc.text(fmt(booking.cancellationRefundAmount), 350, y, { align: 'right' });
      }

      // Footer
      doc.fontSize(8).font('Helvetica').fillColor('#999999');
      doc.text('This is a computer-generated invoice. Thank you for choosing Oikivo.', 50, 750, { align: 'center', width: 495 });

      doc.end();
    });
  }
}
