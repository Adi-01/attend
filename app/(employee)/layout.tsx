import { ReactNode } from "react";
import { cookies } from "next/headers";
import Providers from "@/components/providers";
import { AuthNavbar } from "@/components/attendance/AttendanceNavbar";

const cookie = await cookies();
const role = cookie.get("user-label")?.value ?? "";
export default function BaseLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <AuthNavbar role={role} />
      {children}
    </Providers>
  );
}
