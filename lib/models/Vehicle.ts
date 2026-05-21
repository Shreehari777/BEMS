import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema(
  {
    number: { type: String, required: true },
    driverName: { type: String, required: true },
    createdBy: { type: String, default: '' },
  },
  { timestamps: true }
);

if (mongoose.models.Vehicle) delete mongoose.models.Vehicle;
export default mongoose.model('Vehicle', VehicleSchema);
