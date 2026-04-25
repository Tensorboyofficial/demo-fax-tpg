/**
 * Structured lab result data for hierarchical spreadsheet view.
 * Each fax contains panels, and each panel contains individual tests.
 */

export interface LabTest {
  name: string;
  value: string;
  unit: string;
  range: string;
  flag: "" | "H" | "L" | "HH" | "LL";
  confidence: number;
}

export interface LabPanel {
  name: string;
  collectedDate: string;
  tests: LabTest[];
}

export interface LabFaxData {
  faxId: string;
  patientId: string;
  lastName: string;
  firstName: string;
  middleInitial: string;
  dob: string;
  provider: string;
  lab: string;
  panels: LabPanel[];
  state: "unopened" | "opened" | "archived" | "needs_review";
  confidence: number;
}

export const LAB_RESULTS: LabFaxData[] = [
  {
    faxId: "FAX-20260423-001",
    patientId: "PT-10042",
    lastName: "Nguyen",
    firstName: "Thi",
    middleInitial: "M",
    dob: "1958-03-14",
    provider: "Dr. Todd Nguyen",
    lab: "Quest Diagnostics",
    panels: [
      {
        name: "Comprehensive Metabolic Panel",
        collectedDate: "2026-04-20",
        tests: [
          { name: "Glucose", value: "142", unit: "mg/dL", range: "70-100", flag: "H", confidence: 0.98 },
          { name: "BUN", value: "22", unit: "mg/dL", range: "7-20", flag: "H", confidence: 0.97 },
          { name: "Creatinine", value: "1.1", unit: "mg/dL", range: "0.7-1.3", flag: "", confidence: 0.99 },
          { name: "eGFR", value: "68", unit: "mL/min", range: ">60", flag: "", confidence: 0.96 },
          { name: "Sodium", value: "139", unit: "mEq/L", range: "136-145", flag: "", confidence: 0.99 },
          { name: "Potassium", value: "5.3", unit: "mEq/L", range: "3.5-5.0", flag: "H", confidence: 0.98 },
          { name: "Chloride", value: "101", unit: "mEq/L", range: "98-106", flag: "", confidence: 0.99 },
          { name: "CO2", value: "24", unit: "mEq/L", range: "23-29", flag: "", confidence: 0.97 },
          { name: "Calcium", value: "9.4", unit: "mg/dL", range: "8.5-10.5", flag: "", confidence: 0.98 },
          { name: "Total Protein", value: "7.0", unit: "g/dL", range: "6.0-8.3", flag: "", confidence: 0.96 },
          { name: "Albumin", value: "3.2", unit: "g/dL", range: "3.5-5.0", flag: "L", confidence: 0.97 },
          { name: "Bilirubin, Total", value: "0.8", unit: "mg/dL", range: "0.1-1.2", flag: "", confidence: 0.98 },
          { name: "ALT", value: "28", unit: "U/L", range: "7-56", flag: "", confidence: 0.99 },
          { name: "AST", value: "32", unit: "U/L", range: "10-40", flag: "", confidence: 0.99 },
          { name: "Alk Phos", value: "72", unit: "U/L", range: "44-147", flag: "", confidence: 0.97 },
        ],
      },
      {
        name: "Lipid Panel",
        collectedDate: "2026-04-20",
        tests: [
          { name: "Total Cholesterol", value: "238", unit: "mg/dL", range: "<200", flag: "H", confidence: 0.98 },
          { name: "HDL Cholesterol", value: "42", unit: "mg/dL", range: ">40", flag: "", confidence: 0.97 },
          { name: "LDL Cholesterol", value: "162", unit: "mg/dL", range: "<100", flag: "HH", confidence: 0.96 },
          { name: "Triglycerides", value: "170", unit: "mg/dL", range: "<150", flag: "H", confidence: 0.98 },
          { name: "VLDL", value: "34", unit: "mg/dL", range: "5-40", flag: "", confidence: 0.95 },
        ],
      },
    ],
    state: "needs_review",
    confidence: 0.97,
  },
  {
    faxId: "FAX-20260423-003",
    patientId: "PT-10038",
    lastName: "Kowalski",
    firstName: "Jan",
    middleInitial: "P",
    dob: "1972-11-22",
    provider: "Dr. Sarah Chen",
    lab: "LabCorp",
    panels: [
      {
        name: "CBC with Differential",
        collectedDate: "2026-04-19",
        tests: [
          { name: "WBC", value: "11.8", unit: "K/uL", range: "4.5-11.0", flag: "H", confidence: 0.99 },
          { name: "RBC", value: "4.52", unit: "M/uL", range: "4.50-5.90", flag: "", confidence: 0.98 },
          { name: "Hemoglobin", value: "13.8", unit: "g/dL", range: "13.5-17.5", flag: "", confidence: 0.99 },
          { name: "Hematocrit", value: "41.2", unit: "%", range: "38.8-50.0", flag: "", confidence: 0.98 },
          { name: "MCV", value: "91.2", unit: "fL", range: "80.0-100.0", flag: "", confidence: 0.97 },
          { name: "MCH", value: "30.5", unit: "pg", range: "27.0-33.0", flag: "", confidence: 0.96 },
          { name: "MCHC", value: "33.5", unit: "g/dL", range: "32.0-36.0", flag: "", confidence: 0.97 },
          { name: "Platelets", value: "142", unit: "K/uL", range: "150-400", flag: "L", confidence: 0.98 },
          { name: "Neutrophils", value: "78", unit: "%", range: "40-70", flag: "H", confidence: 0.96 },
          { name: "Lymphocytes", value: "14", unit: "%", range: "20-40", flag: "L", confidence: 0.97 },
          { name: "Monocytes", value: "6", unit: "%", range: "2-8", flag: "", confidence: 0.95 },
          { name: "Eosinophils", value: "1", unit: "%", range: "1-4", flag: "", confidence: 0.94 },
          { name: "Basophils", value: "1", unit: "%", range: "0-1", flag: "", confidence: 0.94 },
        ],
      },
    ],
    state: "unopened",
    confidence: 0.98,
  },
  {
    faxId: "FAX-20260423-005",
    patientId: "PT-10045",
    lastName: "Martinez",
    firstName: "Elena",
    middleInitial: "R",
    dob: "1965-07-08",
    provider: "Dr. Todd Nguyen",
    lab: "Quest Diagnostics",
    panels: [
      {
        name: "Thyroid Panel",
        collectedDate: "2026-04-18",
        tests: [
          { name: "TSH", value: "8.42", unit: "uIU/mL", range: "0.27-4.20", flag: "HH", confidence: 0.99 },
          { name: "Free T4", value: "0.62", unit: "ng/dL", range: "0.93-1.70", flag: "L", confidence: 0.98 },
          { name: "Free T3", value: "2.1", unit: "pg/mL", range: "2.0-4.4", flag: "", confidence: 0.97 },
          { name: "T4, Total", value: "4.8", unit: "ug/dL", range: "4.5-12.0", flag: "", confidence: 0.96 },
        ],
      },
      {
        name: "HbA1c",
        collectedDate: "2026-04-18",
        tests: [
          { name: "Hemoglobin A1c", value: "7.8", unit: "%", range: "<5.7", flag: "HH", confidence: 0.99 },
          { name: "eAG", value: "177", unit: "mg/dL", range: "<117", flag: "H", confidence: 0.98 },
        ],
      },
    ],
    state: "needs_review",
    confidence: 0.96,
  },
  {
    faxId: "FAX-20260423-006",
    patientId: "PT-10051",
    lastName: "Thompson",
    firstName: "Robert",
    middleInitial: "J",
    dob: "1948-01-30",
    provider: "Dr. Sarah Chen",
    lab: "LabCorp",
    panels: [
      {
        name: "Basic Metabolic Panel",
        collectedDate: "2026-04-21",
        tests: [
          { name: "Glucose", value: "94", unit: "mg/dL", range: "70-100", flag: "", confidence: 0.99 },
          { name: "BUN", value: "18", unit: "mg/dL", range: "7-20", flag: "", confidence: 0.98 },
          { name: "Creatinine", value: "1.8", unit: "mg/dL", range: "0.7-1.3", flag: "H", confidence: 0.99 },
          { name: "eGFR", value: "38", unit: "mL/min", range: ">60", flag: "LL", confidence: 0.97 },
          { name: "Sodium", value: "141", unit: "mEq/L", range: "136-145", flag: "", confidence: 0.99 },
          { name: "Potassium", value: "4.8", unit: "mEq/L", range: "3.5-5.0", flag: "", confidence: 0.98 },
          { name: "Chloride", value: "103", unit: "mEq/L", range: "98-106", flag: "", confidence: 0.99 },
          { name: "CO2", value: "22", unit: "mEq/L", range: "23-29", flag: "L", confidence: 0.96 },
        ],
      },
      {
        name: "PSA",
        collectedDate: "2026-04-21",
        tests: [
          { name: "PSA, Total", value: "2.4", unit: "ng/mL", range: "0-4.0", flag: "", confidence: 0.98 },
          { name: "PSA, Free", value: "0.72", unit: "ng/mL", range: "", flag: "", confidence: 0.95 },
          { name: "% Free PSA", value: "30", unit: "%", range: ">25", flag: "", confidence: 0.94 },
        ],
      },
    ],
    state: "opened",
    confidence: 0.97,
  },
  {
    faxId: "FAX-20260423-007",
    patientId: "PT-10033",
    lastName: "Williams",
    firstName: "Carol",
    middleInitial: "A",
    dob: "1970-09-12",
    provider: "Dr. Todd Nguyen",
    lab: "Quest Diagnostics",
    panels: [
      {
        name: "Iron Studies",
        collectedDate: "2026-04-17",
        tests: [
          { name: "Iron", value: "32", unit: "ug/dL", range: "60-170", flag: "LL", confidence: 0.98 },
          { name: "TIBC", value: "450", unit: "ug/dL", range: "250-370", flag: "H", confidence: 0.97 },
          { name: "Ferritin", value: "8", unit: "ng/mL", range: "12-150", flag: "L", confidence: 0.99 },
          { name: "Transferrin Sat", value: "7", unit: "%", range: "20-50", flag: "LL", confidence: 0.96 },
        ],
      },
      {
        name: "Vitamin Panel",
        collectedDate: "2026-04-17",
        tests: [
          { name: "Vitamin D, 25-OH", value: "18", unit: "ng/mL", range: "30-100", flag: "L", confidence: 0.97 },
          { name: "Vitamin B12", value: "380", unit: "pg/mL", range: "200-900", flag: "", confidence: 0.96 },
          { name: "Folate", value: "12.4", unit: "ng/mL", range: ">5.4", flag: "", confidence: 0.95 },
        ],
      },
    ],
    state: "needs_review",
    confidence: 0.95,
  },
  {
    faxId: "FAX-20260423-009",
    patientId: "PT-10028",
    lastName: "Patel",
    firstName: "Arun",
    middleInitial: "K",
    dob: "1982-05-03",
    provider: "Dr. Sarah Chen",
    lab: "BioReference",
    panels: [
      {
        name: "Hepatic Function Panel",
        collectedDate: "2026-04-22",
        tests: [
          { name: "ALT", value: "82", unit: "U/L", range: "7-56", flag: "H", confidence: 0.99 },
          { name: "AST", value: "68", unit: "U/L", range: "10-40", flag: "H", confidence: 0.99 },
          { name: "Alk Phos", value: "95", unit: "U/L", range: "44-147", flag: "", confidence: 0.98 },
          { name: "Bilirubin, Total", value: "1.4", unit: "mg/dL", range: "0.1-1.2", flag: "H", confidence: 0.97 },
          { name: "Bilirubin, Direct", value: "0.4", unit: "mg/dL", range: "0.0-0.3", flag: "H", confidence: 0.96 },
          { name: "Albumin", value: "3.8", unit: "g/dL", range: "3.5-5.0", flag: "", confidence: 0.98 },
          { name: "Total Protein", value: "7.2", unit: "g/dL", range: "6.0-8.3", flag: "", confidence: 0.97 },
          { name: "GGT", value: "124", unit: "U/L", range: "9-48", flag: "HH", confidence: 0.98 },
        ],
      },
    ],
    state: "unopened",
    confidence: 0.98,
  },
  {
    faxId: "FAX-20260423-010",
    patientId: "PT-10055",
    lastName: "Garcia",
    firstName: "Maria",
    middleInitial: "L",
    dob: "1990-12-25",
    provider: "Dr. Todd Nguyen",
    lab: "Quest Diagnostics",
    panels: [
      {
        name: "Urinalysis",
        collectedDate: "2026-04-22",
        tests: [
          { name: "Color", value: "Yellow", unit: "", range: "Yellow", flag: "", confidence: 0.94 },
          { name: "Appearance", value: "Hazy", unit: "", range: "Clear", flag: "H", confidence: 0.92 },
          { name: "pH", value: "6.0", unit: "", range: "5.0-8.0", flag: "", confidence: 0.96 },
          { name: "Specific Gravity", value: "1.025", unit: "", range: "1.005-1.030", flag: "", confidence: 0.97 },
          { name: "Protein", value: "Trace", unit: "", range: "Negative", flag: "H", confidence: 0.93 },
          { name: "Glucose", value: "Negative", unit: "", range: "Negative", flag: "", confidence: 0.95 },
          { name: "WBC", value: "10-20", unit: "/HPF", range: "0-5", flag: "H", confidence: 0.96 },
          { name: "Bacteria", value: "Moderate", unit: "", range: "None", flag: "H", confidence: 0.91 },
        ],
      },
    ],
    state: "opened",
    confidence: 0.93,
  },
  {
    faxId: "FAX-20260423-002",
    patientId: "PT-10061",
    lastName: "Anderson",
    firstName: "James",
    middleInitial: "T",
    dob: "1955-04-18",
    provider: "Dr. Sarah Chen",
    lab: "LabCorp",
    panels: [
      {
        name: "Coagulation Panel",
        collectedDate: "2026-04-20",
        tests: [
          { name: "PT", value: "14.2", unit: "sec", range: "11.0-13.5", flag: "H", confidence: 0.98 },
          { name: "INR", value: "1.3", unit: "", range: "0.8-1.1", flag: "H", confidence: 0.99 },
          { name: "PTT", value: "32", unit: "sec", range: "25-35", flag: "", confidence: 0.97 },
          { name: "Fibrinogen", value: "280", unit: "mg/dL", range: "200-400", flag: "", confidence: 0.96 },
        ],
      },
    ],
    state: "archived",
    confidence: 0.97,
  },
  {
    faxId: "FAX-20260423-008",
    patientId: "PT-10047",
    lastName: "Kim",
    firstName: "Soo-Jin",
    middleInitial: "",
    dob: "1978-08-14",
    provider: "Dr. Todd Nguyen",
    lab: "Quest Diagnostics",
    panels: [
      {
        name: "Comprehensive Metabolic Panel",
        collectedDate: "2026-04-21",
        tests: [
          { name: "Glucose", value: "88", unit: "mg/dL", range: "70-100", flag: "", confidence: 0.99 },
          { name: "BUN", value: "15", unit: "mg/dL", range: "7-20", flag: "", confidence: 0.98 },
          { name: "Creatinine", value: "0.9", unit: "mg/dL", range: "0.7-1.3", flag: "", confidence: 0.99 },
          { name: "Sodium", value: "140", unit: "mEq/L", range: "136-145", flag: "", confidence: 0.99 },
          { name: "Potassium", value: "4.1", unit: "mEq/L", range: "3.5-5.0", flag: "", confidence: 0.98 },
          { name: "Calcium", value: "9.6", unit: "mg/dL", range: "8.5-10.5", flag: "", confidence: 0.97 },
          { name: "ALT", value: "22", unit: "U/L", range: "7-56", flag: "", confidence: 0.99 },
          { name: "AST", value: "25", unit: "U/L", range: "10-40", flag: "", confidence: 0.99 },
        ],
      },
    ],
    state: "archived",
    confidence: 0.99,
  },
  {
    faxId: "FAX-20260423-004",
    patientId: "PT-10039",
    lastName: "Davis",
    firstName: "Patricia",
    middleInitial: "E",
    dob: "1960-02-28",
    provider: "Dr. Sarah Chen",
    lab: "LabCorp",
    panels: [
      {
        name: "Cardiac Biomarkers",
        collectedDate: "2026-04-19",
        tests: [
          { name: "Troponin I", value: "0.04", unit: "ng/mL", range: "<0.04", flag: "H", confidence: 0.99 },
          { name: "BNP", value: "482", unit: "pg/mL", range: "<100", flag: "HH", confidence: 0.98 },
          { name: "CK-MB", value: "8.2", unit: "ng/mL", range: "0-5.0", flag: "H", confidence: 0.97 },
          { name: "CK, Total", value: "220", unit: "U/L", range: "30-200", flag: "H", confidence: 0.96 },
          { name: "Myoglobin", value: "95", unit: "ng/mL", range: "25-58", flag: "H", confidence: 0.95 },
        ],
      },
    ],
    state: "needs_review",
    confidence: 0.97,
  },
];
