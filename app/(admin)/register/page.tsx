import AttendanceRegister from "@/components/AttendanceRegister";
import { getMonthlyAttendanceData } from "@/lib/attendance.actions";

export default async function AttendanceRegisterPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const data = await getMonthlyAttendanceData(month, year);

  return (
    <AttendanceRegister
      initialData={data}
      initialMonth={month}
      initialYear={year}
    />
  );
}
