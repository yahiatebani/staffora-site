/* Beyondesk desk scenes */

(function(){
  var root = document.getElementById("bdx");
  if (!root) return;
  var $ = function(id){ return document.getElementById(id); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cur = $("bdxCur"), rowsBox = $("bdxRows"), toast = $("bdxToast");
  var run = 0, visible = true;

  var START_ROWS = [
    ["BRK1042","Restaurant","In progress",""],
    ["PPM9931","Hotel","Scheduled",""],
    ["BRK1039","Retail","Awaiting update","o"],
    ["PPM9928","Office","Complete","g"]
  ];
  var TITLES = {jobs:"Jobs overview", ppm:"PPM schedule", certs:"Certificates", quotes:"Quotes and POs", reports:"Reports"};
  var ORDER = ["jobs","ppm","certs","quotes","reports"];
  var page = "jobs";

  /* ---------- timing helpers that pause off screen and cancel on replay ---------- */
  function Stop(){}
  function sleep(ms, token){
    return new Promise(function(res, rej){
      var left = ms, last = performance.now();
      (function tick(now){
        if (token !== run) return rej(new Stop());
        if (visible && !document.hidden) left -= (now - last);
        last = now;
        if (left <= 0) return res();
        requestAnimationFrame(tick);
      })(last);
    });
  }

  /* ---------- primitives ---------- */
  function rel(el){
    var r = root.getBoundingClientRect(), e = el.getBoundingClientRect();
    return {x: e.left - r.left + Math.min(e.width * .5, 40), y: e.top - r.top + e.height * .55};
  }
  function moveTo(el, t, ms){
    var p = rel(el);
    cur.style.transitionDuration = (ms || 500) + "ms";
    cur.style.transform = "translate(" + p.x + "px," + p.y + "px)";
    return sleep(ms || 500, t);
  }
  async function click(el, t){
    cur.classList.remove("click"); void cur.offsetWidth; cur.classList.add("click");
    if (el){ el.classList.add("press"); await sleep(130, t); el.classList.remove("press"); }
    else await sleep(130, t);
  }
  async function type(el, text, t){
    el.textContent = ""; el.classList.add("focus");
    for (var i = 0; i < text.length; i++){ el.textContent += text[i]; await sleep(26, t); }
    el.classList.remove("focus");
  }
  function setKpi(id, v){
    var k = $(id); k.querySelector("b").textContent = v;
    k.classList.add("bump"); setTimeout(function(){ k.classList.remove("bump"); }, 380);
  }
  var toastTimer;
  function say(msg){
    toast.querySelector("span").textContent = msg;
    toast.classList.add("on"); clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toast.classList.remove("on"); }, 1500);
  }
  function flow(step, state, cap){
    var steps = $("bdxSteps"), items = steps.children;
    for (var i = 0; i < items.length; i++){
      items[i].classList.toggle("dk-done", i < step - 1 || (step === 4 && i === 3));
      items[i].classList.toggle("now", i === step - 1 && step < 4);
    }
    steps.style.setProperty("--p", Math.max(0, (step - 1) / 3));
    var s = $("bdxState"); s.textContent = state; s.classList.add("pop"); setTimeout(function(){ s.classList.remove("pop"); }, 300);
    $("bdxCap").textContent = cap;
  }
  function go(p){
    if (p === page) return;
    var from = ORDER.indexOf(page), to = ORDER.indexOf(p);
    root.querySelectorAll(".bdx-pg").forEach(function(el){
      var k = el.getAttribute("data-pg");
      el.classList.remove("left");
      if (k === p){ el.classList.add("on"); }
      else if (k === page){ el.classList.remove("on"); if (to > from) el.classList.add("left"); }
      else el.classList.remove("on");
    });
    root.querySelectorAll(".bdx-nav").forEach(function(n){ n.classList.toggle("on", n.getAttribute("data-p") === p); });
    var h = $("bdxH"), old = h.querySelector("span"), nw = document.createElement("span");
    nw.textContent = TITLES[p]; nw.className = "in"; h.appendChild(nw);
    void nw.offsetWidth; nw.className = ""; old.className = "dk-out";
    setTimeout(function(){ if (old.parentNode) old.remove(); }, 400);
    page = p;
  }
  function nav(p){ return root.querySelector('.bdx-nav[data-p="' + p + '"]'); }

  /* ---------- table ---------- */
  function pill(text, tone){ return '<span class="bdx-pill ' + (tone || "") + '">' + text + "</span>"; }
  function rowEl(r){
    var d = document.createElement("div"); d.className = "bdx-row";
    d.innerHTML = "<span>" + r[0] + "</span><span>" + r[1] + "</span>" + pill(r[2], r[3]);
    return d;
  }
  function layoutRows(){
    var live = [].filter.call(rowsBox.children, function(x){ return !x.classList.contains("gone"); });
    live.forEach(function(x, i){ x.style.setProperty("--i", i); });
    if (live.length > 4){
      var last = live[live.length - 1]; last.classList.add("gone");
      setTimeout(function(){ last.remove(); }, 400);
    }
  }
  function setStatus(row, text, tone){
    var p = row.querySelector(".bdx-pill");
    p.className = "bdx-pill pop " + (tone || ""); p.innerHTML = text;
    setTimeout(function(){ p.classList.remove("pop"); }, 300);
  }

  /* ---------- reset ---------- */
  function reset(){
    rowsBox.innerHTML = "";
    START_ROWS.forEach(function(r){ rowsBox.appendChild(rowEl(r)); });
    layoutRows();
    page = "jobs";
    root.querySelectorAll(".bdx-pg").forEach(function(el){ el.classList.toggle("on", el.getAttribute("data-pg") === "jobs"); el.classList.remove("left"); });
    root.querySelectorAll(".bdx-nav").forEach(function(n){ n.classList.toggle("on", n.getAttribute("data-p") === "jobs"); });
    $("bdxH").innerHTML = "<span>Jobs overview</span>";
    ["k1","k2","k3","k4"].forEach(function(k, i){ $(k).querySelector("b").textContent = [24,8,3,36][i]; });
    $("bdxForm").classList.remove("on"); $("fSite").textContent = ""; $("fFault").textContent = ""; $("fUrgent").classList.remove("sel");
    var ev = $("evMove"); ev.style.setProperty("--d", 1); ev.style.setProperty("--r", 0); ev.classList.remove("lift");
    $("dThu").classList.remove("drop");
    $("cFlag").className = "bdx-cert flag"; $("cTxt").textContent = "Hotel, due in 14 days"; $("cBar").style.setProperty("--w","88%");
    $("cBtn").outerHTML = '<span class="bdx-ghost" id="cBtn">Book visit</span>';
    $("bdxBadge").classList.add("show");
    var tr = $("qTrack").children; for (var i = 0; i < 4; i++){ tr[i].className = i === 0 ? "dk-done" : ""; }
    $("qPO").textContent = "";
    toast.classList.remove("on");
    flow(0, "Waiting for a call", "A breakdown call is coming in");
  }

  /* ---------- the scripted day ---------- */
  async function play(t){
    reset();
    await sleep(500, t);

    // 1. log a new job
    await moveTo($("bdxNew"), t, 520); await click($("bdxNew"), t);
    $("bdxForm").classList.add("on"); await sleep(260, t);
    await moveTo($("fSite"), t, 300); await type($("fSite"), "Restaurant, Unit 4", t);
    await moveTo($("fFault"), t, 260); await type($("fFault"), "Cold room not holding temperature", t);
    await moveTo($("fUrgent"), t, 300); await click(null, t); $("fUrgent").classList.add("sel"); await sleep(160, t);
    await moveTo($("fLog"), t, 320); await click($("fLog"), t);
    $("bdxForm").classList.remove("on");
    var row = rowEl(["BRK1043","Restaurant","Logged","r"]);
    row.classList.add("enter","new"); rowsBox.insertBefore(row, rowsBox.firstChild);
    void row.offsetWidth; row.classList.remove("enter"); layoutRows();
    setKpi("k1", 25); say("Job BRK1043 logged, customer told 10:30");
    flow(1, "Job logged", "Breakdown logged and acknowledged");
    await sleep(800, t);

    // 2. assign the engineer
    await moveTo(row.querySelector(".bdx-pill"), t, 380); await click(null, t);
    setStatus(row, '<i class="bdx-ava"></i>Assigned');
    say("Nearest engineer allocated and notified");
    flow(2, "Engineer assigned", "Engineer allocated and notified");
    await sleep(800, t);

    // 3. PPM schedule: move a visit around site access
    await moveTo(nav("ppm"), t, 480); await click(nav("ppm"), t); go("ppm"); await sleep(380, t);
    var ev = $("evMove");
    await moveTo(ev, t, 380); await click(null, t); ev.classList.add("lift"); $("dThu").classList.add("drop");
    ev.style.setProperty("--d", 3); ev.style.setProperty("--r", 1);
    await sleep(40, t); await moveTo($("dThu"), t, 560);
    ev.classList.remove("lift"); $("dThu").classList.remove("drop");
    setKpi("k2", 7); say("PPM9937 moved to Thursday, site notified");
    await sleep(700, t);

    // 4. certificates: flag and book the renewal
    await moveTo(nav("certs"), t, 420); await click(nav("certs"), t); go("certs"); await sleep(400, t);
    var btn = $("cBtn");
    await moveTo(btn, t, 380); await click(btn, t);
    btn.outerHTML = '<span class="bdx-pill g pop" id="cBtn">Booked</span>';
    $("cFlag").className = "bdx-cert ok"; $("cTxt").textContent = "Hotel, visit booked for Tuesday"; $("cBar").style.setProperty("--w","4%");
    $("bdxBadge").classList.remove("show");
    setKpi("k3", 2); say("Leak check booked before it expires");
    await sleep(750, t);

    // 5. quotes: chase, approve, PO in
    await moveTo(nav("quotes"), t, 420); await click(nav("quotes"), t); go("quotes"); await sleep(380, t);
    var tr = $("qTrack").children;
    tr[1].className = "on"; await sleep(320, t);
    tr[1].className = "dk-done"; tr[2].className = "on"; say("Quote approved by the customer"); await sleep(380, t);
    await moveTo($("qPO"), t, 320); await type($("qPO"), "PO 558170", t);
    tr[2].className = "dk-done"; tr[3].className = "dk-done";
    setStatus(rowsBox.firstChild, '<i class="bdx-ava"></i>In progress');
    flow(3, "In progress", "PO in, engineer on site");
    await sleep(700, t);

    // 6. reports
    await moveTo(nav("reports"), t, 420); await click(nav("reports"), t); go("reports");
    await sleep(1000, t);

    // 7. back to jobs: close it out
    await moveTo(nav("jobs"), t, 420); await click(nav("jobs"), t); go("jobs"); await sleep(420, t);
    var first = rowsBox.firstChild;
    await moveTo(first.querySelector(".bdx-pill"), t, 380); await click(null, t);
    setStatus(first, "Complete", "g");
    setKpi("k1", 24); setKpi("k4", 37);
    say("Job sheet in, invoice sent the same day");
    flow(4, "Completed", "Signed off and invoiced the same day");
    await sleep(2200, t);
  }

  async function loop(){
    var t = ++run;
    try { while (t === run){ await play(t); } } catch(e){ if (!(e instanceof Stop)) throw e; }
  }

  /* static finished state for reduced motion */
  function still(){
    reset();
    var row = rowEl(["BRK1043","Restaurant","Complete","g"]);
    rowsBox.insertBefore(row, rowsBox.firstChild); layoutRows();
    $("k4").querySelector("b").textContent = 37;
    flow(4, "Completed", "Signed off and invoiced the same day");
  }


  if ("IntersectionObserver" in window){
    new IntersectionObserver(function(es){ visible = es[0].isIntersecting; }, {threshold:.15}).observe(root);
  }
  if (reduce) still(); else loop();
})();


