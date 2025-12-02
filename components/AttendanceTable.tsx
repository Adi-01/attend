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
import { formatDate, formatTime } from "@/lib/utils";
import { MapPin, Download, Loader2, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getMonthlyExportData } from "@/lib/attendance.actions"; // Import the new function

// --- Helper Functions ---
const getShift = (cin: string | null, cout: string | null) => {
  if (!cin || !cout) return "Pending";
  return new Date(cin).toDateString() === new Date(cout).toDateString()
    ? "Day Shift"
    : "Night Shift";
};

const Pill = (text: string, color: string) => (
  <span
    className={`px-3 py-1 rounded-full text-xs font-medium text-center flex items-center justify-center w-fit mx-auto ${color}`}
  >
    {text}
  </span>
);

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

  // --- PDF Export State ---
  // Default to current month/year for the dropdowns
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [isExporting, setIsExporting] = useState(false);

  // --- PDF Generation Logic ---
  const handleExportPDF = async () => {
    setIsExporting(true);

    // 1. Fetch ALL data for the month
    const res = await getMonthlyExportData(exportMonth, exportYear);

    if (!res.success || !res.data || res.data.length === 0) {
      alert("No data found for the selected month.");
      setIsExporting(false);
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });

    // 2. Dark Background Setup
    doc.setFillColor(0, 0, 0);
    doc.rect(
      0,
      0,
      doc.internal.pageSize.width,
      doc.internal.pageSize.height,
      "F"
    );

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(
      `Attendance Report - ${new Date(0, exportMonth - 1).toLocaleString(
        "default",
        {
          month: "long",
        }
      )} ${exportYear}`,
      14,
      15
    );

    // 3. Map Data (Pass Objects for In/Out Date to hold coordinates)
    const tableBody = res.data.map((item: any) => {
      const shift = getShift(item.checkInAt, item.checkOutAt);

      // Helper to build the cell object
      const createLocationCell = (
        dateStr: string | null,
        lat?: number,
        lng?: number
      ) => {
        const text = dateStr ? formatDate(dateStr) : "Pending";
        // We pass 'content' for the text, and extra props for the link logic
        return {
          content: text,
          lat: lat,
          lng: lng,
        };
      };

      return [
        item.userName,
        item.phoneNumber,
        createLocationCell(item.checkInAt, item.latitudeIn, item.longitudeIn), // IN DATE
        formatTime(item.checkInAt) || "Pending",
        createLocationCell(
          item.checkOutAt,
          item.latitudeOut,
          item.longitudeOut
        ), // OUT DATE
        formatTime(item.checkOutAt) || "Pending",
        shift,
        item.workLocation || "N/A",
      ];
    });

    // 4. Generate PDF Table
    autoTable(doc, {
      head: [
        [
          "NAME",
          "PHONE",
          "IN DATE",
          "IN TIME",
          "OUT DATE",
          "OUT TIME",
          "SHIFT",
          "LOCATION",
        ],
      ],
      body: tableBody,
      startY: 25,
      theme: "grid",
      styles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        lineColor: [50, 50, 50],
        lineWidth: 0.1,
        fontSize: 9,
        halign: "center",
        valign: "middle",
      },
      headStyles: {
        fillColor: [23, 23, 23],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },

      // 5. Parse Cell: Color text Blue if it has coordinates
      didParseCell: (data) => {
        if (data.section === "head") return;

        // Access the raw object we passed in step 3
        const raw = data.cell.raw as any;

        // Logic for Location Links (Blue Text)
        if (raw && typeof raw === "object" && raw.lat && raw.lng) {
          data.cell.styles.textColor = [45, 130, 246]; // Blue-500
          data.cell.styles.fontStyle = "bold";
        }
        // Logic for Status Colors (Pending/Shift) - same as before
        else if (data.cell.raw === "Pending") {
          data.cell.styles.textColor = [253, 224, 71]; // Yellow
        } else if (data.cell.raw === "Day Shift") {
          data.cell.styles.textColor = [34, 197, 94]; // Green
        } else if (data.cell.raw === "Night Shift") {
          data.cell.styles.textColor = [59, 130, 246]; // Blue
        }
      },

      // 6. Draw Cell: Add Link and "Pin" circle
      didDrawCell: (data) => {
        const raw = data.cell.raw as any;

        // If this cell has coordinates, make it clickable and draw a dot
        if (
          data.section === "body" &&
          raw &&
          typeof raw === "object" &&
          raw.lat &&
          raw.lng
        ) {
          // A. Create the Link Area
          const linkUrl = `https://www.google.com/maps?q=${raw.lat},${raw.lng}`;
          doc.link(
            data.cell.x,
            data.cell.y,
            data.cell.width,
            data.cell.height,
            { url: linkUrl }
          );

          // B. Draw a visual "Pin" (Small Red Circle) to the left of the text
          // Calculate position (centered text means we need to offset carefully)
          const textWidth = doc.getTextWidth(raw.content);
          const xPos = data.cell.x + data.cell.width / 2 - textWidth / 2 - 3;
          const yPos = data.cell.y + data.cell.height / 2;

          doc.setFillColor(248, 113, 113); // Red-400
          doc.circle(xPos, yPos, 1, "F"); // Draw small circle (radius 1)
        }
      },
    });

    doc.save(`Attendance_${exportMonth}_${exportYear}.pdf`);
    setIsExporting(false);
  };

  // --- Pagination Logic (Unchanged) ---
  const totalPages = Math.ceil(total / limit);
  const onPageChange = (newPage: number) => {
    if (newPage === 1) router.push("/attendance");
    else router.push(`/attendance?page=${newPage}`);
  };

  const openMap = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  return (
    <div className="mx-6 md:mx-14 text-white my-8">
      {/* --- EXPORT CONTROLS SECTION --- */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <FileText className="text-neutral-400" />
          <span className="font-semibold text-sm text-neutral-200">
            Export Monthly Report
          </span>
        </div>

        <div className="flex gap-3">
          {/* Month Select */}
          <select
            value={exportMonth}
            onChange={(e) => setExportMonth(Number(e.target.value))}
            className="bg-black border border-neutral-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-500"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(0, m - 1).toLocaleString("default", {
                  month: "long",
                })}
              </option>
            ))}
          </select>

          {/* Year Select */}
          <select
            value={exportYear}
            onChange={(e) => setExportYear(Number(e.target.value))}
            className="bg-black border border-neutral-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-500"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Download Button */}
          <button
            onClick={handleExportPDF}
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

      {/* --- EXISTING TABLE (UNCHANGED) --- */}
      <div className="overflow-x-auto">
        <Table className="bg-black">
          <TableHeader className="bg-neutral-900 text-white">
            <TableRow className="*:border-neutral-700 [&>:not(:last-child)]:border-r">
              <TableHead>NAME</TableHead>
              <TableHead>PHONE</TableHead>
              <TableHead>IN</TableHead>
              <TableHead>IN TIME</TableHead>
              <TableHead>OUT</TableHead>
              <TableHead>OUT TIME</TableHead>
              <TableHead>SHIFT</TableHead>
              <TableHead>WORK LOCATION</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((item) => {
              const checkInDate = formatDate(item.checkInAt);
              const checkInTime = formatTime(item.checkInAt);
              const checkOutDate = formatDate(item.checkOutAt);
              const checkOutTime = formatTime(item.checkOutAt);
              const shift = getShift(item.checkInAt, item.checkOutAt);

              const InPill = item.latitudeIn ? (
                <button
                  onClick={() => openMap(item.latitudeIn!, item.longitudeIn!)}
                  className="flex items-center gap-1 text-white p-1 rounded-full group"
                >
                  <MapPin
                    size={16}
                    className="text-red-300 group-hover:text-red-400"
                  />{" "}
                  <span className="-mt-px">{checkInDate || "Pending"}</span>
                </button>
              ) : (
                Pill("Pending", "bg-yellow-900/40 text-yellow-300")
              );

              const OutPill = item.latitudeOut ? (
                <button
                  onClick={() => openMap(item.latitudeOut!, item.longitudeOut!)}
                  className="flex items-center gap-1 text-white p-1 rounded-full group"
                >
                  <MapPin
                    size={16}
                    className="text-red-300 group-hover:text-red-400"
                  />{" "}
                  <span className="-mt-px">{checkOutDate || "Pending"}</span>
                </button>
              ) : (
                Pill("Pending", "bg-yellow-900/40 text-yellow-300")
              );

              return (
                <TableRow
                  key={item.$id}
                  className="*:border-neutral-700 [&>:not(:last-child)]:border-r bg-black hover:bg-neutral-800/40"
                >
                  <TableCell>{item.userName}</TableCell>
                  <TableCell>{item.phoneNumber}</TableCell>
                  <TableCell className="flex justify-center">
                    {InPill}
                  </TableCell>
                  <TableCell>
                    {checkInTime
                      ? checkInTime
                      : Pill("Pending", "bg-yellow-900/40 text-yellow-300")}
                  </TableCell>
                  <TableCell className="flex justify-center">
                    {OutPill}
                  </TableCell>
                  <TableCell>
                    {checkOutTime
                      ? checkOutTime
                      : Pill("Pending", "bg-yellow-900/40 text-yellow-300")}
                  </TableCell>
                  <TableCell>
                    {shift === "Pending"
                      ? Pill("Pending", "bg-yellow-900/40 text-yellow-300")
                      : shift === "Day Shift"
                      ? Pill("DAY", "bg-green-800 text-white")
                      : Pill("NIGHT", "bg-blue-800 text-white")}
                  </TableCell>
                  <TableCell>{item.workLocation}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* --- PAGINATION (UNCHANGED) --- */}
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
    </div>
  );
}
