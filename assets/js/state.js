window.AppState = {
  // ekonomi oranları
  houseCutRate: 0.035,          // %3.5
  referralShareOfHouse: 0.20,   // bu %3.5 içinden %20 referrala gider

  // kullanıcı bilgileri
  user: {
    name: "Turgut",
    refCode: "CPCL-94X",

    // oynanabilir bakiye (kullanıcının "cüzdan bakiyesi" gibi düşünebilirsin)
    balanceTon: 124.53,

    // profil istatistikleri
    totalWinnings: 0.00,
    referralEarnings: 0.00,

    // havuz bakiyesi (çekilebilir havuz payı)
    poolBalance: 0.00, // kullanıcıya ait pay
    walletBalance: 124.53 // cüzdan bakiyesi (ayrı gösteriyoruz)
  },

  // oyun / bahis
  betAmount: 0.20,
  betStep: 0.20,
  minBet: 0.20,
  maxBet: 5.00,
  autoMode: false,

  // runtime spin state
  runningMultiplier: 1.00,      // x1.00 başlangıç
  spinBaseWin: 0.00,            // cascade içindeki sembol kazançları toplamı (multipliers hariç)

  // havuz & platform
  prizePoolTon: 350.00,         // global havuz
  platformBalance: 0.00,        // bize kalan kısım
  history: [],                  // {bet, win, afterBalance, ts}

  // para birimi
  currency: "TON",              // TON / USDT / TRY / EUR / RUB / UZS
  // gelecekte: rate tablosu buraya gelecek (TON -> diğerleri)

  // kazananlar ticker
  winnersTicker: [
    {name:"0xAydin",  amt:"312.4 TON"},
    {name:"0xKurd",   amt:"88.9 TON"},
    {name:"0xRebel",  amt:"12.7 TON"},
    {name:"0xNemrut", amt:"120.0 TON"},
    {name:"0xTON",    amt:"55.5 TON"},
  ],

  // semboller
  SYMBOLS_BASE: ["💎","⚡","👑","🗝️","🏛️","💰","🔥","🌀"],
  MULTIPLIER_SYMBOLS: ["x2","x5","x10"], // çarpan düşebilir

  // sesler
  sfx: {
    click: null,
    spin: null,
    win: null
  }
};
