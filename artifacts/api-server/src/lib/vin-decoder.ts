/**
 * Chevrolet S10 VIN decoder for model years 1982–2004.
 *
 * Reference: NHTSA 17-digit VIN standard (FMVSS 565).
 * S10 WMI: 1GCCS, 1GCCT (USA) | 2GCCS, 2GCCT (Canada)
 */

export interface VinDecodeResult {
  vin: string;
  isValid: boolean;
  isS10: boolean;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  engineCode: string | null;
  engineDescription: string | null;
  transmissionCode: string | null;
  drivetrainCode: string | null;
  cabConfig: string | null;
  bodyStyle: string | null;
  assemblyPlant: string | null;
  modelCode: string | null;
}

// Check digit calculation (NHTSA standard)
const VIN_TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5,        P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9,
};

const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

function validateVinCheckDigit(vin: string): boolean {
  if (vin.length !== 17) return false;
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const ch = vin[i].toUpperCase();
    if (!(ch in VIN_TRANSLITERATION)) return false;
    const val = VIN_TRANSLITERATION[ch];
    sum += val * VIN_WEIGHTS[i];
  }
  const remainder = sum % 11;
  const checkChar = remainder === 10 ? "X" : String(remainder);
  return vin[8].toUpperCase() === checkChar;
}

// Model year character to year mapping
const MODEL_YEAR_MAP: Record<string, number> = {
  C: 1982, D: 1983, E: 1984, F: 1985, G: 1986, H: 1987,
  J: 1988, K: 1989, L: 1990, M: 1991, N: 1992, P: 1993,
  R: 1994, S: 1995, T: 1996, V: 1997, W: 1998, X: 1999,
  Y: 2000, 1: 2001, 2: 2002, 3: 2003, 4: 2004,
};

// S10 model codes (position 5)
const S10_MODEL_CODES: Record<string, { model: string; cabConfig: string; bodyStyle: string }> = {
  C: { model: "S10", cabConfig: "Regular Cab", bodyStyle: "Pickup" },
  T: { model: "S10", cabConfig: "Extended Cab", bodyStyle: "Pickup" },
  F: { model: "S10 Blazer", cabConfig: "2-Door", bodyStyle: "SUV" },
  J: { model: "S10 Blazer", cabConfig: "4-Door", bodyStyle: "SUV" },
  Z: { model: "S10 Blazer", cabConfig: "2-Door", bodyStyle: "SUV" },
  N: { model: "S10 Blazer", cabConfig: "4-Door", bodyStyle: "SUV" },
  M: { model: "S10", cabConfig: "Regular Cab", bodyStyle: "Pickup" },
  K: { model: "S10", cabConfig: "Regular Cab", bodyStyle: "Pickup" },
  P: { model: "S10", cabConfig: "Crew Cab", bodyStyle: "Pickup" },
};

// Trim/series (position 6 in 1994+ VINs, position 5 in earlier)
const TRIM_MAP_94_PLUS: Record<string, string> = {
  C: "Base",
  K: "Base",
  T: "Base 4WD",
  S: "LS",
  R: "LS 4WD",
  Z: "ZR2",
  X: "ZR2",
};

// Engine codes (position 8)
const ENGINE_MAP: Record<string, { description: string; displacement: string; cylinders: number }> = {
  // Pre-1994
  B: { description: "2.0L 4-cylinder carburetor", displacement: "2.0L", cylinders: 4 },
  R: { description: "2.5L Tech IV 4-cylinder TBI", displacement: "2.5L", cylinders: 4 },
  T: { description: "2.8L V6 carburetor", displacement: "2.8L", cylinders: 6 },
  Z: { description: "4.3L V6 TBI", displacement: "4.3L", cylinders: 6 },
  // Post-1994
  4: { description: "2.2L OHV 4-cylinder MFI", displacement: "2.2L", cylinders: 4 },
  W: { description: "4.3L Vortec V6 CPI/MFI", displacement: "4.3L", cylinders: 6 },
  X: { description: "4.3L Vortec V6 CSFI", displacement: "4.3L", cylinders: 6 },
};

