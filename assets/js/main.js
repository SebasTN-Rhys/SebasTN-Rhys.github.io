// Smooth-scroll for in-page anchors
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const target = this.getAttribute("href");
    if (!target || target === "#") return;
    const el = document.querySelector(target);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth" });
  });
});

// Mobile menu toggle (only wires up if both elements exist)
const menuToggle = document.querySelector(".menu-toggle");
const siteNavigation = document.querySelector(".site-navigation");
if (menuToggle && siteNavigation) {
  menuToggle.addEventListener("click", () => {
    siteNavigation.classList.toggle("open");
  });
}

// Footer year
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}
