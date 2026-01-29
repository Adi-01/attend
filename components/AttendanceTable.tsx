"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, formatTime } from "@/lib/utils";
import {
  MapPin,
  Download,
  Loader2,
  FileText,
  RefreshCcw,
  MoreVertical,
  Edit,
  CalendarClock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { generateAttendancePDF, getShift } from "@/lib/utils";
import { updateAttendanceTime } from "@/lib/attendance.actions";
import Link from "next/link";
// TODO: Import your actual update server action here
// import { updateAttendanceTime } from "@/lib/attendance.actions";

// --- TYPES ---
type EditState = {
  isOpen: boolean;
  rowId: string | null;
  field: "checkIn" | "checkOut" | null;
  currentValue: string | null;
  userName: string;
};

// --- MAIN COMPONENT ---
export default function AttendanceTable({
  data,
  page,
  limit,
  total,
}: {
  data: any[];
  page: number;
  limit: number;
  total: number;
}) {
  const router = useRouter();

  // -- States --
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // -- Edit Modal State --
  const [editState, setEditState] = useState<EditState>({
    isOpen: false,
    rowId: null,
    field: null,
    currentValue: null,
    userName: "",
  });

  // -- Handlers --
  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExport = async () => {
    setIsExporting(true);
    await generateAttendancePDF(exportMonth, exportYear);
    setIsExporting(false);
  };

  const openMap = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  const openEditModal = (item: any, field: "checkIn" | "checkOut") => {
    setEditState({
      isOpen: true,
      rowId: item.$id,
      field: field,
      currentValue: field === "checkIn" ? item.checkInAt : item.checkOutAt,
      userName: item.userName,
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-6 md:mx-14 text-white my-8">
      {/* 1. EDIT DIALOG (Popup) */}
      <EditTimeDialog
        state={editState}
        onClose={() => setEditState((prev) => ({ ...prev, isOpen: false }))}
        onSuccess={handleRefresh} // Refresh table after save
      />

      {/* 2. Controls Section */}
      <ExportControls
        month={exportMonth}
        year={exportYear}
        setMonth={setExportMonth}
        setYear={setExportYear}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* 3. Actions Row */}
      <ActionToolbar
        onViewRegister={() => router.push("/register")}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* 4. Data Table */}
      <div className="overflow-x-auto rounded-md border border-neutral-800">
        <Table className="bg-black">
          <TableHeader className="bg-neutral-900 text-white">
            <TableRow className="*:border-neutral-700 [&>:not(:last-child)]:border-r">
              {[
                "NAME",
                "PHONE",
                "IN",
                "IN TIME",
                "OUT",
                "OUT TIME",
                "SHIFT",
                "LOCATION",
                "",
              ].map((h, i) => (
                <TableHead
                  key={i}
                  className={`min-w-[120px] ${
                    h === "" ? "w-[50px] min-w-[50px]" : ""
                  }`}
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <AttendanceRow
                key={item.$id}
                item={item}
                openMap={openMap}
                onEdit={openEditModal} // Pass edit handler down
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 5. Pagination */}
      <PaginationControls
        page={page}
        totalPages={totalPages}
        onPageChange={(p: number) =>
          router.push(p === 1 ? "/attendance" : `/attendance?page=${p}`)
        }
      />
    </div>
  );
}

// --- SUB-COMPONENTS ---

// 1. The Edit Dialog Component
const EditTimeDialog = ({
  state,
  onClose,
  onSuccess,
}: {
  state: EditState;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [newDate, setNewDate] = useState("");

  // Convert ISO string to "YYYY-MM-DDTHH:mm" for the input field
  const getInputValue = () => {
    if (!state.currentValue) return "";
    const date = new Date(state.currentValue);
    // Adjust for timezone offset to show correct local time in picker
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - offset)
      .toISOString()
      .slice(0, 16);
    return localISOTime;
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const isoDate = new Date(newDate).toISOString();

      // CALL THE FUNCTION HERE
      const result = await updateAttendanceTime(
        state.rowId!,
        state.field!,
        isoDate,
      );

      if (result.success) {
        onSuccess(); // Triggers the table refresh
        onClose();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Failed to update", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={state.isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Edit {state.field === "checkIn" ? "Check In" : "Check Out"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label className="text-neutral-400">Employee</Label>
            <div className="font-medium text-lg">{state.userName}</div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="datetime" className="text-neutral-400">
              New Time
            </Label>
            <Input
              id="datetime"
              type="datetime-local"
              defaultValue={getInputValue()}
              onChange={(e) => setNewDate(e.target.value)}
              className="bg-black border-neutral-700 text-white"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-transparent border-neutral-700 hover:bg-neutral-800 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// 2. The Row Component with Menu
const AttendanceRow = ({ item, openMap, onEdit }: any) => {
  const shift = getShift(item.checkInAt, item.checkOutAt);
  const cinTime = formatTime(item.checkInAt);
  const coutTime = formatTime(item.checkOutAt);

  return (
    <TableRow className="*:border-neutral-700 [&>:not(:last-child)]:border-r bg-black hover:bg-neutral-800/40 group">
      <TableCell>{item.userName}</TableCell>
      <TableCell>{item.phoneNumber}</TableCell>
      <TableCell className="flex justify-center">
        <LocationPill
          date={item.checkInAt}
          lat={item.latitudeIn}
          lng={item.longitudeIn}
          openMap={openMap}
        />
      </TableCell>
      <TableCell>
        {cinTime ? (
          cinTime
        ) : (
          <Pill text="Pending" color="bg-yellow-900/40 text-yellow-300" />
        )}
      </TableCell>
      <TableCell className="flex justify-center">
        <LocationPill
          date={item.checkOutAt}
          lat={item.latitudeOut}
          lng={item.longitudeOut}
          openMap={openMap}
        />
      </TableCell>
      <TableCell>
        {coutTime ? (
          coutTime
        ) : (
          <Pill text="Pending" color="bg-yellow-900/40 text-yellow-300" />
        )}
      </TableCell>
      <TableCell>
        {shift === "Pending" ? (
          <Pill text="Pending" color="bg-yellow-900/40 text-yellow-300" />
        ) : shift === "Day Shift" ? (
          <Pill text="DAY" color="bg-green-800 text-white" />
        ) : (
          <Pill text="NIGHT" color="bg-blue-800 text-white" />
        )}
      </TableCell>
      <TableCell>{item.workLocation}</TableCell>

      {/* ACTIONS COLUMN */}
      <TableCell className="w-[50px] p-0 text-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-neutral-800 rounded-full"
            >
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4 text-neutral-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-neutral-900 border-neutral-800 text-neutral-200"
          >
            <DropdownMenuLabel>Actions</DropdownMenuLabel>

            <DropdownMenuItem
              onClick={() => onEdit(item, "checkIn")}
              className="hover:bg-neutral-800 hover:text-white cursor-pointer"
            >
              <CalendarClock className="mr-2 h-4 w-4" /> Edit Check In
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => onEdit(item, "checkOut")}
              className="hover:bg-neutral-800 hover:text-white cursor-pointer"
            >
              <CalendarClock className="mr-2 h-4 w-4" /> Edit Check Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

// --- HELPERS (Pills, Controls etc - same as before) ---
const Pill = ({ text, color }: { text: string; color: string }) => (
  <span
    className={`px-3 py-1 rounded-full text-xs font-medium text-center flex items-center justify-center w-fit mx-auto ${color}`}
  >
    {text}
  </span>
);

const LocationPill = ({ date, lat, lng, openMap }: any) => {
  if (!lat)
    return <Pill text="Pending" color="bg-yellow-900/40 text-yellow-300" />;
  return (
    <button
      onClick={() => openMap(lat, lng)}
      className="flex items-center gap-1 text-white p-1 rounded-full group"
    >
      <MapPin size={16} className="text-red-300 group-hover:text-red-400" />
      <span className="-mt-px">{formatDate(date) || "Pending"}</span>
    </button>
  );
};

const ExportControls = ({
  month,
  year,
  setMonth,
  setYear,
  onExport,
  isExporting,
}: any) => (
  <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
    <div className="flex items-center gap-2">
      <FileText className="text-neutral-400" />
      <span className="font-semibold text-sm text-neutral-200">
        Export Monthly Report
      </span>
    </div>
    <div className="flex gap-3">
      <select
        value={month}
        onChange={(e) => setMonth(Number(e.target.value))}
        className="bg-black border border-neutral-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-500"
      >
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <option key={m} value={m}>
            {new Date(0, m - 1).toLocaleString("default", { month: "long" })}
          </option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => setYear(Number(e.target.value))}
        className="bg-black border border-neutral-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-500"
      >
        {[2024, 2025, 2026].map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <button
        onClick={onExport}
        disabled={isExporting}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {isExporting ? "Generating..." : "Download PDF"}
      </button>
    </div>
  </div>
);

const ActionToolbar = ({ onViewRegister, onRefresh, isRefreshing }: any) => (
  <div className="flex justify-between items-center mb-6">
    <button
      className="px-6 py-2.5 bg-blue-500 rounded-full text-white/90 font-semibold hover:bg-blue-600 transition-all shadow-md hover:shadow-lg"
      onClick={onViewRegister}
    >
      View Register
    </button>
    <Link
      href="/mark-attendance"
      className="px-6 py-2.5 rounded-full bg-white/20"
    >
      Mark Attendance
    </Link>
    <button
      onClick={onRefresh}
      disabled={isRefreshing}
      className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-full hover:bg-neutral-700 transition-all text-sm font-medium text-neutral-200"
    >
      <RefreshCcw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
      {isRefreshing ? "Reloading..." : "Reload Data"}
    </button>
  </div>
);

const PaginationControls = ({ page, totalPages, onPageChange }: any) => (
  <div className="flex justify-center gap-4 mt-6 items-center">
    <button
      disabled={page <= 1}
      onClick={() => onPageChange(page - 1)}
      className="px-4 py-2 rounded bg-neutral-800 disabled:opacity-40"
    >
      Previous
    </button>
    <span className="text-sm text-neutral-300">
      Page {page} of {totalPages}
    </span>
    <button
      disabled={page >= totalPages}
      onClick={() => onPageChange(page + 1)}
      className="px-4 py-2 rounded bg-neutral-800 disabled:opacity-40"
    >
      Next
    </button>
  </div>
);
