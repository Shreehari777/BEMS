import mongoose from 'mongoose';

const BatchReportSchema = new mongoose.Schema(
  {
    docketNumber: { type: Number, required: true },
    customerName: { type: String, required: true },
    site: { type: String, required: true },
    vehicleNumber: { type: String, required: true },
    driverName: { type: String, required: true },
    grade: { type: String, required: true },
    quantity: { type: Number, required: true }, // Production quantity
    startTime: { type: String, required: true },
    stopTime: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    createdBy: { type: String, default: '' },
    orderNumber: { type: String, default: '' },
    batcherName: { type: String, default: 'Stetter' },
    orderedQuantity: { type: Number, default: 0 },
    adjManualQuantity: { type: Number, default: 0 },
    withThisLoad: { type: Number, default: 0 },
    mixerCapacity: { type: Number, default: 0.5 },
    batchSize: { type: Number, default: 0.5 },
    rate: { type: Number, default: 0 },
    cumulativeQuantity: { type: String, default: '' },
    dcPump: { type: Boolean, default: false },
    dcManual: { type: Boolean, default: false },
    dcBatchSheet: { type: Boolean, default: false },
    dcArrivalTime: { type: String, default: '' },
    dcDepartTime: { type: String, default: '' },
    companyName: { type: String, default: 'MATRIX INFRA RMC' },
    companyTagline: { type: String, default: 'Suppliers : All Types of Ready Mix Concrete' },
    companyAddress: { type: String, default: 'Office : A/p, Kharpudi (B), Khed City Road, Mandawala, Tal. Khed, Dist. Pune - 410505.' },
    companyMobile: { type: String, default: 'Mob.: 9325714072 | 9405818311' },
    batches: [{
      stone10mm: Number,
      stone20mm: Number,
      sand: Number,
      sand1: Number,
      cem1: Number,
      cem2: Number,
      ggbs: Number,
      flyAsh: Number,
      water: Number,
      watIce: Number,
      silica: Number,
      adm1: Number,
      adm2: Number,
      moisture: { type: Number, default: 0 }
    }],
    targets: {
      stone10mm: Number,
      stone20mm: Number,
      sand: Number,
      sand1: Number,
      cem1: Number,
      cem2: Number,
      ggbs: Number,
      flyAsh: Number,
      water: Number,
      watIce: Number,
      silica: Number,
      adm1: Number,
      adm2: Number,
      moisture: Number
    },
    // Total Set Weight = target × numBatches (simple planned weight)
    setWeights: {
      stone10mm: Number,
      stone20mm: Number,
      sand: Number,
      sand1: Number,
      cem1: Number,
      cem2: Number,
      ggbs: Number,
      flyAsh: Number,
      water: Number,
      watIce: Number,
      silica: Number,
      adm1: Number,
      adm2: Number,
      moisture: Number
    },
    // Total Actual = real sum of batch rows + random DIFF offset
    adjustedActuals: {
      stone10mm: Number,
      stone20mm: Number,
      sand: Number,
      sand1: Number,
      cem1: Number,
      cem2: Number,
      ggbs: Number,
      flyAsh: Number,
      water: Number,
      watIce: Number,
      silica: Number,
      adm1: Number,
      adm2: Number,
      moisture: Number
    }
  },
  { timestamps: true }
);

// Delete cached model to ensure schema changes (like adjustedActuals) are picked up
if (mongoose.models.BatchReport) {
  delete mongoose.models.BatchReport;
}
export default mongoose.model('BatchReport', BatchReportSchema);
