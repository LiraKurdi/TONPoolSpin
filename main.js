/* Pool Spin DEX — UI + Cascade Demo (4x5)
   Matching rule: any symbol that appears >= 5 times in the grid => WIN (green), removed, replaced, repeat.
*/

(function initTelegram(){
  try{
    if (window.Telegram && Telegram.WebApp){
      Telegram.WebApp.ready();
      Telegram.WebApp.expand();
      Telegram.WebApp.setHeaderColor("#de6b3c");
      Telegram.WebApp.setBackgroundColor("#de6b3c");
      // Haptic helper
      window._tgHaptic = Telegram.WebApp.HapticFeedback;
    }
  }catch(e){}
})();

const state = {
  rows: 5,
  cols: 4,

  level: 1,
  balance: 100250.00,     // USDT
  spinFee: 0.10,

  autoEnabled: true,
  autoSpeed: 10,          // 10/20/50 preset (lower = faster cycles)

  spinning: false,
  grid: [],

  symbols: ["🏆","🚀","🌹","💐","💎","🧸","🎂","💍","🍾","🎁","💗"]
};

const el = {
  grid: document.getElementById("grid"),
  spinBtn: document.getElementById("spinBtn"),

  levelValue: document.getElementById("levelValue"),
  balanceValue: document.getElementById("balanceValue"),
  lastSpinBody: document.getElementById("lastSpinBody"),

  feeValue: document.getElementById("feeValue"),
  feeMinus: document.getElementById("feeMinus"),
  feePlus: document.getElementById("feePlus"),

  autoToggle: document.getElementById("autoToggle"),
  autoText: document.getElementById("autoText"),
  autoButtons: Array.from(document.querySelectorAll(".pill-btn[data-auto]"))
};

function haptic(type="impact", style="light"){
  try{
    if (!window._tgHaptic) return;
    if (type === "impact") window._tgHaptic.impactOccurred(style);
    if (type === "notif") window._tgHaptic.notificationOccurred(style); // success/error/warning
  }catch(e){}
}

function formatTR(n){
  // 100250.00 -> 100.250,00
  const fixed = (Math.round(n * 100) / 100).toFixed(2);
  const [intp, frac] = fixed.split(".");
  const withDots = intp.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${withDots},${frac}`;
}

function randSymbol(){
  return state.symbols[Math.floor(Math.random() * state.symbols.length)];
}

function renderHUD(){
  el.levelValue.textContent = String(state.level);
  el.balanceValue.textContent = `${formatTR(state.balance)} USDT`;
  el.feeValue.textContent = state.spinFee.toFixed(2);
  el.spinBtn.disabled = state.spinning;
  el.autoToggle.classList.toggle("off", !state.autoEnabled);
  el.autoText.textContent = state.autoEnabled ? "ON" : "OFF";
}

function buildGridDOM(){
  el.grid.innerHTML = "";
  for (let r=0; r<state.rows; r++){
    for (let c=0; c<state.cols; c++){
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.r = String(r);
      cell.dataset.c = String(c);

      const sym = document.createElement("div");
      sym.className = "symbol";
      sym.textContent = "💎";

      cell.appendChild(sym);
      el.grid.appendChild(cell);
    }
  }
}

function setGrid(grid){
  state.grid = grid;
  const cells = el.grid.querySelectorAll(".cell");
  let i = 0;
  for (let r=0; r<state.rows; r++){
    for (let c=0; c<state.cols; c++){
      const cell = cells[i++];
      cell.classList.remove("win");
      cell.querySelector(".symbol").textContent = grid[r][c];
    }
  }
}

function randomizeGrid(){
  const g = [];
  for (let r=0; r<state.rows; r++){
    const row = [];
    for (let c=0; c<state.cols; c++){
      row.push(randSymbol());
    }
    g.push(row);
  }
  setGrid(g);
}

function countSymbols(grid){
  const map = new Map();
  for (let r=0; r<state.rows; r++){
    for (let c=0; c<state.cols; c++){
      const s = grid[r][c];
      map.set(s, (map.get(s) || 0) + 1);
    }
  }
  return map;
}

function findWinners(grid){
  const counts = countSymbols(grid);
  const winners = [];
  for (const [sym, n] of counts.entries()){
    if (n >= 5) winners.push({ sym, n });
  }
  // Highest count first
  winners.sort((a,b)=> b.n - a.n);
  return winners;
}

function highlightWinner(sym){
  const cells = el.grid.querySelectorAll(".cell");
  cells.forEach(cell=>{
    const val = cell.querySelector(".symbol").textContent;
    if (val === sym) cell.classList.add("win");
  });
}

function replaceWinnerSymbols(sym){
  // Replace all occurrences of sym with new random symbols
  const newGrid = state.grid.map(row => row.slice());
  for (let r=0; r<state.rows; r++){
    for (let c=0; c<state.cols; c++){
      if (newGrid[r][c] === sym){
        newGrid[r][c] = randSymbol();
      }
    }
  }
  setGrid(newGrid);
}

function appendLastSpin(line){
  const current = el.lastSpinBody.textContent || "";
  const next = (current.trim() === "Ready." ? "" : current.trim() + "\n");
  el.lastSpinBody.textContent = next + line;
}

function clearLastSpin(){
  el.lastSpinBody.textContent = "";
}

function sleep(ms){ return new Promise(res => setTimeout(res, ms)); }

async function doSpin(){
  if (state.spinning) return;
  state.spinning = true;
  renderHUD();
  clearLastSpin();

  // fee
  state.balance = Math.max(0, state.balance - state.spinFee);
  appendLastSpin(`Fee: -${state.spinFee.toFixed(2)} USDT`);

  haptic("impact","medium");

  // slot roll effect
  for (let i=0; i<9; i++){
    randomizeGrid();
    await sleep(55 + i*10);
  }

  // final grid
  randomizeGrid();

  let totalWin = 0;
  let cascade = 0;

  while (true){
    const winners = findWinners(state.grid);
    if (!winners.length) break;

    cascade += 1;
    const top = winners[0];

    // highlight winner group
    highlightWinner(top.sym);
    haptic("impact","light");

    // payout formula (demo): each match beyond 4 => + (count-4)*fee*6
    const payout = (top.n - 4) * state.spinFee * 6;
    totalWin += payout;

    appendLastSpin(`Cascade #${cascade}: ${top.n}× ${top.sym} => +${payout.toFixed(2)} USDT`);

    await sleep(420);

    // replace and continue
    replaceWinnerSymbols(top.sym);
    await sleep(120);

    // safety: avoid infinite loop if RNG unlucky
    if (cascade >= 25) {
      appendLastSpin(`Stopper: max cascade limit reached.`);
      break;
    }
  }

  if (totalWin > 0){
    state.balance += totalWin;
    // simple leveling: every 10 USDT win -> +1 level
    const levelUp = Math.floor(totalWin / 10);
    if (levelUp > 0) state.level += levelUp;

    haptic("notif","success");
    appendLastSpin(`Total Win: +${totalWin.toFixed(2)} USDT`);
    if (levelUp > 0) appendLastSpin(`Level Up: +${levelUp} => Level ${state.level}`);
  } else {
    haptic("notif","warning");
    appendLastSpin(`No match. Try again.`);
  }

  state.spinning = false;
  renderHUD();
}

