-- ShareLink Migration for AWS Deployment
-- Execute this SQL script on AWS database before deploying the new code

-- Step 1: Create enum types
CREATE TYPE "core"."shareLink_resourceType_enum" AS ENUM ('COMPANY', 'PERSON', 'SALES_QUOTE', 'DASHBOARD_CHART');
CREATE TYPE "core"."shareLink_accessMode_enum" AS ENUM ('PUBLIC', 'LOGIN_REQUIRED');

-- Step 2: Create shareLink table
CREATE TABLE "core"."shareLink" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "token" uuid NOT NULL,
  "workspaceId" uuid NOT NULL,
  "resourceType" "core"."shareLink_resourceType_enum" NOT NULL,
  "resourceId" uuid NOT NULL,
  "accessMode" "core"."shareLink_accessMode_enum" NOT NULL DEFAULT 'PUBLIC',
  "isActive" boolean NOT NULL DEFAULT true,
  "expiresAt" TIMESTAMP,
  "inactivityExpirationDays" integer,
  "accessCount" integer NOT NULL DEFAULT 0,
  "lastAccessedAt" TIMESTAMP,
  "createdById" uuid,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "PK_shareLink_id" PRIMARY KEY ("id")
);

-- Step 3: Create indexes
CREATE UNIQUE INDEX "IDX_SHARE_LINK_TOKEN" ON "core"."shareLink" ("token");
CREATE INDEX "IDX_SHARE_LINK_WORKSPACE_ID" ON "core"."shareLink" ("workspaceId");
CREATE INDEX "IDX_SHARE_LINK_RESOURCE" ON "core"."shareLink" ("workspaceId", "resourceType", "resourceId");

-- Step 4: Create foreign keys
ALTER TABLE "core"."shareLink" ADD CONSTRAINT "FK_shareLink_workspace"
  FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE;
ALTER TABLE "core"."shareLink" ADD CONSTRAINT "FK_shareLink_user"
  FOREIGN KEY ("createdById") REFERENCES "core"."user"("id") ON DELETE SET NULL;

-- Step 5: Create shareLinkAccessLog table
CREATE TABLE "core"."shareLinkAccessLog" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "shareLinkId" uuid NOT NULL,
  "accessedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "ipAddress" character varying,
  "userAgent" character varying,
  "userId" uuid,
  CONSTRAINT "PK_shareLinkAccessLog" PRIMARY KEY ("id"),
  CONSTRAINT "FK_shareLinkAccessLog_shareLink" FOREIGN KEY ("shareLinkId")
    REFERENCES "core"."shareLink"("id") ON DELETE CASCADE,
  CONSTRAINT "FK_shareLinkAccessLog_user" FOREIGN KEY ("userId")
    REFERENCES "core"."user"("id") ON DELETE SET NULL
);

-- Step 6: Create indexes for access log
CREATE INDEX "IDX_SHARE_LINK_ACCESS_LOG_SHARE_LINK_ID" ON "core"."shareLinkAccessLog" ("shareLinkId");
CREATE INDEX "IDX_SHARE_LINK_ACCESS_LOG_ACCESSED_AT" ON "core"."shareLinkAccessLog" ("accessedAt");

-- Verification queries
SELECT 'ShareLink table created successfully' as status, count(*) as row_count FROM "core"."shareLink";
SELECT 'ShareLinkAccessLog table created successfully' as status, count(*) as row_count FROM "core"."shareLinkAccessLog";
