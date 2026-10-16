/* ==========================================================================
   Dana Ledger OT: site behaviour
   ========================================================================== */

/* --------------------------------------------------------------------------
   SETTINGS: the only bit you should need to edit
   --------------------------------------------------------------------------
   bookingUrl      Your Google Calendar "appointment schedule" booking page.
                   Google Calendar → Create → Appointment schedule → Share →
                   "Booking page" link (looks like https://calendar.app.google/…).
   bookingEmbedUrl Optional. From the same Share menu choose "Website embed",
                   copy the src="…" address out of the iframe code
                   (https://calendar.google.com/calendar/appointments/schedules/…?gv=true).
                   If set, the calendar appears inline on the page.
   email           Where "prefer to email?" links go while booking is off.
   -------------------------------------------------------------------------- */
const SITE = {
  bookingUrl: "",
  bookingEmbedUrl: "",
  email: "hello@example.com",
};

(function () {
  "use strict";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Header shadow + mobile nav ---------- */
  const header = document.querySelector(".site-header");
  const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const toggle = document.querySelector(".nav-toggle");
  const links = document.getElementById("nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    links.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Booking (Google Calendar) ---------- */
  const hasBooking = Boolean(SITE.bookingUrl);
  document.querySelectorAll("[data-book]").forEach((a) => {
    if (hasBooking) {
      if (a.hasAttribute("data-book-external") || !SITE.bookingEmbedUrl) {
        a.href = SITE.bookingUrl;
        a.target = "_blank";
        a.rel = "noopener";
      } else {
        a.href = "#book";
      }
    } else if (a.hasAttribute("data-book-external")) {
      a.href = "mailto:" + SITE.email + "?subject=" + encodeURIComponent("Welcome chat");
      a.lastChild.textContent = " Email to book a welcome chat";
    }
  });
  const widget = document.getElementById("booking-widget");
  if (widget && SITE.bookingEmbedUrl) {
    widget.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.src = SITE.bookingEmbedUrl;
    iframe.title = "Book a welcome chat with Dana";
    iframe.loading = "lazy";
    widget.appendChild(iframe);
  } else if (widget && hasBooking) {
    const overlay = widget.querySelector(".cal-overlay");
    if (overlay) {
      overlay.innerHTML =
        '<div><h3>Pick a time that suits you</h3><p>Opens Google Calendar in a new tab.</p>' +
        '<a class="btn btn--clay" target="_blank" rel="noopener" href="' + SITE.bookingUrl + '">See available times</a></div>';
    }
  }

  /* ---------- The guilt ledger ---------- */
  const items = Array.from(document.querySelectorAll("#ledger-expect .ledger-item"));
  const balance = document.getElementById("ledger-balance");
  const meter = document.getElementById("ledger-meter");
  const msgTitle = document.getElementById("ledger-msg-title");
  const msgBody = document.getElementById("ledger-msg-body");
  const messages = [
    { max: 0, title: "Nothing left on the books?", body: "Rest is allowed too. Together we'd find the two or three that really matter." },
    { max: 2, title: "Now that's a ledger you can live with", body: "A couple of things, done properly and with your full attention. That's the whole idea." },
    { max: 4, title: "Getting lighter", body: "Notice that? Less to carry means more of you for what's left." },
    { max: 99, title: "open loops pulling at you", body: "That's a lot of divided attention, and none of it is getting the real you." },
  ];
  function updateLedger() {
    const left = items.filter((b) => b.getAttribute("aria-pressed") !== "true").length;
    const m = messages.find((x) => left <= x.max);
    balance.textContent = left;
    msgTitle.textContent = m.title;
    msgBody.textContent = m.body;
    const ok = left <= 2;
    balance.classList.toggle("ok", ok);
    meter.classList.toggle("ok", ok);
    meter.firstElementChild.style.width = Math.max(4, (left / items.length) * 100) + "%";
  }
  items.forEach((b) =>
    b.addEventListener("click", () => {
      b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"));
      updateLedger();
    })
  );
  if (items.length) updateLedger();

  /* ---------- Hero: tangled threads → one line ---------- */
  const svg = document.getElementById("loops");
  if (!svg) return;
  const NS = "http://www.w3.org/2000/svg";
  const W = 520, H = 360, CY = 196, X0 = 64, X1 = 492, N = 56;
  const colors = ["#b9583a", "#5e3a5c", "#74896f", "#d6a03c", "#9cb8c9"];

  // Seeded random so the tangle looks the same on every visit
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  const threads = colors.map((c, k) => {
    const loops = 2.6 + k * 0.55;
    const phase = rnd() * Math.PI * 2;
    const yShift = (k - 2) * 22 + (rnd() - 0.5) * 30;
    const tangled = [], straight = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const env = Math.sin(Math.PI * t); // loops are biggest in the middle
      const r = (28 + 48 * env) * (0.75 + rnd() * 0.5);
      const th = t * Math.PI * 2 * loops + phase;
      tangled.push([
        X0 + t * (X1 - X0) + Math.cos(th) * r * 1.25 + (rnd() - 0.5) * 10,
        CY - 30 + yShift * env + Math.sin(th) * r + (rnd() - 0.5) * 10,
      ]);
      straight.push([
        X0 + t * (X1 - X0),
        CY + Math.sin(t * Math.PI * 2.2) * 10 * (1 - t * 0.4) + (k - 2) * 1.1,
      ]);
    }
    const path = document.createElementNS(NS, "path");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", c);
    path.setAttribute("stroke-width", k === 1 ? 3.4 : 2.6);
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("opacity", "0.9");
    svg.appendChild(path);
    return { path, tangled, straight };
  });

  // Little dot at the end of the line: "the one thing"
  const dot = document.createElementNS(NS, "circle");
  dot.setAttribute("r", "7");
  dot.setAttribute("fill", "#2a1d2e");
  svg.appendChild(dot);

  function toPath(pts) {
    // Catmull-Rom → cubic Bézier for smooth curves
    let d = "M" + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += "C" + c1x.toFixed(1) + " " + c1y.toFixed(1) + " " + c2x.toFixed(1) + " " + c2y.toFixed(1) + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    return d;
  }
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const from = document.getElementById("loops-from");
  const to = document.getElementById("loops-to");

  function render(p) {
    threads.forEach((th, k) => {
      // stagger: each thread untangles slightly after the previous one
      const local = Math.min(1, Math.max(0, (p * 1.4 - k * 0.1)));
      const e = ease(local);
      const pts = th.tangled.map((a, i) => [a[0] + (th.straight[i][0] - a[0]) * e, a[1] + (th.straight[i][1] - a[1]) * e]);
      th.path.setAttribute("d", toPath(pts));
      if (k === 1) {
        const last = pts[pts.length - 1];
        dot.setAttribute("cx", last[0]);
        dot.setAttribute("cy", last[1]);
      }
    });
    dot.setAttribute("opacity", Math.max(0, (p - 0.75) * 4));
    from.style.opacity = String(Math.max(0, 1 - p * 2));
    to.style.opacity = String(Math.max(0, p * 2 - 1));
  }

  let raf = null;
  function animate(fromP, toP, dur, done) {
    cancelAnimationFrame(raf);
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      render(fromP + (toP - fromP) * t);
      if (t < 1) raf = requestAnimationFrame(step);
      else if (done) done();
    };
    raf = requestAnimationFrame(step);
  }

  if (reduceMotion) {
    render(1);
  } else {
    render(0);
    setTimeout(() => animate(0, 1, 4200), 1100);
  }

  const replay = document.getElementById("loops-replay");
  if (replay) {
    replay.addEventListener("click", () => {
      if (reduceMotion) { render(0); setTimeout(() => render(1), 1200); return; }
      animate(1, 0, 900, () => setTimeout(() => animate(0, 1, 4200), 700));
    });
  }
})();
