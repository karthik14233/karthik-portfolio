(function () {
  "use strict";
  var root = document.documentElement;

  // Theme toggle (dark by default, remembered in localStorage)
  var themeBtn = document.getElementById("themeBtn");
  function syncTheme() {
    var light = root.dataset.theme === "light";
    themeBtn.setAttribute("aria-pressed", String(light));
    themeBtn.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = light ? "#f3f6fc" : "#0b1730";
  }
  themeBtn.addEventListener("click", function () {
    root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
    syncTheme();
  });
  syncTheme();

  // Mobile menu
  var menuBtn = document.getElementById("menuBtn");
  var links = document.getElementById("navLinks");
  menuBtn.addEventListener("click", function () {
    var open = links.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  links.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      links.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });

  document.getElementById("year").textContent = new Date().getFullYear();

  // Visitor counter
  var visitsEl = document.getElementById("visits");
  fetch("/api/visits", { headers: { Accept: "application/json" } })
    .then(function (r) { return r.json(); })
    .then(function (d) { visitsEl.textContent = d.ok ? d.visits.toLocaleString() : "n/a"; })
    .catch(function () { visitsEl.textContent = "n/a"; });

  // Contact form
  var form = document.getElementById("contactForm");
  var statusEl = document.getElementById("formStatus");
  var sendBtn = document.getElementById("sendBtn");
  var fields = ["name", "email", "message"];

  function showErrors(errors) {
    fields.forEach(function (f) {
      var msg = errors[f] || "";
      document.getElementById(f + "-err").textContent = msg;
      document.getElementById(f).setAttribute("aria-invalid", msg ? "true" : "false");
    });
  }
  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = "status" + (kind ? " " + kind : "");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      message: form.message.value.trim(),
      website: form.website.value
    };
    var errors = {};
    if (payload.name.length < 2) errors.name = "Enter your name (at least 2 characters).";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) errors.email = "Enter a valid email address.";
    if (payload.message.length < 10) errors.message = "Write a message of at least 10 characters.";
    showErrors(errors);
    if (Object.keys(errors).length) {
      document.getElementById(Object.keys(errors)[0]).focus();
      return;
    }

    sendBtn.disabled = true;
    setStatus("Sending...", "");
    fetch("/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (res.ok && res.d.ok) {
          form.reset();
          showErrors({});
          setStatus(res.d.message, "ok");
        } else {
          var errs = res.d.errors || {};
          showErrors(errs);
          setStatus(errs.form || "Check the highlighted fields.", "bad");
        }
      })
      .catch(function () { setStatus("Network error. Check your connection and try again.", "bad"); })
      .finally(function () { sendBtn.disabled = false; });
  });

  // Scroll reveal (content stays visible if JS or IntersectionObserver is unavailable)
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".section h2, .card, .intro").forEach(function (el) {
      el.classList.add("reveal"); io.observe(el);
    });
  }
})();
