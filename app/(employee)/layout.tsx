import { ReactNode } from "react";
import { cookies } from "next/headers";
import Providers from "@/components/providers";
import { AuthNavbar } from "@/components/attendance/AttendanceNavbar";

export default async function BaseLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookie = await cookies();
  const role = cookie.get("user-label")?.value ?? "";
  return (
    <Providers>
      <AuthNavbar role={role} />
      {children}
    </Providers>
  );
}
