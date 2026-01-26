/* =========================
   QUAY SỐ MAY MẮN - app.js
   - UI: 10 ô slot (?), 3 nút, bảng kết quả, modal danh sách NV
   - Logic: không trúng lại, lưu localStorage
   ========================= */

const $ = (id) => document.getElementById(id);

// Buttons / UI
const btnSpin = $("btnSpin");
const btnClear = $("btnClear");
const btnList = $("btnList");

const winnerTbody = $("winnerTbody");

const slotsEl = $("slots");
const modalEmployees = $("modalEmployees");
const employeeInput = $("employeeInput");
const btnLoadSample = $("btnLoadSample");
const btnSaveEmployees = $("btnSaveEmployees");

// Storage keys
const LS_EMP = "qs_employees_v2";
const LS_WIN = "qs_winners_v2";
const LS_REMAIN = "qs_remaining_v2";

let employees = [];
let winners = [];
let remaining = [];
let spinning = false;

/* ========= Helpers ========= */
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openModal() {
  modalEmployees?.setAttribute("aria-hidden", "false");
}
function closeModal() {
  modalEmployees?.setAttribute("aria-hidden", "true");
}

document.addEventListener("click", (e) => {
  const key = e.target?.dataset?.close;
  if (key === "employees") closeModal();
});

