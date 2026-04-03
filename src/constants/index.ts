export const APP_NAME = "BrowDesk";
export const BRAND_NAME = "CAROLINA VAZQUEZ";
export const BRAND_SUBTITLE = "MICROPIGMENTACION";
export const BRAND_MONOGRAM = "CV";

// Techniques
export const TECHNIQUES = [
  { key: "microblading", label: "Microblading" },
  { key: "microshading", label: "Microshading" },
  { key: "powder_brows", label: "Powder Brows" },
  { key: "mixta", label: "Mixta" },
] as const;

// Procedure zones with sub-options
export const PROCEDURE_ZONES = {
  ojos: {
    label: "Ojos",
    options: [
      { key: "parpado_superior", label: "Parpado superior" },
      { key: "parpado_inferior", label: "Parpado inferior" },
      { key: "parpado_interior", label: "Parpado interior" },
      { key: "difuminado", label: "Difuminado" },
    ],
  },
  cejas: {
    label: "Cejas",
    options: [
      { key: "delineado", label: "Delineado" },
      { key: "baby_lips", label: "Baby Lips" },
      { key: "full_lips", label: "Full Lips" },
      { key: "acuarela", label: "Acuarela" },
    ],
  },
  labios: {
    label: "Labios",
    options: [
      { key: "cejas", label: "Cejas" },
      { key: "ojos", label: "Ojos" },
      { key: "labios", label: "Labios" },
      { key: "tatuaje", label: "Tatuaje" },
    ],
  },
  otros: {
    label: "Otros",
    options: [{ key: "areola", label: "Areola" }],
  },
} as const;

// Legacy - kept for backward compat
export const PROCEDURE_TYPES = [
  { key: "brows", label: "Cejas" },
  { key: "lips", label: "Labios" },
  { key: "eyes", label: "Ojos" },
  { key: "other", label: "Otro" },
] as const;

// Medical conditions checklist (from clinical form)
export const MEDICAL_CONDITIONS = [
  { key: "hemofilia", label: "Hemofilia" },
  { key: "diabetes", label: "Diabetes" },
  { key: "hepatitis", label: "Hepatitis A,B,C,D,E,F" },
  { key: "vih", label: "VIH" },
  { key: "alergias", label: "Alergias" },
  { key: "autoinmunes", label: "Enfermedades autoinmunes" },
  { key: "epilepsia", label: "Epilepsia" },
  { key: "cardiovascular", label: "Problemas cardiovasculares" },
  { key: "cancer", label: "Cancer" },
  { key: "hipertension", label: "Hipertension" },
  { key: "asma", label: "Asma" },
  { key: "covid", label: "Covid 19" },
  { key: "blefaritis", label: "Blefaritis" },
  { key: "retinopatia", label: "Retinopatia" },
  { key: "glaucoma", label: "Glaucoma" },
  { key: "hemofilia2", label: "Hemofilia" },
  { key: "cronicas", label: "Enfermedades cronicas" },
  { key: "marcapasos", label: "Marcapasos" },
  { key: "embarazo", label: "Embarazo" },
  { key: "lactancia", label: "Lactancia" },
] as const;

// Clinical yes/no questions
export const CLINICAL_QUESTIONS = [
  { key: "endodoncia", label: "Tiene endodoncia" },
  { key: "tatuajes_cejas", label: "Tatuajes en cejas" },
  { key: "tatuajes_parpados", label: "Tatuajes en parpados" },
  { key: "perforacion_labios", label: "Perforacion en labios" },
  { key: "perforacion_cejas", label: "Perforacion en cejas" },
  { key: "micropigmentacion_previa", label: "Micropigmentaciones anteriores" },
  { key: "transfusion", label: "Transfusion sanguinea en los ultimos 6 meses" },
  { key: "cicatrices_queloide", label: "Cicatrices queloide" },
  { key: "drogas", label: "Consume drogas" },
  { key: "sangrado", label: "Sangra con facilidad" },
  { key: "transplante", label: "Le han transplantado pelo o ceja" },
  { key: "levantamiento", label: "Le han realizado levantamiento de frente" },
  { key: "coagulacion", label: "Tiene problemas de coagulacion" },
  { key: "anticoagulantes", label: "Actualmente toma anticoagulantes" },
  { key: "lunares", label: "Tiene lunares o areas elevadas cerca del area a tratar" },
  { key: "quimio", label: "Le han practicado quimioterapia / radioterapia" },
  { key: "botox", label: "Aplicacion de botox o rellenos faciales" },
] as const;

// Fitzpatrick skin types
export const FITZPATRICK_TYPES = [
  {
    type: 1,
    label: "Tipo I",
    description: "Clara, palida, blanca y muy clara",
    reaction: "Siempre se quema y nunca se broncea",
    color: "#F5DEB3",
  },
  {
    type: 2,
    label: "Tipo II",
    description: "Blanca clara",
    reaction: "Algunas veces se broncea",
    color: "#EDCBA0",
  },
  {
    type: 3,
    label: "Tipo III",
    description: "Blanca clara con un tinte beige",
    reaction: "Algunas veces se quema, va de bronceado a aceitunado",
    color: "#D2B48C",
  },
  {
    type: 4,
    label: "Tipo IV",
    description: "De beige a marron suave / aceitunada",
    reaction: "Rara vez se quema, se broncea facil a marron moderado",
    color: "#A67B5B",
  },
  {
    type: 5,
    label: "Tipo V",
    description: "De marron suave a moderado",
    reaction: "Rara vez se quema, se broncea mas que el promedio",
    color: "#6B4226",
  },
  {
    type: 6,
    label: "Tipo VI",
    description: "De marron muy oscuro a negro",
    reaction: "Nunca se quema, es bastante pigmentada",
    color: "#3B2212",
  },
] as const;

// How did you hear about us
export const REFERRAL_SOURCES = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "recomendacion", label: "Recomendacion" },
  { key: "google", label: "Google" },
  { key: "otro", label: "Otro" },
] as const;

// Legacy
export const CLINICAL_CONDITIONS = MEDICAL_CONDITIONS.slice(0, 3);
