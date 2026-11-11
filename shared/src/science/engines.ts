/**
 * Small, deterministic science calculation engines for NOVA.
 * SI units are used internally and wherever explicitly noted.
 */

export const STANDARD_GRAVITY_M_S2 = 9.80665;
export const UNIVERSAL_GAS_CONSTANT_J_MOL_K = 8.31446261815324;

export interface ProjectileInput {
  /** Launch speed in metres per second; must be >= 0. */
  speedMPerS: number;
  /** Launch angle above the horizontal, in degrees; accepted range [-90, 90]. */
  angleDeg: number;
  /** Initial height above the level ground, in metres; must be >= 0. */
  initialHeightM?: number;
  /** Positive gravitational acceleration in m/s². Defaults to standard gravity. */
  gravityMPerS2?: number;
  /** Number of evenly spaced trajectory samples, including endpoints. Defaults to 51. */
  samples?: number;
}

export interface ProjectilePoint { timeS: number; xM: number; yM: number }
export interface ProjectileResult {
  flightTimeS: number;
  horizontalRangeM: number;
  maximumHeightM: number;
  finalVerticalVelocityMPerS: number;
  trajectory: ProjectilePoint[];
}

/**
 * Computes an ideal projectile trajectory over flat, level ground, neglecting
 * air resistance and Earth's curvature and treating gravity as constant.
 * Angles are measured from the horizontal. A zero-speed launch, or a launch
 * from ground level with no upward vertical velocity, has zero flight time.
 * All outputs are finite SI quantities; invalid or unrepresentable input throws.
 */
export function calculateProjectile(input: ProjectileInput): ProjectileResult {
  const speed = finiteNumber(input.speedMPerS, "speedMPerS");
  const angle = finiteNumber(input.angleDeg, "angleDeg");
  const height = input.initialHeightM === undefined ? 0 : finiteNumber(input.initialHeightM, "initialHeightM");
  const gravity = input.gravityMPerS2 === undefined ? STANDARD_GRAVITY_M_S2 : finiteNumber(input.gravityMPerS2, "gravityMPerS2");
  const samples = input.samples === undefined ? 51 : input.samples;
  if (speed < 0) throw new RangeError("speedMPerS must be non-negative");
  if (angle < -90 || angle > 90) throw new RangeError("angleDeg must be between -90 and 90 degrees");
  if (height < 0) throw new RangeError("initialHeightM must be non-negative");
  if (!(gravity > 0)) throw new RangeError("gravityMPerS2 must be positive");
  if (!Number.isInteger(samples) || samples < 2 || samples > 10001) throw new RangeError("samples must be an integer from 2 to 10001");

  const radians = angle * Math.PI / 180;
  const vx = speed * Math.cos(radians);
  const vy = speed * Math.sin(radians);
  // Positive root of height + vy*t - g*t²/2 = 0. This form is stable for
  // nonnegative height and upward launches; downward ground-level motion ends at t=0.
  let flightTime = 0;
  if (height > 0 || vy > 0) {
    const root = Math.sqrt(vy * vy + 2 * gravity * height);
    flightTime = (vy + root) / gravity;
  }
  const maximumHeight = height + Math.max(0, vy) ** 2 / (2 * gravity);
  const range = vx * flightTime;
  const finalVy = vy - gravity * flightTime;
  const values = [flightTime, maximumHeight, range, finalVy];
  if (!values.every(Number.isFinite)) throw new RangeError("Projectile result exceeds the finite numeric range");

  const trajectory: ProjectilePoint[] = [];
  for (let i = 0; i < samples; i++) {
    const t = flightTime * i / (samples - 1);
    const x = vx * t;
    const y = Math.max(0, height + vy * t - 0.5 * gravity * t * t);
    if (![t, x, y].every(Number.isFinite)) throw new RangeError("Projectile trajectory exceeds the finite numeric range");
    trajectory.push({ timeS: t, xM: x, yM: y });
  }
  // Avoid tiny floating-point drift at the analytically known ground endpoint.
  if (flightTime > 0) trajectory[trajectory.length - 1]!.yM = 0;
  return { flightTimeS: flightTime, horizontalRangeM: range, maximumHeightM: maximumHeight, finalVerticalVelocityMPerS: finalVy, trajectory };
}

