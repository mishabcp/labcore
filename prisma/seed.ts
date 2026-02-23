import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const lab = await prisma.lab.upsert({
    where: { slug: 'demo-lab' },
    update: {},
    create: {
      name: 'Demo Lab',
      slug: 'demo-lab',
      maxUsers: 5,
    },
  });

  const hash = await bcrypt.hash('demo123', 12);
  const adminUser = await prisma.user.upsert({
    where: { labId_mobile: { labId: lab.id, mobile: '9876543210' } },
    update: {},
    create: {
      labId: lab.id,
      name: 'Admin',
      mobile: '9876543210',
      passwordHash: hash,
      role: 'admin',
    },
  });

  const dept = (v: string) => v as 'haematology' | 'biochemistry' | 'urine' | 'other';
  const sample = (v: string) => v as 'blood_edta' | 'blood_plain' | 'urine';

  const tests = [
    { code: 'HB', name: 'Haemoglobin', department: dept('haematology'), sampleType: sample('blood_edta'), price: 50 },
    { code: 'TLC', name: 'Total Leucocyte Count', department: dept('haematology'), sampleType: sample('blood_edta'), price: 50 },
    { code: 'PLT', name: 'Platelet Count', department: dept('haematology'), sampleType: sample('blood_edta'), price: 50 },
    { code: 'CBC', name: 'Complete Blood Count', department: dept('haematology'), sampleType: sample('blood_edta'), price: 200, isPanel: true },
    { code: 'ESR', name: 'Erythrocyte Sedimentation Rate', department: dept('haematology'), sampleType: sample('blood_edta'), price: 60 },
    { code: 'BT', name: 'Bleeding Time', department: dept('haematology'), sampleType: sample('blood_edta'), price: 80 },
    { code: 'CT', name: 'Clotting Time', department: dept('haematology'), sampleType: sample('blood_plain'), price: 80 },
    { code: 'GLU', name: 'Blood Glucose (Fasting)', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 80 },
    { code: 'GLU-PP', name: 'Blood Glucose (Post Prandial)', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 80 },
    { code: 'HbA1c', name: 'Glycated Haemoglobin', department: dept('biochemistry'), sampleType: sample('blood_edta'), price: 350 },
    { code: 'CREAT', name: 'Serum Creatinine', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 100 },
    { code: 'UREA', name: 'Blood Urea', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 80 },
    { code: 'KFT', name: 'Kidney Function Test', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 350, isPanel: true },
    { code: 'SGOT', name: 'Serum Glutamic Oxaloacetic Transaminase', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 100 },
    { code: 'SGPT', name: 'Serum Glutamic Pyruvic Transaminase', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 100 },
    { code: 'ALP', name: 'Alkaline Phosphatase', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 120 },
    { code: 'BIL-T', name: 'Total Bilirubin', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 100 },
    { code: 'BIL-D', name: 'Direct Bilirubin', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 100 },
    { code: 'LFT', name: 'Liver Function Test', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 450, isPanel: true },
    { code: 'CHOL', name: 'Total Cholesterol', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 150 },
    { code: 'TG', name: 'Triglycerides', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 150 },
    { code: 'HDL', name: 'HDL Cholesterol', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 180 },
    { code: 'LDL', name: 'LDL Cholesterol', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 180 },
    { code: 'VLDL', name: 'VLDL Cholesterol', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 150 },
    { code: 'LIPID', name: 'Lipid Profile', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 500, isPanel: true },
    { code: 'TSH', name: 'Thyroid Stimulating Hormone', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 300 },
    { code: 'T3', name: 'Triiodothyronine (T3)', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 350 },
    { code: 'T4', name: 'Thyroxine (T4)', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 350 },
    { code: 'THYROID', name: 'Thyroid Profile', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 700, isPanel: true },
    { code: 'URIC', name: 'Serum Uric Acid', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 120 },
    { code: 'CAL', name: 'Serum Calcium', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 120 },
    { code: 'PHOS', name: 'Serum Phosphorus', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 120 },
    { code: 'NA', name: 'Serum Sodium', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 150 },
    { code: 'K', name: 'Serum Potassium', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 150 },
    { code: 'CL', name: 'Serum Chloride', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 150 },
    { code: 'URINE-R', name: 'Urine Routine', department: dept('urine'), sampleType: sample('urine'), price: 100 },
    { code: 'URINE-C', name: 'Urine Culture & Sensitivity', department: dept('urine'), sampleType: sample('urine'), price: 250 },
    { code: 'URINE-M', name: 'Urine Microalbumin', department: dept('urine'), sampleType: sample('urine'), price: 200 },
    { code: 'STOOL-R', name: 'Stool Routine', department: dept('other'), sampleType: sample('blood_plain'), price: 80 },
    { code: 'STOOL-O', name: 'Stool Occult Blood', department: dept('other'), sampleType: sample('blood_plain'), price: 150 },
    { code: 'CRP', name: 'C-Reactive Protein', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 350 },
    { code: 'RA', name: 'Rheumatoid Factor', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 350 },
    { code: 'VIT-D', name: 'Vitamin D', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 900 },
    { code: 'VIT-B12', name: 'Vitamin B12', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 600 },
    { code: 'PSA', name: 'Prostate Specific Antigen', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 600 },
    { code: 'HCG', name: 'Beta HCG (Pregnancy)', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 350 },
    { code: 'DENGUE-NS1', name: 'Dengue NS1 Antigen', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 450 },
    { code: 'MALARIA', name: 'Malaria Parasite', department: dept('haematology'), sampleType: sample('blood_edta'), price: 150 },
    { code: 'WIDAL', name: 'Widal Test', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 250 },
    { code: 'HBSAG', name: 'HBsAg', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 200 },
    { code: 'HIV', name: 'HIV 1 & 2', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 300 },
    { code: 'DENGUE-IgG', name: 'Dengue IgG', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 400 },
    { code: 'DENGUE-IgM', name: 'Dengue IgM', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 400 },
  ];

  const existing = await prisma.testDefinition.count({ where: { labId: lab.id } });
  if (existing === 0) {
    for (let i = 0; i < tests.length; i++) {
      const t = tests[i];
      await prisma.testDefinition.create({
        data: {
          labId: lab.id,
          testCode: t.code,
          testName: t.name,
          department: t.department,
          sampleType: t.sampleType,
          tubeColour: t.sampleType === 'blood_edta' ? 'purple' : t.sampleType === 'blood_plain' ? 'red' : null,
          isPanel: t.isPanel ?? false,
          price: t.price,
          sortOrder: i + 1,
        },
      });
    }

    const hb = await prisma.testDefinition.findFirst({ where: { labId: lab.id, testCode: 'HB' } });
    if (hb) {
      await prisma.testParameter.create({
        data: {
          labId: lab.id,
          testDefinitionId: hb.id,
          paramName: 'Haemoglobin',
          paramCode: 'HB',
          unit: 'g/dL',
          resultType: 'numeric',
          sortOrder: 0,
          defaultRefRange: { male: { adult: { low: 13, high: 17 } }, female: { adult: { low: 12, high: 15.5 } } },
        },
      });
    }

    const glu = await prisma.testDefinition.findFirst({ where: { labId: lab.id, testCode: 'GLU' } });
    if (glu) {
      await prisma.testParameter.create({
        data: {
          labId: lab.id,
          testDefinitionId: glu.id,
          paramName: 'Glucose (Fasting)',
          paramCode: 'GLU',
          unit: 'mg/dL',
          resultType: 'numeric',
          sortOrder: 0,
          defaultRefRange: { adult: { low: 70, high: 100 } },
        },
      });
    }

    const tlc = await prisma.testDefinition.findFirst({ where: { labId: lab.id, testCode: 'TLC' } });
    if (tlc) {
      await prisma.testParameter.create({
        data: {
          labId: lab.id,
          testDefinitionId: tlc.id,
          paramName: 'Total Leucocyte Count',
          paramCode: 'TLC',
          unit: '/cumm',
          resultType: 'numeric',
          sortOrder: 0,
          defaultRefRange: { adult: { low: 4000, high: 11000 } },
        },
      });
    }

    const plt = await prisma.testDefinition.findFirst({ where: { labId: lab.id, testCode: 'PLT' } });
    if (plt) {
      await prisma.testParameter.create({
        data: {
          labId: lab.id,
          testDefinitionId: plt.id,
          paramName: 'Platelet Count',
          paramCode: 'PLT',
          unit: '/cumm',
          resultType: 'numeric',
          sortOrder: 0,
          defaultRefRange: { adult: { low: 150000, high: 400000 } },
        },
      });
    }

    const creat = await prisma.testDefinition.findFirst({ where: { labId: lab.id, testCode: 'CREAT' } });
    if (creat) {
      await prisma.testParameter.create({
        data: {
          labId: lab.id,
          testDefinitionId: creat.id,
          paramName: 'Serum Creatinine',
          paramCode: 'CREAT',
          unit: 'mg/dL',
          resultType: 'numeric',
          sortOrder: 0,
          defaultRefRange: { male: { adult: { low: 0.7, high: 1.3 } }, female: { adult: { low: 0.6, high: 1.1 } } },
        },
      });
    }
  }

  const orderCount = await prisma.order.count({ where: { labId: lab.id } });
  if (orderCount === 0) {
    const N_PATIENTS = 50;
    const N_DOCTORS = 20;
    const N_ORDERS = 50;
    const demoDate = '20260223';
    const invPrefix = `INV-${demoDate}-`;

    const patientNamePool = [
      { name: 'Ramesh Kumar', gender: 'male' as const, city: 'Thrissur', pincode: '680001', address: 'Near Temple St' },
      { name: 'Lakshmi Menon', gender: 'female' as const, city: 'Kochi', pincode: '682011', address: 'MG Road, Ernakulam' },
      { name: 'Suresh Pillai', gender: 'male' as const, city: 'Thiruvananthapuram', pincode: '695001', address: '' },
      { name: 'Anitha Rajan', gender: 'female' as const, city: 'Kozhikode', pincode: '673001', address: '' },
      { name: 'Vijayakrishnan Nair', gender: 'male' as const, city: 'Kottayam', pincode: '686008', address: 'Medical College PO' },
      { name: 'Deepa Mohan', gender: 'female' as const, city: 'Palakkad', pincode: '678001', address: '' },
      { name: 'Krishna Iyer', gender: 'male' as const, city: 'Alappuzha', pincode: '688001', address: '' },
      { name: 'Meera S Nair', gender: 'female' as const, city: 'Kollam', pincode: '691001', address: '' },
      { name: 'Rajeev Menon', gender: 'male' as const, city: 'Pathanamthitta', pincode: '689645', address: '' },
      { name: 'Sunitha Prabhu', gender: 'female' as const, city: 'Kannur', pincode: '670001', address: '' },
    ];
    const patients: Awaited<ReturnType<typeof prisma.patient.create>>[] = [];
    for (let i = 0; i < N_PATIENTS; i++) {
      const pool = patientNamePool[i % patientNamePool.length];
      const p = await prisma.patient.create({
        data: {
          labId: lab.id,
          patientCode: `PAT${(i + 1).toString().padStart(3, '0')}`,
          name: pool.name + (i >= patientNamePool.length ? ` ${i + 1}` : ''),
          gender: pool.gender,
          mobile: String(9895123000 + i),
          ageYears: 25 + (i % 45),
          city: pool.city,
          pincode: pool.pincode,
          address: pool.address || undefined,
        },
      });
      patients.push(p);
    }

    const doctorQuals = ['MD General Medicine', 'MBBS, DCP', 'MBBS, MD Path', 'DNB Internal Medicine', 'MBBS'];
    const doctorHospitals = ['City Hospital', 'Lakeshore Clinic', 'Care Medical Centre', 'Apollo Clinic', 'Metro Lab'];
    const doctors: Awaited<ReturnType<typeof prisma.referringDoctor.create>>[] = [];
    for (let i = 0; i < N_DOCTORS; i++) {
      const d = await prisma.referringDoctor.create({
        data: {
          labId: lab.id,
          name: `Dr. Doctor ${i + 1}`,
          qualification: doctorQuals[i % doctorQuals.length],
          hospitalClinic: doctorHospitals[i % doctorHospitals.length],
          mobile: String(9847123000 + i),
        },
      });
      doctors.push(d);
    }

    const testsByCode = await prisma.testDefinition.findMany({
      where: { labId: lab.id, testCode: { in: ['HB', 'GLU', 'TLC', 'PLT', 'CREAT'] } },
      include: { parameters: true },
    });
    const testByCode = (code: string) => testsByCode.find((t) => t.testCode === code)!;
    const hb = testByCode('HB');
    const glu = testByCode('GLU');
    const tlc = testByCode('TLC');
    const plt = testByCode('PLT');
    const creat = testByCode('CREAT');
    const testCombos: (typeof hb)[][] = [[hb], [glu], [hb, glu], [tlc, plt], [creat]];

    type OrderSpec = { orderCode: string; patientIndex: number; doctorIndex: number | null; tests: (typeof hb)[]; status: 'registered' | 'sample_collected' | 'in_process' | 'reported'; priority: 'routine' | 'urgent' };
    const ordersToCreate: OrderSpec[] = [];
    for (let i = 0; i < N_ORDERS; i++) {
      const status: OrderSpec['status'] =
        i < 20 ? 'reported' : i < 30 ? 'in_process' : i < 40 ? 'sample_collected' : 'registered';
      ordersToCreate.push({
        orderCode: `ORD-${demoDate}-${(i + 1).toString().padStart(4, '0')}`,
        patientIndex: i % N_PATIENTS,
        doctorIndex: i % 10 === 0 ? null : i % N_DOCTORS,
        tests: testCombos[i % testCombos.length],
        status,
        priority: i % 3 === 0 ? 'urgent' : 'routine',
      });
    }

    const createdOrders: { id: string; orderCode: string; status: string; orderItemIds: string[]; resultIds: string[]; sampleIds: string[] }[] = [];
    let invNum = 1;

    for (const spec of ordersToCreate) {
      const patient = patients[spec.patientIndex];
      const order = await prisma.order.create({
        data: {
          labId: lab.id,
          orderCode: spec.orderCode,
          patientId: patient.id,
          referringDoctorId: spec.doctorIndex !== null ? doctors[spec.doctorIndex].id : null,
          status: spec.status,
          priority: spec.priority,
          registeredById: adminUser.id,
          completedAt: spec.status === 'reported' ? new Date() : null,
          reportedAt: spec.status === 'reported' ? new Date() : null,
        },
      });

      const orderItemIds: string[] = [];
      const resultIds: string[] = [];
      const sampleIds: string[] = [];
      let sampleIndex = 0;

      for (const test of spec.tests) {
        const price = typeof test.price === 'object' && 'toNumber' in test.price ? (test.price as { toNumber: () => number }).toNumber() : Number(test.price);
        const orderItem = await prisma.orderItem.create({
          data: {
            labId: lab.id,
            orderId: order.id,
            testDefinitionId: test.id,
            price,
          },
        });
        orderItemIds.push(orderItem.id);

        sampleIndex += 1;
        const sampleCode = `${spec.orderCode}-${sampleIndex.toString().padStart(2, '0')}`;
        const sample = await prisma.sample.create({
          data: {
            labId: lab.id,
            sampleCode,
            orderId: order.id,
            sampleType: test.sampleType,
            tubeColour: test.tubeColour ?? null,
            barcodeData: orderItem.id,
            status: spec.status === 'reported' ? 'completed' : spec.status === 'in_process' ? 'in_process' : spec.status === 'sample_collected' ? 'received' : 'ordered',
          },
        });
        sampleIds.push(sample.id);

        const result = await prisma.result.create({
          data: {
            labId: lab.id,
            orderItemId: orderItem.id,
            sampleId: sample.id,
            status: spec.status === 'reported' ? 'authorised' : 'pending',
            authorisedById: spec.status === 'reported' ? adminUser.id : null,
            authorisedAt: spec.status === 'reported' ? new Date() : null,
          },
        });
        resultIds.push(result.id);
      }

      createdOrders.push({ id: order.id, orderCode: spec.orderCode, status: spec.status, orderItemIds, resultIds, sampleIds });
    }

    for (let i = 0; i < ordersToCreate.length; i++) {
      const spec = ordersToCreate[i];
      const created = createdOrders[i];
      if (spec.status !== 'reported') continue;

      await prisma.sample.updateMany({
        where: { id: { in: created.sampleIds } },
        data: { status: 'completed' },
      });

      const results = await prisma.result.findMany({
        where: { id: { in: created.resultIds } },
        include: { orderItem: { include: { testDefinition: { include: { parameters: true } } } } },
      });

      for (const result of results) {
        const params = result.orderItem.testDefinition.parameters;
        for (let p = 0; p < params.length; p++) {
          const param = params[p];
          const ref = (param.defaultRefRange as { male?: { adult?: { low: number; high: number } }; female?: { adult?: { low: number; high: number } }; adult?: { low: number; high: number } }) ?? {};
          const adult = ref.adult ?? ref.male?.adult ?? ref.female?.adult ?? { low: 0, high: 100 };
          const low = adult.low ?? 0;
          const high = adult.high ?? 100;
          const value = low + (high - low) * 0.5;
          await prisma.resultValue.create({
            data: {
              labId: lab.id,
              resultId: result.id,
              testParameterId: param.id,
              numericValue: value,
              refRangeLow: low,
              refRangeHigh: high,
              unit: param.unit,
            },
          });
        }
      }
    }

    for (let i = 0; i < createdOrders.length; i++) {
      const orderId = createdOrders[i].id;
      const order = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { orderItems: true, patient: true },
      });
      const subtotal = order.orderItems.reduce(
        (sum, item) => sum + (typeof item.price === 'object' && 'toNumber' in item.price ? (item.price as { toNumber: () => number }).toNumber() : Number(item.price)),
        0,
      );
      const discountTotal = 0;
      const taxAmount = Math.round((subtotal - discountTotal) * 0.18 * 100) / 100;
      const grandTotal = Math.round((subtotal - discountTotal + taxAmount) * 100) / 100;
      const amountPaid = i < 20 ? grandTotal : i < 30 ? Math.round(grandTotal * 0.5 * 100) / 100 : 0;
      const amountDue = Math.round((grandTotal - amountPaid) * 100) / 100;
      const invStatus: 'issued' | 'paid' | 'partial' = amountPaid >= grandTotal ? 'paid' : amountPaid > 0 ? 'partial' : 'issued';
      const invoiceCode = `${invPrefix}${invNum.toString().padStart(4, '0')}`;
      invNum += 1;

      await prisma.invoice.create({
        data: {
          labId: lab.id,
          invoiceCode,
          orderId: order.id,
          patientId: order.patientId,
          subtotal,
          discountTotal,
          taxAmount,
          grandTotal,
          amountPaid,
          amountDue,
          status: invStatus,
          issuedById: adminUser.id,
        },
      });
    }

    const invoices = await prisma.invoice.findMany({
      where: { labId: lab.id, status: { in: ['paid', 'partial'] }, amountPaid: { gt: 0 } },
      orderBy: { invoiceCode: 'asc' },
    });
    for (const inv of invoices) {
      const amount = typeof inv.amountPaid === 'object' && 'toNumber' in inv.amountPaid ? (inv.amountPaid as { toNumber: () => number }).toNumber() : Number(inv.amountPaid);
      if (amount <= 0) continue;
      await prisma.payment.create({
        data: {
          labId: lab.id,
          invoiceId: inv.id,
          amount: inv.amountPaid,
          mode: 'cash',
          receivedById: adminUser.id,
        },
      });
    }

    const firstReportedOrder = createdOrders.find((o) => o.status === 'reported');
    if (firstReportedOrder) {
      await prisma.report.create({
        data: {
          labId: lab.id,
          orderId: firstReportedOrder.id,
          reportCode: `RPT-${firstReportedOrder.orderCode}-v1`,
          generatedById: adminUser.id,
        },
      });
    }

    const reportedCount = ordersToCreate.filter((s) => s.status === 'reported').length;
    console.log(`Seed done. Demo lab: ${lab.slug}. Login: 9876543210 / demo123. Demo orders: ${ordersToCreate.length} (${reportedCount} reported).`);
  } else {
    console.log('Seed done. Demo lab:', lab.slug, 'Login: 9876543210 / demo123');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
