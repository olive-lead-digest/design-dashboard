// Floor plan generation — pure functions, zero external services ($0).
// 2D: architectural-style SVG. 3D: JSON box model consumed by the Three.js viewer.

export interface PlanRoom {
  name: string;
  x: number; // feet
  y: number;
  w: number;
  h: number;
  sqft: number;
}

export interface PlanLayout {
  totalW: number; // feet
  totalH: number;
  rooms: PlanRoom[];
}

const ROOM_FILLS = ['#F0FDFA', '#FEF9EC', '#EFF6FF', '#FDF2F8', '#F5F3FF', '#F0FDF4', '#FFF7ED'];

/** Render an architectural 2D SVG floor plan from a layout. */
export function generateFloorPlanSVG(layout: PlanLayout, title: string): string {
  const S = 8; // px per foot
  const PAD = 60;
  const W = layout.totalW * S + PAD * 2;
  const H = layout.totalH * S + PAD * 2 + 40;
  const px = (ft: number) => ft * S + PAD;

  const grid: string[] = [];
  for (let gx = 0; gx <= layout.totalW; gx += 5)
    grid.push(`<line x1="${px(gx)}" y1="${PAD}" x2="${px(gx)}" y2="${px(layout.totalH)}" stroke="#E5E7EB" stroke-width="0.5"/>`);
  for (let gy = 0; gy <= layout.totalH; gy += 5)
    grid.push(`<line x1="${PAD}" y1="${px(gy)}" x2="${px(layout.totalW)}" y2="${px(gy)}" stroke="#E5E7EB" stroke-width="0.5"/>`);

  const rooms = layout.rooms
    .map((r, i) => {
      const fill = ROOM_FILLS[i % ROOM_FILLS.length];
      const cx = px(r.x) + (r.w * S) / 2;
      const cy = px(r.y) + (r.h * S) / 2;
      return `
  <g class="room" data-room="${r.name}" data-sqft="${r.sqft}">
    <rect x="${px(r.x)}" y="${px(r.y)}" width="${r.w * S}" height="${r.h * S}" fill="${fill}" stroke="#0F172A" stroke-width="2.5"/>
    <text x="${cx}" y="${cy - 8}" text-anchor="middle" font-family="Inter,Arial" font-size="12" font-weight="600" fill="#0F172A">${r.name}</text>
    <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-family="Inter,Arial" font-size="10" fill="#6B7280">${r.w}' × ${r.h}' · ${r.sqft} sqft</text>
    <line x1="${px(r.x) + 6}" y1="${px(r.y) + r.h * S}" x2="${px(r.x) + Math.min(r.w * S * 0.3, 30) + 6}" y2="${px(r.y) + r.h * S}" stroke="#ffffff" stroke-width="3"/>
  </g>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Inter,Arial">
  <rect width="${W}" height="${H}" fill="#FFFFFF"/>
  ${grid.join('')}
  <rect x="${PAD}" y="${PAD}" width="${layout.totalW * S}" height="${layout.totalH * S}" fill="none" stroke="#0F172A" stroke-width="5"/>
  ${rooms}
  <text x="${PAD}" y="${H - 18}" font-size="13" font-weight="700" fill="#0F172A">${title}</text>
  <text x="${W - PAD}" y="${H - 18}" text-anchor="end" font-size="11" fill="#6B7280">Scale 1:${Math.round(96 / S)} · Olive Living D&amp;PM</text>
  <g>
    <line x1="${PAD}" y1="${PAD - 20}" x2="${px(layout.totalW)}" y2="${PAD - 20}" stroke="#14B8A6" stroke-width="1.5"/>
    <text x="${(PAD + px(layout.totalW)) / 2}" y="${PAD - 26}" text-anchor="middle" font-size="11" fill="#14B8A6">${layout.totalW}'-0"</text>
    <line x1="${PAD - 20}" y1="${PAD}" x2="${PAD - 20}" y2="${px(layout.totalH)}" stroke="#14B8A6" stroke-width="1.5"/>
    <text x="${PAD - 26}" y="${(PAD + px(layout.totalH)) / 2}" text-anchor="middle" font-size="11" fill="#14B8A6" transform="rotate(-90 ${PAD - 26} ${(PAD + px(layout.totalH)) / 2})">${layout.totalH}'-0"</text>
  </g>
</svg>`;
}

export interface Box3D {
  name: string; x: number; y: number; z: number; w: number; d: number; h: number; color: string;
}

/** 3D model JSON — walls per room extruded to 10ft, consumed by FloorPlan3DViewer. */
export function generate3DModel(layout: PlanLayout): { totalW: number; totalD: number; wallHeight: number; boxes: Box3D[] } {
  const COLORS = ['#14B8A6', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#F97316'];
  return {
    totalW: layout.totalW,
    totalD: layout.totalH,
    wallHeight: 10,
    boxes: layout.rooms.map((r, i) => ({
      name: r.name,
      x: r.x, y: 0, z: r.y, w: r.w, d: r.h, h: 10,
      color: COLORS[i % COLORS.length],
    })),
  };
}

/** Auto-generate a plausible layout for a NEW plan version (tester mode "Generate"). */
export function autoGenerateLayout(opts: { widthFt?: number; depthFt?: number; rooms?: number; designType?: string }): PlanLayout {
  const totalW = opts.widthFt && opts.widthFt >= 30 ? opts.widthFt : 60;
  const totalH = opts.depthFt && opts.depthFt >= 20 ? opts.depthFt : 40;
  const n = Math.min(Math.max(opts.rooms ?? 6, 3), 9);
  const names =
    opts.designType === 'Commercial'
      ? ['Retail Front', 'Co-work Zone A', 'Co-work Zone B', 'Meeting Suite', 'Cafe', 'Utilities', 'Lobby', 'Storage', 'Admin']
      : ['Reception & Lounge', 'Deluxe Room 101', 'Deluxe Room 102', 'Suite 103', 'Cafe & Pantry', 'Back Office', 'Deluxe Room 104', 'Gym', 'Store'];
  const corridorH = 8;
  const topH = Math.round((totalH - corridorH) * 0.55);
  const botH = totalH - corridorH - topH;
  const topCount = Math.ceil(n / 2);
  const botCount = n - topCount;
  const rooms: PlanRoom[] = [];
  const topW = Math.floor(totalW / topCount);
  for (let i = 0; i < topCount; i++) {
    const w = i === topCount - 1 ? totalW - topW * (topCount - 1) : topW;
    rooms.push({ name: names[i], x: topW * i, y: 0, w, h: topH, sqft: w * topH });
  }
  if (botCount > 0) {
    const botW = Math.floor(totalW / botCount);
    for (let i = 0; i < botCount; i++) {
      const w = i === botCount - 1 ? totalW - botW * (botCount - 1) : botW;
      rooms.push({ name: names[topCount + i], x: botW * i, y: topH + corridorH, w, h: botH, sqft: w * botH });
    }
  }
  rooms.push({ name: 'Corridor & Core', x: 0, y: topH, w: totalW, h: corridorH, sqft: totalW * corridorH });
  return { totalW, totalH, rooms };
}
