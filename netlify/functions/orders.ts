import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { orders } from "../../db/schema.js";

// Public endpoint: the website's booking/order forms POST here before opening WhatsApp.
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const PHONE_RE = /^[0-9+\s()-]{9,15}$/;

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = body.type === "hair" || body.type === "bakery" ? body.type : null;
  const customerName = str(body.name, 120);
  const phone = str(body.phone, 20);
  const item = str(body.item, 120);
  const unitPrice = Number(body.unitPrice);
  const quantity = type === "hair" ? 1 : Math.floor(Number(body.quantity) || 1);
  const date = str(body.date, 10);
  const time = str(body.time, 5);
  const fulfilment = body.fulfilment === "Delivery" ? "Delivery" : "Collection";
  const address = str(body.address, 500);
  const notes = str(body.notes, 1000);

  const errors: string[] = [];
  if (!type) errors.push("type");
  if (!customerName) errors.push("name");
  if (!PHONE_RE.test(phone)) errors.push("phone");
  if (!item) errors.push("item");
  if (!Number.isInteger(unitPrice) || unitPrice < 0 || unitPrice > 100000) errors.push("unitPrice");
  if (quantity < 1 || quantity > 1000) errors.push("quantity");
  if (!DATE_RE.test(date)) errors.push("date");
  if (type === "hair" && !TIME_RE.test(time)) errors.push("time");
  if (type === "bakery" && fulfilment === "Delivery" && !address) errors.push("address");
  if (errors.length) return Response.json({ error: "Invalid fields", fields: errors }, { status: 400 });

  const [order] = await db
    .insert(orders)
    .values({
      type: type!,
      customerName,
      phone,
      item,
      unitPrice,
      quantity,
      total: unitPrice * quantity,
      date,
      time: type === "hair" ? time : null,
      fulfilment: type === "bakery" ? fulfilment : null,
      address: type === "bakery" && fulfilment === "Delivery" ? address : null,
      notes: notes || null,
    })
    .returning({ id: orders.id });

  return Response.json({ id: order.id }, { status: 201 });
};

export const config: Config = { path: "/api/orders", method: "POST" };
