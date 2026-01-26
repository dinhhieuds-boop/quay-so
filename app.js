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
    if (codeEl) codeEl.textContent = winner.code; // chỉ hiện số mã

    openModal("modalCongrats");

    // CHỜ modal render xong -> canvas có size thật
    requestAnimationFrame(() => {
      window.startFireworks?.();
    });
  }

  // ===== Spin =====
  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function disableButtons(disabled) {
    ["btnSpin", "btnClear", "btnList"].forEach((id) => {
      const b = document.getElementById(id);
      if (b) b.disabled = disabled;
    });
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

    const duration = 3800;
    const tick = 60;
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

    showCongrats(winner);
  }

  // ===== Reset all (nút Clear -> XÓA KẾT QUẢ, GIỮ NHÂN VIÊN) =====
  function resetAllData() {
    if (spinning) return;
    localStorage.removeItem(LS_WIN);
    localStorage.removeItem(LS_REMAIN);
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

  // ===== Click handler =====
  function setupClicks() {
    document.addEventListener("click", (e) => {
      const t = e.target;

      if (t?.id === "btnSpin") {
        e.preventDefault();
        spin();
        return;
      }
      if (t?.id === "btnClear") {
        e.preventDefault();
        resetAllData();
        return;
      }
      if (t?.id === "btnList") {
        e.preventDefault();
        openEmployeesModal();
        return;
      }

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

      if (t?.dataset?.close === "employees") {
        e.preventDefault();
        closeModal("modalEmployees");
        return;
      }
      if (t?.dataset?.close === "congrats") {
        e.preventDefault();
        window.stopFireworks?.();
        closeModal("modalCongrats");
        return;
      }
    });

    window.addEventListener("resize", () => {
      const isOpen =
        document.getElementById("modalCongrats")?.getAttribute("aria-hidden") === "false";
      if (isOpen) window.__fwResize?.();
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

// ==========================================================
// FIREWORKS (bung lên rồi rơi xuống mượt) for <canvas id="fw">
// ==========================================================
const FW = (() => {
  const canvas = document.getElementById("fw");
  if (!canvas) return null;
  const ctx = canvas.getContext("2d", { alpha: true });

  let particles = [];
  let raf = 0;
  let last = 0;
  let running = false;

  const GRAVITY = 900;     // rơi
  const DRAG = 0.985;      // cản
  const TRAIL = 0.12;      // vệt mượt
  const LIFE_MIN = 0.9;
  const LIFE_MAX = 1.6;

  const rand = (a, b) => Math.random() * (b - a) + a;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }

  // expose để resize khi window resize
  window.__fwResize = resize;

  function addBurst(x, y, count = 120) {
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(240, 720);

      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - rand(420, 820); // bung lên rõ

      particles.push({
        x,
        y,
        vx,
        vy,
        r: rand(1.2, 2.6),
        life: rand(LIFE_MIN, LIFE_MAX),
        t: 0,
        hue: rand(40, 55),
        sat: rand(75, 95),
        lum: rand(55, 70),
      });
    }
  }

  function step(now) {
    if (!running) return;

    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;

    // Nếu modal animate/resize, resize lại cho chắc
    if (!resize()) {
      raf = requestAnimationFrame(step);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.fillStyle = `rgba(0,0,0,${TRAIL})`;
    ctx.fillRect(0, 0, w, h);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt;

      p.vx *= Math.pow(DRAG, dt * 60);
      p.vy = p.vy * Math.pow(DRAG, dt * 60) + GRAVITY * dt;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      const k = p.t / p.life;
      const alpha = Math.max(0, 1 - k);

      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue},${p.sat}%,${p.lum}%,${alpha})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      if (p.t >= p.life || p.y > h + 60) particles.splice(i, 1);
    }

    if (particles.length > 0) {
      raf = requestAnimationFrame(step);
    } else {
      stop();
    }
  }

  function start(opts = {}) {
    // modal vừa mở có thể size = 0 => chờ nhẹ
    if (!resize()) {
      setTimeout(() => start(opts), 30);
      return;
    }

    running = true;
    particles = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rect = canvas.getBoundingClientRect();
    const bursts = opts.bursts ?? 5;
    const gap = opts.gap ?? 150;
    const count = opts.count ?? 130;

    for (let i = 0; i < bursts; i++) {
      setTimeout(() => {
        const x = rect.width * 0.5 + rand(-rect.width * 0.18, rect.width * 0.18);
        const y = rect.height * 0.42 + rand(-rect.height * 0.10, rect.height * 0.10);
        addBurst(x, y, count);

        if (!raf) {
          last = performance.now();
          raf = requestAnimationFrame(step);
        }
      }, i * gap);
    }
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    particles = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  return { start, stop };
})();

window.startFireworks = function () {
  FW?.start({ bursts: 5, gap: 150, count: 130 });
};
window.stopFireworks = function () {
  FW?.stop();
};
