import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    site: { type: String, required: true },
    gstNumber: { type: String, default: '' },
    createdBy: { type: String, default: '' },
  },
  { timestamps: true }
);

if (mongoose.models.Customer) delete mongoose.models.Customer;
export default mongoose.model('Customer', CustomerSchema);
