import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/", "/login", "/apply", "/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/teams", "/api/v1/rankings", "/api/v1/weeks"];
const protectedPaths = ["/admin", "/vote", "/pollster"];
const jwtSecret = process.env.JWT_SECRET || "";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
    
    if (!isPublicPath) {
      const token = request.cookies.get("access_token")?.value || 
                    request.headers.get("authorization")?.replace("Bearer ", "");
      
      if (!token) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      if (jwtSecret) {
        try {
          const parts = token.split(".");
          if (parts.length !== 3) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
          }
          
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
          const exp = payload.exp * 1000;
          
          if (Date.now() > exp) {
            return NextResponse.json({ error: "Token expired" }, { status: 401 });
          }
        } catch {
          return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }
      }
    }
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/image|_next/static|favicon.ico).*)"],
};