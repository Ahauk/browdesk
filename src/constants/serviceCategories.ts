// Predefined service categories (with icons). Users can also create their own
// custom categories, which are stored per-user in the service_categories table.

export interface CategoryInfo {
  key: string;
  label: string;
  icon: string; // Ionicons name
}

export const PREDEFINED_CATEGORIES: CategoryInfo[] = [
  { key: "cejas", label: "Cejas", icon: "brush-outline" },
  { key: "labios", label: "Labios", icon: "lips" },
  { key: "ojos", label: "Ojos", icon: "eye-outline" },
  { key: "laser", label: "Depilación láser", icon: "flash-outline" },
  { key: "pestanas", label: "Pestañas", icon: "sparkles-outline" },
  { key: "unas", label: "Uñas", icon: "hand-left-outline" },
];

export const DEFAULT_CUSTOM_CATEGORY_ICON = "pricetags-outline";

// Icons a user can pick for a custom category (routed via ZoneIcon).
export const ICON_CHOICES: string[] = [
  "cartridge", // máquina/cartucho de tatuaje
  "ink", // tintas
  "sparkles-outline",
  "eye-outline",
  "brush-outline",
  "lips",
  "hand-left-outline",
  "flash-outline",
  "cut-outline",
  "flower-outline",
  "color-palette-outline",
  "heart-outline",
  "star-outline",
  "body-outline",
  "pricetags-outline",
];

export const PRICING_TYPE_LABELS: Record<string, string> = {
  fixed: "Precio fijo",
  laser: "Por sesión / paquete",
  variable: "Variable (a cotizar)",
};
