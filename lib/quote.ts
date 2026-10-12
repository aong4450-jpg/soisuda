import { BOOKS } from "./data";

export type QuoteLine = {
  key: number;
  book: string;
  qty: string; // เก็บเป็นข้อความตามที่พิมพ์ในช่อง แล้วค่อยแปลงเป็นตัวเลขตอนคิดยอด
};

export function priceOf(book: string) {
  return BOOKS.find((b) => b.title === book)?.price ?? 0;
}

export function qtyOf(line: QuoteLine) {
  const n = Number(line.qty);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

export function lineAmount(line: QuoteLine) {
  return priceOf(line.book) * qtyOf(line);
}

// ปัดเป็นสตางค์ กันเศษทศนิยมยาว ๆ จากการคูณเปอร์เซ็นต์
function roundSatang(n: number) {
  return Math.round(n * 100) / 100;
}

function discountOf(subtotal: number, discountPct: number) {
  return roundSatang((subtotal * discountPct) / 100);
}

export function quoteTotals(lines: QuoteLine[], discountPct: number, special = 0) {
  const subtotal = lines.reduce((sum, l) => sum + lineAmount(l), 0);
  const books = lines.reduce((sum, l) => sum + (l.book ? qtyOf(l) : 0), 0);
  const discount = discountOf(subtotal, discountPct);
  const net = roundSatang(subtotal - discount - special);
  return { subtotal, books, discount, net };
}

export type FitItem = { price: number; qty: number };

export type FitOption = {
  label: string;
  note: string;
  qtys: number[];
  books: number;
  subtotal: number;
  special: number; // ส่วนลดพิเศษที่ต้องใส่เพื่อให้ยอดสุทธิเท่างบพอดี (0 ถ้าลงตัวอยู่แล้ว)
};

// หาจำนวนเล่มของแต่ละรายการ (อยู่ในช่วง lo ถึง hi) ที่ราคาเต็มรวมกันได้ target พอดี
// ถ้าไม่มี ให้เอายอดที่เกิน target น้อยที่สุดแต่ไม่เกิน limit และในยอดเดียวกันเลือกชุดที่ cost ต่ำสุด
function solve(
  prices: number[],
  lo: number[],
  hi: number[],
  target: number,
  limit: number,
  cost: (i: number, q: number) => number,
): number[] | null {
  let cur = new Float64Array(limit + 1).fill(Infinity);
  cur[0] = 0;
  const choices: Int16Array[] = [];
  for (let i = 0; i < prices.length; i++) {
    const next = new Float64Array(limit + 1).fill(Infinity);
    const choice = new Int16Array(limit + 1);
    for (let a = 0; a <= limit; a++) {
      if (cur[a] === Infinity) continue;
      for (let q = lo[i]; q <= hi[i]; q++) {
        const na = a + prices[i] * q;
        if (na > limit) break;
        const c = cur[a] + cost(i, q);
        if (c < next[na]) {
          next[na] = c;
          choice[na] = q;
        }
      }
    }
    choices.push(choice);
    cur = next;
  }
  for (let amount = target; amount <= limit; amount++) {
    if (cur[amount] === Infinity) continue;
    const qtys = new Array<number>(prices.length);
    let a = amount;
    for (let i = prices.length - 1; i >= 0; i--) {
      qtys[i] = choices[i][a];
      a -= prices[i] * qtys[i];
    }
    return qtys;
  }
  return null;
}

const MAX_QTY = 30000;
const MAX_WORK = 60_000_000;

export function fitToBudget(
  items: FitItem[],
  budget: number,
  discountPct: number,
  maxSharePct: number | null,
): { options: FitOption[]; error?: string } {
  const share = maxSharePct === null ? 1 : maxSharePct / 100;
  if (items.length * share < 1) {
    return {
      options: [],
      error: `มี ${items.length} รายการ จึงเป็นไปไม่ได้ที่ทุกรายการจะไม่เกิน ${maxSharePct}% ของจำนวนเล่มรวม กรุณาเพิ่มรายการหนังสือ หรือเพิ่มเปอร์เซ็นต์`,
    };
  }
  if (discountPct >= 100) {
    return { options: [], error: "ส่วนลด 100% ทำให้ยอดเป็นศูนย์เสมอ จึงปรับให้ลงงบไม่ได้" };
  }

  const prices = items.map((it) => it.price);
  const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const netOf = (s: number) => roundSatang(s - discountOf(s, discountPct));

  // ราคาเต็มรวมที่น้อยที่สุด ซึ่งหักส่วนลดแล้วยังไม่ต่ำกว่างบ
  let target = Math.max(0, Math.floor(budget / (1 - discountPct / 100)) - 1);
  while (netOf(target) < budget) target++;
  const limit = target + Math.max(...prices);

  // จำนวนเล่มเป้าหมายเมื่อย่อหรือขยายทุกรายการในสัดส่วนเดียวกัน
  const ideal = items.map((it) => (it.qty * target) / subtotal);
  let lo: number[] = [];
  let hi: number[] = [];
  for (let width = 10; width >= 2; width--) {
    lo = items.map((it, i) => Math.max(1, Math.floor(Math.min(ideal[i], it.qty)) - width));
    hi = items.map((it, i) => Math.min(MAX_QTY, Math.ceil(Math.max(ideal[i], it.qty)) + width));
    const steps = lo.reduce((sum, l, i) => sum + hi[i] - l + 1, 0);
    if (limit * steps <= MAX_WORK) break;
    if (width === 2) {
      return { options: [], error: "งบหรือจำนวนเล่มสูงเกินกว่าที่ระบบช่วยคิดให้ได้ กรุณาปรับจำนวนเอง" };
    }
  }

  const variants = [
    {
      label: "ปรับทุกรายการในสัดส่วนใกล้กัน",
      cost: (i: number, q: number) => ((q - ideal[i]) / items[i].qty) ** 2,
    },
    {
      label: "เปลี่ยนจำนวนเล่มน้อยที่สุด",
      cost: (i: number, q: number) => Math.abs(q - items[i].qty),
    },
  ];

  const options: FitOption[] = [];
  for (const variant of variants) {
    const cap = [...hi];
    let qtys: number[] | null = null;
    // ถ้าคำตอบมีรายการที่เกินสัดส่วนที่กำหนด ให้กดเพดานจำนวนเล่มลงแล้วคิดใหม่
    for (let round = 0; round < 6; round++) {
      if (cap.some((c, i) => c < lo[i])) break;
      const found = solve(prices, lo, cap, target, limit, variant.cost);
      if (!found) break;
      const total = found.reduce((sum, q) => sum + q, 0);
      const allowed = Math.floor(share * total + 1e-9);
      if (Math.max(...found) <= allowed) {
        qtys = found;
        break;
      }
      for (let i = 0; i < cap.length; i++) cap[i] = Math.min(cap[i], allowed);
    }
    if (!qtys) continue;
    if (options.some((o) => o.qtys.join() === qtys.join())) continue;

    const amount = qtys.reduce((sum, q, i) => sum + q * prices[i], 0);
    const special = roundSatang(netOf(amount) - budget);
    options.push({
      label: variant.label,
      note: special === 0 ? "ยอดลงงบพอดี ไม่ต้องใช้ส่วนลดพิเศษ" : `ใส่ส่วนลดพิเศษ ${formatMoney(special)} ให้ยอดเท่างบพอดี`,
      qtys,
      books: qtys.reduce((sum, q) => sum + q, 0),
      subtotal: amount,
      special,
    });
  }

  if (options.length === 0) {
    return { options, error: "หาชุดจำนวนเล่มที่ลงงบนี้ไม่ได้ ลองเพิ่มรายการหนังสือ หรือปรับงบและเปอร์เซ็นต์" };
  }
  return { options };
}

export function formatMoney(n: number) {
  return (
    "฿" +
    n.toLocaleString("en-US", {
      minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
      maximumFractionDigits: 2,
    })
  );
}