function setAutoSpeed(v){
  state.autoSpeed = v;
  el.autoButtons.forEach(b=>{
    b.classList.toggle("active", Number(b.dataset.auto) === v);
  });
}

let autoTimer = null;
function startAutoLoop(){
  stopAutoLoop();
  // 10/20/50 -> map to ms
  const delay = state.autoSpeed === 10 ? 1400 : state.autoSpeed === 20 ? 2200 : 3200;

  autoTimer = setInterval(async ()=>{
    if (!state.autoEnabled) return;
    if (state.spinning) return;
    await doSpin();
  }, delay);
}

function stopAutoLoop(){
  if (autoTimer) clearInterval(autoTimer);
  autoTimer = null;
}

/* Fee controls */
function clampFee(x){
  // pragmatic-like: 0.05 to 5.00
  return Math.max(0.05, Math.min(5.00, Math.round(x*100)/100));
}

function initEvents(){
  el.spinBtn.addEventListener("click", doSpin);

  el.feeMinus.addEventListener("click", ()=>{
    state.spinFee = clampFee(state.spinFee - 0.05);
    haptic("impact","light");
    renderHUD();
  });

  el.feePlus.addEventListener("click", ()=>{
    state.spinFee = clampFee(state.spinFee + 0.05);
    haptic("impact","light");
    renderHUD();
  });

  el.autoToggle.addEventListener("click", ()=>{
    state.autoEnabled = !state.autoEnabled;
    haptic("impact","light");
    renderHUD();
  });

  el.autoButtons.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const v = Number(btn.dataset.auto);
      setAutoSpeed(v);
      haptic("impact","light");
      startAutoLoop();
    });
  });
}

/* Init */
function init(){
  buildGridDOM();
  setAutoSpeed(10);
  renderHUD();

  // Start with a grid close to your screenshot vibe (more teddy/cake)
  randomizeGrid();

  // auto loop active by default (like your ON)
  startAutoLoop();

  // Telegram: prevent scroll bounce feeling
  document.addEventListener("touchmove", (e)=>{ e.preventDefault(); }, {passive:false});
}

initEvents();
init();
