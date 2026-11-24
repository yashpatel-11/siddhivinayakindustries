// frontend/src/services/api.js
// Handles communication with PHP backend (MySQL) with intelligent fallback to local mock data

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Initial local storage seeds matching real CNC workshop delivery challan
const INITIAL_PARTIES = [
  {
    id: 1,
    workshop: 'siddhivinayak',
    name: "AJK FORGE PRIVATE LIMITED",
    gstin: "24AAGCA0436P1ZN",
    address: "PLOT NO. 10 A SURVEY NO. 197 NEAR: MICROMELT PVT.LTD.VERAVAL (SHAPAR), RAJKOT.",
    phone: "9427867368 / 9313546921",
    state_code: "24-Gujarat",
    created_at: "2026-11-05 10:00:00"
  },
  {
    id: 2,
    workshop: 'siddhivinayak',
    name: "MARUTI AUTO COMPONENTS",
    gstin: "24AAECM4189B1Z2",
    address: "GIDC PHASE II, PLOT NO. 45/A, METODA, RAJKOT - 360021",
    phone: "9825012345",
    state_code: "24-Gujarat",
    created_at: "2026-11-06 11:30:00"
  },
  {
    id: 3,
    workshop: 'siddhivinayak',
    name: "SHREE RAM PRECISION TECH",
    gstin: "24AABCS8891D1ZO",
    address: "SHED NO. 8, SAMRAT INDUSTRIAL AREA, GONDAL ROAD, RAJKOT",
    phone: "9724156789",
    state_code: "24-Gujarat",
    created_at: "2026-11-07 14:15:00"
  },
  {
    id: 4,
    workshop: 'gayatri',
    name: "METALIC TECHNOFORGE LIMITED",
    gstin: "24AAKCM6128N1Z2",
    address: "PLOT NO. 6, SURVEY NOS. 296, PADAVALA, TAL KOTADASANGANI - 360,024",
    phone: "9033332255",
    state_code: "24-Gujarat",
    created_at: "2026-11-20 09:00:00"
  }
];

const INITIAL_PARTS = [
  {
    id: 1,
    workshop: 'siddhivinayak',
    part_no: "SG2639BRMC",
    description: "Gear Shaft Machined Component",
    grade: "20MNCR5",
    hsn_code: "73261910",
    default_rate: 82.00,
    unit: "NOS"
  },
  {
    id: 2,
    workshop: 'siddhivinayak',
    part_no: "FL-4401-PIN",
    description: "Flange Pinion Pin Bush",
    grade: "EN8D",
    hsn_code: "84834000",
    default_rate: 45.00,
    unit: "NOS"
  },
  {
    id: 3,
    workshop: 'siddhivinayak',
    part_no: "HUB-982-FR",
    description: "Front Hub Precision Spindle",
    grade: "EN19",
    hsn_code: "87082900",
    default_rate: 120.00,
    unit: "NOS"
  },
  {
    id: 4,
    workshop: 'siddhivinayak',
    part_no: "VL-ROD-32",
    description: "Connecting Valve Rod",
    grade: "SS304",
    hsn_code: "73269099",
    default_rate: 65.50,
    unit: "NOS"
  },
  {
    id: 5,
    workshop: 'gayatri',
    part_no: "MF4138",
    description: "GEAR",
    grade: "20MOCR4",
    hsn_code: "B1581",
    default_rate: 0.00,
    unit: "NOS"
  }
];

export const matchWorkshop = (itemWs, targetWs) => {
  const normItem = String(itemWs || 'siddhivinayak').trim().toLowerCase();
  const normTarget = String(targetWs || 'siddhivinayak').trim().toLowerCase();
  if (normTarget === 'gayatri' || normTarget.includes('gayatri') || normTarget === 'gi') {
    return normItem.includes('gayatri') || normItem === 'gi';
  }
  return !normItem.includes('gayatri') && normItem !== 'gi';
};

const GAYATRI_INITIAL_INWARDS = [
  {
    id: 101,
    workshop: 'gayatri',
    challan_no: 'MTF-3588/26-27',
    challan_date: '2026-11-20',
    party_id: 4,
    party_name: 'METALIC TECHNOFORGE LIMITED',
    party_gstin: '24AAKCM6128N1Z2',
    party_address: 'PLOT NO. 6, SURVEY NOS. 296, PADAVALA, TAL KOTADASANGANI - 360,024',
    party_phone: '9033332255',
    party_state_code: '24-Gujarat',
    vehicle_no: '00',
    eway_bill_no: '00',
    process_required: 'CNC TURNING',
    remarks: 'Received against customer jobwork order',
    total_quantity: 15,
    total_amount: 0,
    items: [
      {
        id: 201,
        inward_id: 101,
        part_id: 5,
        part_no: 'MF4138',
        part_description: 'GEAR',
        grade: '20MOCR4',
        heat_no: '81581',
        quantity: 15,
        rate: 0,
        amount: 0,
        unit: 'NOS',
        default_hsn: 'B1581'
      }
    ]
  }
];

const GAYATRI_INITIAL_OUTWARDS = [
  {
    id: 101,
    workshop: 'gayatri',
    challan_no: 'J-1',
    challan_date: '2026-11-20',
    party_id: 4,
    party_name: 'METALIC TECHNOFORGE LIMITED',
    party_gstin: '24AAKCM6128N1Z2',
    party_address: 'PLOT NO. 6, SURVEY NOS. 296, PADAVALA, TAL KOTADASANGANI - 360,024',
    party_phone: '9033332255',
    party_state_code: '24-Gujarat',
    vehicle_no: '00',
    eway_bill_no: '00',
    process_carried_out: 'CNC TURNING',
    remarks: 'Jobwork Dispatch Issue',
    total_quantity: 15,
    total_waste: 0,
    total_machine_rejection: 0,
    total_forging_rejection: 0,
    total_amount: 0,
    items: [
      {
        id: 1,
        outward_id: 101,
        part_id: 5,
        inward_item_id: 201,
        inward_challan_no: 'MTF-3588/26-27',
        part_no: 'MF4138',
        part_description: 'GEAR',
        default_grade: '20MOCR4',
        hsn_code: 'B1581',
        heat_no: '81581',
        quantity: 15,
        machine_rejection: 0,
        forging_rejection: 0,
        waste_quantity: 0,
        rate: 0,
        amount: 0,
        unit: 'NOS'
      }
    ]
  }
];