/* ===== shared engine for scenes 2 to 4 ===== */
function BxStage(root){
  var st = {run:0, visible:false, root:root};
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cur = root.querySelector(".bdx-cur"), toast = root.querySelector(".bdx-toast"), tt;
  function Stop(){}
  st.$ = function(id){ return document.getElementById(id); };
  st.sleep = function(ms, t){
    return new Promise(function(res, rej){
      var left = ms, last = performance.now();
      (function tick(now){
        if (t !== st.run) return rej(new Stop());
        if (st.visible && !document.hidden) left -= (now - last);
        last = now;
        if (left <= 0) return res();
        requestAnimationFrame(tick);
      })(last);
    });
  };
  st.moveTo = function(el, t, ms){
    var r = root.getBoundingClientRect(), e = el.getBoundingClientRect();
    var x = e.left - r.left + Math.min(e.width * .5, 44), y = e.top - r.top + e.height * .55;
    cur.style.transitionDuration = (ms || 480) + "ms";
    cur.style.transform = "translate(" + x + "px," + y + "px)";
    return st.sleep(ms || 480, t);
  };
  st.click = async function(el, t){
    cur.classList.remove("click"); void cur.offsetWidth; cur.classList.add("click");
    if (el) el.classList.add("press");
    await st.sleep(130, t);
    if (el) el.classList.remove("press");
  };
  st.type = async function(el, text, t, speed){
    el.textContent = ""; el.classList.add("focus");
    for (var i = 0; i < text.length; i++){ el.textContent += text[i]; await st.sleep(speed || 24, t); }
    el.classList.remove("focus");
  };
  st.say = function(msg){
    toast.querySelector("span").textContent = msg; toast.classList.add("on");
    clearTimeout(tt); tt = setTimeout(function(){ toast.classList.remove("on"); }, 1600);
  };
  st.hideToast = function(){ toast.classList.remove("on"); };
  st.start = function(play, reset, still){
    if ("IntersectionObserver" in window){
      new IntersectionObserver(function(es){ st.visible = es[0].isIntersecting; }, {threshold:.15}).observe(root);
    } else st.visible = true;
    if (reduce){ reset(); still(); return; }
    var t = ++st.run;
    (async function(){ try { while (t === st.run){ reset(); await play(t); } } catch(e){ if (!(e instanceof Stop)) throw e; } })();
  };
  return st;
}
function bxMoney(n){ return "£" + n.toLocaleString("en-GB", {minimumFractionDigits:2, maximumFractionDigits:2}); }
function bxCount(el, from, to, ms){
  var t0 = performance.now();
  (function f(now){ var p = Math.min(1, (now - t0) / ms); p = 1 - Math.pow(1 - p, 3);
    el.textContent = bxMoney(from + (to - from) * p); if (p < 1) requestAnimationFrame(f); })(t0);
}
function bxPage(root, name){
  root.querySelectorAll(".pg2").forEach(function(p){
    var on = p.getAttribute("data-pg") === name;
    if (!on && p.classList.contains("on")) p.classList.add("left");
    if (on) p.classList.remove("left");
    p.classList.toggle("on", on);
  });
}

