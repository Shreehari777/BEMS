import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    site: { type: String, required: true },
    createdBy: { type: String, default: '' },
  },
  { timestamps: true }
);

if (mongoose.models.Customer) delete mongoose.models.Customer;
export default mongoose.model('Customer', CustomerSchema);
