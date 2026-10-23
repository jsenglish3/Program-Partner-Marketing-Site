/* Program Partner marketing site — progressive behavior. Everything works without this file. */
(function () {
  "use strict";
  const REDUCE = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Header menus: close other dropdowns, close on Escape / outside click */
  document.querySelectorAll(".site-header details").forEach((d) => {
    d.addEventListener("toggle", () => {
      if (!d.open) return;
      document.querySelectorAll(".site-header details[open]").forEach((o) => { if (o !== d && !o.contains(d)) o.open = false; });
    });
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest(".site-header")) return;
    document.querySelectorAll(".site-header details[open]").forEach((o) => (o.open = false));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") document.querySelectorAll(".site-header details[open]").forEach((o) => (o.open = false));
  });

  /* Generic tabs (home hero) */
  function wireTabs(root, onSelect) {
    const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
    const select = (i, focus) => {
      tabs.forEach((t, j) => {
        const on = i === j;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        const p = document.getElementById(t.getAttribute("aria-controls"));
        if (p && p.id !== "pw-panel") p.hidden = !on;
      });
      if (focus) tabs[i].focus();
      onSelect && onSelect(tabs[i], i);
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(i, false));
      t.addEventListener("keydown", (e) => {
        const n = tabs.length; let j = i;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % n;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + n) % n;
        else if (e.key === "Home") j = 0; else if (e.key === "End") j = n - 1; else return;
        e.preventDefault(); select(j, true);
      });
    });
    return select;
  }
  document.querySelectorAll("[data-tabs]").forEach((r) => wireTabs(r));

  /* Light / dark screenshots (home hero) */
  document.querySelectorAll("[data-theme-switch]").forEach((sw) => {
    const host = sw.closest("[data-shot-theme]");
    const btns = Array.from(sw.querySelectorAll("[data-theme]"));
    btns.forEach((b) => b.addEventListener("click", () => {
      host.setAttribute("data-shot-theme", b.dataset.theme);
      btns.forEach((o) => o.setAttribute("aria-pressed", o === b ? "true" : "false"));
    }));
  });

  /* Product animations: play while on screen, pausable, and paused for reduced motion */
  document.querySelectorAll("[data-shot-video]").forEach((v) => {
    const btn = v.parentElement.querySelector("[data-video-toggle]");
    let userPaused = REDUCE;
    const sync = () => {
      if (!btn) return;
      const playing = !v.paused;
      btn.toggleAttribute("data-playing", playing);
      btn.setAttribute("aria-label", playing ? "Pause animation" : "Play animation");
    };
    const tryPlay = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    v.addEventListener("play", sync);
    v.addEventListener("pause", sync);
    if (btn) {
      btn.hidden = false;
      btn.addEventListener("click", () => {
        if (v.paused) { userPaused = false; tryPlay(); } else { userPaused = true; v.pause(); }
      });
    }
    if (REDUCE) { v.preload = "metadata"; sync(); return; }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => entries.forEach((e) => {
        if (e.isIntersecting) { if (!userPaused) tryPlay(); } else v.pause();
      }), { threshold: 0.35 }).observe(v);
    } else tryPlay();
  });

  /* Home ticker: one pass through the phrases (5 seconds, per the design) each time the heading
     scrolls into view, ending back on the first phrase. One pass keeps it under WCAG's 5-second limit
     for moving content, so it needs no pause button. Static for reduced motion. */
  document.querySelectorAll("[data-ticker]").forEach((el) => {
    if (REDUCE) return;
    const track = el.querySelector(".ticker-track");
    const n = track.children.length;
    track.appendChild(track.children[0].cloneNode(true)); // lets the last step roll forward onto the first phrase
    let running = false, armed = true;
    const set = (i, animate) => {
      track.style.transition = animate ? "" : "none";
      track.style.transform = "translateY(" + (-1.2 * i) + "em)";
    };
    const play = () => {
      running = true; armed = false;
      let i = 0;
      setTimeout(function step() {
        i++; set(i, true);
        if (i < n) setTimeout(step, 1000);
        else setTimeout(() => { set(0, false); running = false; }, 700);
      }, 900);
    };
    if (!("IntersectionObserver" in window)) { play(); return; }
    new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting && e.intersectionRatio >= 0.9) { if (armed && !running) play(); }
      else if (!e.isIntersecting) armed = true;
    }), { threshold: [0, 0.9] }).observe(el);
  });

  /* Let's chat form */
  const form = document.querySelector("[data-chat-form]");
  if (form) {
    const endpoint = form.dataset.endpoint || "";
    const thanks = form.dataset.thanks || "/thanks/";
    const summary = form.querySelector("[data-errors]");
    const serverBox = form.querySelector("[data-server-error]");
    const btn = form.querySelector('button[type="submit"]');
    const LABELS = { name: "your name", email: "your work email", role: "your role", state: "your state", school: "your school, college or studio name", kind: "what kind of program", consent: "permission to email you" };
    const ORDER = ["name", "email", "role", "state", "school", "kind", "consent"];
    try {
      const t = new URLSearchParams(location.search).get("topic");
      const el = t && form.querySelector('input[name=topic][value="' + t + '"]');
      if (el) el.checked = true;
    } catch (e) {}
    const show = (k, msg) => {
      const field = form.querySelector('[data-field="' + k + '"]');
      if (!field) return;
      const ctl = field.querySelector("input,select,textarea");
      let err = field.querySelector(".err");
      if (!err) { err = document.createElement("p"); err.className = "err"; err.id = "err-" + k; field.appendChild(err); }
      err.innerHTML = '<span aria-hidden="true">⚠</span>' + msg;
      if (ctl && k !== "kind") { ctl.setAttribute("aria-invalid", "true"); ctl.setAttribute("aria-describedby", ("err-" + k + " " + (ctl.getAttribute("data-help") || "")).trim()); }
    };
    const clear = () => {
      form.querySelectorAll(".err").forEach((e) => e.remove());
      form.querySelectorAll('[aria-invalid="true"]').forEach((c) => { c.removeAttribute("aria-invalid"); const h = c.getAttribute("data-help"); if (h) c.setAttribute("aria-describedby", h); else c.removeAttribute("aria-describedby"); });
      summary.hidden = true; serverBox.hidden = true;
    };
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      clear();
      const fd = new FormData(form);
      const v = (k) => (fd.get(k) || "").toString().trim();
      const errs = {};
      ["name", "role", "state", "school"].forEach((k) => { if (!v(k)) errs[k] = 1; });
      if (!v("email")) errs.email = 1; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email"))) errs.email = "bad";
      if (!fd.getAll("kind").length) errs.kind = 1;
      if (!fd.get("consent")) errs.consent = 1;
      const msg = (k) => errs[k] === "bad" ? "That email address doesn't look right." : "Please add " + LABELS[k] + ".";
      const list = ORDER.filter((k) => errs[k]);
      if (list.length) {
        list.forEach((k) => show(k, msg(k)));
        summary.querySelector("p").textContent = list.length === 1 ? "One thing needs fixing before we can send this." : list.length + " things need fixing before we can send this.";
        summary.querySelector("ul").innerHTML = list.map((k) => '<li><a href="#' + (k === "kind" ? "f-kind" : "f-" + k) + '">' + msg(k) + "</a></li>").join("");
        summary.hidden = false; summary.focus();
        return;
      }
      if (fd.get("website")) { location.href = thanks; return; } // honeypot filled: pretend success
      // Field names match the app's demoAccessRequestSchema (programhq-fmms, src/lib/demo-access.ts).
      // The app refuses any field it doesn't name, so nothing else goes in this object.
      const kinds = fd.getAll("kind");
      const PROGRAM_KEYS = { "Band": "band", "Choir": "chorus", "Orchestra": "orchestra", "Theatre": "theatre", "Private studio": "studio" };
      const firstProgram = kinds.map((k) => PROGRAM_KEYS[k]).find(Boolean);
      const labelOf = (name, value) => { const el = form.querySelector('input[name="' + name + '"][value="' + value + '"]'); return el ? el.parentElement.textContent.trim() : value; };
      const picked = (name) => fd.getAll(name).map((x) => labelOf(name, x));
      const body = { contactName: v("name"), contactEmail: v("email"), schoolName: v("school"), roleTitle: v("role"), state: v("state"), programTypes: kinds };
      if (firstProgram) body.programKey = firstProgram;
      if (v("size")) body.studentCount = v("size");
      if (picked("topic").length) body.helpWith = picked("topic");
      if (picked("current").length) body.currentTools = picked("current");
      if (v("notes")) body.message = v("notes");
      btn.disabled = true; btn.textContent = "Sending…";
      if (!endpoint) { setTimeout(() => { location.href = thanks; }, 400); return; }
      fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .then((r) => { if (!r.ok) throw new Error(String(r.status)); location.href = thanks; })
        .catch(() => { btn.disabled = false; btn.textContent = btn.dataset.label || "Send"; serverBox.hidden = false; serverBox.focus(); });
    });
  }

  /* Pathways showcase */
  const pw = document.querySelector("[data-pathways]");
  if (pw) {
    const NAMES = ["Skill Pathways", "Choir Karate", "Scale Wars", "Band Olympics", "String Quest"];
    const LEVELS = {
      "Skill Pathways": ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"],
      "Choir Karate": ["White belt", "Yellow belt", "Orange belt", "Green belt", "Black belt"],
      "Scale Wars": ["Recruit", "Cadet", "Captain", "Commander", "Champion"],
      "Band Olympics": ["Bronze", "Silver", "Gold", "Platinum", "Diamond"],
      "String Quest": ["Novice", "Apprentice", "Adept", "Expert", "Master"]
    };
    const SKILLS = {
      "Choir Karate": ["Major scale on solfège", "Sight-singing, exercise 4", "Breath support, 20 seconds"],
      "String Quest": ["D major scale, two octaves", "Spiccato on open strings", "Shifting to third position"],
      default: ["Concert F scale", "Chromatic scale, one octave", "Lip slurs, set 2"]
    };
    const LV_C = [["#FFFDF9", "#1C292C"], ["#E8C46A", "#1C292C"], ["#E07655", "#1C292C"], ["#5E9A78", "#1C292C"], ["#1C292C", "#F9F5E8"]];
    const SEC = {
      Fl: ["Flute", "#AA452B", "#FFFDF9"], Cl: ["Clarinet", "#C99A2E", "#1C292C"], Sx: ["Saxophone", "#3E7D5A", "#FFFDF9"], Tp: ["Trumpet", "#3F5E7A", "#FFFDF9"], LB: ["Low brass", "#6B4E71", "#FFFDF9"],
      S: ["Soprano", "#AA452B", "#FFFDF9"], A: ["Alto", "#C99A2E", "#1C292C"], T: ["Tenor", "#3E7D5A", "#FFFDF9"], B: ["Bass", "#3F5E7A", "#FFFDF9"]
    };
    const BAND_ROWS = [["Fl", "Fl", "Fl", "Fl", "Cl", "Cl"], ["Cl", "Cl", "Cl", "Cl", "Sx", "Sx", "Sx", "Sx"], ["Tp", "Tp", "Tp", "Tp", "Tp", "LB", "LB", "LB", "LB", "LB"]];
    const BAND_INIT = ["AM", "JL", "EB", "MP", "NK", "RT", "OS", "CW", "LH", "DF", "GV", "IR", "PQ", "SB", "HC", "TN", "UZ", "VA", "WE", "XM", "KD", "YO", "BJ", "QL"];
    const CHOIR_ROWS = [["T", "T", "T", "T", "T", "B", "B", "B", "B", "B"], ["S", "S", "S", "S", "A", "A", "A", "A", "A"], ["S", "S", "S", "S", "A", "A", "A", "A"]];
    const CHOIR_INIT = ["LM", "SA", "ER", "OT", "NK", "JP", "CW", "ID", "ML", "TB", "MR", "AK", "LC", "ZP", "SL", "CD", "RT", "IN", "HF", "EW", "GH", "NB", "EM", "LG", "MS", "AJ", "JO"];
    const STEPS = { path: 7, practice: 7, class: 11, concert: 12 };
    const bandSeats = () => { const out = []; const cx = 430, cy = 610, R = [175, 275, 375]; BAND_ROWS.forEach((row, r) => row.forEach((sec, i) => { const a = (200 + 140 * (i + 0.5) / row.length) * Math.PI / 180; out.push({ sec, x: cx + R[r] * Math.cos(a), y: cy + R[r] * Math.sin(a) }); })); return out; };
    const choirSeats = () => { const out = []; const Y = [222, 342, 462]; CHOIR_ROWS.forEach((row, r) => row.forEach((sec, i) => out.push({ sec, x: 420 + (i - (row.length - 1) / 2) * 76, y: Y[r] }))); return out; };
    const ICON = ((document.querySelector("link[rel=icon]") || {}).href || "/assets/favicon.svg").replace("favicon.svg", "logo-icon-rust.svg");
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

    const stage = pw.querySelector("[data-pw-stage]");
    const canvas = pw.querySelector("[data-pw-canvas]");
    const caption = pw.querySelector("[data-pw-caption]");
    const panel = pw.querySelector("#pw-panel");
    let name = NAMES[0], tab = "path", st = 99, iv = null, started = false;

    const fit = () => { canvas.style.transform = "scale(" + stage.clientWidth / 1120 + ")"; };
    new ResizeObserver(fit).observe(stage); fit();

    const press = (n) => st === n ? "transform:scale(.94);box-shadow:0 0 0 4px rgb(170 69 43 / .3)" : "";
    const P = (label, n) => '<span style="font-size:14px;font-weight:600;padding:10px 16px;border-radius:8px;background:#AA452B;color:#FFFDF9;border:1.5px solid #AA452B;transition:transform .2s ease,box-shadow .2s ease;' + press(n) + '">' + label + "</span>";
    const O = (label, n) => '<span style="font-size:14px;font-weight:600;padding:10px 16px;border-radius:8px;background:#FFFDF9;color:#1C292C;border:1.5px solid #1C292C;transition:transform .2s ease,box-shadow .2s ease;' + press(n) + '">' + label + "</span>";
    const topbar = (crumb, title, actions) => '<div style="position:absolute;left:0;top:0;right:0;height:72px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 28px;background:#FFFDF9;border-bottom:1px solid #CAD7D9"><div style="display:flex;align-items:center;gap:14px"><img src="' + ICON + '" alt="" style="width:30px;height:30px"><div style="display:flex;flex-direction:column;gap:2px"><span style="font-size:13px;color:#4B5F64">' + esc(crumb) + '</span><span style="font-family:var(--font-serif);font-weight:500;font-size:24px;line-height:1.1">' + esc(title) + '</span></div></div><div style="display:flex;gap:10px;align-items:center">' + actions + "</div></div>";

    function render() {
      const lv = LEVELS[name];
      let html = "", alt = "", cap = "";
      if (tab === "path") {
        const skills = SKILLS[name] || SKILLS.default;
        html += topbar("Teaching · " + name, name, O("Quick Skill Check", -1) + P("New skill", -1));
        alt = name + ": five levels with how many students have passed each, and a review queue where the director passes a video submission or asks the student to try again.";
        cap = "Students submit video or audio from their phones. You pass it or send it back with a note, and their level updates on its own.";
        const bump = st >= 2 ? 1 : 0;
        html += '<div style="position:absolute;left:28px;top:92px;width:500px;display:flex;flex-direction:column;gap:10px"><span style="font-size:15px;font-weight:600">Levels · Symphonic Band</span>';
        lv.forEach((l, i) => {
          const passed = [24, 19 + bump, 12, 6, 2][i], pct = Math.round(passed / 24 * 100), skillsN = [8, 8, 10, 10, 12][i];
          html += '<div style="display:flex;align-items:center;gap:14px;background:#FFFDF9;border:1px solid #CAD7D9;border-radius:12px;padding:12px 16px"><span style="width:34px;height:34px;flex:none;border-radius:50%;background:' + LV_C[i][0] + ";color:" + LV_C[i][1] + ';display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;border:1.5px solid #1C292C">' + (i + 1) + '</span><div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px"><div style="display:flex;justify-content:space-between;font-size:15px"><span style="font-weight:600">' + esc(l) + '</span><span style="color:#4B5F64">' + passed + ' of 24 passed</span></div><div style="height:8px;border-radius:99px;background:#EFE3D0;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:#AA452B;transition:width .8s ease"></div></div><span style="font-size:12px;color:#4B5F64">' + skillsN + " skills</span></div></div>";
        });
        html += "</div>";
        const q = [["Ava Martinez", skills[0], lv[1], "0:42"], ["Jordan Lee", skills[1], lv[1], "1:05"], ["Maya Patel", skills[2], lv[2], "0:58"]];
        html += '<div style="position:absolute;left:556px;top:92px;width:536px;display:flex;flex-direction:column;gap:10px"><span style="font-size:15px;font-weight:600">Review queue</span>';
        q.forEach(([student, skill, level, len], i) => {
          const doneAt = i === 0 ? 2 : i === 1 ? 4 : 99, done = st >= doneAt, fail = i === 1;
          const passS = (i === 0 && st === 1) ? "transform:scale(.92)" : "", tryS = (i === 1 && st === 3) ? "transform:scale(.92)" : "";
          html += '<div style="background:#FFFDF9;border:1px solid #CAD7D9;border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:10px"><div style="display:flex;align-items:center;gap:12px"><span style="width:56px;height:40px;flex:none;border-radius:6px;background:#1C292C;color:#F9F5E8;display:flex;align-items:center;justify-content:center;font-size:12px">▶ ' + len + '</span><div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><span style="font-size:15px;font-weight:600">' + student + '</span><span style="font-size:13px;color:#4B5F64">' + esc(skill) + " · " + esc(level) + "</span></div>";
          if (!done) html += '<div style="display:flex;gap:6px"><span style="font-size:13px;font-weight:600;padding:8px 12px;border-radius:8px;background:#AA452B;color:#FFFDF9;transition:transform .2s ease;' + passS + '">Pass</span><span style="font-size:13px;font-weight:600;padding:8px 12px;border-radius:8px;border:1.5px solid #1C292C;transition:transform .2s ease;' + tryS + '">Try again</span></div>';
          else html += '<span style="font-size:13px;font-weight:600;padding:5px 12px;border-radius:999px;background:' + (fail ? "#FDD4C6" : "#E3EEE6") + ";color:" + (fail ? "#6A2E1F" : "#1F5133") + '">' + (fail ? "↻ Try again" : "✓ Passed") + "</span>";
          html += "</div>";
          if (fail && done) html += '<div style="font-size:13px;line-height:1.45;background:#EFE3D0;border-radius:8px;padding:8px 12px">Nice tone. Keep the tempo steady through measure 3, then send it again.</div>';
          html += "</div>";
        });
        html += '<div style="font-size:13px;color:#4B5F64;padding:4px 2px">Quick Skill Check: pass a student in person, right from rehearsal.</div></div>';
      }
      if (tab === "practice") {
        const mins = [20, 30, 0, 25, 35, 15, 10], shown = st >= 1 || st === 99;
        const total = shown ? mins.reduce((a, b) => a + b, 0) : 0;
        html += topbar("Teaching · Practice Studio", "Practice log", O("Weekly expectations", -1) + P("Give feedback", 5));
        alt = "Practice log for one student: minutes practiced each day, 135 of 120 weekly minutes, a reflection with a recording, parent sign-off and director feedback.";
        cap = "Students log minutes, write a reflection and attach a recording. Parents can sign off, and you reply with feedback.";
        html += '<div style="position:absolute;left:28px;top:92px;width:560px;bottom:24px;background:#FFFDF9;border:1px solid #CAD7D9;border-radius:12px;padding:20px 22px;display:flex;flex-direction:column;gap:16px"><div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:16px;font-weight:600">Ava Martinez · Clarinet</span><span style="font-size:13px;color:#4B5F64">Week of Oct 12</span></div><div style="display:flex;flex-direction:column;gap:6px"><div style="display:flex;justify-content:space-between;font-size:14px"><span style="font-weight:500">Weekly expectation</span><span style="color:#4B5F64">' + total + ' of 120 minutes</span></div><div style="height:12px;border-radius:99px;background:#EFE3D0;overflow:hidden"><div style="height:100%;width:' + Math.min(100, Math.round(total / 120 * 100)) + '%;background:#AA452B;transition:width 1s ease"></div></div>' + (total >= 120 && st >= 3 ? '<span style="font-size:13px;font-weight:600;color:#1F5133">✓ Expectation met</span>' : "") + '</div><div style="flex:1;display:flex;align-items:flex-end;gap:14px;padding-top:10px;border-top:1px solid #EFE3D0">';
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((day, i) => {
          html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end"><span style="font-size:12px;color:#4B5F64">' + (shown ? mins[i] + "m" : "") + '</span><div style="width:100%;height:' + (shown ? Math.max(4, mins[i] * 8) : 4) + "px;background:" + (mins[i] ? "#AA452B" : "#CAD7D9") + ";border-radius:6px 6px 0 0;transition:height .6s ease " + (i * 80) + 'ms"></div><span style="font-size:13px;font-weight:500">' + day + "</span></div>";
        });
        html += "</div></div>";
        const signOn = st >= 4, fbOn = st >= 6;
        html += '<div style="position:absolute;left:612px;top:92px;width:480px;display:flex;flex-direction:column;gap:12px"><div style="background:#FFFDF9;border:1px solid #CAD7D9;border-radius:12px;padding:16px 18px;display:flex;flex-direction:column;gap:8px"><span style="font-size:14px;font-weight:600">Reflection</span><span style="font-size:14px;line-height:1.5">Measures 34–58 of Sea Songs are finally clean at 96. The low C still cracks when I rush the breath.</span><span style="display:flex;align-items:center;gap:8px;font-size:13px;color:#4B5F64"><span style="width:28px;height:28px;border-radius:50%;background:#1C292C;color:#F9F5E8;display:flex;align-items:center;justify-content:center;font-size:11px">▶</span>Recording · 1:12</span></div>';
        html += '<div style="background:#FFFDF9;border:1px solid #CAD7D9;border-radius:12px;padding:16px 18px;display:flex;justify-content:space-between;align-items:center;opacity:' + (signOn ? 1 : 0) + ";transform:translateY(" + (signOn ? 0 : 10) + 'px);transition:opacity .4s ease,transform .4s ease"><span style="font-size:14px;font-weight:600">Parent sign-off</span><span style="font-size:13px;font-weight:600;padding:5px 12px;border-radius:999px;background:#E3EEE6;color:#1F5133">✓ Signed by J. Martinez</span></div>';
        html += '<div style="background:#EFE3D0;border-radius:12px;padding:16px 18px;display:flex;flex-direction:column;gap:6px;opacity:' + (fbOn ? 1 : 0) + ";transform:translateY(" + (fbOn ? 0 : 10) + 'px);transition:opacity .4s ease,transform .4s ease"><span style="font-size:14px;font-weight:600">Feedback from Mr. Hale</span><span style="font-size:14px;line-height:1.5">Big week. Try a slow breath on beat 4 before the low C, then record it again Friday.</span></div></div>';
      }
      if (tab === "class" || tab === "concert") {
        const isClass = tab === "class";
        const seats = isClass ? bandSeats() : choirSeats();
        const inits = isClass ? BAND_INIT : CHOIR_INIT;
        const placed = st >= 2, A = isClass ? 7 : 12, B = isClass ? 6 : 15;
        const lift = st >= 5 && st < 6, swapped = st >= 6;
        const counts = {}; seats.forEach((s) => { counts[s.sec] = (counts[s.sec] || 0) + 1; });
        if (isClass) {
          html += topbar("Seating · Symphonic Band", "Class seating", P("Seat by ranking", 1) + O("Save chart", 8));
          alt = "Class seating chart for Symphonic Band: 24 students seated in three curved rows, color coded and labeled by section, seated from their " + name + " rankings. Two clarinets are dragged and swapped.";
          cap = "Seat a class from its " + name + " rankings, then drag to adjust. Drop a student on a filled chair and the two swap. Class seating stays separate from concert charts.";
          html += '<div style="position:absolute;left:28px;top:90px;display:flex;gap:8px;align-items:center;font-size:14px;color:#4B5F64"><span>Seat by</span><span style="font-size:14px;font-weight:500;padding:6px 14px;border-radius:999px;background:#1C292C;color:#F9F5E8;border:1.5px solid #1C292C">✓ ' + esc(name) + ' ranking</span><span style="font-size:14px;font-weight:500;padding:6px 14px;border-radius:999px;background:#FFFDF9;color:#1C292C;border:1.5px solid #CAD7D9">Section</span></div>';
          html += '<div style="position:absolute;left:350px;top:616px;width:160px;text-align:center;font-size:12px;font-weight:600;letter-spacing:.2em;color:#4B5F64;padding:6px 0;background:#EFE3D0;border-radius:6px">PODIUM</div>';
        } else {
          html += topbar("Seating · Winter Concert", "Concert seating", P("Auto-arrange", 1) + O("Export PDF", 8));
          alt = "Concert riser chart combining Concert Choir and Chamber Singers: 27 singers on three riser steps, color coded and labeled by voice part, arranged by part and height. Two sopranos are dragged and swapped, then the chart is exported as a PDF.";
          cap = "Combine whole ensembles or hand-picked students. Auto-arrange by voice part and height, drag to fine-tune, and export a PDF for the stage crew.";
          html += '<div style="position:absolute;left:28px;top:90px;display:flex;gap:8px;align-items:center;font-size:14px;color:#4B5F64"><span>Combine</span><span style="font-size:14px;font-weight:500;padding:6px 14px;border-radius:999px;background:#1C292C;color:#F9F5E8;border:1.5px solid #1C292C">✓ Concert Choir</span><span style="font-size:14px;font-weight:500;padding:6px 14px;border-radius:999px;background:#1C292C;color:#F9F5E8;border:1.5px solid #1C292C">✓ Chamber Singers</span><span style="font-size:14px;font-weight:500;padding:6px 14px;border-radius:999px;background:#FFFDF9;color:#1C292C;border:1.5px solid #CAD7D9">Arrange by height</span></div>';
          [[20, 180, 800, 120, "#E9DCC4"], [50, 300, 740, 120, "#EFE3D0"], [80, 420, 680, 120, "#F4ECDC"]].forEach((r) => {
            html += '<div style="position:absolute;left:' + r[0] + "px;top:" + r[1] + "px;width:" + r[2] + "px;height:" + r[3] + "px;background:" + r[4] + ';border-top:3px solid #D9C9AE;border-radius:6px"></div>';
          });
          html += '<div style="position:absolute;left:340px;top:600px;width:160px;text-align:center;font-size:12px;font-weight:600;letter-spacing:.2em;color:#4B5F64;padding:6px 0;background:#EFE3D0;border-radius:6px">AUDIENCE</div>';
        }
        const status = placed ? (isClass ? "✓ All 24 seated from " + name + " rankings" : "✓ All 27 placed by voice part, shortest in front") : "Unseated · " + seats.length;
        html += '<div style="position:absolute;left:870px;top:88px;width:222px;bottom:20px;background:#FFFDF9;border:1px solid #CAD7D9;border-radius:12px"></div><div style="position:absolute;left:886px;top:102px;width:192px;font-size:13px;font-weight:600;color:' + (placed ? "#1F5133" : "#4B5F64") + '">' + esc(status) + "</div>";
        html += '<div style="position:absolute;left:886px;top:440px;width:192px;display:flex;flex-direction:column;gap:8px"><span style="font-size:13px;font-weight:600">' + (isClass ? "Sections" : "Voice parts") + "</span>";
        Object.keys(counts).forEach((k) => { html += '<span style="display:flex;align-items:center;gap:8px;font-size:13px"><span style="width:14px;height:14px;border-radius:50%;background:' + SEC[k][1] + '"></span>' + SEC[k][0] + " · " + counts[k] + "</span>"; });
        html += "</div>";
        const secIdx = {};
        seats.forEach((s, i) => {
          secIdx[s.sec] = (secIdx[s.sec] || 0) + 1;
          let tx = s.x, ty = s.y;
          if (swapped && i === A) { tx = seats[B].x; ty = seats[B].y; }
          if (swapped && i === B) { tx = seats[A].x; ty = seats[A].y; }
          if (lift && i === A) { tx = (s.x + seats[B].x) / 2; ty = (s.y + seats[B].y) / 2 - 30; }
          const p = (i * 7) % seats.length, trayX = 902 + (p % 4) * 46, trayY = 136 + Math.floor(p / 4) * 44;
          const d = isClass ? 44 : 46, sz = placed ? d : 34;
          const c = SEC[s.sec][1], cfg = SEC[s.sec][2];
          const x = (placed ? tx : trayX + 6) - sz / 2, y = (placed ? ty : trayY + 6) - sz / 2;
          const delay = placed && st < 5 ? i * 35 : 0, isLift = lift && i === A;
          html += '<div style="position:absolute;left:' + x + "px;top:" + y + "px;width:" + sz + "px;display:flex;flex-direction:column;align-items:center;gap:2px;transform:scale(" + (isLift ? 1.18 : 1) + ");z-index:" + (isLift ? 10 : 1) + ";transition:left .7s cubic-bezier(.4,0,.2,1) " + delay + "ms,top .7s cubic-bezier(.4,0,.2,1) " + delay + 'ms,transform .2s ease"><span style="width:' + sz + "px;height:" + sz + "px;border-radius:50%;background:" + c + ";color:" + cfg + ";border:3px solid #FFFDF9;box-sizing:border-box;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;box-shadow:" + (isLift ? "0 14px 24px -6px rgb(28 41 44 / .45)" : "none") + '">' + inits[i] + '</span><span style="font-size:10px;font-weight:600;color:#4B5F64;white-space:nowrap">' + (placed ? (isClass ? s.sec + " " + secIdx[s.sec] : s.sec) : "") + "</span></div>";
        });
        const toast = isClass ? (st >= 9 ? "Chart saved as “Fall rehearsal”" : "Owen S. and Ruby T. swapped · Saved") : (st >= 9 ? "Concert-Choir-Risers.pdf is ready" : "Grace H. and Lily C. swapped · Saved");
        const toastOp = (st >= 6 && st <= 11 && st !== 99) ? 1 : 0;
        html += '<div style="position:absolute;left:0;width:840px;top:' + (isClass ? 92 : 560) + "px;display:flex;justify-content:center;opacity:" + toastOp + ';transition:opacity .3s ease;z-index:20"><span style="background:#1C292C;color:#F9F5E8;font-size:15px;font-weight:500;padding:10px 18px;border-radius:10px">' + toast + "</span></div>";
      }
      canvas.innerHTML = html;
      stage.setAttribute("aria-label", alt);
      caption.textContent = cap;
    }

    function play() {
      clearInterval(iv);
      if (REDUCE) { st = 99; render(); return; }
      const max = STEPS[tab]; st = 0; render();
      iv = setInterval(() => { if (st >= max) { clearInterval(iv); return; } st++; render(); }, 650);
    }
    const tabSel = wireTabs(pw.querySelector("[data-pw-tabs]"), (btn) => {
      tab = btn.dataset.tab; panel.setAttribute("aria-labelledby", btn.id); play();
    });
    pw.querySelectorAll("[data-pw-names] .chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        name = chip.dataset.name;
        pw.querySelectorAll("[data-pw-names] .chip").forEach((c) => c.setAttribute("aria-pressed", c === chip ? "true" : "false"));
        pw.querySelector("#pw-tab-path").textContent = name;
        play();
      });
    });
    pw.querySelector("[data-pw-replay]").addEventListener("click", play);
    render();
    new IntersectionObserver((es) => { if (es[0].isIntersecting && !started) { started = true; play(); } }, { threshold: 0.35 }).observe(stage);
  }
})();
