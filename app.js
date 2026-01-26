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
  const lines = text.spli
