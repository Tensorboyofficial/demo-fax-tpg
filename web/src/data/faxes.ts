import type { Fax, FaxEvent } from "@/lib/types";

// Anchor timestamps to module load so the demo always feels "fresh".
const NOW = new Date("2026-04-23T14:32:00Z").getTime();
const MIN = 60_000;
const HR = 60 * MIN;

function ago(minutes: number): string {
  return new Date(NOW - minutes * MIN).toISOString();
}

const TPG_FAX = "817-860-2704";

export const faxes: Fax[] = [
  // 1. HERO — Cardiology specialist consult (Opus 4.7)
  {
    id: "FAX-20260423-001",
    receivedAt: ago(8),
    pages: 6,
    fromNumber: "682-885-4100",
    fromOrg: "Baylor Scott & White Heart & Vascular — Fort Worth",
    faxNumberTo: TPG_FAX,
    toClinic: "Arlington",
    status: "auto_routed",
    type: "specialist_consult",
    typeConfidence: 0.97,
    urgency: "routine",
    matchedPatientId: "PT-10042",
    matchConfidence: 0.99,
    candidates: [
      { patientId: "PT-10042", score: 0.99, reason: "Exact name + DOB + MRN match" },
      { patientId: "PT-10088", score: 0.21, reason: "Partial last-name overlap" },
    ],
    extracted: {
      sendingProvider: "Christopher Arnett, MD",
      sendingOrg: "Baylor Scott & White Heart & Vascular",
      documentDate: "2026-04-21",
      patientNameOnDoc: "Maria E. Gonzalez",
      patientDobOnDoc: "07/14/1962",
      patientMrnOnDoc: "MRN-004218",
      diagnoses: [
        "Atherosclerotic heart disease of native coronary artery with angina pectoris (I25.110)",
        "Hyperlipidemia, unspecified (E78.5)",
      ],
      recommendations: [
        "Initiate atorvastatin 40 mg PO daily",
        "Start metoprolol tartrate 25 mg PO BID; titrate to resting HR < 70 as tolerated",
        "Low-dose aspirin 81 mg daily",
        "Stress echocardiogram in 6 weeks",
        "Follow-up in cardiology clinic 8 weeks",
      ],
      medications: ["Atorvastatin 40 mg", "Metoprolol tartrate 25 mg BID", "ASA 81 mg"],
      urgency: "routine",
      icd10: ["I25.110", "E78.5"],
      cpt: [],
      summary:
        "62-year-old female with exertional chest pain, workup consistent with CAD. Recommending lipid + beta-blocker optimization and stress echo in 6 weeks.",
    },
    routedTo: "P-001",
    routedReason:
      "Patient's PCP is Dr. Nguyen; cardiology reports are routed to PCP results inbox per workflow rule R-204.",
    ocrText: `BAYLOR SCOTT & WHITE HEART & VASCULAR - FORT WORTH
1400 8TH AVE, FORT WORTH TX 76104 | 682-885-4100 | F 682-885-4133
CONSULTATION REPORT
Date: 04/21/2026
PATIENT: GONZALEZ, MARIA E.      DOB: 07/14/1962    MRN: 004218
REFERRING PROVIDER: T. Nguyen, MD, Texas Physicians Group - Arlington
CONSULTING PROVIDER: C. Arnett, MD
REASON: Exertional chest pain, family hx of premature CAD

HISTORY & EXAM: 62yo F with 3-month hx of substernal chest
pressure on exertion, relieved by rest. BP 138/86, HR 78. Exam
unremarkable. EKG: NSR, nonspecific ST-T changes lateral leads.

ASSESSMENT: ASHD of native coronary artery with angina (I25.110)
Hyperlipidemia (E78.5)

PLAN:
- Atorvastatin 40 mg daily
- Metoprolol tartrate 25 mg BID
- ASA 81 mg daily
- Stress echo in 6 weeks
- F/U cardiology 8 weeks
Signed: C. Arnett, MD`,
    modelUsed: "claude-opus-4-7",
    isHero: true,
  },

  // 2. CRITICAL Lab — Priya Ramanathan
  {
    id: "FAX-20260423-002",
    receivedAt: ago(3),
    pages: 2,
    fromNumber: "972-465-0900",
    fromOrg: "Quest Diagnostics — Irving Metroplex Service Center",
    faxNumberTo: TPG_FAX,
    toClinic: "Pantego",
    status: "auto_routed",
    type: "lab_result",
    typeConfidence: 0.98,
    urgency: "critical",
    matchedPatientId: "PT-10051",
    matchConfidence: 0.98,
    candidates: [
      { patientId: "PT-10051", score: 0.98, reason: "Exact name + DOB match" },
    ],
    extracted: {
      sendingOrg: "Quest Diagnostics",
      documentDate: "2026-04-23",
      patientNameOnDoc: "Ramanathan, Priya",
      patientDobOnDoc: "11/03/1985",
      diagnoses: ["Hyperkalemia — critical value"],
      recommendations: [
        "STAT repeat BMP to rule out pseudohyperkalemia",
        "EKG to assess for peaked T waves / conduction changes",
        "Consider ED evaluation if persistent K+ > 6.0",
      ],
      urgency: "critical",
      summary:
        "Potassium 6.1 mmol/L — critical high. BUN/Cr mildly elevated. Notified on-call via SMS.",
    },
    routedTo: "P-002",
    routedReason:
      "Critical lab value — routed to PCP (Dr. Harbison) + SMS to on-call nurse per policy R-019.",
    ocrText: `QUEST DIAGNOSTICS - IRVING METROPLEX
BMP / Basic Metabolic Panel
Patient: RAMANATHAN, PRIYA   DOB: 11/03/1985
Collection: 04/23/2026 0742    Reported: 04/23/2026 1121
Ordering: A. Harbison DO

TEST                 RESULT     UNITS       REFERENCE     FLAG
Sodium               140        mmol/L      136-145
Potassium            6.1        mmol/L      3.5-5.1       *** CRITICAL HIGH ***
Chloride             103        mmol/L      98-107
CO2                  22         mmol/L      22-29
BUN                  22         mg/dL       7-20          HIGH
Creatinine           1.1        mg/dL       0.6-1.1
Glucose              96         mg/dL       70-99
Calcium              9.2        mg/dL       8.6-10.3

CRITICAL VALUE called to: A. Harbison (PCP) 04/23/2026 1124
Recommend repeat STAT; rule out hemolysis.`,
    modelUsed: "claude-sonnet-4-6",
  },

  // 3. Prior Auth Request — James Whitfield
  {
    id: "FAX-20260423-003",
    receivedAt: ago(26),
    pages: 3,
    fromNumber: "800-441-9188",
    fromOrg: "BCBS of Texas — Utilization Management",
    faxNumberTo: TPG_FAX,
    toClinic: "Arlington",
    status: "auto_routed",
    type: "prior_auth",
    typeConfidence: 0.94,
    urgency: "urgent",
    matchedPatientId: "PT-10048",
    matchConfidence: 0.97,
    candidates: [
      { patientId: "PT-10048", score: 0.97, reason: "Exact name + DOB + member ID match" },
    ],
    extracted: {
      sendingOrg: "BCBS of Texas",
      documentDate: "2026-04-22",
      patientNameOnDoc: "Whitfield, James",
      patientDobOnDoc: "03/22/1947",
      urgency: "urgent",
      icd10: ["M54.5"],
      cpt: ["72148"],
      summary:
        "PA request for MRI lumbar spine (CPT 72148) for low back pain (ICD M54.5). Clinical justification due by 04/27.",
    },
    routedTo: "agent:prior_auth",
    routedReason:
      "Payer PA request → Prior Auth agent. Clinical-notes draft generated and queued for Dr. Nguyen to sign.",
    ocrText: `BLUECROSS BLUESHIELD OF TEXAS
UTILIZATION MANAGEMENT
Fax: 800-441-9188 | Ref #: PA-2026-04-77193
04/22/2026

PROVIDER: Texas Physicians Group - Arlington
ORDERING: T. Nguyen, MD  NPI 1487293042
MEMBER: Whitfield, James   DOB 03/22/1947   ID BCBS-TX-883471209

REQUESTED SERVICE:
  MRI Lumbar Spine w/o contrast (CPT 72148)
  Dx: M54.5 Low back pain
  Proposed DOS: 05/01/2026

Clinical documentation required by 04/27/2026:
  [ ] History of conservative treatment (min 6 wks)
  [ ] Physical exam findings
  [ ] Imaging previously performed`,
    modelUsed: "claude-sonnet-4-6",
  },

  // 4. Inbound Referral — Robert "Bobby" Harlan
  {
    id: "FAX-20260423-004",
    receivedAt: ago(72),
    pages: 2,
    fromNumber: "817-548-2100",
    fromOrg: "Arlington Orthopedic Associates",
    faxNumberTo: TPG_FAX,
    toClinic: "Grand Prairie",
    status: "auto_routed",
    type: "referral",
    typeConfidence: 0.91,
    urgency: "routine",
    matchedPatientId: "PT-10059",
    matchConfidence: 0.94,
    candidates: [
      { patientId: "PT-10059", score: 0.94, reason: "Name + DOB match, MRN absent on doc" },
    ],
    extracted: {
      sendingProvider: "Kenneth Chun, DO",
      sendingOrg: "Arlington Orthopedic Associates",
      documentDate: "2026-04-22",
      patientNameOnDoc: "Harlan, Robert",
      patientDobOnDoc: "09/08/1955",
      diagnoses: ["Bilateral knee osteoarthritis (M17.0)"],
      recommendations: [
        "Schedule PCP new-patient visit within 2 weeks",
        "Co-manage HTN, CKD stage 3, type 2 diabetes",
      ],
      urgency: "routine",
      icd10: ["M17.0", "I10", "N18.3", "E11.9"],
      summary:
        "New patient referral for shared care of OA knees s/p intra-articular steroid injection. PCP to manage chronic comorbidities.",
    },
    routedTo: "agent:referrals",
    routedReason:
      "Inbound referral → Referrals agent. Healow slot held 05/07 10:30 AM w/ Dr. Varga; confirmation sent to referring office.",
    ocrText: `ARLINGTON ORTHOPEDIC ASSOCIATES
3500 MATLOCK RD, ARLINGTON TX 76015
P 817-548-2000   F 817-548-2100
Date: 04/22/2026
REFERRING PROVIDER: Kenneth Chun, DO
REFERRING TO: Texas Physicians Group, PCP of record
PATIENT: Robert ("Bobby") Harlan   DOB: 09/08/1955

Reason: Patient s/p bilateral IA steroid injections for advanced
OA of knees. Requires PCP to take on chronic care coordination
(HTN, CKD stage 3, type 2 DM) and to schedule PT follow-up.
Please see patient for new-patient visit within 2 weeks.`,
    modelUsed: "claude-haiku-4-5-20251001",
  },

  // 5. Records Request — Ashley Benavides
  {
    id: "FAX-20260423-005",
    receivedAt: ago(154),
    pages: 4,
    fromNumber: "214-871-2000",
    fromOrg: "Anderson & Hughes LLP, Attorneys at Law",
    faxNumberTo: TPG_FAX,
    toClinic: "Arlington",
    status: "auto_routed",
    type: "records_request",
    typeConfidence: 0.95,
    urgency: "routine",
    matchedPatientId: "PT-10067",
    matchConfidence: 0.96,
    candidates: [
      { patientId: "PT-10067", score: 0.96, reason: "Name + DOB + signed release match" },
    ],
    extracted: {
      sendingOrg: "Anderson & Hughes LLP",
      documentDate: "2026-04-22",
      patientNameOnDoc: "Benavides, Ashley",
      patientDobOnDoc: "02/19/1978",
      urgency: "routine",
      summary:
        "Complete medical records request 01/01/2022 to present. Patient HIPAA release attached. ROI fee not waived.",
    },
    routedTo: "agent:records",
    routedReason:
      "Records request → Records agent. ROI ticket created; HIPAA release verified; fee invoice drafted.",
    ocrText: `ANDERSON & HUGHES LLP
1801 MAIN ST, DALLAS TX 75202   P 214-871-2000
Date: 04/22/2026
Re: Benavides, Ashley  DOB: 02/19/1978
Our client: Ms. Benavides
To: Medical Records / Custodian of Records

Enclosed please find signed HIPAA authorization. Please provide
COMPLETE medical records from 01/01/2022 to present date, including
but not limited to: office notes, diagnostics, imaging, labs,
referrals, and medication lists. Invoice per state regulations.`,
    modelUsed: "claude-haiku-4-5-20251001",
  },

  // 6. Rx Refill — Hector Ibarra
  {
    id: "FAX-20260423-006",
    receivedAt: ago(240),
    pages: 1,
    fromNumber: "817-460-5500",
    fromOrg: "CVS Pharmacy #4215 — Arlington",
    faxNumberTo: TPG_FAX,
    toClinic: "Arlington",
    status: "auto_routed",
    type: "rx_refill",
    typeConfidence: 0.96,
    urgency: "routine",
    matchedPatientId: "PT-10092",
    matchConfidence: 0.97,
    candidates: [
      { patientId: "PT-10092", score: 0.97, reason: "Name + DOB match" },
    ],
    extracted: {
      sendingOrg: "CVS Pharmacy #4215",
      documentDate: "2026-04-23",
      patientNameOnDoc: "Ibarra, Hector",
      patientDobOnDoc: "04/11/1970",
      medications: ["Metformin 1000 mg tablet, 1 po BID, 90-day supply"],
      urgency: "routine",
      summary: "Refill authorization request for Metformin 1000 mg; last Rx 12/15/2025.",
    },
    routedTo: "agent:rx_refills",
    routedReason:
      "Refill request → Rx agent. Draft approval prepared for Dr. Nguyen's e-signature.",
    ocrText: `CVS PHARMACY #4215 - ARLINGTON
4201 E COOPER ST, ARLINGTON TX 76015   P 817-460-5500

REFILL AUTHORIZATION REQUEST    04/23/2026
PATIENT: Ibarra, Hector  DOB 04/11/1970
Rx #: 7821993-04  Drug: Metformin HCL 1000 mg TAB
Sig: TAKE ONE TABLET BY MOUTH TWICE DAILY
Qty: 180  Days Supply: 90  Refills Req: 3
Prescriber of record: T. Nguyen, MD
[ ] Approved   [ ] Denied   [ ] Change Therapy`,
    modelUsed: "claude-haiku-4-5-20251001",
  },

  // 7. HERO — GI Colonoscopy (Sonnet 4.6)
  {
    id: "FAX-20260423-007",
    receivedAt: ago(305),
    pages: 5,
    fromNumber: "214-645-8300",
    fromOrg: "UT Southwestern GI Associates",
    faxNumberTo: TPG_FAX,
    toClinic: "Pantego",
    status: "auto_routed",
    type: "specialist_consult",
    typeConfidence: 0.96,
    urgency: "routine",
    matchedPatientId: "PT-10088",
    matchConfidence: 0.97,
    candidates: [
      { patientId: "PT-10088", score: 0.97, reason: "Name + DOB + MRN match" },
    ],
    extracted: {
      sendingProvider: "Naveen Iyer, MD",
      sendingOrg: "UT Southwestern GI Associates",
      documentDate: "2026-04-18",
      patientNameOnDoc: "Sullivan, Margaret",
      patientDobOnDoc: "12/02/1968",
      patientMrnOnDoc: "MRN-004301",
      diagnoses: [
        "Tubular adenoma, sigmoid colon, 2 lesions resected (D12.5)",
        "Encounter for screening for malignant neoplasm of colon (Z12.11)",
      ],
      recommendations: [
        "Repeat screening colonoscopy in 5 years",
        "Continue age-appropriate cancer screening",
        "No dietary restriction",
      ],
      urgency: "routine",
      icd10: ["D12.5", "Z12.11"],
      cpt: ["45385"],
      summary:
        "Complete screening colonoscopy; 2 tubular adenomas resected; recommend 5-year repeat.",
    },
    routedTo: "P-002",
    routedReason: "Patient's PCP is Dr. Harbison; GI screening reports → PCP results inbox.",
    ocrText: `UT SOUTHWESTERN GI ASSOCIATES
5323 HARRY HINES BLVD, DALLAS TX 75390  F 214-645-8300
PROCEDURE REPORT    DOS: 04/18/2026
PATIENT: SULLIVAN, MARGARET "MAGGIE"   DOB 12/02/1968   MRN 004301
PROCEDURE: Screening colonoscopy (CPT 45385)
PROVIDER: N. Iyer, MD

FINDINGS:
- Cecum reached, prep adequate
- 2 tubular adenomas in sigmoid (6 mm, 4 mm) - resected via cold snare
- No other abnormal findings
IMPRESSION: Adenomatous polyps, both resected in toto
RECOMMENDATION: Repeat screening colonoscopy in 5 years`,
    modelUsed: "claude-sonnet-4-6",
    isHero: true,
  },

  // 8. Routine CMP — Daniel Okafor
  {
    id: "FAX-20260423-008",
    receivedAt: ago(405),
    pages: 2,
    fromNumber: "800-845-6167",
    fromOrg: "LabCorp",
    faxNumberTo: TPG_FAX,
    toClinic: "River Oaks",
    status: "auto_routed",
    type: "lab_result",
    typeConfidence: 0.99,
    urgency: "routine",
    matchedPatientId: "PT-10072",
    matchConfidence: 0.99,
    candidates: [
      { patientId: "PT-10072", score: 0.99, reason: "Exact name + DOB match" },
    ],
    extracted: {
      sendingOrg: "LabCorp",
      documentDate: "2026-04-22",
      patientNameOnDoc: "Okafor, Daniel",
      patientDobOnDoc: "06/30/1991",
      urgency: "routine",
      summary: "Comprehensive Metabolic Panel — all values within normal limits.",
    },
    routedTo: "P-004",
    routedReason: "PCP is Dr. O'Donnell; normal lab results auto-routed to results inbox.",
    ocrText: `LABCORP
COMPREHENSIVE METABOLIC PANEL
Patient: OKAFOR, DANIEL   DOB: 06/30/1991
Collection: 04/22/2026    Report: 04/22/2026

All results within reference ranges.
Sodium 139, Potassium 4.2, Creatinine 0.9, Glucose 88,
ALT 24, AST 22, Alk Phos 71, Bilirubin 0.6, Albumin 4.4

No action required.`,
    modelUsed: "claude-haiku-4-5-20251001",
  },

  // 9. Immigration Physical (I-693)
  {
    id: "FAX-20260423-009",
    receivedAt: ago(485),
    pages: 8,
    fromNumber: "214-655-5384",
    fromOrg: "USCIS Texas Service Center",
    faxNumberTo: TPG_FAX,
    toClinic: "Grand Prairie",
    status: "needs_review",
    type: "unknown",
    typeConfidence: 0.68,
    urgency: "routine",
    matchedPatientId: "PT-10103",
    matchConfidence: 0.82,
    candidates: [
      { patientId: "PT-10103", score: 0.82, reason: "Name match, DOB on doc partially obscured" },
    ],
    extracted: {
      sendingOrg: "USCIS Texas Service Center",
      documentDate: "2026-04-22",
      patientNameOnDoc: "Tanaka, Yuki",
      patientDobOnDoc: "10/25/1983",
      urgency: "routine",
      summary:
        "Returned I-693 with request for additional evidence — vaccination supplement page missing.",
    },
    routedTo: null,
    routedReason:
      "Document type 'USCIS I-693 correspondence' falls below 0.80 classification confidence. Routed to human review for operator confirmation.",
    ocrText: `U.S. CITIZENSHIP AND IMMIGRATION SERVICES
TEXAS SERVICE CENTER
RE: Form I-693, Report of Medical Examination and Vaccination Record
Case #: MSC-2026-046-8824

Applicant: TANAKA, YUKI   DOB: 10/25/1983
Civil Surgeon: Texas Physicians Group - Grand Prairie

REQUEST FOR ADDITIONAL EVIDENCE:
Missing supplement 2 - Vaccination record. Please resubmit
completed form within 87 days.`,
    modelUsed: "claude-sonnet-4-6",
  },

  // 10. Low-confidence / failed match
  {
    id: "FAX-20260423-010",
    receivedAt: ago(660),
    pages: 1,
    fromNumber: "Unknown",
    fromOrg: "Unreadable sender",
    faxNumberTo: TPG_FAX,
    toClinic: "Unknown",
    status: "needs_review",
    type: "unknown",
    typeConfidence: 0.52,
    urgency: "routine",
    matchedPatientId: null,
    matchConfidence: null,
    candidates: [
      { patientId: "PT-10088", score: 0.61, reason: "Partial name match; DOB illegible" },
      { patientId: "PT-10168", score: 0.34, reason: "Last-name substring match only" },
    ],
    extracted: {
      documentDate: undefined,
      patientNameOnDoc: "M_RG_RET ?ULLIV_N",
      summary:
        "Poor scan quality — sender header illegible, patient DOB blurred. Likely pharmacy communication.",
    },
    routedTo: null,
    routedReason:
      "Classification confidence 0.52 < threshold 0.80. Sent to review queue with best-guess patient candidates attached.",
    ocrText: `?? PHARMACY SERVICES ??
[illegible header]
Patient: M_RG_RET ?ULLIV_N  DOB: ??/??/????
Rx: [partial - scan rotation detected]
Please confirm patient identity and fax back.`,
    modelUsed: "claude-sonnet-4-6",
  },

  // 11. Imaging Report — Fatima Al-Rashid
  {
    id: "FAX-20260423-011",
    receivedAt: ago(780),
    pages: 3,
    fromNumber: "817-275-4100",
    fromOrg: "Arlington Diagnostic Imaging",
    faxNumberTo: TPG_FAX,
    toClinic: "River Oaks",
    status: "auto_routed",
    type: "imaging_report",
    typeConfidence: 0.95,
    urgency: "routine",
    matchedPatientId: "PT-10124",
    matchConfidence: 0.98,
    candidates: [
      { patientId: "PT-10124", score: 0.98, reason: "Exact name + DOB + MRN match" },
    ],
    extracted: {
      sendingOrg: "Arlington Diagnostic Imaging",
      documentDate: "2026-04-22",
      patientNameOnDoc: "Al-Rashid, Fatima",
      patientDobOnDoc: "08/07/1979",
      patientMrnOnDoc: "MRN-004378",
      urgency: "routine",
      summary:
        "CT Abdomen/Pelvis w/ contrast — no acute findings; stable 5 mm hepatic cyst.",
    },
    routedTo: "P-004",
    routedReason: "PCP is Dr. O'Donnell; imaging reports auto-routed to PCP results inbox.",
    ocrText: `ARLINGTON DIAGNOSTIC IMAGING
CT ABDOMEN/PELVIS WITH IV CONTRAST
Patient: AL-RASHID, FATIMA   DOB 08/07/1979   MRN 004378
DOS: 04/22/2026    Radiologist: J. Patel, MD

FINDINGS: Liver with 5 mm hypodense lesion, segment VI,
unchanged from prior (04/2024). No bowel obstruction.
No free fluid. Kidneys symmetric, no hydronephrosis.
IMPRESSION: No acute abdominal/pelvic process.
Stable hepatic cyst.`,
    modelUsed: "claude-haiku-4-5-20251001",
  },

  // 12. PA Approval — Willis McGraw
  {
    id: "FAX-20260423-012",
    receivedAt: ago(900),
    pages: 1,
    fromNumber: "800-441-9188",
    fromOrg: "BCBS of Texas — Utilization Management",
    faxNumberTo: TPG_FAX,
    toClinic: "Pantego",
    status: "completed",
    type: "prior_auth",
    typeConfidence: 0.99,
    urgency: "routine",
    matchedPatientId: "PT-10131",
    matchConfidence: 0.98,
    candidates: [
      { patientId: "PT-10131", score: 0.98, reason: "Member ID + name match" },
    ],
    extracted: {
      sendingOrg: "BCBS of Texas",
      documentDate: "2026-04-22",
      patientNameOnDoc: "McGraw, Willis",
      patientDobOnDoc: "05/29/1944",
      urgency: "routine",
      cpt: ["73721"],
      summary:
        "PA approved — MRI Right Knee (CPT 73721). Auth BCBS-2026-04-118724. Valid 60 days.",
    },
    routedTo: "agent:prior_auth",
    routedReason:
      "PA approval → Prior Auth agent → eCW chart write-back complete. Patient notification queued.",
    ocrText: `BLUECROSS BLUESHIELD OF TEXAS - UM
AUTHORIZATION APPROVED    04/22/2026
Auth #: BCBS-2026-04-118724
Member: MCGRAW, WILLIS   DOB 05/29/1944
Service: MRI Right Knee (CPT 73721)
Valid: 04/22/2026 through 06/21/2026
Provider: Texas Physicians Group`,
    modelUsed: "claude-haiku-4-5-20251001",
  },

  // 13. Nephrology follow-up — Derrick Boon
  {
    id: "FAX-20260423-013",
    receivedAt: ago(1080),
    pages: 3,
    fromNumber: "214-358-2300",
    fromOrg: "Dallas Nephrology Associates",
    faxNumberTo: TPG_FAX,
    toClinic: "Grand Prairie",
    status: "auto_routed",
    type: "specialist_consult",
    typeConfidence: 0.93,
    urgency: "routine",
    matchedPatientId: "PT-10152",
    matchConfidence: 0.96,
    candidates: [
      { patientId: "PT-10152", score: 0.96, reason: "Name + DOB match" },
    ],
    extracted: {
      sendingProvider: "Sheila Karim, MD",
      sendingOrg: "Dallas Nephrology Associates",
      documentDate: "2026-04-21",
      patientNameOnDoc: "Boon, Derrick",
      patientDobOnDoc: "09/03/1960",
      diagnoses: ["CKD stage 3B (N18.32)", "Type 2 diabetes mellitus (E11.9)"],
      recommendations: [
        "Continue ACE-i (lisinopril 20 mg)",
        "Annual renal ultrasound",
        "Quarterly BMP + UACR",
      ],
      urgency: "routine",
      icd10: ["N18.32", "E11.9"],
      summary:
        "Stable CKD stage 3B; no intervention needed. PCP to continue ACE-i and annual surveillance.",
    },
    routedTo: "P-001",
    routedReason: "PCP is Dr. Nguyen; nephrology follow-ups routed to PCP results inbox.",
    ocrText: `DALLAS NEPHROLOGY ASSOCIATES
F 214-358-2300    Date: 04/21/2026
FOLLOW-UP NOTE
PATIENT: BOON, DERRICK   DOB 09/03/1960
PROVIDER: S. Karim, MD

IMPRESSION: CKD 3B (eGFR 42), stable vs prior. T2DM, controlled.
Plan: Continue lisinopril 20 mg. Quarterly BMP/UACR. Annual
renal US. Next visit in 6 months unless eGFR <35.`,
    modelUsed: "claude-haiku-4-5-20251001",
  },

  // 14. Thyroid abnormal — Sofia Castellanos (urgent)
  {
    id: "FAX-20260423-014",
    receivedAt: ago(1320),
    pages: 2,
    fromNumber: "972-465-0900",
    fromOrg: "Quest Diagnostics",
    faxNumberTo: TPG_FAX,
    toClinic: "Arlington",
    status: "auto_routed",
    type: "lab_result",
    typeConfidence: 0.97,
    urgency: "routine",
    matchedPatientId: "PT-10147",
    matchConfidence: 0.98,
    candidates: [
      { patientId: "PT-10147", score: 0.98, reason: "Exact name + DOB match" },
    ],
    extracted: {
      sendingOrg: "Quest Diagnostics",
      documentDate: "2026-04-22",
      patientNameOnDoc: "Castellanos, Sofia",
      patientDobOnDoc: "11/14/1995",
      urgency: "routine",
      diagnoses: ["Abnormal thyroid function — PCP review"],
      recommendations: [
        "Repeat TSH + Free T4 in 4–6 weeks to confirm",
        "Consider TSI + thyroid ultrasound if persistently abnormal",
        "Outpatient endocrinology referral (non-urgent)",
      ],
      summary:
        "TSH 0.18, Free T4 2.8 — consistent with mild-to-moderate hyperthyroidism. Routine PCP follow-up; not time-critical.",
    },
    routedTo: "P-002",
    routedReason:
      "PCP is Dr. Harbison; abnormal thyroid panel flagged urgent — endocrine referral suggested.",
    ocrText: `QUEST DIAGNOSTICS
THYROID FUNCTION PANEL
Patient: CASTELLANOS, SOFIA   DOB 11/14/1995
Collection: 04/22/2026   Report: 04/22/2026

TSH                  0.18 uIU/mL    (0.40-4.50)   LOW
Free T4              2.8 ng/dL      (0.8-1.8)     HIGH
Free T3              5.6 pg/mL      (2.3-4.2)     HIGH
Impression consistent with primary hyperthyroidism.
Suggest TSI, thyroid US, endocrinology referral.`,
    modelUsed: "claude-sonnet-4-6",
  },

  // 15. Inbound Referral — Angela Fritz
  {
    id: "FAX-20260423-015",
    receivedAt: ago(1680),
    pages: 2,
    fromNumber: "817-923-4400",
    fromOrg: "Tarrant Orthopedic Associates",
    faxNumberTo: TPG_FAX,
    toClinic: "Arlington",
    status: "auto_routed",
    type: "referral",
    typeConfidence: 0.93,
    urgency: "routine",
    matchedPatientId: "PT-10168",
    matchConfidence: 0.95,
    candidates: [
      { patientId: "PT-10168", score: 0.95, reason: "Name + DOB + phone match" },
    ],
    extracted: {
      sendingProvider: "Dorian Patel, MD",
      sendingOrg: "Tarrant Orthopedic Associates",
      documentDate: "2026-04-22",
      patientNameOnDoc: "Fritz, Angela",
      patientDobOnDoc: "03/17/1972",
      diagnoses: ["s/p Right TKA 03/2026", "HTN (I10)"],
      recommendations: ["PCP to manage HTN", "Coordinate PT"],
      urgency: "routine",
      summary:
        "Post-op referral for HTN co-management after right TKA; schedule PCP f/u within 3 weeks.",
    },
    routedTo: "agent:referrals",
    routedReason:
      "Inbound referral → Referrals agent. Healow slot held for 05/08 1:45 PM with Dr. Harbison.",
    ocrText: `TARRANT ORTHOPEDIC ASSOCIATES
F 817-923-4400    04/22/2026
REFERRAL
Patient: FRITZ, ANGELA  DOB 03/17/1972
Referring: D. Patel, MD   Reason: s/p R TKA 03/2026
Need: PCP assumes HTN management; PT coordination

Please schedule new-patient visit within 3 weeks.`,
    modelUsed: "claude-haiku-4-5-20251001",
  },
];