// Parse input: mỗi dòng "Tên | Mã"
function parseEmployees(text) {
  const lines = String(text ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const out = [];
  for (const line of lines) {
    const parts = line.split("|").map((s) => s.trim());
    const name = parts[0] ?? "";
    const code = parts[1] ?? "";
    if (!name) continue;

    // nếu thiếu mã -> tự tạo (không khuyến nghị nhưng vẫn chạy)
    out.push({
      name,
      code: code || "NV" + String(out.length + 1).padStart(3, "0"),
    });
  }

  // lọc trùng theo code
  const seen = new Set();
  return out.filter((x) => {
    const k = x.code;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function saveAll() {
  localStorage.setItem(LS_EMP, JSON.stringify(employees));
  localStorage.setItem(LS_WIN, JSON.stringify(winners));
  localStorage.setItem(LS_REMAIN, JSON.stringify(remaining));
}

function loadAll() {
  employees = JSON.parse(localStorage.getItem(LS_EMP) || "[]");
  winners = JSON.parse(localStorage.getItem(LS_WIN) || "[]");
  remaining = JSON.parse(localStorage.getItem(LS_REMAIN) || "[]");

  // Nếu có employees mà remaining rỗng -> rebuild remaining = employees - winners
  if (employees.length && !remaining.length) {
    const winCodes = new Set(winners.map((w) => w.code));
    remaining = employees.filter((e) => !winCodes.has(e.code));
  }

  // Nếu chưa có dữ liệu -> nạp sample
  if (!employees.length) {
    employees = sampleEmployees();
    winners = [];
    remaining = [...employees];
  }

  // Fill textarea
  if (employeeInput) {
    employeeInput.value = employees.map((e) => `${e.name} | ${e.code}`).join("\n");
  }

  saveAll();
}

/* ========= UI Render ========= */
function renderWinners() {
  if (!winnerTbody) return;

  winnerTbody.innerHTML = "";
  if (!winners.length) {
    winnerTbody.innerHTML = `<tr class="emptyRow"><td colspan="3">Chưa có kết quả</td></tr>`;
    return;
  }

  winners.forEach((w, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${escapeHtml(w.name)}</td>
      <td>${escapeHtml(w.code)}</td>
    `;
    winnerTbody.appendChild(tr);
  });
}

/* ========= Slots ========= */
function getSlots() {
  if (!slotsEl) return [];
  return [...slotsEl.querySelectorAll(".slot")];
}

function resetSlots() {
  const slots = getSlots();
  slots.forEach((s) => (s.textContent = "?"));
}

function randomizeSlotsOnce() {
  const slots = getSlots();
  for (const s of slots) {
    s.textContent = String(Math.floor(Math.random() * 10));
  }
}

function showWinnerOnSlots(winner) {
  const slots = getSlots();
  // hiển thị 10 ký tự của mã NV; nếu mã < 10 thì đệm *
  const code = String(winner?.code ?? "");
  const chars = code.padEnd(10, "*").slice(0, 10).split("");
  slots.forEach((s, i) => (s.textContent = chars[i] ?? "?"));
}

/* ========= Spin Logic ========= */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function spin() {
  if (spinning) return;
  if (!remaining.length) {
    // Hết người để quay
    const slots = getSlots();
    const msg = ["H", "Ế", "T", " ", "L", "I", "S", "T", "!", "!"];
    slots.forEach((s, i) => (s.textContent = msg[i] || "!"));
    return;
  }

  spinning = true;
  btnSpin && (btnSpin.disabled = true);
  btnClear && (btnClear.disabled = true);
  btnList && (btnList.disabled = true);

  // Hiệu ứng slot random trong ~2.4s
  const duration = 2400;
  const tick = 70;
  const start = performance.now();

  while (performance.now() - start < duration) {
    randomizeSlotsOnce();
    await sleep(tick);
  }

  // Chốt winner (không trùng)
  const idx = Math.floor(Math.random() * remaining.length);
  const winner = remaining.splice(idx, 1)[0];
  winners.push(winner);

  showWinnerOnSlots(winner);
  renderWinners();
  saveAll();

  spinning = false;
  btnSpin && (btnSpin.disabled = false);
  btnClear && (btnClear.disabled = false);
  btnList && (btnList.disabled = false);
}

/* ========= Events ========= */
btnSpin?.addEventListener("click", spin);

btnClear?.addEventListener("click", () => {
  // Clear chỉ reset ô slot về "?"
  if (spinning) return;
  resetSlots();
});

btnList?.addEventListener("click", () => {
  // mở modal + đổ danh sách hiện tại
  if (employeeInput) {
    employeeInput.value = employees.map((e) => `${e.name} | ${e.code}`).join("\n");
  }
  openModal();
});

btnLoadSample?.addEventListener("click", () => {
  const s = sampleEmployees();
  employeeInput.value = s.map((e) => `${e.name} | ${e.code}`).join("\n");
});

btnSaveEmployees?.addEventListener("click", () => {
  const parsed = parseEmployees(employeeInput.value);

  employees = parsed;
  winners = [];
  remaining = [...employees];

  saveAll();
  renderWinners();
  resetSlots();
  closeModal();
});

/* ========= Sample Employees (từ file bạn gửi) ========= */
function sampleEmployees() {
  return [
    { name: "Nguyễn Thị Thu Nga", code: "3000014762" },
    { name: "Nguyễn Thị Thanh Huyền", code: "3000029493" },
    { name: "Phạm Thị Thùy Linh", code: "3000030043" },
    { name: "Nguyễn Thị Lan", code: "2014004731" },
    { name: "Lê Minh Quân", code: "3000028101" },
    { name: "Dương Thị Định", code: "2012002614" },
    { name: "Nguyễn Minh Hằng", code: "3000025227" },
    { name: "Hoàng Thị Thu Hương", code: "3000029777" },
    { name: "Trần Ngọc Anh", code: "3000026152" },
    { name: "Đỗ Đình Hiếu", code: "3000006381" },
    { name: "Dương Duy Thành", code: "3000028102" },
    { name: "Nguyễn Thị Lan Hương", code: "3000031496" },
    { name: "Nguyễn Ngọc Sơn", code: "3000012486" },
    { name: "Nguyễn Thị Mai", code: "3000014605" },
    { name: "Nguyễn Trà My", code: "3000016223" },
    { name: "Trần Chí Kiên", code: "2012102684" },
    { name: "Hoàng Thị Hồng Nhung", code: "3000028083" },
    { name: "Nguyễn Thị Cúc", code: "3000031009" },
    { name: "Đặng Thị Nhung", code: "3000032038" },
    { name: "Nguyễn Thị Hồng", code: "3000031703" },
    { name: "Hoàng Tùng Lâm", code: "3000031008" },
    { name: "Đỗ Thị Dung Quỳnh", code: "3000031710" },
    { name: "Phạm Ngọc Hiền Linh", code: "3000014308" },
    { name: "Lê Hồng Nhung", code: "3000023364" },
    { name: "Nguyễn Mai Phương", code: "3000029219" },
    { name: "Trần Minh Phương", code: "3000025815" },
    { name: "Bùi Thị Nguyệt", code: "3000032443" },
    { name: "Bùi Hải Yến", code: "3000032810" },
    { name: "Lê Tuấn Anh", code: "3000032036" },
    { name: "Châu Thị Sương", code: "3000026258" },
    { name: "Đỗ Thị Thu Sương", code: "3000028369" },
    { name: "Trân Gia Bảo", code: "3000027042" },
  ];
}

/* ========= Init ========= */
loadAll();
renderWinners();
resetSlots();
