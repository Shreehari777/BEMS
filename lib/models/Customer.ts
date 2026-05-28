import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    site: { type: String, required: true },
    gstNumber: { type: String, default: '' },
    address: { type: String, default: '' },
    state: { type: String, default: 'MAHARASHTRA' },
    stateCode: { type: String, default: '27' },
    lastOrderNumber: { type: Number, default: 0 },
    createdBy: { type: String, default: '' },
  },
  { timestamps: true }
);

CustomerSchema.index({ createdBy: 1, name: 1 });

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
