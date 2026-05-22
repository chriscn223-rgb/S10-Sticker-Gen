import type { Sticker } from "@workspace/api-client-react/src/generated/api.schemas";

// ─── Equipment categorizer ─────────────────────────────────────────────────

interface EquipmentCategory {
  label: string;
  items: string[];
}

const CATEGORY_RULES: { label: string; keywords: RegExp }[] = [
  {
    label: "COMFORT",
    keywords:
      /\b(seat|cloth|vinyl|upholstery|carpet|floor mat|floor covering|bucket|bench|lumbar|armrest|headrest|cushion|reclining)\b/i,
  },
  {
    label: "IN-CAR ENTERTAINMENT",
    keywords:
      /\b(radio|stereo|audio|speaker|cassette|cd|am\/fm|fm|equalizer|subwoofer|antenna|satellite)\b/i,
  },
  {
    label: "POWERTRAIN AND MECHANICAL",
    keywords:
      /\b(engine|transmission|drivetrain|drive|axle|suspension|steering|oil|exhaust|v6|v-6|v8|4-cylinder|i4|i-4|speed|manual|automatic|4wd|rwd|awd|4x4|4x2|horsepower|torque|spark|ignition|cylinder|fuel inject|throttle|skid plate|locking|differential|transfer case|coolant|radiator|belt|chain)\b/i,
  },
  {
    label: "SAFETY AND SECURITY",
    keywords:
      /\b(airbag|air bag|abs|antilock|anti-lock|theft|alarm|seatbelt|seat belt|brake|crumple|rollover|side impact|child safety|daytime running|hazard)\b/i,
  },
  {
    label: "CONVENIENCE",
    keywords:
      /\b(gauge|mirror|wiper|reading light|outlet|visor|reminder|voltmeter|tachometer|odometer|trip|compass|temperature|clock|cruise|power window|power lock|power door|keyless|tilt|intermittent|auto-dimming|auto dimming|heated|ventilated|12v|power outlet)\b/i,
  },
  {
    label: "EXTERIOR AND APPEARANCE",
    keywords:
      /\b(bumper|wheel|tire|paint|grille|box|pickup box|spare|molding|stripe|window tint|tinted|trailer|hitch|tonneau|step|running board|fender|door handle|mirror cap|badge|chrome|body color|spoiler|vent|sunroof|moonroof|roof|bed liner|cargo|mud flap|fog lamp|fog light|exterior|appearance|coat)\b/i,
  },
];

function categorizeEquipment(items: string[]): EquipmentCategory[] {
  const buckets: Record<string, string[]> = {};
  const uncategorized: string[] = [];

  for (const item of items) {
    let matched = false;
    for (const rule of CATEGORY_RULES) {
      if (rule.keywords.test(item)) {
        if (!buckets[rule.label]) buckets[rule.label] = [];
        buckets[rule.label].push(item);
        matched = true;
        break;
      }
    }
    if (!matched) uncategorized.push(item);
  }

  // Push uncategorized into most likely bucket based on first word
  for (const item of uncategorized) {
    if (!buckets["EXTERIOR AND APPEARANCE"]) buckets["EXTERIOR AND APPEARANCE"] = [];
    buckets["EXTERIOR AND APPEARANCE"].push(item);
  }

  // Return in canonical order
  return CATEGORY_RULES
    .filter((r) => buckets[r.label]?.length)
    .map((r) => ({ label: r.label, items: buckets[r.label] }));
}

// ─── Layout helpers ────────────────────────────────────────────────────────

const DEST_CHARGE = 450;

