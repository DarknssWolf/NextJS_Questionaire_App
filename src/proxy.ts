import { type NextRequest, NextResponse } from 'next/server';
import { type Roles } from './types/globals';
import { createRouteMatcher } from '@/lib/auth/route-matcher';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session-token';

const isHomeRoute = createRouteMatcher(['/']);
const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isSupplierEvaluationReportRoute = createRouteMatcher([
  '/suppliers/:id/evaluation-report/:submissionId',
]);
const isSupplierAdminRoute = createRouteMatcher([
  '/questionnaire/company',
  '/questionnaire/contacts',
]);
const isSupplierAdditionalAdminRoute = createRouteMatcher([
  '/questionnaire/questions',
]);
const isClientRoute = createRouteMatcher([
  '/dashboard',
  'suppliers',
  '/suppliers/:id/',
  '/suppliers/load',
  '/suppliers/send-evaluation',
]);
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/signout']);

const roleChecks: {
  name: string;
  fn: (req: NextRequest) => boolean;
  roles: Roles[];
}[] = [
  {
    name: 'admin',
    fn: isAdminRoute,
    roles: ['super_admin'],
  },
  {
    name: 'supplier_evaluation_report',
    fn: isSupplierEvaluationReportRoute,
    roles: ['supplier_admin', 'client_admin', 'client_additional_admin'],
  },
  {
    name: 'supplier_admin',
    fn: isSupplierAdminRoute,
    roles: ['supplier_admin'],
  },
  {
    name: 'supplier_additional_admin',
    fn: isSupplierAdditionalAdminRoute,
    roles: ['supplier_admin', 'supplier_additional_admin'],
  },
  {
    name: 'client_admin',
    fn: isClientRoute,
    roles: ['client_admin', 'client_additional_admin'],
  },
];

export default async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const role = session?.role;
  const companyId = session?.companyId;

  const url = new URL(req.url);
  const isSignoutRequest = url.searchParams.get('signout') === 'true';

  if (isSignoutRequest) {
    return NextResponse.redirect(new URL('/signout', req.url));
  }

  if (!isPublicRoute(req) && !session) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  if (isHomeRoute(req)) {
    const redirectUrl = getRedirectUrl(req, role);
    return NextResponse.redirect(redirectUrl);
  }

  const failedChecks = roleChecks.filter(
    (check) => check.fn(req) && !checkRole([...check.roles, 'developer'], role)
  );

  if (failedChecks.length > 0) {
    const redirectUrl = getRedirectUrl(req, role);
    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.next();

  if (companyId) {
    response.cookies.set('companyId', companyId.toString());
  }

  return response;
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};

const checkRole = (roles: Roles[], role?: Roles) => {
  return role && roles.some((expectedRole) => expectedRole === role);
};

function getRedirectUrl(req: NextRequest, role?: Roles) {
  switch (role) {
    case 'developer':
      return new URL('/dashboard', req.url);
    case 'super_admin':
      return new URL('/admin/questionnaires', req.url);
    case 'supplier_admin':
      return new URL('/questionnaire', req.url);
    case 'supplier_additional_admin':
      return new URL('/questionnaire/questions', req.url);
    case 'client_admin':
    case 'client_additional_admin':
      return new URL('/dashboard', req.url);
    default:
      return new URL('/sign-in', req.url);
  }
}
