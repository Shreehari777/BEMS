import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    site: { type: String, required: true },
    gstNumber: { type: String, default: '' },
    lastOrderNumber: { type: Number, default: 0 },
    createdBy: { type: String, default: '' },
  },
  { timestamps: true }
);

CustomerSchema.index({ createdBy: 1, name: 1 });

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
