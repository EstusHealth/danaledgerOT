/* Session recap: week planner, saved checklist, contents highlighting */
(function () {
  "use strict";

  // localStorage can throw (private mode, blocked storage), so the page must work without it
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* ignore */ }
    },
  };

  /* ---------- Header shadow ---------- */
  const header = document.querySelector(".site-header");
  const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Checklist + progress ring ---------- */
  const CHECK_KEY = "dlot-recap-checks-v1";
  const checks = store.get(CHECK_KEY, {});
  const boxes = Array.from(document.querySelectorAll(".checklist input[type=checkbox]"));
  const ringFg = document.getElementById("ring-fg");
  const ringLabel = document.getElementById("ring-label");
  const CIRC = 2 * Math.PI * 34;

  function updateRing() {
    const done = boxes.filter((b) => b.checked).length;
    ringLabel.textContent = done + "/" + boxes.length;
    ringFg.style.strokeDashoffset = String(CIRC * (1 - done / boxes.length));
  }
  boxes.forEach((b) => {
    b.checked = Boolean(checks[b.dataset.id]);
    b.addEventListener("change", () => {
      checks[b.dataset.id] = b.checked;
      store.set(CHECK_KEY, checks);
      updateRing();
    });
  });
  updateRing();

  /* ---------- Week planner ---------- */
  const ROLES = [
    { id: "clin", label: "Clinician", color: "#5e3a5c" },
    { id: "deep", label: "Deep work", color: "#b9583a" },
    { id: "admin", label: "Notes & admin", color: "#c48a22" },
    { id: "drive", label: "Driving OT", color: "#5f8aa2" },
    { id: "move", label: "Move", color: "#8a5f86" },
    { id: "family", label: "Family", color: "#74896f" },
    { id: "rest", label: "Rest", color: "#a3968a" },
  ];
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const BLOCKS = ["Before 8am", "8am – 12", "12 – 4:30", "4:30 – 7:30", "7:30 – bed"];
  const PLAN_KEY = "dlot-recap-week-v1";
  // An illustrative week, not a prescription
  const EXAMPLE = {
    "0-0": "move", "1-0": "move", "2-0": "move", "3-0": "move", "4-0": "move",
    "0-1": "drive", "0-2": "admin", "1-1": "deep", "1-2": "clin",
    "2-1": "clin", "2-2": "admin", "3-1": "drive", "3-2": "clin",
    "4-1": "admin", "4-2": "deep",
    "0-3": "family", "1-3": "family", "2-3": "family", "3-3": "family", "4-3": "family",
    "0-4": "rest", "1-4": "rest", "2-4": "rest", "3-4": "rest", "4-4": "rest",
    "5-1": "family", "5-2": "rest", "6-1": "rest", "6-2": "family",
  };

  let plan = store.get(PLAN_KEY, {});
  let current = ROLES[0].id;
  const legend = document.getElementById("legend");
  const grid = document.getElementById("week-grid");
  const note = document.getElementById("plan-note");
  const roleById = Object.fromEntries(ROLES.map((r) => [r.id, r]));

  function renderLegend() {
    const counts = {};
    Object.values(plan).forEach((r) => (counts[r] = (counts[r] || 0) + 1));
    legend.innerHTML = "";
    ROLES.forEach((r) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-pressed", String(r.id === current));
      b.innerHTML = '<i style="background:' + r.color + '"></i>' + r.label + ' <span class="count">' + (counts[r.id] || 0) + "</span>";
      b.addEventListener("click", () => { current = r.id; renderLegend(); });
      legend.appendChild(b);
    });
    const filled = Object.keys(plan).length;
    const deep = counts.deep || 0;
    if (!filled) note.textContent = "Tip: protect your deep-work blocks first, then fit clients around them.";
    else if (!deep) note.textContent = "No deep-work block yet. Where will you work on the business, not just in it?";
    else if (!counts.rest) note.textContent = "Nice. Now where's the rest? Recovery is a block too.";
    else note.textContent = filled + " blocks planned, " + deep + " for deep work. One thing per block. 🐴";
  }

  function renderGrid() {
    grid.innerHTML = '<div></div>' + DAYS.map((d) => '<div class="h">' + d + "</div>").join("");
    BLOCKS.forEach((blk, bi) => {
      const rh = document.createElement("div");
      rh.className = "rowh";
      rh.textContent = blk;
      grid.appendChild(rh);
      DAYS.forEach((day, di) => {
        const key = di + "-" + bi;
        const role = roleById[plan[key]];
        const c = document.createElement("button");
        c.type = "button";
        c.className = "cell" + (role ? " filled" : "");
        if (role) { c.style.background = role.color; c.textContent = role.label; }
        c.setAttribute("aria-label", day + " " + blk + ": " + (role ? role.label : "empty"));
        c.addEventListener("click", () => {
          if (plan[key] === current) delete plan[key];
          else plan[key] = current;
          store.set(PLAN_KEY, plan);
          renderGrid();
          renderLegend();
        });
        grid.appendChild(c);
      });
    });
  }

  document.getElementById("plan-example").addEventListener("click", () => {
    plan = Object.assign({}, EXAMPLE);
    store.set(PLAN_KEY, plan);
    renderGrid(); renderLegend();
  });
  document.getElementById("plan-clear").addEventListener("click", () => {
    plan = {};
    store.set(PLAN_KEY, plan);
    renderGrid(); renderLegend();
  });
  renderGrid();
  renderLegend();

  /* ---------- Contents: highlight the section in view ---------- */
  const tocLinks = Array.from(document.querySelectorAll(".toc a"));
  if ("IntersectionObserver" in window && tocLinks.length) {
    const byId = Object.fromEntries(tocLinks.map((a) => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) {
          tocLinks.forEach((a) => a.classList.remove("active"));
          const a = byId[en.target.id];
          if (a) a.classList.add("active");
        }
      }),
      { rootMargin: "-30% 0px -60% 0px" }
    );
    document.querySelectorAll(".chapter").forEach((s) => io.observe(s));
  }
})();
