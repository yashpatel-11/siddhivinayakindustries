// frontend/src/utils/excelExport.js
import * as XLSX from 'xlsx';

/**
 * Exports Party-wise stock data into a formatted Microsoft Excel (.xlsx) file.
 * Can export all parties and parts, or filter for a specific part.
 */
export function exportPartyWiseToExcel(partyWiseData = [], matrixData = [], specificPartNo = null) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const timeStr = new Date().toLocaleTimeString();

  // Prepare table rows
  const excelRows = [];
  let totalInwardAll = 0;
  let totalOutwardAll = 0;
  let totalWasteAll = 0;
  let totalStockAll = 0;

  // Process data from partyWiseData or matrixData
  partyWiseData.forEach(party => {
    const partyName = party.name || 'Unknown Party';
    const partyGstin = party.gstin || 'N/A';
    const partyPhone = party.phone || 'N/A';
    const partyParts = party.parts || [];

    partyParts.forEach(pt => {
      // If specific part filter is active
      if (specificPartNo && pt.part_no !== specificPartNo) {
        return;
      }

      const inQty = Number(pt.inward_qty || 0);
      const outQty = Number(pt.outward_qty || 0);
      const wasteQty = Number(pt.waste_qty || 0);
      const curStock = Number(pt.current_stock || 0);

      totalInwardAll += inQty;
      totalOutwardAll += outQty;
      totalWasteAll += wasteQty;
      totalStockAll += curStock;

      excelRows.push({
        'Party / Customer Name': partyName,
        'Party GSTIN': partyGstin,
        'Contact Phone': partyPhone,
        'Part Number': pt.part_no,
        'Description / Drawing': pt.description,
        'Material Grade': pt.grade || '-',
        'Unit': pt.unit || 'NOS',
        'Inward Qty': inQty,
        'Dispatched Qty': outQty,
        'Scrap / Rejection Qty': wasteQty,
        'Current Stock Balance': curStock,
        'Status': curStock > 0 ? 'In Stock (Pending Machining/Dispatch)' : 'Balanced / Dispatched'
      });
    });
  });

  // If filtered or empty
  if (excelRows.length === 0) {
    alert("No stock data available to export for this selection.");
    return;
  }

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelRows);

  // Auto-calculate column widths
  const colKeys = Object.keys(excelRows[0]);
  const colWidths = colKeys.map(key => {
    const maxLen = Math.max(
      key.length,
      ...excelRows.map(row => String(row[key] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
  });
  worksheet['!cols'] = colWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  const sheetName = specificPartNo ? `Part ${specificPartNo}`.slice(0, 31) : "Party-wise Stock";
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Filename
  const fileName = specificPartNo
    ? `PartyWise_Stock_${specificPartNo}_${dateStr}.xlsx`
    : `Siddhivinayak_CNC_PartyWise_Stock_${dateStr}.xlsx`;

  // Download Excel file
  XLSX.writeFile(workbook, fileName);
}

/**
 * Exports comprehensive multi-sheet Excel file:
 * Sheet 1: Party-wise Stock
 * Sheet 2: Part-wise Stock Summary
 */
export function exportFullInventoryExcel(partWiseData = [], partyWiseData = []) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const workbook = XLSX.utils.book_new();

  // 1. Party-wise Sheet
  const partyRows = [];
  partyWiseData.forEach(party => {
    (party.parts || []).forEach(pt => {
      partyRows.push({
        'Customer / Party': party.name,
        'Party GSTIN': party.gstin || 'N/A',
        'Part Number': pt.part_no,
        'Component Description': pt.description,
        'Material Grade': pt.grade || '-',
        'Total Inward': Number(pt.inward_qty || 0),
        'Dispatched': Number(pt.outward_qty || 0),
        'Scrap / Waste': Number(pt.waste_qty || 0),
        'Current Stock (NOS)': Number(pt.current_stock || 0),
        'Unit': pt.unit || 'NOS'
      });
    });
  });
  if (partyRows.length > 0) {
    const ws1 = XLSX.utils.json_to_sheet(partyRows);
    ws1['!cols'] = [
      { wch: 32 }, { wch: 20 }, { wch: 18 }, { wch: 30 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 8 }
    ];
    XLSX.utils.book_append_sheet(workbook, ws1, "Party-wise Breakdown");
  }

  // 2. Part-wise Summary Sheet
  const partRows = partWiseData.map(p => ({
    'Part Number': p.part_no,
    'Description': p.description,
    'Grade': p.grade || '-',
    'HSN Code': p.hsn_code || '73261910',
    'Total Inward (NOS)': Number(p.total_inward || 0),
    'Total Dispatched (NOS)': Number(p.total_outward || 0),
    'Total Scrap (NOS)': Number(p.total_waste || 0),
    'Current Stock Balance': Number(p.current_stock || 0),
    'Parties Count': p.parties_count || 1,
    'Unit': p.unit || 'NOS'
  }));
  if (partRows.length > 0) {
    const ws2 = XLSX.utils.json_to_sheet(partRows);
    ws2['!cols'] = [
      { wch: 18 }, { wch: 32 }, { wch: 14 }, { wch: 14 },
      { wch: 18 }, { wch: 20 }, { wch: 16 }, { wch: 20 }, { wch: 14 }, { wch: 8 }
    ];
    XLSX.utils.book_append_sheet(workbook, ws2, "Part-wise Summary");
  }

  XLSX.writeFile(workbook, `Siddhivinayak_CNC_Inventory_Complete_${dateStr}.xlsx`);
}

