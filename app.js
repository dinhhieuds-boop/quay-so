const $ = (id) => document.getElementById(id);

const btnSpin = $("btnSpin");
const btnClear = $("btnClear");
const btnList = $("btnList");

const rolling = $("rolling");
const winnerTbody = $("winnerTbody");

const modalCongrats = $("modalCongrats");
const modalEmployees = $("modalEmployees");

const winnerBig = $("winnerBig");
const winnerSub = $("winnerSub");

const employeeInput = $("employeeInput");
const empTbody = $("empTbody");
const empCount = $("empCount");
const empRemain = $("empRemain");

const btnLoadSample = $("btnLoadSample");
const btnSaveEmployees = $("btnSaveEmployees");
const btnResetWinners = $("btnResetWinners");
const btnResetAll = $("btnResetAll");

let employees = [];     // full list
let remaining = [];     // remaining for draw
let winners = [];       // drawn list
let spinning = false;

const LS_EMP = "qs_employees_v1";
const LS_WIN = "qs_winners_v1";
const LS_REMAIN = "qs_remaining_v1";

function openModal(which){
  if(which === "congrats") modalCongrats.setAttribute("aria-hidden","false");
  if(which === "employees") modalEmployees.setAttribute("aria-hidden","false");
}
function closeModal(which){
  if(which === "congrats") modalCongrats.setAttribute("aria-hidden","true");
  if(which === "employees") modalEmployees.setAttribute("aria-hidden","true");
}

document.addEventListener("click", (e) => {
  const key = e.target?.dataset?.close;
  if(key) closeModal(key);
});

