export function exportCSV(data, filename) {
  if (!data.length) {
    alert("No data available to export.");
    return;
  }

  const headers = Object.keys(data[0]);

  const escapeCSV = (value) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  const csvRows = [
    headers.map(escapeCSV).join(","),
    ...data.map((row) =>
      headers.map((header) => escapeCSV(row[header])).join(",")
    ),
  ];

  const csvContent = "\uFEFF" + csvRows.join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}