/* ===== scene 2 ===== */
(function(){
  var root = document.getElementById("sc2"); if (!root) return;
  var s = BxStage(root), $ = s.$;
  var prods = root.querySelectorAll(".prod"), lines = ["s2l1","s2l2","s2l3","s2l4"], vals = [535.60, 270, 650, 85];
  function reset(){
    bxPage(root, "sup"); root.querySelectorAll(".pg2").forEach(function(p){ p.classList.remove("left"); });
    $("s2tA").classList.add("on"); $("s2tB").classList.remove("on");
    $("s2url").innerHTML = $("s2url").innerHTML.replace(/<b>.*$/, "<b>trade.yoursupplier.co.uk</b>/refrigeration/compressors");
    $("s2qt").innerHTML = '<span class="dk-phd">Search parts</span>'; $("s2q").classList.remove("focus");
    $("s2res").textContent = "Results";
    prods.forEach(function(p){ p.classList.remove("show","pick"); });
    $("s2det").classList.remove("on");
    lines.forEach(function(id){ $(id).classList.remove("in","hl"); });
    $("s2sub").textContent = $("s2vat").textContent = $("s2tot").textContent = "£0.00";
    var st = $("s2st"); st.className = "bdx-pill"; st.textContent = "Draft";
    s.hideToast();
  }
  async function play(t){
    await s.sleep(450, t);
    await s.moveTo($("s2q"), t, 480); await s.click(null, t);
    $("s2q").classList.add("focus"); $("s2qt").innerHTML = "";
    await s.type($("s2qt"), "compressor 1.5hp R404A", t, 30);
    $("s2q").classList.remove("focus"); $("s2res").textContent = "3 results";
    for (var i = 0; i < prods.length; i++){ prods[i].classList.add("show"); await s.sleep(90, t); }
    await s.sleep(350, t);
    await s.moveTo($("s2pick"), t, 420); await s.click($("s2pick"), t);
    $("s2pick").classList.add("pick"); $("s2det").classList.add("on");
    await s.sleep(600, t);
    await s.moveTo($("s2add"), t, 420); await s.click($("s2add"), t);
    s.say("Part copied to Quote Q2209");
    await s.sleep(450, t);
    await s.moveTo($("s2tB"), t, 460); await s.click(null, t);
    $("s2tA").classList.remove("on"); $("s2tB").classList.add("on");
    $("s2url").innerHTML = $("s2url").innerHTML.replace(/<b>.*$/, "<b>app.beyondesk</b>/quotes/Q2209");
    bxPage(root, "quote"); s.hideToast();
    await s.sleep(380, t);
    var sub = 0;
    for (var k = 0; k < lines.length; k++){
      var l = $(lines[k]); l.classList.add("in"); if (k === 0) l.classList.add("hl");
      var from = sub; sub += vals[k];
      bxCount($("s2sub"), from, sub, 380); bxCount($("s2vat"), from * .2, sub * .2, 380); bxCount($("s2tot"), from * 1.2, sub * 1.2, 380);
      await s.sleep(k === 0 ? 520 : 360, t);
    }
    await s.sleep(500, t);
    await s.moveTo($("s2send"), t, 480); await s.click($("s2send"), t);
    var st = $("s2st"); st.className = "bdx-pill g pop"; st.textContent = "Sent";
    s.say("Quote Q2209 sent, chase booked for Thursday");
    await s.sleep(2200, t);
  }
  function still(){
    prods.forEach(function(p){ p.classList.add("show"); });
    bxPage(root, "quote"); $("s2tA").classList.remove("on"); $("s2tB").classList.add("on");
    lines.forEach(function(id){ $(id).classList.add("in"); });
    var sub = vals.reduce(function(a, b){ return a + b; }, 0);
    $("s2sub").textContent = bxMoney(sub); $("s2vat").textContent = bxMoney(sub * .2); $("s2tot").textContent = bxMoney(sub * 1.2);
    $("s2st").className = "bdx-pill g"; $("s2st").textContent = "Sent";
  }
  s.start(play, reset, still);
})();