function fmt$(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

// Split categories into two roughly equal columns
function splitColumns(cats: EquipmentCategory[]): [EquipmentCategory[], EquipmentCategory[]] {
  const totalItems = cats.reduce((s, c) => s + c.items.length + 1, 0); // +1 for header
  let left: EquipmentCategory[] = [];
  let right: EquipmentCategory[] = [];
  let leftCount = 0;
  for (const cat of cats) {
    const size = cat.items.length + 1;
    if (leftCount < totalItems / 2) {
      left.push(cat);
      leftCount += size;
    } else {
      right.push(cat);
    }
  }
  if (left.length === 0 && right.length > 0) {
    left = right.splice(0, Math.ceil(right.length / 2));
  }
  return [left, right];
}

// ─── Sub-components ────────────────────────────────────────────────────────

function EquipCol({ categories }: { categories: EquipmentCategory[] }) {
  return (
    <div className="flex flex-col gap-3">
      {categories.map((cat) => (
        <div key={cat.label}>
          <div
            className="text-[8.5px] font-black tracking-[0.12em] uppercase mb-1 pb-0.5"
            style={{ borderBottom: "0.75px solid #222" }}
          >
            {cat.label}
          </div>
          <ul className="space-y-0">
            {cat.items.map((item, i) => (
              <li key={i} className="text-[9px] leading-[1.45] flex gap-1">
                <span className="shrink-0 mt-px">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export function StickerPreview({ sticker }: { sticker: Sticker }) {
  const optionsTotal = (sticker.selectedOptions ?? []).reduce((s, o) => s + o.price, 0);
  const totalPrice = sticker.msrpBase + optionsTotal + DEST_CHARGE;

  const categories = categorizeEquipment(sticker.standardEquipment ?? []);
  const [leftCats, rightCats] = splitColumns(categories);

  const city = sticker.epaCity ?? null;
  const hwy = sticker.epaHighway ?? null;
  const combined = city && hwy ? Math.round((city * 0.55 + hwy * 0.45)) : null;
  const annualFuel = combined ? Math.round((15000 / combined) * 3.5) : null;
  const fiveYearExtra = annualFuel ? Math.round((annualFuel - 2200) * 5) : null;
  const gp100 = combined ? (100 / combined).toFixed(1) : null;

  const modelCode = `C${sticker.year?.toString().slice(-2) ?? ""}S10${
    sticker.drivetrain === "4WD" ? "4" : "2"
  }`;

  return (
    <div
      id="sticker-preview-container"
      style={{
        width: "816px",
        backgroundColor: "#ffffff",
        border: "1.5px solid #111",
        padding: "0",
        fontFamily: "Arial, Helvetica, sans-serif",
        color: "#111111",
        fontSize: "10px",
      }}
    >
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <div
        style={{
          borderBottom: "2px solid #111",
          padding: "10px 16px 8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: 900,
              letterSpacing: "-0.5px",
              lineHeight: 1,
              textTransform: "uppercase",
            }}
          >
            CHEVROLET
          </div>
          <div style={{ fontSize: "9px", color: "#555", marginTop: "3px" }}>
            MANUFACTURER&apos;S SUGGESTED RETAIL PRICE LABEL
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "17px", fontWeight: 700, lineHeight: 1.2 }}>
            {sticker.year} {sticker.model?.toUpperCase()} {sticker.cabConfig?.toUpperCase()}
          </div>
          <div style={{ fontSize: "9px", color: "#444", marginTop: "2px" }}>
            TRIM: <strong>{sticker.trim}</strong> &nbsp;|&nbsp; MODEL NUMBER:{" "}
            <strong>{modelCode.toUpperCase()}</strong>
          </div>
          <div style={{ fontSize: "8px", color: "#666", marginTop: "1px", fontFamily: "Courier New, monospace" }}>
            VIN: {sticker.vin}
          </div>
        </div>
      </div>

      {/* ── COLUMN HEADER BAR ─────────────────────────────────────────── */}
      <div
        style={{
          borderBottom: "1px solid #111",
          backgroundColor: "#f0f0f0",
          padding: "3px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: "8.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          STANDARD EQUIPMENT AT NO EXTRA COST
        </div>
        <div style={{ fontSize: "8.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          MANUFACTURER&apos;S SUGGESTED RETAIL PRICE: <span style={{ fontSize: "11px" }}>{fmt$(sticker.msrpBase)}</span>
        </div>
      </div>

      {/* ── MAIN BODY ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", borderBottom: "1.5px solid #111" }}>

        {/* LEFT — Equipment Col 1 */}
        <div
          style={{
            flex: "1 1 0",
            borderRight: "1px solid #bbb",
            padding: "10px 12px 10px 16px",
          }}
        >
          <EquipCol categories={leftCats} />
        </div>

        {/* CENTER — Equipment Col 2 */}
        <div
          style={{
            flex: "1 1 0",
            borderRight: "1.5px solid #111",
            padding: "10px 12px",
          }}
        >
          <EquipCol categories={rightCats} />
        </div>

        {/* RIGHT — MSRP / Warranty / Options / EPA */}
        <div style={{ width: "242px", flexShrink: 0, display: "flex", flexDirection: "column" }}>

          {/* MSRP block */}
          <div style={{ padding: "8px 12px 6px", borderBottom: "1px solid #ccc" }}>
            <div style={{ fontSize: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
              MANUFACTURER&apos;S SUGGESTED RETAIL PRICE
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", marginBottom: "2px" }}>
              <span>Standard Vehicle Price</span>
              <strong>{fmt$(sticker.msrpBase)}</strong>
            </div>

            {(sticker.selectedOptions ?? []).length > 0 && (
              <>
                <div style={{ fontSize: "7.5px", fontWeight: 700, color: "#444", textTransform: "uppercase", margin: "4px 0 2px" }}>
                  OPTIONS INSTALLED BY MANUFACTURER
                </div>
                {(sticker.selectedOptions ?? []).map((opt, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "8.5px", lineHeight: 1.4, gap: "6px" }}>
                    <span style={{ flex: 1 }}>{opt.description}</span>
                    <strong style={{ whiteSpace: "nowrap" }}>{fmt$(opt.price)}</strong>
                  </div>
                ))}
              </>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                borderTop: "1px solid #888",
                marginTop: "4px",
                paddingTop: "3px",
                fontSize: "8.5px",
              }}
            >
              <span>Destination &amp; Delivery</span>
              <strong>{fmt$(DEST_CHARGE)}</strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                borderTop: "2px solid #111",
                marginTop: "3px",
                paddingTop: "4px",
              }}
            >
              <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase" }}>Total Vehicle Price</span>
              <strong style={{ fontSize: "14px" }}>{fmt$(totalPrice)}</strong>
            </div>
          </div>

          {/* Warranty block */}
          <div style={{ padding: "6px 12px", borderBottom: "1px solid #ccc" }}>
            <div style={{ fontSize: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "3px" }}>
              WARRANTY COVERAGE
            </div>
            {[
              ["Basic Warranty", "36 month / 36,000 miles"],
              ["Powertrain", "60 month / 60,000 miles"],
              ["Corrosion", "72 month / unlimited miles"],
              ["Roadside Assist", "60 month / 60,000 miles"],
            ].map(([label, coverage]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", lineHeight: 1.5 }}>
                <span style={{ color: "#444" }}>{label}:</span>
                <span style={{ fontWeight: 600 }}>{coverage}</span>
              </div>
            ))}
          </div>

          {/* Optional equipment block */}
          <div style={{ padding: "6px 12px", borderBottom: "1px solid #ccc", flex: "1 1 0" }}>
            <div style={{ fontSize: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "3px" }}>
              OPTIONAL EQUIPMENT
            </div>
            {(sticker.selectedOptions ?? []).length === 0 ? (
              <div style={{ fontSize: "8px", color: "#666", fontStyle: "italic" }}>
                No optional equipment selected.
              </div>
            ) : (
              (sticker.selectedOptions ?? []).map((opt, i) => (
                <div key={i} style={{ display: "flex", gap: "4px", fontSize: "8px", lineHeight: 1.45 }}>
                  <span style={{ fontFamily: "Courier New, monospace", backgroundColor: "#f0f0f0", padding: "0 2px", shrink: 0 }}>{opt.code}</span>
                  <span style={{ flex: 1 }}>{opt.description}</span>
                  <strong style={{ whiteSpace: "nowrap" }}>{fmt$(opt.price)}</strong>
                </div>
              ))
            )}

            {/* Colors if set */}
            {(sticker.exteriorColor || sticker.interiorColor) && (
              <div style={{ marginTop: "6px", paddingTop: "4px", borderTop: "0.5px solid #ccc" }}>
                {sticker.exteriorColor && (
                  <div style={{ fontSize: "8px" }}>
                    <span style={{ color: "#555" }}>Exterior Color: </span>
                    <strong style={{ textTransform: "uppercase" }}>{sticker.exteriorColor}</strong>
                  </div>
                )}
                {sticker.interiorColor && (
                  <div style={{ fontSize: "8px" }}>
                    <span style={{ color: "#555" }}>Interior Color: </span>
                    <strong style={{ textTransform: "uppercase" }}>{sticker.interiorColor}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* EPA block */}
          <div style={{ padding: "6px 12px", borderBottom: "1px solid #ccc", borderTop: "1.5px solid #111" }}>
            <div
              style={{
                fontSize: "7.5px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                borderBottom: "0.5px solid #999",
                paddingBottom: "3px",
                marginBottom: "5px",
              }}
            >
              EPA FUEL ECONOMY ESTIMATES
            </div>

            {/* MPG row */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "6px", marginBottom: "4px" }}>
              {/* City */}
              <div style={{ textAlign: "center", border: "1px solid #bbb", padding: "4px 8px", minWidth: "44px" }}>
                <div style={{ fontSize: "24px", fontWeight: 900, lineHeight: 1 }}>{city ?? "—"}</div>
                <div style={{ fontSize: "6.5px", textTransform: "uppercase", color: "#555", marginTop: "2px" }}>
                  CITY<br />MPG
                </div>
              </div>

              {/* Combined */}
              {combined && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "11px", fontWeight: 800, lineHeight: 1 }}>{combined}</div>
                  <div style={{ fontSize: "6px", color: "#555", textTransform: "uppercase" }}>Combined</div>
                </div>
              )}

              {/* Highway */}
              <div style={{ textAlign: "center", border: "1px solid #bbb", padding: "4px 8px", minWidth: "44px" }}>
                <div style={{ fontSize: "24px", fontWeight: 900, lineHeight: 1 }}>{hwy ?? "—"}</div>
                <div style={{ fontSize: "6.5px", textTransform: "uppercase", color: "#555", marginTop: "2px" }}>
                  HWY<br />MPG
                </div>
              </div>
            </div>

            {/* Stats row */}
            {(gp100 || annualFuel) && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "7.5px", color: "#444" }}>
                {gp100 && <span><strong>{gp100}</strong> gal/100 mi</span>}
                {annualFuel && <span>Est. annual fuel cost: <strong>{fmt$(annualFuel)}</strong></span>}
              </div>
            )}
            {fiveYearExtra !== null && fiveYearExtra > 0 && (
              <div style={{ fontSize: "7px", color: "#555", marginTop: "2px", textAlign: "center" }}>
                Est. <strong>{fmt$(fiveYearExtra)}</strong> more in fuel costs over 5 yrs vs avg vehicle
              </div>
            )}
            <div style={{ fontSize: "6.5px", color: "#888", marginTop: "3px", textAlign: "center" }}>
              fueleconomy.gov &nbsp;·&nbsp; Actual results will vary
            </div>
          </div>

          {/* Government Safety Ratings */}
          <div style={{ padding: "6px 12px" }}>
            <div style={{ fontSize: "7.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px", borderBottom: "0.5px solid #999", paddingBottom: "2px" }}>
              GOVERNMENT 5-STAR SAFETY RATINGS
            </div>
            {[
              ["Overall Vehicle Score", "Not Rated"],
              ["Frontal Crash — Driver", "Not Rated"],
              ["Frontal Crash — Passenger", "Not Rated"],
              ["Side Crash", "Not Rated"],
              ["Rollover Resistance", "Not Rated"],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "7.5px", lineHeight: 1.5, color: "#444" }}>
                <span>{label}</span>
                <span style={{ fontWeight: 600, color: "#222" }}>{val}</span>
              </div>
            ))}
            <div style={{ fontSize: "6.5px", color: "#888", marginTop: "3px" }}>
              Should only be compared to vehicles of similar size and weight.
            </div>
          </div>
        </div>
      </div>

      {/* ── POWERTRAIN SUMMARY BAR ─────────────────────────────────────── */}
      <div
        style={{
          borderBottom: "1px solid #ccc",
          padding: "5px 16px",
          display: "flex",
          gap: "24px",
          flexWrap: "wrap",
          backgroundColor: "#fafafa",
        }}
      >
        {[
          ["Engine", sticker.engine ?? "—"],
          ["Displacement", sticker.engineDisplacement ?? "—"],
          [sticker.horsepower ? "Horsepower" : null, sticker.horsepower ? `${sticker.horsepower} HP` : null],
          [sticker.torque ? "Torque" : null, sticker.torque ? `${sticker.torque} lb-ft` : null],
          ["Transmission", sticker.transmission ?? "—"],
          ["Drivetrain", sticker.drivetrain ?? "—"],
          ["Assembly Plant", sticker.assemblyPlant ?? "—"],
        ]
          .filter(([label]) => label !== null)
          .map(([label, val]) => (
            <div key={String(label)} style={{ fontSize: "8px" }}>
              <span style={{ color: "#666", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                {label}:{" "}
              </span>
              <span>{String(val)}</span>
            </div>
          ))}
      </div>

      {/* ── FOOTER DISCLAIMER ─────────────────────────────────────────── */}
      <div
        style={{
          padding: "5px 16px",
          fontSize: "6.5px",
          color: "#888",
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        THIS DOCUMENT IS A RECONSTRUCTED HISTORICAL REPRESENTATION FOR ENTHUSIAST AND REFERENCE USE ONLY.
        IT IS NOT AN OFFICIAL MONRONEY LABEL AND IS NOT AFFILIATED WITH OR ENDORSED BY GENERAL MOTORS,
        CHEVROLET, OR ANY ORIGINAL EQUIPMENT MANUFACTURER.
        SPECIFICATIONS, PRICING, AND EQUIPMENT ARE APPROXIMATE HISTORICAL VALUES. NOT A LEGAL DOCUMENT.
      </div>
    </div>
  );
}
