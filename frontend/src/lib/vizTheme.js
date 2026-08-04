// Chart color + chrome tokens for the end-of-game dashboard.
//
// The app is LIGHT ONLY — there is no dark mode, so there are no dark steps here.
// Every chart renders on the `Card` surface, which is #FFFFFF (see UI.jsx). If a
// chart ever moves onto the page plane (brand-parchment #F8F5F0), re-run the
// validator with --surface "#F8F5F0".
//
// Nothing in this file is eyeballed. Each set below records the validator command
// that cleared it.

/**
 * Categorical series palette — player identity.
 *
 * validated: node scripts/validate_palette.js \
 *   "#2a78d6,#eb6834,#1baf7a,#eda100,#e87ba4,#008300" --mode light --surface "#ffffff"
 * → ALL CHECKS PASS · adjacent CVD ΔE 9.1 (protan) · normal-vision ΔE 19.6
 * → WARN: #1baf7a (2.82:1), #eda100 (2.17:1), #e87ba4 (2.69:1) sit below 3:1 on
 *   white. That WARN is not dismissable — it obligates relief, which this
 *   dashboard supplies as line endpoint labels (§4.1) and the full scoresheet
 *   (§4.6). Do not remove both of those.
 *
 * Exactly 6 slots because the game caps at 6 players. There is deliberately no
 * modulo cycling: a 7th player must be a visible error, not a silent color
 * collision.
 */
export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300'];

/**
 * The 3 slots that also clear the ALL-PAIRS gate, for scatter/bubble forms where
 * any two marks can end up side by side.
 *
 * validated: node scripts/validate_palette.js \
 *   "#2a78d6,#eb6834,#1baf7a" --mode light --surface "#ffffff" --pairs all
 * → ALL CHECKS PASS · all-pairs CVD ΔE 9.2 · normal-vision ΔE 24.0
 *
 * Past 3 series no hue ordering is colorblind-safe under all-pairs, which is why
 * DaringScatter paints every dot SERIES_ALL_PAIRS[0] and puts identity on a
 * direct text label instead.
 */
export const SERIES_ALL_PAIRS = SERIES.slice(0, 3);

/**
 * Diverging pair — polarity around a baseline (over/underbid, points gained/lost).
 * Two hues that read as opposite, plus a NEUTRAL GRAY midpoint. Never a hue at
 * the midpoint.
 *
 * validated: node scripts/validate_palette.js \
 *   "#2a78d6,#e34948" --mode light --surface "#ffffff"
 * → ALL CHECKS PASS · CVD ΔE 21.6 · normal-vision ΔE 32.3 · both ≥ 3:1 on white
 */
export const DIVERGING = {
  positive: '#2a78d6', // blue pole
  negative: '#e34948', // red pole
  midpoint: '#f0efec', // neutral gray zero rule
};

/**
 * Score-composition fills (§4.5). NOT a categorical palette — read it as two
 * separate encodings sharing one bar:
 *
 *  - the positive arm is an ORDINAL two-step of ONE hue (blue), so bid points and
 *    bonus points read as parts of one quantity;
 *  - the negative arm is the red pole of DIVERGING above.
 *
 * validated (positive arm, as the ordinal ramp it is):
 *   node scripts/validate_palette.js "#2a78d6,#86b6ef" \
 *     --mode light --surface "#ffffff" --ordinal
 *   → ALL CHECKS PASS · monotone L · adjacent ΔL ≥ 0.06 · light end 2.06:1 · hue spread 2°
 * validated (the two poles, as the categorical pair they are): see DIVERGING.
 *
 * #86b6ef is step 250 of the blue ramp — the documented light-mode ordinal floor.
 * Running the CATEGORICAL validator over all three at once reports a chroma-floor
 * FAIL on #86b6ef (0.097 vs 0.10) and that is expected, not a real failure: the
 * categorical checks are scoped to series identity, and two steps of one hue are
 * an ordinal ramp by construction (see the skill's scope note). Its identity
 * comes from stack position + legend, not from hue.
 */
export const COMPOSITION = {
  bidPoints: '#2a78d6',
  bonus: '#86b6ef',
  penalties: '#e34948',
};

/**
 * Status palette — reserved for good/bad state. NEVER reused as "series 4", and
 * never shipped as color alone: always with an icon + a label.
 */
export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
};

/** Chart chrome and ink. Text always wears an ink token, never a series color. */
export const CHROME = {
  surface: '#ffffff', // the Card
  pagePlane: '#F8F5F0', // brand-parchment
  inkPrimary: '#0b0b0b',
  inkSecondary: '#52514e',
  inkMuted: '#898781', // axis ticks, quadrant names, explanation lines
  grid: '#e1e0d9', // hairline, SOLID — never dashed
  axis: '#c3c2b7', // baselines, reference lines
};

/**
 * Card height for a one-bar-per-player horizontal chart.
 *
 * A fixed height leaves a 6-player chart cramped and a 3-player chart mostly empty
 * air, and "compact and uncluttered" is a hard requirement here. Scaling with the
 * roster keeps the band-to-bar ratio constant. The constant covers the title, the
 * legend row, and the x-axis band — so the axis labels are always inside the card
 * and never get their own nested scrollbar.
 */
export const barChartHeight = (playerCount) => Math.max(240, 96 + playerCount * 46);

/** Height of the two charts in the top row, which sit side by side and must match. */
export const HERO_CHART_HEIGHT = 500;

/**
 * Color for a player, keyed on their seat.
 *
 * Identity follows the ENTITY, never its rank: a player must keep the same color
 * when the standings reshuffle, so this takes `seat_index` and nothing else.
 * Returns muted ink past slot 6 rather than cycling — a 7th player should look
 * wrong, not look like player 1.
 */
export function colorForSeat(seatIndex) {
  return SERIES[seatIndex] ?? CHROME.inkMuted;
}

/**
 * Seat-ordered players with their color attached. Every chart maps over this so
 * color assignment is defined in exactly one place.
 */
export function playersInSeatOrder(players = []) {
  return [...players]
    .sort((a, b) => a.seat_index - b.seat_index)
    .map((p) => ({ ...p, color: colorForSeat(p.seat_index) }));
}
