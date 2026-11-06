(function () {
  "use strict";

  // Mobile nav
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // Theme toggle
  const root = document.documentElement;
  const themeBtn = document.getElementById("theme-toggle");
  const saved = localStorage.getItem("diwali-theme");
  if (saved) root.setAttribute("data-theme", saved);
  function updateThemeLabel() {
    if (!themeBtn) return;
    const dark =
      root.getAttribute("data-theme") === "dark" ||
      (!root.getAttribute("data-theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    themeBtn.textContent = dark ? "☀️" : "🌙";
    themeBtn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  }
  updateThemeLabel();
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const current = root.getAttribute("data-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      let next;
      if (current === "dark") next = "light";
      else if (current === "light") next = "dark";
      else next = prefersDark ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("diwali-theme", next);
      updateThemeLabel();
    });
  }

  // TOC active section
  const tocLinks = document.querySelectorAll(".toc a[href^='#']");
  const sections = [];
  tocLinks.forEach((a) => {
    const id = a.getAttribute("href").slice(1);
    const el = document.getElementById(id);
    if (el) sections.push({ id, el, a });
  });
  function onScroll() {
    const y = window.scrollY + 120;
    let current = sections[0];
    for (const s of sections) {
      if (s.el.offsetTop <= y) current = s;
    }
    tocLinks.forEach((a) => a.classList.remove("active"));
    if (current) current.a.classList.add("active");
  }
  if (sections.length) {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Gallery lightbox
  const lb = document.getElementById("lightbox");
  if (lb) {
    const lbImg = lb.querySelector("img");
    const lbCap = lb.querySelector(".lightbox-caption");
    const closeBtn = lb.querySelector(".lightbox-close");
    document.querySelectorAll(".gallery-item").forEach((item) => {
      item.addEventListener("click", () => {
        const full = item.getAttribute("data-full") || item.querySelector("img").src;
        const cap = item.getAttribute("data-caption") || "";
        lbImg.src = full;
        lbImg.alt = item.querySelector("img").alt || "";
        lbCap.textContent = cap;
        lb.classList.add("open");
        lb.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
      });
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          item.click();
        }
      });
    });
    function closeLb() {
      lb.classList.remove("open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      lbImg.src = "";
    }
    closeBtn.addEventListener("click", closeLb);
    lb.addEventListener("click", (e) => {
      if (e.target === lb) closeLb();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lb.classList.contains("open")) closeLb();
    });
  }

  // Year in footer
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
