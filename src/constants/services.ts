// ═══════════════════════════════════════════
// Service zones, options, and pricing
// ═══════════════════════════════════════════

export type SelectionMode = "checkbox" | "radio";
export type PricingMode = "per-item" | "fixed" | "combo" | "variable" | "laser";

export interface ServiceOption {
  key: string;
  label: string;
  price?: number; // per-session price for laser
  packagePrice?: number; // 10-session package for laser
}

export interface ServiceZone {
  key: string;
  label: string;
  icon: string;
  selectionMode: SelectionMode;
  pricingMode: PricingMode;
  options: ServiceOption[];
  fixedPrice?: number;
  perItemPrice?: number;
  comboPrice?: number;
  comboMinItems?: number;
  variableMessage?: string;
  // Valid combinations (if set, only these pairs are allowed for checkbox mode)
  validCombos?: [string, string][];
}

// Returns which options are still selectable given current selections and valid combos
export function getDisabledOptions(
  zone: ServiceZone,
  selected: Set<string>
): Set<string> {
  if (!zone.validCombos || zone.selectionMode !== "checkbox") {
    return new Set();
  }

  // If nothing selected, everything is available
  if (selected.size === 0) return new Set();

  // If already 2 selected (a complete combo), disable all others
  if (selected.size >= 2) {
    const disabled = new Set<string>();
    zone.options.forEach((opt) => {
      if (!selected.has(opt.key)) disabled.add(opt.key);
    });
    return disabled;
  }

  // 1 selected: only allow options that form a valid combo with it
  const selectedKey = Array.from(selected)[0];
  const allowedPartners = new Set<string>();

  for (const [a, b] of zone.validCombos) {
    if (a === selectedKey) allowedPartners.add(b);
    if (b === selectedKey) allowedPartners.add(a);
  }

  const disabled = new Set<string>();
  zone.options.forEach((opt) => {
    if (opt.key !== selectedKey && !allowedPartners.has(opt.key)) {
      disabled.add(opt.key);
    }
  });
  return disabled;
}

export const SERVICE_ZONES: ServiceZone[] = [
  {
    key: "ojos",
    label: "Ojos",
    icon: "eye-outline",
    selectionMode: "checkbox",
    pricingMode: "combo",
    perItemPrice: 1200,
    comboPrice: 2000,
    comboMinItems: 2,
    validCombos: [
      ["difuminado", "parpado_inferior"],
      ["parpado_superior", "parpado_inferior"],
      ["punteado_pestanas", "parpado_inferior"],
    ],
    options: [
      { key: "parpado_superior", label: "Parpado superior" },
      { key: "parpado_inferior", label: "Parpado inferior" },
      { key: "punteado_pestanas", label: "Punteado de pestanas" },
      { key: "difuminado", label: "Difuminado" },
    ],
  },
  {
    key: "cejas",
    label: "Cejas",
    icon: "brush-outline",
    selectionMode: "radio",
    pricingMode: "fixed",
    fixedPrice: 1800,
    options: [
      { key: "compacta", label: "Compacta" },
      { key: "powder_brows", label: "Powder Brows" },
      { key: "hibrida", label: "Hibrida" },
      { key: "hair_stroke", label: "Hair Stroke" },
      { key: "microblading", label: "Microblading" },
    ],
  },
  {
    key: "labios",
    label: "Labios",
    icon: "heart-outline",
    selectionMode: "radio",
    pricingMode: "fixed",
    fixedPrice: 2500,
    options: [
      { key: "full_lips", label: "Full Lips" },
      { key: "baby_lips", label: "Baby Lips" },
      { key: "delineado", label: "Delineado" },
      { key: "acuarela", label: "Acuarela" },
    ],
  },
  {
    key: "depilacion",
    label: "Depilacion con laser",
    icon: "flash-outline",
    selectionMode: "radio",
    pricingMode: "laser",
    options: [
      { key: "medio_brazo", label: "Medio brazo", price: 400, packagePrice: 3500 },
      { key: "brazos_completos", label: "Brazos completos", price: 500, packagePrice: 4000 },
      { key: "media_pierna", label: "Media pierna", price: 400, packagePrice: 3500 },
      { key: "piernas_completas", label: "Piernas completas", price: 500, packagePrice: 4000 },
      { key: "media_cara", label: "Media cara", price: 300, packagePrice: 2600 },
      { key: "cara_completa", label: "Cara completa", price: 400, packagePrice: 3000 },
      { key: "axilas", label: "Axilas", price: 300, packagePrice: 2000 },
    ],
  },
  {
    key: "otros",
    label: "Otros",
    icon: "ellipsis-horizontal-outline",
    selectionMode: "radio",
    pricingMode: "variable",
    variableMessage: "El precio varia segun el tamano y numero de sesiones. Se cotiza de forma personalizada.",
    options: [
      { key: "eliminacion_tatuaje", label: "Eliminacion de tatuaje" },
      { key: "tatuaje", label: "Tatuaje" },
    ],
  },
];

// Calculate price for a zone based on selections
export function calculateZonePrice(
  zone: ServiceZone,
  selectedOptions: Set<string>,
  isPackage?: boolean
): { total: number; originalTotal?: number; discount?: number; isVariable: boolean } {
  if (zone.pricingMode === "variable") {
    return { total: 0, isVariable: true };
  }

  if (zone.pricingMode === "fixed" && selectedOptions.size > 0) {
    return { total: zone.fixedPrice ?? 0, isVariable: false };
  }

  if (zone.pricingMode === "laser" && selectedOptions.size > 0) {
    const selectedOpt = zone.options.find((o) => selectedOptions.has(o.key));
    if (!selectedOpt) return { total: 0, isVariable: false };
    const price = isPackage
      ? (selectedOpt.packagePrice ?? 0)
      : (selectedOpt.price ?? 0);
    return { total: price, isVariable: false };
  }

  if (zone.pricingMode === "combo") {
    const count = selectedOptions.size;
    if (count === 0) return { total: 0, isVariable: false };

    const perItem = zone.perItemPrice ?? 0;
    const originalTotal = count * perItem;

    if (count >= (zone.comboMinItems ?? 2) && zone.comboPrice) {
      const discount = originalTotal - zone.comboPrice;
      return {
        total: zone.comboPrice,
        originalTotal,
        discount,
        isVariable: false,
      };
    }

    return { total: originalTotal, isVariable: false };
  }

  return { total: 0, isVariable: false };
}
