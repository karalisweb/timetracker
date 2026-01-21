-- Migration: Add Orchestration Module
-- Date: 2026-01-17
-- Description: Adds Project Orchestration & Guardrails module with Asana integration

-- ============================================
-- Step 1: Update UserRole enum
-- ============================================

-- Create new enum with updated values
CREATE TYPE "UserRole_new" AS ENUM ('admin', 'pm', 'senior', 'executor');

-- Add new roles column (array)
ALTER TABLE "users" ADD COLUMN "roles" "UserRole_new"[] DEFAULT ARRAY['executor']::"UserRole_new"[];

-- Migrate existing role data to roles array
UPDATE "users"
SET "roles" = CASE
  WHEN "role" = 'admin' THEN ARRAY['admin']::"UserRole_new"[]
  ELSE ARRAY['executor']::"UserRole_new"[]
END;

-- Drop old role column and enum
ALTER TABLE "users" DROP COLUMN "role";
DROP TYPE "UserRole";

-- Rename new enum to original name
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

-- Add asana_user_id column
ALTER TABLE "users" ADD COLUMN "asana_user_id" TEXT;
ALTER TABLE "users" ADD CONSTRAINT "users_asana_user_id_key" UNIQUE ("asana_user_id");

-- ============================================
-- Step 2: Create Orchestration Enums
-- ============================================

CREATE TYPE "OrchProjectStatus" AS ENUM ('in_development', 'ready_for_publish', 'published', 'delivered');
CREATE TYPE "ChecklistCategory" AS ENUM ('seo', 'technical', 'privacy', 'performance', 'backend', 'other');
CREATE TYPE "ChecklistInstanceStatus" AS ENUM ('pending', 'completed', 'awaiting_approval');
CREATE TYPE "GateName" AS ENUM ('published', 'delivered');

-- ============================================
-- Step 3: Create Orchestration Tables
-- ============================================

-- OrchProject
CREATE TABLE "orch_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "status" "OrchProjectStatus" NOT NULL DEFAULT 'in_development',
    "decisions" JSONB,
    "asana_project_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orch_projects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "orch_projects_code_key" ON "orch_projects"("code");
CREATE INDEX "orch_projects_status_idx" ON "orch_projects"("status");
CREATE INDEX "orch_projects_created_by_id_idx" ON "orch_projects"("created_by_id");

-- ChecklistTemplate
CREATE TABLE "checklist_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ChecklistCategory" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "default_minutes" INTEGER,
    "default_priority" TEXT,
    "default_importance" TEXT,
    "default_friction" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "checklist_templates_name_version_key" ON "checklist_templates"("name", "version");
CREATE INDEX "checklist_templates_category_idx" ON "checklist_templates"("category");
CREATE INDEX "checklist_templates_active_idx" ON "checklist_templates"("active");

