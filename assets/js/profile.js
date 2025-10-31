(function(){
  const S = window.AppState;

  const profileUsernameEl = document.getElementById("profileUsername");
  const refCodeEl         = document.getElementById("refCode");
  const copyBtn           = document.getElementById("copyRef");

  const btnDepositToPool     = document.getElementById("btnDepositToPool");
  const btnWithdrawFromPool  = document.getElementById("btnWithdrawFromPool");

  function syncProfileTexts(){
    profileUsernameEl.textContent = S.user.name;
    refCodeEl.textContent = S.user.refCode;
  }

  copyBtn.addEventListener("click", ()=>{
    const msg = "Join Throne of Nemrut with my code: " + S.user.refCode;
    if(navigator.clipboard){
      navigator.clipboard.writeText(msg)
        .then(()=>alert("Referral code copied ✅"))
        .catch(()=>alert("Copy failed"));
    } else {
      alert(msg);
    }
  });

  // deposit wallet -> pool (no fee)
  btnDepositToPool.addEventListener("click", ()=>{
    const amount = prompt("Amount to deposit to pool?");
    if(!amount) return;
    const amt = parseFloat(amount);
    if(isNaN(amt) || amt <= 0) {
        alert("Invalid amount");
        return;
    }
    if (S.user.walletBalance < amt){
        alert("Not enough wallet balance");
        return;
    }
    // move from wallet to pool
    S.user.walletBalance = parseFloat((S.user.walletBalance - amt).toFixed(6));
    S.user.poolBalance   = parseFloat((S.user.poolBalance + amt).toFixed(6));
    S.user.balanceTon    = S.user.walletBalance;
    alert("Deposited " + amt.toFixed(2) + " " + S.currency + " to pool.");
  });

  // withdraw pool -> wallet (1 TON fee)
  btnWithdrawFromPool.addEventListener("click", ()=>{
    const amount = prompt("Amount to withdraw to wallet? (1 TON fee)");
    if(!amount) return;
    const amt = parseFloat(amount);
    if(isNaN(amt) || amt <= 0) {
        alert("Invalid amount");
        return;
    }

    const fee = 1.0;
    const total = amt + fee;
    if (S.user.poolBalance < total){
        alert("Not enough pool balance (need amount + 1 TON fee)");
        return;
    }

    S.user.poolBalance   = parseFloat((S.user.poolBalance - total).toFixed(6));
    S.user.walletBalance = parseFloat((S.user.walletBalance + amt).toFixed(6));
    S.user.balanceTon    = S.user.walletBalance;
    alert(
      "Withdrew " + amt.toFixed(2) + " " + S.currency +
      " to wallet. 1 TON fee applied."
    );
  });

  document.addEventListener("DOMContentLoaded", ()=>{
    syncProfileTexts();
  });
})();
