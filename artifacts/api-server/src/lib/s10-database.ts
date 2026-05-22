export interface S10Option {
  code: string;
  description: string;
  price: number;
}

export interface S10Config {
  year: number;
  trim: string;
  engine: string;
  engineCode: string;
  engineDisplacement: string;
  engineCylinders: number;
  horsepower: number;
  torque: number;
  fuelType: string;
  transmission: string;
  drivetrain: string;
  cabConfig: string;
  bodyStyle: string;
  msrpBase: number;
  epaCity: number;
  epaHighway: number;
  standardEquipment: string[];
  availableOptions: S10Option[];
}

const COMMON_OPTIONS_82_94: S10Option[] = [
  { code: "AU3", description: "Power door locks", price: 180 },
  { code: "A31", description: "Power windows", price: 270 },
  { code: "C60", description: "Air conditioning", price: 810 },
  { code: "C49", description: "Rear window defogger", price: 160 },
  { code: "T65", description: "Heavy-duty battery", price: 65 },
  { code: "N33", description: "Tilt steering column", price: 145 },
  { code: "Z82", description: "Trailering special package", price: 225 },
  { code: "B85", description: "Body side moldings", price: 115 },
  { code: "V22", description: "Front bumper guards", price: 55 },
  { code: "TF5", description: "AM/FM stereo radio", price: 295 },
  { code: "UP5", description: "AM/FM stereo with cassette", price: 395 },
];

const COMMON_OPTIONS_94_04: S10Option[] = [
  { code: "AU3", description: "Power door locks", price: 195 },
  { code: "A31", description: "Power windows", price: 285 },
  { code: "C60", description: "Air conditioning", price: 895 },
  { code: "C49", description: "Rear window defogger", price: 170 },
  { code: "N33", description: "Tilt steering column", price: 155 },
  { code: "Z82", description: "Trailering special package", price: 260 },
  { code: "B85", description: "Body side moldings", price: 130 },
  { code: "UP0", description: "AM/FM stereo with cassette", price: 240 },
  { code: "UP3", description: "AM/FM stereo with CD player", price: 375 },
  { code: "AJ1", description: "Deep tinted windows", price: 265 },
  { code: "V76", description: "Running boards", price: 345 },
];

const STANDARD_EQUIPMENT_BASE_82_93 = [
  "2.5L Tech IV 4-cylinder engine",
  "5-speed manual transmission",
  "Front independent suspension",
  "Front disc / rear drum brakes",
  "AM radio",
  "Painted front bumper",
  "Black exterior mirrors",
  "Black door handles",
  "Vinyl seat trim",
  "Black rubber floor mats",
  "Seat belts – front and rear",
  "5-mph impact bumpers",
];

const STANDARD_EQUIPMENT_TAHOE = [
  "Upgraded upholstery",
  "Color-keyed carpeting",
  "Bodyside moldings",
  "Chrome door handles",
  "Chrome front bumper",
  "Deluxe wheel covers",
  "Woodgrain instrument panel trim",
  "Dual sport mirrors",
  "AM/FM radio",
  "Tachometer",
];

const STANDARD_EQUIPMENT_LS_94_04 = [
  "4.3L Vortec V6 engine",
  "5-speed manual transmission",
  "Power steering",
  "Front independent suspension",
  "Front disc / rear drum brakes",
  "Air conditioning",
  "AM/FM stereo radio",
  "Cloth bucket seats",
  "Color-keyed carpeting",
  "Tilt steering column",
  "Rear window defogger",
  "Chrome grille surround",
  "Argent steel wheels",
  "P205/75R15 all-season tires",
];

const STANDARD_EQUIPMENT_ZR2 = [
  "4.3L Vortec V6 engine",
  "5-speed manual transmission",
  "Off-Road suspension with 3-inch lift",
  "Skid plates – front, transfer case, fuel tank",
  "Limited-slip rear differential",
  "16-inch alloy wheels",
  "P235/60R16 Wrangler AT tires",
  "Locking front hubs",
  "Air conditioning",
  "AM/FM stereo with CD",
  "Leather-wrapped steering wheel",
  "Fog lamps",
  "Fender flares",
  "Power windows and locks",
  "Tilt steering column",
  "Cloth sport buckets with bolsters",
  "Dual heated sport mirrors",
];

const s10Database: S10Config[] = [];

// ─── 1982–1993 ──────────────────────────────────────────────────────────────

