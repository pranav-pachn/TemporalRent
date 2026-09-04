export interface ConfirmBookingInput {
  businessId: string;
  bookingId: string;
  userId: string;
  idempotencyKey: string;
}
