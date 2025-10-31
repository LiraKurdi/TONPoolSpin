(function(){
  const S = window.AppState;

  const profileUsernameEl = document.getElementById("profileUsername");
  const refCodeEl         = document.getElementById("refCode");
  const copyBtn           = document.getElementById("copyRef");

  function syncProfileTexts(){
    profileUsernameEl.textContent = S.user.name;
    refCodeEl.textContent = S.user.refCode;
  }

  copyBtn.addEventListener("click", ()=>{
    const msg = "Join TON SLOT with my code: " + S.user.refCode;
    if(navigator.clipboard){
      navigator.clipboard.writeText(msg)
        .then(()=>alert("Kod panoya kopyalandı ✅"))
        .catch(()=>alert("Kopyalanamadı"));
    } else {
      alert(msg);
    }
  });

  document.addEventListener("DOMContentLoaded", ()=>{
    syncProfileTexts();
  });
})();
