// Shared with the browser. Contains no keys or Node/server imports.
export const SCOPES = [
  'site:read',
  'posts:read',
  'posts:write',
  'posts:publish',
  'posts:delete',
  'projects:read',
  'projects:write',
  'projects:publish',
  'projects:delete',
  'inbox:read',
  'inbox:delete',
  'media:read',
  'media:write',
  'media:delete',
  'jobs:read',
  'jobs:write',
  'audit:read',
] as const;
export type Scope = (typeof SCOPES)[number];
export const EDITOR_SCOPES: Scope[] = [
  'site:read',
  'posts:read',
  'posts:write',
  'posts:publish',
  'projects:read',
  'projects:write',
  'projects:publish',
  'media:read',
  'media:write',
  'jobs:read',
  'jobs:write',
  'audit:read',
];
export const defaultConsentScopes = (requested: string[]) =>
  requested.filter((scope) => EDITOR_SCOPES.includes(scope as Scope));
