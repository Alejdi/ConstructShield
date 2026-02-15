export type FilterFieldType = "search" | "select" | "range" | "toggle" | "sort";

export interface FilterFieldConfig {
  /** URL param name */
  param: string;
  /** Display label */
  label: string;
  /** Type of control to render */
  type: FilterFieldType;
  /** For "select" / "sort": options list */
  options?: { label: string; value: string }[];
  /** For "search": placeholder text */
  placeholder?: string;
  /** For "range": second param name (e.g. "maxBudget") */
  rangeMaxParam?: string;
  /** For "range": placeholder for min/max inputs */
  rangePlaceholders?: [string, string];
}
