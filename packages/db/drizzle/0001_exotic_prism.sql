CREATE TABLE "pending_oauth_flows" (
	"slip_id" text PRIMARY KEY NOT NULL,
	"device_code" text NOT NULL,
	"user_code" text NOT NULL,
	"verification_uri" text NOT NULL,
	"expires_in" integer NOT NULL,
	"interval" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "actors" ALTER COLUMN "id" SET DEFAULT '1771366192631_lxaczbd7e';--> statement-breakpoint
ALTER TABLE "audit_log" ALTER COLUMN "id" SET DEFAULT '1771366192632_ghsaqxkcu';--> statement-breakpoint
ALTER TABLE "byoc_credentials" ALTER COLUMN "id" SET DEFAULT '1771366192632_mw1a06p59';--> statement-breakpoint
ALTER TABLE "policies" ALTER COLUMN "id" SET DEFAULT '1771366192632_ll0dr2dbt';--> statement-breakpoint
ALTER TABLE "principals" ALTER COLUMN "id" SET DEFAULT '1771366192631_mhn02sgdj';--> statement-breakpoint
ALTER TABLE "slips" ALTER COLUMN "id" SET DEFAULT '1771366192632_5nvkp607e';--> statement-breakpoint
ALTER TABLE "targets" ALTER COLUMN "id" SET DEFAULT '1771366192632_vfa270fa3';--> statement-breakpoint
ALTER TABLE "tokens" ALTER COLUMN "id" SET DEFAULT '1771366192632_na1h7d5b9';--> statement-breakpoint
ALTER TABLE "pending_oauth_flows" ADD CONSTRAINT "pending_oauth_flows_slip_id_slips_id_fk" FOREIGN KEY ("slip_id") REFERENCES "public"."slips"("id") ON DELETE no action ON UPDATE no action;