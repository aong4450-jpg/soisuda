"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU = [
  { href: "/orders", label: "รายการคำสั่งซื้อ" },
  { href: "/orders/new", label: "เพิ่มคำสั่งซื้อ" },
  { href: "/summary", label: "สรุปยอด" },
  { href: "/quotes/new", label: "ใบเสนอราคา" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="bg-blue-700 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3">
        <Link href="/" className="text-2xl font-bold tracking-wide">
          ang
        </Link>
        <nav className="flex flex-wrap gap-1">
          {MENU.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded px-3 py-2 font-medium hover:bg-blue-600 ${
                pathname === item.href ? "bg-blue-900" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