const INITIAL_INWARDS = [];

const INITIAL_OUTWARDS = [];

export const WORKSHOPS = [
  { 
    id: 'siddhivinayak', 
    name: 'Shree Siddhivinayak Industries', 
    tradeName: 'SHREE SIDDHIVINAYAK INDUSTRIES',
    shortName: 'Siddhivinayak', 
    code: 'SV',
    gstin: '24BQCPA3833J1Z7',
    address: '0, R.S. No. 721/2, Plot No. 8, Ta - Kotdasangani, Padavala Road, Near Caption Tractor, Veraval (Shapar) Rajkot - 360026'
  },
  { 
    id: 'gayatri', 
    name: 'Gayatri Auto Industries', 
    tradeName: 'GAYATRI AUTO INDUSTRIES',
    shortName: 'Gayatri', 
    code: 'GI',
    gstin: '24EIQPA0935J1Z9',
    address: 'Plot No. 8, R.S. No. 721/2, Near Caption Tractor, Padavala Road, Captain Agri Machinery EXIM LLP, Ta- Kotda Sangani, Veraval Rajkot'
  }
];

let currentWorkshop = localStorage.getItem('sv_current_workshop') || 'siddhivinayak';

export const getNextOutwardChallanNo = (existingChallans = [], workshop = null) => {
  const ws = workshop || currentWorkshop;
  let maxNum = 0;
  if (Array.isArray(existingChallans)) {
    for (const ch of existingChallans) {
      if (!ch || !ch.challan_no) continue;
      if (!matchWorkshop(ch.workshop, ws)) continue;
      const match = String(ch.challan_no).trim().match(/^J[-]?\s*(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }
  return `J-${maxNum + 1}`;
};

class LocalDataStore {
  constructor() {
    this.currentWorkshop = currentWorkshop;
    this.load();
  }

  load() {
    try {
      if (!localStorage.getItem('sv_cleared_entries_v1')) {
        localStorage.removeItem('sv_inwards');
        localStorage.removeItem('sv_outwards');
        localStorage.setItem('sv_cleared_entries_v1', 'true');
      }
      this.parties = JSON.parse(localStorage.getItem('sv_parties')) || INITIAL_PARTIES;
      if (!this.parties.some(p => String(p.name).toUpperCase().includes('METALIC'))) {
        const mtf = INITIAL_PARTIES.find(p => p.id === 4);
        if (mtf) this.parties.push(mtf);
      }

      this.parts = JSON.parse(localStorage.getItem('sv_parts')) || INITIAL_PARTS;
      if (!this.parts.some(p => String(p.part_no).toUpperCase() === 'MF4138')) {
        const mf = INITIAL_PARTS.find(p => p.part_no === 'MF4138');
        if (mf) this.parts.push(mf);
      }

      this.inwards = JSON.parse(localStorage.getItem('sv_inwards')) || [];
      this.outwards = JSON.parse(localStorage.getItem('sv_outwards')) || [];

      // Auto-heal parties and parts workshops
      this.parties.forEach(p => {
        const pName = String(p.name || '').toUpperCase();
        if (pName.includes('METALIC') || pName.includes('TECHNOFORGE')) {
          p.workshop = 'gayatri';
        } else if (!p.workshop) {
          p.workshop = 'siddhivinayak';
        }
        if (p.phone === '9825000000 / 9979000000') {
          p.phone = '9033332255';
        }
      });

      this.parts.forEach(pt => {
        const ptNo = String(pt.part_no || '').toUpperCase();
        if (ptNo.includes('MF4138') || ptNo.includes('MF4137')) {
          pt.workshop = 'gayatri';
        } else if (!pt.workshop) {
          pt.workshop = 'siddhivinayak';
        }
      });

      // Auto-heal workshops: If party_name is METALIC TECHNOFORGE or challan has MTF-, it belongs to Gayatri!
      this.inwards.forEach(inv => {
        const pName = String(inv.party_name || '').toUpperCase();
        const chNo = String(inv.challan_no || '').toUpperCase();
        const ws = String(inv.workshop || '').toLowerCase();
        if (ws.includes('gayatri') || ws === 'gi' || pName.includes('METALIC') || chNo.includes('MTF')) {
          inv.workshop = 'gayatri';
        } else if (!inv.workshop) {
          inv.workshop = 'siddhivinayak';
        }
        if (inv.process_required === 'BROACHING / CNC TURNING') {
          inv.process_required = 'CNC TURNING';
        }
        if (inv.party_phone === '9825000000 / 9979000000') {
          inv.party_phone = '9033332255';
        }
      });

      this.outwards.forEach(out => {
        const pName = String(out.party_name || '').toUpperCase();
        const chNo = String(out.challan_no || '').toUpperCase();
        const ws = String(out.workshop || '').toLowerCase();
        if (ws.includes('gayatri') || ws === 'gi' || pName.includes('METALIC') || chNo.includes('MTF')) {
          out.workshop = 'gayatri';
        } else if (!out.workshop) {
          out.workshop = 'siddhivinayak';
        }
        if (out.process_carried_out === 'BROACHING / CNC TURNING COMPLETED' || out.process_carried_out === 'BROACHING / CNC TURNING') {
          out.process_carried_out = 'CNC TURNING';
        }
        if (out.party_phone === '9825000000 / 9979000000') {
          out.party_phone = '9033332255';
        }
      });

      // Auto-repair: Ensure all inward items have unique IDs across all inwards, and attach part_nos
      let maxItemId = 0;
      const seenItemIds = new Set();
      this.inwards.forEach(inv => {
        if (Array.isArray(inv.items)) {
          inv.items.forEach(it => {
            if (!it.part_no && it.part_id) {
              const pt = this.parts.find(p => Number(p.id) === Number(it.part_id));
              if (pt) it.part_no = pt.part_no;
            }
            if (!it.id || seenItemIds.has(it.id)) {
              maxItemId++;
              it.id = maxItemId;
            } else {
              seenItemIds.add(it.id);
              if (Number(it.id) > maxItemId) maxItemId = Number(it.id);
            }
          });
          inv.part_nos = Array.from(new Set(inv.items.map(it => it.part_no).filter(Boolean))).join(', ');
        }
      });

      this.outwards.forEach(out => {
        if (Array.isArray(out.items)) {
          out.items.forEach(it => {
            if (!it.part_no && it.part_id) {
              const pt = this.parts.find(p => Number(p.id) === Number(it.part_id));
              if (pt) it.part_no = pt.part_no;
            }
          });
          out.part_nos = Array.from(new Set(out.items.map(it => it.part_no).filter(Boolean))).join(', ');
        }
      });

      // If Gayatri has no records yet, seed the initial Gayatri records
      const hasGayatriInward = this.inwards.some(i => matchWorkshop(i.workshop, 'gayatri'));
      if (!hasGayatriInward) {
        this.inwards.push(...GAYATRI_INITIAL_INWARDS);
      }

      const hasGayatriOutward = this.outwards.some(o => matchWorkshop(o.workshop, 'gayatri'));
      if (!hasGayatriOutward) {
        this.outwards.push(...GAYATRI_INITIAL_OUTWARDS);
      }

      this.save();
    } catch (e) {
      console.error("LocalDataStore load error:", e);
    }
  }

  setCurrentWorkshop(ws) {
    this.currentWorkshop = ws;
  }

  clearAllEntries() {
    this.inwards = [];
    this.outwards = [];
    this.save();
  }

  save() {
    localStorage.setItem('sv_parties', JSON.stringify(this.parties));
    localStorage.setItem('sv_parts', JSON.stringify(this.parts));
    localStorage.setItem('sv_inwards', JSON.stringify(this.inwards));
    localStorage.setItem('sv_outwards', JSON.stringify(this.outwards));
  }

  getParties(workshop = this.currentWorkshop) {
    this.load();
    return this.parties.filter(p => matchWorkshop(p.workshop, workshop));
  }

  getParts(workshop = this.currentWorkshop) {
    this.load();
    return this.parts.filter(p => matchWorkshop(p.workshop, workshop));
  }

  getDashboard(workshop = this.currentWorkshop) {
    this.load();
    const wsParties = this.getParties(workshop);
    const wsParts = this.getParts(workshop);
    const wsInwards = this.inwards.filter(i => matchWorkshop(i.workshop, workshop));
    const wsOutwards = this.outwards.filter(o => matchWorkshop(o.workshop, workshop));

    let totalInwardQty = 0;
    let totalInwardVal = 0;
    wsInwards.forEach(inv => {
      inv.items.forEach(it => {
        totalInwardQty += Number(it.quantity || 0);
        totalInwardVal += Number(it.amount || 0);
      });
    });

    let totalOutwardQty = 0;
    let totalWasteQty = 0;
    let totalOutwardVal = 0;
    wsOutwards.forEach(out => {
      out.items.forEach(it => {
        totalOutwardQty += Number(it.quantity || 0);
        totalWasteQty += Number(it.waste_quantity || 0);
        totalOutwardVal += Number(it.amount || 0);
      });
    });

    const currentFloorStock = totalInwardQty - (totalOutwardQty + totalWasteQty);
    const partWise = this.getStockPartWise(workshop);

    return {
      kpis: {
        parties_count: wsParties.length,
        parts_count: wsParts.length,
        inward_challans_count: wsInwards.length,
        outward_challans_count: wsOutwards.length,
        total_inward_qty: totalInwardQty,
        total_outward_qty: totalOutwardQty,
        total_waste_qty: totalWasteQty,
        current_floor_stock: currentFloorStock,
        total_inward_value: totalInwardVal,
        total_outward_value: totalOutwardVal
      },
      recent_inwards: wsInwards.slice(-5).reverse(),
      recent_outwards: wsOutwards.slice(-5).reverse(),
      top_parts_stock: partWise.slice(0, 6)
    };
  }

  getStockPartWise(workshop = this.currentWorkshop) {
    this.load();
    const wsInwards = this.inwards.filter(i => matchWorkshop(i.workshop, workshop));
    const wsOutwards = this.outwards.filter(o => matchWorkshop(o.workshop, workshop));
    const wsParts = this.getParts(workshop);

    return wsParts.map(part => {
      let inQty = 0;
      const partySet = new Set();
      wsInwards.forEach(inv => {
        inv.items.forEach(it => {
          if (Number(it.part_id) === Number(part.id)) {
            inQty += Number(it.quantity || 0);
            partySet.add(inv.party_id);
          }
        });
      });

      let outQty = 0;
      let wasteQty = 0;
      let machineRejQty = 0;
      let forgingRejQty = 0;
      wsOutwards.forEach(out => {
        out.items.forEach(it => {
          if (Number(it.part_id) === Number(part.id)) {
            outQty += Number(it.quantity || 0);
            wasteQty += Number(it.waste_quantity || 0);
            machineRejQty += Number(it.machine_rejection || 0);
            forgingRejQty += Number(it.forging_rejection || 0);
          }
        });
      });

      const current = inQty - (outQty + wasteQty);

      return {
        part_id: part.id,
        part_no: part.part_no,
        description: part.description,
        grade: part.grade,
        hsn_code: part.hsn_code,
        unit: part.unit,
        default_rate: part.default_rate,
        total_inward: inQty,
        total_outward: outQty,
        total_waste: wasteQty,
        total_machine_rejection: machineRejQty,
        total_forging_rejection: forgingRejQty,
        current_stock: current,
        parties_count: partySet.size
      };
    });
  }

  getStockPartyWise(workshop = this.currentWorkshop) {
    this.load();
    const wsInwards = this.inwards.filter(i => matchWorkshop(i.workshop, workshop));
    const wsOutwards = this.outwards.filter(o => matchWorkshop(o.workshop, workshop));
    const wsParties = this.getParties(workshop);

    return wsParties.map(party => {
      const partMap = {};

      wsInwards.filter(inv => Number(inv.party_id) === Number(party.id)).forEach(inv => {
        inv.items.forEach(it => {
          const ptId = Number(it.part_id);
          if (!partMap[ptId]) {
            const p = this.parts.find(x => Number(x.id) === ptId) || {};
            partMap[ptId] = {
              part_id: ptId,
              part_no: it.part_no || p.part_no,
              description: it.part_description || p.description,
              grade: it.grade || p.grade,
              unit: it.unit || p.unit || 'NOS',
              inward_qty: 0,
              outward_qty: 0,
              waste_qty: 0,
              machine_rej_qty: 0,
              forging_rej_qty: 0,
              current_stock: 0
            };
          }
          partMap[ptId].inward_qty += Number(it.quantity || 0);
        });
      });

      wsOutwards.filter(out => Number(out.party_id) === Number(party.id)).forEach(out => {
        out.items.forEach(it => {
          const ptId = Number(it.part_id);
          if (!partMap[ptId]) {
            const p = this.parts.find(x => Number(x.id) === ptId) || {};
            partMap[ptId] = {
              part_id: ptId,
              part_no: it.part_no || p.part_no,
              description: it.part_description || p.description,
              grade: it.default_grade || p.grade,
              unit: it.unit || p.unit || 'NOS',
              inward_qty: 0,
              outward_qty: 0,
              waste_qty: 0,
              machine_rej_qty: 0,
              forging_rej_qty: 0,
              current_stock: 0
            };
          }
          partMap[ptId].outward_qty += Number(it.quantity || 0);
          partMap[ptId].waste_qty += Number(it.waste_quantity || 0);
          partMap[ptId].machine_rej_qty += Number(it.machine_rejection || 0);
          partMap[ptId].forging_rej_qty += Number(it.forging_rejection || 0);
        });
      });

      const partsList = Object.values(partMap).map(p => ({
        ...p,
        current_stock: p.inward_qty - (p.outward_qty + p.waste_qty)
      }));

      const totalStock = partsList.reduce((acc, curr) => acc + curr.current_stock, 0);

      return {
        ...party,
        parts: partsList,
        total_parts_count: partsList.length,
        total_stock_qty: totalStock
      };
    });
  }

  getMatrix(partyId, partId, workshop = this.currentWorkshop) {
    this.load();
    const list = [];
    const partyWise = this.getStockPartyWise(workshop);
    partyWise.forEach(party => {
      if (partyId && Number(party.id) !== Number(partyId)) return;
      party.parts.forEach(part => {
        if (partId && Number(part.part_id) !== Number(partId)) return;
        list.push({
          party_id: party.id,
          party_name: party.name,
          part_id: part.part_id,
          part_no: part.part_no,
          part_description: part.description,
          grade: part.grade,
          unit: part.unit,
          total_inward: part.inward_qty,
          total_outward: part.outward_qty,
          total_waste: part.waste_qty,
          total_machine_rejection: part.machine_rej_qty || 0,
          total_forging_rejection: part.forging_rej_qty || 0,
          current_stock: part.current_stock
        });
      });
    });
    return list;
  }

  getLedger(partyId, partId, workshop = this.currentWorkshop) {
    this.load();
    const txs = [];
    const wsInwards = this.inwards.filter(i => matchWorkshop(i.workshop, workshop));
    const wsOutwards = this.outwards.filter(o => matchWorkshop(o.workshop, workshop));

    wsInwards.forEach(inv => {
      if (partyId && Number(inv.party_id) !== Number(partyId)) return;
      inv.items.forEach(it => {
        if (partId && Number(it.part_id) !== Number(partId)) return;
        txs.push({
          doc_type: 'INWARD',
          doc_id: inv.id,
          challan_no: inv.challan_no,
          challan_date: inv.challan_date,
          party_id: inv.party_id,
          party_name: inv.party_name,
          part_id: it.part_id,
          part_no: it.part_no,
          part_description: it.part_description,
          grade: it.grade,
          heat_no: it.heat_no,
          qty_in: Number(it.quantity),
          qty_out: 0,
          qty_waste: 0,
          qty_machine_rej: 0,
          qty_forging_rej: 0,
          vehicle_no: inv.vehicle_no,
          process_name: inv.process_required
        });
      });
    });

    wsOutwards.forEach(out => {
      if (partyId && Number(out.party_id) !== Number(partyId)) return;
      out.items.forEach(it => {
        if (partId && Number(it.part_id) !== Number(partId)) return;
        txs.push({
          doc_type: 'OUTWARD',
          doc_id: out.id,
          challan_no: out.challan_no,
          challan_date: out.challan_date,
          party_id: out.party_id,
          party_name: out.party_name,
          part_id: it.part_id,
          part_no: it.part_no,
          part_description: it.part_description,
          grade: it.default_grade,
          heat_no: it.heat_no,
          qty_in: 0,
          qty_out: Number(it.quantity),
          qty_waste: Number(it.waste_quantity || 0),
          qty_machine_rej: Number(it.machine_rejection || 0),
          qty_forging_rej: Number(it.forging_rejection || 0),
          vehicle_no: out.vehicle_no,
          process_name: out.process_carried_out
        });
      });
    });

    txs.sort((a, b) => (a.challan_date > b.challan_date ? 1 : -1));

    let balance = 0;
    txs.forEach(t => {
      balance += (t.qty_in - (t.qty_out + t.qty_waste));
      t.running_balance = balance;
    });

    return {
      current_balance: balance,
      data: txs
    };
  }

  getPartyParts(partyId, workshop = this.currentWorkshop) {
    this.load();
    if (!partyId) return [];
    const pId = Number(partyId);
    const partyWise = this.getStockPartyWise(workshop);
    const party = partyWise.find(p => Number(p.id) === pId);
    if (!party || !party.parts) return [];
    return party.parts.map(pt => ({
      part_id: pt.part_id,
      part_no: pt.part_no,
      description: pt.description,
      grade: pt.grade,
      unit: pt.unit,
      available_stock: pt.current_stock
    }));
  }

  getInwardLots(partyId, partId, excludeOutwardId = null, workshop = this.currentWorkshop, onlyAvailable = false) {
    this.load();
    if (!partyId || !partId) return [];
    const pId = Number(partyId);
    const ptId = Number(partId);
    const exclOutId = excludeOutwardId ? Number(excludeOutwardId) : null;
    const ws = workshop || this.currentWorkshop;
    const lots = [];

    const wsInwards = this.inwards.filter(i => matchWorkshop(i.workshop, ws));
    const wsOutwards = this.outwards.filter(o => matchWorkshop(o.workshop, ws));

    wsInwards
      .filter(inv => Number(inv.party_id) === pId)
      .forEach(inv => {
        inv.items
          .filter(it => Number(it.part_id) === ptId)
          .forEach(it => {
            let dispatched = 0;
            let waste = 0;
            let mRejTotal = 0;
            let fRejTotal = 0;
            wsOutwards.forEach(out => {
              if (exclOutId && Number(out.id) === exclOutId) return;
              out.items.forEach(ot => {
                if (
                  (ot.inward_item_id && Number(ot.inward_item_id) === Number(it.id)) ||
                  (!ot.inward_item_id && ot.inward_challan_no === inv.challan_no && Number(ot.part_id) === ptId) ||
                  (!ot.inward_item_id && !ot.inward_challan_no && Number(out.party_id) === pId && Number(ot.part_id) === ptId && ot.heat_no === it.heat_no)
                ) {
                  const q = Number(ot.quantity || 0);
                  const mr = Number(ot.machine_rejection || 0);
                  const fr = Number(ot.forging_rejection || 0);
                  const w = Number(ot.waste_quantity !== undefined && ot.waste_quantity !== '' ? ot.waste_quantity : (mr + fr));
                  dispatched += q;
                  waste += w;
                  mRejTotal += mr;
                  fRejTotal += fr;
                }
              });
            });

            const original = Number(it.quantity || 0);
            const available = Math.max(0, original - (dispatched + waste));

            lots.push({
              lot_key: `${inv.id}_${it.id}`,
              inward_item_id: it.id,
              inward_challan_id: inv.id,
              inward_challan_no: inv.challan_no,
              challan_date: inv.challan_date,
              part_id: it.part_id,
              part_no: it.part_no,
              description: it.part_description,
              grade: it.grade,
              heat_no: it.heat_no,
              rate: Number(it.rate || 0),
              original_quantity: original,
              dispatched_quantity: dispatched,
              waste_quantity: waste,
              machine_rejection: mRejTotal,
              forging_rejection: fRejTotal,
              available_stock: available,
              unit: it.unit || 'NOS',
              workshop: inv.workshop || 'siddhivinayak'
            });
          });
      });

    if (onlyAvailable) {
      return lots.filter(l => Number(l.available_stock) > 0);
    }
    return lots;
  }

  createInward(data) {
    this.load();
    const ws = data.workshop || this.currentWorkshop || 'siddhivinayak';
    const party = this.parties.find(p => Number(p.id) === Number(data.party_id)) || {};
    const newId = (this.inwards.length ? Math.max(...this.inwards.map(x => x.id)) : 0) + 1;
    let totQty = 0;
    let totAmt = 0;

    let maxItemId = 0;
    this.inwards.forEach(inv => {
      if (Array.isArray(inv.items)) {
        inv.items.forEach(x => {
          if (x.id && Number(x.id) > maxItemId) maxItemId = Number(x.id);
        });
      }
    });

    const items = data.items.map((it) => {
      const part = this.parts.find(p => Number(p.id) === Number(it.part_id)) || {};
      const q = Number(it.quantity || 0);
      const r = Number(it.rate || part.default_rate || 0);
      const a = Number(it.amount || (q * r));
      totQty += q;
      totAmt += a;
      maxItemId++;
      return {
        id: maxItemId,
        inward_id: newId,
        part_id: Number(it.part_id),
        part_no: part.part_no || it.part_no,
        part_description: part.description || it.part_description,
        grade: it.grade || part.grade,
        heat_no: it.heat_no || '',
        quantity: q,
        rate: r,
        amount: a,
        unit: part.unit || 'NOS',
        default_hsn: part.hsn_code || '73261910'
      };
    });

    const record = {
      id: newId,
      workshop: ws,
      challan_no: data.challan_no,
      challan_date: data.challan_date,
      party_id: Number(data.party_id),
      party_name: party.name,
      party_gstin: party.gstin,
      party_address: party.address,
      party_phone: party.phone,
      party_state_code: party.state_code || '24-Gujarat',
      vehicle_no: data.vehicle_no || '',
      eway_bill_no: data.eway_bill_no || '',
      process_required: data.process_required || 'CNC TURNING',
      remarks: data.remarks || '',
      total_quantity: totQty,
      total_amount: totAmt,
      part_nos: Array.from(new Set(items.map(it => it.part_no).filter(Boolean))).join(', '),
      items
    };

    this.inwards.push(record);
    this.save();
    return record;
  }

  createOutward(data) {
    this.load();
    const ws = data.workshop || this.currentWorkshop || 'siddhivinayak';
    const party = this.parties.find(p => Number(p.id) === Number(data.party_id)) || {};
    const newId = (this.outwards.length ? Math.max(...this.outwards.map(x => x.id)) : 0) + 1;
    let totQty = 0;
    let totWaste = 0;
    let totMachineRej = 0;
    let totForgingRej = 0;
    let totAmt = 0;

    const items = data.items.map((it, idx) => {
      const part = this.parts.find(p => Number(p.id) === Number(it.part_id)) || {};
      const q = Number(it.quantity || 0);
      const mr = Number(it.machine_rejection || 0);
      const fr = Number(it.forging_rejection || 0);
      const w = Number(it.waste_quantity !== undefined && it.waste_quantity !== '' ? it.waste_quantity : (mr + fr));
      const r = Number(it.rate || part.default_rate || 0);
      const a = Number(it.amount || (q * r));
      totQty += q;
      totWaste += w;
      totMachineRej += mr;
      totForgingRej += fr;
      totAmt += a;
      return {
        id: idx + 1,
        outward_id: newId,
        part_id: Number(it.part_id),
        inward_item_id: it.inward_item_id ? Number(it.inward_item_id) : null,
        inward_challan_no: it.inward_challan_no || null,
        part_no: part.part_no || it.part_no,
        part_description: part.description || it.part_description,
        default_grade: it.grade || part.grade,
        hsn_code: part.hsn_code || '73261910',
        heat_no: it.heat_no || '',
        quantity: q,
        machine_rejection: mr,
        forging_rejection: fr,
        waste_quantity: w,
        rate: r,
        amount: a,
        unit: part.unit || 'NOS'
      };
    });

    const record = {
      id: newId,
      workshop: ws,
      challan_no: (data.challan_no && data.challan_no.trim()) || getNextOutwardChallanNo(this.outwards, ws),
      challan_date: data.challan_date,
      party_id: Number(data.party_id),
      party_name: party.name,
      party_gstin: party.gstin,
      party_address: party.address,
      party_phone: party.phone,
      party_state_code: party.state_code || '24-Gujarat',
      vehicle_no: data.vehicle_no || '',
      eway_bill_no: data.eway_bill_no || '',
      process_carried_out: (!data.process_carried_out || data.process_carried_out === 'BROACHING / CNC TURNING COMPLETED') ? 'CNC TURNING' : data.process_carried_out,
      remarks: data.remarks || '',
      total_quantity: totQty,
      total_waste: totWaste,
      total_machine_rejection: totMachineRej,
      total_forging_rejection: totForgingRej,
      total_amount: totAmt,
      items
    };

    this.outwards.push(record);
    this.save();
    return record;
  }

  updateInward(data) {
    const idx = this.inwards.findIndex(i => Number(i.id) === Number(data.id));
    if (idx === -1) {
      throw new Error("Inward challan not found");
    }
    const oldChallan = this.inwards[idx];
    const ws = data.workshop || oldChallan.workshop || this.currentWorkshop || 'siddhivinayak';
    const oldChallanNo = oldChallan.challan_no;
    const party = this.parties.find(p => Number(p.id) === Number(data.party_id)) || {};

    let maxItemId = 0;
    this.inwards.forEach(inv => {
      if (Array.isArray(inv.items)) {
        inv.items.forEach(x => {
          if (x.id && Number(x.id) > maxItemId) maxItemId = Number(x.id);
        });
      }
    });

    let totQty = 0;
    let totAmt = 0;

    const items = data.items.map((it) => {
      const part = this.parts.find(p => Number(p.id) === Number(it.part_id)) || {};
      const q = Number(it.quantity || 0);
      const r = Number(it.rate || part.default_rate || 0);
      const a = Number(it.amount || (q * r));
      totQty += q;
      totAmt += a;
      let itemId = it.id ? Number(it.id) : null;
      if (!itemId) {
        maxItemId++;
        itemId = maxItemId;
      }
      return {
        id: itemId,
        inward_id: oldChallan.id,
        part_id: Number(it.part_id),
        part_no: part.part_no || it.part_no,
        part_description: part.description || it.part_description,
        grade: it.grade || part.grade,
        heat_no: it.heat_no || '',
        quantity: q,
        rate: r,
        amount: a,
        unit: part.unit || 'NOS',
        default_hsn: part.hsn_code || '73261910'
      };
    });

    const updated = {
      ...oldChallan,
      workshop: ws,
      challan_no: data.challan_no,
      challan_date: data.challan_date,
      party_id: Number(data.party_id),
      party_name: party.name || oldChallan.party_name,
      party_gstin: party.gstin || oldChallan.party_gstin,
      party_address: party.address || oldChallan.party_address,
      party_phone: party.phone || oldChallan.party_phone,
      party_state_code: party.state_code || oldChallan.party_state_code || '24-Gujarat',
      vehicle_no: data.vehicle_no || '',
      eway_bill_no: data.eway_bill_no || '',
      process_required: data.process_required || 'CNC TURNING',
      remarks: data.remarks || '',
      total_quantity: totQty,
      total_amount: totAmt,
      part_nos: Array.from(new Set(items.map(it => it.part_no).filter(Boolean))).join(', '),
      items
    };

    this.inwards[idx] = updated;

    // If challan_no changed, update in outward challans referencing it
    if (oldChallanNo !== data.challan_no) {
      this.outwards.forEach(out => {
        out.items.forEach(ot => {
          if (ot.inward_challan_no === oldChallanNo) {
            ot.inward_challan_no = data.challan_no;
          }
        });
      });
    }

    this.save();
    return updated;
  }

  updateOutward(data) {
    const idx = this.outwards.findIndex(o => Number(o.id) === Number(data.id));
    if (idx === -1) {
      throw new Error("Outward challan not found");
    }
    const oldChallan = this.outwards[idx];
    const ws = data.workshop || oldChallan.workshop || this.currentWorkshop || 'siddhivinayak';
    const party = this.parties.find(p => Number(p.id) === Number(data.party_id)) || {};

    let totQty = 0;
    let totWaste = 0;
    let totMachineRej = 0;
    let totForgingRej = 0;
    let totAmt = 0;

    const items = data.items.map((it, itemIdx) => {
      const part = this.parts.find(p => Number(p.id) === Number(it.part_id)) || {};
      const q = Number(it.quantity || 0);
      const mr = Number(it.machine_rejection || 0);
      const fr = Number(it.forging_rejection || 0);
      const w = Number(it.waste_quantity !== undefined && it.waste_quantity !== '' ? it.waste_quantity : (mr + fr));
      const r = Number(it.rate || part.default_rate || 0);
      const a = Number(it.amount || (q * r));
      totQty += q;
      totWaste += w;
      totMachineRej += mr;
      totForgingRej += fr;
      totAmt += a;
      return {
        id: it.id || (itemIdx + 1),
        outward_id: oldChallan.id,
        part_id: Number(it.part_id),
        inward_item_id: it.inward_item_id ? Number(it.inward_item_id) : null,
        inward_challan_no: it.inward_challan_no || null,
        part_no: part.part_no || it.part_no,
        part_description: part.description || it.part_description,
        default_grade: it.grade || it.default_grade || part.grade,
        hsn_code: part.hsn_code || '73261910',
        heat_no: it.heat_no || '',
        quantity: q,
        machine_rejection: mr,
        forging_rejection: fr,
        waste_quantity: w,
        rate: r,
        amount: a,
        unit: part.unit || 'NOS'
      };
    });

    const updated = {
      ...oldChallan,
      workshop: ws,
      challan_no: data.challan_no,
      challan_date: data.challan_date,
      party_id: Number(data.party_id),
      party_name: party.name || oldChallan.party_name,
      party_gstin: party.gstin || oldChallan.party_gstin,
      party_address: party.address || oldChallan.party_address,
      party_phone: party.phone || oldChallan.party_phone,
      party_state_code: party.state_code || oldChallan.party_state_code || '24-Gujarat',
      vehicle_no: data.vehicle_no || '',
      eway_bill_no: data.eway_bill_no || '',
      process_carried_out: (!data.process_carried_out || data.process_carried_out === 'BROACHING / CNC TURNING COMPLETED') ? 'CNC TURNING' : data.process_carried_out,
      remarks: data.remarks || '',
      total_quantity: totQty,
      total_waste: totWaste,
      total_machine_rejection: totMachineRej,
      total_forging_rejection: totForgingRej,
      total_amount: totAmt,
      items
    };

    this.outwards[idx] = updated;
    this.save();
    return updated;
  }
}

const localStore = new LocalDataStore();
let isLiveBackend = true; // Attempts live backend first

async function fetchFromBackend(endpoint, options = {}) {
  const url = `${API_BASE}/${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    isLiveBackend = true;
    return { data, isLive: true };
  } catch (err) {
    // If backend is unreachable, fallback cleanly to local store
    // console.warn(`Backend call failed (${endpoint}), falling back to local store:`, err.message);
    isLiveBackend = false;
    return { error: err.message, isLive: false };
  }
}

export const api = {
  getBackendStatus: () => isLiveBackend,
  setLiveBackend: (val) => { isLiveBackend = val; },

  getCurrentWorkshop: () => currentWorkshop,
  setCurrentWorkshop: (ws) => {
    currentWorkshop = ws;
    try {
      localStorage.setItem('sv_current_workshop', ws);
    } catch (e) {
      // ignore
    }
    localStore.setCurrentWorkshop(ws);
  },

  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/../index.php?json=1`, { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        isLiveBackend = true;
        return { online: true, details: json };
      }
    } catch (e) {
      // offline
    }
    isLiveBackend = false;
    return { online: false, message: "Backend not detected on http://localhost:8000" };
  },

  async runSetup() {
    const res = await fetch(`${API_BASE}/setup.php`);
    return await res.json();
  },

  async getDashboard(workshop = null) {
    const ws = workshop || currentWorkshop;
    const res = await fetchFromBackend(`dashboard.php?workshop=${ws}`);
    if (res.data && res.data.status === 'success') {
      return { ...res.data.data, isLive: true };
    }
    return { ...localStore.getDashboard(ws), isLive: false };
  },

  async getParties(workshop = null) {
    const ws = workshop || currentWorkshop;
    const res = await fetchFromBackend(`parties.php?workshop=${ws}`);
    if (res.data && res.data.status === 'success') {
      return { data: res.data.data, isLive: true };
    }
    localStore.load();
    return { data: localStore.getParties(ws), isLive: false };
  },

  async createParty(party, workshop = null) {
    const ws = party.workshop || workshop || currentWorkshop;
    const payload = { ...party, workshop: ws };
    const res = await fetchFromBackend('parties.php', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.data && res.data.status === 'success') {
      return res.data;
    }
    localStore.load();
    const newId = (localStore.parties.length ? Math.max(...localStore.parties.map(p => p.id)) : 0) + 1;
    const item = { ...payload, id: newId, created_at: new Date().toISOString() };
    localStore.parties.push(item);
    localStore.save();
    return { status: 'success', data: item, isLive: false };
  },

  async updateParty(party) {
    const res = await fetchFromBackend('parties.php', {
      method: 'PUT',
      body: JSON.stringify(party)
    });
    if (res.data && res.data.status === 'success') {
      return res.data;
    }
    localStore.load();
    const idx = localStore.parties.findIndex(p => p.id === party.id);
    if (idx !== -1) {
      localStore.parties[idx] = { ...localStore.parties[idx], ...party };
      localStore.save();
    }
    return { status: 'success', isLive: false };
  },

  async deleteParty(id) {
    const res = await fetchFromBackend(`parties.php?id=${id}`, { method: 'DELETE' });
    if (res.data && res.data.status === 'success') {
      return res.data;
    }
    localStore.load();
    localStore.parties = localStore.parties.filter(p => p.id !== id);
    localStore.save();
    return { status: 'success', isLive: false };
  },

  async getParts(workshop = null) {
    const ws = workshop || currentWorkshop;
    const res = await fetchFromBackend(`parts.php?workshop=${ws}`);
    if (res.data && res.data.status === 'success') {
      return { data: res.data.data, isLive: true };
    }
    localStore.load();
    return { data: localStore.getStockPartWise(ws), isLive: false };
  },

  async createPart(part, workshop = null) {
    const ws = part.workshop || workshop || currentWorkshop;
    const payload = { ...part, workshop: ws };
    const res = await fetchFromBackend('parts.php', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.data && res.data.status === 'success') {
      return res.data;
    }
    localStore.load();
    const newId = (localStore.parts.length ? Math.max(...localStore.parts.map(p => p.id)) : 0) + 1;
    const item = { ...payload, id: newId, current_stock: 0, total_inward: 0, total_outward: 0 };
    localStore.parts.push(item);
    localStore.save();
    return { status: 'success', data: item, isLive: false };
  },

  async updatePart(part) {
    const res = await fetchFromBackend('parts.php', {
      method: 'PUT',
      body: JSON.stringify(part)
    });
    if (res.data && res.data.status === 'success') {
      return res.data;
    }
    localStore.load();
    const idx = localStore.parts.findIndex(p => p.id === part.id);
    if (idx !== -1) {
      localStore.parts[idx] = { ...localStore.parts[idx], ...part };
      localStore.save();
    }
    return { status: 'success', isLive: false };
  },

  async deletePart(id) {
    const res = await fetchFromBackend(`parts.php?id=${id}`, { method: 'DELETE' });
    if (res.data && res.data.status === 'success') {
      return res.data;
    }
    localStore.load();
    localStore.parts = localStore.parts.filter(p => p.id !== id);
    localStore.save();
    return { status: 'success', isLive: false };
  },

  async getInwards(workshop = null) {
    const ws = workshop || currentWorkshop;
    const res = await fetchFromBackend(`inward.php?workshop=${ws}`);
    if (res.data && res.data.status === 'success') {
      return { data: res.data.data, isLive: true };
    }
    localStore.load();
    return { data: localStore.inwards.filter(i => matchWorkshop(i.workshop, ws)), isLive: false };
  },

  async getInward(id) {
    const res = await fetchFromBackend(`inward.php?id=${id}`);
    if (res.data && res.data.status === 'success') {
      return { data: res.data.data, isLive: true };
    }
    localStore.load();
    const inv = localStore.inwards.find(i => Number(i.id) === Number(id));
    return { data: inv, isLive: false };
  },

  async createInward(data) {
    const ws = data.workshop || currentWorkshop;
    const payload = { ...data, workshop: ws };
    const res = await fetchFromBackend('inward.php', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.data && res.data.status === 'success') {
      return res.data;
    }
    const record = localStore.createInward(payload);
    return { status: 'success', data: record, isLive: false };
  },

  async updateInward(data) {
    const ws = data.workshop || currentWorkshop;
    const payload = { ...data, workshop: ws };
    const res = await fetchFromBackend('inward.php', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    if (res.data && res.data.status === 'success') {
      return res.data;
    }
    const record = localStore.updateInward(payload);
    return { status: 'success', data: record, isLive: false };
  },

  async deleteInward(id) {
    const res = await fetchFromBackend(`inward.php?id=${id}`, { method: 'DELETE' });
    if (res.data && res.data.status === 'success') {
      return res.data;
    }
    localStore.load();
    localStore.inwards = localStore.inwards.filter(i => i.id !== id);
    localStore.save();
    return { status: 'success', isLive: false };
  },

  async getOutwards(workshop = null) {
    const ws = workshop || currentWorkshop;
    const res = await fetchFromBackend(`outward.php?workshop=${ws}`);
    if (res.data && res.data.status === 'success') {
      return { data: res.data.data, isLive: true };
    }
    localStore.load();
    return { data: localStore.outwards.filter(o => matchWorkshop(o.workshop, ws)), isLive: false };
  },

  async getOutward(id) {
    const res = await fetchFromBackend(`outward.php?id=${id}`);
    if (res.data && res.data.status === 'success') {
      return { data: res.data.data, isLive: true };
    }
    const out = localStore.outwards.find(o => Number(o.id) === Number(id));
    return { data: out, isLive: false };
  },

  async createOutward(data) {
    const ws = data.workshop || currentWorkshop;
    const payload = { ...data, workshop: ws };
    const res = await fetchFromBackend('outward.php', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.data && res.data.status === 'success') {
      return res.data;
    }
    const record = localStore.createOutward(payload);
    return { status: 'success', data: record, isLive: false };
  },

  async updateOutward(data) {
    const ws = data.workshop || currentWorkshop;
    const payload = { ...data, workshop: ws };
    const res = await fetchFromBackend('outward.php', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    if (res.data && res.data.status === 'success') {
      return res.data;
    }
    const record = localStore.updateOutward(payload);
    return { status: 'success', data: record, isLive: false };
  },

  async deleteOutward(id) {
    const res = await fetchFromBackend(`outward.php?id=${id}`, { method: 'DELETE' });
    if (res.data && res.data.status === 'success') {
      return res.data;
    }
    localStore.outwards = localStore.outwards.filter(o => o.id !== id);
    localStore.save();
    return { status: 'success', isLive: false };
  },

  async getPartyParts(partyId, workshop = null) {
    const ws = workshop || currentWorkshop;
    const res = await fetchFromBackend(`inward.php?action=party_parts&party_id=${partyId}&workshop=${ws}`);
    if (res.data && res.data.status === 'success') {
      return { data: res.data.data, isLive: true };
    }
    return { data: localStore.getPartyParts(partyId, ws), isLive: false };
  },

  async getInwardLots(partyId, partId, excludeOutwardId = null, workshop = null, onlyAvailable = false) {
    const ws = workshop || currentWorkshop;
    const query = `inward.php?action=part_lots&party_id=${partyId}&part_id=${partId}&workshop=${ws}${excludeOutwardId ? '&exclude_outward_id=' + excludeOutwardId : ''}${onlyAvailable ? '&only_available=1' : ''}`;
    const res = await fetchFromBackend(query);
    if (res.data && res.data.status === 'success') {
      return { data: res.data.data, isLive: true };
    }
    return { data: localStore.getInwardLots(partyId, partId, excludeOutwardId, ws, onlyAvailable), isLive: false };
  },

  async getStock(type = 'part_wise', params = {}) {
    const ws = params.workshop || currentWorkshop;
    let query = `stock.php?type=${type}&workshop=${ws}`;
    if (params.party_id) query += `&party_id=${params.party_id}`;
    if (params.part_id) query += `&part_id=${params.part_id}`;

    const res = await fetchFromBackend(query);
    if (res.data && res.data.status === 'success') {
      return { data: res.data.data, current_balance: res.data.current_balance, isLive: true };
    }

    if (type === 'part_wise') {
      return { data: localStore.getStockPartWise(ws), isLive: false };
    } else if (type === 'party_wise') {
      return { data: localStore.getStockPartyWise(ws), isLive: false };
    } else if (type === 'matrix') {
      return { data: localStore.getMatrix(params.party_id, params.part_id, ws), isLive: false };
    } else if (type === 'ledger') {
      const resLedger = localStore.getLedger(params.party_id, params.part_id, ws);
      return { data: resLedger.data, current_balance: resLedger.current_balance, isLive: false };
    }
  }
};

