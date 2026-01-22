-- CreateTable: OTP tokens for two-factor authentication via email
CREATE TABLE "otp_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Index on email for faster lookups
CREATE INDEX "otp_tokens_email_idx" ON "otp_tokens"("email");

-- CreateIndex: Composite index for email + code verification
CREATE INDEX "otp_tokens_email_code_idx" ON "otp_tokens"("email", "code");
