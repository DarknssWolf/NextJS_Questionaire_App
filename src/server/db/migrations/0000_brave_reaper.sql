CREATE TYPE "public"."question_type" AS ENUM('text', 'textarea', 'radio', 'checkbox', 'select');--> statement-breakpoint
CREATE TYPE "public"."questionnaire_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('not_started', 'in_progress', 'submitted', 'auto_submitted', 'manually_submitted');--> statement-breakpoint
CREATE TABLE "answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"option_id" integer,
	"value" text,
	"created_at" timestamp DEFAULT timezone('UTC', now()) NOT NULL,
	"updated_at" timestamp DEFAULT NULL,
	CONSTRAINT "answer_submission_question_option" UNIQUE NULLS NOT DISTINCT("submission_id","question_id","option_id")
);
--> statement-breakpoint
CREATE TABLE "company_notifications" (
	"id" serial NOT NULL,
	"company_id" integer,
	"body" json,
	"is_read" boolean DEFAULT false,
	"type" text,
	"created_at" timestamp DEFAULT timezone('UTC', now()) NOT NULL,
	"updated_at" timestamp DEFAULT NULL,
	CONSTRAINT "pk_company_notifications" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "company_sizes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT timezone('UTC', now()) NOT NULL,
	"updated_at" timestamp DEFAULT NULL
);
--> statement-breakpoint
CREATE TABLE "company_supplier" (
	"company_id" integer NOT NULL,
	"supplier_id" integer NOT NULL,
	"created_at" timestamp DEFAULT timezone('UTC', now()) NOT NULL,
	"updated_at" timestamp DEFAULT NULL,
	CONSTRAINT "pk_company_supplier" PRIMARY KEY("company_id","supplier_id")
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"primary_contact_name" text NOT NULL,
	"primary_contact_email" text NOT NULL,
	"created_at" timestamp DEFAULT timezone('UTC', now()) NOT NULL,
	"updated_at" timestamp DEFAULT NULL
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT timezone('UTC', now()) NOT NULL,
	"updated_at" timestamp DEFAULT NULL
);
--> statement-breakpoint
CREATE TABLE "document_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT timezone('UTC', now()) NOT NULL,
	"updated_at" timestamp DEFAULT NULL,
	CONSTRAINT "document_categories_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "document_requirements" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"document_id" integer NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT timezone('UTC', now()) NOT NULL,
	"updated_at" timestamp DEFAULT NULL,
	CONSTRAINT "category_document" UNIQUE("category_id","document_id")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT timezone('UTC', now()) NOT NULL,
	"updated_at" timestamp DEFAULT NULL
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer,
	"supplier_id" integer,
	"email_type" text NOT NULL,
	"sent_from_user" text NOT NULL,
	"created_at" timestamp DEFAULT timezone('UTC', now()) NOT NULL,
	"updated_at" timestamp DEFAULT NULL
);
--> statement-breakpoint
CREATE TABLE "file_blobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_upload_id" integer NOT NULL,
	"data" "bytea" NOT NULL,
	CONSTRAINT "file_blobs_file_upload_id_unique" UNIQUE("file_upload_id")
);
--> statement-breakpoint
CREATE TABLE "file_uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"original_file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" bigint NOT NULL,
	"storage_key" text NOT NULL,
	"file_upload_category" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT timezone('UTC', now()) NOT NULL,
	"updated_at" timestamp DEFAULT NULL
);
--> statement-breakpoint
CREATE TABLE "questionnaires" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "questionnaire_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT timezone('UTC', now()) NOT NULL,
	"updated_at" timestamp DEFAULT NULL,
	CONSTRAINT "questionnaire_key_version" UNIQUE("key","version")
);
--> statement-breakpoint
CREATE TABLE "question_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"label" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"questionnaire_id" integer NOT NULL,
	"section_id" integer NOT NULL,
	"external_id" text NOT NULL,
	"text" text NOT NULL,
	"help_text" text,
	"type" "question_type" NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"sort_order" integer NOT NULL,
	CONSTRAINT "question_questionnaire_external_id" UNIQUE("questionnaire_id","external_id")
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"questionnaire_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"questionnaire_id" integer NOT NULL,
	"supplier_id" integer NOT NULL,
	"status" "submission_status" DEFAULT 'not_started' NOT NULL,
	"due_date" timestamp,
	"submitted_at" timestamp,
	"score" integer,
	"max_score" integer,
	"completed_section_ids" json DEFAULT '[]'::json NOT NULL,
	"is_documentation_complete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT timezone('UTC', now()) NOT NULL,
	"updated_at" timestamp DEFAULT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"registration_number" text NOT NULL,
	"industry_id" integer,
	"country_id" integer,
	"address" text NOT NULL,
	"website" text,
	"company_size_id" integer,
	"primary_contact_name" text NOT NULL,
	"primary_contact_position" text NOT NULL,
	"primary_contact_email" text NOT NULL,
	"primary_contact_phone" text NOT NULL,
	"additional_notes" text,
	"main_product_type" text,
	"fte_headcount" integer,
	"annual_spend" integer,
	"peak_season" text,
	"low_season" text,
	"spend_category_id" integer,
	"affidavit_waiver_name" text,
	"affidavit_waiver_surname" text,
	"affidavit_waiver_signature" text,
	"affidavit_waiver_confirmation" boolean DEFAULT false NOT NULL,
	"status" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT timezone('UTC', now()) NOT NULL,
	"updated_at" timestamp DEFAULT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_additional_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"supplier_id" serial NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"email" text NOT NULL,
	"section_id" integer,
	"created_at" timestamp DEFAULT timezone('UTC', now()) NOT NULL,
	"updated_at" timestamp DEFAULT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text,
	"role" text NOT NULL,
	"company_id" integer,
	"supplier_id" integer,
	"created_at" timestamp DEFAULT timezone('UTC', now()) NOT NULL,
	"updated_at" timestamp DEFAULT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "supplier_document_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"submission_id" integer,
	"document_requirement_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"uploaded_at" timestamp,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"file_upload_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT timezone('UTC', now()) NOT NULL,
	"updated_at" timestamp DEFAULT NULL,
	CONSTRAINT "supplier_document_requirement" UNIQUE("supplier_id","document_requirement_id")
);
--> statement-breakpoint
CREATE TABLE "supplier_notifications" (
	"id" serial NOT NULL,
	"supplier_id" integer,
	"body" json,
	"is_read" boolean DEFAULT false,
	"type" text,
	"created_at" timestamp DEFAULT timezone('UTC', now()) NOT NULL,
	"updated_at" timestamp DEFAULT NULL,
	CONSTRAINT "pk_supplier_notifications" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "industries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT timezone('UTC', now()) NOT NULL,
	"updated_at" timestamp DEFAULT NULL
);
--> statement-breakpoint
CREATE TABLE "spend_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_1" text NOT NULL,
	"category_2" text NOT NULL,
	"created_at" timestamp DEFAULT timezone('UTC', now()) NOT NULL,
	"updated_at" timestamp DEFAULT NULL
);
--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_option_id_question_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."question_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_notifications" ADD CONSTRAINT "company_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_supplier" ADD CONSTRAINT "company_supplier_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_supplier" ADD CONSTRAINT "company_supplier_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requirements" ADD CONSTRAINT "category_fk" FOREIGN KEY ("category_id") REFERENCES "public"."document_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requirements" ADD CONSTRAINT "document_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "company_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "supplier_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_blobs" ADD CONSTRAINT "file_blobs_file_upload_id_file_uploads_id_fk" FOREIGN KEY ("file_upload_id") REFERENCES "public"."file_uploads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_questionnaire_id_questionnaires_id_fk" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."questionnaires"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_questionnaire_id_questionnaires_id_fk" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."questionnaires"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_questionnaire_id_questionnaires_id_fk" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."questionnaires"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_company_size_id_company_sizes_id_fk" FOREIGN KEY ("company_size_id") REFERENCES "public"."company_sizes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_spend_category_id_spend_categories_id_fk" FOREIGN KEY ("spend_category_id") REFERENCES "public"."spend_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier" ADD CONSTRAINT "spend_category_fk" FOREIGN KEY ("spend_category_id") REFERENCES "public"."spend_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier" ADD CONSTRAINT "country_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier" ADD CONSTRAINT "industry_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier" ADD CONSTRAINT "company_size_fk" FOREIGN KEY ("company_size_id") REFERENCES "public"."company_sizes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_additional_contacts" ADD CONSTRAINT "supplier_additional_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_additional_contacts" ADD CONSTRAINT "supplier_additional_contacts_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_document_status" ADD CONSTRAINT "supplier_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_document_status" ADD CONSTRAINT "document_requirement_fk" FOREIGN KEY ("document_requirement_id") REFERENCES "public"."document_requirements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_document_status" ADD CONSTRAINT "file_upload_fk" FOREIGN KEY ("file_upload_id") REFERENCES "public"."file_uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_document_status" ADD CONSTRAINT "submission_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_notifications" ADD CONSTRAINT "supplier_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "answers_submission_id_idx" ON "answers" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "question_options_question_id_idx" ON "question_options" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "questions_section_id_idx" ON "questions" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "sections_questionnaire_id_idx" ON "sections" USING btree ("questionnaire_id");--> statement-breakpoint
CREATE INDEX "submissions_supplier_id_idx" ON "submissions" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "submissions_status_idx" ON "submissions" USING btree ("status");