function makeEarlyYears(
  year: number,
  trimLabel: string,
  engine: string,
  engineCode: string,
  displacement: string,
  cylinders: number,
  hp: number,
  tq: number,
  transmission: string,
  drivetrain: string,
  cab: string,
  body: string,
  msrp: number,
  city: number,
  hwy: number,
  stdEquip: string[],
): S10Config {
  return {
    year,
    trim: trimLabel,
    engine,
    engineCode,
    engineDisplacement: displacement,
    engineCylinders: cylinders,
    horsepower: hp,
    torque: tq,
    fuelType: "Gasoline",
    transmission,
    drivetrain,
    cabConfig: cab,
    bodyStyle: body,
    msrpBase: msrp,
    epaCity: city,
    epaHighway: hwy,
    standardEquipment: stdEquip,
    availableOptions: COMMON_OPTIONS_82_94,
  };
}

// 1982
for (const year of [1982, 1983, 1984]) {
  s10Database.push(makeEarlyYears(year, "Base", "2.0L 4-cylinder", "LQ9", "2.0L", 4, 82, 99, "4-speed manual", "RWD", "Regular Cab", "Pickup", 6495 + (year - 1982) * 200, 26, 31, STANDARD_EQUIPMENT_BASE_82_93));
  s10Database.push(makeEarlyYears(year, "Base", "2.8L V6", "LL1", "2.8L", 6, 110, 145, "4-speed manual", "RWD", "Regular Cab", "Pickup", 7095 + (year - 1982) * 200, 21, 27, STANDARD_EQUIPMENT_BASE_82_93));
  s10Database.push(makeEarlyYears(year, "Tahoe", "2.0L 4-cylinder", "LQ9", "2.0L", 4, 82, 99, "4-speed manual", "RWD", "Regular Cab", "Pickup", 7495 + (year - 1982) * 200, 25, 30, [...STANDARD_EQUIPMENT_BASE_82_93, ...STANDARD_EQUIPMENT_TAHOE]));
  s10Database.push(makeEarlyYears(year, "Tahoe", "2.8L V6", "LL1", "2.8L", 6, 110, 145, "4-speed manual", "RWD", "Regular Cab", "Pickup", 7895 + (year - 1982) * 200, 20, 26, [...STANDARD_EQUIPMENT_BASE_82_93, ...STANDARD_EQUIPMENT_TAHOE]));
}

// 1985–1987: 2.5L Tech IV replaces 2.0L
for (const year of [1985, 1986, 1987]) {
  s10Database.push(makeEarlyYears(year, "Base", "2.5L Tech IV 4-cylinder", "LR8", "2.5L", 4, 92, 134, "5-speed manual", "RWD", "Regular Cab", "Pickup", 7295 + (year - 1985) * 250, 24, 29, STANDARD_EQUIPMENT_BASE_82_93));
  s10Database.push(makeEarlyYears(year, "Base", "2.8L V6", "LL1", "2.8L", 6, 125, 160, "5-speed manual", "RWD", "Regular Cab", "Pickup", 7895 + (year - 1985) * 250, 20, 26, STANDARD_EQUIPMENT_BASE_82_93));
  s10Database.push(makeEarlyYears(year, "Tahoe", "2.5L Tech IV 4-cylinder", "LR8", "2.5L", 4, 92, 134, "5-speed manual", "RWD", "Regular Cab", "Pickup", 8295 + (year - 1985) * 250, 23, 29, [...STANDARD_EQUIPMENT_BASE_82_93, ...STANDARD_EQUIPMENT_TAHOE]));
  s10Database.push(makeEarlyYears(year, "Tahoe", "2.8L V6", "LL1", "2.8L", 6, 125, 160, "5-speed manual", "RWD", "Regular Cab", "Pickup", 8895 + (year - 1985) * 250, 19, 25, [...STANDARD_EQUIPMENT_BASE_82_93, ...STANDARD_EQUIPMENT_TAHOE]));
  s10Database.push(makeEarlyYears(year, "Base", "2.5L Tech IV 4-cylinder", "LR8", "2.5L", 4, 92, 134, "5-speed manual", "4WD", "Regular Cab", "Pickup", 10295 + (year - 1985) * 250, 21, 26, STANDARD_EQUIPMENT_BASE_82_93));
  s10Database.push(makeEarlyYears(year, "Base", "2.8L V6", "LL1", "2.8L", 6, 125, 160, "5-speed manual", "4WD", "Regular Cab", "Pickup", 10895 + (year - 1985) * 250, 18, 23, STANDARD_EQUIPMENT_BASE_82_93));
}

