CREATE TABLE "orders" (
	"id" serial PRIMARY KEY,
	"type" text NOT NULL,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"item" text NOT NULL,
	"unit_price" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"total" integer NOT NULL,
	"date" date NOT NULL,
	"time" time,
	"fulfilment" text,
	"address" text,
	"notes" text,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" ("created_at");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" ("status");