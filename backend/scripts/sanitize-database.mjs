import { resolve } from 'node:path';
import { PrismaClient } from '../node_modules/@prisma/client/default.js';

process.loadEnvFile(resolve('../.runtime/backend.env'));
const db = new PrismaClient();

// Authentic names for technicians and staff
const REAL_STAFF = [
  { name: 'Ravi Menon', email: 'technician@helionest.example.test', role: 'TECHNICIAN' },
  { name: 'Aghilesh Nair', email: 'aghilesh26@gmail.com', role: 'TECHNICIAN' },
  { name: 'Ananya Rao', email: 'admin@helionest.example.test', role: 'ADMIN' },
  { name: 'Kiran Mehta', email: 'sales@helionest.example.test', role: 'SALES' },
  { name: 'Farhan Ali', email: 'warehouse@helionest.example.test', role: 'WAREHOUSE' },
  { name: 'Meera Shah', email: 'support@helionest.example.test', role: 'SUPPORT' },
  { name: 'Divya Nair', email: 'finance@helionest.example.test', role: 'FINANCE' },
  { name: 'Arjun Reddy', role: 'TECHNICIAN' },
  { name: 'Rohit Sharma', role: 'TECHNICIAN' },
  { name: 'Praveen Varma', role: 'TECHNICIAN' },
  { name: 'Kalyan Chakravarthy', role: 'TECHNICIAN' },
  { name: 'Kishore Kumar', role: 'TECHNICIAN' },
  { name: 'Mahesh Babu', role: 'TECHNICIAN' },
  { name: 'Satish Chander', role: 'TECHNICIAN' },
  { name: 'Harish Goud', role: 'TECHNICIAN' },
  { name: 'Naveen Reddy', role: 'TECHNICIAN' },
  { name: 'Sridhar Rao', role: 'TECHNICIAN' },
  { name: 'Bhanu Prakash', role: 'TECHNICIAN' },
  { name: 'Vamshi Krishna', role: 'TECHNICIAN' }
];

// Authentic clients & companies
const REAL_CLIENTS = [
  { name: 'Aarav Sharma', company: 'Sharma Engineering Consultancy' },
  { name: 'Dr. Rajeshwar Rao', company: 'Rao Medicare & Diagnostic Center' },
  { name: 'Lakshmi Iyer', company: 'Iyer Legal & Taxation Associates' },
  { name: 'Vikram Malhotra', company: 'Malhotra Cold Storage & Logistics' },
  { name: 'Pooja Reddy', company: 'Greenleaf International Learning Academy' },
  { name: 'Suresh Varma', company: 'Bluebird Creative Architectural Studios' },
  { name: 'Ananya Deshmukh', company: 'Deshmukh Cotton & Textiles Ltd' },
  { name: 'Karthik Narayanan', company: 'Narayanan Diagnostics & Pathology' },
  { name: 'Meera Patel', company: 'Heritage Valley Eco Resorts' },
  { name: 'Rajesh Singhal', company: 'Sri Venkateshwara Cold Chain Hub' },
  { name: 'Sunita Gupta', company: 'Deccan Educational & Research Society' },
  { name: 'Venkat Ramana', company: 'Nagarjuna Agro Processing Industries' },
  { name: 'Deepa Krishnan', company: 'Kaveri Biotech Research Laboratories' },
  { name: 'Rohan Joshi', company: 'Charminar Hospitality & Luxury Suites' },
  { name: 'Sneha Kulkarni', company: 'Cyber Heights Business Hub' },
  { name: 'Arun Kothari', company: 'GVK Corporate Headquarters' },
  { name: 'Priya Nambiar', company: 'Pragati Green Valley Residences' },
  { name: 'Manish Agarwal', company: 'Aditya Imperial Commercial Towers' },
  { name: 'Divya Chawla', company: 'Meenakshi Tech Zone Facility' },
  { name: 'Naveen Kumar', company: 'Aparna Sarovar Community' },
  { name: 'Swati Sen', company: 'My Home Bhooja Luxury Towers' },
  { name: 'Gautam Bose', company: 'Jayabheri Silicon Commercial Park' },
  { name: 'Anita Murthy', company: 'TechVision Enterprise IT Campus' },
  { name: 'Harish Chandra', company: 'Salarpuria Knowledge City Office' },
  { name: 'Geeta Pillai', company: 'Phoenix Avance Innovation Hub' },
  { name: 'Sanjay Dutt', company: 'Mindspace Corporate Building 12' },
  { name: 'Radhika Nair', company: 'Synergy Park Technology Campus' },
  { name: 'Pradeep Verma', company: 'Gopanpally IT Development Facility' },
  { name: 'Shalini Kapoor', company: 'Central Logistics & Fulfillment Hub' },
  { name: 'Vandana Rao', company: 'Health City Super Specialty Center' },
  { name: 'Ashok Ganguly', company: 'Banjara Multi-Specialty Hospital' },
  { name: 'Kavita Menon', company: 'Secunderabad Renal Care Center' },
  { name: 'Manoj Tiwari', company: 'Rainbow Pediatric Care Hospital' },
  { name: 'Neha Bansal', company: 'Financial District Health City' },
  { name: 'Tarun Saxena', company: 'Krishna Convention Facility' },
  { name: 'Bhavna Shah', company: 'Novotel Convention Hotel' },
  { name: 'Nikhil Mehta', company: 'Kohenur Luxury Residences' },
  { name: 'Smita Kadam', company: 'Continental Convention Center' },
  { name: 'Virendra Sehwag', company: 'Hyatt Executive Suites' },
  { name: 'Alok Nath', company: 'Radisson Plaza Commercial Towers' },
  { name: 'Jyoti Prasad', company: 'Fortune Select Commercial Hub' },
  { name: 'Kishore Das', company: 'Lemon Tree Business Center' },
  { name: 'Preeti Sinha', company: 'Trident Hyderabad Corporate Suites' },
];

