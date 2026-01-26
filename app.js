/* =========================
   QUAY SỐ MAY MẮN - app.js (FIX)
   - Đợi DOMContentLoaded
   - Bắt nút theo nhiều id fallback
   - Event delegation để chắc chắn click hoạt động
   - Lưu localStorage
   ========================= */

(() => {
  const LS_EMP = "qs_employees_v2";
  const LS_WIN = "qs_winners_v2";
  const LS_REMAIN = "qs_remaining_v2";

  let employees = [];
  let winners = [];
  let remaining = [];
  let spinning = false;

  const $ = (sel) => document.querySelector(sel);

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

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

  function saveAll() {
    localStorage.setItem(LS_EMP, JSON.stringify(employees));
    localStorage.setItem(LS_WIN, JSON.stringify(winners));
    localStorage.setItem(LS_REMAIN, JSON.stringify(remaining));
  }

  function loadAll() {
    employees = JSON.parse(localStorage.getItem(LS_EMP) || "[]");
    winners = JSON.parse(localStorage.getItem(LS_WIN) || "[]");
    remaining = JSON.parse(localStorage.getItem(LS_REMAIN) || "[]");

    if (employees.length && !remaining.length) {
      const winCodes = new Set(winners.map((w) => w.code));
      remaining = employees.filter((e) => !winCodes.has(e.code));
    }

    if (!employees.length) {
      employees = sampleEmployees();
      winners = [];
      remaining = [...employees];
      saveAll();
    }
  }

  function getSlots() {
    const slotsEl = document.getElementById("slots");
    if (!slotsEl) return [];
    return [...slotsEl.querySelectorAll(".slot")];
  }

  function resetSlots() {
    getSlots().forEach((s) => (s.textContent = "?"));
  }

  function randomizeSlotsOnce() {
    const slots = getSlots();
    for (const s of slots) s.textContent = String(Math.floor(Math.random() * 10));
  }

  function showWinnerOnSlots(w) {
    const slots = getSlots();
    const code = String(w?.code ?? "");
    const chars = code.padEnd(10, "*").slice(0, 10).split("");
    slots.forEach((s, i) => (s.textContent = chars[i] ?? "?"));
  }

  function renderWinners() {
    const tbody = document.getElementById("winnerTbody");
    if (!tbody) return;

    tbody.innerHTML = "";
    if (!winners.length) {
      tbody.innerHTML = `<tr class="emptyRow"><td colspan="3">Chưa có kết quả</td></tr>`;
      return;
    }
    winners.forEach((w, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${escapeHtml(w.name)}</td>
        <td>${escapeHtml(w.code)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

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
      out.push({ name, code: code || "NV" + String(out.length + 1).padStart(3, "0") });
    }

    const seen = new Set();
    return out.filter((x) => {
      if (seen.has(x.code)) return false;
      seen.add(x.code);
      return true;
    });
  }

  function openEmployeesModal() {
    const modal = document.getElementById("modalEmployees");
    const ta = document.getElementById("employeeInput");
    if (ta) ta.value = employees.map((e) => `${e.name} | ${e.code}`).join("\n");
    modal?.setAttribute("aria-hidden", "false");
  }

  function closeEmployeesModal() {
    document.getElementById("modalEmployees")?.setAttribute("aria-hidden", "true");
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function spin() {
    if (spinning) return;

    if (!remaining.length) {
      const msg = ["H", "Ế", "T", " ", "L", "I", "S", "T", "!", "!"];
      getSlots().forEach((s, i) => (s.textContent = msg[i] || "!"));
      return;
    }

    spinning = true;
    disableButtons(true);

    const duration = 2400;
    const tick = 70;
    const start = performance.now();

    while (performance.now() - start < duration) {
      randomizeSlotsOnce();
      await sleep(tick);
    }

    const idx = Math.floor(Math.random() * remaining.length);
    const winner = remaining.splice(idx, 1)[0];
    winners.push(winner);

    showWinnerOnSlots(winner);
    renderWinners();
    saveAll();

    disableButtons(false);
    spinning = false;
  }

  function disableButtons(disabled) {
    // fallback: nếu bạn đổi id thì vẫn bắt được nhờ query
    const btns = [
      document.getElementById("btnSpin") || document.getElementById("spin"),
      document.getElementById("btnClear") || document.getElementById("clear"),
      document.getElementById("btnList") || document.getElementById("list"),
    ].filter(Boolean);
    btns.forEach((b) => (b.disabled = disabled));
  }

  function clearSlots() {
    if (spinning) return;
    resetSlots();
  }

  function saveEmployeesFromTextarea() {
    const ta = document.getElementById("employeeInput");
    const parsed = parseEmployees(ta?.value || "");
    employees = parsed;
    winners = [];
    remaining = [...employees];
    saveAll();
    renderWinners();
    resetSlots();
    closeEmployeesModal();
  }

  function loadSampleToTextarea() {
    const ta = document.getElementById("employeeInput");
    const s = sampleEmployees();
    if (ta) ta.value = s.map((e) => `${e.name} | ${e.code}`).join("\n");
  }

  // Event delegation: click ở đâu cũng bắt được
  function setupClicks() {
    document.addEventListener("click", (e) => {
      const t = e.target;

      // Nút quay
      if (t?.id === "btnSpin" || t?.id === "spin") {
        e.preventDefault();
        spin();
        return;
      }

      // Nút clear
      if (t?.id === "btnClear" || t?.id === "clear") {
        e.preventDefault();
        clearSlots();
        return;
      }

      // Nút danh sách
      if (t?.id === "btnList" || t?.id === "list") {
        e.preventDefault();
        openEmployeesModal();
        return;
      }

      // Modal close
      if (t?.dataset?.close === "employees") {
        e.preventDefault();
        closeEmployeesModal();
        return;
      }

      // Nạp mẫu / lưu danh sách
      if (t?.id === "btnLoadSample") {
        e.preventDefault();
        loadSampleToTextarea();
        return;
      }
      if (t?.id === "btnSaveEmployees") {
        e.preventDefault();
        saveEmployeesFromTextarea();
        return;
      }
    });
  }

  function init() {
    loadAll();
    renderWinners();
    resetSlots();
    setupClicks();
  }

  // Đợi DOM: tránh trường hợp JS chạy trước khi có nút
  window.addEventListener("DOMContentLoaded", init);
})();
