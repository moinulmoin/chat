import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect
} from "@convex-dev/auth/nextjs/server";

const isSignInPage = createRouteMatcher(["/signin"]);
const isProtectedRoute = createRouteMatcher(["/chat(.*)"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (isSignInPage(request) && (await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/chat");
  }
  if (isProtectedRoute(request) && !(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/signin");
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"]
};
