-- CreateTable
CREATE TABLE "sign_requests" (
    "id" SERIAL NOT NULL,
    "documentTitle" TEXT NOT NULL,
    "documentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueDate" TIMESTAMP(3),
    "createdBy" TEXT,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "requiresWitness" BOOLEAN NOT NULL DEFAULT false,
    "witnessEmail" TEXT,
    "witnessName" TEXT,
    "witnessSignedAt" TIMESTAMP(3),
    "witnessSignatureData" TEXT,
    "witnessIpAddress" TEXT,
    "message" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sign_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sign_signers" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'other',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "signedAt" TIMESTAMP(3),
    "signatureData" TEXT,
    "signatureMethod" TEXT,
    "ipAddress" TEXT,
    "verificationStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sign_signers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sign_signers" ADD CONSTRAINT "sign_signers_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "sign_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
