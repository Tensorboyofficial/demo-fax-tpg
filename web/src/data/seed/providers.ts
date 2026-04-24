import type { Provider } from "@/shared/types";

export const providers: Provider[] = [
  {
    id: "P-001",
    name: "Todd Thang Nguyen, MD",
    title: "MD",
    specialty: "Internal Medicine",
    clinic: "Arlington",
    npi: "1487293042",
  },
  {
    id: "P-002",
    name: "Alicia Harbison, DO",
    title: "DO",
    specialty: "Family Practice",
    clinic: "Pantego",
    npi: "1578392410",
  },
  {
    id: "P-003",
    name: "Elena Varga, MD",
    title: "MD",
    specialty: "Internal Medicine",
    clinic: "Grand Prairie",
    npi: "1635819304",
  },
  {
    id: "P-004",
    name: "Marcus O'Donnell, MD",
    title: "MD",
    specialty: "Family Practice",
    clinic: "River Oaks",
    npi: "1729410385",
  },
];

export function getProviderById(id: string | null): Provider | undefined {
  if (!id) return undefined;
  return providers.find((p) => p.id === id);
}
