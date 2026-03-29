/// <reference types="node" />
import { PrismaClient, type TestDefinition } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting execution of Demo Seeder...');

  // 1. Upsert Demo Lab
  const lab = await prisma.lab.upsert({
    where: { slug: 'demo-lab' },
    update: {},
    create: {
      name: 'Demo Lab',
      slug: 'demo-lab',
      maxUsers: 10,
    },
  });
  console.log(`✓ Lab ensured: ${lab.name}`);

  // 2. Create the 5 Role Accounts
  const hash = await bcrypt.hash('demo123', 12);
  const demoUsers = [
    { name: 'Dr. Jane Smith', email: 'admin@demolab.com', role: 'admin', mobile: '9847100001' },
    { name: 'Dr. John Doe', email: 'pathologist@demolab.com', role: 'pathologist', mobile: '9847100002' },
    { name: 'Sarah Senior', email: 'srtech@demolab.com', role: 'senior_tech', mobile: '9847100003' },
    { name: 'Tyler Tech', email: 'tech@demolab.com', role: 'technician', mobile: '9847100004' },
    { name: 'Fiona Front', email: 'frontdesk@demolab.com', role: 'front_desk', mobile: '9847100005' },
  ] as const;

  const createdUsers = [];
  for (const u of demoUsers) {
    const user = await prisma.user.upsert({
      where: { labId_mobile: { labId: lab.id, mobile: u.mobile } },
      update: { email: u.email, role: u.role, name: u.name },
      create: {
        labId: lab.id,
        name: u.name,
        email: u.email,
        mobile: u.mobile,
        passwordHash: hash,
        role: u.role,
      },
    });
    createdUsers.push(user);
    console.log(`✓ Ensured user [${u.role}]: ${u.email} / demo123`);
  }
  const adminUser = createdUsers[0];

  // 3. Upsert Rate Card
  const rateCard = await prisma.rateCard.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' }, // Dummy UUID since no unique constraint on name
    update: {},
    create: {
      labId: lab.id,
      name: 'Standard Walk-in Rates',
      isDefault: true,
      isActive: true,
    },
  }).catch(async () => {
    // Fallback if ID generation strategy fails or differs
    const existingCard = await prisma.rateCard.findFirst({ where: { labId: lab.id, name: 'Standard Walk-in Rates' } });
    if (existingCard) return existingCard;
    return await prisma.rateCard.create({
      data: { labId: lab.id, name: 'Standard Walk-in Rates', isDefault: true, isActive: true }
    });
  });

  console.log(`✓ Rate Card ensured: ${rateCard.name}`);

  // 4. Create Tests and Map to Rate Card
  const dept = (v: string) => v as 'haematology' | 'biochemistry' | 'urine' | 'other';
  const sample = (v: string) =>
    v as 'blood_edta' | 'blood_plain' | 'blood_citrate' | 'urine';

  const tests = [
    { code: 'HB', name: 'Haemoglobin', department: dept('haematology'), sampleType: sample('blood_edta'), price: 150 },
    { code: 'WBC', name: 'Total WBC Count', department: dept('haematology'), sampleType: sample('blood_edta'), price: 110 },
    { code: 'PLT', name: 'Platelet Count', department: dept('haematology'), sampleType: sample('blood_edta'), price: 95 },
    { code: 'ESR', name: 'ESR', department: dept('haematology'), sampleType: sample('blood_citrate'), price: 85 },
    { code: 'GLU', name: 'Blood Glucose (Fasting)', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 80 },
    { code: 'CREAT', name: 'Serum Creatinine', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 120 },
    { code: 'CHOL', name: 'Total Cholesterol', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 150 },
    { code: 'SGPT', name: 'SGPT (ALT)', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 200 },
    { code: 'TSH', name: 'Thyroid Stimulating Hormone (TSH)', department: dept('biochemistry'), sampleType: sample('blood_plain'), price: 380 },
    { code: 'HBA1C', name: 'Glycated Haemoglobin (HbA1c)', department: dept('biochemistry'), sampleType: sample('blood_edta'), price: 520 },
    { code: 'URINE-R', name: 'Urine Routine', department: dept('urine'), sampleType: sample('urine'), price: 100 },
  ];

  const createdTestDefs: TestDefinition[] = [];
  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];

    // Check if test exists
    const existingTest = await prisma.testDefinition.findFirst({ where: { labId: lab.id, testCode: t.code } });
    let testDef;

    if (!existingTest) {
      testDef = await prisma.testDefinition.create({
        data: {
          labId: lab.id,
          testCode: t.code,
          testName: t.name,
          department: t.department,
          sampleType: t.sampleType,
          tubeColour:
            t.sampleType === 'blood_edta'
              ? 'purple'
              : t.sampleType === 'blood_plain'
                ? 'red'
                : t.sampleType === 'blood_citrate'
                  ? 'blue'
                  : null,
          isPanel: false,
          price: t.price,
          sortOrder: i + 1,
        },
      });

      // Create Parameter
      const paramCode = t.code;
      const refRanges: any = {};
      let unit = 'g/dL';

      if (t.code === 'HB') {
        refRanges.male = { adult: { low: 13, high: 17 } };
        refRanges.female = { adult: { low: 12, high: 15.5 } };
        unit = 'g/dL';
      } else if (t.code === 'WBC') {
        refRanges.adult = { low: 4, high: 11 };
        unit = '10³/µL';
      } else if (t.code === 'PLT') {
        refRanges.adult = { low: 150, high: 450 };
        unit = '10³/µL';
      } else if (t.code === 'ESR') {
        refRanges.male = { adult: { low: 0, high: 15 } };
        refRanges.female = { adult: { low: 0, high: 20 } };
        unit = 'mm/hr';
      } else if (t.code === 'GLU') {
        refRanges.adult = { low: 70, high: 100 };
        unit = 'mg/dL';
      } else if (t.code === 'CREAT') {
        refRanges.male = { adult: { low: 0.7, high: 1.3 } };
        refRanges.female = { adult: { low: 0.6, high: 1.1 } };
        unit = 'mg/dL';
      } else if (t.code === 'CHOL') {
        refRanges.adult = { low: 0, high: 200 };
        unit = 'mg/dL';
      } else if (t.code === 'SGPT') {
        refRanges.male = { adult: { low: 7, high: 56 } };
        refRanges.female = { adult: { low: 7, high: 45 } };
        unit = 'U/L';
      } else if (t.code === 'TSH') {
        refRanges.adult = { low: 0.4, high: 4.0 };
        unit = 'mIU/L';
      } else if (t.code === 'HBA1C') {
        refRanges.adult = { low: 4.0, high: 5.6 };
        unit = '%';
      }

      await prisma.testParameter.create({
        data: {
          labId: lab.id,
          testDefinitionId: testDef.id,
          paramName: t.name,
          paramCode: paramCode,
          unit: unit,
          resultType: 'numeric',
          sortOrder: 0,
          defaultRefRange: Object.keys(refRanges).length > 0 ? refRanges : null,
        }
      });

    } else {
      testDef = existingTest;
    }

    createdTestDefs.push(testDef);

    // Ensure Rate Card Item exists
    const existingRci = await prisma.rateCardItem.findFirst({
      where: { labId: lab.id, rateCardId: rateCard.id, testDefinitionId: testDef.id }
    });

    if (!existingRci) {
      await prisma.rateCardItem.create({
        data: {
          labId: lab.id,
          rateCardId: rateCard.id,
          testDefinitionId: testDef.id,
          price: t.price
        }
      });
    }
  }
  console.log(`✓ Ensured ${tests.length} tests and standard prices.`);

  const T = (code: string) => {
    const d = createdTestDefs.find((x) => x.testCode === code);
    if (!d) throw new Error(`Missing test definition: ${code}`);
    return d;
  };

  const testCombos = [
    [T('HB')],
    [T('GLU'), T('CREAT')],
    [T('CHOL'), T('URINE-R')],
    [T('HB'), T('GLU'), T('CHOL')],
    [T('WBC'), T('PLT'), T('HB')],
    [T('TSH'), T('HBA1C')],
    [T('SGPT'), T('CREAT'), T('CHOL')],
    [T('ESR')],
    [T('HBA1C'), T('GLU')],
    [T('WBC'), T('GLU')],
  ];

  // 5. Check if pipeline orders are already generated to avoid duplication
  const existingOrdersCount = await prisma.order.count({ where: { labId: lab.id } });

  if (existingOrdersCount > 0) {
    console.log(`\nDemo Lab [${lab.name}] is already populated with ${existingOrdersCount} orders.`);
    console.log('If you want to re-seed from scratch with clean data, please run:');
    console.log('npx prisma db push --force-reset && npx prisma db seed\n');
    return;
  }

  // 6. Generate Realistic Data (scaled for richer local/staging demos)
  const N_PATIENTS = 180;
  const N_DOCTORS = 68;
  const N_ORDERS = 225;

  console.log(`\nGenerating ${N_ORDERS} realistic pipeline orders (${N_PATIENTS} patients, ${N_DOCTORS} referring doctors)...`);

  // Generate Patients
  const patients = [];
  for (let i = 0; i < N_PATIENTS; i++) {
    const p = await prisma.patient.create({
      data: {
        labId: lab.id,
        patientCode: `PT-${(i + 1).toString().padStart(5, '0')}`,
        name: `Demo Patient ${i + 1}`,
        gender: i % 2 === 0 ? 'male' : 'female',
        mobile: i < 3 ? '9497386759' : `94472${(i + 1).toString().padStart(5, '0')}`,
        ageYears: 20 + (i % 50),
      },
    });
    patients.push(p);
  }

  // Generate Doctors
  const doctors = [];
  for (let i = 0; i < N_DOCTORS; i++) {
    const d = await prisma.referringDoctor.create({
      data: {
        labId: lab.id,
        name: `Dr. Referrer ${i + 1}`,
        mobile: `82813${(i + 1).toString().padStart(5, '0')}`,
      },
    });
    doctors.push(d);
  }

  // 7. Distribute orders across pipeline statuses (~40% / 20% / 20% / 20%)
  const nReported = Math.floor(N_ORDERS * 0.4);
  const nInProcess = Math.floor(N_ORDERS * 0.2);
  const nSampleCollected = Math.floor(N_ORDERS * 0.2);
  const endReported = nReported;
  const endInProcess = nReported + nInProcess;
  const endSampleCollected = nReported + nInProcess + nSampleCollected;

  const now = new Date();
  let invoiceCounter = 1;

  for (let i = 0; i < N_ORDERS; i++) {
    let status: 'registered' | 'sample_collected' | 'in_process' | 'reported' = 'registered';
    let sampleStatus: 'ordered' | 'received' | 'in_process' | 'completed' = 'ordered';
    let resultStatus: 'pending' | 'entered' | 'authorised' = 'pending';

    // Reverse time so reported were created longest ago
    const hoursAgo = N_ORDERS - i;
    const createdAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    if (i < endReported) {
      status = 'reported';
      sampleStatus = 'completed';
      resultStatus = 'authorised';
    } else if (i < endInProcess) {
      status = 'in_process';
      sampleStatus = 'in_process';
      resultStatus = 'entered';
    } else if (i < endSampleCollected) {
      status = 'sample_collected';
      sampleStatus = 'received';
      resultStatus = 'pending';
    } else {
      status = 'registered';
      sampleStatus = 'ordered';
      resultStatus = 'pending';
    }

    const patient = patients[i % N_PATIENTS];
    const doctor = i % 5 === 0 ? null : doctors[i % N_DOCTORS];
    const testsToRun = testCombos[i % testCombos.length];

    // Create Order
    const order = await prisma.order.create({
      data: {
        labId: lab.id,
        orderCode: `ORD-${createdAt.getFullYear()}${(createdAt.getMonth() + 1).toString().padStart(2, '0')}-${(i + 1).toString().padStart(4, '0')}`,
        patientId: patient.id,
        referringDoctorId: doctor ? doctor.id : null,
        status: status,
        registeredById: adminUser.id,
        registeredAt: createdAt,
        createdAt: createdAt,
        completedAt: status === 'reported' ? new Date(createdAt.getTime() + 2 * 60 * 60 * 1000) : null,
        reportedAt: status === 'reported' ? new Date(createdAt.getTime() + 3 * 60 * 60 * 1000) : null,
      },
    });

    let subtotal = 0;

    // Create Items, Samples, Results
    for (let tIdx = 0; tIdx < testsToRun.length; tIdx++) {
      const test = testsToRun[tIdx];
      const price = typeof test.price === 'object' && 'toNumber' in test.price ? (test.price as { toNumber: () => number }).toNumber() : Number(test.price);
      subtotal += price;

      const orderItem = await prisma.orderItem.create({
        data: {
          labId: lab.id,
          orderId: order.id,
          testDefinitionId: test.id,
          price: price,
        }
      });

      const sample = await prisma.sample.create({
        data: {
          labId: lab.id,
          sampleCode: `${order.orderCode}-S${tIdx + 1}`,
          orderId: order.id,
          sampleType: test.sampleType,
          barcodeData: orderItem.id,
          status: sampleStatus,
          collectedById: sampleStatus !== 'ordered' ? createdUsers[3].id : null, // Tech
          collectedAt: sampleStatus !== 'ordered' ? new Date(createdAt.getTime() + 30 * 60 * 1000) : null,
        }
      });

      const result = await prisma.result.create({
        data: {
          labId: lab.id,
          orderItemId: orderItem.id,
          sampleId: sample.id,
          status: resultStatus,
          enteredById: resultStatus !== 'pending' ? createdUsers[3].id : null,
          enteredAt: resultStatus !== 'pending' ? new Date(createdAt.getTime() + 60 * 60 * 1000) : null,
          authorisedById: resultStatus === 'authorised' ? adminUser.id : null,
          authorisedAt: resultStatus === 'authorised' ? new Date(createdAt.getTime() + 90 * 60 * 1000) : null,
        }
      });

      // If Entered or Authorised, inject fake numerical values
      if (resultStatus !== 'pending') {
        const param = await prisma.testParameter.findFirst({ where: { testDefinitionId: test.id } });
        if (param) {
          const ref = (param.defaultRefRange as any) ?? {};
          const adult = ref.adult ?? ref.male?.adult ?? ref.female?.adult ?? { low: 0, high: 100 };
          const low = adult.low ?? 0;
          const high = adult.high ?? 100;

          // 10% chance to be abnormal
          const isAbnormal = Math.random() < 0.1;
          const value = isAbnormal ? high * 1.2 : low + (high - low) * 0.5;

          await prisma.resultValue.create({
            data: {
              labId: lab.id,
              resultId: result.id,
              testParameterId: param.id,
              numericValue: value,
              abnormalFlag: value > high ? 'H' : value < low ? 'L' : null,
              refRangeLow: low,
              refRangeHigh: high,
              unit: param.unit
            }
          });
        }
      }
    }

    // Billing Generation
    const taxAmount = Math.round(subtotal * 0.18 * 100) / 100;
    const grandTotal = subtotal + taxAmount;

    // We make half the registered orders unpaid, but everything else is paid
    const amountPaid = (status === 'registered' && i % 2 !== 0) ? 0 : grandTotal;
    const invStatus = amountPaid === grandTotal ? 'paid' : 'issued';

    const invoiceCode = `INV-${createdAt.getFullYear()}${(createdAt.getMonth() + 1).toString().padStart(2, '0')}-${invoiceCounter.toString().padStart(4, '0')}`;
    invoiceCounter++;

    const invoice = await prisma.invoice.create({
      data: {
        labId: lab.id,
        invoiceCode: invoiceCode,
        orderId: order.id,
        patientId: patient.id,
        subtotal: subtotal,
        taxAmount: taxAmount,
        grandTotal: grandTotal,
        amountPaid: amountPaid,
        amountDue: grandTotal - amountPaid,
        status: invStatus,
        issuedById: adminUser.id
      }
    });

    if (amountPaid > 0) {
      await prisma.payment.create({
        data: {
          labId: lab.id,
          invoiceId: invoice.id,
          amount: amountPaid,
          mode: 'cash',
          receivedById: adminUser.id,
        }
      });
    }

    // Final PDF Generation
    if (status === 'reported') {
      await prisma.report.create({
        data: {
          labId: lab.id,
          orderId: order.id,
          reportCode: `RPT-${order.orderCode}-v1`,
          generatedById: adminUser.id
        }
      });
    }
  }

  console.log(`✓ ${N_ORDERS} demo orders generated across pipeline phases.`);
  console.log(`\nDemo Seeding Complete!`);
  console.log(`================================`);
  console.log(`You can test the 5 UI flows by logging in with:`);
  console.log(`admin@demolab.com       (or 9847100001) => PW: demo123`);
  console.log(`pathologist@demolab.com (or 9847100002) => PW: demo123`);
  console.log(`srtech@demolab.com      (or 9847100003) => PW: demo123`);
  console.log(`tech@demolab.com        (or 9847100004) => PW: demo123`);
  console.log(`frontdesk@demolab.com   (or 9847100005) => PW: demo123`);
  console.log(`================================`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
