import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getMonthlyExportData } from "@/lib/attendance.actions";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// --- Helpers ---
export const formatDate = (dateStr: string | null) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
};

export const formatTime = (dateStr: string | null) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

// Helper to determine shift
export const getShift = (cin: string | null, cout: string | null) => {
  if (!cin || !cout) return "Pending";
  return new Date(cin).toDateString() === new Date(cout).toDateString()
    ? "Day Shift"
    : "Night Shift";
};

export const generateAttendancePDF = async (month: number, year: number) => {
  const res = await getMonthlyExportData(month, year);

  if (!res.success || !res.data || res.data.length === 0) {
    alert("No data found for the selected month.");
    return false;
  }

  const doc = new jsPDF({ orientation: "landscape" });

  // Background
  doc.setFillColor(0, 0, 0);
  doc.rect(
    0,
    0,
    doc.internal.pageSize.width,
    doc.internal.pageSize.height,
    "F"
  );

  // Title
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `Attendance Report - ${new Date(0, month - 1).toLocaleString("default", {
      month: "long",
    })} ${year}`,
    14,
    15
  );

  const tableBody = res.data.map((item: any) => {
    const shift = getShift(item.checkInAt, item.checkOutAt);
    const createLocationCell = (
      dateStr: string | null,
      lat?: number,
      lng?: number
    ) => {
      const text = dateStr ? formatDate(dateStr) : "Pending";
      return { content: text, lat: lat, lng: lng };
    };

    return [
      item.userName,
      item.phoneNumber,
      createLocationCell(item.checkInAt, item.latitudeIn, item.longitudeIn),
      formatTime(item.checkInAt) || "Pending",
      createLocationCell(item.checkOutAt, item.latitudeOut, item.longitudeOut),
      formatTime(item.checkOutAt) || "Pending",
      shift,
      item.workLocation || "N/A",
    ];
  });

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
    didParseCell: (data) => {
      if (data.section === "head") return;
      const raw = data.cell.raw as any;
      if (raw && typeof raw === "object" && raw.lat && raw.lng) {
        data.cell.styles.textColor = [45, 130, 246];
        data.cell.styles.fontStyle = "bold";
      } else if (data.cell.raw === "Pending") {
        data.cell.styles.textColor = [253, 224, 71];
      } else if (data.cell.raw === "Day Shift") {
        data.cell.styles.textColor = [34, 197, 94];
      } else if (data.cell.raw === "Night Shift") {
        data.cell.styles.textColor = [59, 130, 246];
      }
    },
    didDrawCell: (data) => {
      const raw = data.cell.raw as any;
      if (
        data.section === "body" &&
        raw &&
        typeof raw === "object" &&
        raw.lat &&
        raw.lng
      ) {
        const linkUrl = `https://www.google.com/maps?q=${raw.lat},${raw.lng}`;
        doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, {
          url: linkUrl,
        });
      }
    },
  });

  doc.save(`Attendance_${month}_${year}.pdf`);
  return true;
};
