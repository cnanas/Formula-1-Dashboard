import { cookies } from "next/headers";
import { DashboardLayoutClient } from "./dashboard-layout-client";

const COOKIE_NAME = "f1dash_nav_mode";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const navMode = cookieStore.get(COOKIE_NAME)?.value;
  const initialNavMode =
    navMode === "bottom" || navMode === "sidebar" ? navMode : null;

  return (
    <DashboardLayoutClient initialNavMode={initialNavMode}>
      {children}
    </DashboardLayoutClient>
  );
}
