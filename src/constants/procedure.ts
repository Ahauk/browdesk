// Common needle types used in micropigmentation
export const NEEDLE_TYPES = [
  { key: "RL", label: "RL (Round Liner)" },
  { key: "RM", label: "RM (Round Magnum)" },
  { key: "M1", label: "M1 (Magnum)" },
  { key: "F", label: "F (Flat)" },
  { key: "RS", label: "RS (Round Shader)" },
] as const;

// Common gauge sizes
export const NEEDLE_GAUGES = [
  "01", "03", "05", "07", "08", "09", "10", "12", "14", "16", "18",
] as const;

// Common pigment colors
export const PIGMENT_COLORS = [
  { key: "rojo", label: "Rojo", hex: "#C0392B" },
  { key: "magenta", label: "Magenta", hex: "#8E44AD" },
  { key: "marron_oscuro", label: "Marron oscuro", hex: "#5C4634" },
  { key: "marron_claro", label: "Marron claro", hex: "#A67B5B" },
  { key: "negro", label: "Negro", hex: "#2C2C2C" },
  { key: "blanco", label: "Blanco", hex: "#F5F0EB" },
  { key: "amarillo", label: "Amarillo", hex: "#F1C40F" },
  { key: "naranja", label: "Naranja", hex: "#E67E22" },
  { key: "rosa", label: "Rosa", hex: "#E8A0BF" },
  { key: "nude", label: "Nude", hex: "#D2B48C" },
  { key: "coral", label: "Coral", hex: "#E88D7D" },
  { key: "vino", label: "Vino", hex: "#722F37" },
] as const;
