/* Beyondesk enquiry form: four steps, posts to /api/enquiry.
   If the endpoint is not set up yet, or fails, it offers the same answers as a ready written email. */
(function(){
  var ADDRESS = "hello@beyondesk.co.uk";
  var form = document.getElementById("enqForm");
  if (!form) return;
  var steps = [].slice.call(form.querySelectorAll("fieldset"));
  var bar = form.querySelector(".enq-bar i"), count = form.querySelector(".enq-count");
  var back = form.querySelector(".enq-back"), next = form.querySelector(".enq-next"), err = form.querySelector(".enq-err");
  var box = document.getElementById("enq"), i = 0, started = false;
  function track(name, extra){ try { (window.dataLayer = window.dataLayer || []).push(Object.assign({event: name, form: "enquiry"}, extra || {})); } catch(e){} }

  function show(n){
    i = n;
    steps.forEach(function(s, k){ s.classList.toggle("on", k === i); });
    bar.style.width = ((i + 1) / steps.length * 100) + "%";
    count.textContent = "Step " + (i + 1) + " of " + steps.length;
    back.hidden = i === 0;
    next.textContent = i === steps.length - 1 ? "Send my enquiry" : "Continue";
    err.textContent = "";
  }
  function val(name){ var el = form.elements[name]; if (!el) return ""; if (el.length && !el.tagName){ for (var k = 0; k < el.length; k++){ if (el[k].checked) return el[k].value; } return ""; } return (el.value || "").trim(); }
  function check(n){
    var s = steps[n], bad = null;
    [].slice.call(s.querySelectorAll("[required]")).forEach(function(el){
      var ok;
      if (el.type === "radio") ok = !!s.querySelector('input[name="' + el.name + '"]:checked');
      else if (el.type === "email") ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
      else ok = !!el.value.trim();
      el.classList.toggle("bad", !ok && el.type !== "radio");
      if (!ok && !bad) bad = el;
    });
    if (bad){
      var label = bad.type === "radio" ? s.querySelector("legend").textContent : (bad.closest("label") ? bad.closest("label").querySelector("span").textContent.replace(/\(.*\)/, "").trim() : "this field");
      err.textContent = bad.type === "email" && bad.value ? "Please check the email address." : "Please complete: " + label + ".";
      if (bad.type !== "radio") bad.focus();
      return false;
    }
    return true;
  }
  function tasks(){ return [].slice.call(form.querySelectorAll('input[name="task"]:checked')).map(function(c){ return c.value; }).join(", "); }
  function summary(d){
    return "Trade: " + d.trade + "\nRole: " + d.role + "\nStart: " + d.start + "\nSystems: " + (d.systems || "not given") +
      "\nWhat to take off their plate: " + (d.notes || "not given") + "\n\nName: " + d.name + "\nCompany: " + d.company + "\nEmail: " + d.email + "\nPhone: " + (d.phone || "not given");
  }
  function data(){
    var t = tasks(), n = val("notes");
    return { trade: val("trade"), role: val("role"), start: val("start"), systems: val("systems"),
             notes: (t ? "Tasks ticked: " + t + (n ? "\n\n" : "") : "") + n,
             name: val("name"), company: val("company"), email: val("email"), phone: val("phone"), website: val("website"),
             page: location.pathname };
  }
  function done(d){
    box.innerHTML = '<div class="enq-done" role="status"><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7"/></svg></span>' +
      '<h3>Thanks, ' + esc(d.name.split(" ")[0]) + '. Your enquiry is in.</h3>' +
      '<p>We will come back to you at ' + esc(d.email) + ' with a written cost for the role and a straight answer on whether this fits.</p></div>';
    track("enquiry_submit", {trade: d.trade, role: d.role});
  }
  function fallback(d){
    var href = "mailto:" + ADDRESS + "?subject=" + encodeURIComponent("Beyondesk enquiry: " + d.trade) + "&body=" + encodeURIComponent(summary(d));
    box.innerHTML = '<div class="enq-done" role="status"><h3>Nearly there. Send it by email.</h3>' +
      '<p>We could not send your enquiry automatically. Your answers are ready in an email, so it only takes one tap.</p>' +
      '<a class="enq-next" href="' + href + '">Open the email</a>' +
      '<p class="enq-addr">Or email us at <code>' + ADDRESS + '</code> <button type="button" class="enq-copy">Copy</button></p></div>';
    var c = box.querySelector(".enq-copy");
    c.addEventListener("click", function(){
      var code = box.querySelector("code");
      try { navigator.clipboard.writeText(ADDRESS).then(function(){ c.textContent = "Copied"; }, sel); } catch(e){ sel(); }
      function sel(){ var r = document.createRange(); r.selectNodeContents(code); var w = getSelection(); w.removeAllRanges(); w.addRange(r); }
    });
    track("enquiry_fallback", {trade: d.trade});
  }
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }

  form.addEventListener("input", function(){ if (!started){ started = true; track("enquiry_start", {page: location.pathname}); } }, {once: false});
  form.addEventListener("change", function(e){ if (e.target.type === "radio" && i < steps.length - 1 && steps[i].contains(e.target) && steps[i].querySelectorAll("[required]").length === steps[i].querySelectorAll('input[type=radio][required]').length){ setTimeout(function(){ if (check(i)){ track("enquiry_step", {step: i + 1}); show(i + 1); } }, 180); } });
  back.addEventListener("click", function(){ if (i > 0) show(i - 1); });
  form.addEventListener("submit", function(e){
    e.preventDefault();
    if (!check(i)) return;
    if (i < steps.length - 1){ track("enquiry_step", {step: i + 1}); show(i + 1); return; }
    var d = data();
    if (d.website) return done(d);            // bot trap
    next.disabled = true; next.textContent = "Sending...";
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function(){ if (ctrl) ctrl.abort(); }, 12000);
    fetch("/api/enquiry", { method: "POST", headers: {"Content-Type": "application/json", "Accept": "application/json"}, body: JSON.stringify(d), signal: ctrl ? ctrl.signal : undefined })
      .then(function(r){ return r.json().catch(function(){ return {ok:false}; }).then(function(j){ return r.ok && j && j.ok; }); })
      .catch(function(){ return false; })
      .then(function(ok){ clearTimeout(timer); ok ? done(d) : fallback(d); });
  });
  show(0);

  /* Task picker: the ticked tasks recommend a role until the visitor picks one themselves.
     c = phone, scheduling or compliance work, a = written office admin, f = invoicing and reminders, x = bookkeeping. */
  var picked = false, roleInputs = [].slice.call(form.querySelectorAll('input[name="role"][data-r]'));
  function pickRole(r){
    roleInputs.forEach(function(el){ el.checked = el.getAttribute("data-r") === r; });
  }
  function recommend(){
    var k = {};
    [].forEach.call(form.querySelectorAll('input[name="task"]:checked'), function(c){ k[c.getAttribute("data-k")] = true; });
    var r = k.c && k.x ? "cx" : k.c ? "c" : k.x && k.a ? "cx" : k.x ? "x" : (k.a || k.f) ? "a" : "";
    roleInputs.forEach(function(el){ var tag = el.parentNode.querySelector(".enq-rec"); if (tag) tag.hidden = !r || el.getAttribute("data-r") !== r; });
    if (r && !picked) pickRole(r);
  }
  form.addEventListener("change", function(e){
    if (e.target.name === "task") recommend();
    else if (e.target.name === "role" && e.isTrusted !== false) picked = true;
  });
  /* "Choose" buttons on the role cards preselect that role in the form */
  [].forEach.call(document.querySelectorAll("[data-pick]"), function(a){
    a.addEventListener("click", function(){ picked = true; pickRole(a.getAttribute("data-pick")); track("role_card_click", {role: a.getAttribute("data-pick")}); });
  });

  /* Sticky bar on phones: shows after the first screen, hides while the form is on screen. */
  var sticky = document.querySelector(".enq-sticky");
  if (sticky && "IntersectionObserver" in window){
    var formVisible = false, past = false;
    function upd(){ sticky.classList.toggle("show", past && !formVisible); }
    new IntersectionObserver(function(es){ formVisible = es[0].isIntersecting; upd(); }, {threshold: 0}).observe(document.getElementById("enquire"));
    window.addEventListener("scroll", function(){ var p = window.scrollY > window.innerHeight * .8; if (p !== past){ past = p; upd(); } }, {passive: true});
    sticky.querySelector("a").addEventListener("click", function(){ track("sticky_cta_click"); });
  }
})();
