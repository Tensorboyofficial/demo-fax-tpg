import { readFileSync } from "fs";
import { join } from "path";
import type { SchemaCategory } from "@/shared/constants";

const SCHEMAS_DIR = join(process.cwd(), "src/data/schemas");

const schemaCache = new Map<string, string>();

/**
 * Load a category-specific JSON schema as a string for inclusion in
 * the Claude extraction prompt. Caches after first read.
 */
export function loadCategorySchema(category: SchemaCategory): string {
  const cached = schemaCache.get(category);
  if (cached) return cached;

  const filePath = join(SCHEMAS_DIR, `${category}.schema.json`);
  try {
    const raw = readFileSync(filePath, "utf-8");
    // Strip $schema/$id meta-fields to save tokens — Claude doesn't need them
    const parsed = JSON.parse(raw);
    delete parsed.$schema;
    delete parsed.$id;
    const compact = JSON.stringify(parsed, null, 2);
    schemaCache.set(category, compact);
    return compact;
  } catch {
    // Fallback: return a minimal schema so extraction still works
    const fallback = JSON.stringify(
      {
        title: `Cevi AI - ${category}`,
        type: "object",
        properties: {
          document_category: { type: "string", const: category },
          patient: {
            type: "object",
            properties: {
              name: {
                type: "object",
                properties: {
                  raw_text: { type: "string" },
                  first_name: { type: "string" },
                  last_name: { type: "string" },
                },
              },
              dob: { type: "string" },
              dob_raw: { type: "string" },
              sex: { type: "string" },
            },
          },
          sender: {
            type: "object",
            properties: {
              name: { type: "string" },
              fax: { type: "object", properties: { raw_text: { type: "string" } } },
            },
          },
        },
      },
      null,
      2,
    );
    schemaCache.set(category, fallback);
    return fallback;
  }
}
