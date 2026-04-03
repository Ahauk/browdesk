export const colors = {
  // Splash / Unlock (premium dark — se mantiene)
  splash: {
    black: "#1A1A1A",
    dark: "#2D2D2D",
    gold: "#C4A87C",
    goldDark: "#A68B5B",
  },

  // App interior — paleta micropigmentación
  bg: "#F6F1EB", // fondo piel clara
  surface: "#FFFFFF", // cards
  surfaceSoft: "#EFE6DD", // secciones suaves
  divider: "#D8CEC5", // separadores

  // Acciones
  primary: "#8B6B4F", // brown natural (cejas) — botón principal
  primaryDark: "#5C4634", // profundo elegante — pressed
  accent: "#C48A7A", // rose nude (labios) — highlights
  accentLight: "#E2B7A8", // soft pink — alertas suaves
  accentSoft: "#EFE6DD", // botón secundario bg

  // Texto
  text: "#2F2A26", // principal (gris cálido, no negro puro)
  textSecondary: "#7A6F66", // secundario
  textLight: "#A68A75", // terciario / placeholder

  // Utilidad
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
  danger: "#C0392B",
  success: "#27AE60",
  warning: "#E67E22",

  // Fitzpatrick skin types
  fitzpatrick: {
    type1: "#F5DEB3",
    type2: "#EDCBA0",
    type3: "#D2B48C",
    type4: "#A67B5B",
    type5: "#6B4226",
    type6: "#3B2212",
  },

  // Legacy aliases (para splash/unlock que usan brand.*)
  brand: {
    black: "#1A1A1A",
    dark: "#2D2D2D",
    gold: "#C4A87C",
    goldDark: "#A68B5B",
    ivory: "#F6F1EB",
    cream: "#EFE6DD",
    rose: "#C48A7A",
    roseDark: "#A68A75",
    roseLight: "#E2B7A8",
    textPrimary: "#2F2A26",
    textSecondary: "#7A6F66",
    beige: "#F6F1EB",
    beigeMedium: "#EFE6DD",
    gray: "#7A6F66",
  },

  gray100: "#EFE6DD",
  gray50: "#F6F1EB",
} as const;
