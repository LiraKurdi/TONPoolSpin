(function(){
  const S  = window.AppState;
  const UI = window.UI;

  const homeUsernameEl  = document.getElementById("homeUsername");
  const currencySelect  = document.getElementById("currencySelect");

  function syncHomeInfo(){
    homeUsernameEl.textContent = S.user.name;
    currencySelect.value = S.currency;
  }

  currencySelect.addEventListener("change", ()=>{
    S.currency = currencySelect.value;
    UI.syncAll();
  });

  document.addEventListener("DOMContentLoaded", ()=>{
    syncHomeInfo();
  });
})();
