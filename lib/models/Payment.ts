import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    planId: { type: String, required: true },
    planName: { type: String, default: '' },
    amount: { type: Number, required: true },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
  },
  { timestamps: true }
);

if (mongoose.models.Payment) delete mongoose.models.Payment;
export default mongoose.model('Payment', PaymentSchema);
