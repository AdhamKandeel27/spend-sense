ALTER TABLE "purchases" ADD COLUMN "group_id" uuid;--> statement-breakpoint
CREATE INDEX "purchases_group_idx" ON "purchases" USING btree ("space_id","group_id");