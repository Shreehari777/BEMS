import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema(
  {
    number: { type: String, required: true },
    driverName: { type: String, required: true },
    createdBy: { type: String, default: '' },
  },
  { timestamps: true }
);

VehicleSchema.index({ createdBy: 1, number: 1 });

export default mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);