/* ===== scene 3 ===== */
(function(){
  var root = document.getElementById("sc3"); if (!root) return;
  var s = BxStage(root), $ = s.$, box = $("s3calls"), timer;
  var LOG = [
    ["Engineer, van 3","Parts collected, on route","09:42",""],
    ["Retail, store manager","Access confirmed for Thursday","09:15",""],
    ["Supplier, trade counter","Compressor ready to collect","08:58",""],
    ["Office, reception","Visit window agreed","08:31",""]
  ];
  var ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>';
  var TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7"/></svg>';
  function row(r){ var d = document.createElement("div"); d.className = "call " + (r[3] || "");
    d.innerHTML = '<span class="av">' + (r[3] ? TICK : ICON) + '</span><div><b>' + r[0] + '</b><small>' + r[1] + '</small></div><time>' + r[2] + '</time>'; return d; }
  function lay(){ var live = [].slice.call(box.children); live.forEach(function(x, i){ x.style.setProperty("--i", i); });
    if (live.length > 5) setTimeout(function(){ live[live.length - 1].remove(); }, 450); }
  function status(busy){
    var st = $("s3st"); st.classList.toggle("busy", busy); st.querySelector("span").textContent = busy ? "On a call" : "Available";
    $("s3me").classList.toggle("busy", busy);
  }
  function reset(){
    clearInterval(timer); box.innerHTML = ""; LOG.forEach(function(r){ box.appendChild(row(r)); }); lay();
    status(false); $("s3idle").style.opacity = 1; $("s3ring").classList.remove("on"); $("s3on").classList.remove("on");
    $("s3match").classList.remove("on"); $("s3nt").textContent = ""; $("s3chip").classList.remove("on"); $("s3time").textContent = "00:00";
    s.hideToast();
  }
  async function play(t){
    await s.sleep(700, t);
    $("s3idle").style.opacity = 0; $("s3ring").classList.add("on");
    await s.sleep(500, t);
    await s.moveTo($("s3ans"), t, 520); await s.click($("s3ans"), t);
    $("s3ring").classList.remove("on"); $("s3on").classList.add("on"); status(true);
    var sec = 0; clearInterval(timer);
    timer = setInterval(function(){ if (!s.visible) return; sec += 3; var m = Math.floor(sec / 60), x = sec % 60;
      $("s3time").textContent = (m < 10 ? "0" : "") + m + ":" + (x < 10 ? "0" : "") + x; }, 250);
    await s.sleep(420, t);
    $("s3match").classList.add("on");
    await s.sleep(350, t);
    await s.moveTo($("s3notes"), t, 380); await s.click(null, t);
    $("s3notes").classList.add("focus");
    await s.type($("s3nt"), "Kitchen freezer alarm, reading minus 8. Stock moved to the walk in. Engineer needed today, access via goods entrance.", t, 16);
    $("s3notes").classList.remove("focus");
    await s.moveTo($("s3job"), t, 380); await s.click($("s3job"), t);
    $("s3chip").classList.add("on"); s.say("Job BRK1044 logged, engineer allocated");
    await s.sleep(700, t);
    await s.moveTo($("s3end"), t, 380); await s.click($("s3end"), t);
    clearInterval(timer);
    $("s3on").classList.remove("on"); status(false);
    var r = row(["Hotel, site manager","Handled. Job BRK1044 logged","10:06","dk-done"]);
    r.classList.add("enter"); box.insertBefore(r, box.firstChild); void r.offsetWidth; r.classList.remove("enter"); lay();
    await s.sleep(250, t); $("s3idle").style.opacity = 1;
    s.say("Call handled. Back to available");
    await s.sleep(2200, t);
  }
  function still(){
    var r = row(["Hotel, site manager","Handled. Job BRK1044 logged","10:06","dk-done"]); box.insertBefore(r, box.firstChild); lay();
  }
  s.start(play, reset, still);
})();

