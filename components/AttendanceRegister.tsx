"use client";

import { useState, useMemo } from "react";
import { RefreshCcw, Download, Filter } from "lucide-react";
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
import { getMonthlyAttendanceData } from "@/lib/attendance.actions";

// Types
type DayStatus = {
  count: number;
  working: boolean;
};

type UserMonthly = {
  userName: string;
  workLocation: string;
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
    initialData.attendanceData
  );

  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [isLoading, setIsLoading] = useState(false);
  const [locationFilter, setLocationFilter] = useState<string>("All");

  const daysInMonth = new Date(year, month, 0).getDate();

  // 1. Get Unique Locations
  const uniqueLocations = useMemo(() => {
    const locs = new Set(attendanceData.map((u) => u.workLocation));
    return ["All", ...Array.from(locs)].sort();
  }, [attendanceData]);

  // 2. Filter Data
  const filteredData = useMemo(() => {
    if (locationFilter === "All") return attendanceData;
    return attendanceData.filter((u) => u.workLocation === locationFilter);
  }, [attendanceData, locationFilter]);

  // 3. Calculate Grand Total (Sum of all user totals)
  const grandTotal = useMemo(() => {
    return filteredData.reduce((totalAcc, user) => {
      // Sum up days for this specific user
      const userTotal = Object.values(user.days).reduce(
        (dayAcc, day) => dayAcc + day.count,
        0
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
      "F"
    );

    doc.setTextColor(255, 255, 255);
    doc.text(
      `Attendance Register (${locationFilter}) - ${new Date(
        year,
        month - 1
      ).toLocaleString("default", {
        month: "long",
      })} ${year}`,
      14,
      15
    );

    const tableHead = [
      "Name",
      "Loc",
      ...Array.from({ length: daysInMonth }, (_, i) => String(i + 1)),
      "Total", // Added Total Header to PDF
    ];

    let pdfGrandTotal = 0;

    const tableBody = filteredData.map((user) => {
      const rowData: (string | number)[] = [user.userName, user.workLocation];
      let userTotal = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(
          day
        ).padStart(2, "0")}`;
        const { count, working } = user.days[dateKey] || {
          count: 0,
          working: false,
        };

        // Add to total
        userTotal += count;

        let display = "A";
        if (working) {
          display = "W";
        } else if (count > 0) {
          display = count === 1 ? "P" : `${count}P`;
        }
        rowData.push(display);
      }

      // Push User Total to the end of the row
      rowData.push(userTotal);
      pdfGrandTotal += userTotal;

      return rowData;
    });

    // Add Grand Total Row to PDF
    const grandTotalRow = [
      "GRAND TOTAL",
      "", // Location placeholder
      ...Array(daysInMonth).fill(""), // Empty cells for days
      pdfGrandTotal, // Final Sum
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
      bodyStyles: {
        fillColor: [23, 23, 23],
      },
      columnStyles: {
        0: { halign: "left", fontStyle: "bold", cellWidth: 25 },
        1: { halign: "left", cellWidth: 15 },
        // Style the last column (Total)
        [daysInMonth + 2]: { fontStyle: "bold", fillColor: [38, 38, 38] },
      },
      didParseCell: function (data) {
        if (data.section === "head") return;

        // Handle Grand Total Row styling
        if (data.row.index === tableBody.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [38, 38, 38]; // Darker background
          if (data.column.index === 0) {
            data.cell.colSpan = daysInMonth + 2; // Span Name across empty cells
          }
          return;
        }

        if (data.column.index <= 1) return;

        // Skip the last column (Total) for color coding
        if (data.column.index === daysInMonth + 2) return;

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

  return (
    <div className="w-full p-4 text-white">
      {/* Header & Legend */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-semibold">Attendance Register</h1>
        <div className="flex gap-4 text-sm font-medium bg-neutral-900 p-2 rounded border border-neutral-700 mt-2 md:mt-0">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-400"></span>
            <span className="text-green-400">P = Present</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400"></span>
            <span className="text-red-400">A = Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            <span className="text-yellow-400">W = Working</span>
          </div>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        {/* Month Select */}
        <select
          value={month}
          onChange={(e) => {
            setMonth(Number(e.target.value));
            fetchData(Number(e.target.value), year);
          }}
          className="border border-neutral-700 bg-neutral-900 text-white rounded px-3 py-2"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option value={m} key={m}>
              {new Date(0, m - 1).toLocaleString("en-US", { month: "long" })}
            </option>
          ))}
        </select>

        {/* Year Select */}
        <select
          value={year}
          onChange={(e) => {
            setYear(Number(e.target.value));
            fetchData(month, Number(e.target.value));
          }}
          className="border border-neutral-700 bg-neutral-900 text-white rounded px-3 py-2"
        >
          {[2024, 2025, 2026].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          className="p-2 bg-neutral-800 border border-neutral-700 rounded hover:bg-neutral-700 transition-colors"
          title="Refresh Data"
        >
          <RefreshCcw
            className={`w-5 h-5 text-white ${isLoading ? "animate-spin" : ""}`}
          />
        </button>

        {/* Location Filter */}
        <div className="flex items-center border border-neutral-700 bg-neutral-900 rounded px-2">
          <Filter className="w-4 h-4 text-neutral-400 mr-2" />
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="bg-transparent text-white py-2 focus:outline-none"
          >
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc} className="bg-neutral-900">
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Download Button */}
        <button
          onClick={generatePDF}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors ml-auto"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-neutral-700 rounded-lg">
        <Table className="min-w-max bg-neutral-900 text-white text-sm">
          <TableHeader>
            <TableRow className="bg-neutral-800 border-b border-neutral-700">
              <TableHead className="font-bold w-32 border-r border-neutral-700 sticky left-0 bg-neutral-800 z-10">
                Name
              </TableHead>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                (day) => (
                  <TableHead
                    key={day}
                    className="text-center border-r border-neutral-700 min-w-10 px-1 text-neutral-300"
                  >
                    {day}
                  </TableHead>
                )
              )}
              {/* Total Header */}
              <TableHead className="font-bold text-center w-16 bg-neutral-800 text-white border-l border-neutral-700">
                Total
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((user) => {
              // Calculate Row Total
              const userTotal = Object.values(user.days).reduce(
                (acc, day) => acc + day.count,
                0
              );

              return (
                <TableRow
                  key={user.userName}
                  className="hover:bg-neutral-800/50"
                >
                  <TableCell className="font-medium border-r border-neutral-700 sticky left-0 bg-neutral-900 z-10">
                    <div className="flex flex-col">
                      <span>{user.userName}</span>
                    </div>
                  </TableCell>

                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                    (day) => {
                      const dateKey = `${year}-${String(month).padStart(
                        2,
                        "0"
                      )}-${String(day).padStart(2, "0")}`;
                      const { count, working } = user.days[dateKey] || {
                        count: 0,
                        working: false,
                      };

                      let display = "A";
                      let colorClass = "text-red-400";

                      if (working) {
                        display = "W";
                        colorClass = "text-yellow-400";
                      } else if (count > 0) {
                        display = count === 1 ? "P" : `${count}P`;
                        colorClass = "text-green-400";
                      }

                      return (
                        <TableCell
                          key={`${user.userName}-${day}`}
                          className={`text-center border-r border-neutral-700 p-1 ${colorClass}`}
                        >
                          {display}
                        </TableCell>
                      );
                    }
                  )}
                  {/* User Total Cell */}
                  <TableCell className="text-center font-bold text-white border-l border-neutral-700 bg-neutral-900/50">
                    {userTotal}
                  </TableCell>
                </TableRow>
              );
            })}

            {/* Grand Total Row */}
            {filteredData.length > 0 && (
              <TableRow className="bg-neutral-800 font-bold border-t-2 border-neutral-600">
                <TableCell className="sticky left-0 bg-neutral-800 z-10 text-white border-r border-neutral-700">
                  GRAND TOTAL
                </TableCell>
                {/* Empty cells for days */}
                {Array.from({ length: daysInMonth }).map((_, i) => (
                  <TableCell
                    key={i}
                    className="border-r border-neutral-700"
                  ></TableCell>
                ))}
                {/* Final Grand Total Cell */}
                <TableCell className="text-center text-green-400 text-base border-l border-neutral-700">
                  {grandTotal}
                </TableCell>
              </TableRow>
            )}

            {filteredData.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={daysInMonth + 2}
                  className="text-center py-8 text-neutral-500"
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
