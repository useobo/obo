CREATE TABLE "actors" (
	"id" text PRIMARY KEY DEFAULT '1771352712220_bmr88m4tv' NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY DEFAULT '1771352712221_c8qgx3x4n' NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"action" text NOT NULL,
	"actor_id" text,
	"principal_id" text,
	"target_id" text,
	"slip_id" text,
	"details" jsonb,
	"ip_address" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "byoc_credentials" (
	"id" text PRIMARY KEY DEFAULT '1771352712221_owsphotar' NOT NULL,
	"principal_id" text NOT NULL,
	"target_id" text NOT NULL,
	"credential" text NOT NULL,
	"validated_at" timestamp,
	"last_used_at" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policies" (
	"id" text PRIMARY KEY DEFAULT '1771352712221_fsrqd4lar' NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"principals" jsonb,
	"actors" jsonb,
	"targets" jsonb,
	"auto_approve" jsonb,
	"manual_approve" jsonb,
	"deny" jsonb,
	"max_ttl" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "principals" (
	"id" text PRIMARY KEY DEFAULT '1771352712220_d6nhrpc1i' NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "principals_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "slips" (
	"id" text PRIMARY KEY DEFAULT '1771352712221_s99s9ol8t' NOT NULL,
	"actor_id" text NOT NULL,
	"principal_id" text NOT NULL,
	"target_id" text NOT NULL,
	"requested_scope" jsonb,
	"granted_scope" jsonb NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"provisioning_method" text NOT NULL,
	"token_id" text,
	"revocation_url" text,
	"policy_result" jsonb NOT NULL,
	"reason" text,
	"status" text DEFAULT 'active' NOT NULL,
	"revoked_at" timestamp,
	"revoked_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "targets" (
	"id" text PRIMARY KEY DEFAULT '1771352712221_r2klbldlv' NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"tags" jsonb,
	"supports" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "targets_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"id" text PRIMARY KEY DEFAULT '1771352712221_yaydmld7i' NOT NULL,
	"slip_id" text NOT NULL,
	"type" text NOT NULL,
	"secret" text,
	"reference" text,
	"metadata" jsonb,
	"expires_at" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_actors_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_principal_id_principals_id_fk" FOREIGN KEY ("principal_id") REFERENCES "public"."principals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_target_id_targets_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_slip_id_slips_id_fk" FOREIGN KEY ("slip_id") REFERENCES "public"."slips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "byoc_credentials" ADD CONSTRAINT "byoc_credentials_principal_id_principals_id_fk" FOREIGN KEY ("principal_id") REFERENCES "public"."principals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "byoc_credentials" ADD CONSTRAINT "byoc_credentials_target_id_targets_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slips" ADD CONSTRAINT "slips_actor_id_actors_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slips" ADD CONSTRAINT "slips_principal_id_principals_id_fk" FOREIGN KEY ("principal_id") REFERENCES "public"."principals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slips" ADD CONSTRAINT "slips_target_id_targets_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slips" ADD CONSTRAINT "slips_token_id_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_slip_id_slips_id_fk" FOREIGN KEY ("slip_id") REFERENCES "public"."slips"("id") ON DELETE no action ON UPDATE no action;