/* Grid Sentinel — shared shell: header, nav, theme, tooltip, tiny SVG chart helpers */
(function () {
  const PAGES = [
    ["index.html", "Overview"],
    ["simulation.html", "Live substation"],
    ["fleet.html", "Robot fleet"],
    ["engineering.html", "Engineering"],
    ["economics.html", "Costs & ROI"],
    ["team.html", "Team & roadmap"],
  ];
  const here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const LOGO = '<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><rect x="1" y="1" width="24" height="24" rx="4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 2"/><circle cx="13" cy="13" r="4.2" fill="var(--accent)"/><path d="M13 3v4M13 19v4M3 13h4M19 13h4" stroke="currentColor" stroke-width="1.6"/></svg>';

  function shell() {
    const head = document.createElement("header");
    head.className = "topbar";
    head.innerHTML =
      '<div class="wrap"><a class="brand" href="index.html">' + LOGO + "Grid Sentinel</a>" +
      '<nav class="nav" aria-label="Sections">' +
      PAGES.map(([h, t]) => `<a href="${h}"${h === here || (here === "" && h === "index.html") ? ' aria-current="page"' : ""}>${t}</a>`).join("") +
      '</nav><button class="theme-btn" id="themeBtn" type="button" aria-label="Switch colour theme">Theme</button></div>';
    const stage = document.createElement("div");
    stage.className = "stagebar";
    stage.innerHTML = '<div class="wrap"><span><b>TRL 2</b> &nbsp;Concept stage. Nothing here has been built or field-tested.</span>' +
      '<span class="legend-tags" style="color:inherit;gap:10px"><span class="tag v">Verified</span><span class="tag a">Assumption</span><span class="tag t">Target</span><span class="tag p">Proposed</span><span class="tag i">Illustrative</span></span></div>';
    document.body.prepend(stage);
    document.body.prepend(head);
    const main = document.querySelector('main'); if (main && !main.id) main.id = 'content';
    const skip = document.createElement('a'); skip.className = 'skip'; skip.href = '#content'; skip.textContent = 'Skip to content'; document.body.prepend(skip);

    const foot = document.createElement("footer");
    foot.className = "site";
    foot.innerHTML = '<div class="wrap"><span>Grid Sentinel · Team Pocket (Medha, Avinash, Aadi) · Infosys Theme 3, Fortifying Grid Safety, Vigilance and Resilience</span><span>Advisory only: Grid Sentinel never switches grid equipment.</span></div>';
    document.body.append(foot);

    const btn = document.getElementById("themeBtn");
    const root = document.documentElement;
    let saved = null;
    try { saved = localStorage.getItem("gs-theme"); } catch (e) {}
    if (saved) root.dataset.theme = saved;
    const label = () => {
      const t = root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      btn.textContent = t === "dark" ? "Light mode" : "Dark mode";
    };
    label();
    btn.addEventListener("click", () => {
      const cur = root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      root.dataset.theme = cur === "dark" ? "light" : "dark";
      try { localStorage.setItem("gs-theme", root.dataset.theme); } catch (e) {}
      label();
      document.dispatchEvent(new CustomEvent("gs:theme"));
    });
  }

  /* ---------- tooltip ---------- */
  let tipEl;
  function tip(html, x, y) {
    if (!tipEl) { tipEl = document.createElement("div"); tipEl.className = "tip"; tipEl.setAttribute("role", "status"); document.body.append(tipEl); }
    if (html == null) { tipEl.classList.remove("on"); return; }
    tipEl.innerHTML = html;
    tipEl.classList.add("on");
    const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    let left = x + 14, top = y - h - 10;
    if (left + w > innerWidth - 8) left = x - w - 14;
    if (top < 8) top = y + 16;
    tipEl.style.left = left + "px"; tipEl.style.top = top + "px";
  }

  /* ---------- helpers ---------- */
  const NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs || {}) n.setAttribute(k, attrs[k]);
    if (parent) parent.append(n);
    return n;
  }
  const eur = (v, d = 0) => (v < 0 ? "−" : "") + "€" + Math.abs(v).toLocaleString("en-GB", { maximumFractionDigits: d, minimumFractionDigits: d });
  const pct = (v, d = 1) => (v < 0 ? "−" : "") + Math.abs(v * 100).toFixed(d) + "%";

  /* Line chart: one or more series on one axis.
     opts: {xs, series:[{name,color,values}], xLabel, yFmt, xFmt, yMin, yMax, refY:{value,label}, markX, height} */
  function lineChart(svg, opts) {
    svg.innerHTML = "";
    const W = 640, H = opts.height || 280, m = { l: 56, r: 18, t: 16, b: 40 };
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const xs = opts.xs;
    const all = opts.series.flatMap(s => s.values).filter(v => isFinite(v));
    let yMin = opts.yMin ?? Math.min(0, ...all), yMax = opts.yMax ?? Math.max(...all);
    if (yMax === yMin) yMax = yMin + 1;
    const X = i => m.l + (i / (xs.length - 1)) * (W - m.l - m.r);
    const Y = v => m.t + (1 - (Math.max(yMin, Math.min(yMax, v)) - yMin) / (yMax - yMin)) * (H - m.t - m.b);
    const ticks = niceTicks(yMin, yMax, 5);
    ticks.forEach(t => {
      el("line", { x1: m.l, x2: W - m.r, y1: Y(t), y2: Y(t), stroke: "var(--line)", "stroke-width": t === 0 ? 1.2 : .6 }, svg);
      const tx = el("text", { x: m.l - 8, y: Y(t) + 4, "text-anchor": "end", "font-size": 11, fill: "var(--ink-3)", class: "mono" }, svg);
      tx.textContent = opts.yFmt ? opts.yFmt(t) : t;
    });
    const step = Math.ceil(xs.length / 12);
    xs.forEach((x, i) => {
      if (i % step && i !== xs.length - 1) return;
      const tx = el("text", { x: X(i), y: H - m.b + 18, "text-anchor": "middle", "font-size": 11, fill: "var(--ink-3)", class: "mono" }, svg);
      tx.textContent = opts.xFmt ? opts.xFmt(x) : x;
    });
    if (opts.xLabel) { const t = el("text", { x: (m.l + W - m.r) / 2, y: H - 4, "text-anchor": "middle", "font-size": 11.5, fill: "var(--ink-2)" }, svg); t.textContent = opts.xLabel; }
    if (opts.refY) {
      el("line", { x1: m.l, x2: W - m.r, y1: Y(opts.refY.value), y2: Y(opts.refY.value), stroke: "var(--crit)", "stroke-dasharray": "4 4", "stroke-width": 1.2 }, svg);
      const t = el("text", { x: W - m.r, y: Y(opts.refY.value) - 6, "text-anchor": "end", "font-size": 11, fill: "var(--crit)" }, svg); t.textContent = opts.refY.label;
    }
    if (opts.markX != null) {
      const i = xs.indexOf(opts.markX);
      if (i >= 0) el("line", { x1: X(i), x2: X(i), y1: m.t, y2: H - m.b, stroke: "var(--accent)", "stroke-width": 1.2, "stroke-dasharray": "2 3" }, svg);
    }
    opts.series.forEach(s => {
      const pts = s.values.map((v, i) => isFinite(v) ? `${X(i)},${Y(v)}` : null).filter(Boolean).join(" ");
      el("polyline", { points: pts, fill: "none", stroke: s.color, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);
      if (opts.markX != null) {
        const i = xs.indexOf(opts.markX);
        if (i >= 0 && isFinite(s.values[i])) el("circle", { cx: X(i), cy: Y(s.values[i]), r: 5, fill: s.color, stroke: "var(--panel)", "stroke-width": 2 }, svg);
      }
    });
    // hover layer
    const cross = el("line", { y1: m.t, y2: H - m.b, stroke: "var(--ink-3)", "stroke-width": 1, opacity: 0 }, svg);
    const hit = el("rect", { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: "transparent" }, svg);
    hit.addEventListener("pointermove", e => {
      const r = svg.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width * W;
      const i = Math.max(0, Math.min(xs.length - 1, Math.round((px - m.l) / (W - m.l - m.r) * (xs.length - 1))));
      cross.setAttribute("x1", X(i)); cross.setAttribute("x2", X(i)); cross.setAttribute("opacity", .6);
      tip(`<b>${opts.xFmt ? opts.xFmt(xs[i]) : xs[i]}${opts.xUnit || ""}</b><br>` + opts.series.map(s => `<span style="color:${s.color}">■</span> ${s.name}: ${isFinite(s.values[i]) ? (opts.yFmt ? opts.yFmt(s.values[i], true) : s.values[i]) : "overloaded"}`).join("<br>"), e.clientX, e.clientY);
    });
    hit.addEventListener("pointerleave", () => { cross.setAttribute("opacity", 0); tip(null); });
  }
  function niceTicks(a, b, n) {
    const span = b - a, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const st = [1, 2, 2.5, 5, 10].map(f => f * mag).find(s => span / s <= n) || mag * 10;
    const out = []; for (let v = Math.ceil(a / st) * st; v <= b + 1e-9; v += st) out.push(+v.toFixed(10));
    return out;
  }

  /* ---------- pitch mode: a guided walk through the 60-second pitch ---------- */
  const PITCH = [
    { page: "index.html", sel: ".hero", title: "The 3 a.m. problem", line: "Picture a substation on the edge of Berlin at three in the morning. A fence sensor trips. Was it the wind, a fox, or someone with a can of petrol? Today the control room often can't tell. It either waits, or sends a crew to stand next to live high-voltage equipment." },
    { page: "index.html", sel: "#problem", title: "The stakes are real", line: "In September 2025, arsonists set fire to cables at two 110 kV pylons in Berlin, and about 50,000 customers lost power for around 60 hours. That was a detection gap at a site without sensors: it shows the stakes, not proof of our thesis." },
    { page: "index.html", sel: "#solution", title: "Sense everywhere, move rarely", line: "Low-cost sensors would watch every asset continuously. AI at the site would filter out weather, wildlife and wear. Only when something stays unexplained would we send a docked robot to look up close." },
    { page: "simulation.html", sel: ".yard-box", action: "runIntruder", title: "The worked incident", line: "Watch 02:47. Panel P6 feels an impact and thermal sees an upright warm shape. No wind, no crew, no switching, so the rules can't explain it. Fusion scores 0.82, the robot leaves its dock, and signed evidence streams back." },
    { page: "simulation.html", sel: "#kpiPanel", title: "A human always decides", line: "Seconds to detect, minutes to a verified decision. The operator confirms or dismisses; the system only sends advisories and never touches grid equipment. These timings are simulated, and measuring them is our first milestone." },
    { page: "fleet.html", sel: ".tiles", title: "Our biggest unknown", line: "How many sites can one robot serve? A two-minute response needs a robot at the site; sharing needs drones or vans. Realistically it's a mix, and we'd set the ratio from real geography and alarm rates." },
    { page: "economics.html", sel: "#mChart", title: "Who pays, and the honest margin", line: "Our customer is the European distribution operator, which now has physical-protection duties under the CER Directive. The deck's 49% margin leaves costs out; with them it is near break-even at 8 sites, so we'd sell the software layer and price by site risk." },
    { page: "team.html", sel: "#stages", title: "Where we are", line: "We're at TRL 2: concept, architecture and targets defined, nothing built yet. A small first stage buys answers: real alarm volumes, whether simple rules already solve it, and whether robot sharing works." },
    { page: "index.html", sel: "#explore", title: "Our ask", line: "Help getting one utility's alarm data, an industry mentor, and lab time for a bench test, so we can measure the baseline and test the idea against it." },
  ];
  const actions = {};
  let pIdx = -1, bar;
  function pitchUI() {
    if (bar) return bar;
    const st = document.createElement("style");
    st.textContent = `.pitch-bar{position:fixed;z-index:60;left:0;right:0;bottom:0;padding:12px max(16px,env(safe-area-inset-right,0px)) calc(12px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));background:var(--ink);color:var(--bg);box-shadow:0 -6px 24px rgba(0,0,0,.25)}
      .pitch-in{max-width:980px;margin:0 auto;display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center}
      @media(max-width:700px){.pitch-in{grid-template-columns:1fr}}
      .pitch-n{font:600 .78rem var(--f-mono);color:var(--accent);white-space:nowrap}
      .pitch-t{font:600 1.05rem var(--f-display);letter-spacing:.02em;color:var(--accent)}
      .pitch-l{font-size:1rem;line-height:1.5;max-width:70ch}
      .pitch-b{display:flex;gap:6px}.pitch-b button{appearance:none;border:1px solid color-mix(in srgb,var(--bg) 35%,transparent);background:transparent;color:var(--bg);font:500 .85rem var(--f-body);padding:8px 12px;border-radius:6px;cursor:pointer}
      .pitch-b button.go{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
      .pitch-focus{outline:3px solid var(--accent)!important;outline-offset:6px;border-radius:6px;transition:outline-color .2s}
      body.pitching{padding-bottom:180px}`;
    document.head.append(st);
    bar = document.createElement("div");
    bar.className = "pitch-bar"; bar.setAttribute("role", "region"); bar.setAttribute("aria-label", "Pitch walkthrough"); bar.setAttribute("aria-live", "polite");
    bar.innerHTML = '<div class="pitch-in"><span class="pitch-n" id="pitchN"></span><div><div class="pitch-t" id="pitchT"></div><p class="pitch-l" id="pitchL"></p></div><div class="pitch-b"><button type="button" id="pitchPrev">Back</button><button type="button" class="go" id="pitchNext">Next</button><button type="button" id="pitchX" aria-label="Exit pitch mode">Exit</button></div></div>';
    document.body.append(bar);
    bar.querySelector("#pitchPrev").onclick = () => goPitch(pIdx - 1);
    bar.querySelector("#pitchNext").onclick = () => goPitch(pIdx + 1);
    bar.querySelector("#pitchX").onclick = endPitch;
    document.addEventListener("keydown", e => {
      if (pIdx < 0 || /input|select|textarea/i.test(e.target.tagName)) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); goPitch(pIdx + 1); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); goPitch(pIdx - 1); }
      if (e.key === "Escape") endPitch();
    });
    return bar;
  }
  function goPitch(i) {
    if (i < 0) i = 0;
    if (i >= PITCH.length) return endPitch();
    const s = PITCH[i];
    if (s.page !== here && !(here === "" && s.page === "index.html")) { location.href = s.page + "#pitch" + i; return; }
    pIdx = i; pitchUI(); document.body.classList.add("pitching");
    document.querySelectorAll(".pitch-focus").forEach(n => n.classList.remove("pitch-focus"));
    const t = document.querySelector(s.sel);
    if (t) { t.classList.add("pitch-focus"); t.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" }); }
    bar.querySelector("#pitchN").textContent = `${i + 1} / ${PITCH.length}`;
    bar.querySelector("#pitchT").textContent = s.title;
    bar.querySelector("#pitchL").textContent = s.line;
    bar.querySelector("#pitchNext").textContent = i === PITCH.length - 1 ? "Finish" : "Next";
    if (s.action && actions[s.action]) setTimeout(actions[s.action], 400);
    try { history.replaceState(null, "", "#pitch" + i); } catch (e) {}
  }
  function endPitch() {
    pIdx = -1; if (bar) { bar.remove(); bar = null; }
    document.body.classList.remove("pitching");
    document.querySelectorAll(".pitch-focus").forEach(n => n.classList.remove("pitch-focus"));
    try { history.replaceState(null, "", location.pathname); } catch (e) {}
  }
  function pitchBoot() {
    const btn = document.createElement("button");
    btn.className = "theme-btn"; btn.type = "button"; btn.textContent = "▶ Present";
    btn.setAttribute("aria-label", "Start the guided pitch walkthrough");
    btn.style.cssText = "background:var(--accent);border-color:var(--accent);color:var(--on-accent)";
    btn.onclick = () => goPitch(0);
    document.getElementById("themeBtn").before(btn);
    const m = /^#pitch(\d+)$/.exec(location.hash);
    if (m) setTimeout(() => goPitch(+m[1]), 250);
  }

  window.GS = { el, tip, eur, pct, lineChart, niceTicks, actions };
  const boot = () => { shell(); pitchBoot(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
