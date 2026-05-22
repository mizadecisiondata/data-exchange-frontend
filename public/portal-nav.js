function activeDefaultHash() {
  const defaultView = document.body.dataset.defaultView || "dashboard";
  return `#${defaultView}`;
}

function activateView(hash) {
  const target = hash || window.location.hash || activeDefaultHash();
  const id = target.replace("#", "");
  const views = Array.from(document.querySelectorAll(".view"));
  const navItems = Array.from(document.querySelectorAll("[data-nav] a[href^='#']"));
  const fallback = views[0];
  const activeView = document.getElementById(id) || fallback;

  views.forEach((view) => view.classList.toggle("active", view === activeView));
  navItems.forEach((item) => item.classList.toggle("active", item.getAttribute("href") === `#${activeView.id}`));
}

function showAuthPanel(name) {
  const panels = Array.from(document.querySelectorAll("[data-auth-panel]"));
  panels.forEach((panel) => panel.classList.toggle("is-hidden", panel.dataset.authPanel !== name));
}

function enterPortal() {
  const authGate = document.querySelector("[data-auth-gate]");
  const appShell = document.querySelector("[data-app-shell]");

  if (authGate) {
    authGate.classList.add("is-hidden");
  }

  if (appShell) {
    appShell.classList.remove("is-hidden");
  }

  if (!window.location.hash || window.location.hash === "#login" || window.location.hash === "#registro") {
    window.location.hash = activeDefaultHash();
  }

  activateView(window.location.hash);
}

function toggleExplain() {
  document.querySelectorAll("[data-explain-box]").forEach((box) => {
    box.classList.toggle("is-hidden");
  });
}

document.querySelectorAll("[data-auth-switch]").forEach((button) => {
  button.addEventListener("click", () => showAuthPanel(button.dataset.authSwitch));
});

document.querySelectorAll("[data-register-submit]").forEach((button) => {
  button.addEventListener("click", () => showAuthPanel("pending"));
});

document.querySelectorAll("[data-login-action]").forEach((button) => {
  button.addEventListener("click", enterPortal);
});

document.querySelectorAll("[data-toggle-explain]").forEach((button) => {
  button.addEventListener("click", toggleExplain);
});

window.addEventListener("hashchange", () => activateView());
activateView(window.location.hash);
