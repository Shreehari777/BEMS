import mongoose from 'mongoose';

const SubscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },           // e.g. "1 Month", "3 Months"
    durationDays: { type: Number, required: true },    // e.g. 30, 90, 180, 365
    price: { type: Number, required: true },           // e.g. 500, 1200, 2000, 3500
    description: { type: String, default: '' },        // e.g. "Best for starters"
    isActive: { type: Boolean, default: true },        // admin can hide a plan
    order: { type: Number, default: 0 },               // display order
  },
  { timestamps: true }
);

if (mongoose.models.SubscriptionPlan) delete mongoose.models.SubscriptionPlan;
export default mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);
