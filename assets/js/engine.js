(function(){
  const S = window.AppState;

  // random sembol seç (hem normal ikonlar hem bazen multiplier)
  function randomSymbol() {
    // %85 normal sembol, %15 multiplier gibi kaba bir dağılım verebiliriz
    const roll = Math.random();
    if (roll < 0.15) {
      // multiplier
      const m = S.MULTIPLIER_SYMBOLS[
        Math.floor(Math.random()*S.MULTIPLIER_SYMBOLS.length)
      ];
      return m;
    } else {
      // base
      return S.SYMBOLS_BASE[
        Math.floor(Math.random()*S.SYMBOLS_BASE.length)
      ];
    }
  }

  // 6x5 grid üret (columns[col][row])
  function generateGrid() {
    const cols = [];
    for (let c=0;c<6;c++){
      const col=[];
      for (let r=0;r<5;r++){
        col.push(randomSymbol());
      }
      cols.push(col);
    }
    return cols;
  }

  // clusterları bul (aynı base sembolden 8+ adet)
  // multipliers ayrı davranır, cluster olarak sayılmaz
  function findClusters(grid) {
    // count base symbols
    const counts = {};
    const coordMap = {}; // symbol -> array of {c,r}
    for (let r=0;r<5;r++){
      for (let c=0;c<6;c++){
        const sym = grid[c][r];
        if (!sym) continue;
        if (isMultiplier(sym)) continue;
        if (!counts[sym]) {
          counts[sym]=0;
          coordMap[sym]=[];
        }
        counts[sym]++;
        coordMap[sym].push({c,r});
      }
    }

    const clusters = [];
    for (const sym in counts){
      if (counts[sym] >= 8){
        clusters.push({
          symbol: sym,
          cells: coordMap[sym],
          count: counts[sym]
        });
      }
    }
    return clusters;
  }

  // multipliers bul (x2/x5/x10)
  function findMultipliers(grid){
    const found = [];
    for (let r=0;r<5;r++){
      for (let c=0;c<6;c++){
        const sym = grid[c][r];
        if (isMultiplier(sym)) {
          found.push({c,r, value: parseMultiplier(sym)});
        }
      }
    }
    return found;
  }

  function isMultiplier(sym){
    return sym === "x2" || sym === "x5" || sym === "x10";
  }

  function parseMultiplier(sym){
    // "x2" -> 2
    // "x10" -> 10
    return parseFloat(sym.replace("x",""));
  }

  // kazanç değeri: örnek formül
  // clusterCount * betAmount * 0.25
  // (bunu ileride tabloya çevirebiliriz)
  function basePayoutForCluster(clusterCount, bet){
    return bet * clusterCount * 0.25;
  }

  // cluster ve multiplier hücrelerini boşalt (null yap)
  function clearCells(grid, cells){
    cells.forEach(({c,r})=>{
      grid[c][r] = null;
    });
  }

  // Gravity: boş hücreler yukarı çekilip doldurulsun
  // yani sütun bazlı aşağı kaydırma
  function applyGravityAndRefill(grid){
    for (let c=0;c<6;c++){
      const col = grid[c];
      // çek aşağı: null olmayanları topla
      const compact = col.filter(v=>v!==null);
      // kaç tane eksik?
      const missing = 5 - compact.length;
      // üstten yeni semboller ekle
      const newOnTop = [];
      for (let i=0;i<missing;i++){
        newOnTop.push(randomSymbol());
      }
      grid[c] = newOnTop.concat(compact); // üstte yeniler, altta kalanlar
    }
  }

  // Tek bir TAM SPIN simülasyonu:
  // 1. kullanıcı bet öder (henüz ekonomi düşmedik, settlement sonunda)
  // 2. grid oluştur
  // 3. cascade loop çalıştır: cluster patlat + multiplier topla + gravity
  // 4. final kazancı ve final multiplier'ı döndür
  function runFullSpin() {
    // reset runtime spin state
    S.runningMultiplier = 1.00;
    S.spinBaseWin       = 0.00;

    // başlangıç grid
    let grid = generateGrid();

    // cascade loop
    cascadeLoop: while(true){
      // multipliers bul
      const mults = findMultipliers(grid);
      if(mults.length){
        let addMulti = 0;
        mults.forEach(m=>{ addMulti += m.value; });
        // toplayıcı multiplier mantığı:
        // x2 + x5 + x10 -> toplam 17
        S.runningMultiplier += addMulti;
        // hepsini temizle
        clearCells(grid, mults);
      }

      // clusters bul
      const clusters = findClusters(grid);
      if(clusters.length){
        // her cluster için ödeme topla
        clusters.forEach(cl=>{
          const gain = basePayoutForCluster(cl.count, S.betAmount);
          S.spinBaseWin += gain;
          // cluster hücrelerini temizle
          clearCells(grid, cl.cells);
        });

        // gravity+refill uygula
        applyGravityAndRefill(grid);

        // bu spin devam edecek (sonsuz kazanç hissi)
        continue cascadeLoop;
      } else {
        // cluster yok → bitir
        break cascadeLoop;
      }
    }

    const finalMultiplier = S.runningMultiplier;
    const finalWin = S.spinBaseWin * finalMultiplier;

    return {
      gridFinal: grid,
      finalMultiplier,
      finalWin
    };
  }

  // settlement: şimdi ekonomi çalışır.
  // artık ödeme finalWin'e göre yapılıyor.
  //
  // houseCut ve referral mantığı:
  // - totalBet = S.betAmount
  // - houseCut = totalBet * houseCutRate
  // - referralCut = houseCut * referralShareOfHouse
  // - platformCut = houseCut - referralCut
  // - pool += totalBet - houseCut
  // sonra player kazancı: finalWin
  //
  function settleSpinEconomy(finalWin) {
    const bet = S.betAmount;
    if (bet > S.user.balanceTon) {
      return {payout:0};
    }

    // oyuncu bahsi öder
    S.user.balanceTon = parseFloat((S.user.balanceTon - bet).toFixed(6));
    S.user.walletBalance = S.user.balanceTon; // profil ekran sync

    // sistem kesintileri
    const houseCut      = bet * S.houseCutRate;
    const referralCut   = houseCut * S.referralShareOfHouse;
    const platformCut   = houseCut - referralCut;
    const toPool        = bet - houseCut;

    // havuzu büyüt
    S.prizePoolTon = parseFloat((S.prizePoolTon + toPool).toFixed(6));

    // referral kazancı
    S.user.referralEarnings = parseFloat(
      (S.user.referralEarnings + referralCut).toFixed(6)
    );

    // platform bakiyesi
    S.platformBalance = parseFloat(
      (S.platformBalance + platformCut).toFixed(6)
    );

    // oyuncu kazandı mı?
    let payout = finalWin;
    if (payout > 0){
      // havuzdan öde
      if (payout > S.prizePoolTon) payout = S.prizePoolTon;
      S.prizePoolTon = parseFloat((S.prizePoolTon - payout).toFixed(6));

      // oyuncunun hem cüzdan hem havuz bakiyesi artabilir.
      // burada oyuncunun "poolBalance"ına da yansıtabiliriz veya direkt wallet'a.
      // Şu anda direkt cüzdan bakiyesine yazıyoruz:
      S.user.balanceTon = parseFloat((S.user.balanceTon + payout).toFixed(6));
      S.user.walletBalance = S.user.balanceTon;

      // istatistiklere yansıt
      S.user.totalWinnings = parseFloat(
        (S.user.totalWinnings + payout).toFixed(6)
      );

      // ticker güncelle
      S.winnersTicker.unshift({
        name: "YOU",
        amt: payout.toFixed(2) + " " + S.currency
      });
      if (S.winnersTicker.length>12) S.winnersTicker.pop();
    }

    // history
    S.history.unshift({
      bet: bet.toFixed(2),
      win: payout.toFixed(2),
      balanceAfter: S.user.balanceTon.toFixed(2),
      ts: Date.now()
    });

    return {payout};
  }

  window.Engine = {
    runFullSpin,
    settleSpinEconomy
  };
})();