function parseEmployees(text){
  // mỗi dòng: Tên | Mã
  const lines = text.split("\n").map(s => s.trim()).filter(Boolean);
  const out = [];
  for(const line of lines){
    const parts = line.split("|").map(s => s.trim());
    if(parts.length >= 2){
      out.push({ name: parts[0], code: parts[1] });
    } else {
      // nếu người dùng chỉ nhập 1 cột => tự tạo mã
      out.push({ name: parts[0], code: "NV" + String(out.length+1).padStart(3,"0") });
    }
  }
  // lọc trùng theo mã (ưu tiên cái đầu)
  const seen = new Set();
  return out.filter(x => {
    const k = x.code || x.name;
    if(seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function saveAll(){
  localStorage.setItem(LS_EMP, JSON.stringify(employees));
  localStorage.setItem(LS_WIN, JSON.stringify(winners));
  localStorage.setItem(LS_REMAIN, JSON.stringify(remaining));
}

function loadAll(){
  employees = JSON.parse(localStorage.getItem(LS_EMP) || "[]");
  winners = JSON.parse(localStorage.getItem(LS_WIN) || "[]");
  remaining = JSON.parse(localStorage.getItem(LS_REMAIN) || "[]");

  // nếu có employees mà remaining rỗng => rebuild remaining trừ winners
  if(employees.length && !remaining.length){
    const winCodes = new Set(winners.map(w=>w.code));
    remaining = employees.filter(e => !winCodes.has(e.code));
  }

  if(!employees.length){
    employees = sampleEmployees();
    remaining = [...employees];
    winners = [];
  }
  employeeInput.value = employees.map(e => `${e.name} | ${e.code}`).join("\n");
  saveAll();
}

function sampleEmployees(){
  return [
   {name:"Nguyễn Thị Thu Nga", code:"3000014762"},
    {name:"Nguyễn Thị Thanh Huyền", code:"3000029493"},
    {name:"Phạm Thị Thùy Linh", code:"3000030043"},
    {name:"Nguyễn Thị Lan", code:"2014004731"},
    {name:"Lê Minh Quân", code:"3000028101"},
    {name:"Dương Thị Định", code:"2012002614"},
    {name:"Nguyễn Minh Hằng", code:"3000025227"},
    {name:"Hoàng Thị Thu Hương", code:"3000029777"},
    {name:"Trần Ngọc Anh", code:"3000026152"},
    {name:"Đỗ Đình Hiếu", code:"3000006381"},
    {name:"Dương Duy Thành", code:"3000028102"},
    {name:"Nguyễn Thị Lan Hương", code:"3000031496"},
    {name:"Nguyễn Ngọc Sơn", code:"3000012486"},
    {name:"Nguyễn Thị Mai", code:"3000014605"},
    {name:"Nguyễn Trà My", code:"3000016223"},
    {name:"Hoàng Thị Hồng Nhung", code:"3000028083"},
    {name:"Nguyễn Thị Cúc", code:"3000031009"},
    {name:"Đặng Thị Nhung", code:"3000032038"},
    {name:"Nguyễn Thị Hồng", code:"3000031703"},
    {name:"Hoàng Tùng Lâm", code:"3000031008"},
    {name:"Đỗ Thị Dung Quỳnh", code:"3000031710"},
    {name:"Phạm Ngọc Hiền Linh", code:"3000014308"},
    {name:"Lê Hồng Nhung", code:"3000023364"},
    {name:"Nguyễn Mai Phương", code:"3000029219"},
    {name:"Trần Minh Phương", code:"3000025815"},
    {name:"Bùi Thị Nguyệt", code:"3000032443"},
    {name:"Bùi Hải Yến", code:"3000032810"},
    {name:"Lê Tuấn Anh", code:"3000032036"},
    {name:"Châu Thị Sương", code:"3000026258"},
    {name:"Đỗ Thị Thu Sương", code:"3000028369"},
    {name:"Trân Gia Bảo", code:"3000027042"},
  ];
}

function renderWinners(){
  winnerTbody.innerHTML = "";
  if(!winners.length){
    winnerTbody.innerHTML = `<tr class="emptyRow"><td colspan="3">Chưa có kết quả</td></tr>`;
    return;
  }
  winners.forEach((w, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx+1}</td>
      <td>${escapeHtml(w.name)}</td>
      <td>${escapeHtml(w.code)}</td>
    `;
    winnerTbody.appendChild(tr);
  });
}

function renderEmployees(){
  empCount.textContent = employees.length;
  empRemain.textContent = remaining.length;

  empTbody.innerHTML = "";
  if(!employees.length){
    empTbody.innerHTML = `<tr class="emptyRow"><td colspan="3">Chưa có dữ liệu</td></tr>`;
    return;
  }
  employees.forEach((e, idx) => {
    const tr = document.createElement("tr");
    const isRemain = remaining.some(r => r.code === e.code);
    tr.innerHTML = `
      <td>${idx+1}</td>
      <td>${escapeHtml(e.name)} ${isRemain ? "" : `<span style="color:#6b7a90;font-weight:700;">(đã trúng)</span>`}</td>
      <td>${escapeHtml(e.code)}</td>
    `;
    empTbody.appendChild(tr);
  });
}

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

async function spin(){
  if(spinning) return;
  if(!remaining.length){
    rolling.textContent = "Hết danh sách để quay";
    return;
  }
  spinning = true;
  btnSpin.disabled = true;
  btnClear.disabled = true;
  btnList.disabled = true;

  // hiệu ứng chạy chữ 2.6s
  const duration = 2600;
  const start = performance.now();

  while(performance.now() - start < duration){
    const r = remaining[Math.floor(Math.random()*remaining.length)];
    rolling.textContent = `${r.name} (${r.code})`;
    await sleep(70);
  }

  // chốt người trúng (không trùng)
  const winnerIndex = Math.floor(Math.random()*remaining.length);
  const winner = remaining.splice(winnerIndex, 1)[0];
  winners.push(winner);

  rolling.textContent = `${winner.name} (${winner.code})`;
  winnerBig.textContent = winner.name;
  winnerSub.textContent = `Mã nhân viên: ${winner.code}`;

  saveAll();
  renderWinners();
  renderEmployees();

  openModal("congrats");

  spinning = false;
  btnSpin.disabled = false;
  btnClear.disabled = false;
  btnList.disabled = false;
}

function clearRolling(){
  rolling.textContent = "—";
}

btnSpin.addEventListener("click", spin);
btnClear.addEventListener("click", clearRolling);

btnList.addEventListener("click", () => {
  renderEmployees();
  openModal("employees");
});

btnLoadSample.addEventListener("click", () => {
  const s = sampleEmployees();
  employeeInput.value = s.map(e => `${e.name} | ${e.code}`).join("\n");
});

btnSaveEmployees.addEventListener("click", () => {
  const parsed = parseEmployees(employeeInput.value);
  employees = parsed;
  winners = [];
  remaining = [...employees];
  saveAll();
  renderWinners();
  renderEmployees();
  rolling.textContent = "—";
});

btnResetWinners.addEventListener("click", () => {
  winners = [];
  remaining = [...employees];
  saveAll();
  renderWinners();
  renderEmployees();
  rolling.textContent = "—";
});

btnResetAll.addEventListener("click", () => {
  localStorage.removeItem(LS_EMP);
  localStorage.removeItem(LS_WIN);
  localStorage.removeItem(LS_REMAIN);
  loadAll();
  renderWinners();
  renderEmployees();
  rolling.textContent = "—";
});

// init
loadAll();
renderWinners();
renderEmployees();
clearRolling();