export type UnitDimension = "length" | "mass" | "time" | "temperature" | "speed";
export type ScienceUnit = "m" | "km" | "cm" | "mm" | "mi" | "ft" | "kg" | "g" | "lb" | "s" | "min" | "h" | "K" | "°C" | "°F" | "m/s" | "km/h" | "mph";

const UNIT_TABLE: Record<ScienceUnit, { dimension: UnitDimension; toBase: (n: number) => number; fromBase: (n: number) => number }> = {
  m: { dimension: "length", toBase: n => n, fromBase: n => n },
  km: { dimension: "length", toBase: n => n * 1000, fromBase: n => n / 1000 },
  cm: { dimension: "length", toBase: n => n / 100, fromBase: n => n * 100 },
  mm: { dimension: "length", toBase: n => n / 1000, fromBase: n => n * 1000 },
  mi: { dimension: "length", toBase: n => n * 1609.344, fromBase: n => n / 1609.344 },
  ft: { dimension: "length", toBase: n => n * 0.3048, fromBase: n => n / 0.3048 },
  kg: { dimension: "mass", toBase: n => n, fromBase: n => n },
  g: { dimension: "mass", toBase: n => n / 1000, fromBase: n => n * 1000 },
  lb: { dimension: "mass", toBase: n => n * 0.45359237, fromBase: n => n / 0.45359237 },
  s: { dimension: "time", toBase: n => n, fromBase: n => n },
  min: { dimension: "time", toBase: n => n * 60, fromBase: n => n / 60 },
  h: { dimension: "time", toBase: n => n * 3600, fromBase: n => n / 3600 },
  K: { dimension: "temperature", toBase: n => n, fromBase: n => n },
  "°C": { dimension: "temperature", toBase: n => n + 273.15, fromBase: n => n - 273.15 },
  "°F": { dimension: "temperature", toBase: n => (n - 32) * 5 / 9 + 273.15, fromBase: n => (n - 273.15) * 9 / 5 + 32 },
  "m/s": { dimension: "speed", toBase: n => n, fromBase: n => n },
  "km/h": { dimension: "speed", toBase: n => n / 3.6, fromBase: n => n * 3.6 },
  mph: { dimension: "speed", toBase: n => n * 0.44704, fromBase: n => n / 0.44704 },
};

/** Converts between documented units: m/km/cm/mm/mi/ft; kg/g/lb; s/min/h;
 * K/°C/°F; and m/s/km/h/mph. Temperature conversions use the exact affine
 * definitions; absolute-zero values below 0 K are rejected. */
export function convertUnit(value: number, from: ScienceUnit, to: ScienceUnit): number {
  finiteNumber(value, "value");
  const source = UNIT_TABLE[from];
  const target = UNIT_TABLE[to];
  if (!source || !target) throw new RangeError("Unsupported unit");
  if (source.dimension !== target.dimension) throw new RangeError(`Cannot convert ${source.dimension} to ${target.dimension}`);
  const base = source.toBase(value);
  if (!Number.isFinite(base) || (source.dimension === "temperature" && base < 0)) throw new RangeError("Value is outside the physically valid finite range");
  const result = target.fromBase(base);
  if (!Number.isFinite(result)) throw new RangeError("Converted value is not finite");
  return result;
}

export type GasVariable = "pressurePa" | "volumeM3" | "amountMol" | "temperatureK";
export type IdealGasKnown = Partial<Record<GasVariable, number>>;
export interface IdealGasResult { pressurePa: number; volumeM3: number; amountMol: number; temperatureK: number; solvedFor: GasVariable }

/**
 * Solves one missing variable in PV=nRT from exactly three known state values.
 * Assumes an ideal gas in thermodynamic equilibrium, with absolute pressure,
 * volume in m³, amount in mol, temperature in K, and a fixed universal R.
 * This is a simplified model, not a real-gas correction. Known values must be
 * finite and strictly positive.
 */
