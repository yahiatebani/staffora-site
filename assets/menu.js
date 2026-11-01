/* Phone menu: solid header while open, close icon, closes after a link tap */
(function(){
  var top = document.querySelector(".top"), btn = document.getElementById("menuBtn"), nav = document.getElementById("mnav");
  if (!top || !btn || !nav) return;
  var OPEN = btn.innerHTML;
  var CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  function sync(){
    var open = nav.classList.contains("open");
    top.classList.toggle("menu-open", open);
    document.documentElement.classList.toggle("menu-on", open);
    btn.innerHTML = open ? CLOSE : OPEN;
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  btn.addEventListener("click", function(){ setTimeout(sync, 0); });
  nav.addEventListener("click", function(e){
    if (e.target.closest("a")){ nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); sync(); }
  });
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" && nav.classList.contains("open")){ nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); sync(); btn.focus(); }
  });
})();
