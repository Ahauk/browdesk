export const APP_NAME = "BrowDesk";
export const BRAND_NAME = "CAROLINA VAZQUEZ";
export const BRAND_SUBTITLE = "MICROPIGMENTACION";
export const BRAND_MONOGRAM = "CV";

export const PROCEDURE_TYPES = [
  { key: "brows", label: "Cejas" },
  { key: "lips", label: "Labios" },
  { key: "eyes", label: "Ojos" },
  { key: "other", label: "Otro" },
] as const;

export const CLINICAL_CONDITIONS = [
  { key: "diabetes", label: "Diabetes" },
  { key: "pregnancy", label: "Embarazo" },
  { key: "hypertension", label: "Hipertension" },
] as const;
