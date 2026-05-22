import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";

interface StickerOption {
  code: string;
  description: string;
  price: number;
}

interface StickerData {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  engine: string;
  engineDisplacement: string | null;
  engineCylinders: number | null;
  horsepower: number | null;
  torque: number | null;
  transmission: string;
  drivetrain: string;
  cabConfig: string;
  bodyStyle: string | null;
  assemblyPlant: string | null;
  exteriorColor: string | null;
  interiorColor: string | null;
  msrpBase: number;
  msrpTotal: number | null;
  epaCity: number | null;
  epaHighway: number | null;
  standardEquipment: string[];
  selectedOptions: StickerOption[];
}

const DEST_CHARGE = 450;

function fmt$(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Equipment categorizer (mirrors frontend) ──────────────────────────────

interface EquipCategory {
  label: string;
  items: string[];
}

const CAT_RULES: { label: string; re: RegExp }[] = [
  { label: "COMFORT", re: /\b(seat|cloth|vinyl|upholstery|carpet|floor mat|floor covering|bucket|bench|lumbar|armrest|headrest|cushion|reclining)\b/i },
  { label: "IN-CAR ENTERTAINMENT", re: /\b(radio|stereo|audio|speaker|cassette|cd|am\/fm|fm|equalizer|subwoofer|antenna|satellite)\b/i },
  { label: "POWERTRAIN AND MECHANICAL", re: /\b(engine|transmission|drivetrain|drive|axle|suspension|steering|oil|exhaust|v6|v-6|v8|4-cylinder|i4|i-4|speed|manual|automatic|4wd|rwd|awd|4x4|4x2|horsepower|torque|spark|ignition|cylinder|fuel inject|throttle|skid plate|locking|differential|transfer case|coolant|radiator|belt|chain)\b/i },
  { label: "SAFETY AND SECURITY", re: /\b(airbag|air bag|abs|antilock|anti-lock|theft|alarm|seatbelt|seat belt|brake|crumple|rollover|side impact|child safety|daytime running|hazard)\b/i },
  { label: "CONVENIENCE", re: /\b(gauge|mirror|wiper|reading light|outlet|visor|reminder|voltmeter|tachometer|odometer|trip|compass|temperature|clock|cruise|power window|power lock|power door|keyless|tilt|intermittent|auto-dimming|heated|ventilated|12v|power outlet)\b/i },
  { label: "EXTERIOR AND APPEARANCE", re: /\b(bumper|wheel|tire|paint|grille|box|pickup box|spare|molding|stripe|window tint|tinted|trailer|hitch|step|running board|fender|door handle|badge|chrome|body color|spoiler|sunroof|roof|bed liner|cargo|mud flap|fog lamp|fog light|exterior|appearance)\b/i },
];

function categorize(items: string[]): EquipCategory[] {
  const buckets: Record<string, string[]> = {};
  const other: string[] = [];
  for (const item of items) {
    let hit = false;
    for (const r of CAT_RULES) {
      if (r.re.test(item)) {
        (buckets[r.label] ??= []).push(item);
        hit = true;
        break;
      }
    }
    if (!hit) other.push(item);
  }
  for (const item of other) {
    (buckets["EXTERIOR AND APPEARANCE"] ??= []).push(item);
  }
  return CAT_RULES
    .filter((r) => buckets[r.label]?.length)
    .map((r) => ({ label: r.label, items: buckets[r.label] }));
}

// ─── PDF drawing helpers ───────────────────────────────────────────────────

function wrapText(text: string, maxWidth: number, font: PDFFont, size: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawLine(page: PDFPage, x1: number, y1: number, x2: number, y2: number, thickness = 0.5, color = rgb(0, 0, 0)) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
}

function drawRect(page: PDFPage, x: number, y: number, w: number, h: number, color: ReturnType<typeof rgb>) {
  page.drawRectangle({ x, y: y - h, width: w, height: h, color });
}

function text(
  page: PDFPage,
  t: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color = rgb(0, 0, 0),
) {
  if (!t) return;
  page.drawText(t, { x, y, size, font, color });
}

function rightText(
  page: PDFPage,
  t: string,
  rightEdge: number,
  y: number,
  font: PDFFont,
  size: number,
  color = rgb(0, 0, 0),
) {
  const w = font.widthOfTextAtSize(t, size);
  text(page, t, rightEdge - w, y, font, size, color);
}

// ─── Main generator ────────────────────────────────────────────────────────

export async function generateStickerPdf(s: StickerData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  // Letter: 612 × 792
  const page = doc.addPage([612, 792]);
  const { width, height } = page.getSize();

  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const oblique = await doc.embedFont(StandardFonts.HelveticaOblique);
  const mono = await doc.embedFont(StandardFonts.Courier);

  const BLACK = rgb(0, 0, 0);
  const GRAY = rgb(0.4, 0.4, 0.4);
  const LGRAY = rgb(0.85, 0.85, 0.85);
  const FGRAY = rgb(0.96, 0.96, 0.96);
  const WHITE = rgb(1, 1, 1);

  const M = 22; // margin
  const CW = width - M * 2; // content width

  // Column layout: left equip | right equip | right panel
  const rightPanelW = 168;
  const equipW = (CW - rightPanelW) / 2 - 3;
  const col1X = M;
  const col2X = M + equipW + 6;
  const rightPanelX = M + (CW - rightPanelW);

  let y = height - M;

  // ─── HEADER ─────────────────────────────────────────────────────────────
  // "CHEVROLET" large
  text(page, "CHEVROLET", M, y - 2, bold, 24, BLACK);

  // Right side header
  const vehicleTitle = `${s.year} ${s.model.toUpperCase()} ${s.cabConfig.toUpperCase()}`;
  rightText(page, vehicleTitle, M + CW, y - 2, bold, 12, BLACK);

  const modelCode = `C${String(s.year).slice(-2)}S10${s.drivetrain === "4WD" ? "4" : "2"}`;
  rightText(page, `TRIM: ${s.trim}   MODEL NUMBER: ${modelCode.toUpperCase()}`, M + CW, y - 14, reg, 7, GRAY);
  rightText(page, `VIN: ${s.vin}`, M + CW, y - 23, mono, 7, GRAY);

  y -= 32;
  drawLine(page, M, y, M + CW, y, 1.5, BLACK);
  y -= 1;

  // ─── SUB-HEADER BAR ────────────────────────────────────────────────────
  drawRect(page, M, y + 1, CW, 13, FGRAY);
  text(page, "STANDARD EQUIPMENT AT NO EXTRA COST", M + 3, y - 8, bold, 6.5, BLACK);
  const msrpLabel = `MANUFACTURER'S SUGGESTED RETAIL PRICE: ${fmt$(s.msrpBase)}`;
  rightText(page, msrpLabel, M + CW - 3, y - 8, bold, 6.5, BLACK);

  y -= 13;
  drawLine(page, M, y, M + CW, y, 1, BLACK);
  y -= 1;

  // ─── EQUIPMENT COLUMNS ──────────────────────────────────────────────────
  const categories = categorize(s.standardEquipment);

  // Split cats into 2 roughly equal columns
  const totalItems = categories.reduce((sum, c) => sum + c.items.length + 1.5, 0);
  let leftCats: EquipCategory[] = [];
  let rightCats: EquipCategory[] = [];
  let leftCount = 0;
  for (const cat of categories) {
    if (leftCount < totalItems / 2) {
      leftCats.push(cat);
      leftCount += cat.items.length + 1.5;
    } else {
      rightCats.push(cat);
    }
  }
  if (!leftCats.length && rightCats.length) {
    leftCats = rightCats.splice(0, Math.ceil(rightCats.length / 2));
  }

  const EQUIP_TOP = y;
  const LINE_H = 8.5;
  const CAT_H = 11;

  function drawEquipColumn(cats: EquipCategory[], x: number, colW: number): number {
    let cy = EQUIP_TOP - 5;
    for (const cat of cats) {
      drawLine(page, x, cy, x + colW, cy, 0.5, rgb(0.6, 0.6, 0.6));
      cy -= 1.5;
      text(page, cat.label, x + 2, cy - 7, bold, 6, BLACK);
      cy -= CAT_H;
      for (const item of cat.items) {
        const lines = wrapText(item, colW - 10, reg, 6.5);
        for (let i = 0; i < lines.length; i++) {
          if (i === 0) text(page, "\u2022", x + 2, cy - 0.5, reg, 6, BLACK);
          text(page, lines[i], x + 9, cy - 0.5, reg, 6.5, BLACK);
          cy -= LINE_H;
        }
      }
    }
    return cy;
  }

  const leftBottom = drawEquipColumn(leftCats, col1X, equipW);
  const rightBottom = drawEquipColumn(rightCats, col2X, equipW);

  // ─── RIGHT PANEL ────────────────────────────────────────────────────────
  const rpX = rightPanelX;
  const rpW = rightPanelW;
  drawLine(page, rpX - 1, EQUIP_TOP, rpX - 1, 50, 1.5, BLACK);

  let ry = EQUIP_TOP - 5;

  // MSRP section
  text(page, "MANUFACTURER'S SUGGESTED RETAIL PRICE", rpX + 2, ry - 7, bold, 5.5, BLACK);
  ry -= 12;

  drawLine(page, rpX, ry, rpX + rpW, ry, 0.5, LGRAY);
  ry -= 1;

  const optionsTotal = s.selectedOptions.reduce((sum, o) => sum + o.price, 0);
  const total = s.msrpBase + optionsTotal + DEST_CHARGE;

  // Standard price row
  text(page, "Standard Vehicle Price", rpX + 2, ry - 7.5, reg, 7, BLACK);
  rightText(page, fmt$(s.msrpBase), rpX + rpW - 2, ry - 7.5, bold, 7, BLACK);
  ry -= 10;

  // Options
  if (s.selectedOptions.length > 0) {
    text(page, "OPTIONS INSTALLED BY MANUFACTURER", rpX + 2, ry - 7, bold, 5, GRAY);
    ry -= 9;
    for (const opt of s.selectedOptions) {
      const descLines = wrapText(opt.description, rpW - 36, reg, 6);
      text(page, descLines[0] ?? opt.description, rpX + 2, ry - 6.5, reg, 6, BLACK);
      rightText(page, fmt$(opt.price), rpX + rpW - 2, ry - 6.5, bold, 6, BLACK);
      ry -= 9;
    }
  }

  // Dest charge
  drawLine(page, rpX + 2, ry, rpX + rpW - 2, ry, 0.5, GRAY);
  ry -= 1;
  text(page, "Destination & Delivery", rpX + 2, ry - 7.5, reg, 6.5, BLACK);
  rightText(page, fmt$(DEST_CHARGE), rpX + rpW - 2, ry - 7.5, bold, 6.5, BLACK);
  ry -= 10;

  // Total
  drawLine(page, rpX + 2, ry, rpX + rpW - 2, ry, 1, BLACK);
  ry -= 2;
  text(page, "TOTAL VEHICLE PRICE", rpX + 2, ry - 9, bold, 7.5, BLACK);
  rightText(page, fmt$(total), rpX + rpW - 2, ry - 10, bold, 11, BLACK);
  ry -= 16;
  drawLine(page, rpX, ry, rpX + rpW, ry, 0.5, LGRAY);
  ry -= 3;

  // Warranty
  text(page, "WARRANTY COVERAGE", rpX + 2, ry - 7, bold, 5.5, BLACK);
  ry -= 10;
  for (const [label, val] of [
    ["Basic Warranty", "36 mo / 36,000 mi"],
    ["Powertrain", "60 mo / 60,000 mi"],
    ["Corrosion", "72 mo / unlimited"],
    ["Roadside", "60 mo / 60,000 mi"],
  ]) {
    text(page, `${label}:`, rpX + 2, ry - 6, reg, 6, GRAY);
    rightText(page, val, rpX + rpW - 2, ry - 6, bold, 6, BLACK);
    ry -= 8.5;
  }
  drawLine(page, rpX, ry, rpX + rpW, ry, 0.5, LGRAY);
  ry -= 3;

  // Optional equipment header
  text(page, "OPTIONAL EQUIPMENT", rpX + 2, ry - 7, bold, 5.5, BLACK);
  ry -= 10;

  if (s.selectedOptions.length === 0) {
    text(page, "No optional equipment selected.", rpX + 2, ry - 6, oblique, 6, GRAY);
    ry -= 10;
  } else {
    for (const opt of s.selectedOptions) {
      text(page, opt.code, rpX + 2, ry - 6, mono, 6, BLACK);
      const descLines = wrapText(opt.description, rpW - 36, reg, 6);
      text(page, descLines[0] ?? "", rpX + 20, ry - 6, reg, 6, BLACK);
      rightText(page, fmt$(opt.price), rpX + rpW - 2, ry - 6, bold, 6, BLACK);
      ry -= 8.5;
    }
  }

  // Colors
  if (s.exteriorColor || s.interiorColor) {
    drawLine(page, rpX, ry, rpX + rpW, ry, 0.5, LGRAY);
    ry -= 4;
    if (s.exteriorColor) {
      text(page, `Exterior: ${s.exteriorColor.toUpperCase()}`, rpX + 2, ry - 6, reg, 6, BLACK);
      ry -= 8.5;
    }
    if (s.interiorColor) {
      text(page, `Interior: ${s.interiorColor.toUpperCase()}`, rpX + 2, ry - 6, reg, 6, BLACK);
      ry -= 8.5;
    }
  }

  // ─── EPA SECTION ────────────────────────────────────────────────────────
  drawLine(page, rpX, ry + 2, rpX + rpW, ry + 2, 1.5, BLACK);
  ry -= 3;
  drawRect(page, rpX, ry + 1, rpW, 11, FGRAY);
  text(page, "EPA FUEL ECONOMY ESTIMATES", rpX + 2, ry - 7.5, bold, 5.5, BLACK);
  ry -= 12;

  const city = s.epaCity;
  const hwy = s.epaHighway;
  const combined = city && hwy ? Math.round(city * 0.55 + hwy * 0.45) : null;
  const annualFuel = combined ? Math.round((15000 / combined) * 3.5) : null;
  const gp100 = combined ? (100 / combined).toFixed(1) : null;

  // City box
  const boxW = 42;
  const boxH = 32;
  const cityX = rpX + 4;
  const hwyX = rpX + rpW - 4 - boxW;
  const comX = rpX + (rpW - 22) / 2;

  page.drawRectangle({ x: cityX, y: ry - boxH, width: boxW, height: boxH, borderColor: LGRAY, borderWidth: 0.75 });
  const cityStr = city ? String(city) : "—";
  const cityW = bold.widthOfTextAtSize(cityStr, 18);
  text(page, cityStr, cityX + (boxW - cityW) / 2, ry - 20, bold, 18, BLACK);
  const cityLabel = "CITY MPG";
  const clW = reg.widthOfTextAtSize(cityLabel, 5.5);
  text(page, cityLabel, cityX + (boxW - clW) / 2, ry - 30, reg, 5.5, GRAY);

  // Hwy box
  page.drawRectangle({ x: hwyX, y: ry - boxH, width: boxW, height: boxH, borderColor: LGRAY, borderWidth: 0.75 });
  const hwyStr = hwy ? String(hwy) : "—";
  const hwyW = bold.widthOfTextAtSize(hwyStr, 18);
  text(page, hwyStr, hwyX + (boxW - hwyW) / 2, ry - 20, bold, 18, BLACK);
  const hwyLabel = "HWY MPG";
  const hlW = reg.widthOfTextAtSize(hwyLabel, 5.5);
  text(page, hwyLabel, hwyX + (hlW < boxW ? (boxW - hlW) / 2 : 0) + hwyX - hwyX, ry - 30, reg, 5.5, GRAY);
  // Re-draw hwy label correctly
  page.drawText(hwyLabel, { x: hwyX + (boxW - hlW) / 2, y: ry - 30, size: 5.5, font: reg, color: GRAY });

  // Combined
  if (combined) {
    const combStr = String(combined);
    const cbW = bold.widthOfTextAtSize(combStr, 10);
    text(page, combStr, comX + (22 - cbW) / 2, ry - 15, bold, 10, BLACK);
    text(page, "COMB", comX + 2, ry - 24, reg, 5, GRAY);
  }

  ry -= boxH + 4;

  if (gp100) {
    text(page, `${gp100} gal per 100 mi`, rpX + 2, ry - 6, reg, 5.5, GRAY);
    ry -= 8;
  }
  if (annualFuel) {
    text(page, `Est. annual fuel cost: ${fmt$(annualFuel)}`, rpX + 2, ry - 6, reg, 5.5, GRAY);
    ry -= 8;
  }
  text(page, "fueleconomy.gov  •  Actual results will vary", rpX + 2, ry - 6, oblique, 5, GRAY);
  ry -= 10;

  // ─── SAFETY RATINGS ─────────────────────────────────────────────────────
  drawLine(page, rpX, ry + 2, rpX + rpW, ry + 2, 0.5, LGRAY);
  ry -= 2;
  text(page, "GOVERNMENT 5-STAR SAFETY RATINGS", rpX + 2, ry - 7, bold, 5.5, BLACK);
  ry -= 10;
  for (const [label, val] of [
    ["Overall Score", "Not Rated"],
    ["Frontal — Driver", "Not Rated"],
    ["Frontal — Passenger", "Not Rated"],
    ["Side Crash", "Not Rated"],
    ["Rollover", "Not Rated"],
  ]) {
    text(page, label, rpX + 2, ry - 6, reg, 5.5, GRAY);
    rightText(page, val, rpX + rpW - 2, ry - 6, bold, 5.5, BLACK);
    ry -= 8;
  }
  text(page, "Compare only to vehicles of similar size/weight.", rpX + 2, ry - 5.5, oblique, 4.8, GRAY);

  // ─── POWERTRAIN BAR ─────────────────────────────────────────────────────
  const equipBottom = Math.min(leftBottom, rightBottom);
  const barY = Math.min(ry - 8, equipBottom) - 4;

  drawLine(page, M, barY + 1, M + CW, barY + 1, 1, BLACK);
  drawRect(page, M, barY + 1, CW, 13, FGRAY);

  let bx = M + 4;
  const pwFields: [string, string][] = [
    ["Engine", s.engine],
    ["Displacement", s.engineDisplacement ?? "—"],
    ...(s.horsepower ? [["HP", `${s.horsepower}`] as [string, string]] : []),
    ...(s.torque ? [["Torque", `${s.torque} lb-ft`] as [string, string]] : []),
    ["Trans", s.transmission],
    ["Drive", s.drivetrain],
    ...(s.assemblyPlant ? [["Plant", s.assemblyPlant] as [string, string]] : []),
  ];
  for (const [label, val] of pwFields) {
    const lw = bold.widthOfTextAtSize(`${label}: `, 6);
    text(page, `${label}: `, bx, barY - 8, bold, 6, GRAY);
    text(page, val, bx + lw, barY - 8, reg, 6, BLACK);
    bx += lw + reg.widthOfTextAtSize(val, 6) + 10;
    if (bx > M + CW - rightPanelW - 10) break;
  }
  drawLine(page, M, barY - 12, M + CW, barY - 12, 1, BLACK);

  // ─── FOOTER DISCLAIMER ──────────────────────────────────────────────────
  const footerY = barY - 14;
  const disclaimer =
    "THIS DOCUMENT IS A RECONSTRUCTED HISTORICAL REPRESENTATION FOR ENTHUSIAST AND REFERENCE USE ONLY. " +
    "NOT AN OFFICIAL MONRONEY LABEL. NOT AFFILIATED WITH OR ENDORSED BY GENERAL MOTORS, CHEVROLET, OR ANY OEM. " +
    `Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.`;
  const dLines = wrapText(disclaimer, CW, oblique, 5);
  let dy = footerY;
  for (const line of dLines) {
    text(page, line, M, dy, oblique, 5, GRAY);
    dy -= 7;
  }

  return doc.save();
}
