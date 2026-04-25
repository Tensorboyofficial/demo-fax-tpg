import { patients } from "@/data/seed/patients";
import { PatientRoster } from "@/frontend/components/features/patient/patient-roster";

export const metadata = { title: "Patients · Cevi" };

export default function PatientsPage() {
  return <PatientRoster seedPatients={patients} />;
}
