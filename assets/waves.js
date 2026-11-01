/* Beyondesk wave dividers.
   Every place two sections with different backgrounds meet, the lower section's top edge
   becomes a flowing wave in the ribbon style: a translucent ribbon sheet trailing above the
   edge and a fine silk strand along it. Static (no animation), drawn as one small SVG per seam.
   Directions alternate down the page so the seams flow rather than repeat.
   Over a ribbon section the wave is filled with the ribbon sky sampled from its canvas,
   so the edge continues the background exactly. */
(function(){
  var NS = "http://www.w3.org/2000/svg";
  var css = [
    ".bdw-host{position:relative;z-index:2}",
    ".bdw{position:absolute;left:0;right:0;width:100%;display:block;pointer-events:none;z-index:1;",
    "  top:calc(var(--bdw-h) * -1);height:calc(var(--bdw-h) + 2px);--bdw-h:clamp(26px,6.4vw,96px)}",
    ".bdw.minor{--bdw-h:clamp(18px,3.6vw,54px)}",
    /* sections that clip their content are clipped sideways only, so the wave can rise above them */
    "@supports (overflow-x:clip){.bdw-clip{overflow:visible!important;overflow-x:clip!important}}",
    "@supports not (overflow-x:clip){.bdw-clip{overflow:visible!important;clip-path:inset(-120px 0 0 0)}}"
  ].join("");
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // geometry in a 1440 x 102 box; y 100 is the section's top line, 2px of overlap below it
  var EDGE   = [[0,58],[240,92],[520,104],[780,68],[1040,32],[1200,6],[1440,20]];
  var STRAND = [[0,42],[250,76],[530,92],[790,55],[1045,20],[1205,1],[1440,9]];
  var SHEET  = [[0,28],[260,62],[540,80],[800,44],[1050,10],[1210,-2],[1440,2]];
  function d(pts, flip, close){
    var P = pts.map(function(p){ return [flip ? 1440 - p[0] : p[0], p[1]]; });
    var s = "M" + P[0] + "C" + P[1] + " " + P[2] + " " + P[3] + "S" + P[5] + " " + P[6];
    // the S command reflects P[4] implicitly; P[4] is listed above only as documentation
    return close ? s + "L" + (flip ? "0" : "1440") + ",102L" + (flip ? "1440" : "0") + ",102Z" : s;
  }
  function el(n, a){ var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); return e; }
  function grad(defs, id, flip, stops){
    var g = el("linearGradient", { id:id, gradientUnits:"userSpaceOnUse", x1: flip ? 1440 : 0, y1:0, x2: flip ? 0 : 1440, y2:0 });
    stops.forEach(function(s){ g.appendChild(el("stop", { offset:s[0], "stop-color":s[1], "stop-opacity":s[2] })); });
    defs.appendChild(g); return "url(#" + id + ")";
  }
  function rgb(c){ var m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return null; var v = m[1].split(",").map(parseFloat); return { r:v[0], g:v[1], b:v[2], a: v.length > 3 ? v[3] : 1 }; }
  function bg(e){
    while (e){ var c = rgb(getComputedStyle(e).backgroundColor); if (c && c.a > .5) return c; e = e.parentElement; }
    return { r:255, g:255, b:255, a:1 };
  }
  function lum(c){ return (.2126 * c.r + .7152 * c.g + .0722 * c.b) / 255; }
  function same(a, b){ return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) < 6; }
  function hex(c){ return "rgb(" + Math.round(c.r) + "," + Math.round(c.g) + "," + Math.round(c.b) + ")"; }

  var blocks = [].slice.call(document.querySelectorAll("body > section, body > main > section, body > footer, body > main > footer"))
    .filter(function(e){ return e.offsetHeight > 0; });
  var uid = 0, flip = false;

  for (var i = 1; i < blocks.length; i++){
    var A = blocks[i - 1], B = blocks[i];
    var ribA = A.hasAttribute("data-ribbons"), ribB = B.hasAttribute("data-ribbons");
    // a ribbon section reads as light whatever its computed colour says
    var cA = ribA ? { r:238, g:245, b:253 } : bg(A), cB = ribB ? { r:238, g:245, b:253 } : bg(B);
    if (!ribA && !ribB && same(cA, cB)) continue;
    var darkA = lum(cA) < .45, darkB = lum(cB) < .45, major = darkA !== darkB || ribA || ribB;
    seam(B, cB, ribB, darkA, major, flip);
    flip = !flip;
  }

  function seam(host, fillC, rib, upperDark, major, f){
    var id = "bdw" + (++uid);
    var svg = el("svg", { "class": "bdw" + (major ? "" : " minor"), viewBox:"0 0 1440 102", preserveAspectRatio:"none", "aria-hidden":"true", focusable:"false" });
    var defs = el("defs", {}); svg.appendChild(defs);

    // ribbon sheet over the upper section, swelling towards the high side of the wave
    var sa = !major ? .16 : upperDark ? .42 : .26, sc = upperDark ? "#7FC0FA" : "#3896F0";
    svg.appendChild(el("path", { d: d(SHEET, f, true),
      fill: grad(defs, id + "s", f, [[0, sc, sa * .12], [.45, sc, sa * .55], [.8, sc, sa], [1, sc, sa * .85]]) }));

    // fine silk strand inside the sheet
    var lc = upperDark ? "#BFE3FF" : "#38B6FF";
    svg.appendChild(el("path", { d: d(STRAND, f, false), fill:"none", "vector-effect":"non-scaling-stroke",
      "stroke-width": major ? 1 : .8, stroke: grad(defs, id + "t", f, [[0, lc, 0], [.4, lc, major ? .35 : .2], [.75, lc, major ? .7 : .35], [1, lc, major ? .4 : .2]]) }));

    // the section's own colour, or its ribbon sky
    var fill = el("path", { d: d(EDGE, f, true), fill: rib ? "#EEF5FD" : hex(fillC) });
    svg.appendChild(fill);

    // highlight along the edge, brightest where the wave crests, as on the ribbon edges
    var ec = rib || !upperDark && fillC && lum(fillC) > .45 ? "#5CC8FF" : "#6EC4FF";
    svg.appendChild(el("path", { d: d(EDGE, f, false), fill:"none", "vector-effect":"non-scaling-stroke",
      "stroke-width": major ? 1.6 : 1.1, "stroke-linecap":"round",
      stroke: grad(defs, id + "e", f, [[0, ec, .1], [.42, ec, major ? .4 : .22], [.78, ec, major ? .95 : .5], [1, ec, major ? .5 : .28]]) }));

    host.classList.add("bdw-host");
    if (getComputedStyle(host).overflow !== "visible") host.classList.add("bdw-clip");
    host.insertBefore(svg, host.firstChild);
    if (rib) skyFill(host, fill, defs, id, f);
  }

  // sample the top row of the ribbon canvas and use it as the wave's fill, refreshed on every redraw
  function skyFill(host, fill, defs, id, f){
    function sample(){
      var c = host.querySelector(".rb-canvas"); if (!c || !c.width) return;
      var row; try { row = c.getContext("2d").getImageData(0, 0, c.width, 1).data; } catch (e) { return; }
      var old = defs.querySelector("#" + id + "k"); if (old) old.remove();
      var g = el("linearGradient", { id: id + "k", gradientUnits:"userSpaceOnUse", x1:0, y1:0, x2:1440, y2:0 });
      for (var k = 0; k <= 24; k++){
        var x = Math.min(c.width - 1, Math.round(k / 24 * (c.width - 1))) * 4;
        g.appendChild(el("stop", { offset: k / 24, "stop-color": "rgb(" + row[x] + "," + row[x + 1] + "," + row[x + 2] + ")" }));
      }
      defs.appendChild(g); fill.setAttribute("fill", "url(#" + id + "k)");
    }
    host.addEventListener("rb:layout", sample);
    sample();
  }
})();
