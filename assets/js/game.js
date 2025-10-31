(function(){
  const S = window.AppState;

  function generateSpinGrid() {
    const cols = [];
    for (let c = 0; c < 6; c++) {
      const colSyms = [];
      for (let r = 0; r < 5; r++) {
        const sym = S.SYMBOLS[Math.floor(Math.random() * S.SYMBOLS.length)];
        colSyms.push(sym);
      }
      cols.push(colSyms);
    }
    return cols;
  }

  function evaluateGrid(columns) {
    const counts = {};
    let idx = 0;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 6; col++) {
        const sym = columns[col][row];
        if (!counts[sym]) counts[sym] = { n:0, idxs:[] };
        counts[sym].n++;
        counts[sym].idxs.push(idx);
        idx++;
      }
    }
    let best = null;
    for (const sym in counts) {
      const g = counts[sym];
      if (g.n >= 8) {
        if (!best || g.n > best.n) {
          best = { symbol: sym, n: g.n, idxs: g.idxs };
        }
      }
    }
    return best;
  }

  // ekonomi / havuz / referral
  function settleSpin(bestWin) {
    const bet = S.betAmount;
    if (bet > S.user.balanceTon) return {payout:0, multi:0};

    // 1. Oyuncu bahsi öder
    S.user.balanceTon = parseFloat((S.user.balanceTon - bet).toFixed(6));

    // 2. House cut
    const houseCut = bet * S.houseCutRate; // %3.5
    const referralCut = houseCut * S.referralShareOfHouse; // %20 of house
    const platformCut = houseCut - referralCut;

    // 3. Havuz besleniyor
    const toPool = bet - houseCut;
    S.prizePoolTon = parseFloat((S.prizePoolTon + toPool).toFixed(6));

    // 4. Referral kazanıyor (şimdilik hep sana yazıyoruz)
    S.user.referralEarnings = parseFloat(
      (S.user.referralEarnings + referralCut).toFixed(6)
    );

    // 5. Bizim platform kesesi
    S.platformBalance = parseFloat(
      (S.platformBalance + platformCut).toFixed(6)
    );

    // 6. Kazanç var mı?
    let payout = 0;
    let multi = 0;
    if (bestWin) {
      // geçici multiplier formülü
      multi = parseFloat((bestWin.n * 0.2).toFixed(2));
      payout = bet * multi;

      // havuz sınırı
      if (payout > S.prizePoolTon) {
        payout = S.prizePoolTon;
      }
      S.prizePoolTon = parseFloat((S.prizePoolTon - payout).toFixed(6));

      // oyuncuya ödeme
      S.user.balanceTon = parseFloat((S.user.balanceTon + payout).toFixed(6));
      S.user.totalWinnings = parseFloat(
        (S.user.totalWinnings + payout).toFixed(6)
      );

      // ticker güncelle
      S.winnersTicker.unshift({
        name: "YOU",
        amt: payout.toFixed(2) + " TON"
      });
      if (S.winnersTicker.length > 12) S.winnersTicker.pop();
    }

    // 7. History
    S.history.unshift({
      bet: bet.toFixed(2),
      win: payout.toFixed(2),
      balanceAfter: S.user.balanceTon.toFixed(2),
      ts: Date.now()
    });

    return {payout, multi};
  }

  window.GameEngine = {
    generateSpinGrid,
    evaluateGrid,
    settleSpin
  };
})();
