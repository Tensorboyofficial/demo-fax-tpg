export interface Integration {
  id: string;
  name: string;
  category:
    | "EHR"
    | "Scheduling"
    | "Telehealth"
    | "Billing"
    | "Pharmacy"
    | "Labs"
    | "Messaging";
  connected: boolean;
  last_sync?: string;
  logoInitial: string;
  note?: string;
}
