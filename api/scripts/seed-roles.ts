#!/usr/bin/env tsx
/**
 * Seed default roles and permissions into the database.
 *
 * Usage:
 *   cd api && npx tsx scripts/seed-roles.ts
 *
 * Safe to run multiple times — uses upsert, never deletes existing custom roles.
 */

import { PrismaClient } from '@prisma/client';
import { ROLES, PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, type RoleKey } from '../src/core/auth/roles';

const prisma = new PrismaClient();

async function main() {
    console.log('▶ Seeding permissions…');

    // 1. Upsert all permissions
    for (const [, key] of Object.entries(PERMISSIONS)) {
        await prisma.spinePermission.upsert({
            where: { key },
            update: {},
            create: { key, description: key.replace(/\./g, ' ') },
        });
    }
    console.log(`  ✓ ${Object.keys(PERMISSIONS).length} permissions upserted`);

    // 2. Upsert all roles
    console.log('▶ Seeding roles…');
    for (const [, key] of Object.entries(ROLES)) {
        const name = key
            .split('_')
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
        await prisma.spineRole.upsert({
            where: { key },
            update: { name },
            create: { key, name },
        });
    }
    console.log(`  ✓ ${Object.keys(ROLES).length} roles upserted`);

    // 3. Wire role → permission join rows
    console.log('▶ Seeding role permissions…');
    let linkCount = 0;
    for (const [roleKey, permKeys] of Object.entries(DEFAULT_ROLE_PERMISSIONS) as [RoleKey, string[]][]) {
        const role = await prisma.spineRole.findUnique({ where: { key: roleKey } });
        if (!role) continue;

        for (const permKey of permKeys) {
            const perm = await prisma.spinePermission.findUnique({ where: { key: permKey } });
            if (!perm) continue;
            await (prisma as any).spineRolePermission.upsert({
                where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
                update: {},
                create: { roleId: role.id, permissionId: perm.id },
            });
            linkCount++;
        }
    }
    console.log(`  ✓ ${linkCount} role-permission links upserted`);
    console.log('✅ Roles seed complete.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
