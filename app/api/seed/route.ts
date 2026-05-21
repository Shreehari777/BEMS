import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Customer from '@/lib/models/Customer';
import Vehicle from '@/lib/models/Vehicle';
import BatchReport from '@/lib/models/BatchReport';
import Recipe from '@/lib/models/Recipe';
import { subDays } from 'date-fns';

export async function GET() {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ error: "MONGODB_URI not found. Please connect MongoDB in settings first." }, { status: 400 });
    }

    await dbConnect();

    // 1. Create 500 Customers
    const customers = [];
    for (let i = 1; i <= 500; i++) {
        customers.push({
            name: `Sample Customer ${i}`,
            site: `Site Location ${i % 10}`,
        });
    }
    await Customer.deleteMany({ name: /Sample Customer/ });
    await Customer.insertMany(customers);

    // 2. Create 500 Vehicles
    const vehicles = [];
    for (let i = 1; i <= 500; i++) {
        vehicles.push({
            number: `MH${10 + (i % 80)} AB ${1000 + i}`,
            driverName: `Driver ${i}`,
        });
    }
    await Vehicle.deleteMany({ number: /MH/ });
    await Vehicle.insertMany(vehicles);

    // 3. Get some recipes to use
    const recipes = await Recipe.find({});
    const grades = recipes.length > 0 ? recipes.map(r => r.grade) : ['M10', 'M20', 'M30', 'M40'];

    // 4. Create 5000 Reports
    const reports = [];
    const now = new Date();
    
    for (let i = 1; i <= 5000; i++) {
        const date = subDays(now, Math.floor(i / 100)); // Spread over 50 days
        reports.push({
            docketNumber: 10000 + i,
            customerName: `Sample Customer ${1 + (i % 500)}`,
            site: `Site Location ${(i % 500) % 10}`,
            vehicleNumber: `MH${10 + ((i % 500) % 80)} AB ${1000 + (i % 500)}`,
            driverName: `Driver ${i % 500}`,
            grade: grades[i % grades.length],
            quantity: (Math.random() * 10).toFixed(1),
            startTime: "09:00",
            stopTime: "10:00",
            date: date,
        });

        // Insert in batches of 1000 for performance
        if (reports.length === 1000) {
            await BatchReport.insertMany(reports);
            reports.length = 0;
        }
    }
    
    if (reports.length > 0) {
        await BatchReport.insertMany(reports);
    }

    return NextResponse.json({ 
        message: "Successfully seeded 500 customers, 500 vehicles, and 5000 reports!",
        details: "Old sample data was cleaned up before insertion."
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
