import { Router } from 'express';
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
    GenerateRegistrationOptionsOpts,
    VerifyRegistrationResponseOpts,
    GenerateAuthenticationOptionsOpts,
    VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/utils';

export const authRoutes = Router();

/**
 * ── Passkey Registration ─────────────────────────────────────────────
 */

// 1. Generate registration options
authRoutes.post('/register-options', asyncHandler(async (req, res) => {
    const { partnerId } = req.body;
    if (!partnerId) {
        res.status(400).json({ error: 'partnerId is required' });
        return;
    }

    const partner = await prisma.partner.findFirst({
        where: { id: String(partnerId) },
        include: { passkeys: true }
    });

    if (!partner) {
        res.status(404).json({ error: 'Partner not found' });
        return;
    }

    const options: GenerateRegistrationOptionsOpts = {
        rpName: 'FusionAI Enterprise',
        rpID: process.env.RP_ID || 'localhost',
        userID: new TextEncoder().encode(partner.id),
        userName: partner.email || partner.name,
        userDisplayName: partner.name,
        attestationType: 'none',
        excludeCredentials: partner.passkeys.map(pk => ({
            id: pk.credentialId,
            type: 'public-key',
        })),
        authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'preferred',
            authenticatorAttachment: 'platform',
        },
    };

    const regOptions = await generateRegistrationOptions(options);

    // Store challenge in session
    (req as any).session.currentChallenge = regOptions.challenge;
    (req as any).session.registeringPartnerId = partner.id;

    res.json(regOptions);
}));

// 2. Verify registration response
authRoutes.post('/register-verify', asyncHandler(async (req, res) => {
    const { body } = req;
    const challenge = (req as any).session.currentChallenge;
    const partnerId = (req as any).session.registeringPartnerId;

    if (!challenge || !partnerId) {
        res.status(400).json({ error: 'Session expired or invalid registration flow' });
        return;
    }

    const opts: VerifyRegistrationResponseOpts = {
        response: body,
        expectedChallenge: challenge,
        expectedOrigin: process.env.ORIGIN || 'http://localhost:5173',
        expectedRPID: process.env.RP_ID || 'localhost',
    };

    const verification = await verifyRegistrationResponse(opts);

    if (verification.verified && verification.registrationInfo) {
        const { credential } = verification.registrationInfo;

        await prisma.userPasskey.create({
            data: {
                partnerId: partnerId,
                credentialId: Buffer.from(credential.id).toString('base64url'),
                publicKey: Buffer.from(credential.publicKey).toString('base64url'),
                counter: credential.counter,
            },
        });

        // Clean up session
        delete (req as any).session.currentChallenge;
        delete (req as any).session.registeringPartnerId;

        res.json({ verified: true });
        return;
    }

    res.status(400).json({ verified: false, error: 'Verification failed' });
}));

/**
 * ── Passkey Authentication ───────────────────────────────────────────
 */

// 1. Generate authentication options
authRoutes.post('/login-options', asyncHandler(async (req, res) => {
    const { email } = req.body;

    const partner = await prisma.partner.findFirst({
        where: { email: email },
        include: { passkeys: true }
    });

    if (!partner || partner.passkeys.length === 0) {
        res.status(404).json({ error: 'No passkeys found for this email' });
        return;
    }

    const opts: GenerateAuthenticationOptionsOpts = {
        rpID: process.env.RP_ID || 'localhost',
        allowCredentials: partner.passkeys.map(pk => ({
            id: pk.credentialId,
            type: 'public-key',
        })),
        userVerification: 'preferred',
    };

    const authOptions = await generateAuthenticationOptions(opts);

    // Store challenge and partnerId in session
    (req as any).session.currentChallenge = authOptions.challenge;
    (req as any).session.authenticatingPartnerId = partner.id;

    res.json(authOptions);
}));

// 2. Verify authentication response
authRoutes.post('/login-verify', asyncHandler(async (req, res) => {
    const { body } = req;
    const challenge = (req as any).session.currentChallenge;
    const partnerId = (req as any).session.authenticatingPartnerId;

    if (!challenge || !partnerId) {
        res.status(400).json({ error: 'Session expired or invalid login flow' });
        return;
    }

    const partner = await prisma.partner.findUnique({
        where: { id: partnerId },
        include: { passkeys: true }
    });

    if (!partner) {
        res.status(404).json({ error: 'Partner not found' });
        return;
    }

    const passkey = partner.passkeys.find(pk => pk.credentialId === body.id);
    if (!passkey) {
        res.status(400).json({ error: 'Credential not recognized' });
        return;
    }

    // In SimpleWebAuthn v13, credential info is grouped
    const opts: VerifyAuthenticationResponseOpts = {
        response: body,
        expectedChallenge: challenge,
        expectedOrigin: process.env.ORIGIN || 'http://localhost:5173',
        expectedRPID: process.env.RP_ID || 'localhost',
        credential: {
            id: passkey.credentialId,
            publicKey: Buffer.from(passkey.publicKey, 'base64url'),
            counter: passkey.counter,
        },
    };

    const verification = await verifyAuthenticationResponse(opts);

    if (verification.verified) {
        // Update counter
        await prisma.userPasskey.update({
            where: { id: passkey.id },
            data: { counter: verification.authenticationInfo.newCounter },
        });

        // Establish user session
        (req as any).session.userId = partner.id;

        // Clean up temporary session data
        delete (req as any).session.currentChallenge;
        delete (req as any).session.authenticatingPartnerId;

        res.json({ verified: true, user: { id: partner.id, name: partner.name, email: partner.email } });
        return;
    }

    res.status(400).json({ verified: false, error: 'Authentication failed' });
}));

// Logout
authRoutes.post('/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
        if (err) {
            res.status(500).json({ error: 'Logout failed' });
            return;
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

// Current User
authRoutes.get('/me', asyncHandler(async (req, res) => {
    if (!(req as any).session.userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }

    const partner = await prisma.partner.findUnique({
        where: { id: (req as any).session.userId },
        select: { id: true, name: true, email: true, type: true }
    });

    res.json(partner);
}));
