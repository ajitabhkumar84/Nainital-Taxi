import { BookingState } from '@/store/bookingStore';
import { formatPrice, getVehicleTypeName } from './pricing';

const WHATSAPP_BUSINESS_NUMBER = '8445206116';

/**
 * Generate WhatsApp message for booking request
 */
export function generateWhatsAppMessage(booking: BookingState): string {
  const message = `🚕 NEW BOOKING REQUEST

📦 Package: ${booking.packageTitle || 'Not selected'}
🚗 Vehicle: ${booking.vehicleType ? getVehicleTypeName(booking.vehicleType) : 'Not selected'}
💰 Amount: ${booking.calculatedPrice ? formatPrice(booking.calculatedPrice) : 'Not calculated'}
${booking.seasonName ? `🌟 Season: ${booking.seasonName}` : ''}

📅 Date: ${booking.tripDate ? formatDate(booking.tripDate) : 'Not selected'}
⏰ Time: ${booking.tripTime || 'Not selected'}
👥 Passengers: ${booking.passengerCount}
📍 Pickup: ${booking.pickupLocation || 'Not specified'}
${booking.dropoffLocation ? `📍 Drop-off: ${booking.dropoffLocation}` : ''}

👤 Name: ${booking.customerName || 'Not provided'}
📱 Phone: ${booking.customerPhone || 'Not provided'}
${booking.customerEmail ? `📧 Email: ${booking.customerEmail}` : ''}

${booking.specialRequests ? `📝 Special Requests:\n${booking.specialRequests}\n\n` : ''}
_Payment screenshot will be attached_`;

  return message;
}

/**
 * Generate WhatsApp link with pre-filled message
 */
export function generateWhatsAppLink(booking: BookingState): string {
  const message = generateWhatsAppMessage(booking);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/91${WHATSAPP_BUSINESS_NUMBER}?text=${encodedMessage}`;
}

/**
 * Generate email subject for booking request
 */
export function generateEmailSubject(booking: BookingState): string {
  return `Booking Request - ${booking.packageTitle || 'Nainital Taxi'} - ${booking.tripDate ? formatDate(booking.tripDate) : 'Date TBD'}`;
}

/**
 * Generate email body for booking request
 */
export function generateEmailBody(booking: BookingState): string {
  const body = `Hello Nainital Fun Taxi Team,

I would like to make a booking with the following details:

BOOKING DETAILS:
-----------------
Package: ${booking.packageTitle || 'Not selected'}
Vehicle Type: ${booking.vehicleType ? getVehicleTypeName(booking.vehicleType) : 'Not selected'}
Total Amount: ${booking.calculatedPrice ? formatPrice(booking.calculatedPrice) : 'Not calculated'}
${booking.seasonName ? `Season: ${booking.seasonName}` : ''}

TRIP INFORMATION:
-----------------
Date: ${booking.tripDate ? formatDate(booking.tripDate) : 'Not selected'}
Time: ${booking.tripTime || 'Not selected'}
Number of Passengers: ${booking.passengerCount}
Pickup Location: ${booking.pickupLocation || 'Not specified'}
${booking.dropoffLocation ? `Drop-off Location: ${booking.dropoffLocation}` : ''}

CONTACT INFORMATION:
--------------------
Name: ${booking.customerName || 'Not provided'}
Phone: ${booking.customerPhone || 'Not provided'}
Email: ${booking.customerEmail || 'Not provided'}

${booking.specialRequests ? `SPECIAL REQUESTS:\n${booking.specialRequests}\n\n` : ''}

I will send the payment screenshot separately.

Looking forward to your confirmation.

Best regards,
${booking.customerName || 'Customer'}`;

  return body;
}

/**
 * Generate mailto link with pre-filled email
 */
export function generateEmailLink(booking: BookingState): string {
  const subject = generateEmailSubject(booking);
  const body = generateEmailBody(booking);

  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  // You can replace this with your business email
  const businessEmail = 'bookings@nainitaltaxi.in'; // Update with actual email

  return `mailto:${businessEmail}?subject=${encodedSubject}&body=${encodedBody}`;
}

/**
 * Format date to readable format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long'
  });
}

/**
 * Generate a booking summary text (for display purposes)
 */
export function generateBookingSummary(booking: BookingState): {
  package: string;
  vehicle: string;
  date: string;
  time: string;
  passengers: string;
  pickup: string;
  dropoff: string;
  price: string;
  season: string;
} {
  return {
    package: booking.packageTitle || 'Not selected',
    vehicle: booking.vehicleType ? getVehicleTypeName(booking.vehicleType) : 'Not selected',
    date: booking.tripDate ? formatDate(booking.tripDate) : 'Not selected',
    time: booking.tripTime || 'Not selected',
    passengers: `${booking.passengerCount} ${booking.passengerCount === 1 ? 'person' : 'people'}`,
    pickup: booking.pickupLocation || 'Not specified',
    dropoff: booking.dropoffLocation || 'Not specified',
    price: booking.calculatedPrice ? formatPrice(booking.calculatedPrice) : 'Not calculated',
    season: booking.seasonName || 'Standard'
  };
}
