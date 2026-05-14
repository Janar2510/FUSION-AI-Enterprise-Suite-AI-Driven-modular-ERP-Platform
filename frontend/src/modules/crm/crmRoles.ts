/** Roles that can manage CRM pipeline configuration and team scope (matches API `isManager`). */
export function isCrmManager(roles: string[] | undefined): boolean {
  const r = roles?.length ? roles : [];
  return r.some((x) => ['admin', 'Administrator', 'manager', 'Manager'].includes(x));
}
