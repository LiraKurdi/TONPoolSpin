(function(){
  const S = window.AppState;

  // probability: 85% base symbol / 15% multiplier
  function randomSymbol() {
    const roll = Math.random();
    if (roll < 0.15) {
      const m = S.MULTIPLIER_SYMBOLS[
        Math.floor(Math.random()*S.MULTIPLIER_SYMBOLS.length)
      ];
      return m;
    } else {
      return S.SYMBOLS_BASE[
        Math.floor(Math.random()*S.SYMBOLS_BASE.length)
      ];
    }
  }

  // create 6x5 grid [col][row]
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

  function isMultiplier(sym){
    return sym === "x2" || sym === "x5" || sym === "x10";
  }

  function parseMultiplier(sym){
    return parseFloat(sym.replace("x",""));
  }

  // find multiplier stones in grid
  function findMultipliers(grid){
    const found = [];
    for (let r=0;r<5;r++){
      for (let c=0;c<6;c++){
        const sym = grid[c][r];
        if (isMultiplier(sym)) {
          found.push({c,r,value:parseMultiplier(sym)});
        }
      }
    }
    return found;
  }

  // find clusters of same base symbol with count >= 8
  function findClusters(grid){
    const counts = {};
    const coordMap = {};
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
          count: counts[sym],
          cells: coordMap[sym]
        });
      }
    }
    return clusters;
  }

  // formula for base win before multiplier
  // reward grows with cluster size and bet amount
  function basePayoutForCluster(clusterCount, bet){
    return bet * clusterCount * 0.25;
  }

  // clear chosen cells (set null)
  function clearCells(grid, cells){
    cells.forEach(({c,r})=>{
      grid[c][r] = null;
    });
  }

  // gravity + refill (column-wise)
  function applyGravityAndRefill(grid){
    for (let c=0;c<6;c++){
      const col = grid[c];
      const compact = col.filter(v=>v!==null);
      const missing = 5 - compact.length;
      const refillNew = [];
      for (let i=0;i<missing;i++){
        refillNew.push(randomSymbol());
      }
      grid[c] = refillNew.concat(compact);
    }
  }

  // runFullSpin:
  // - resets runtime state
  // - cascade loop: collect multipliers, clear clusters, drop new symbols
  // - returns final grid + final multiplier + total win
  function runFullSpin(){
    S.runningMultiplier = 1.00;
    S.spinBaseWin = 0.00;

    let grid = generateGrid();

    cascadeLoop: while(true){
      // collect multipliers first
      const mults = findMultipliers(grid);
      if (mults.length){
        let addMulti = 0;
        mults.forEach(m=>{ addMulti += m.value; });
        S.runningMultiplier += addMulti;
        clearCells(grid, mults);
      }

      // find clusters
      const clusters = findClusters(grid);
      if (clusters.length){
        clusters.forEach(cl=>{
          const gain = basePayoutForCluster(cl.count, S.betAmount);
          S.spinBaseWin += gain;
          clearCells(grid, cl.cells);
        });

        // drop + refill
        applyGravityAndRefill(grid);

        // continue cascade
        continue cascadeLoop;
      } else {
        // no more clears
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

  // economic settlement after spin
  // - deduct fee from wallet
  // - distribute fee (pool growth, platform cut, referral earnings)
  // - pay winnings from pool
  function settleSpinEconomy(finalWin, finalMultiplier){
    const bet = S.betAmount;
    if (bet > S.user.balanceTon) {
      return {payout:0};
    }

    // player pays spin fee
    S.user.balanceTon = parseFloat((S.user.balanceTon - bet).toFixed(6));
    S.user.walletBalance = S.user.balanceTon;

    // protocol fee breakdown
    const houseCut    = bet * S.houseCutRate; // 3.5%
    const refCut      = houseCut * S.referralShareOfHouse; // 20% of fee
    const protocolCut = houseCut - refCut;
    const toPool      = bet - houseCut;

    // pool grows with fee remainder
    S.prizePoolTon = parseFloat((S.prizePoolTon + toPool).toFixed(6));

    // ref earnings
    S.user.referralEarnings = parseFloat(
      (S.user.referralEarnings + refCut).toFixed(6)
    );

    // protocol treasury
    S.platformBalance = parseFloat(
      (S.platformBalance + protocolCut).toFixed(6)
    );

    // payout
    let payout = finalWin;
    if (payout > 0){
      if (payout > S.prizePoolTon) payout = S.prizePoolTon;
      S.prizePoolTon = parseFloat((S.prizePoolTon - payout).toFixed(6));

      // credit player wallet
      S.user.balanceTon = parseFloat((S.user.balanceTon + payout).toFixed(6));
      S.user.walletBalance = S.user.balanceTon;

      // stats
      S.user.totalWinnings = parseFloat(
        (S.user.totalWinnings + payout).toFixed(6)
      );

      // ticker
      S.winnersTicker.unshift({
        name: "YOU",
        amt: payout.toFixed(2) + " " + S.currency
      });
      if (S.winnersTicker.length > 12) {
        S.winnersTicker.pop();
      }
    }

    // push spin history
    S.history.unshift({
      bet: bet.toFixed(2),
      win: payout.toFixed(2),
      mult: "x"+finalMultiplier.toFixed(2),
      balanceAfter: S.user.balanceTon.toFixed(2),
      ts: Date.now()
    });

    return {payout};
  }

  // helper: tier text for win banner
  function getWinTierText(finalWin, bet){
    if (finalWin < bet * 3)  return "COOL WIN";
    if (finalWin < bet * 10) return "GREAT WIN";
    return "INSANE WIN";
  }

  window.Engine = {
    runFullSpin,
    settleSpinEconomy,
    getWinTierText
  };
})();