// 1988–1993: 4.3L V6 added
for (const year of [1988, 1989, 1990, 1991, 1992, 1993]) {
  const base = 8500 + (year - 1988) * 400;
  s10Database.push(makeEarlyYears(year, "Base", "2.5L Tech IV 4-cylinder", "LR8", "2.5L", 4, 98, 134, "5-speed manual", "RWD", "Regular Cab", "Pickup", base, 23, 29, STANDARD_EQUIPMENT_BASE_82_93));
  s10Database.push(makeEarlyYears(year, "Base", "4.3L V6", "LB4", "4.3L", 6, 160, 230, "5-speed manual", "RWD", "Regular Cab", "Pickup", base + 800, 17, 22, STANDARD_EQUIPMENT_BASE_82_93));
  s10Database.push(makeEarlyYears(year, "Tahoe", "2.5L Tech IV 4-cylinder", "LR8", "2.5L", 4, 98, 134, "5-speed manual", "RWD", "Regular Cab", "Pickup", base + 1100, 22, 28, [...STANDARD_EQUIPMENT_BASE_82_93, ...STANDARD_EQUIPMENT_TAHOE]));
  s10Database.push(makeEarlyYears(year, "Tahoe", "4.3L V6", "LB4", "4.3L", 6, 160, 230, "5-speed manual", "RWD", "Regular Cab", "Pickup", base + 1800, 16, 21, [...STANDARD_EQUIPMENT_BASE_82_93, ...STANDARD_EQUIPMENT_TAHOE]));
  s10Database.push(makeEarlyYears(year, "Base", "2.5L Tech IV 4-cylinder", "LR8", "2.5L", 4, 98, 134, "5-speed manual", "4WD", "Regular Cab", "Pickup", base + 2400, 20, 25, STANDARD_EQUIPMENT_BASE_82_93));
  s10Database.push(makeEarlyYears(year, "Base", "4.3L V6", "LB4", "4.3L", 6, 160, 230, "5-speed manual", "4WD", "Regular Cab", "Pickup", base + 3200, 15, 19, STANDARD_EQUIPMENT_BASE_82_93));
  // Extended cab added in 1988
  s10Database.push(makeEarlyYears(year, "Base", "4.3L V6", "LB4", "4.3L", 6, 160, 230, "5-speed manual", "RWD", "Extended Cab", "Pickup", base + 1600, 16, 21, STANDARD_EQUIPMENT_BASE_82_93));
  s10Database.push(makeEarlyYears(year, "Tahoe", "4.3L V6", "LB4", "4.3L", 6, 160, 230, "5-speed manual", "RWD", "Extended Cab", "Pickup", base + 2400, 16, 21, [...STANDARD_EQUIPMENT_BASE_82_93, ...STANDARD_EQUIPMENT_TAHOE]));
}

// ─── 1994–2004 (3rd gen restyled) ────────────────────────────────────────────

const ZR2_OPTIONS: S10Option[] = [
  { code: "B85", description: "Body color bodyside moldings", price: 145 },
  { code: "T43", description: "Content theft-deterrent system", price: 195 },
  { code: "UP3", description: "AM/FM stereo w/CD & EQ", price: 375 },
  { code: "AU3", description: "Power door locks", price: 195 },
  { code: "A31", description: "Power windows", price: 285 },
  { code: "Z71", description: "Off-Road Package upgrade", price: 450 },
];

