-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "inviteCode" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "super_admin" BOOLEAN NOT NULL DEFAULT false,
    "createDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "status" TEXT DEFAULT 'unUse',
    "createDate" DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "create_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" DATETIME,
    "delete_date" DATETIME
);

-- CreateTable
CREATE TABLE "organization_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "create_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" DATETIME,
    "delete_date" DATETIME,
    CONSTRAINT "organization_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "organization_user_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "oauth_credentials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "provider" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "redirect_uri" TEXT NOT NULL,
    "token_type" TEXT,
    "access_token_enc" TEXT,
    "access_token_expiration" DATETIME,
    "refresh_token_enc" TEXT,
    "scope" TEXT,
    "create_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" DATETIME,
    "delete_date" DATETIME
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "deleteDate" DATETIME,
    "createDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT,
    "value" TEXT NOT NULL,
    "info" TEXT,
    "sort" INTEGER NOT NULL,
    "deleteDate" DATETIME,
    "createDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentTask_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Run_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agent_run" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "create_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "goal" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "agent_task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "run_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "create_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agent_task_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "agent_run" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createDate_idx" ON "User"("createDate");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_code_key" ON "Invitation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "organization_name_key" ON "organization"("name");

-- CreateIndex
CREATE INDEX "organization_name_idx" ON "organization"("name");

-- CreateIndex
CREATE INDEX "organization_user_user_id_idx" ON "organization_user"("user_id");

-- CreateIndex
CREATE INDEX "organization_user_organization_id_idx" ON "organization_user"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_user_user_id_organization_id_key" ON "organization_user"("user_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "oauth_credentials_state_idx" ON "oauth_credentials"("state");

-- CreateIndex
CREATE INDEX "oauth_credentials_user_id_idx" ON "oauth_credentials"("user_id");

-- CreateIndex
CREATE INDEX "Agent_createDate_idx" ON "Agent"("createDate");

-- CreateIndex
CREATE INDEX "Agent_userId_deleteDate_createDate_idx" ON "Agent"("userId", "deleteDate", "createDate");

-- CreateIndex
CREATE INDEX "AgentTask_agentId_idx" ON "AgentTask"("agentId");

-- CreateIndex
CREATE INDEX "AgentTask_type_idx" ON "AgentTask"("type");

-- CreateIndex
CREATE INDEX "AgentTask_createDate_idx" ON "AgentTask"("createDate");

-- CreateIndex
CREATE INDEX "Run_userId_createDate_idx" ON "Run"("userId", "createDate");

-- CreateIndex
CREATE INDEX "Run_userId_idx" ON "Run"("userId");

-- CreateIndex
CREATE INDEX "agent_run_user_id_create_date_idx" ON "agent_run"("user_id", "create_date");

-- CreateIndex
CREATE INDEX "agent_run_user_id_idx" ON "agent_run"("user_id");

-- CreateIndex
CREATE INDEX "agent_task_run_id_idx" ON "agent_task"("run_id");
