import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
      release: `lpp-frontend@${process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID || "1.0.0"}`,
      sendDefaultPii: false,
      tracesSampleRate: 0.1,
    });
  }
}