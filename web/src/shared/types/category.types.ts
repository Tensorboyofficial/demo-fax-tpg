import type { FaxType } from "@/shared/constants";

/** Per-category configuration (PRD section 4.4) */
export interface CategoryConfig {
  category: FaxType;
  label: string;
  confident_match_threshold: number;   // e.g. 0.95
  review_threshold: number;            // e.g. 0.70
  always_human_review: boolean;        // some categories always need human eyes
  route_to_queue: string;              // e.g. "labs_review", "front_desk"
  splittable: boolean;                 // EOBs can be split into per-patient children
  schema_key: string;                  // pointer to extraction schema file
  component_weights: Record<string, number>;  // matching weights per component
}

/** Extraction schema field definition (for Schema Builder) */
export interface SchemaField {
  name: string;
  type: "text" | "date" | "number" | "boolean" | "object" | "array" | "select";
  required?: boolean;
  description?: string;
  enum_values?: string[];
  children?: SchemaField[];           // for nested objects/arrays
}

/** Full extraction schema */
export interface ExtractionSchema {
  category: string;
  version: number;
  fields: SchemaField[];
}