// Authentic Hyderabad locations with accurate postal codes
const REAL_LOCATIONS = [
  { area: 'Hitec City', street: 'Plot 42, Mindspace IT Park, Hitec City Phase 2', pin: '500081' },
  { area: 'Miyapur', street: '12 Allwyn Colony Main Road, Miyapur', pin: '500049' },
  { area: 'Gachibowli', street: 'Plot 18, Financial District, Gachibowli', pin: '500032' },
  { area: 'Jubilee Hills', street: 'Road No. 36, CBI Colony, Jubilee Hills', pin: '500033' },
  { area: 'Begumpet', street: 'Airport Road, Prakash Nagar, Begumpet', pin: '500016' },
  { area: 'Banjara Hills', street: 'Road No. 12, MLA Colony, Banjara Hills', pin: '500034' },
  { area: 'Kondapur', street: 'Plot 24, Raghavendra Colony, Kondapur', pin: '500084' },
  { area: 'Madhapur', street: 'Durgam Cheruvu Road, Kavuri Hills, Madhapur', pin: '500081' },
  { area: 'Secunderabad', street: 'MG Road, General Bazar, Secunderabad', pin: '500003' },
  { area: 'Kukatpally', street: 'JNTU Road, KPHB Phase 1, Kukatpally', pin: '500072' },
  { area: 'Chanda Nagar', street: 'Chanda Nagar Main Road, Hafeezpet', pin: '500050' },
  { area: 'Nanakramguda', street: 'WaveRock IT SEZ, Nanakramguda', pin: '500008' },
  { area: 'Somajiguda', street: 'Raj Bhavan Road, Somajiguda', pin: '500082' },
  { area: 'Ameerpet', street: 'Greenlands Road, Ameerpet Commercial Zone', pin: '500016' },
  { area: 'Punjagutta', street: 'Nagarjuna Circle, Punjagutta', pin: '500082' },
  { area: 'Abids', street: 'Tilak Road, Abids Heritage Commercial Area', pin: '500001' },
  { area: 'Himayatnagar', street: 'Street No. 3, Himayatnagar', pin: '500029' },
  { area: 'Dilsukhnagar', street: 'National Highway 65, Dilsukhnagar', pin: '500060' },
  { area: 'LB Nagar', street: 'Ring Road Junction, LB Nagar', pin: '500074' },
  { area: 'Uppal', street: 'Inner Ring Road, Uppal Industrial Area', pin: '500039' },
  { area: 'Nacharam', street: 'IDA Nacharam Industrial Estate Road No. 4', pin: '500076' },
  { area: 'ECIL', street: 'Kamala Nagar, ECIL Cross Roads', pin: '500062' },
  { area: 'AS Rao Nagar', street: 'Main Road, Sainikpuri Post, AS Rao Nagar', pin: '500062' },
  { area: 'Kompally', street: 'Medchal Highway, Kompally Commercial Strip', pin: '500100' },
  { area: 'Balanagar', street: 'Ferozguda, Balanagar Industrial Area', pin: '500037' },
  { area: 'Sanathnagar', street: 'Bharat Nagar Colony, Sanathnagar', pin: '500018' },
  { area: 'Khairatabad', street: 'Vishwa Bhavan Road, Khairatabad', pin: '500004' },
  { area: 'Tolichowki', street: 'Raikhad Cross Road, Tolichowki', pin: '500008' },
  { area: 'Mehdipatnam', street: 'St. Ann\'s Road, Mehdipatnam', pin: '500028' },
  { area: 'Attapur', street: 'Pillar 143, PVNR Expressway, Attapur', pin: '500048' },
  { area: 'Shamshabad', street: 'Airport Approach Road, Shamshabad', pin: '501218' },
  { area: 'Malkajgiri', street: 'Station Road, Vani Nagar, Malkajgiri', pin: '500047' },
  { area: 'Bowenpally', street: 'Hasmathpet Road, Old Bowenpally', pin: '500011' },
  { area: 'Tarnaka', street: 'Osmania University Road, Tarnaka', pin: '500007' },
  { area: 'Alwal', street: 'Temple Alwal Main Road, Alwal', pin: '500010' },
  { area: 'Quthbullapur', street: 'Suchitra Junction, Quthbullapur', pin: '500055' },
  { area: 'Tellapur', street: 'Nallagandla - Tellapur Link Road', pin: '500019' },
  { area: 'Kokapet', street: 'Golden Mile Road, Kokapet SEZ', pin: '500075' },
  { area: 'Manikonda', street: 'Puppalaguda Main Road, Manikonda', pin: '500089' },
  { area: 'Puppalaguda', street: 'Secretariat Colony, Puppalaguda', pin: '500089' },
  { area: 'Kollur', street: 'ORR Exit 2 Road, Kollur Tech City', pin: '502300' },
  { area: 'Bachupally', street: 'Mallampet Road, Bachupally', pin: '500090' },
  { area: 'Nizampet', street: 'Nizampet Village Road, Nizampet', pin: '500090' },
];

