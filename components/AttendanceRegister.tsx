"use client";

import { useState, useMemo } from "react";
import {
  RefreshCcw,
  Download,
  Filter,
  Menu,
  ClipboardList,
  UserCheck,
  FileText,
  ClockFading,
  X,
  Check,
  CheckCheck,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getMonthlyAttendanceData } from "@/lib/attendance.actions";
import { useRouter } from "next/navigation";
import { Separator } from "./ui/separator";

// Updated Types matching Backend
type DayStatus = {
  count: number;
  working: boolean;
  locations: string[]; // Array of locations for completed shifts
  workingLocation?: string; // Location of active shift
};

type UserMonthly = {
  userName: string;
  days: Record<string, DayStatus>;
};

export default function AttendanceRegister({
  initialData,
  initialMonth,
  initialYear,
}: {
  initialData: { attendanceData: UserMonthly[] };
  initialMonth: number;
  initialYear: number;
}) {
  const [attendanceData, setAttendanceData] = useState<UserMonthly[]>(
    initialData.attendanceData,
  );

  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [isLoading, setIsLoading] = useState(false);
  const [locationFilter, setLocationFilter] = useState<string>("All");
  const router = useRouter();

  const daysInMonth = new Date(year, month, 0).getDate();

  // 1. Get Unique Locations (Scan ALL days of ALL users)
  const uniqueLocations = useMemo(() => {
    const locSet = new Set<string>();
    attendanceData.forEach((user) => {
      Object.values(user.days).forEach((day) => {
        // Add completed locations
        day.locations?.forEach((loc) => locSet.add(loc));
        // Add active location
        if (day.workingLocation) locSet.add(day.workingLocation);
      });
    });
    return ["All", ...Array.from(locSet)].sort();
  }, [attendanceData]);

  // 2. Advanced Filtering Logic
  const filteredData = useMemo(() => {
    if (locationFilter === "All") return attendanceData;

    // Filter Users AND Recalculate their daily counts based on location
    return attendanceData
      .map((user) => {
        const newUser = { ...user, days: { ...user.days } };
        let hasDataForLocation = false;

        Object.keys(newUser.days).forEach((dateKey) => {
          const originalDay = newUser.days[dateKey];

          // Filter completed shifts for this location
          const matchingCompleted = originalDay.locations.filter(
            (loc) => loc === locationFilter,
          ).length;

          // Check if active shift matches location
          const matchesWorking = originalDay.workingLocation === locationFilter;

          if (matchingCompleted > 0 || matchesWorking) {
            hasDataForLocation = true;
          }

          // Overwrite the day data for the View to only reflect this filter
          newUser.days[dateKey] = {
            ...originalDay,
            count: matchingCompleted, // Only count shifts at this location
            working: matchesWorking, // Only show W if working at this location
          };
        });

        // Only return user if they have at least one record for this location
        return hasDataForLocation ? newUser : null;
      })
      .filter((u): u is UserMonthly => u !== null);
  }, [attendanceData, locationFilter]);

  // 3. Calculate Grand Total
  const grandTotal = useMemo(() => {
    return filteredData.reduce((totalAcc, user) => {
      const userTotal = Object.values(user.days).reduce(
        (dayAcc, day) => dayAcc + day.count,
        0,
      );
      return totalAcc + userTotal;
    }, 0);
  }, [filteredData]);

  // --- PDF GENERATION ---
  const generatePDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFillColor(23, 23, 23);
    doc.rect(
      0,
      0,
      doc.internal.pageSize.width,
      doc.internal.pageSize.height,
      "F",
    );

    doc.setTextColor(255, 255, 255);
    doc.text(
      `Attendance Register (${locationFilter}) - ${new Date(
        year,
        month - 1,
      ).toLocaleString("default", { month: "long" })} ${year}`,
      14,
      15,
    );

    const tableHead = [
      "Name",
      ...Array.from({ length: daysInMonth }, (_, i) => String(i + 1)),
      "Total",
    ];

    let pdfGrandTotal = 0;

    const tableBody = filteredData.map((user) => {
      const rowData: (string | number)[] = [user.userName];
      let userTotal = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(
          day,
        ).padStart(2, "0")}`;
        const { count, working } = user.days[dateKey] || {
          count: 0,
          working: false,
        };

        userTotal += count;

        let display = "A";
        if (working) display = "W";
        else if (count > 0) display = count === 1 ? "P" : `${count}P`;

        rowData.push(display);
      }

      rowData.push(userTotal);
      pdfGrandTotal += userTotal;
      return rowData;
    });

    const grandTotalRow = [
      "GRAND TOTAL",
      ...Array(daysInMonth).fill(""),
      pdfGrandTotal,
    ];
    tableBody.push(grandTotalRow);

    autoTable(doc, {
      head: [tableHead],
      body: tableBody,
      startY: 20,
      theme: "grid",
      styles: {
        fontSize: 7,
        cellPadding: 1,
        halign: "center",
        textColor: [255, 255, 255],
        lineColor: [64, 64, 64],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [38, 38, 38],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        lineColor: [64, 64, 64],
      },
      bodyStyles: { fillColor: [23, 23, 23] },
      columnStyles: {
        0: { halign: "left", fontStyle: "bold", cellWidth: 30 },
        [daysInMonth + 1]: { fontStyle: "bold", fillColor: [38, 38, 38] },
      },
      didParseCell: function (data) {
        if (data.section === "head") return;
        if (data.row.index === tableBody.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [38, 38, 38];
          if (data.column.index === 0) data.cell.colSpan = daysInMonth + 1;
          return;
        }
        if (data.column.index === 0) return;
        if (data.column.index === daysInMonth + 1) return;

        const text = data.cell.raw;
        if (text === "W") {
          data.cell.styles.textColor = [250, 204, 21];
          data.cell.styles.fontStyle = "bold";
        } else if (typeof text === "string" && text.includes("P")) {
          data.cell.styles.textColor = [74, 222, 128];
        } else {
          data.cell.styles.textColor = [248, 113, 113];
        }
      },
    });

    doc.save(`Attendance_${locationFilter}_${month}_${year}.pdf`);
  };

  const fetchData = async (m: number, y: number) => {
    setIsLoading(true);
    const res = await getMonthlyAttendanceData(m, y);
    if (res.success) {
      setAttendanceData(res.attendanceData as UserMonthly[]);
    }
    setIsLoading(false);
  };

  const handleRefresh = () => fetchData(month, year);
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1].map(String);

  return (
    <div className="mx-6 md:mx-14 text-white my-8">
      {/* 1. Unified Control Navbar */}
      <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-2 rounded-full shadow-lg mb-8 w-full">
        {/* LEFT SIDE: Actions & Filters */}
        <div className="flex items-center gap-2 pl-2">
          {/* DESKTOP: Icon-only actions */}
          <div className="hidden sm:flex items-center gap-2">
            <Button
              onClick={() => router.push("/attendance")}
              variant="ghost"
              size="icon"
              className="rounded-full text-neutral-300 hover:bg-neutral-800 hover:text-white"
              title="View Daily Logs"
            >
              <FileText className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => router.push("/mark-attendance")}
              variant="ghost"
              size="icon"
              className="rounded-full text-neutral-300 hover:bg-neutral-800 hover:text-white"
              title="Mark Attendance"
            >
              <UserCheck className="w-5 h-5" />
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              variant="ghost"
              size="icon"
              className="rounded-full text-neutral-300 hover:bg-neutral-800 hover:text-white"
              title="Reload Data"
            >
              <RefreshCcw
                className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          {/* MOBILE: Hamburger Menu */}
          <div className="sm:hidden">
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
                  onClick={() => router.push("/attendance")}
                  className="cursor-pointer hover:bg-neutral-800"
                >
                  <FileText className="w-4 h-4 mr-2" /> View Daily Logs
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/mark-attendance")}
                  className="cursor-pointer hover:bg-neutral-800"
                >
                  <UserCheck className="w-4 h-4 mr-2" /> Mark Attendance
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="cursor-pointer hover:bg-neutral-800"
                >
                  <RefreshCcw
                    className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                  />{" "}
                  Reload Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* FILTER POPUP (Desktop & Mobile) */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-neutral-300 hover:bg-neutral-800 hover:text-white relative"
                title="Filters"
              >
                <Filter className="w-5 h-5" />
                {locationFilter !== "All" && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[400px] rounded-2xl">
              <DialogHeader>
                <DialogTitle>Filter Register</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="flex flex-col gap-3">
                  <Label className="text-neutral-400">Select Month</Label>
                  <Select
                    value={month.toString()}
                    onValueChange={(v) => {
                      const m = Number(v);
                      setMonth(m);
                      fetchData(m, year);
                    }}
                  >
                    <SelectTrigger className="w-full bg-black border-neutral-700 text-white rounded-xl focus:ring-0">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800 text-white rounded-xl">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <SelectItem
                          key={m}
                          value={m.toString()}
                          className="focus:bg-neutral-800 focus:text-white cursor-pointer"
                        >
                          {new Date(0, m - 1).toLocaleString("en-US", {
                            month: "long",
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-3">
                  <Label className="text-neutral-400">Select Year</Label>
                  <Select
                    value={year.toString()}
                    onValueChange={(v) => {
                      const y = Number(v);
                      setYear(y);
                      fetchData(month, y);
                    }}
                  >
                    <SelectTrigger className="w-full bg-black border-neutral-700 text-white rounded-xl focus:ring-0">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800 text-white rounded-xl">
                      {years.map((y) => (
                        <SelectItem
                          key={y}
                          value={y.toString()}
                          className="focus:bg-neutral-800 focus:text-white cursor-pointer"
                        >
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-3">
                  <Label className="text-neutral-400">Select Location</Label>
                  <Select
                    value={locationFilter}
                    onValueChange={setLocationFilter}
                  >
                    <SelectTrigger className="w-full bg-black border-neutral-700 text-white rounded-xl focus:ring-0">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800 text-white rounded-xl">
                      {uniqueLocations.map((loc) => (
                        <SelectItem
                          key={loc}
                          value={loc}
                          className="focus:bg-neutral-800 focus:text-white cursor-pointer"
                        >
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* RIGHT SIDE: Export Button */}
        <div className="pr-1">
          <Button
            onClick={generatePDF}
            variant="secondary"
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5"
          >
            <Download className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
        </div>
      </div>

      {/* 2. Header & Legend beneath Navbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold">Attendance Register</h1>
          {locationFilter !== "All" && (
            <span className="text-neutral-400 text-sm bg-neutral-800 px-2 py-0.5 rounded-full">
              {locationFilter}
            </span>
          )}
        </div>

        <div className="flex gap-4 text-sm font-medium bg-neutral-900 p-2 px-4 rounded-full border border-neutral-800 mt-4 md:mt-0 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-400 flex flex-row items-center justify-center">
              <Check className="w-4 h-4 -mb-0.5 mr-1" /> = Present
            </span>
            <Separator orientation="vertical" className="bg-neutral-600" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-red-400 flex flex-row items-center justify-center">
              <X className="w-4 h-4 -mb-0.5 mr-1" /> = Absent
            </span>
            <Separator orientation="vertical" className="bg-neutral-600" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-yellow-400 flex flex-row items-center justify-center">
              <ClockFading className="w-4 h-4 -mb-0.5 mr-1" /> = Working
            </span>
          </div>
        </div>
      </div>

      {/* 3. Data Table */}
      <div className="overflow-x-auto border border-neutral-800 rounded-lg shadow-xl">
        <Table className="min-w-max bg-black text-white text-sm">
          <TableHeader>
            <TableRow className="bg-neutral-900 border-b border-neutral-800">
              <TableHead className="font-bold w-50 border-r border-neutral-800 sticky left-0 bg-neutral-900 z-10 text-white">
                Name
              </TableHead>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                (day) => (
                  <TableHead
                    key={day}
                    className="text-center border-r border-neutral-800 min-w-10 px-1 text-neutral-400"
                  >
                    {day}
                  </TableHead>
                ),
              )}
              <TableHead className="font-bold text-center w-16 bg-neutral-900 text-white border-l border-neutral-800">
                Total
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((user) => {
              const userTotal = Object.values(user.days).reduce(
                (acc, day) => acc + day.count,
                0,
              );
              return (
                <TableRow
                  key={user.userName}
                  className="hover:bg-neutral-800/40 border-b border-neutral-800"
                >
                  <TableCell className="font-medium border-r border-neutral-800 sticky left-0 bg-black z-10 group-hover:bg-neutral-900 transition-colors">
                    {user.userName}
                  </TableCell>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                    (day) => {
                      const dateKey = `${year}-${String(month).padStart(
                        2,
                        "0",
                      )}-${String(day).padStart(2, "0")}`;
                      const { count, working } = user.days[dateKey] || {
                        count: 0,
                        working: false,
                      };

                      let display: React.ReactNode = (
                        <X className="w-4 h-4 mx-auto" />
                      );
                      let colorClass = "text-neutral-600"; // Dimmed absent color
                      if (working) {
                        display = <ClockFading size={14} className="mx-auto" />;
                        colorClass = "text-yellow-400 font-semibold";
                      } else if (count > 0) {
                        display =
                          count === 1 ? (
                            <Check className="w-4 h-4 mx-auto" />
                          ) : (
                            <CheckCheck className="w-4 h-4 mx-auto" />
                          );
                        colorClass = "text-green-400 font-medium";
                      } else {
                        colorClass = "text-red-500 font-medium opacity-60"; // A bit subtle for absent
                      }

                      return (
                        <TableCell
                          key={`${user.userName}-${day}`}
                          className={`text-center border-r border-neutral-800 p-1 ${colorClass}`}
                        >
                          {display}
                        </TableCell>
                      );
                    },
                  )}
                  <TableCell className="text-center font-bold text-white border-l border-neutral-800 bg-neutral-900/30">
                    {userTotal}
                  </TableCell>
                </TableRow>
              );
            })}

            {filteredData.length > 0 && (
              <TableRow className="bg-neutral-900 font-bold border-t-2 border-neutral-700">
                <TableCell className="sticky left-0 bg-neutral-900 z-10 text-white border-r border-neutral-800">
                  GRAND TOTAL
                </TableCell>
                {Array.from({ length: daysInMonth }).map((_, i) => (
                  <TableCell
                    key={i}
                    className="border-r border-neutral-800"
                  ></TableCell>
                ))}
                <TableCell className="text-center text-blue-400 text-base border-l border-neutral-800">
                  {grandTotal}
                </TableCell>
              </TableRow>
            )}

            {filteredData.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={daysInMonth + 2}
                  className="text-center py-10 text-neutral-500 bg-black"
                >
                  No users found for this location.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
