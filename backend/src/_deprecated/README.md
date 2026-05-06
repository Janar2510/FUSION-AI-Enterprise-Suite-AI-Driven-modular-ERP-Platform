# _deprecated/

These FastAPI ERP module folders were moved here per ADR-0007.

All ERP logic has been migrated to (or will be built in) the Node/Express/Prisma API
in `api/src/modules/`. See the module checklists in `docs/module-checklists/` for
per-module migration status.

These files are kept for reference during the Node API build-out. Once Node API
parity is confirmed for a module, its folder here can be deleted entirely.

Do NOT reactivate these routers in `main.py`.
