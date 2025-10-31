(function(){
  const S = window.AppState;

  // DOM refs
  const viewHome    = document.getElementById("viewHome");
  const viewPool    = document.getElementById("viewPool");
  const viewProfile = document.getElementById("viewProfile");

  const slotGridEl     = document.getElementById("slotGrid");
  const winnersTrackEl = document.getElementById("winnersTrack");

  // balances
  const balanceValHome     = document.getElementById("balanceValHome");
  const balanceValGame     = document.getElementById("balanceValGame");
  const balanceValProfile  = document.getElementById("balanceValProfile");
  const poolValEl          = document.getElementById("poolVal");
  const betAmountEl        = document.getElementById("betAmount");
  const betStepEl          = document.getElementById("betStep");
  const totalWinningsEl    = document.getElementById("totalWinnings");
  const refEarningsEl      = document.getElementById("refEarnings");
  const walletBalanceEl    = document.getElementById("walletBalance");
  const poolBalanceUserEl  = document.getElementById("poolBalanceUser");

  // currency labels
  const currencyChipEl          = document.getElementById("currencyChip");
  const poolCurrencyEl          = document.getElementById("poolCurrency");
  const betCurrencyEl           = document.getElementById("betCurrency");
  const balanceCurrencyGameEl   = document.getElementById("balanceCurrencyGame");
  const balanceCurrencyProfileEl= document.getElementById("balanceCurrencyProfile");
  const totalWinningsCurEl      = document.getElementById("totalWinningsCur");
  const refEarningsCurEl        = document.getElementById("refEarningsCur");
  const walletBalanceCurEl      = document.getElementById("walletBalanceCur");
  const poolBalanceUserCurEl    = document.getElementById("poolBalanceUserCur");

  // runtime visuals
  const runningMultiplierEl = document.getElementById("runningMultiplier");
  const winFxEl     = document.getElementById("winFx");
  const winFxTextEl = document.getElementById("winFxText");

  // sfx
  const sfxClick = document.getElementById("sfxClick");
  const sfxSpin  = document.getElementById("sfxSpin");
  const sfxWin   = document.getElementById("sfxWin");
  S.sfx.click = sfxClick;
  S.sfx.spin  = sfxSpin;
  S.sfx.win   = sfxWin;

  // --- VIEW SWITCHER ---
  function showView(name){
    viewHome.classList.remove("active");
    viewPool.classList.remove("active");
    viewProfile.classList.remove("active");

    if(name==="home")    viewHome.classList.add("active");
    if(name==="pool")    viewPool.classList.add("active");
    if(name==="profile") viewProfile.classList.add("active");

    document.querySelectorAll(".tab-btn").forEach(btn=>{
      btn.classList.toggle("active", btn.getAttribute("data-view")===name);
    });

    playClick();
  }

  // --- RENDER REELS ---
  // drawGrid: direkt final grid'i DOM'a basar
  function drawGrid(grid){
    slotGridEl.innerHTML = "";
    for (let c=0;c<6;c++){
      const reel = document.createElement("div");
      reel.className="reel";
      const track=document.createElement("div");
      track.className="reel-track";

      for (let r=0;r<5;r++){
        const sym = grid[c][r];
        const cell=document.createElement("div");
        cell.className="cell";
        cell.textContent = sym || ""; // null ise boş
        track.appendChild(cell);
      }

      reel.appendChild(track);
      slotGridEl.appendChild(reel);
    }
  }

  // spinAnimationStub: reel sanki dönüyor gibi minicik animasyon
  // sonra callback ile final draw'a geçiyoruz
  function spinAnimationStub(finalGrid, cb){
    // basit efekt: opacity flash
    slotGridEl.style.transition="opacity .15s";
    slotGridEl.style.opacity="0";
    requestAnimationFrame(()=>{
      setTimeout(()=>{
        drawGrid(finalGrid);
        slotGridEl.style.opacity="1";
        if(typeof cb==="function") cb();
      },150);
    });
  }

  function showMultiplierFx(mult){
    winFxTextEl.textContent = "x"+mult.toFixed(2);
    winFxEl.hidden = false;
    setTimeout(()=>{ winFxEl.hidden=true; }, 800);

    playWin();
  }

  // update ticker
  function renderWinnersTicker(){
    const list=[...S.winnersTicker, ...S.winnersTicker];
    winnersTrackEl.innerHTML = list.map(w=>{
      return `
        <div class="winner-item">
          <span class="winner-name">@${w.name}</span>
          <span>kazandı</span>
          <span class="winner-amount">${w.amt}</span>
        </div>
      `;
    }).join("");
  }

  // update all balances + currency labels
  function syncAll(){
    // currency labels
    currencyChipEl.textContent         = S.currency;
    poolCurrencyEl.textContent         = S.currency;
    betCurrencyEl.textContent          = S.currency;
    balanceCurrencyGameEl.textContent  = S.currency;
    balanceCurrencyProfileEl.textContent=S.currency;
    totalWinningsCurEl.textContent     = S.currency;
    refEarningsCurEl.textContent       = S.currency;
    walletBalanceCurEl.textContent     = S.currency;
    poolBalanceUserCurEl.textContent   = S.currency;

    // numeric balances
    balanceValHome.textContent    = S.user.balanceTon.toFixed(2);
    balanceValGame.textContent    = S.user.balanceTon.toFixed(2);
    balanceValProfile.textContent = S.user.balanceTon.toFixed(2);

    poolValEl.textContent         = S.prizePoolTon.toFixed(2);
    betAmountEl.textContent       = S.betAmount.toFixed(2);
    betStepEl.textContent         = "+"+S.betStep.toFixed(2);

    totalWinningsEl.textContent   = S.user.totalWinnings.toFixed(2);
    refEarningsEl.textContent     = S.user.referralEarnings.toFixed(2);

    walletBalanceEl.textContent   = S.user.walletBalance.toFixed(2);
    poolBalanceUserEl.textContent = S.user.poolBalance.toFixed(2);

    runningMultiplierEl.textContent = "x"+S.runningMultiplier.toFixed(2);
  }

  // --- SFX helpers ---
  function playClick(){
    if(S.sfx.click && S.sfx.click.play){
      S.sfx.click.currentTime=0;
      S.sfx.click.play().catch(()=>{});
    }
  }
  function playSpin(){
    if(S.sfx.spin && S.sfx.spin.play){
      S.sfx.spin.currentTime=0;
      S.sfx.spin.play().catch(()=>{});
    }
  }
  function playWin(){
    if(S.sfx.win && S.sfx.win.play){
      S.sfx.win.currentTime=0;
      S.sfx.win.play().catch(()=>{});
    }
  }

  // public API
  window.UI = {
    showView,
    drawGrid,
    spinAnimationStub,
    showMultiplierFx,
    renderWinnersTicker,
    syncAll,
    playClick,
    playSpin,
    playWin
  };

  document.addEventListener("DOMContentLoaded", ()=>{
    renderWinnersTicker();
  });
})();
