import AttendanceSheet from "@/components/attendance/AttendanceSheet";

// This component is now purely a container
export default function MyAttendancePage() {
  return (
    <div className="min-h-screen bg-black py-12 px-4 flex justify-center mt-20">
      <AttendanceSheet />
    </div>
  );
}
