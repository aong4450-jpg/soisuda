"use client";

import { useState } from "react";
import { BOOKS, SHOPS, formatBaht } from "@/lib/data";
import {
  fitToBudget,
  formatMoney,
  lineAmount,
  priceOf,
  qtyOf,
  quoteTotals,
  type FitOption,
  type QuoteLine,
} from "@/lib/quote";

const FIELD = "mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2";

export default function NewQuotePage() {
  const [shop, setShop] = useState("");
  const [lines, setLines] = useState<QuoteLine[]>([{ key: 1, book: "", qty: "" }]);
  const [discount, setDiscount] = useState("");
  const [budget, setBudget] = useState("");
  const [maxShare, setMaxShare] = useState("");
  const [special, setSpecial] = useState(0);
  const [options, setOptions] = useState<FitOption[] | null>(null);
  const [fitError, setFitError] = useState("");

  const discountNumber = Number(discount);
  const discountValid = discountNumber >= 0 && discountNumber <= 100;
  const totals = quoteTotals(lines, discountValid ? discountNumber : 0, special);

  const budgetNumber = Number(budget);
  const budgetValid = budget !== "" && budgetNumber > 0;
  const overBudget = budgetValid ? Math.round((totals.net - budgetNumber) * 100) / 100 : 0;

  // เมื่อแก้ตัวเลขเอง ชุดที่ระบบเสนอและส่วนลดพิเศษเดิมจะใช้ไม่ได้แล้ว จึงล้างทิ้ง
  function clearFit() {
    setSpecial(0);
    setOptions(null);
    setFitError("");
  }

  function changeLines(next: QuoteLine[]) {
    setLines(next);
    clearFit();
  }

  function updateLine(key: number, patch: Partial<QuoteLine>) {
    changeLines(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function addLine() {
    const nextKey = Math.max(0, ...lines.map((l) => l.key)) + 1;
    changeLines([...lines, { key: nextKey, book: "", qty: "" }]);
  }

  function removeLine(key: number) {
    changeLines(lines.filter((l) => l.key !== key));
  }

  function handleFit() {
    setOptions(null);
    setSpecial(0);
    const maxShareNumber = Number(maxShare);
    if (lines.some((l) => !l.book || qtyOf(l) === 0)) {
      setFitError("กรุณาเลือกหนังสือและใส่จำนวนให้ครบทุกรายการก่อน");
    } else if (!budgetValid) {
      setFitError("กรุณาใส่งบของลูกค้าเป็นตัวเลขที่มากกว่า 0");
    } else if (!discountValid) {
      setFitError("กรุณาแก้ส่วนลดให้อยู่ระหว่าง 0 ถึง 100 ก่อน");
    } else if (maxShare !== "" && !(maxShareNumber > 0 && maxShareNumber <= 100)) {
      setFitError("เปอร์เซ็นต์สูงสุดต่อรายการต้องอยู่ระหว่าง 1 ถึง 100 หรือเว้นว่างถ้าไม่จำกัด");
    } else {
      const result = fitToBudget(
        lines.map((l) => ({ price: priceOf(l.book), qty: qtyOf(l) })),
        budgetNumber,
        discountNumber,
        maxShare === "" ? null : maxShareNumber,
      );
      setFitError(result.error ?? "");
      setOptions(result.options);
    }
  }

  function applyOption(option: FitOption) {
    setLines(lines.map((l, i) => ({ ...l, qty: String(option.qtys[i]) })));
    setSpecial(option.special);
    setOptions(null);
    setFitError("");
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold">ทำใบเสนอราคา</h1>

      <div className="mt-6 space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block max-w-md font-medium">
          ร้านหรือลูกค้า
          <select value={shop} onChange={(e) => setShop(e.target.value)} className={FIELD}>
            <option value="">เลือกร้าน</option>
            {SHOPS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>

        <div>
          <h2 className="text-xl font-semibold">รายการหนังสือ</h2>
          <div className="mt-2 space-y-3">
            {lines.map((line, i) => (
              <div
                key={line.key}
                className="grid gap-3 rounded border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_7rem_8rem_auto] sm:items-end"
              >
                <label className="block font-medium">
                  หนังสือ รายการที่ {i + 1}
                  <select
                    value={line.book}
                    onChange={(e) => updateLine(line.key, { book: e.target.value })}
                    className={FIELD}
                  >
                    <option value="">เลือกหนังสือ</option>
                    {BOOKS.map((b) => (
                      <option key={b.title} value={b.title}>
                        {b.title} (เล่มละ {formatBaht(b.price)})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block font-medium">
                  จำนวน (เล่ม)
                  <input
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={line.qty}
                    onChange={(e) => updateLine(line.key, { qty: e.target.value })}
                    className={FIELD}
                  />
                </label>

                <div>
                  <div className="font-medium">เป็นเงิน</div>
                  <div className="mt-1 py-2 text-right text-lg font-semibold">
                    {formatBaht(lineAmount(line))}
                  </div>
                  <div className="sr-only">ราคาเล่มละ {formatBaht(priceOf(line.book))}</div>
                </div>

                <button
                  type="button"
                  onClick={() => removeLine(line.key)}
                  disabled={lines.length === 1}
                  className="rounded border border-slate-300 bg-white px-3 py-2 text-red-700 hover:bg-red-50 disabled:text-slate-400 disabled:hover:bg-white"
                >
                  ลบ
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addLine}
            className="mt-3 rounded border border-blue-700 px-4 py-2 font-semibold text-blue-700 hover:bg-blue-50"
          >
            เพิ่มรายการ
          </button>
        </div>

        <label className="block max-w-xs font-medium">
          ส่วนลด (เปอร์เซ็นต์)
          <input
            type="number"
            min={0}
            max={100}
            inputMode="decimal"
            placeholder="0"
            value={discount}
            onChange={(e) => {
              setDiscount(e.target.value);
              clearFit();
            }}
            className={FIELD}
          />
          {!discountValid && (
            <span role="alert" className="mt-1 block font-normal text-red-700">
              ส่วนลดต้องอยู่ระหว่าง 0 ถึง 100
            </span>
          )}
        </label>

        <div className="rounded border border-slate-200 p-4">
          <h2 className="text-xl font-semibold">ปรับยอดให้พอดีงบ</h2>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <label className="block font-medium">
              งบของลูกค้า (บาท)
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={budget}
                onChange={(e) => {
                  setBudget(e.target.value);
                  clearFit();
                }}
                className={FIELD}
              />
            </label>
            <label className="block font-medium">
              แต่ละรายการไม่เกินกี่เปอร์เซ็นต์ของจำนวนเล่มรวม
              <input
                type="number"
                min={1}
                max={100}
                inputMode="decimal"
                placeholder="เว้นว่างถ้าไม่จำกัด"
                value={maxShare}
                onChange={(e) => {
                  setMaxShare(e.target.value);
                  clearFit();
                }}
                className={FIELD}
              />
            </label>
          </div>

          {budgetValid && totals.subtotal > 0 && (
            <p
              className={`mt-3 font-semibold ${overBudget === 0 ? "text-green-700" : "text-red-700"}`}
            >
              {overBudget === 0
                ? "ยอดสุทธิเท่างบพอดี"
                : overBudget > 0
                  ? `ยอดสุทธิเกินงบ ${formatMoney(overBudget)}`
                  : `ยอดสุทธิต่ำกว่างบ ${formatMoney(-overBudget)}`}
            </p>
          )}

          <button
            type="button"
            onClick={handleFit}
            className="mt-3 rounded bg-blue-700 px-5 py-2 font-semibold text-white hover:bg-blue-800"
          >
            ปรับจำนวนให้ลงงบ
          </button>

          {fitError && (
            <p role="alert" className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-red-800">
              {fitError}
            </p>
          )}

          {options && options.length > 0 && (
            <div className="mt-4 space-y-3">
              <p className="text-slate-600">ระบบเสนอชุดจำนวนเล่มดังนี้ กดเลือกชุดที่ต้องการ</p>
              {options.map((option) => (
                <div key={option.label} className="rounded border border-blue-200 bg-blue-50 p-4">
                  <h3 className="text-lg font-semibold">{option.label}</h3>
                  <ul className="mt-1">
                    {lines.map((line, i) => (
                      <li key={line.key} className="flex justify-between gap-4">
                        <span>{line.book}</span>
                        <span className="whitespace-nowrap">
                          {qtyOf(line)} เป็น <strong>{option.qtys[i]}</strong> เล่ม
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2">
                    รวม {option.books.toLocaleString("en-US")} เล่ม ราคาเต็ม{" "}
                    {formatMoney(option.subtotal)}
                  </p>
                  <p className="text-slate-600">{option.note}</p>
                  <button
                    type="button"
                    onClick={() => applyOption(option)}
                    className="mt-2 rounded border border-blue-700 bg-white px-4 py-2 font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    ใช้ชุดนี้
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <dl className="space-y-2 rounded bg-blue-50 p-4">
          <div className="flex justify-between">
            <dt className="text-slate-600">จำนวนรวม</dt>
            <dd className="font-semibold">{totals.books.toLocaleString("en-US")} เล่ม</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">รวมราคาเต็ม</dt>
            <dd className="font-semibold">{formatMoney(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">
              หักส่วนลด {discountValid && discountNumber > 0 ? `${discountNumber}%` : ""}
            </dt>
            <dd className="font-semibold">{formatMoney(totals.discount)}</dd>
          </div>
          {special > 0 && (
            <div className="flex justify-between">
              <dt className="text-slate-600">หักส่วนลดพิเศษ</dt>
              <dd className="font-semibold">{formatMoney(special)}</dd>
            </div>
          )}
          <div className="flex items-baseline justify-between border-t border-blue-200 pt-2">
            <dt className="text-lg font-semibold">ยอดสุทธิ (คิดให้อัตโนมัติ)</dt>
            <dd className="text-3xl font-bold text-blue-800">{formatMoney(totals.net)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
