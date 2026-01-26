(() => {
  const LS_EMP = "qs_employees_v3";
  const LS_WIN = "qs_winners_v3";
  const LS_REMAIN = "qs_remaining_v3";

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
    // danh sách mẫu hiện tại (bạn có thể dán 32 người ở đây)
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
    for (const s of getSlots()) s.textContent = String(Math.floor(Math.random() * 10));
  }

  function showWinnerOnSlots(w) {
    const code = String(w?.code ?? "");
    const chars = code.padEnd(10, "*").slice(0, 10).split("");
    getSlots().forEach((s, i) => (s.textContent = chars[i] ?? "?"));
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

  // ===== Modals =====
  function openModal(id) {
    document.getElementById(id)?.setAttribute("aria-hidden", "false");
  }
  function closeModal(id) {
    document.getElementById(id)?.setAttribute("aria-hidden", "true");
  }

  function openEmployeesModal() {
    const ta = document.getElementById("employeeInput");
    if (ta) ta.value = employees.map((e) => `${e.name} | ${e.code}`).join("\n");
    openModal("modalEmployees");
  }

  function showCongrats(winner) {
    const nameEl = document.getElementById("winName");
    const codeEl = document.getElementById("winCode");
    if (nameEl) nameEl.textContent = winner.name;
    if (codeEl) codeEl.textContent = `Mã nhân viên: ${winner.code}`;

    openModal("modalCongrats");
    startFireworks(); // pháo hoa
  }

  // ===== Fireworks (canvas) =====
  const fw = {
    canvas: null,
    ctx: null,
    w: 0,
    h: 0,
    particles: [],
    running: false,
    stopAt: 0,
    raf: 0,
  };

  function fwResize() {
    const canvas = document.getElementById("fw");
    if (!canvas) return;
    fw.canvas = canvas;
    fw.ctx = canvas.getContext("2d");

    // Set size theo card hiện tại
    const card = canvas.closest(".modalCard") || canvas.parentElement;
    const rect = card.getBoundingClientRect();
    fw.w = Math.max(300, Math.floor(rect.width));
    fw.h = Math.max(240, Math.floor(rect.height));
    canvas.width = fw.w * devicePixelRatio;
    canvas.height = fw.h * devicePixelRatio;
    canvas.style.width = fw.w + "px";
    canvas.style.height = fw.h + "px";
    fw.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function fwBurst(x, y) {
    const count = 70;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 2 + Math.random() * 5.5;
      fw.particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 60 + Math.random() * 30,
        r: 2 + Math.random() * 2,
        // màu vàng / trắng / cam
        c: Math.random() < 0.5 ? "rgba(246,221,147,0.95)" :
           Math.random() < 0.7 ? "rgba(255,255,255,0.92)" :
                                 "rgba(238,201,111,0.92)"
      });
    }
  }

  function fwStep() {
    if (!fw.running) return;

    const ctx = fw.ctx;
    if (!ctx) return;

    // fade nhẹ để tạo vệt
    ctx.fillStyle = "rgba(0,0,0,0.14)";
    ctx.fillRect(0, 0, fw.w, fw.h);

    // update particles
    for (let i = fw.particles.length - 1; i >= 0; i--) {
      const p = fw.particles[i];
      p.vy += 0.08; // gravity
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;

      ctx.beginPath();
      ctx.fillStyle = p.c;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      if (p.life <= 0 || p.y > fw.h + 20 || p.x < -20 || p.x > fw.w + 20) {
        fw.particles.splice(i, 1);
      }
    }

    // thỉnh thoảng nổ thêm
    if (Math.random() < 0.10) {
      fwBurst(60 + Math.random() * (fw.w - 120), 80 + Math.random() * 120);
    }

    // auto stop
    if (Date.now() > fw.stopAt && fw.particles.length === 0) {
      stopFireworks();
      return;
    }

    fw.raf = requestAnimationFrame(fwStep);
  }

  function startFireworks() {
    fwResize();
    fw.particles = [];
    fw.running = true;
    fw.stopAt = Date.now() + 1800; // chạy ~1.8s
    // nổ đầu tiên 2 phát
    fwBurst(fw.w * 0.30, fw.h * 0.35);
    fwBurst(fw.w * 0.70, fw.h * 0.35);

    cancelAnimationFrame(fw.raf);
    fw.raf = requestAnimationFrame(fwStep);
  }

  function stopFireworks() {
    fw.running = false;
    cancelAnimationFrame(fw.raf);
    // clear canvas
    if (fw.ctx) {
      fw.ctx.clearRect(0, 0, fw.w, fw.h);
    }
  }

  // ===== Spin =====
  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  function disableButtons(disabled) {
    ["btnSpin", "btnClear", "btnList"].forEach((id) => {
      const b = document.getElementById(id);
      if (b) b.disabled = disabled;
    });
  }

  async function spin() {
    if (spinning) return;

    if (!remaining.length) {
      const msg = ["H","Ế","T"," ","L","I","S","T","!","!"];
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

    spinning = false;
    disableButtons(false);

    // popup + pháo hoa
    showCongrats(winner);
  }

  // ===== Reset all (nút Clear -> XÓA TẤT CẢ) =====
  function resetAllData() {
    if (spinning) return;
    localStorage.removeItem(LS_WIN);
    localStorage.removeItem(LS_REMAIN);
    // giữ danh sách nhân viên hiện tại (employees) để khỏi mất
    winners = [];
    remaining = [...employees];
    saveAll();
    renderWinners();
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
    closeModal("modalEmployees");
  }

  function loadSampleToTextarea() {
    const ta = document.getElementById("employeeInput");
    const s = sampleEmployees();
    if (ta) ta.value = s.map((e) => `${e.name} | ${e.code}`).join("\n");
  }

  // ===== Click handler (delegation cho chắc ăn) =====
  function setupClicks() {
    document.addEventListener("click", (e) => {
      const t = e.target;

      if (t?.id === "btnSpin") { e.preventDefault(); spin(); return; }
      if (t?.id === "btnClear") { e.preventDefault(); resetAllData(); return; }
      if (t?.id === "btnList") { e.preventDefault(); openEmployeesModal(); return; }

      if (t?.id === "btnLoadSample") { e.preventDefault(); loadSampleToTextarea(); return; }
      if (t?.id === "btnSaveEmployees") { e.preventDefault(); saveEmployeesFromTextarea(); return; }

      if (t?.dataset?.close === "employees") { e.preventDefault(); closeModal("modalEmployees"); return; }
      if (t?.dataset?.close === "congrats") { e.preventDefault(); stopFireworks(); closeModal("modalCongrats"); return; }
    });

    window.addEventListener("resize", () => {
      // nếu popup đang mở thì resize canvas cho khớp
      const isOpen = document.getElementById("modalCongrats")?.getAttribute("aria-hidden") === "false";
      if (isOpen) fwResize();
    });
  }

  function init() {
    loadAll();
    renderWinners();
    resetSlots();
    setupClicks();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
