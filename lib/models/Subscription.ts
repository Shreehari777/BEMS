import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    planId: { type: String, default: '' },
    planName: { type: String, default: '' },
    status: { type: String, enum: ['trial', 'active', 'expired', 'paused'], default: 'trial' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    trialUsed: { type: Boolean, default: false },
    amount: { type: Number, default: 0 },
    pausedDaysLeft: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ userId: 1, createdAt: -1 });

if (mongoose.models.Subscription) delete mongoose.models.Subscription;
export default mongoose.model('Subscription', SubscriptionSchema);