for (const year of [1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004]) {
  const base = 12000 + (year - 1994) * 550;
  const base4wd = base + 3500;

  // Base 2.2L I4 RWD Regular Cab
  s10Database.push({
    year, trim: "Base",
    engine: "2.2L 4-cylinder", engineCode: "L43", engineDisplacement: "2.2L", engineCylinders: 4,
    horsepower: 118, torque: 130,
    fuelType: "Gasoline",
    transmission: "5-speed manual", drivetrain: "RWD", cabConfig: "Regular Cab", bodyStyle: "Pickup",
    msrpBase: base, epaCity: 23, epaHighway: 30,
    standardEquipment: [
      "2.2L OHV 4-cylinder engine", "5-speed manual transmission", "Power steering", "Front disc / rear drum brakes",
      "AM radio", "Black exterior mirrors", "Vinyl bench seat", "Black rubber floor mats",
      "15-inch styled steel wheels", "P195/75R15 all-season tires", "Stainless steel exhaust",
    ],
    availableOptions: COMMON_OPTIONS_94_04,
  });

  // Base 4.3L V6 RWD Regular Cab
  s10Database.push({
    year, trim: "Base",
    engine: "4.3L Vortec V6", engineCode: "LB4", engineDisplacement: "4.3L", engineCylinders: 6,
    horsepower: year >= 1996 ? 180 : 165, torque: year >= 1996 ? 245 : 235,
    fuelType: "Gasoline",
    transmission: "5-speed manual", drivetrain: "RWD", cabConfig: "Regular Cab", bodyStyle: "Pickup",
    msrpBase: base + 900, epaCity: 17, epaHighway: 22,
    standardEquipment: [
      "4.3L Vortec V6 engine", "5-speed manual transmission", "Power steering", "Front disc / rear drum brakes",
      "AM radio", "Black exterior mirrors", "Vinyl bench seat", "Black rubber floor mats",
      "15-inch styled steel wheels", "P205/75R15 all-season tires", "Stainless steel exhaust",
    ],
    availableOptions: COMMON_OPTIONS_94_04,
  });

  // LS trim Regular Cab RWD
  s10Database.push({
    year, trim: "LS",
    engine: "2.2L 4-cylinder", engineCode: "L43", engineDisplacement: "2.2L", engineCylinders: 4,
    horsepower: 118, torque: 130,
    fuelType: "Gasoline",
    transmission: "5-speed manual", drivetrain: "RWD", cabConfig: "Regular Cab", bodyStyle: "Pickup",
    msrpBase: base + 1600, epaCity: 22, epaHighway: 29,
    standardEquipment: STANDARD_EQUIPMENT_LS_94_04,
    availableOptions: COMMON_OPTIONS_94_04,
  });

  // LS 4.3L V6 RWD Regular Cab
  s10Database.push({
    year, trim: "LS",
    engine: "4.3L Vortec V6", engineCode: year >= 1996 ? "LF6" : "LB4", engineDisplacement: "4.3L", engineCylinders: 6,
    horsepower: year >= 1996 ? 180 : 165, torque: year >= 1996 ? 245 : 235,
    fuelType: "Gasoline",
    transmission: "5-speed manual", drivetrain: "RWD", cabConfig: "Regular Cab", bodyStyle: "Pickup",
    msrpBase: base + 2400, epaCity: 16, epaHighway: 21,
    standardEquipment: STANDARD_EQUIPMENT_LS_94_04,
    availableOptions: COMMON_OPTIONS_94_04,
  });

  // LS Extended Cab RWD
  s10Database.push({
    year, trim: "LS",
    engine: "4.3L Vortec V6", engineCode: year >= 1996 ? "LF6" : "LB4", engineDisplacement: "4.3L", engineCylinders: 6,
    horsepower: year >= 1996 ? 180 : 165, torque: year >= 1996 ? 245 : 235,
    fuelType: "Gasoline",
    transmission: "5-speed manual", drivetrain: "RWD", cabConfig: "Extended Cab", bodyStyle: "Pickup",
    msrpBase: base + 3100, epaCity: 16, epaHighway: 21,
    standardEquipment: STANDARD_EQUIPMENT_LS_94_04,
    availableOptions: COMMON_OPTIONS_94_04,
  });

  // LS 4WD Extended Cab
  s10Database.push({
    year, trim: "LS",
    engine: "4.3L Vortec V6", engineCode: year >= 1996 ? "LF6" : "LB4", engineDisplacement: "4.3L", engineCylinders: 6,
    horsepower: year >= 1996 ? 180 : 165, torque: year >= 1996 ? 245 : 235,
    fuelType: "Gasoline",
    transmission: "5-speed manual", drivetrain: "4WD", cabConfig: "Extended Cab", bodyStyle: "Pickup",
    msrpBase: base4wd + 3100, epaCity: 14, epaHighway: 18,
    standardEquipment: [...STANDARD_EQUIPMENT_LS_94_04, "Electric shift-on-the-fly 4WD", "Skid plates"],
    availableOptions: COMMON_OPTIONS_94_04,
  });

  // ZR2 (available 1994–2003)
  if (year <= 2003) {
    s10Database.push({
      year, trim: "ZR2",
      engine: "4.3L Vortec V6", engineCode: year >= 1996 ? "LF6" : "LB4", engineDisplacement: "4.3L", engineCylinders: 6,
      horsepower: year >= 1996 ? 180 : 165, torque: year >= 1996 ? 245 : 235,
      fuelType: "Gasoline",
      transmission: "5-speed manual", drivetrain: "4WD", cabConfig: "Regular Cab", bodyStyle: "Pickup",
      msrpBase: base4wd + 4200, epaCity: 13, epaHighway: 17,
      standardEquipment: STANDARD_EQUIPMENT_ZR2,
      availableOptions: ZR2_OPTIONS,
    });
    // ZR2 Extended Cab
    s10Database.push({
      year, trim: "ZR2",
      engine: "4.3L Vortec V6", engineCode: year >= 1996 ? "LF6" : "LB4", engineDisplacement: "4.3L", engineCylinders: 6,
      horsepower: year >= 1996 ? 180 : 165, torque: year >= 1996 ? 245 : 235,
      fuelType: "Gasoline",
      transmission: "5-speed manual", drivetrain: "4WD", cabConfig: "Extended Cab", bodyStyle: "Pickup",
      msrpBase: base4wd + 5000, epaCity: 13, epaHighway: 17,
      standardEquipment: STANDARD_EQUIPMENT_ZR2,
      availableOptions: ZR2_OPTIONS,
    });
  }

  // Crew Cab (2001+)
  if (year >= 2001) {
    s10Database.push({
      year, trim: "LS",
      engine: "4.3L Vortec V6", engineCode: "LF6", engineDisplacement: "4.3L", engineCylinders: 6,
      horsepower: 180, torque: 245,
      fuelType: "Gasoline",
      transmission: "4-speed automatic", drivetrain: "RWD", cabConfig: "Crew Cab", bodyStyle: "Pickup",
      msrpBase: base + 5500, epaCity: 15, epaHighway: 20,
      standardEquipment: [...STANDARD_EQUIPMENT_LS_94_04, "4-speed automatic transmission", "Rear bench seat"],
      availableOptions: COMMON_OPTIONS_94_04,
    });
  }

  // Automatic transmission variants (LS, 4.3L, RWD, Regular Cab)
  s10Database.push({
    year, trim: "LS",
    engine: "4.3L Vortec V6", engineCode: year >= 1996 ? "LF6" : "LB4", engineDisplacement: "4.3L", engineCylinders: 6,
    horsepower: year >= 1996 ? 180 : 165, torque: year >= 1996 ? 245 : 235,
    fuelType: "Gasoline",
    transmission: "4-speed automatic", drivetrain: "RWD", cabConfig: "Regular Cab", bodyStyle: "Pickup",
    msrpBase: base + 3100, epaCity: 16, epaHighway: 20,
    standardEquipment: [...STANDARD_EQUIPMENT_LS_94_04, "4-speed automatic transmission"],
    availableOptions: COMMON_OPTIONS_94_04,
  });
}

