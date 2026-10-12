export const STATUSES = ["รอส่ง", "ส่งแล้ว", "ชำระแล้ว"] as const;
export type Status = (typeof STATUSES)[number];

export type Order = {
  id: string;
  shop: string;
  book: string;
  qty: number;
  price: number;
  date: string; // รูปแบบ ปี ค.ศ.-เดือน-วัน เช่น 2026-10-12
  status: Status;
};

// ข้อมูลทั้งหมดในไฟล์นี้เป็นข้อมูลสมมติ
export const SHOPS = [
  "ร้านหนังสือใบไม้ผลิ",
  "ร้านอักษรริมคลอง",
  "ร้านหน้ากระดาษสีคราม",
  "ร้านปัญญานคร",
  "ร้านหนังสือดาวเหนือ",
  "ร้านอ่านเพลินใต้ชายคา",
  "ร้านกระดาษหอม",
];

export const BOOKS = [
  { title: "สายลมเหนือทุ่งคราม", price: 285 },
  { title: "บันทึกคนเฝ้าประภาคาร", price: 320 },
  { title: "คณิตคิดสนุก เล่ม 1", price: 195 },
  { title: "ประวัติศาสตร์ฉบับกระเป๋า", price: 240 },
  { title: "สวนหลังบ้านของยายจันทร์", price: 165 },
  { title: "ถอดรหัสการเงินมือใหม่", price: 350 },
  { title: "นิทานเมืองหมอก", price: 150 },
  { title: "ภาษาไทยใช้ให้เป็น", price: 220 },
  { title: "วิชาคณิตศาสตร์", price: 129 },
  { title: "วิชาวิทยาศาสตร์", price: 119 },
  { title: "วิชาช่องทางการเข้าสู่อาชีพ", price: 78 },
  { title: "วิชาทักษะการประกอบอาชีพ", price: 88 },
  { title: "วิชาพัฒนาอาชีพให้มีอยู่มีกิน", price: 64 },
];

export const SEED_ORDERS: Order[] = [
  { id: "อมต-0001", shop: SHOPS[0], book: BOOKS[0].title, qty: 40, price: 285, date: "2026-08-14", status: "ชำระแล้ว" },
  { id: "อมต-0002", shop: SHOPS[1], book: BOOKS[1].title, qty: 25, price: 320, date: "2026-08-20", status: "ส่งแล้ว" },
  { id: "อมต-0003", shop: SHOPS[3], book: BOOKS[2].title, qty: 60, price: 195, date: "2026-08-27", status: "ชำระแล้ว" },
  { id: "อมต-0004", shop: SHOPS[4], book: BOOKS[3].title, qty: 30, price: 240, date: "2026-09-02", status: "ส่งแล้ว" },
  { id: "อมต-0005", shop: SHOPS[2], book: BOOKS[4].title, qty: 50, price: 165, date: "2026-09-08", status: "รอส่ง" },
  { id: "อมต-0006", shop: SHOPS[5], book: BOOKS[5].title, qty: 20, price: 350, date: "2026-09-15", status: "ชำระแล้ว" },
  { id: "อมต-0007", shop: SHOPS[0], book: BOOKS[6].title, qty: 80, price: 150, date: "2026-09-22", status: "ส่งแล้ว" },
  { id: "อมต-0008", shop: SHOPS[6], book: BOOKS[7].title, qty: 35, price: 220, date: "2026-09-29", status: "ส่งแล้ว" },
  { id: "อมต-0009", shop: SHOPS[3], book: BOOKS[5].title, qty: 15, price: 350, date: "2026-10-05", status: "รอส่ง" },
  { id: "อมต-0010", shop: SHOPS[1], book: BOOKS[0].title, qty: 45, price: 285, date: "2026-10-10", status: "รอส่ง" },
];

const THAI_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

export function amountOf(order: Order) {
  return order.qty * order.price;
}

export function formatBaht(n: number) {
  return "฿" + n.toLocaleString("en-US");
}

export function formatThaiDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`;
}

export function todayISO() {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

function daysBetween(fromISO: string, toISO: string) {
  return Math.round((Date.parse(toISO) - Date.parse(fromISO)) / 86400000);
}

export function isUnpaid(order: Order) {
  return order.status !== "ชำระแล้ว";
}

export function isOverdue(order: Order, today: string) {
  return isUnpaid(order) && daysBetween(order.date, today) > 30;
}

export function nextStatus(status: Status): Status | null {
  const i = STATUSES.indexOf(status);
  return i < STATUSES.length - 1 ? STATUSES[i + 1] : null;
}
