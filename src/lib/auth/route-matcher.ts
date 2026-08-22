import { type NextRequest } from 'next/server';

export function createRouteMatcher(patterns: string[]) {
  const regexes = patterns.map(patternToRegExp);

  return (req: NextRequest): boolean =>
    regexes.some((regex) => regex.test(req.nextUrl.pathname));
}

function patternToRegExp(pattern: string): RegExp {
  const source = pattern
    .replace(/\/+$/, '')
    .replace(/[.+*?^${}()|[\]\\]/g, '\\$&')
    .replace(/\/\\\(\\\.\\\*\\\)/g, '(?:/.*)?')
    .replace(/\\\(\\\.\\\*\\\)/g, '.*')
    .replace(/:[a-zA-Z0-9_]+/g, '[^/]+');

  return new RegExp(`^${source}/?$`);
}
