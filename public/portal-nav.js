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
  const requestedView = document.getElementById(id) || fallback;
  const isPending = document.body.dataset.accountState === "pending";
  const locked = isPending && requestedView?.hasAttribute("data-requires-approved");
  const activeView = locked ? document.getElementById("estado") || fallback : requestedView;

  views.forEach((view) => view.classList.toggle("active", view === activeView));
  navItems.forEach((item) => item.classList.toggle("active", item.getAttribute("href") === `#${activeView.id}`));

  if (locked) {
    window.location.hash = `#${activeView.id}`;
    showAccessNotice("Las funciones productivas quedan bloqueadas hasta aprobar documentos habilitantes. Puedes revisar estado, cargar documentos y preparar una carga no productiva.");
  }
}

function showAuthPanel(name) {
  const panels = Array.from(document.querySelectorAll("[data-auth-panel]"));
  panels.forEach((panel) => panel.classList.toggle("is-hidden", panel.dataset.authPanel !== name));
}

function applyAccessState(state) {
  document.body.dataset.accountState = state;
  const isPending = state === "pending";
  const modeLabel = isPending ? "Cliente pendiente" : "Cliente aprobado";
  const modeCopy = isPending
    ? "Pendiente de aprobacion documental; solo entorno no productivo habilitado."
    : "Acceso visual aprobado; modulos abiertos segun modalidad demo.";

  document.querySelectorAll("[data-session-mode]").forEach((item) => {
    item.textContent = modeLabel;
  });

  document.querySelectorAll("[data-session-copy]").forEach((item) => {
    item.textContent = modeCopy;
  });

  document.querySelectorAll("[data-requires-approved]").forEach((view) => {
    view.classList.toggle("is-access-locked", isPending);
  });

  document.querySelectorAll("[data-nav-requires-approved]").forEach((item) => {
    item.classList.toggle("locked", isPending);
    item.setAttribute("aria-disabled", isPending ? "true" : "false");
  });
}

function showAccessNotice(message) {
  document.querySelectorAll("[data-access-notice]").forEach((item) => {
    item.textContent = message;
    item.classList.remove("is-hidden");
  });
}

function enterPortal(event) {
  const authGate = document.querySelector("[data-auth-gate]");
  const appShell = document.querySelector("[data-app-shell]");
  const state = event?.currentTarget?.dataset.accountMode || "approved";

  applyAccessState(state);

  if (authGate) {
    authGate.classList.add("is-hidden");
  }

  if (appShell) {
    appShell.classList.remove("is-hidden");
  }

  if (state === "pending") {
    window.location.hash = "#estado";
    showAccessNotice("Tu cuenta esta pendiente. Puedes cargar documentos y preparar informacion no productiva; las consultas, API y facturacion quedan bloqueadas.");
  } else if (!window.location.hash || window.location.hash === "#login" || window.location.hash === "#registro") {
    window.location.hash = activeDefaultHash();
  }

  activateView(window.location.hash);
}

function exitPortal() {
  const authGate = document.querySelector("[data-auth-gate]");
  const appShell = document.querySelector("[data-app-shell]");

  if (appShell) {
    appShell.classList.add("is-hidden");
  }

  if (authGate) {
    authGate.classList.remove("is-hidden");
  }

  showAuthPanel("login");
  window.location.hash = "login";
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

document.querySelectorAll("[data-nav-requires-approved]").forEach((item) => {
  item.addEventListener("click", (event) => {
    if (document.body.dataset.accountState === "pending") {
      event.preventDefault();
      window.location.hash = "#estado";
      activateView("#estado");
      showAccessNotice("Modulo bloqueado hasta aprobacion completa de documentos habilitantes.");
    }
  });
});

document.querySelectorAll("[data-logout-action]").forEach((button) => {
  button.addEventListener("click", exitPortal);
});

document.querySelectorAll("[data-toggle-explain]").forEach((button) => {
  button.addEventListener("click", toggleExplain);
});

window.addEventListener("hashchange", () => activateView());
activateView(window.location.hash);
