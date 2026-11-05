'use strict';
// Fictional demo data for a state tax agency. No real taxpayer data. Phone numbers use the 555-01xx range.
// Dates are generated relative to the day the server seeds, so notices, holds and due dates always look current.

function seed(brand, now = new Date()) {
  const tz = brand.timeZone || 'America/New_York';
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const [Y, M, D] = ymd.split('-').map(Number);
  const pad = (n) => String(n).padStart(2, '0');
  const day = (offset, hhmm = '09:00') => { const d = new Date(Date.UTC(Y, M - 1, D + offset)); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${hhmm}:00`; };
  const date = (offset) => day(offset).slice(0, 10);
  const TY = Y - 1;                       // most recent tax year
  const F = brand.forms, T = brand.taxTypes, AC = brand.areaCodes, CITY = brand.cities, SD = brand.schoolDistricts;
  const ph = (i, n) => `(${AC[i % AC.length]}) 555-${n}`;
  const addr = (line, i) => ({ line, city: CITY[i % CITY.length][0], state: brand.stateAbbr, zip: CITY[i % CITY.length][1], county: CITY[i % CITY.length][2] });
  let seq = 1;
  const id = (p) => `${p}-${String(seq++).padStart(4, '0')}`;

  const users = [
    { id: 'u-1', name: 'Richie Barnes', role: 'Taxpayer Services Agent', persona: 'agent', email: `richie.barnes@${brand.emailDomain}`, group: 'Individual Income Tax' },
    { id: 'u-2', name: 'Dana Whitfield', role: 'Business Tax Specialist', persona: 'business', email: `dana.whitfield@${brand.emailDomain}`, group: 'Business Tax' },
    { id: 'u-3', name: 'Morgan Lee', role: 'Contact Center Supervisor', persona: 'supervisor', email: `morgan.lee@${brand.emailDomain}`, group: 'Taxpayer Services' },
  ];
  const groups = ['Individual Income Tax', 'Business Tax', 'Identity Protection', 'Collections', 'Taxpayer Services'];

  const steps = (list) => list.map(([name, status, off]) => ({ name, status, date: off == null ? null : date(off) }));

  const TP = [];
  function taxpayer(t) {
    const base = {
      type: 'Individual', language: 'English', flags: [], phones: [], email: '', identity: { status: 'Verified', method: 'Return match', date: date(-200) },
      bank: null, representative: null, portalEnrolled: true, returns: [], assessments: [], payments: [], paymentPlan: null,
      notices: [], activities: [], filingStatus: 'Single', preferredContact: 'Email', accounts: [], ...t,
    };
    TP.push(base); return base;
  }

  // 1. Charlotte Gong: refund held for identity verification, letter returned undeliverable (the main demo story)
  taxpayer({
    id: 'tp-1001', firstName: 'Charlotte', lastName: 'Gong', tin: '***-**-4471', dob: '1989-04-12', filingStatus: 'Single',
    phones: [{ type: 'Mobile', number: ph(0, '0184'), primary: true }, { type: 'Work', number: ph(0, '0127') }],
    email: 'c.gong@gmail.com', address: addr('1452 Neil Ave., Apt 3B', 0), previousAddress: addr('310 Old Mill Rd.', 0), schoolDistrict: SD[0],
    flags: ['Refund on hold', 'Identity verification required'],
    identity: { status: 'Hold', method: '', date: null, reason: 'Selected for identity confirmation', quiz: 'Letter returned undeliverable' },
    returns: [
      { id: `RTN${TY % 100}081021`, taxYear: TY, form: F.individual, taxType: T.individual, filed: date(-260), method: `e-File (${brand.portal})`, status: 'Refund on hold', refund: { amount: 1284.00, status: 'On hold', method: 'Paper check', hold: 'Identity verification' }, balanceDue: 0,
        steps: steps([['Return received', 'Complete', -260], ['Return processed', 'Complete', -251], ['Identity verification', 'Pending', null], ['Identity Confirmation Quiz letter', 'Returned undeliverable', -14], ['Refund approved', 'On hold', null], ['Refund issued', 'Not started', null]]) },
      { id: `RTN${(TY - 1) % 100}077310`, taxYear: TY - 1, form: F.individual, taxType: T.individual, filed: date(-620), method: 'e-File', status: 'Refund issued', refund: { amount: 912.00, status: 'Issued', method: 'Paper check', issued: date(-590) }, balanceDue: 0, steps: steps([['Return received', 'Complete', -620], ['Return processed', 'Complete', -611], ['Refund issued', 'Complete', -590]]) },
    ],
    notices: [
      { id: 'NTC0004127', letter: 'IDC-01', type: 'Identity Confirmation Quiz', date: date(-28), status: 'Returned undeliverable', due: date(2), returnId: `RTN${TY % 100}081021`, sentTo: '310 Old Mill Rd.' },
    ],
    activities: [
      { id: id('act'), date: day(-4, '13:20'), type: 'Chat', direction: 'Inbound', by: 'Richie Barnes', subject: 'Where is my income tax refund', text: `Taxpayer asked about the ${TY} refund. Refund on hold for identity verification; explained the Identity Confirmation Quiz letter. Account noted to expedite once verified.`, ai: true },
      { id: id('act'), date: day(-14, '10:02'), type: 'Notice', direction: 'Outbound', by: 'System', subject: 'IDC-01 returned undeliverable', text: 'USPS return: no such address (310 Old Mill Rd.).' },
      { id: id('act'), date: day(-60, '19:44'), type: 'Web', direction: 'Inbound', by: 'Taxpayer', subject: `${brand.refundTool} lookup`, text: 'Status shown: Under review.' },
    ],
  });

  // 2. Marcus Johnson: billing notice for an underpayment; good for payment / payment plan
  taxpayer({
    id: 'tp-1002', firstName: 'Marcus', lastName: 'Johnson', tin: '***-**-8820', dob: '1976-09-03', filingStatus: 'Married filing jointly', spouse: 'Tanya Johnson',
    phones: [{ type: 'Mobile', number: ph(0, '0142'), primary: true }], email: 'mjohnson76@outlook.com', address: addr('88 Hamlet St.', 0), schoolDistrict: SD[0],
    flags: ['Balance due'], bank: { type: 'Checking', last4: '2290', bank: 'Huntington' },
    returns: [
      { id: `RTN${(TY - 1) % 100}044518`, taxYear: TY - 1, form: F.individual, taxType: T.individual, filed: date(-560), method: 'e-File', status: 'Assessed', refund: null, balanceDue: 2341.18, steps: steps([['Return received', 'Complete', -560], ['Return processed', 'Complete', -540], ['Adjustment: unreported income', 'Complete', -95], ['Billing notice issued', 'Complete', -40]]) },
      { id: `RTN${TY % 100}052207`, taxYear: TY, form: F.individual, taxType: T.individual, filed: date(-230), method: 'e-File', status: 'Refund offset', refund: { amount: 418.00, status: 'Applied to balance', method: 'Direct deposit' }, balanceDue: 0, steps: steps([['Return received', 'Complete', -230], ['Return processed', 'Complete', -222], ['Refund applied to prior-year balance', 'Complete', -220]]) },
    ],
    assessments: [{ id: 'ASM0019922', taxType: T.individual, period: String(TY - 1), assessed: 2210.00, penalty: 110.50, interest: 438.68, paid: 418.00, balance: 2341.18, status: 'Billing notice', due: date(5), noticeId: 'NTC0003915' }],
    notices: [{ id: 'NTC0003915', letter: 'BN-02', type: 'Billing Notice', date: date(-40), status: 'Mailed', due: date(5), amount: 2341.18 }],
    payments: [{ id: 'PMT0081455', date: date(-220), amount: 418.00, method: 'Refund offset', confirmation: 'OFF-418220', appliedTo: 'ASM0019922' }],
    activities: [{ id: id('act'), date: day(-40, '08:00'), type: 'Notice', direction: 'Outbound', by: 'System', subject: 'Billing Notice BN-02 mailed', text: `Balance due $2,341.18 for tax year ${TY - 1}.` }],
  });

  // 3 & 4. Patel household: two taxpayers share one home phone (multi-match picker)
  taxpayer({
    id: 'tp-1003', firstName: 'Raj', lastName: 'Patel', tin: '***-**-1167', dob: '1981-02-20', filingStatus: 'Married filing separately',
    phones: [{ type: 'Home', number: ph(1, '0131'), primary: true }, { type: 'Mobile', number: ph(1, '0135') }], email: 'raj.patel@yahoo.com', address: addr('2210 Lee Rd.', 1), schoolDistrict: SD[1], bank: { type: 'Checking', last4: '7781', bank: 'KeyBank' },
    returns: [{ id: `RTN${TY % 100}061144`, taxYear: TY, form: F.individual, taxType: T.individual, filed: date(-240), method: 'e-File', status: 'Refund issued', refund: { amount: 655.00, status: 'Issued', method: 'Direct deposit', issued: date(-226), trace: 'DD-226-7781' }, balanceDue: 0, steps: steps([['Return received', 'Complete', -240], ['Return processed', 'Complete', -231], ['Refund issued', 'Complete', -226]]) }],
  });
  taxpayer({
    id: 'tp-1004', firstName: 'Priya', lastName: 'Patel', tin: '***-**-3302', dob: '1983-07-14', filingStatus: 'Married filing separately',
    phones: [{ type: 'Home', number: ph(1, '0131'), primary: true }], email: 'priya.patel@yahoo.com', address: addr('2210 Lee Rd.', 1), schoolDistrict: SD[1], flags: ['School district return missing'],
    returns: [{ id: `RTN${TY % 100}061145`, taxYear: TY, form: F.individual, taxType: T.individual, filed: date(-240), method: 'e-File', status: 'Processed', refund: null, balanceDue: 0, steps: steps([['Return received', 'Complete', -240], ['Return processed', 'Complete', -231]]) }],
    notices: [{ id: 'NTC0004410', letter: 'SD-NF', type: `Non-filer notice (${F.schoolDistrict})`, date: date(-10), status: 'Mailed', due: date(20) }],
  });

  // 5. Linda Okafor: Request for Information (W-2 mismatch), response due soon
  taxpayer({
    id: 'tp-1005', firstName: 'Linda', lastName: 'Okafor', tin: '***-**-5098', dob: '1968-11-30', filingStatus: 'Head of household',
    phones: [{ type: 'Mobile', number: ph(3, '0163'), primary: true }], email: 'lokafor@gmail.com', address: addr('540 Salem Ave.', 3), flags: ['Response due'],
    returns: [{ id: `RTN${TY % 100}070332`, taxYear: TY, form: F.individual, taxType: T.individual, filed: date(-200), method: 'Paper', status: 'Under review', refund: { amount: 2210.00, status: 'Pending review', method: 'Paper check' }, balanceDue: 0, steps: steps([['Return received', 'Complete', -200], ['Wage verification', 'Information requested', -21], ['Refund approved', 'Not started', null]]) }],
    notices: [{ id: 'NTC0004302', letter: 'RFI-W2', type: 'Request for Information (W-2 verification)', date: date(-21), status: 'Mailed', due: date(9), returnId: `RTN${TY % 100}070332` }],
  });

  // 6. Buckeye-style business: delinquent sales tax return, estimated assessment
  taxpayer({
    id: 'tp-2001', type: 'Business', businessName: 'Riverbend Brewing Co. LLC', dba: 'Riverbend Taproom', firstName: 'Riverbend', lastName: 'Brewing Co. LLC', contact: 'Sam Alvarez (Owner)',
    tin: '**-***6612', phones: [{ type: 'Business', number: ph(0, '0199'), primary: true }], email: 'books@riverbendbrewing.example', address: addr('455 W 3rd Ave.', 0), flags: ['Delinquent return', 'Estimated assessment'],
    accounts: [{ type: T.sales, number: `${brand.stateAbbr}-25-104477`, label: "Vendor's license", frequency: 'Monthly', status: 'Active' }, { type: T.cat, number: '99-1188204', label: 'CAT account', frequency: 'Quarterly', status: 'Active' }],
    returns: [
      { id: `UST${TY % 100}0612`, taxYear: TY, form: F.sales, taxType: T.sales, period: 'Last month', filed: null, method: '', status: 'Not filed (delinquent)', refund: null, balanceDue: 0, steps: steps([['Return due', 'Missed', -8]]) },
      { id: `UST${TY % 100}0511`, taxYear: TY, form: F.sales, taxType: T.sales, period: 'Two months ago', filed: date(-38), method: brand.portal, status: 'Processed', refund: null, balanceDue: 0, steps: steps([['Return received', 'Complete', -38], ['Return processed', 'Complete', -35]]) },
    ],
    assessments: [{ id: 'ASM0020417', taxType: T.sales, period: 'Last month (estimated)', assessed: 6420.00, penalty: 321.00, interest: 18.40, paid: 0, balance: 6759.40, status: 'Estimated assessment', due: date(12), noticeId: 'NTC0004390' }],
    notices: [{ id: 'NTC0004390', letter: 'EA-ST', type: 'Estimated Assessment (sales tax)', date: date(-3), status: 'Mailed', due: date(12), amount: 6759.40 }],
  });

  // 7. Thomas Reed: represented by a CPA under a power of attorney; the rep calls from her own number
  taxpayer({
    id: 'tp-1007', firstName: 'Thomas', lastName: 'Reed', tin: '***-**-2219', dob: '1952-05-08', filingStatus: 'Single',
    phones: [{ type: 'Home', number: ph(2, '0102'), primary: true }, { type: 'Representative', number: ph(2, '0155') }], email: '', address: addr('19 Garfield Pl.', 2), preferredContact: 'Mail', portalEnrolled: false,
    representative: { name: 'Elena Ruiz, CPA', firm: 'Ruiz & Partners Tax', phone: ph(2, '0155'), form: F.poa, expires: date(400), scope: 'All tax matters' }, flags: ['POA on file', 'Amended return'],
    returns: [{ id: `RTN${TY % 100}0X2219`, taxYear: TY, form: F.amended, taxType: T.individual, filed: date(-45), method: 'Paper', status: 'Amended return in review', refund: { amount: 740.00, status: 'Pending review', method: 'Paper check' }, balanceDue: 0, steps: steps([['Amended return received', 'Complete', -45], ['Review', 'In progress', -30], ['Refund approved', 'Not started', null]]) }],
  });

  // 8. Anika Choudhury: estimated payment not showing yet
  taxpayer({
    id: 'tp-1008', firstName: 'Anika', lastName: 'Choudhury', tin: '***-**-6630', dob: '1993-01-25', filingStatus: 'Single',
    phones: [{ type: 'Mobile', number: ph(1, '0161'), primary: true }], email: 'ani.c112@gmail.com', address: addr('3301 Mayfield Rd.', 1), schoolDistrict: SD[1], bank: { type: 'Checking', last4: '5512', bank: 'Fifth Third' },
    payments: [{ id: 'PMT0091120', date: date(-6), amount: 850.00, method: 'Electronic check', confirmation: 'EP-6630-0006', appliedTo: `${TY + 1} estimated (Q4)`, status: 'Posting' }],
    returns: [{ id: `RTN${TY % 100}020981`, taxYear: TY, form: F.individual, taxType: T.individual, filed: date(-250), method: 'e-File', status: 'Processed', refund: null, balanceDue: 0, steps: steps([['Return received', 'Complete', -250], ['Return processed', 'Complete', -243]]) }],
  });

  // 9. Maria Delgado: Spanish speaker, refund partly offset to another agency's debt
  taxpayer({
    id: 'tp-1009', firstName: 'Maria', lastName: 'Delgado', tin: '***-**-7715', dob: '1985-08-17', filingStatus: 'Head of household', language: 'Spanish',
    phones: [{ type: 'Mobile', number: ph(5, '0177'), primary: true }], email: 'mdelgado85@gmail.com', address: addr('77 Kenmore Blvd.', 5), flags: ['Interpreter: Spanish', 'Refund offset'], bank: { type: 'Checking', last4: '0042', bank: 'PNC' },
    returns: [{ id: `RTN${TY % 100}039876`, taxYear: TY, form: F.individual, taxType: T.individual, filed: date(-35), method: 'e-File', status: 'Refund adjusted', refund: { amount: 1120.00, adjusted: 655.00, status: 'Issued (partial offset)', method: 'Direct deposit', issued: date(-12), offset: { amount: 465.00, agency: 'Child Support Enforcement' } }, balanceDue: 0, steps: steps([['Return received', 'Complete', -35], ['Return processed', 'Complete', -26], ['Offset to other agency debt', 'Complete', -13], ['Refund issued', 'Complete', -12]]) }],
    notices: [{ id: 'NTC0004501', letter: 'RO-01', type: 'Refund Offset Notice', date: date(-12), status: 'Mailed' }],
  });

  // Cases
  const cases = [
    { id: 'cs-1', number: 'CS0001042', taxpayerId: 'tp-1001', shortDescription: 'Where is my income tax refund', category: 'Refund inquiry', subcategory: 'Identity verification', state: 'Awaiting info', priority: '3 - Moderate', group: 'Individual Income Tax', assignedTo: 'Richie Barnes', channel: 'Chat', opened: day(-4, '13:20'), updated: day(-4, '13:41'),
      notes: [{ date: day(-4, '13:41'), author: 'Richie Barnes', text: 'Refund on hold for identity verification. Taxpayer to complete Identity Confirmation Quiz. Expedite release once verified.' }] },
    { id: 'cs-2', number: 'CS0001038', taxpayerId: 'tp-1002', shortDescription: 'Disputes unreported income adjustment', category: 'Billing', subcategory: 'Assessment dispute', state: 'Work in progress', priority: '3 - Moderate', group: 'Collections', assignedTo: 'Richie Barnes', channel: 'Phone', opened: day(-9, '10:05'), updated: day(-2, '15:12'),
      notes: [{ date: day(-2, '15:12'), author: 'Richie Barnes', text: 'Taxpayer reviewing 1099 records; may prefer a payment plan instead of a dispute.' }] },
    { id: 'cs-3', number: 'CS0001045', taxpayerId: 'tp-2001', shortDescription: 'Estimated assessment: sales tax return not filed', category: 'Business tax', subcategory: 'Delinquent return', state: 'New', priority: '2 - High', group: 'Business Tax', assignedTo: 'Dana Whitfield', channel: 'Web', opened: day(-2, '09:30'), updated: day(-2, '09:30'), notes: [] },
    { id: 'cs-4', number: 'CS0001031', taxpayerId: 'tp-1005', shortDescription: 'W-2 verification documents', category: 'Correspondence', subcategory: 'Request for information', state: 'Awaiting info', priority: '4 - Low', group: 'Individual Income Tax', assignedTo: 'Richie Barnes', channel: 'Mail', opened: day(-21, '08:00'), updated: day(-21, '08:00'), notes: [] },
    { id: 'cs-5', number: 'CS0001027', taxpayerId: 'tp-1007', shortDescription: 'Amended return status (POA call)', category: 'Return status', subcategory: 'Amended return', state: 'Work in progress', priority: '4 - Low', group: 'Individual Income Tax', assignedTo: 'Morgan Lee', channel: 'Phone', opened: day(-30, '14:00'), updated: day(-6, '11:00'), notes: [] },
    { id: 'cs-6', number: 'CS0001019', taxpayerId: 'tp-1003', shortDescription: 'Direct deposit confirmation', category: 'Refund inquiry', subcategory: 'Refund issued', state: 'Resolved', priority: '5 - Planning', group: 'Taxpayer Services', assignedTo: 'Richie Barnes', channel: 'Phone', opened: day(-225, '11:10'), updated: day(-225, '11:20'), resolution: 'Refund trace provided.', notes: [] },
  ];

  const kb = [
    { id: 'KB0020415', title: 'Identity Confirmation Quiz', category: 'Identity protection', summary: 'When a return is selected for identity review, the department mails an Identity Confirmation Quiz letter. Taxpayers can complete the quiz online, or an agent can verify identity by phone with knowledge-based questions. Once verified, the refund is typically released within 4 business days.', body: 'Agent-assisted verification requires the taxpayer to confirm date of birth, the last 4 of the SSN, prior-year state adjusted gross income and the address on the return. If the letter was returned undeliverable, update the address before releasing the refund.' },
    { id: 'KB0020416', title: 'Refund timelines', category: 'Refunds', summary: `E-filed returns with direct deposit are usually processed within 15 business days. Paper returns can take 8-10 weeks. ${brand.refundTool} is updated nightly.`, body: 'Returns selected for review (identity, wage verification, amended returns) take longer. Direct deposit arrives 5-7 business days sooner than a paper check.' },
    { id: 'KB0020417', title: 'Payment plans', category: 'Payments', summary: 'Individuals with a billed balance can set up a payment plan of up to 24 months. Interest continues to accrue; penalties may be reduced while the plan is current. Automatic payments are recommended.', body: 'The first installment is due within 30 days. Missed installments can cancel the plan and resume collection activity.' },
    { id: 'KB0020418', title: 'Billing notices and assessments', category: 'Payments', summary: 'A billing notice lists tax, penalty and interest owed. Taxpayers can pay, set up a payment plan, or file a petition for reassessment within 60 days.', body: 'Payments can be made online, by phone or by mail. Partial payments reduce interest going forward.' },
    { id: 'KB0020419', title: 'Request for Information (wage verification)', category: 'Correspondence', summary: 'When reported wages do not match employer filings, the department asks for W-2s or pay stubs. Taxpayers can upload documents online. A one-time 30-day extension can be granted.', body: 'Refunds remain pending until documents are reviewed, usually within 30 days of receipt.' },
    { id: 'KB0020420', title: 'Refund offsets', category: 'Refunds', summary: 'Refunds can be applied to tax balances or certified debts owed to other state agencies (for example child support). The offset notice names the agency to contact.', body: 'The department cannot reverse an offset to another agency; the taxpayer must contact that agency.' },
    { id: 'KB0020421', title: 'Power of attorney and authorized representatives', category: 'Representation', summary: `A representative can discuss the taxpayer's account when a valid ${F.poa} is on file and not expired. Confirm the rep's name and firm before disclosing details.`, body: 'The scope on the form limits which tax types and years the representative can discuss.' },
    { id: 'KB0020422', title: 'Delinquent sales tax returns and estimated assessments', category: 'Business tax', summary: "When a vendor does not file, an estimated assessment is issued. Filing the actual return within 60 days replaces the estimate. Continued non-filing can lead to vendor's license suspension.", body: 'Penalties are reduced when the actual return is filed promptly.' },
    { id: 'KB0020423', title: 'Estimated payment posting', category: 'Payments', summary: `Electronic payments post within 2 business days; paper checks can take up to 3 weeks. Taxpayers can confirm posted payments in ${brand.portal}.`, body: '' },
    { id: 'KB0020424', title: 'Changing a mailing address', category: 'Account', summary: 'Address changes take effect immediately for future notices. Returned mail should be re-sent after the address is updated.', body: '' },
  ];

  return { brand, seededOn: ymd, users, groups, taxpayers: TP, cases, kb, interactions: [], screenpops: [], taxYear: TY };
}

module.exports = { seed };
