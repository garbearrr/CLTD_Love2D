import { Font } from "love.graphics";

export type CellMetrics = { font: Font, w: number, h: number, ascent: number };

const cache = new Map<number, CellMetrics>();

export function getFont(pixH: number) {
  let m = cache.get(pixH);
  if (m) return m;

  love.graphics.setDefaultFilter("nearest","nearest");   // one-time
  const font   = love.graphics.newFont("assets/MorePerfectDOSVGA.ttf", pixH, "mono");
  const w      = font.getWidth("W");     // advance width
  const h      = font.getHeight();       // == pixH
  const ascent = font.getAscent();

  m = { font, w, h, ascent };
  cache.set(pixH, m);
  return m;
}
