import type { Config, Context } from "@netlify/functions";
import { timingSafeEqual, createHash } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { orders } from "../../db/schema.js";

// Private endpoint used by /admin. Requires the ADMIN_PASSWORD environment variable
// to be sent in the `x-admin-password` header.
const STATUSES = ["new", "confirmed", "completed", "cancelled"] as const;
const digest = (s: string) => createHash("sha256").update(s).digest();

function authorized(req: Request) {
  const expected = Netlify.env.get("ADMIN_PASSWORD");
  const given = req.headers.get("x-admin-password");
  if (!expected || !given) return false;
  return timingSafeEqual(digest(expected), digest(given));
}

export default async (req: Request, context: Context) => {
  if (!authorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = context.params.id ? Number(context.params.id) : null;

  if (req.method === "GET" && id === null) {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");
    const filters = [];
    if (status && (STATUSES as readonly string[]).includes(status)) filters.push(eq(orders.status, status));
    if (type === "hair" || type === "bakery") filters.push(eq(orders.type, type));
    const rows = await db
      .select()
      .from(orders)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(orders.createdAt))
      .limit(500);
    return Response.json(rows);
  }

  if (id === null || !Number.isInteger(id)) return Response.json({ error: "Not found" }, { status: 404 });

  if (req.method === "PATCH") {
    const { status } = await req.json().catch(() => ({}));
    if (!(STATUSES as readonly string[]).includes(status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }
    const [row] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return row ? Response.json(row) : Response.json({ error: "Not found" }, { status: 404 });
  }

  if (req.method === "DELETE") {
    const [row] = await db.delete(orders).where(eq(orders.id, id)).returning({ id: orders.id });
    return row ? new Response(null, { status: 204 }) : Response.json({ error: "Not found" }, { status: 404 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = { path: ["/api/admin/orders", "/api/admin/orders/:id"] };
