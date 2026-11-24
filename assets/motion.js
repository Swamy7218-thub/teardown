/* AcquaHT motion layer v7 (24 Nov 2026). Vanilla JS, no libraries. Leaves the 3D section alone. */
(function () {
  "use strict";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var below = function (el) { return el.getBoundingClientRect().top > innerHeight * 0.9; };

  /* one observer for everything that reveals once */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("mo-shown");
      if (e.target._mo) e.target._mo();
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });

  /* 1. scroll progress */
  var prog = document.createElement("div");
  prog.id = "mo-prog";
  document.body.appendChild(prog);

  /* 2. headline words rise out of a mask */
  if (!reduce) $$(".sec .title").forEach(function (t) {
    if (t.children.length || !below(t)) return;
    var words = t.textContent.trim().split(/\s+/);
    t.setAttribute("aria-label", t.textContent.trim());
    t.innerHTML = words.map(function (w, i) {
      return '<span class="mo-w" aria-hidden="true"><span style="--i:' + i + '">' + w.replace(/</g, "&lt;") + "</span></span>";
    }).join(" ");
    io.observe(t);
  });

  /* 3. bracket labels decode like a readout */
  var glyphs = "01·:=+<>/\\[]#%";
  function decode(el) {
    var final = el.textContent, n = 0, total = 22;
    el.classList.add("mo-dec");
    (function step() {
      n++;
      var keep = Math.floor(final.length * n / total), out = "";
      for (var i = 0; i < final.length; i++) {
        var ch = final[i];
        out += (i < keep || ch === " ") ? ch : glyphs[(Math.random() * glyphs.length) | 0];
      }
      el.textContent = out;
      if (n < total) requestAnimationFrame(step); else el.textContent = final;
    })();
  }
  if (!reduce) $$(".eyebrow, .kick").forEach(function (el) {
    if (el.children.length || !below(el)) return;
    el._mo = function () { decode(el); };
    io.observe(el);
  });

  var pre = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      (e.target._imgs || []).forEach(function (i) { i.loading = "eager"; });
      pre.unobserve(e.target);
    });
  }, { rootMargin: "600px 0px 600px 0px" });

  /* 4. photos and renders: a sheet of water draws back */
  if (!reduce) $$("#proof img, #pilot img, #team img, #insight img").forEach(function (img) {
    if (!below(img) || img.closest(".logo-wall")) return;
    img.classList.add("mo-img");
    var box = img.parentElement;
    /* the clip hides the image from IntersectionObserver and lazy loading, so watch its frame */
    pre.observe(box); box._imgs = (box._imgs || []).concat(img);
    var prev = box._mo;
    box._mo = function () { if (prev) prev(); img.classList.add("mo-shown"); };
    io.observe(box);
  });

  /* 5. stats, cards, steps rise in sequence */
  if (!reduce) [".stat", ".card", ".step", ".lv", ".gate"].forEach(function (sel) {
    var groups = new Map();
    $$(sel).forEach(function (el) {
      if (!below(el)) return;
      var p = el.parentElement, i = groups.get(p) || 0;
      groups.set(p, i + 1);
      el.style.setProperty("--i", i);
      el.classList.add("mo-rise");
      io.observe(el);
    });
  });

  /* 6. big outlined section numerals that drift with scroll */
  var ghosts = [];
  if (!reduce && innerWidth > 760) {
    var roman = ["II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    $$("section.sec").forEach(function (s, i) {
      if (!roman[i]) return;
      var g = document.createElement("div");
      g.className = "mo-ghost mo-layer";
      g.setAttribute("aria-hidden", "true");
      g.textContent = roman[i];
      s.classList.add("mo-host");
      s.insertBefore(g, s.firstChild);
      ghosts.push([s, g]);
    });
  }

  /* 7. dark bands: vapour that gathers into droplets, spotlight, wave line */
  var fields = [];
  $$("section.ink").forEach(function (s) {
    s.classList.add("mo-host");
    var spot = document.createElement("div");
    spot.className = "mo-layer mo-spot";
    s.insertBefore(spot, s.firstChild);
    if (fine) s.addEventListener("pointermove", function (e) {
      var r = s.getBoundingClientRect();
      spot.style.setProperty("--mx", (e.clientX - r.left) + "px");
      spot.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
    if (reduce) return;
    var svgNS = "http://www.w3.org/2000/svg";
    [["w1", ""], ["w2", " slow"]].forEach(function (k, j) {
      var svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("class", "mo-layer mo-wave" + k[1]);
      svg.setAttribute("viewBox", "0 0 2400 56");
      svg.setAttribute("preserveAspectRatio", "none");
      svg.setAttribute("aria-hidden", "true");
      var d = "M0 28", amp = j ? 9 : 14;
      for (var x = 0; x <= 2400; x += 150) d += " Q" + (x + 75) + " " + (28 + (((x / 150) % 2) ? amp : -amp)) + " " + (x + 150) + " 28";
      var p = document.createElementNS(svgNS, "path");
      p.setAttribute("d", d);
      p.setAttribute("class", k[0]);
      svg.appendChild(p);
      s.insertBefore(svg, s.firstChild);
    });
    var c = document.createElement("canvas");
    c.className = "mo-layer mo-field";
    c.setAttribute("aria-hidden", "true");
    s.insertBefore(c, s.firstChild);
    fields.push(makeField(s, c));
  });

  function makeField(host, c) {
    var ctx = c.getContext("2d"), dpr = Math.min(devicePixelRatio || 1, 2);
    var W = 0, H = 0, mist = [], drops = [], live = false, mx = -1e4, my = -1e4;
    function size() {
      W = host.clientWidth; H = host.clientHeight;
      c.width = W * dpr; c.height = H * dpr;
      c.style.width = W + "px"; c.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(110, Math.round(W * H / 14000));
      mist = [];
      for (var i = 0; i < n; i++) mist.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: -.15 - Math.random() * .35, r: .6 + Math.random() * 1.6, a: .15 + Math.random() * .45 });
    }
    host.addEventListener("pointermove", function (e) { var r = host.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    host.addEventListener("pointerleave", function () { mx = my = -1e4; });
    function frame() {
      if (!live) return;
      ctx.clearRect(0, 0, W, H);
      var link = 92 * 92;
      for (var i = 0; i < mist.length; i++) {
        var p = mist[i];
        var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < 140 * 140) { var f = (1 - Math.sqrt(d2) / 140) * .6; p.x += dx / 140 * f; p.y += dy / 140 * f; }
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
        for (var j = i + 1; j < mist.length; j++) {
          var q = mist[j], ex = p.x - q.x, ey = p.y - q.y, e2 = ex * ex + ey * ey;
          if (e2 < link) {
            ctx.strokeStyle = "rgba(127,227,216," + (0.12 * (1 - e2 / link)).toFixed(3) + ")";
            ctx.lineWidth = .6;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
            if (e2 < 64 && Math.random() < .004 && drops.length < 14) drops.push({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, v: .2, r: 1.4 });
          }
        }
        ctx.fillStyle = "rgba(190,240,236," + p.a + ")";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      for (var k = drops.length - 1; k >= 0; k--) {
        var d = drops[k];
        d.v += .045; d.y += d.v; d.r = Math.min(3.2, d.r + .02);
        var g = ctx.createLinearGradient(d.x, d.y - d.r * 7, d.x, d.y);
        g.addColorStop(0, "rgba(31,99,224,0)"); g.addColorStop(1, "rgba(127,227,216,.55)");
        ctx.strokeStyle = g; ctx.lineWidth = d.r * .7;
        ctx.beginPath(); ctx.moveTo(d.x, d.y - d.r * 7); ctx.lineTo(d.x, d.y); ctx.stroke();
        ctx.fillStyle = "rgba(200,248,244,.85)";
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill();
        if (d.y > H + 10) drops.splice(k, 1);
      }
      requestAnimationFrame(frame);
    }
    var vis = new IntersectionObserver(function (es) {
      var on = es[0].isIntersecting;
      if (on && !live) { if (!W) size(); live = true; c.classList.add("on"); requestAnimationFrame(frame); }
      else if (!on) live = false;
    }, { threshold: 0 });
    vis.observe(host);
    return { resize: function () { if (W) size(); } };
  }

  /* 8. tilt with glare on cards */
  if (fine && !reduce) $$(".card, .stat").forEach(function (el) {
    el.classList.add("mo-tilt");
    var gl = document.createElement("span");
    gl.className = "mo-glare"; gl.setAttribute("aria-hidden", "true");
    el.appendChild(gl);
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.classList.add("mo-active");
      el.style.transform = "perspective(900px) rotateX(" + ((.5 - y) * 7).toFixed(2) + "deg) rotateY(" + ((x - .5) * 9).toFixed(2) + "deg) translateY(-4px)";
      el.style.setProperty("--gx", x * 100 + "%"); el.style.setProperty("--gy", y * 100 + "%");
    });
    el.addEventListener("pointerleave", function () { el.classList.remove("mo-active"); el.style.transform = ""; });
  });

  /* 9. magnetic buttons */
  if (fine && !reduce) $$(".btn").forEach(function (b) {
    b.classList.add("mo-mag");
    b.addEventListener("pointermove", function (e) {
      var r = b.getBoundingClientRect();
      b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * .22).toFixed(1) + "px," + ((e.clientY - r.top - r.height / 2) * .3).toFixed(1) + "px)";
    });
    b.addEventListener("pointerleave", function () { b.style.transform = ""; });
  });

  /* 10. a ripple wherever you tap */
  if (!reduce) document.addEventListener("pointerdown", function (e) {
    if (e.target.closest("#how canvas, input, textarea, select")) return;
    for (var i = 0; i < 2; i++) {
      var r = document.createElement("span");
      r.className = "mo-ripple" + (i ? " r2" : "");
      r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px";
      document.body.appendChild(r);
      setTimeout(r.remove.bind(r), 1200);
    }
  }, { passive: true });

  /* scroll loop: progress bar and drifting numerals */
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var h = document.documentElement, max = h.scrollHeight - innerHeight;
      prog.style.transform = "scaleX(" + (max > 0 ? scrollY / max : 0) + ")";
      ghosts.forEach(function (sg) {
        var r = sg[0].getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        sg[1].style.setProperty("--gy2", ((r.top - innerHeight / 2) * -0.18).toFixed(1) + "px");
      });
      ticking = false;
    });
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", function () { fields.forEach(function (f) { f.resize(); }); onScroll(); });
  onScroll();
})();