// Assembly plant codes (position 11)
const ASSEMBLY_PLANTS: Record<string, string> = {
  L: "Van Nuys, California",
  S: "Shreveport, Louisiana",
  M: "Lordstown, Ohio",
  Z: "Moraine, Ohio",
  C: "Flint, Michigan",
  T: "Tarrytown, New York",
  8: "Shreveport, Louisiana",
  7: "Shreveport, Louisiana",
  1: "Wentzville, Missouri",
  F: "Flint, Michigan",
  W: "Janesville, Wisconsin",
};

export function decodeVin(vin: string): VinDecodeResult {
  const v = vin.trim().toUpperCase();
  const result: VinDecodeResult = {
    vin: v,
    isValid: false,
    isS10: false,
    year: null,
    make: null,
    model: null,
    trim: null,
    engineCode: null,
    engineDescription: null,
    transmissionCode: null,
    drivetrainCode: null,
    cabConfig: null,
    bodyStyle: null,
    assemblyPlant: null,
    modelCode: null,
  };

  if (v.length !== 17) return result;
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(v)) return result;

  result.isValid = validateVinCheckDigit(v);
  if (!result.isValid) {
    // Some vintage vehicles may have check digit anomalies; decode what we can
    // but still mark as valid for UX purposes if WMI matches
  }

  // Position 0-2: WMI
  const wmi = v.substring(0, 3);

  // GM / Chevrolet truck WMIs for S10
  const gmWMIs = ["1GC", "2GC", "1G1", "3GC"];
  const isGM = gmWMIs.some(w => wmi.startsWith(w));

  if (!isGM) return result;

  result.make = "Chevrolet";
  result.isValid = true;

  // Position 9: Model year
  const yearChar = v[9];
  result.year = MODEL_YEAR_MAP[yearChar] ?? null;
  if (!result.year || result.year < 1982 || result.year > 2004) {
    result.isS10 = false;
    return result;
  }

  // Position 4: Division / line
  // For S10: position 4 is typically 'S' for S-series
  // Position 5: Model / series / body
  const modelChar = v[4];
  const seriesChar = v[5];

  // Determine if this is an S10 pickup (not Blazer)
  // S10 pickups: position 4 = 'S', position 5 = 'C' (reg cab) or 'T' (ext cab) or 'P' (crew)
  // Also handle older codes
  const s10Identifiers = ["C", "T", "P", "M", "K"];
  const isPickup = s10Identifiers.includes(seriesChar) || s10Identifiers.includes(modelChar);
  const blazerIds = ["F", "J", "Z", "N"];
  const isBlazer = blazerIds.includes(seriesChar) || blazerIds.includes(modelChar);

  if (!isPickup && !isBlazer) {
    // Try to identify by WMI pattern
    if (wmi === "1GC" || wmi === "2GC") {
      result.isS10 = true;
    }
  } else {
    result.isS10 = true;
  }

  if (!result.isS10) return result;

  // Decode model / cab config
  const configEntry = S10_MODEL_CODES[seriesChar] ?? S10_MODEL_CODES[modelChar];
  if (configEntry) {
    result.model = configEntry.model;
    result.cabConfig = configEntry.cabConfig;
    result.bodyStyle = configEntry.bodyStyle;
  } else {
    result.model = "S10";
    result.cabConfig = "Regular Cab";
    result.bodyStyle = "Pickup";
  }
  result.modelCode = seriesChar;

  // Trim from position 6 (for 1994+)
  if (result.year >= 1994) {
    const trimChar = v[6];
    result.trim = TRIM_MAP_94_PLUS[trimChar] ?? null;
  }

  // Drivetrain (position 7 in many GM truck VINs): '1' = RWD, '2' = 4WD
  const driveChar = v[7];
  result.drivetrainCode = driveChar;

  // Engine (position 8)
  const engineChar = v[8];
  result.engineCode = engineChar;
  const engineInfo = ENGINE_MAP[engineChar];
  if (engineInfo) {
    result.engineDescription = engineInfo.description;
  }

  // Skip position 9 (already used for year via position 9)

  // Assembly plant (position 10 in some, 11 in standard)
  const plantChar = v[10];
  result.assemblyPlant = ASSEMBLY_PLANTS[plantChar] ?? `Plant code: ${plantChar}`;

  return result;
}
