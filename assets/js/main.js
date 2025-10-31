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

  // ana SPIN akışı
  function doSpin(){
    // yeterli bakiye?
    if(S.betAmount <= 0) return;
    if(S.user.balanceTon <= 0 || S.betAmount > S.user.balanceTon){
      alert("Yetersiz bakiye 😢");
      return;
    }

    UI.playSpin();

    // tam spin simülasyonu (cascade + multipliers)
    const spinResult = E.runFullSpin();
    // spinResult.gridFinal, spinResult.finalMultiplier, spinResult.finalWin

    // küçük görsel animasyon ile final grid'i bastık
    UI.spinAnimationStub(spinResult.gridFinal, ()=>{

      // ekonomiyi hesapla
      const { payout } = E.settleSpinEconomy(spinResult.finalWin);

      // kazanç varsa multiplier FX göster
      if (spinResult.finalMultiplier > 1 || payout > 0){
        UI.showMultiplierFx(spinResult.finalMultiplier);
      }

      // running multiplier'i UI'da güncelle
      UI.syncAll();

      // ticker'ı yenile
      UI.renderWinnersTicker();
    });
  }

  // SPIN butonu
  btnSpin.addEventListener("click", ()=>{
    UI.playClick();
    doSpin();
  });

  // BET butonu
  btnBet.addEventListener("click", ()=>{
    UI.playClick();
    S.betAmount = parseFloat((S.betAmount + S.betStep).toFixed(2));
    if(S.betAmount > S.maxBet){
      S.betAmount = S.minBet;
    }
    UI.syncAll();
  });

  // AUTO butonu
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
    // başlangıç gridini çiz
    const firstGrid = (function(){
      // başlangıç için Engine'den grid çekmeden şans sembolleri basalım
      const cols=[];
      for(let c=0;c<6;c++){
        const col=[];
        for(let r=0;r<5;r++){
          // ilk setup'ta multiplier düşmesini istemiyoruz -> base sembol
          col.push(S.SYMBOLS_BASE[Math.floor(Math.random()*S.SYMBOLS_BASE.length)]);
        }
        cols.push(col);
      }
      return cols;
    })();
    UI.drawGrid(firstGrid);

    UI.renderWinnersTicker();
    UI.syncAll();
    UI.showView("home");
  }

  document.addEventListener("DOMContentLoaded", initApp);
})();