-- ChecklistItemTemplate
CREATE TABLE "checklist_item_templates" (
    "id" TEXT NOT NULL,
    "checklist_template_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_item_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "checklist_item_templates_checklist_template_id_idx" ON "checklist_item_templates"("checklist_template_id");

-- ChecklistInstance
CREATE TABLE "checklist_instances" (
    "id" TEXT NOT NULL,
    "orch_project_id" TEXT NOT NULL,
    "checklist_template_id" TEXT NOT NULL,
    "template_version" INTEGER NOT NULL,
    "status" "ChecklistInstanceStatus" NOT NULL DEFAULT 'pending',
    "completed_at" TIMESTAMP(3),
    "executor_user_id" TEXT,
    "owner_user_id" TEXT,
    "due_date" TIMESTAMP(3),
    "asana_task_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_instances_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "checklist_instances_asana_task_id_key" ON "checklist_instances"("asana_task_id");
CREATE INDEX "checklist_instances_orch_project_id_idx" ON "checklist_instances"("orch_project_id");
CREATE INDEX "checklist_instances_checklist_template_id_idx" ON "checklist_instances"("checklist_template_id");
CREATE INDEX "checklist_instances_status_idx" ON "checklist_instances"("status");
CREATE INDEX "checklist_instances_executor_user_id_idx" ON "checklist_instances"("executor_user_id");

-- ExecutionTask
CREATE TABLE "execution_tasks" (
    "id" TEXT NOT NULL,
    "checklist_instance_id" TEXT NOT NULL,
    "asana_task_id" TEXT NOT NULL,
    "asana_project_id" TEXT NOT NULL,
    "asana_payload_snapshot" JSONB NOT NULL,
    "last_sync_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sync_status" TEXT NOT NULL DEFAULT 'synced',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execution_tasks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "execution_tasks_asana_task_id_key" ON "execution_tasks"("asana_task_id");
CREATE INDEX "execution_tasks_checklist_instance_id_idx" ON "execution_tasks"("checklist_instance_id");
CREATE INDEX "execution_tasks_asana_task_id_idx" ON "execution_tasks"("asana_task_id");

-- Gate
CREATE TABLE "gates" (
    "id" TEXT NOT NULL,
    "name" "GateName" NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "gates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "gates_name_key" ON "gates"("name");
CREATE INDEX "gates_sort_order_idx" ON "gates"("sort_order");

-- GateRequirement
CREATE TABLE "gate_requirements" (
    "id" TEXT NOT NULL,
    "gate_id" TEXT NOT NULL,
    "checklist_template_id" TEXT NOT NULL,
    "required_if_assigned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "gate_requirements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "gate_requirements_gate_id_checklist_template_id_key" ON "gate_requirements"("gate_id", "checklist_template_id");
CREATE INDEX "gate_requirements_gate_id_idx" ON "gate_requirements"("gate_id");

-- AsanaWebhookEvent
CREATE TABLE "asana_webhook_events" (
    "id" TEXT NOT NULL,
    "asana_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "resource_gid" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asana_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "asana_webhook_events_asana_event_id_key" ON "asana_webhook_events"("asana_event_id");
CREATE INDEX "asana_webhook_events_asana_event_id_idx" ON "asana_webhook_events"("asana_event_id");
CREATE INDEX "asana_webhook_events_status_idx" ON "asana_webhook_events"("status");
CREATE INDEX "asana_webhook_events_resource_gid_idx" ON "asana_webhook_events"("resource_gid");

-- ============================================
-- Step 4: Add Foreign Keys
-- ============================================

ALTER TABLE "orch_projects" ADD CONSTRAINT "orch_projects_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "checklist_item_templates" ADD CONSTRAINT "checklist_item_templates_checklist_template_id_fkey"
    FOREIGN KEY ("checklist_template_id") REFERENCES "checklist_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "checklist_instances" ADD CONSTRAINT "checklist_instances_orch_project_id_fkey"
    FOREIGN KEY ("orch_project_id") REFERENCES "orch_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "checklist_instances" ADD CONSTRAINT "checklist_instances_checklist_template_id_fkey"
    FOREIGN KEY ("checklist_template_id") REFERENCES "checklist_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "checklist_instances" ADD CONSTRAINT "checklist_instances_executor_user_id_fkey"
    FOREIGN KEY ("executor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "checklist_instances" ADD CONSTRAINT "checklist_instances_owner_user_id_fkey"
    FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "execution_tasks" ADD CONSTRAINT "execution_tasks_checklist_instance_id_fkey"
    FOREIGN KEY ("checklist_instance_id") REFERENCES "checklist_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "gate_requirements" ADD CONSTRAINT "gate_requirements_gate_id_fkey"
    FOREIGN KEY ("gate_id") REFERENCES "gates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "gate_requirements" ADD CONSTRAINT "gate_requirements_checklist_template_id_fkey"
    FOREIGN KEY ("checklist_template_id") REFERENCES "checklist_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
