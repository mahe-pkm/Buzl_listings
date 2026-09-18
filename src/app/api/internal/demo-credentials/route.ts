import { NextResponse } from "next/server";
import { isProductionEnvironment, isStagingEnvironment } from "@/lib/staging";

export const dynamic = "force-dynamic";

const demoAccounts = {
  admin: {
    email: process.env.STAGING_ADMIN_EMAIL || process.env.LOCAL_FIXTURE_ADMIN_EMAIL,
    password: process.env.STAGING_ADMIN_PASSWORD || process.env.LOCAL_FIXTURE_ADMIN_PASSWORD,
  },
  member: {
    email: process.env.STAGING_MEMBER_EMAIL || process.env.LOCAL_FIXTURE_MEMBER_EMAIL,
    password: process.env.STAGING_MEMBER_PASSWORD || process.env.LOCAL_FIXTURE_MEMBER_PASSWORD,
  },
  owner: {
    email: process.env.STAGING_OWNER_EMAIL || process.env.LOCAL_FIXTURE_OWNER_EMAIL,
    password: process.env.STAGING_OWNER_PASSWORD || process.env.LOCAL_FIXTURE_OWNER_PASSWORD,
  },
};

export async function GET() {
  const isAllowedEnv =
    !isProductionEnvironment() &&
    (isStagingEnvironment() || process.env.NODE_ENV === "development");

  if (
    !isAllowedEnv ||
    Object.values(demoAccounts).some(({ email, password }) => !email || !password)
  ) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.json(
    { accounts: demoAccounts },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } }
  );
}
