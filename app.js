(() => {
  const LS_EMP = "qs_employees_v3";
  const LS_WIN = "qs_winners_v3";
  const LS_REMAIN = "qs_remaining_v3";

  let employees = [];
  let winners = [];
  let remaining = [];
  let spinning = false;

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function sampleEmployees() {
    // Không tự sinh: danh sách mã sẽ theo số lượng bạn IMPORT trong "Danh Sách Mã Số"
    return [];
  }

  function saveAll() {
    localStorage.setItem(LS_EMP, JSON.stringify(employees));
    localStorage.setItem(LS_WIN, JSON.stringify(winners));
    localStorage.setItem(LS_REMAIN, JSON.stringify(remaining));
  }

  function loadAll() {
    employees = JSON.parse(localStorage.getItem(LS_EMP) || "[]");
    winners = JSON.parse(localStorage.getItem(LS_WIN) || "[]");

    // Backfill round cho dữ liệu cũ (nếu trước đây chưa lưu trường round)
    winners = winners.map((w, i) => ({ ...w, round: w.round ?? (i + 1) }));
    remaining = JSON.parse(localStorage.getItem(LS_REMAIN) || "[]");

    // Nếu dữ liệu cũ không đúng format 001-220 => reset theo danh sách MÃ SỐ MAY MẮN
    const looksLikeLuckyCodes = (arr) =>
      Array.isArray(arr) &&
      arr.length > 0 &&
      arr.every((e) => typeof e?.code === "string" && /^\d{3}$/.test(e.code));

    if (employees.length && !looksLikeLuckyCodes(employees)) {
      employees = sampleEmployees();
      winners = [];
      remaining = [...employees];
      saveAll();
      return;
    }


    // nếu có employees nhưng remaining trống => rebuild remaining = employees - winners
    if (employees.length && !remaining.length) {
      const winCodes = new Set(winners.map((w) => w.code));
      remaining = employees.filter((e) => !winCodes.has(e.code));
    }

    // lần đầu chạy
    if (!employees.length) {
      // Chưa có danh sách mã -> để trống, người dùng sẽ import
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
    const raw = String(w?.code ?? "");
    const code3 = raw.length >= 3 ? raw.slice(-3) : raw.padStart(3, "0");
    const chars = code3.split("");
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
        <td>${escapeHtml(`Kỳ ${w.round ?? (idx + 1)}`)}</td>
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
      // Cho phép 2 kiểu nhập:
      // 1) chỉ mã: 001
      // 2) name|code (nếu bạn muốn ghi chú): ABC|001
      let name = "MÃ SỐ MAY MẮN";
      let code = "";

      if (line.includes("|")) {
        const parts = line.split("|").map((s) => s.trim());
        name = parts[0] || "MÃ SỐ MAY MẮN";
        code = parts[1] || "";
      } else {
        code = line;
      }

      // Chuẩn hoá mã: nếu là số -> pad 3 ký tự (1 -> 001)
      if (/^\d+$/.test(code)) code = String(parseInt(code, 10)).padStart(3, "0");

      if (!code) continue;
      out.push({ name, code });
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
    if (ta) ta.value = employees.map((e) => `${e.code}`).join("\n");
    openModal("modalEmployees");
  }

  function showCongrats(winner) {
    const nameEl = document.getElementById("winName");
    const codeEl = document.getElementById("winCode");
    if (nameEl) nameEl.textContent = winner.name;
    if (codeEl) codeEl.textContent = winner.code;

    openModal("modalCongrats");

    // chờ modal render xong để canvas có size thật
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

    if (!employees.length) {
      // Chưa import danh sách mã
      const msg = ["N", "H", "Ậ"]; // "NHẬ" (hiểu là NHẬP)
      getSlots().forEach((s, i) => (s.textContent = msg[i] || "?"));
      openEmployeesModal();
      return;
    }

    if (!remaining.length) {
      const msg = ["H", "Ế", "T"];
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

    // lưu thêm "kỳ quay" để hiển thị ở bảng kết quả
    const roundNo = winners.length + 1;
    winners.push({ ...winner, round: roundNo });

    showWinnerOnSlots(winner);
    renderWinners();
    saveAll();

    spinning = false;
    disableButtons(false);

    showCongrats(winner);
  }

  // ===== Reset all (Clear: XÓA KẾT QUẢ, GIỮ NHÂN VIÊN) =====
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
    // Mẫu nhanh: 001 → 050 (bạn có thể sửa thành 001 → 220, hoặc dán danh sách riêng)
    const out = [];
    for (let i = 1; i <= 50; i++) out.push(String(i).padStart(3, "0"));
    if (ta) ta.value = out.join("\n");
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
// FIREWORKS (rocket bay lên -> nổ -> rơi xuống) for <canvas id="fw">
// FIX: không fill nền đen, không che UI, mượt + resize chuẩn
// ==========================================================
const FW = (() => {
  const canvas = document.getElementById("fw");
  if (!canvas) return null;

  const ctx = canvas.getContext("2d", { alpha: true });

  let raf = 0;
  let last = 0;
  let running = false;

  // 2 loại hạt: rocket (bay lên) và spark (tàn pháo)
  let rockets = [];
  let sparks = [];

  // ===== Tuning =====
  const GRAVITY = 980;         // trọng lực
  const DRAG = 0.985;          // cản không khí
  const TRAIL = 0.18;          // vệt mờ (destination-out)
  const LIFE_MIN = 0.9;
  const LIFE_MAX = 1.8;

  // Rocket
  const ROCKET_SPEED_MIN = 820;
  const ROCKET_SPEED_MAX = 1250;

  // Burst
  const SPARK_COUNT = 140;     // số tàn
  const SPARK_SPEED_MIN = 260;
  const SPARK_SPEED_MAX = 880;

  const rand = (a, b) => Math.random() * (b - a) + a;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

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

  function clearSoft(w, h) {
    // làm mờ bằng "destination-out" để giữ nền trong suốt
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = `rgba(0,0,0,${TRAIL})`;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  function addRocket(x, fromY, toY) {
    const speed = rand(ROCKET_SPEED_MIN, ROCKET_SPEED_MAX);
    rockets.push({
      x,
      y: fromY,
      vx: rand(-120, 120),
      vy: -speed,
      toY,
      hue: rand(40, 55),
      sat: rand(75, 95),
      lum: rand(55, 75),
    });
  }

  function burst(x, y, hueBase, count = SPARK_COUNT) {
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(SPARK_SPEED_MIN, SPARK_SPEED_MAX);

      sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(120, 380),
        r: rand(1.2, 2.6),
        life: rand(LIFE_MIN, LIFE_MAX),
        t: 0,
        hue: clamp(hueBase + rand(-10, 10), 0, 360),
        sat: rand(75, 95),
        lum: rand(55, 70),
      });
    }
  }

  function drawRocket(rk) {
    ctx.beginPath();
    ctx.fillStyle = `hsla(${rk.hue},${rk.sat}%,${rk.lum}%,0.95)`;
    ctx.arc(rk.x, rk.y, 2.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = `hsla(${rk.hue},${rk.sat}%,${rk.lum}%,0.35)`;
    ctx.lineWidth = 1.2;
    ctx.moveTo(rk.x, rk.y);
    ctx.lineTo(rk.x - rk.vx * 0.02, rk.y - rk.vy * 0.02);
    ctx.stroke();
  }

  function drawSpark(p) {
    const k = p.t / p.life;
    const alpha = Math.max(0, 1 - k);

    ctx.beginPath();
    ctx.fillStyle = `hsla(${p.hue},${p.sat}%,${p.lum}%,${alpha})`;
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  function step(now) {
    if (!running) return;

    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;

    if (!resize()) {
      raf = requestAnimationFrame(step);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    clearSoft(w, h);

    // rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
      const rk = rockets[i];

      rk.vx *= Math.pow(DRAG, dt * 60);
      rk.vy = rk.vy * Math.pow(DRAG, dt * 60) + GRAVITY * dt * 0.15;

      rk.x += rk.vx * dt;
      rk.y += rk.vy * dt;

      drawRocket(rk);

      if (rk.y <= rk.toY || rk.vy > -120) {
        burst(rk.x, rk.y, rk.hue, SPARK_COUNT);
        rockets.splice(i, 1);
      }
    }

    // sparks
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.t += dt;

      p.vx *= Math.pow(DRAG, dt * 60);
      p.vy = p.vy * Math.pow(DRAG, dt * 60) + GRAVITY * dt;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      drawSpark(p);

      if (p.t >= p.life || p.y > h + 80) sparks.splice(i, 1);
    }

    if (rockets.length > 0 || sparks.length > 0) {
      raf = requestAnimationFrame(step);
    } else {
      stop();
    }
  }

  function start(opts = {}) {
    if (!resize()) {
      setTimeout(() => start(opts), 30);
      return;
    }

    running = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;

    rockets = [];
    sparks = [];

    const rect = canvas.getBoundingClientRect();
    const bursts = opts.bursts ?? 6;
    const gap = opts.gap ?? 160;

    ctx.clearRect(0, 0, rect.width, rect.height);

    for (let i = 0; i < bursts; i++) {
      setTimeout(() => {
        const x = rect.width * 0.5 + rand(-rect.width * 0.22, rect.width * 0.22);
        const fromY = rect.height + 20;
        const toY = rect.height * rand(0.22, 0.45);
        addRocket(x, fromY, toY);

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
    rockets = [];
    sparks = [];
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
  }

  return { start, stop };
})();

window.startFireworks = function () {
  FW?.start({ bursts: 6, gap: 160 });
};
window.stopFireworks = function () {
  FW?.stop();
};