export function getS10Configs(): S10Config[] {
  return s10Database;
}

export function getS10ConfigsByYear(year: number): S10Config[] {
  return s10Database.filter(c => c.year === year);
}

export function findBestConfig(
  year: number,
  trim?: string | null,
  engineCode?: string | null,
  drivetrain?: string | null,
  cabConfig?: string | null,
): S10Config | null {
  const byYear = getS10ConfigsByYear(year);
  if (byYear.length === 0) return null;

  let candidates = byYear;

  if (trim) {
    const byTrim = candidates.filter(c => c.trim.toLowerCase() === trim.toLowerCase());
    if (byTrim.length) candidates = byTrim;
  }

  if (engineCode) {
    const byEngine = candidates.filter(c => c.engineCode.toLowerCase() === engineCode.toLowerCase());
    if (byEngine.length) candidates = byEngine;
  }

  if (drivetrain) {
    const map: Record<string, string> = { "1": "RWD", "2": "4WD", "4": "4WD" };
    const driveStr = map[drivetrain] ?? drivetrain;
    const byDrive = candidates.filter(c => c.drivetrain === driveStr);
    if (byDrive.length) candidates = byDrive;
  }

  if (cabConfig) {
    const byCAB = candidates.filter(c => c.cabConfig.toLowerCase().includes(cabConfig.toLowerCase()));
    if (byCAB.length) candidates = byCAB;
  }

  return candidates[0] ?? null;
}
