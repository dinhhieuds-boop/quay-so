const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

const ta = document.getElementById("items");
const btnSpin = document.getElementById("spin");
const btnShuffle = document.getElementById("shuffle");
const btnReset = document.getElementById("reset");
const out = document.getElementById("result");

let items = [];
let angle = 0;
let spinning = false;

// Danh sách mẫu
const DEFAULT = [
  "1","2","3","4","5","6","7","8"
];

function loadDefault(){
  ta.value = DEFAULT.join("\n");
  syncFromTextarea();
}
function syncFromTextarea(){
  items = ta.value
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean);

  if(items.length < 2){
    out.textContent = "Cần ít nhất 2 mục";
  } else {
    out.textContent = "—";
  }
  drawWheel();
}

function drawWheel(){
  const W = canvas.width, H = canvas.height;
  const cx = W/2, cy = H/2;
  const r = Math.min(W,H)/2 - 12;

  ctx.clearRect(0,0,W,H);

  // vòng ngoài
  ctx.beginPath();
  ctx.arc(cx,cy,r+2,0,Math.PI*2);
  ctx.fillStyle = "#0b1020";
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#2a3760";
  ctx.stroke();

  if(items.length === 0) return;

  const n = items.length;
  const step = (Math.PI*2)/n;

  for(let i=0;i<n;i++){
    const a0 = angle + i*step;
    const a1 = a0 + step;

    // màu tự động theo HSL
    const hue = Math.round((i*360)/n);
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,a0,a1);
    ctx.closePath();
    ctx.fillStyle = `hsl(${hue} 80% 55%)`;
    ctx.fill();

    // text
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(a0 + step/2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#111";
    ctx.font = "700 18px system-ui";
    const text = items[i].length > 18 ? items[i].slice(0,18) + "…" : items[i];
    ctx.fillText(text, r-14, 6);
    ctx.restore();
  }

  // tâm
  ctx.beginPath();
  ctx.arc(cx,cy,46,0,Math.PI*2);
  ctx.fillStyle = "#111a33";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#e9eefc";
  ctx.stroke();

  ctx.fillStyle = "#e9eefc";
  ctx.font = "800 16px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("SPIN", cx, cy+6);
}

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickWinner(finalAngle){
  // pointer ở đỉnh (góc -90deg). ta quy đổi về góc 0..2pi
  const n = items.length;
  const step = (Math.PI*2)/n;

  // góc mà pointer “chỉ vào” tính theo wheel
  const pointerAngle = (Math.PI*1.5 - (finalAngle % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
  const idx = Math.floor(pointerAngle / step) % n;
  return items[idx];
}

function spin(){
  if(spinning) return;
  if(items.length < 2){
    out.textContent = "Cần ít nhất 2 mục";
    return;
  }
  spinning = true;
  out.textContent = "Đang quay…";

  // quay 6-10 vòng + thêm góc ngẫu nhiên
  const extraTurns = 6 + Math.random()*4;
  const target = angle + extraTurns*(Math.PI*2) + Math.random()*(Math.PI*2);

  const start = performance.now();
  const duration = 3200; // ms

  function easeOutCubic(t){ return 1 - Math.pow(1-t, 3); }

  function frame(now){
    const t = Math.min(1, (now - start)/duration);
    const e = easeOutCubic(t);
    angle = angle + (target - angle) * 0.18; // ổn định mượt

    // để đảm bảo tới đúng target khi gần cuối
    if(t > 0.92){
      angle = angle + (target - angle) * 0.35;
    }
    drawWheel();

    if(t < 1){
      requestAnimationFrame(frame);
    } else {
      angle = target;
      drawWheel();
      const winner = pickWinner(angle);
      out.textContent = winner;
      spinning = false;
    }
  }
  requestAnimationFrame(frame);
}

// Events
ta.addEventListener("input", syncFromTextarea);
btnSpin.addEventListener("click", spin);
btnShuffle.addEventListener("click", () => {
  items = shuffle(items);
  ta.value = items.join("\n");
  drawWheel();
});
btnReset.addEventListener("click", loadDefault);

loadDefault();
