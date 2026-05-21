import mongoose from 'mongoose';

const RecipeSchema = new mongoose.Schema(
  {
    grade: { type: String, required: true, unique: true },
    stone10mm: { type: Number, default: 0 },
    stone20mm: { type: Number, default: 0 },
    sand: { type: Number, default: 0 },
    sand1: { type: Number, default: 0 },
    cem1: { type: Number, default: 0 },
    cem2: { type: Number, default: 0 },
    ggbs: { type: Number, default: 0 },
    flyAsh: { type: Number, default: 0 },
    moisture: { type: Number, default: 0 },
    water: { type: Number, default: 0 },
    watIce: { type: Number, default: 0 },
    silica: { type: Number, default: 0 },
    adm1: { type: Number, default: 0 },
    adm2: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Recipe || mongoose.model('Recipe', RecipeSchema);