/* ===== scene 4 ===== */
(function(){
  var root = document.getElementById("sc4"); if (!root) return;
  var s = BxStage(root), $ = s.$, cs = ["s4c1","s4c2","s4c3","s4c4"];
  function prog(n){ $("s4prog").style.width = (n / 4 * 100) + "%"; }
  function flagOn(target, ok){
    var f = $("s4flag"), d = $("s4doc").getBoundingClientRect(), r = target.getBoundingClientRect();
    f.style.left = (r.left - d.left - 3) + "px"; f.style.top = (r.top - d.top - 3) + "px";
    f.style.width = (r.width + 6) + "px"; f.style.height = (r.height + 6) + "px";
    f.classList.add("on"); f.classList.toggle("ok", !!ok);
  }
  function reset(){
    cs.forEach(function(id){ $(id).className = "ci"; }); prog(0);
    $("s4c3t").textContent = "Checking"; $("s4fix").style.display = "none";
    $("s4miss").classList.remove("fixed"); $("s4flag").className = "flagbox";
    $("s4in").style.transform = "none"; $("s4send").classList.remove("ready"); $("s4mail").classList.remove("on");
    var p = $("s4state"); p.className = "bdx-pill o"; p.textContent = "In review";
    s.hideToast();
  }
  function scrollDoc(px){ $("s4in").style.transform = "translateY(" + (-px) + "px)"; }
  async function play(t){
    await s.sleep(500, t);
    await s.moveTo($("s4doc"), t, 480);
    $("s4c1").classList.add("ok"); prog(1); await s.sleep(380, t);
    scrollDoc(90); await s.sleep(500, t);
    $("s4c2").classList.add("ok"); prog(2); await s.sleep(380, t);
    var room = $("s4in").offsetHeight - $("s4doc").clientHeight + 24;
    scrollDoc(Math.max(0, room)); await s.sleep(950, t);
    $("s4c3").classList.add("bad"); $("s4c3t").textContent = "BRK1039 has no photos"; $("s4fix").style.display = "inline-flex";
    flagOn($("s4miss")); await s.sleep(650, t);
    await s.moveTo($("s4fix"), t, 460); await s.click($("s4fix"), t);
    $("s4miss").classList.add("fixed"); flagOn($("s4miss"), true);
    $("s4c3").className = "ci ok"; $("s4c3t").textContent = "Photos pulled from the job sheet"; $("s4fix").style.display = "none"; prog(3);
    s.say("Photos added from BRK1039 job sheet");
    await s.sleep(500, t); $("s4flag").classList.remove("on");
    $("s4c4").classList.add("ok"); prog(4);
    $("s4send").classList.add("ready");
    var p = $("s4state"); p.className = "bdx-pill g pop"; p.textContent = "Ready to send";
    await s.sleep(450, t);
    await s.moveTo($("s4send"), t, 460); await s.click($("s4send"), t);
    $("s4mail").classList.add("on"); await s.sleep(650, t);
    await s.moveTo($("s4go"), t, 420); await s.click($("s4go"), t);
    $("s4mail").classList.remove("on"); p.className = "bdx-pill g pop"; p.textContent = "Sent";
    s.say("Report sent to the Hotel facilities manager");
    await s.sleep(2200, t);
  }
  function still(){ cs.forEach(function(id){ $(id).className = "ci ok"; }); prog(4); $("s4miss").classList.add("fixed");
    $("s4c3t").textContent = "Photos pulled from the job sheet"; var p = $("s4state"); p.className = "bdx-pill g"; p.textContent = "Sent"; }
  s.start(play, reset, still);
})();