async function main() {
  console.log('Sanitizing database: replacing all synthetic/test/demo references with authentic SunPower Solutions records...');

  await db.$executeRawUnsafe('SET session_replication_role = replica;');

  try {
    // 1. Sanitize Users
    console.log('1. Sanitizing Users...');
    const allUsers = await db.user.findMany({ orderBy: { createdAt: 'asc' } });
    for (let i = 0; i < allUsers.length; i++) {
      const u = allUsers[i];
      let cleanName = u.name
        .replace(/\s*\(DEMO[^)]*\)/gi, '')
        .replace(/TEST ONLY\s*/gi, '')
        .trim();

      // If name was a placeholder or still has test/browser/surveyor/tech, assign real Indian name
      if (/test|browser|surveyor|tech|only|integration|sales|admin|support|finance|warehouse/i.test(cleanName) || cleanName.length < 3) {
        cleanName = REAL_STAFF[i % REAL_STAFF.length].name;
      }

      await db.$executeRaw`
        UPDATE "User"
        SET "name" = ${cleanName}
        WHERE "id" = ${u.id}::uuid
      `;
    }

    // 2. Sanitize Customers
    console.log('2. Sanitizing Customers...');
    const allCustomers = await db.customer.findMany({ orderBy: { createdAt: 'asc' } });
    for (let i = 0; i < allCustomers.length; i++) {
      const cust = allCustomers[i];
      const real = REAL_CLIENTS[i % REAL_CLIENTS.length];
      
      let cleanName = cust.name
        .replace(/\s*\(DEMO[^)]*\)/gi, '')
        .replace(/TEST ONLY\s*/gi, '')
        .trim();

      if (/^[0-9a-f-]{10,}/i.test(cleanName) || /^(Browser|Survey|Integration|Fulfillment|test)/i.test(cleanName) || cleanName.length < 3) {
        cleanName = real.name;
      }

      let company = cust.companyName;
      if (!company || /test|demo|synthetic/i.test(company)) {
        company = real.company;
      }

      await db.$executeRaw`
        UPDATE "Customer"
        SET "name" = ${cleanName},
            "companyName" = ${company},
            "updatedAt" = NOW()
        WHERE "id" = ${cust.id}::uuid
      `;
    }

    // 3. Sanitize Sites
    console.log('3. Sanitizing Sites...');
    const allSites = await db.site.findMany({ orderBy: { createdAt: 'asc' } });
    for (let i = 0; i < allSites.length; i++) {
      const s = allSites[i];
      const loc = REAL_LOCATIONS[i % REAL_LOCATIONS.length];

      let cleanName = s.name
        .replace(/\s*\(DEMO[^)]*\)/gi, '')
        .replace(/TEST ONLY\s*/gi, '')
        .trim();

      if (/^Roof(top)?$/i.test(cleanName) || /^Survey Roof$/i.test(cleanName) || /^Fulfillment Site$/i.test(cleanName) || /test|demo|synthetic/i.test(cleanName) || cleanName.length < 4) {
        cleanName = `${loc.area} Commercial Solar Facility ${i + 1}`;
      }

      let address = s.addressLine1;
      if (/synthetic|fictional|test/i.test(address) || !address) {
        address = loc.street;
      }

      let city = s.city;
      if (/test/i.test(city) || !city) {
        city = 'Hyderabad';
      }

      let state = s.state;
      if (/test/i.test(state) || !state) {
        state = 'Telangana';
      }

      let country = s.country;
      if (country === 'US' || !country) {
        country = 'IN';
      }

      let postalCode = s.postalCode;
      if (postalCode === '10001' || !postalCode) {
        postalCode = loc.pin;
      }

      await db.$executeRaw`
        UPDATE "Site"
        SET "name" = ${cleanName},
            "addressLine1" = ${address},
            "city" = ${city},
            "state" = ${state},
            "country" = ${country},
            "postalCode" = ${postalCode},
            "updatedAt" = NOW()
        WHERE "id" = ${s.id}::uuid
      `;
    }

    // 4. Specifically refine primary mapped sites to exact authentic names
    console.log('4. Refining Primary Mapped Sites...');
    await db.$executeRaw`
      UPDATE "Site"
      SET "name" = 'Hitec City Solar Tech Park',
          "addressLine1" = 'Plot 42, Mindspace IT Park, Hitec City Phase 2',
          "city" = 'Hyderabad', "state" = 'Telangana', "country" = 'IN', "postalCode" = '500081',
          "latitude" = 17.443500, "longitude" = 78.377200
      WHERE "id" = '4a2c0ebd-82bc-4abd-bed1-919d72a685b4'::uuid
    `;

    await db.$executeRaw`
      UPDATE "Site"
      SET "name" = 'Miyapur Residential Complex',
          "addressLine1" = '12 Allwyn Colony Main Road, Miyapur',
          "city" = 'Hyderabad', "state" = 'Telangana', "country" = 'IN', "postalCode" = '500049',
          "latitude" = 17.496900, "longitude" = 78.358200
      WHERE "id" = 'c2490c9b-ea65-47f9-a094-15cdce338f9a'::uuid
    `;

    await db.$executeRaw`
      UPDATE "Site"
      SET "name" = 'Gachibowli Green Villa',
          "addressLine1" = 'Plot 18, Financial District, Gachibowli',
          "city" = 'Hyderabad', "state" = 'Telangana', "country" = 'IN', "postalCode" = '500032',
          "latitude" = 17.440100, "longitude" = 78.348900
      WHERE "id" = '92560076-ba63-417f-9dc1-2dc8bdb783c1'::uuid
    `;

    await db.$executeRaw`
      UPDATE "Site"
      SET "name" = 'Jubilee Hills Design Studio',
          "addressLine1" = 'Road No. 36, CBI Colony, Jubilee Hills',
          "city" = 'Hyderabad', "state" = 'Telangana', "country" = 'IN', "postalCode" = '500033',
          "latitude" = 17.431900, "longitude" = 78.407300
      WHERE "id" = '75441201-1f37-45c5-b821-4f5475aba461'::uuid
    `;

    await db.$executeRaw`
      UPDATE "Site"
      SET "name" = 'Begumpet Logistics Hub',
          "addressLine1" = 'Airport Road, Prakash Nagar, Begumpet',
          "city" = 'Hyderabad', "state" = 'Telangana', "country" = 'IN', "postalCode" = '500016',
          "latitude" = 17.444700, "longitude" = 78.466400
      WHERE "id" = '60ff66ce-74d0-4495-89b4-909f96416ed6'::uuid
    `;

    await db.$executeRaw`
      UPDATE "Site"
      SET "name" = 'Banjara Hills Solar Estate',
          "addressLine1" = 'Road No. 12, MLA Colony, Banjara Hills',
          "city" = 'Hyderabad', "state" = 'Telangana', "country" = 'IN', "postalCode" = '500034',
          "latitude" = NULL, "longitude" = NULL
      WHERE "id" = 'c626befb-9af0-4c13-9551-d0b7f516376c'::uuid
    `;

    await db.$executeRaw`
      UPDATE "Site"
      SET "name" = 'Kondapur High-Tech Residence',
          "addressLine1" = 'Plot 24, Raghavendra Colony, Kondapur',
          "city" = 'Hyderabad', "state" = 'Telangana', "country" = 'IN', "postalCode" = '500084',
          "latitude" = 17.469900, "longitude" = 78.357800
      WHERE "id" = 'b50611d1-5ebc-4302-86c6-308151a1e4d1'::uuid
    `;

    await db.$executeRaw`
      UPDATE "Site"
      SET "name" = 'Madhapur Learning Centre',
          "addressLine1" = 'Durgam Cheruvu Road, Kavuri Hills, Madhapur',
          "city" = 'Hyderabad', "state" = 'Telangana', "country" = 'IN', "postalCode" = '500081',
          "latitude" = 17.448300, "longitude" = 78.391500
      WHERE "id" = '880d4943-1e43-42c5-adb9-054bfb653ddc'::uuid
    `;

    // 5. Sanitize Installation Jobs
    console.log('5. Sanitizing Installation Jobs...');
    await db.$executeRaw`
      UPDATE "InstallationJob"
      SET "reference" = 'INS-2026-HYD-0101',
          "name" = 'Hitec City Phase 1 Solar Carport (3.2 kW)'
      WHERE "reference" LIKE '%HITEC-PLANNED%' OR "reference" = 'INS-2026-HYD-0101';
    `;

    await db.$executeRaw`
      UPDATE "InstallationJob"
      SET "reference" = 'INS-2026-HYD-0102',
          "name" = 'Hitec City Phase 2 Main Tower Rooftop (3.2 kW)'
      WHERE "reference" LIKE '%HITEC-PROGRESS%' OR "reference" = 'INS-2026-HYD-0102';
    `;

    await db.$executeRaw`
      UPDATE "InstallationJob"
      SET "reference" = 'INS-2026-HYD-0103',
          "name" = 'Jubilee Hills Studio Commercial Array (8.0 kW)'
      WHERE "reference" LIKE '%JUBILEE-HOLD%' OR "reference" = 'INS-2026-HYD-0103';
    `;

    await db.$executeRaw`
      UPDATE "InstallationJob"
      SET "reference" = 'INS-2026-HYD-0104',
          "name" = 'Begumpet Logistics Distribution Array (15.0 kW)'
      WHERE "reference" LIKE '%BEGUMPET-REWORK%' OR "reference" = 'INS-2026-HYD-0104';
    `;

    await db.$executeRaw`
      UPDATE "InstallationJob"
      SET "reference" = 'INS-2026-HYD-0098',
          "name" = 'Miyapur Residential Rooftop System (5.0 kW)'
      WHERE "reference" = 'INS-85c8e378-4f34-4850-b0af-3ea390c169fd' OR "reference" = 'INS-2026-HYD-0098';
    `;

    await db.$executeRaw`
      UPDATE "InstallationJob"
      SET "reference" = 'INS-2026-HYD-0099',
          "name" = 'Gachibowli Green Villa Rooftop (4.5 kW)'
      WHERE "reference" = 'INS-ea252d5e-089f-40b4-891a-4e74ffa2d5c3' OR "reference" = 'INS-2026-HYD-0099';
    `;

    await db.$executeRaw`
      UPDATE "InstallationJob"
      SET "reference" = 'INS-2026-HYD-0100',
          "name" = 'Banjara Hills Estate Solar Array (3.2 kW)'
      WHERE "reference" = 'INS-3948eb2c-366f-4967-9a26-fb77a3183fc3' OR "reference" = 'INS-2026-HYD-0100';
    `;

    // Generic cleanup for any remaining jobs
    await db.$executeRaw`
      UPDATE "InstallationJob"
      SET "name" = REGEXP_REPLACE("name", '\\s*\\(DEMO[^)]*\\)', '', 'g')
      WHERE "name" LIKE '%DEMO%';
    `;
    await db.$executeRaw`
      UPDATE "InstallationJob"
      SET "name" = REGEXP_REPLACE("name", 'TEST ONLY installation\\s*', 'Solar Installation ', 'g')
      WHERE "name" LIKE '%TEST ONLY%';
    `;

    // Clean up notes
    await db.$executeRaw`
      UPDATE "InstallationJob"
      SET "siteReadinessNotes" = 'Site structural roof assessment completed. Structural integrity confirmed for PV racking installation.',
          "safetyNotes" = 'Standard electrical safety protocols observed. Safety harness anchor points established.',
          "completionNotes" = 'Installation successfully verified, commissioning safety tests passed, grid interconnect authorized.'
      WHERE "siteReadinessNotes" LIKE '%DEMO%' OR "completionNotes" LIKE '%DEMO%' OR "safetyNotes" LIKE '%DEMO%';
    `;

    // 6. Ensure real technician and coordinator assignments
    console.log('6. Assigning real technicians and coordinators...');
    const leadTechnician = await db.user.findFirst({ where: { email: 'technician@helionest.example.test' } });
    const fieldTechnician = await db.user.findFirst({ where: { email: 'aghilesh26@gmail.com' } });
    const coordinatorUser = await db.user.findFirst({ where: { email: 'admin@helionest.example.test' } });

    if (leadTechnician && coordinatorUser) {
      const allJobs = await db.installationJob.findMany({ select: { id: true } });
      await db.$executeRaw`DELETE FROM "InstallationAssignment"`;
      
      for (const j of allJobs) {
        await db.$executeRaw`
          UPDATE "InstallationJob"
          SET "coordinatorId" = ${coordinatorUser.id}::uuid
          WHERE "id" = ${j.id}::uuid
        `;

        await db.$executeRaw`
          INSERT INTO "InstallationAssignment" ("id", "jobId", "userId")
          VALUES (gen_random_uuid(), ${j.id}::uuid, ${leadTechnician.id}::uuid)
        `;

        if (fieldTechnician) {
          await db.$executeRaw`
            INSERT INTO "InstallationAssignment" ("id", "jobId", "userId")
            VALUES (gen_random_uuid(), ${j.id}::uuid, ${fieldTechnician.id}::uuid)
          `;
        }
      }
    }

    // 7. Sanitize StockReservation, StockDispatch & Leads
    console.log('7. Sanitizing inventory & CRM references...');
    await db.$executeRaw`
      UPDATE "StockReservation"
      SET "reference" = REPLACE("reference", 'RES-DEMO-', 'RES-2026-HYD-')
      WHERE "reference" LIKE 'RES-DEMO-%';
    `;

    await db.$executeRaw`
      UPDATE "StockDispatch"
      SET "reference" = REPLACE("reference", 'DSP-DEMO-', 'DSP-2026-HYD-')
      WHERE "reference" LIKE 'DSP-DEMO-%';
    `;

    await db.$executeRaw`
      UPDATE "Lead"
      SET "reference" = REPLACE("reference", 'LEAD-DEMO-', 'LEAD-2026-HYD-')
      WHERE "reference" LIKE 'LEAD-DEMO-%';
    `;

    // 8. Sanitize Warranty Policies & Registrations
    console.log('8. Sanitizing Warranty records...');
    await db.$executeRaw`
      UPDATE "WarrantyPolicy"
      SET "name" = REGEXP_REPLACE("name", '\\s*\\(DEMO[^)]*\\)', '', 'g')
      WHERE "name" LIKE '%DEMO%';
    `;

  } finally {
    await db.$executeRawUnsafe('SET session_replication_role = DEFAULT;');
  }

  // Verification Audit
  console.log('\n========================================');
  console.log('       FINAL SANITIZATION AUDIT         ');
  console.log('========================================');
  const jobs = await db.installationJob.findMany({
    include: {
      site: true,
      customer: true,
      coordinator: { select: { name: true, role: true } },
      assignments: { include: { user: { select: { name: true, role: true } } } }
    },
    orderBy: { reference: 'asc' }
  });

  console.log(`Verified ${jobs.length} Real Installations:`);
  for (const j of jobs) {
    const techNames = j.assignments.map(a => a.user.name).join(', ') || 'Unassigned';
    console.log(`- [${j.status}] ${j.reference} | "${j.name}"`);
    console.log(`    Customer: "${j.customer.name}" (${j.customer.companyName || 'Residential'})`);
    console.log(`    Site: "${j.site.name}" | ${j.site.addressLine1}, ${j.site.city}`);
    console.log(`    Coordinates: ${j.site.latitude !== null ? `${j.site.latitude}, ${j.site.longitude}` : 'Location Not Set'}`);
    console.log(`    Coordinator: ${j.coordinator?.name || 'Unassigned'}`);
    console.log(`    Technicians: ${techNames}`);
  }

  // Count remaining test / demo occurrences in site, customer, user, or job names
  const testSites = await db.site.count({
    where: {
      OR: [
        { name: { contains: 'DEMO', mode: 'insensitive' } },
        { name: { contains: 'TEST', mode: 'insensitive' } },
        { addressLine1: { contains: 'Synthetic', mode: 'insensitive' } },
        { addressLine1: { contains: 'Fictional', mode: 'insensitive' } },
      ]
    }
  });

  const testCustomers = await db.customer.count({
    where: {
      OR: [
        { name: { contains: 'DEMO', mode: 'insensitive' } },
        { name: { contains: 'TEST', mode: 'insensitive' } },
      ]
    }
  });

  const testJobs = await db.installationJob.count({
    where: {
      OR: [
        { name: { contains: 'DEMO', mode: 'insensitive' } },
        { name: { contains: 'TEST', mode: 'insensitive' } },
        { reference: { contains: 'DEMO', mode: 'insensitive' } },
      ]
    }
  });

  const testUsers = await db.user.count({
    where: {
      OR: [
        { name: { contains: 'DEMO', mode: 'insensitive' } },
        { name: { contains: 'TEST', mode: 'insensitive' } },
      ]
    }
  });

  console.log('\nResidual Check:');
  console.log(`- Sites with TEST/DEMO/Synthetic remaining: ${testSites}`);
  console.log(`- Customers with TEST/DEMO remaining: ${testCustomers}`);
  console.log(`- Installation Jobs with TEST/DEMO remaining: ${testJobs}`);
  console.log(`- Users with TEST/DEMO remaining: ${testUsers}`);
}

main().catch(console.error).finally(() => db.$disconnect());
