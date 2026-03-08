import AttendanceTable from "@/components/AttendanceTable";
import { getNagaurAttendanceData } from "@/lib/attendance.actions";

export default async function AttendancePage(props: any) {
  const searchParams = await props.searchParams;

  const page = Number(searchParams?.page ?? 1);
  const limit = 14;

  const res = await getNagaurAttendanceData(page, limit);

  return (
    <AttendanceTable
      data={res.attendanceData}
      page={page}
      limit={limit}
      total={res.total ?? 0}
    />
  );
}
