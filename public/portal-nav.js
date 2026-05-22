function activateView(hash) {
  const target = hash || window.location.hash || "#login";
  const id = target.replace("#", "");
  const views = Array.from(document.querySelectorAll(".view"));
  const navItems = Array.from(document.querySelectorAll("[data-nav] a[href^='#']"));
  const fallback = views[0];
  const activeView = document.getElementById(id) || fallback;

  views.forEach((view) => view.classList.toggle("active", view === activeView));
  navItems.forEach((item) => item.classList.toggle("active", item.getAttribute("href") === `#${activeView.id}`));
}

window.addEventListener("hashchange", () => activateView());
activateView(window.location.hash);
