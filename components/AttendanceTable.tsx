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
  DialogTrigger,
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
  ClipboardList,
  UserCheck,
  Menu,
  ClockFading,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { generateAttendancePDF, getShift } from "@/lib/utils";
import { updateAttendanceTime } from "@/lib/attendance.actions";
import Link from "next/link";

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

      {/* 2 & 3. Unified Control Navbar */}
      <ControlNavbar
        month={exportMonth}
        year={exportYear}
        setMonth={setExportMonth}
        setYear={setExportYear}
        onExport={handleExport}
        isExporting={isExporting}
        onViewRegister={() => router.push("/register")}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <h1 className="text-2xl mb-5 font-medium">Daily Attendance Record</h1>

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
                "HOURS", // <--- ADDED HOURS HEADER HERE
                "SHIFT",
                "LOCATION",
                "",
              ].map((h, i) => (
                <TableHead
                  key={i}
                  className={`min-w-[150px] ${
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

  const getInputValue = () => {
    if (!state.currentValue) return "";
    const date = new Date(state.currentValue);
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

      const result = await updateAttendanceTime(
        state.rowId!,
        state.field!,
        isoDate,
      );

      if (result.success) {
        onSuccess();
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

  // --- ADDED HOURS CALCULATION HELPER ---
  const calculateHours = (checkIn: string, checkOut: string) => {
    if (!checkIn)
      return <Pill text="Pending" color="bg-yellow-900/40 text-yellow-300" />;

    // If there is a check-in but no check-out, they are currently working
    if (checkIn && !checkOut)
      return <Pill text="Working" color="bg-blue-900/40 text-blue-300" />;

    const inDate = new Date(checkIn).getTime();
    const outDate = new Date(checkOut).getTime();
    const diffMs = outDate - inDate;

    if (diffMs < 0)
      return <span className="text-red-400 text-sm">Invalid</span>;

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;

    return (
      <span className="font-medium">
        {hours}h {minutes}m
      </span>
    );
  };

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

      {/* --- ADDED HOURS CELL --- */}
      <TableCell>{calculateHours(item.checkInAt, item.checkOutAt)}</TableCell>

      <TableCell>
        {shift === "Pending" ? (
          <Pill text="Pending" color="bg-yellow-900/40 text-yellow-300" />
        ) : shift === "Day Shift" ? (
          <Pill text="DAY" color="bg-green-800 text-white" val />
        ) : (
          <Pill text="NIGHT" color="bg-blue-800 text-white" val />
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

// --- HELPERS (Pills, Controls etc) ---
const Pill = ({
  text,
  color,
  val,
}: {
  text: string;
  color: string;
  val?: boolean;
}) => (
  <span
    className={`px-3 py-1 rounded-full text-xs font-medium text-center flex items-center justify-center w-fit mx-auto gap-1 ${color}`}
  >
    <ClockFading size={14} className={`${val && "hidden"}`} />
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

const ControlNavbar = ({
  month,
  year,
  setMonth,
  setYear,
  onExport,
  isExporting,
  onViewRegister,
  onRefresh,
  isRefreshing,
}: any) => {
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(0, i).toLocaleString("default", { month: "long" }),
  }));

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1].map(String);

  return (
    <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-2 rounded-full shadow-lg mb-8 w-full">
      {/* LEFT SIDE: Actions */}
      <div className="flex items-center gap-2">
        {/* DESKTOP: Icon-only actions */}
        <div className="hidden sm:flex items-center gap-2 pl-2">
          <Button
            onClick={onViewRegister}
            variant="ghost"
            size="icon"
            className="rounded-full text-neutral-300 hover:bg-neutral-800 hover:text-white"
            title="View Register"
          >
            <ClipboardList className="w-5 h-5" />
          </Button>

          <Button
            asChild
            variant="ghost"
            size="icon"
            className="rounded-full text-neutral-300 hover:bg-neutral-800 hover:text-white"
            title="Mark Attendance"
          >
            <Link href="/mark-attendance">
              <UserCheck className="w-5 h-5" />
            </Link>
          </Button>

          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            variant="ghost"
            size="icon"
            className="rounded-full text-neutral-300 hover:bg-neutral-800 hover:text-white"
            title="Reload Data"
          >
            <RefreshCcw
              className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {/* MOBILE: Hamburger Menu */}
        <div className="sm:hidden pl-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-neutral-300 hover:bg-neutral-800"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="bg-neutral-900 border-neutral-800 text-white rounded-xl"
            >
              <DropdownMenuItem
                onClick={onViewRegister}
                className="cursor-pointer hover:bg-neutral-800"
              >
                <ClipboardList className="w-4 h-4 mr-2" /> View Register
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="cursor-pointer hover:bg-neutral-800"
              >
                <Link href="/mark-attendance">
                  <UserCheck className="w-4 h-4 mr-2" /> Mark Attendance
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onRefresh}
                disabled={isRefreshing}
                className="cursor-pointer hover:bg-neutral-800"
              >
                <RefreshCcw
                  className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                />{" "}
                Reload Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* RIGHT SIDE: Export Popup (Dialog) */}
      <div className="pr-1">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
              title="Export Report"
            >
              <Download className="w-5 h-5" />
              Monthly Report
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[400px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Export Monthly Report</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="flex flex-col gap-3">
                <Label className="text-neutral-400">Select Month</Label>
                <Select
                  value={month.toString()}
                  onValueChange={(v) => setMonth(Number(v))}
                >
                  <SelectTrigger className="w-full bg-black border-neutral-700 text-white rounded-xl focus:ring-0">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white rounded-xl">
                    {months.map((m) => (
                      <SelectItem
                        key={m.value}
                        value={m.value}
                        className="focus:bg-neutral-800 focus:text-white cursor-pointer"
                      >
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-3">
                <Label className="text-neutral-400">Select Year</Label>
                <Select
                  value={year.toString()}
                  onValueChange={(v) => setYear(Number(v))}
                >
                  <SelectTrigger className="w-full bg-black border-neutral-700 text-white rounded-xl focus:ring-0">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white rounded-xl">
                    {years.map((y) => (
                      <SelectItem
                        key={y}
                        value={y}
                        className="focus:bg-neutral-800 focus:text-white cursor-pointer"
                      >
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={onExport}
                disabled={isExporting}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {isExporting ? "Generating PDF..." : "Download PDF"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

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
