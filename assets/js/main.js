(function(){
  const S  = window.AppState;
  const UI = window.UI;
  const E  = window.Engine;

  const btnSpin = document.getElementById("btnSpin");
  const btnAuto = document.getElementById("btnAuto");
  const btnBet  = document.getElementById("btnBet");

  // tabbar navigation
  document.querySelectorAll(".tab-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const v = btn.getAttribute("data-view");
      UI.showView(v);
    });
  });

  // run a spin
  function doSpin(){
    if(S.betAmount <= 0) return;
    if(S.user.balanceTon <= 0 || S.betAmount > S.user.balanceTon){
      alert("Insufficient balance 😢");
      return;
    }

    UI.playSpin();

    // run cascade + multipliers
    const spinResult = E.runFullSpin();
    // { gridFinal, finalMultiplier, finalWin }

    // settle economy
    const { payout } = E.settleSpinEconomy(
      spinResult.finalWin,
      spinResult.finalMultiplier
    );

    // draw final grid + animate flash
    UI.spinAnimationStub(spinResult.gridFinal, ()=>{

      // multiplier bubble
      UI.showMultiplierFx(spinResult.finalMultiplier);

      // win tier
      const tierTxt = E.getWinTierText(spinResult.finalWin, S.betAmount);

      // show win banner (only if >0)
      UI.showWinBanner({
        tier: tierTxt,
        amount: payout.toFixed(2),
        currency: S.currency,
        mult: "x"+spinResult.finalMultiplier.toFixed(2)
      });

      // resync UI balances / multiplier label
      UI.syncAll();

      // update ticker + history
      UI.renderWinnersTicker();
      UI.renderHistoryStrip();
    });
  }

  // SPIN button
  btnSpin.addEventListener("click", ()=>{
    UI.playClick();
    doSpin();
  });

  // BET+ button: cycle bet
  btnBet.addEventListener("click", ()=>{
    UI.playClick();
    S.betAmount = parseFloat((S.betAmount + S.betStep).toFixed(2));
    if(S.betAmount > S.maxBet){
      S.betAmount = S.minBet;
    }
    UI.syncAll();
  });

  // AUTO button
  btnAuto.addEventListener("click", ()=>{
    UI.playClick();

    S.autoMode = !S.autoMode;
    btnAuto.classList.toggle("auto-on", S.autoMode);
    btnAuto.textContent = S.autoMode ? "AUTO ON" : "AUTO";

    if(S.autoMode){
      window.autoInterval = setInterval(()=>{
        if(!S.autoMode) return;
        doSpin();
      }, 1000);
    } else {
      clearInterval(window.autoInterval);
    }
  });

  // INIT APP
  function initApp(){
    // seed first grid (static, only base symbols, no multipliers)
    const firstGrid = (function(){
      const cols=[];
      for(let c=0;c<6;c++){
        const col=[];
        for(let r=0;r<5;r++){
          col.push(S.SYMBOLS_BASE[Math.floor(Math.random()*S.SYMBOLS_BASE.length)]);
        }
        cols.push(col);
      }
      return cols;
    })();
    UI.drawGrid(firstGrid);

    UI.renderWinnersTicker();
    UI.renderHistoryStrip();
    UI.syncAll();
    UI.showView("home");
  }

  document.addEventListener("DOMContentLoaded", initApp);
})();
