export type AtomCounts = Record<string, number>;

/** Parses a neutral, ordinary chemical formula. Charge notation and hydrate dots are intentionally rejected. */
export function parseFormula(formula: string): AtomCounts {
  if (!formula || formula.length > 80 || /[^A-Za-z0-9()[\]{}]/.test(formula)) throw new Error("Use a plain formula such as H2O or Ca(OH)2; charges and hydrate dots are not supported.");
  let index = 0;
  const parseGroup = (closing?: string): AtomCounts => {
    const atoms: AtomCounts = {};
    while (index < formula.length) {
      const char = formula[index]!;
      if (closing && char === closing) { index++; return atoms; }
      if (char === ")" || char === "]" || char === "}") throw new Error("Mismatched formula group.");
      if (char === "(" || char === "[" || char === "{") {
        index++;
        const end = char === "(" ? ")" : char === "[" ? "]" : "}";
        const child = parseGroup(end);
        const multiplier = readNumber();
        for (const [element, count] of Object.entries(child)) atoms[element] = (atoms[element] ?? 0) + count * multiplier;
        continue;
      }
      const elementMatch = /^[A-Z][a-z]?/.exec(formula.slice(index));
      if (!elementMatch) throw new Error(`Invalid formula near “${formula.slice(index)}”.`);
      const symbol = elementMatch[0];
      if (!ELEMENT_SYMBOLS.has(symbol)) throw new Error(`Unknown element symbol: ${symbol}.`);
      index += symbol.length;
      atoms[symbol] = (atoms[symbol] ?? 0) + readNumber();
    }
    if (closing) throw new Error("Unclosed formula group.");
    return atoms;
  };
  const readNumber = (): number => {
    const match = /^\d+/.exec(formula.slice(index));
    if (!match) return 1;
    index += match[0].length;
    const number = Number(match[0]);
    if (!Number.isSafeInteger(number) || number < 1 || number > 10000) throw new Error("Formula subscripts must be positive integers up to 10,000.");
    return number;
  };
  const parsed = parseGroup();
  if (index !== formula.length || Object.keys(parsed).length === 0) throw new Error("Invalid chemical formula.");
  return parsed;
}

const ELEMENT_SYMBOLS = new Set("H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og".split(" "));

export function balanceEquation(input: string): string {
  const parts = input.split(/(?:->|→|=)/);
  if (parts.length !== 2 || !parts[0] || !parts[1]) throw new Error("Separate reactants and products with →, -> or =.");
  const left = parts[0].split("+").map((item) => item.trim()).filter(Boolean);
  const right = parts[1].split("+").map((item) => item.trim()).filter(Boolean);
  const formulas = [...left, ...right];
  if (formulas.length < 2 || formulas.length > 10) throw new Error("Enter 2–10 molecular formulas.");
  const counts = formulas.map(parseFormula);
  const elements = [...new Set(counts.flatMap((map) => Object.keys(map)))].sort();
  const matrix = elements.map((element) => counts.map((atoms, column) => (atoms[element] ?? 0) * (column < left.length ? 1 : -1)));
  const { rref, pivots } = reduce(matrix);
  const freeColumns = formulas.map((_, column) => column).filter((column) => !pivots.includes(column));
  if (freeColumns.length !== 1) throw new Error("This equation is underdetermined for the simple balancer; please check its species and oxidation-state constraints.");
  const vector = Array(formulas.length).fill(0) as number[];
  const free = freeColumns[0]!;
  vector[free] = 1;
  for (let row = pivots.length - 1; row >= 0; row--) {
    const column = pivots[row]!;
    vector[column] = -rref[row]!.reduce((sum, value, j) => j === column ? sum : sum + value * vector[j]!, 0);
  }
  if (vector.some((value) => !Number.isFinite(value) || Math.abs(value) < 1e-10)) throw new Error("No nonzero balance was found for this equation.");
  const sign = vector.find((value) => Math.abs(value) > 1e-10)! < 0 ? -1 : 1;
  const normalized = vector.map((value) => Math.abs(value * sign));
  const common = normalized.reduce((acc, value) => lcm(acc, Math.round(value * 1_000_000)), 1);
  let coefficients = normalized.map((value) => Math.round(value * common));
  const divisor = coefficients.reduce((acc, value) => gcd(acc, value), 0);
  coefficients = coefficients.map((value) => value / (divisor || 1));
  if (coefficients.some((value) => !Number.isSafeInteger(value) || value < 1 || value > 10000)) throw new Error("The smallest integer coefficients are too large for this simple balancer.");
  return `${left.map((formula, i) => formatCoefficient(coefficients[i]!, formula)).join(" + ")} → ${right.map((formula, i) => formatCoefficient(coefficients[left.length + i]!, formula)).join(" + ")}`;
}

function reduce(input: number[][]): { rref: number[][]; pivots: number[] } {
  const rref = input.map((row) => [...row]);
  const rows = rref.length;
  const cols = rref[0]?.length ?? 0;
  const pivots: number[] = [];
  let pivotRow = 0;
  for (let col = 0; col < cols && pivotRow < rows; col++) {
    let best = pivotRow;
    for (let row = pivotRow + 1; row < rows; row++) if (Math.abs(rref[row]![col]!) > Math.abs(rref[best]![col]!)) best = row;
    if (Math.abs(rref[best]![col]!) < 1e-10) continue;
    [rref[pivotRow], rref[best]] = [rref[best]!, rref[pivotRow]!];
    const pivot = rref[pivotRow]![col]!;
    rref[pivotRow] = rref[pivotRow]!.map((value) => value / pivot);
    for (let row = 0; row < rows; row++) {
      if (row === pivotRow) continue;
      const factor = rref[row]![col]!;
      rref[row] = rref[row]!.map((value, j) => value - factor * rref[pivotRow]![j]!);
    }
    pivots.push(col);
    pivotRow++;
  }
  return { rref, pivots };
}
function formatCoefficient(coefficient: number, formula: string): string { return coefficient === 1 ? formula : `${coefficient} ${formula}`; }
function gcd(a: number, b: number): number { return b ? gcd(b, a % b) : Math.abs(a); }
function lcm(a: number, b: number): number { return Math.abs(a * b) / (gcd(a, b) || 1); }
