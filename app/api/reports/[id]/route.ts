import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BatchReport from '@/lib/models/BatchReport';
import { requireAuth, escapeRegex } from '@/lib/session';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;

    const { id } = await params;

    // Reserved path — handled by /api/next-docket (dynamic [id] would match otherwise)
    if (id === 'next-docket') {
      return NextResponse.json({ error: 'Use /api/next-docket' }, { status: 404 });
    }

    await dbConnect();
    
    const report = await BatchReport.findById(id).lean() as any;
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // IDOR protection check
    if (auth.session.role !== 'admin' && report.createdBy !== auth.session.userId) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to view this report' }, { status: 403 });
    }

    // Auto-populate blank customer fields from Customer profile on GET
    if (report.customerName && report.createdBy) {
      const Customer = (await import('@/lib/models/Customer')).default;
      const customer = await Customer.findOne({
        name: { $regex: new RegExp(`^${escapeRegex(report.customerName)}$`, 'i') },
        createdBy: report.createdBy
      }).lean();

      if (customer) {
        if (!report.customerAddress) report.customerAddress = customer.address || '';
        if (!report.customerState) report.customerState = customer.state || 'MAHARASHTRA';
        if (!report.customerStateCode) report.customerStateCode = customer.stateCode || '27';
        if (!report.gstNumber) report.gstNumber = customer.gstNumber || '';
      }
    }

    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const body = await req.json();
    
    await dbConnect();

    // Check ownership (IDOR check)
    const existingReport = await BatchReport.findById(id).lean() as any;
    if (!existingReport) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (auth.session.role !== 'admin' && existingReport.createdBy !== auth.session.userId) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to update this report' }, { status: 403 });
    }
    
    const report = await BatchReport.findByIdAndUpdate(id, body, { new: true }) as any;
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Update customer fields in the background
    const Customer = (await import('@/lib/models/Customer')).default;
    const customerName = report.customerName;
    const userId = report.createdBy;
    if (customerName && userId) {
      await Customer.findOneAndUpdate(
        { name: { $regex: new RegExp(`^${escapeRegex(customerName)}$`, 'i') }, createdBy: userId },
        {
          $set: {
            address: report.customerAddress || '',
            state: report.customerState || '',
            stateCode: report.customerStateCode || '',
            gstNumber: report.gstNumber || '',
            site: report.site || '',
          }
        },
        { upsert: true, new: true }
      ).catch(err => console.error('Error updating customer from report PUT:', err));
    }

    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    
    await dbConnect();

    // Check ownership (IDOR check)
    const existingReport = await BatchReport.findById(id).lean() as any;
    if (!existingReport) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (auth.session.role !== 'admin' && existingReport.createdBy !== auth.session.userId) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to delete this report' }, { status: 403 });
    }
    
    await BatchReport.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

