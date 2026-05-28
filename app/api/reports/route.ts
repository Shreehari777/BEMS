import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BatchReport from '@/lib/models/BatchReport';
import Recipe from '@/lib/models/Recipe';
import Setting from '@/lib/models/Setting';

export const dynamic = 'force-dynamic';

// ─── Deterministic PRNG utilities ───────────────────────────────────────────
// These ensure that for the same docket/customer/grade/qty,
// the generated batch data is always identical (reproducible).

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function randBetween(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}



// ─── Default tolerances (fallback if operator hasn't configured DIFF row) ───
// All default to 0 = no difference between Set Weight and Actual unless operator configures it.
const DEFAULT_TOLERANCES: Record<string, number> = {
  stone20mm: 0,
  sand: 0,
  sand1: 0,
  stone10mm: 0,
  cem1: 0,
  cem2: 0,
  ggbs: 0,
  flyAsh: 0,
  water: 0,
  watIce: 0,
  silica: 0,
  adm1: 0,
  adm2: 0,
  moisture: 0,
};

// ─── GET ────────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const page = parseInt(url.searchParams.get('page') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '0');

    await dbConnect();
    const userId = req.headers.get('x-user-id') || '';
    let query: any = {};
    // Filter by user if userId is provided
    if (userId) {
      query.createdBy = userId;
    }
    if (search) {
      query.customerName = { $regex: search, $options: 'i' };
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const total = await BatchReport.countDocuments(query);
    let mongoQuery = BatchReport.find(query).sort({ date: -1, docketNumber: -1 }).select('-batches -targets -setWeights -adjustedActuals');

    if (page > 0 && limit > 0) {
      mongoQuery = mongoQuery.skip((page - 1) * limit).limit(limit);
    }

    const reports = await mongoQuery.lean();
    return NextResponse.json(page > 0 ? { data: reports, total } : reports);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST ───────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const userId = req.headers.get('x-user-id') || '';
    await dbConnect();

    // ── Auto-create customer if new ──
    const Customer = (await import('@/lib/models/Customer')).default;
    let customer = await Customer.findOne({ name: { $regex: new RegExp(`^${data.customerName}$`, 'i') }, createdBy: userId });
    if (!customer && data.customerName) {
      customer = await Customer.create({ name: data.customerName, site: data.site || '', createdBy: userId });
    }

    let generatedOrderNumber = data.orderNumber;
    if (customer) {
      // Find the highest orderNumber currently in the database for this customer
      const reports = await BatchReport.find({ 
        customerName: { $regex: new RegExp(`^${customer.name}$`, 'i') }, 
        createdBy: userId 
      }).select('orderNumber').lean();
      
      let maxOrder = 0;
      reports.forEach(r => {
        const num = parseInt(r.orderNumber, 10);
        if (!isNaN(num) && num > maxOrder) {
          maxOrder = num;
        }
      });

      if (!generatedOrderNumber) {
        generatedOrderNumber = String(maxOrder + 1);
        customer.lastOrderNumber = maxOrder + 1;
      } else {
        const parsed = parseInt(generatedOrderNumber, 10);
        customer.lastOrderNumber = !isNaN(parsed) ? Math.max(parsed, maxOrder) : maxOrder;
      }
      await customer.save();
    } else if (!generatedOrderNumber) {
      generatedOrderNumber = '1';
    }

    // ── Auto-create vehicle if new ──
    const Vehicle = (await import('@/lib/models/Vehicle')).default;
    const existingVehicle = await Vehicle.findOne({ number: { $regex: new RegExp(`^${data.vehicleNumber}$`, 'i') }, createdBy: userId });
    if (!existingVehicle && data.vehicleNumber) {
      await Vehicle.create({ number: data.vehicleNumber.toUpperCase(), driverName: data.driverName || '', createdBy: userId });
    }

    // ── Load recipe and tolerances ──
    const recipe = await Recipe.findOne({ grade: data.grade });
    const settingsDoc = await Setting.findOne({ key: 'materialTolerances' });
    const tolerances: Record<string, number> = settingsDoc?.value || {};

    const q = Number(data.quantity) || 0;
    const mc = Number(data.mixerCapacity) || 0.5;
    // TotalBatches = Floor(ProductionQty / MixerCapacity) — matches VBA Fix() behavior
    const numBatches = q > 0 && mc > 0 ? Math.floor(q / mc) : 0;

    // ── Build targets object from recipe ──
    const targets: Record<string, number> = {};
    const MATERIALS = ['stone10mm', 'stone20mm', 'sand', 'sand1', 'cem1', 'cem2', 'ggbs', 'flyAsh', 'water', 'watIce', 'silica', 'adm1', 'adm2', 'moisture'];
    if (recipe) {
      MATERIALS.forEach(mat => {
        targets[mat] = Number(recipe[mat]) || 0;
      });
    }

    // ── Resolve tolerance: operator's DIFF row, else default ──
    const getDiff = (key: string): number => {
      const val = tolerances[key];
      if (val !== undefined && val !== null) return Number(val);
      return DEFAULT_TOLERANCES[key] ?? 0;
    };

    // ── Deterministic seed from entry identifiers ──
    const seed = hashSeed(`${data.docketNumber}-${data.customerName}-${data.grade}-${q}`);
    const rowRng = mulberry32(seed);

    // ═════════════════════════════════════════════════════════════════════════
    //  STEP 1: Generate per-batch rows with small per-row variation
    //  The operator's DIFF row does NOT affect individual batch rows.
    //  These use realistic, small per-batch jitter matching the VBA spec.
    // ═════════════════════════════════════════════════════════════════════════
    const batches: any[] = [];

    for (let i = 0; i < numBatches; i++) {
      const t = (key: string) => targets[key] || 0;

      const batch: Record<string, number> = {
        // Aggregate — ±2
        stone20mm: t('stone20mm') > 0 ? t('stone20mm') + randBetween(rowRng, -2, 2) : 0,
        sand:      t('sand')      > 0 ? t('sand')      + randBetween(rowRng, -2, 2) : 0,
        moisture:  0,
        sand1:     t('sand1')     > 0 ? t('sand1')     + randBetween(rowRng, -2, 2) : 0,
        stone10mm: t('stone10mm') > 0 ? t('stone10mm') + randBetween(rowRng, -2, 2) : 0,
        // Cement — ±2
        cem1:      t('cem1')   > 0 ? t('cem1')   + randBetween(rowRng, -2, 2) : 0,
        cem2:      t('cem2')   > 0 ? t('cem2')   + randBetween(rowRng, -2, 2) : 0,
        ggbs:      t('ggbs')   > 0 ? t('ggbs')   + randBetween(rowRng, -2, 2) : 0,
        flyAsh:    t('flyAsh') > 0 ? t('flyAsh') + randBetween(rowRng, -2, 2) : 0,
        // Water / Ice — water ±2, watIce ±1
        water:     t('water')  > 0 ? t('water')  + randBetween(rowRng, -2, 2) : 0,
        watIce:    t('watIce') > 0 ? t('watIce') + randBetween(rowRng, -1, 1) : 0,
        // Silica — ±1
        silica:    t('silica') > 0 ? t('silica') + randBetween(rowRng, -1, 1) : 0,
        // Admixture — ±0.02 floating point
        adm1:      t('adm1') > 0 ? Number((t('adm1') + (rowRng() - 0.5) * 0.04).toFixed(2)) : 0.00,
        adm2:      t('adm2') > 0 ? Number((t('adm2') + (rowRng() - 0.5) * 0.04).toFixed(2)) : 0.00,
      };

      batches.push(batch);
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  STEP 2: Compute raw totals (real sum of all batch rows)
    // ═════════════════════════════════════════════════════════════════════════
    const rawTotals: Record<string, number> = {};
    MATERIALS.forEach(mat => {
      rawTotals[mat] = batches.reduce((sum, b) => sum + (Number(b[mat]) || 0), 0);
    });

    // ── Separate RNG stream for DIFF offsets — truly random each report creation ──
    const diffSeed = hashSeed(`${Date.now()}-${Math.random()}-${seed}`);
    const diffRng = mulberry32(diffSeed);

    // ═════════════════════════════════════════════════════════════════════════
    //  STEP 3a: Total Set Weight = target × numBatches (simple multiplication)
    //  This is just the programmed/planned weight — no randomness, no DIFF.
    //  E.g. target 20MM = 10, 8 batches → Set Weight = 80
    // ═════════════════════════════════════════════════════════════════════════
    const setWeights: Record<string, number> = {};
    MATERIALS.forEach(mat => {
      const isAdmix = mat === 'adm1' || mat === 'adm2';
      const base = (targets[mat] || 0) * numBatches;
      setWeights[mat] = isAdmix ? Number(base.toFixed(2)) : Math.round(base);
    });

    // ═════════════════════════════════════════════════════════════════════════
    //  STEP 3b: Adjusted Actuals = Total Set Weight + random offset within DIFF
    //  DIFF is the MAXIMUM allowed offset from the Set Weight.
    //  DIFF = -5  → Actual = SetWeight + random(-5 to 0)  (slightly less)
    //  DIFF = +10 → Actual = SetWeight + random(0 to 10)  (slightly more)
    //  DIFF = 0   → Actual = SetWeight exactly (no difference)
    // ═════════════════════════════════════════════════════════════════════════
    const adjustedActuals: Record<string, number> = {};
    MATERIALS.forEach(mat => {
      const isAdmix = mat === 'adm1' || mat === 'adm2';
      const setWeight = setWeights[mat] || 0;
      const diff = getDiff(mat);

      // No DIFF or zero target → Actual = exactly Total Set Weight (no offset)
      if (diff === 0 || setWeight === 0) {
        adjustedActuals[mat] = setWeight;
        return;
      }

      // Random offset: between 1 and abs(DIFF), guaranteed non-zero
      const absDiff = Math.abs(diff);
      const sign = diff > 0 ? 1 : -1;

      if (isAdmix) {
        const offset = Number((0.01 + diffRng() * (absDiff - 0.01)).toFixed(2));
        adjustedActuals[mat] = Number((setWeight + sign * offset).toFixed(2));
      } else {
        const offset = Math.floor(diffRng() * absDiff) + 1;
        adjustedActuals[mat] = Math.round(setWeight + sign * offset);
      }
    });
    // ── Load saved challan/invoice template defaults ──
    const templateDoc = await Setting.findOne({ key: 'challanInvoiceTemplate' });
    const template = templateDoc?.value || {};

    // ── Build final report data ──
    const enrichedData = {
      ...data,
      targets,
      batches,
      setWeights,        // Total Set Weight = target × numBatches
      adjustedActuals,   // Total Actual = real sum + random DIFF offset
      createdBy: userId,
      withThisLoad: q,
      orderedQuantity: q,
      productionQuantity: q,
      batchSize: mc,
      mixerCapacity: mc,
      orderNumber: generatedOrderNumber,
      batcherName: data.batcherName || 'Stetter',
      // Apply saved template defaults (user can override per-report later)
      companyName: data.companyName || template.companyName || 'MATRIX INFRA RMC',
      companyTagline: data.companyTagline || template.companyTagline || 'Suppliers : All Types of Ready Mix Concrete',
      companyAddress: data.companyAddress || template.companyAddress || 'Office : A/p, Kharpudi (B), Khed City Road, Mandawala, Tal. Khed, Dist. Pune - 410505.',
      companyMobile: data.companyMobile || template.companyMobile || 'Mob.: 9325714072 | 9405818311',
      // Auto-populate customer fields from customer record
      gstNumber: data.gstNumber || (customer?.gstNumber) || '',
      customerAddress: data.customerAddress || (customer?.address) || '',
      customerState: data.customerState || (customer?.state) || 'MAHARASHTRA',
      customerStateCode: data.customerStateCode || (customer?.stateCode) || '27',
    };

    const report = await BatchReport.create(enrichedData);
    return NextResponse.json(report);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    await dbConnect();
    await BatchReport.deleteMany({});
    return NextResponse.json({ success: true, message: 'All reports deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
