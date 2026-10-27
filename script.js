/* KROMA — interactions */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- color per nav link ---------- */
  document.querySelectorAll(".nav-link").forEach(function (link) {
    var c = link.dataset.color || "#fff";
    link.style.setProperty("--nav-c", c);

    if (link.dataset.anim === "flip") {
      // split into per-letter two-face stacks
      var text = link.textContent.trim();
      link.textContent = "";
      text.split("").forEach(function (ch, i) {
        var cell = document.createElement("span");
        cell.className = "fl-char";
        cell.style.setProperty("--i", i);
        var top = document.createElement("i");
        top.className = "top";
        top.textContent = ch;
        var bot = document.createElement("i");
        bot.className = "bot";
        bot.textContent = ch;
        cell.appendChild(top); cell.appendChild(bot);
        link.appendChild(cell);
      });
    }

    if (link.dataset.anim === "wipe") {
      var fill = document.createElement("span");
      fill.className = "wipe-fill";
      var txt = document.createElement("span");
      txt.className = "wipe-txt";
      txt.textContent = link.textContent.trim();
      link.textContent = "";
      link.appendChild(fill); link.appendChild(txt);
    }

    if (link.dataset.anim === "outline") {
      var ring = document.createElement("span");
      ring.className = "ol-ring";
      link.appendChild(ring);
    }

    if (link.dataset.anim === "scramble") {
      var original = link.textContent.trim();
      var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ*#%&";
      var frame = null;
      link.addEventListener("mouseenter", function () {
        if (reduced) return;
        var tick = 0, total = 14;
        if (frame) cancelAnimationFrame(frame);
        (function step() {
          tick++;
          var done = Math.floor(tick / total * original.length);
          var out = "";
          for (var i = 0; i < original.length; i++) {
            out += i < done ? original[i]
              : chars[Math.floor(Math.random() * chars.length)];
          }
          link.textContent = out;
          if (tick < total) frame = requestAnimationFrame(step);
          else link.textContent = original;
        })();
      });
    }
  });

  /* ---------- logo color cycle ---------- */
  var logoHues = ["#FF5A36", "#2E4BFF", "#FF3D9E", "#C6F24E"];
  document.querySelectorAll(".logo span").forEach(function (s, i) {
    s.style.animationDelay = (i * 0.06) + "s";
  });

  /* ---------- custom cursor ---------- */
  if (fine && !reduced) {
    var cursor = document.querySelector(".cursor");
    var dot = cursor.querySelector(".cursor-dot");
    var ring = cursor.querySelector(".cursor-ring");
    document.body.classList.add("has-cursor");
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; });
    gsap.ticker.add(function () {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      dot.style.transform = "translate(" + (mx - 4) + "px," + (my - 4) + "px)";
      ring.style.transform = "translate(" + (rx - 19) + "px," + (ry - 19) + "px)";
    });
    document.querySelectorAll("a, button").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cursor.classList.add("is-hover"); });
      el.addEventListener("mouseleave", function () { cursor.classList.remove("is-hover"); });
    });
    addEventListener("mousedown", function () { cursor.classList.add("is-press"); });
    addEventListener("mouseup", function () { cursor.classList.remove("is-press"); });
  }

  /* ---------- smooth scroll ---------- */
  var lenis = null;
  if (typeof Lenis !== "undefined" && !reduced) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
    if (hasGsap) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }

  /* anchor scrolling through lenis */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(target, { offset: 0 });
      else target.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------- mobile menu ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var menu = document.querySelector(".menu");
  function closeMenu() {
    if (!menu) return;
    menu.classList.remove("open");
    menu.setAttribute("aria-hidden", "true");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      menu.setAttribute("aria-hidden", open ? "false" : "true");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- hero canvas: drifting color fields ---------- */
  var canvas = document.querySelector(".hero-canvas");
  if (canvas && !reduced) {
    var ctx = canvas.getContext("2d");
    var hues = [
      { c: [255, 90, 54], x: .2, y: .35, r: .55, dx: .00016, dy: .00011 },
      { c: [46, 75, 255], x: .75, y: .25, r: .5, dx: -.00013, dy: .00009 },
      { c: [255, 61, 158], x: .55, y: .8, r: .45, dx: .00011, dy: -.00014 },
      { c: [198, 242, 78], x: .1, y: .85, r: .35, dx: -.00009, dy: -.00007 }
    ];
    function sizeCanvas() {
      var dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    }
    sizeCanvas();
    addEventListener("resize", sizeCanvas);
    var t0 = performance.now();
    (function draw(now) {
      var t = (now - t0);
      var w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      hues.forEach(function (b) {
        var bx = (b.x + Math.sin(t * b.dx) * .18) * w;
        var by = (b.y + Math.cos(t * b.dy) * .18) * h;
        var br = b.r * Math.max(w, h);
        var g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        g.addColorStop(0, "rgba(" + b.c.join(",") + ",0.5)");
        g.addColorStop(1, "rgba(" + b.c.join(",") + ",0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });
      requestAnimationFrame(draw);
    })(t0);
  }

  /* ---------- services accordion ---------- */
  document.querySelectorAll(".svc").forEach(function (svc) {
    var row = svc.querySelector(".svc-row");
    row.addEventListener("click", function () {
      var open = svc.classList.toggle("open");
      row.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  /* ---------- live clock ---------- */
  var clock = document.getElementById("clock");
  if (clock) {
    function tick() {
      clock.textContent = new Date().toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit", timeZone: "America/New_York"
      }) + " in St. Augustine";
    }
    tick(); setInterval(tick, 15000);
  }

  /* ---------- gsap choreography ---------- */
  if (hasGsap && !reduced) {

    /* loader: colored panels sweep, then word lifts away */
    var loader = document.querySelector(".loader");
    if (loader) {
      var tl = gsap.timeline();
      tl.to(".loader-panel", { scaleY: 1, duration: .55, stagger: .09, ease: "power3.inOut" })
        .from(".loader-word", { opacity: 0, y: 30, duration: .4, ease: "power2.out" }, "-=.3")
        .to(".loader-word", { y: -40, opacity: 0, duration: .35, ease: "power2.in" }, "+=.15")
        .to(".loader-panel", { scaleY: 0, duration: .6, stagger: .07, ease: "power3.inOut", transformOrigin: "bottom" }, "-=.1")
        .set(loader, { display: "none" });
    }

    /* hero entrance: lines rise inside clipped masks */
    gsap.set(".hero-title .line-inner", { yPercent: 110 });
    gsap.set(".hero-sub, .hero .cta", { opacity: 0, y: 24 });
    gsap.set(".hero-foot .hero-meta", { opacity: 0 });
    var heroTl = gsap.timeline({ delay: 1.5 });
    heroTl
      .to(".hero-title .line-inner", { yPercent: 0, duration: 1.1, stagger: .1, ease: "power4.out" })
      .to(".hero-sub", { opacity: 1, y: 0, duration: .7, ease: "power3.out" }, "-=.5")
      .to(".hero .cta", { opacity: 1, y: 0, duration: .7, ease: "power3.out" }, "-=.45")
      .to(".hero-foot .hero-meta", { opacity: 1, duration: .6, stagger: .1 }, "-=.4");

    /* section background color shift */
    document.querySelectorAll("[data-bg]").forEach(function (sec) {
      ScrollTrigger.create({
        trigger: sec, start: "top 55%", end: "bottom 45%",
        onEnter: setColors(sec), onEnterBack: setColors(sec)
      });
      function setColors(s) {
        return function () {
          gsap.to("body", { backgroundColor: s.dataset.bg, duration: .7, ease: "power2.out" });
          gsap.to("body", { color: s.dataset.fg, duration: .7, ease: "power2.out" });
        };
      }
    });

    /* section titles rise on enter */
    document.querySelectorAll(".sec-title, .contact-title").forEach(function (t) {
      gsap.from(t.querySelectorAll(".line-inner"), {
        yPercent: 110, duration: 1, stagger: .09, ease: "power4.out",
        scrollTrigger: { trigger: t, start: "top 78%" }
      });
    });

    /* marquee drift */
    var track = document.querySelector(".marquee-track");
    if (track) {
      var half = track.scrollWidth / 2;
      gsap.to(track, { x: -half, duration: 16, ease: "none", repeat: -1,
        modifiers: { x: gsap.utils.unitize(function (x) { return parseFloat(x) % half; }) } });
    }

    /* work: pinned horizontal reel */
    var workPin = document.querySelector(".work-pin");
    var workTrack = document.querySelector(".work-track");
    if (workPin && workTrack) {
      var getDist = function () { return workTrack.scrollWidth - innerWidth; };
      gsap.to(workTrack, {
        x: function () { return -getDist(); },
        ease: "none",
        scrollTrigger: {
          trigger: ".work", start: "top top",
          end: function () { return "+=" + getDist(); },
          pin: true, scrub: 1, invalidateOnRefresh: true
        }
      });
      /* cards tilt in as they arrive */
      gsap.utils.toArray(".card").forEach(function (card, i) {
        gsap.from(card, {
          y: 60, rotate: i % 2 ? 2 : -2, opacity: 0, duration: .9, ease: "power3.out",
          scrollTrigger: { trigger: card, containerAnimation: workTrack ? gsap.getTweensOf(workTrack)[0] : null, start: "left 90%" }
        });
      });
    }

    /* studio copy: words ink in as you scroll */
    var copy = document.getElementById("studio-copy");
    if (copy) {
      var words = copy.textContent.trim().split(/\s+/);
      copy.innerHTML = words.map(function (w) { return '<span class="w">' + w + "</span>"; }).join(" ");
      gsap.to(copy.querySelectorAll(".w"), {
        opacity: 1, stagger: .04, ease: "none",
        scrollTrigger: { trigger: copy, start: "top 80%", end: "top 30%", scrub: true }
      });
    }

    /* magnetic buttons */
    if (fine) {
      document.querySelectorAll(".magnetic").forEach(function (btn) {
        var strength = 18;
        btn.addEventListener("mousemove", function (e) {
          var r = btn.getBoundingClientRect();
          gsap.to(btn, {
            x: (e.clientX - r.left - r.width / 2) / r.width * strength,
            y: (e.clientY - r.top - r.height / 2) / r.height * strength,
            duration: .4, ease: "power3.out"
          });
        });
        btn.addEventListener("mouseleave", function () {
          gsap.to(btn, { x: 0, y: 0, duration: .6, ease: "elastic.out(1,.4)" });
        });
      });
    }

    document.fonts && document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    addEventListener("load", function () { ScrollTrigger.refresh(); });
  }
})();