export function solveIdealGasState(known: IdealGasKnown): IdealGasResult {
  const keys = (["pressurePa", "volumeM3", "amountMol", "temperatureK"] as const).filter(k => known[k] !== undefined);
  if (keys.length !== 3) throw new RangeError("Provide exactly three known ideal-gas state variables");
  const all: Partial<Record<GasVariable, number>> = {};
  for (const key of keys) {
    const value = finiteNumber(known[key] as number, key);
    if (value <= 0) throw new RangeError(`${key} must be positive`);
    all[key] = value;
  }
  const missing = (["pressurePa", "volumeM3", "amountMol", "temperatureK"] as const).find(k => known[k] === undefined)!;
  const { pressurePa: p, volumeM3: v, amountMol: n, temperatureK: t } = all;
  let result: number;
  switch (missing) {
    case "pressurePa": result = n! * UNIVERSAL_GAS_CONSTANT_J_MOL_K * t! / v!; break;
    case "volumeM3": result = n! * UNIVERSAL_GAS_CONSTANT_J_MOL_K * t! / p!; break;
    case "amountMol": result = p! * v! / (UNIVERSAL_GAS_CONSTANT_J_MOL_K * t!); break;
    case "temperatureK": result = p! * v! / (n! * UNIVERSAL_GAS_CONSTANT_J_MOL_K); break;
  }
  if (!Number.isFinite(result) || result <= 0) throw new RangeError("Solved state is outside the finite positive range");
  return { pressurePa: p ?? (missing === "pressurePa" ? result : NaN), volumeM3: v ?? (missing === "volumeM3" ? result : NaN), amountMol: n ?? (missing === "amountMol" ? result : NaN), temperatureK: t ?? (missing === "temperatureK" ? result : NaN), solvedFor: missing };
}

/**
 * Evaluates basic arithmetic (+, -, *, /, unary signs, parentheses and decimal
 * numbers including scientific notation). No identifiers, calls, or implicit
 * multiplication are accepted. Division by zero and nonfinite results throw.
 */
export function evaluateArithmetic(expression: string): number {
  if (typeof expression !== "string" || expression.length === 0 || expression.length > 1000) throw new RangeError("Expression must be a non-empty string of at most 1000 characters");
  let position = 0;
  let depth = 0;
  const skipSpace = () => { while (/\s/.test(expression[position] ?? "")) position++; };
  const parseExpression = (): number => {
    let value = parseTerm();
    while (true) {
      skipSpace();
      const op = expression[position];
      if (op !== "+" && op !== "-") break;
      position++;
      const rhs = parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
      ensureFinite(value);
    }
    return value;
  };
  const parseTerm = (): number => {
    let value = parseUnary();
    while (true) {
      skipSpace();
      const op = expression[position];
      if (op !== "*" && op !== "/") break;
      position++;
      const rhs = parseUnary();
      if (op === "/" && rhs === 0) throw new RangeError("Division by zero");
      value = op === "*" ? value * rhs : value / rhs;
      ensureFinite(value);
    }
    return value;
  };
  const parseUnary = (): number => {
    skipSpace();
    if (expression[position] === "+") { position++; return parseUnary(); }
    if (expression[position] === "-") { position++; const n = -parseUnary(); ensureFinite(n); return n; }
    return parsePrimary();
  };
  const parsePrimary = (): number => {
    skipSpace();
    if (expression[position] === "(") {
      if (++depth > 100) throw new RangeError("Expression nesting is too deep");
      position++;
      const value = parseExpression();
      skipSpace();
      if (expression[position] !== ")") throw new SyntaxError("Missing closing parenthesis");
      position++; depth--;
      return value;
    }
    const match = /^(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?/.exec(expression.slice(position));
    if (!match) throw new SyntaxError(`Expected a number at position ${position}`);
    position += match[0].length;
    const value = Number(match[0]);
    ensureFinite(value);
    return value;
  };
  const result = parseExpression();
  skipSpace();
  if (position !== expression.length) throw new SyntaxError(`Unsupported token at position ${position}`);
  return result;
}

function finiteNumber(value: number, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  return value;
}
function ensureFinite(value: number): void {
  if (!Number.isFinite(value)) throw new RangeError("Arithmetic result is not finite");
}
