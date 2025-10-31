window.AppState = {
  // protocol economics
  houseCutRate: 0.035,        // 3.5% protocol fee per spin
  referralShareOfHouse: 0.20, // 20% of that fee goes to referrer forever

  // user data
  user: {
    name: "Turgut",
    refCode: "CPCL-94X",

    // liquid wallet balance (spendable for spins)
    balanceTon: 124.53,

    // profile stats
    totalWinnings: 0.00,
    referralEarnings: 0.00,

    // split balances
    poolBalance: 0.00,     // user's "in-pool" balance
    walletBalance: 124.53  // wallet balance mirror
  },

  // spin / betting
  betAmount: 0.20, // Pool Spin Fee
  betStep: 0.20,
  minBet: 0.20,
  maxBet: 5.00,
  autoMode: false,

  // runtime spin state
  runningMultiplier: 1.00,    // x1.00 base
  spinBaseWin: 0.00,          // base sum before multiplier

  // pool + protocol
  prizePoolTon: 350.00,       // global pool TVL for payouts
  platformBalance: 0.00,      // protocol retained fee
  history: [],                // {bet, win, mult, balanceAfter, ts}

  // currency
  currency: "TON",            // TON / USDT / TRY / EUR / RUB / UZS

  // winners ticker
  winnersTicker: [
    {name:"0xAydin",  amt:"312.4 TON"},
    {name:"0xKurd",   amt:"88.9 TON"},
    {name:"0xRebel",  amt:"12.7 TON"},
    {name:"0xNemrut", amt:"120.0 TON"},
    {name:"0xTON",    amt:"55.5 TON"},
  ],

  // symbols
  SYMBOLS_BASE: ["💎","⚡","👑","🗝️","🏛️","💰","🔥","🌀"],
  MULTIPLIER_SYMBOLS: ["x2","x5","x10"],

  // sfx refs
  sfx: {
    click: null,
    spin: null,
    win: null
  }
};
