import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"; // This middleware will run on every request to
//  the server, allowing us to check the user's authentication status and role before they access certain routes.
//  It uses the `clerkMiddleware` function from the Clerk library to handle authentication and route matching.
import { NextResponse } from "next/server"; // This is a helper function from Next.js that allows us to create responses, such as redirects, in our middleware.

const isAdminRoute = createRouteMatcher([
  "/admin(.*)", //It includes all paths that start with /admin, such as /admin/dashboard, /admin/settings, etc.
  "/api/admin(.*)", //It includes all API routes that start with /api/admin, such as /api/admin/users, /api/admin/reports, etc.
]);
const isTeacherRoute = createRouteMatcher(["/teacher(.*)"]); //It includes all paths that start with /teacher, such as /teacher/dashboard, /teacher/courses, etc.
const isStudentRoute = createRouteMatcher(["/student(.*)"]); //It includes all paths that start with /student, such as /student/dashboard, /student/courses, etc.
const isInviteRoute = createRouteMatcher([
  "/teacher/invite(.*)",
  "/student/invite(.*)",
]); //It includes all paths that start with /teacher/invite or /student/invite, such as /teacher/invite/abc123, /student/invite/xyz789, etc.

function redirectToLocalSignIn(req: Request) {
  //This function creates a URL for the sign-in page and appends a query parameter called redirect_url, which contains the original URL that the user was trying to access. This way, after the user signs in, they can be redirected back to the page they wanted to visit.
  const signInUrl = new URL("/sign-in", req.url); //This creates a new URL object for the sign-in page, using the base URL of the incoming request (req.url). This ensures that the sign-in page is on the same domain as the original request.
  signInUrl.searchParams.set("redirect_url", req.url); //This adds a query parameter called redirect_url to the sign-in URL, and sets its value to the original URL that the user was trying to access (req.url).
  return NextResponse.redirect(signInUrl); //This returns a redirect response that sends the user to the sign-in page with the redirect_url parameter. When the user successfully signs in, they can be redirected back to the original URL using the value of the redirect_url parameter.
}

export default clerkMiddleware(async (auth, req) => {
  //This is the main middleware function that will run on every request. It takes two parameters: auth, which is an object that contains the user's authentication information, and req, which is the incoming request object.
  if (isInviteRoute(req)) {
    //This checks if the incoming request matches any of the invite routes defined in the isInviteRoute matcher. If it does, it means that the user is trying to access an invite link, which should be accessible without authentication.
    return NextResponse.next(); //If the request matches an invite route, we simply return NextResponse.next(), which allows the request to proceed without any further checks. This means that anyone can access invite links without needing to sign in first.
  }

  const { userId } = await auth(); //This calls the auth function to get the user's authentication information, and destructures the userId from it. If the user is not authenticated, userId will be null or undefined.

  if (isAdminRoute(req)) {
    //This checks if the incoming request matches any of the admin routes defined in the isAdminRoute matcher. If it does, it means that the user is trying to access an admin page or API route, which should only be accessible to authenticated users with the admin role.
    if (!userId) {
      //If the userId is not present, it means that the user is not authenticated. In this case, we want to redirect them to the sign-in page so they can log in and gain access to the admin routes.
      return redirectToLocalSignIn(req);
    }
  }

  if (isTeacherRoute(req)) {
    //This checks if the incoming request matches any of the teacher routes defined in the isTeacherRoute matcher. If it does, it means that the user is trying to access a teacher page, which should only be accessible to authenticated users with the teacher role.
    if (!userId) {
      return redirectToLocalSignIn(req); //If the userId is not present, it means that the user is not authenticated. In this case, we want to redirect them to the sign-in page so they can log in and gain access to the teacher routes.
    }
  }

  if (isStudentRoute(req)) {
    //This checks if the incoming request matches any of the student routes defined in the isStudentRoute matcher. If it does, it means that the user is trying to access a student page, which should only be accessible to authenticated users with the student role.
    if (!userId) {
      return redirectToLocalSignIn(req); //If the userId is not present, it means that the user is not authenticated. In this case, we want to redirect them to the sign-in page so they can log in and gain access to the student routes.
    }
  }

  return NextResponse.next(); //If the request does not match any of the protected routes (admin, teacher, student) or if the user is authenticated, we simply return NextResponse.next(), which allows the request to proceed as normal. This means that authenticated users can access their respective routes, and unauthenticated users can access invite links without being redirected.
});

export const config = {
  //This is the configuration object for the middleware, which specifies which routes the middleware should run on. The matcher property is an array of route patterns that determine when the middleware should be executed.
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
