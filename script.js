/* KROMA — interactions */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- per-link nav animations (pure DOM, always runs) ---------- */
  document.querySelectorAll(".nav-link").forEach(function (link) {
    var c = link.dataset.color || "#fff";
    link.style.setProperty("--nav-c", c);

    if (link.dataset.anim === "flip") {
      var text = link.textContent.trim();
      link.textContent = "";
      text.split("").forEach(function (ch, i) {
        var cell = document.createElement("span");
        cell.className = "fl-char";
        cell.style.setProperty("--i", i);
        var top = document.createElement("i");
        top.className = "top"; top.textContent = ch;
        var bot = document.createElement("i");
        bot.className = "bot"; bot.textContent = ch;
        cell.appendChild(top); cell.appendChild(bot);
        link.appendChild(cell);
      });
    }

    if (link.dataset.anim === "wipe") {
      var fill = document.createElement("span"); fill.className = "wipe-fill";
      var txt = document.createElement("span"); txt.className = "wipe-txt";
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
            out += i < done ? original[i] : chars[Math.floor(Math.random() * chars.length)];
          }
          link.textContent = out;
          if (tick < total) frame = requestAnimationFrame(step);
          else link.textContent = original;
        })();
      });
    }
  });

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
    var tickClock = function () {
      try {
        clock.textContent = new Date().toLocaleTimeString("en-US", {
          hour: "numeric", minute: "2-digit", timeZone: "America/New_York"
        }) + " in St. Augustine";
      } catch (e) {
        clock.textContent = new Date().toLocaleTimeString("en-US",
          { hour: "numeric", minute: "2-digit" }) + " local time";
      }
    };
    tickClock(); setInterval(tickClock, 15000);
  }

  /* ---------- smooth scroll ---------- */
  var lenis = null;
  if (typeof window.Lenis !== "undefined" && !reduced) {
    try {
      lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
      if (hasGsap) {
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        var rafLoop = function (t) { lenis.raf(t); requestAnimationFrame(rafLoop); };
        requestAnimationFrame(rafLoop);
      }
    } catch (e) { lenis = null; }
  }

  /* anchor scrolling */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(target, { offset: 0 });
      else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
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
    if (ctx) {
      var blobs = [
        { c: [255, 90, 54], x: 0.2, y: 0.35, r: 0.55, dx: 0.00016, dy: 0.00011 },
        { c: [46, 75, 255], x: 0.75, y: 0.25, r: 0.5, dx: -0.00013, dy: 0.00009 },
        { c: [255, 61, 158], x: 0.55, y: 0.8, r: 0.45, dx: 0.00011, dy: -0.00014 },
        { c: [198, 242, 78], x: 0.1, y: 0.85, r: 0.35, dx: -0.00009, dy: -0.00007 }
      ];
      var sizeCanvas = function () {
        var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = canvas.offsetWidth * dpr;
        canvas.height = canvas.offsetHeight * dpr;
      };
      sizeCanvas();
      window.addEventListener("resize", sizeCanvas);
      var t0 = performance.now();
      var draw = function (now) {
        var t = now - t0;
        var w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";
        for (var i = 0; i < blobs.length; i++) {
          var b = blobs[i];
          var bx = (b.x + Math.sin(t * b.dx) * 0.18) * w;
          var by = (b.y + Math.cos(t * b.dy) * 0.18) * h;
          var br = b.r * Math.max(w, h);
          var g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
          g.addColorStop(0, "rgba(" + b.c.join(",") + ",0.5)");
          g.addColorStop(1, "rgba(" + b.c.join(",") + ",0)");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
        }
        requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
    }
  }

  /* ---------- custom cursor ---------- */
  if (fine && !reduced && hasGsap) {
    var cursor = document.querySelector(".cursor");
    var dot = cursor.querySelector(".cursor-dot");
    var ringEl = cursor.querySelector(".cursor-ring");
    document.body.classList.add("has-cursor");
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; });
    gsap.ticker.add(function () {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      dot.style.transform = "translate(" + (mx - 4) + "px," + (my - 4) + "px)";
      ringEl.style.transform = "translate(" + (rx - 19) + "px," + (ry - 19) + "px)";
    });
    document.querySelectorAll("a, button").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cursor.classList.add("is-hover"); });
      el.addEventListener("mouseleave", function () { cursor.classList.remove("is-hover"); });
    });
    addEventListener("mousedown", function () { cursor.classList.add("is-press"); });
    addEventListener("mouseup", function () { cursor.classList.remove("is-press"); });
  }

  /* ---------- gsap choreography ---------- */
  if (hasGsap && !reduced) {

    /* loader: colored panels sweep, word lifts away */
    var loader = document.querySelector(".loader");
    if (loader) {
      var tl = gsap.timeline();
      tl.to(".loader-panel", { scaleY: 1, duration: 0.55, stagger: 0.09, ease: "power3.inOut" })
        .from(".loader-word", { opacity: 0, y: 30, duration: 0.4, ease: "power2.out" }, "-=0.3")
        .to(".loader-word", { y: -40, opacity: 0, duration: 0.35, ease: "power2.in" }, "+=0.15")
        .to(".loader-panel", { scaleY: 0, duration: 0.6, stagger: 0.07, ease: "power3.inOut", transformOrigin: "bottom" }, "-=0.1")
        .set(loader, { display: "none" });
    }

    /* hero entrance */
    gsap.set(".hero-title .line-inner", { yPercent: 110 });
    gsap.set(".hero-sub, .hero .cta", { opacity: 0, y: 24 });
    gsap.set(".hero-foot .hero-meta", { opacity: 0 });
    var heroTl = gsap.timeline({ delay: 1.5 });
    heroTl
      .to(".hero-title .line-inner", { yPercent: 0, duration: 1.1, stagger: 0.1, ease: "power4.out" })
      .to(".hero-sub", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=0.5")
      .to(".hero .cta", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=0.45")
      .to(".hero-foot .hero-meta", { opacity: 1, duration: 0.6, stagger: 0.1 }, "-=0.4");

    /* section background color shift */
    document.querySelectorAll("[data-bg]").forEach(function (sec) {
      var apply = function () {
        gsap.to("body", { backgroundColor: sec.dataset.bg, duration: 0.7, ease: "power2.out" });
        gsap.to("body", { color: sec.dataset.fg, duration: 0.7, ease: "power2.out" });
      };
      ScrollTrigger.create({
        trigger: sec, start: "top 55%", end: "bottom 45%",
        onEnter: apply, onEnterBack: apply
      });
    });

    /* section titles rise on enter */
    document.querySelectorAll(".sec-title, .contact-title").forEach(function (t) {
      gsap.from(t.querySelectorAll(".line-inner"), {
        yPercent: 110, duration: 1, stagger: 0.09, ease: "power4.out",
        scrollTrigger: { trigger: t, start: "top 78%" }
      });
    });

    /* marquee drift */
    var track = document.querySelector(".marquee-track");
    if (track && track.scrollWidth > 0) {
      var half = track.scrollWidth / 2;
      gsap.to(track, {
        x: -half, duration: 16, ease: "none", repeat: -1,
        modifiers: {
          x: gsap.utils.unitize(function (x) { return parseFloat(x) % half; })
        }
      });
    }

    /* work: pinned horizontal reel */
    var workPin = document.querySelector(".work-pin");
    var workTrack = document.querySelector(".work-track");
    if (workPin && workTrack) {
      var getDist = function () { return Math.max(0, workTrack.scrollWidth - innerWidth); };
      gsap.to(workTrack, {
        x: function () { return -getDist(); },
        ease: "none",
        scrollTrigger: {
          trigger: ".work", start: "top top",
          end: function () { return "+=" + getDist(); },
          pin: true, scrub: 1, invalidateOnRefresh: true
        }
      });
    }

    /* studio copy: words ink in as you scroll */
    var copy = document.getElementById("studio-copy");
    if (copy) {
      var words = copy.textContent.trim().split(/\s+/);
      var frag = "";
      for (var wi = 0; wi < words.length; wi++) {
        frag += '<span class="w">' + words[wi] + "</span> ";
      }
      copy.innerHTML = frag;
      gsap.to(copy.querySelectorAll(".w"), {
        opacity: 1, stagger: 0.04, ease: "none",
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
            duration: 0.4, ease: "power3.out"
          });
        });
        btn.addEventListener("mouseleave", function () {
          gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" });
        });
      });
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
    addEventListener("load", function () { ScrollTrigger.refresh(); });
  }
})();