export function getFaxById(id: string): Fax | undefined {
  return faxes.find((f) => f.id === id);
}

export function getFaxesByAgent(key: string): Fax[] {
  switch (key) {
    case "referrals":
      return faxes.filter((f) => f.type === "referral");
    case "prior_auth":
      return faxes.filter((f) => f.type === "prior_auth");
    case "lab_results":
      return faxes.filter((f) => f.type === "lab_result");
    case "rx_refills":
      return faxes.filter((f) => f.type === "rx_refill");
    case "records":
      return faxes.filter((f) => f.type === "records_request");
    default:
      return [];
  }
}

// Build a canonical event log from every fax for the Audit page.
export function buildAuditEvents(): FaxEvent[] {
  const events: FaxEvent[] = [];
  for (const f of faxes) {
    const t0 = new Date(f.receivedAt).getTime();
    events.push({
      id: `${f.id}:received`,
      faxId: f.id,
      at: new Date(t0).toISOString(),
      kind: "received",
      actor: "system",
      detail: `Fax received from ${f.fromOrg} (${f.pages} pages)`,
    });
    events.push({
      id: `${f.id}:ocr`,
      faxId: f.id,
      at: new Date(t0 + 14_000).toISOString(),
      kind: "ocr",
      actor: "system",
      detail: "OCR extracted text (Tesseract + layout analysis)",
      latencyMs: 14_000,
    });
    events.push({
      id: `${f.id}:classified`,
      faxId: f.id,
      at: new Date(t0 + 18_000).toISOString(),
      kind: "classified",
      actor: "claude",
      detail: `Classified as ${f.type.replace("_", " ")} (${Math.round(f.typeConfidence * 100)}% confidence)`,
      model: f.modelUsed,
      latencyMs: 1_900,
      tokensIn: Math.floor(f.pages * 520 + 800),
      tokensOut: 320,
    });
    if (f.matchedPatientId) {
      events.push({
        id: `${f.id}:matched`,
        faxId: f.id,
        at: new Date(t0 + 22_000).toISOString(),
        kind: "matched",
        actor: "system",
        detail: `Matched to patient (${Math.round((f.matchConfidence ?? 0) * 100)}% confidence)`,
      });
    }
    events.push({
      id: `${f.id}:extracted`,
      faxId: f.id,
      at: new Date(t0 + 26_000).toISOString(),
      kind: "extracted",
      actor: "claude",
      detail: "Structured fields extracted (provider, Dx, Rx, recommendations)",
      model: f.modelUsed,
      latencyMs: 2_200,
      tokensIn: Math.floor(f.pages * 520 + 800),
      tokensOut: 680,
    });
    if (f.routedTo) {
      events.push({
        id: `${f.id}:routed`,
        faxId: f.id,
        at: new Date(t0 + 30_000).toISOString(),
        kind: "routed",
        actor: "system",
        detail: `Routed to ${f.routedTo}`,
      });
    } else {
      events.push({
        id: `${f.id}:flagged`,
        faxId: f.id,
        at: new Date(t0 + 30_000).toISOString(),
        kind: "flagged",
        actor: "system",
        detail: "Below confidence threshold — sent to Review Queue",
      });
    }
    if (f.status === "completed") {
      events.push({
        id: `${f.id}:written_back`,
        faxId: f.id,
        at: new Date(t0 + 42_000).toISOString(),
        kind: "written_back",
        actor: "integration:ecw",
        detail: "Attached to patient chart in eClinicalWorks + encounter note added",
      });
    }
  }
  return events.sort((a, b) => (a.at < b.at ? 1 : -1));
}
