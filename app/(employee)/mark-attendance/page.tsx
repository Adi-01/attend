import AttendanceContainer from "@/components/attendance/AttendanceContainer";
import { cookies } from "next/headers";

export default async function MarkAttendancePage() {
  const cookie = await cookies();
  const username = cookie.get("username")?.value ?? "";
  return (
    <main className="min-h-screen bg-black/95 py-10 px-4 flex justify-center mt-20">
      <div className="w-full max-w-xl space-y-6">
        <AttendanceContainer username={username} />
      </div>
    </main>
  );
}
