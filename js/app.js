/* Sticker Vault – local-only storage + client-side auth + legal cookie consent */

/* ================= CONFIG ================= */

const ALLOWED_EXT = new Set([
  "png","tiff","tif","jpg","jpeg","webp","heic","svg","gif"
]);

// ✅ Alle Kategorien (inkl. Lea)
const CATEGORIES = ["Gina", "Conor", "Ole", "Leandra", "Lu", "Lea"];

const STORAGE_KEY = "stickerVault.items.v4";
const THEME_KEY = "stickerVault.theme.v2";

/* ---------- AUTH ----------
   ⚠️ PASSWORT HIER SETZEN
*/
const SITE_PASSWORD_PLAIN = "mQ7!zV4#Kp2@Xn9$Hf6^tR8&cL1*Wj5%yD3=Sa0?Ue7+Bg4~Nv2_Zx9";

const AUTH_SESSION_KEY = "stickerVault.auth.session";
const AUTH_PERSIST_KEY = "stickerVault.auth.persist";

/* ---------- LEGAL / COOKIE ---------- */
const LEGAL_COOKIE_NAME = "sv_legal_accepted";
const LEGAL_COOKIE_DAYS = 365;

/* ================= ELEMENTS ================= */

const appRoot = document.getElementById("appRoot");

const authOverlay = document.getElementById("authOverlay");
const authForm = document.getElementById("authForm");
const authPassword = document.getElementById("authPassword");
const authRemember = document.getElementById("authRemember");
const authMsg = document.getElementById("authMsg");

const legalOverlay = document.getElementById("legalOverlay");
const legalAcceptCheck = document.getElementById("legalAcceptCheck");
const legalAcceptBtn = document.getElementById("legalAcceptBtn");
const legalDeclineBtn = document.getElementById("legalDeclineBtn");

const themeToggle = document.getElementById("themeToggle");
const logoutBtn = document.getElementById("logoutBtn");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const closeSidebar = document.getElementById("closeSidebar");
const sidebarSearch = document.getElementById("sidebarSearch");

const uploadControls = document.getElementById("uploadControls");
const uploadLockedHint = document.getElementById("uploadLockedHint");
const activeCategoryLabel = document.getElementById("activeCategoryLabel");

const fileInput = document.getElementById("fileInput");
const clearAllBtn = document.getElementById("clearAll");
const grid = document.getElementById("grid");
const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

/* ================= STATE ================= */

let items = loadItems();
let activeCategory = "none";     // echte Kategorie oder "none"
let sidebarSelected = "all";     // UI-Zustand
let isAuthed = false;
let isLegalAccepted = false;

/* ================= INIT ================= */

initTheme();
initAuth();
initLegal();
initSidebar();
initUpload();
updateUploadVisibility();
render();

/* ================= AUTH ================= */

function initAuth() {
  const hasSession = sessionStorage.getItem(AUTH_SESSION_KEY) === "1";
  const hasPersist = localStorage.getItem(AUTH_PERSIST_KEY) === "1";
  isAuthed = hasSession || hasPersist;
  refreshAccess();

  authForm.addEventListener("submit", e => {
    e.preventDefault();
    if (timingSafeEqual(authPassword.value, SITE_PASSWORD_PLAIN)) {
      authPassword.value = "";
      if (authRemember.checked) {
        localStorage.setItem(AUTH_PERSIST_KEY, "1");
      } else {
        sessionStorage.setItem(AUTH_SESSION_KEY, "1");
      }
      isAuthed = true;
      refreshAccess();
      setStatus("🔓 Entsperrt");
    } else {
      authMsg.textContent = "❌ Falsches Passwort";
      authPassword.select();
    }
  });

  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_PERSIST_KEY);
    isAuthed = false;
    refreshAccess();
    setStatus("🔒 Abgemeldet");
  });
}

/* ================= LEGAL ================= */

function initLegal() {
  isLegalAccepted = getCookie(LEGAL_COOKIE_NAME) === "1";
  refreshAccess();

  legalAcceptCheck.addEventListener("change", () => {
    legalAcceptBtn.disabled = !legalAcceptCheck.checked;
  });

  legalAcceptBtn.addEventListener("click", () => {
    setCookie(LEGAL_COOKIE_NAME, "1", LEGAL_COOKIE_DAYS);
    isLegalAccepted = true;
    refreshAccess();
    setStatus("✅ Hinweis akzeptiert");
  });

  legalDeclineBtn.addEventListener("click", () => {
    window.location.href = "about:blank";
  });
}

function refreshAccess() {
  if (!isAuthed) {
    authOverlay.classList.add("show");
    legalOverlay.classList.remove("show");
    lockUI();
    return;
  }
  if (!isLegalAccepted) {
    authOverlay.classList.remove("show");
    legalOverlay.classList.add("show");
    lockUI();
    return;
  }
  authOverlay.classList.remove("show");
  legalOverlay.classList.remove("show");
  unlockUI();
}

/* ================= THEME ================= */

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || "dark";
  document.documentElement.setAttribute("data-theme", saved);
}

themeToggle.addEventListener("click", () => {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem(THEME_KEY, next);
});

/* ================= SIDEBAR ================= */

function initSidebar() {
  menuBtn.addEventListener("click", () => {
    sidebar.classList.add("open");
    sidebarBackdrop.hidden = false;
  });

  closeSidebar.addEventListener("click", closeSidebarFn);
  sidebarBackdrop.addEventListener("click", closeSidebarFn);

  sidebarSearch.addEventListener("input", () => {
    searchInput.value = sidebarSearch.value;
    render();
  });

  searchInput.addEventListener("input", () => {
    sidebarSearch.value = searchInput.value;
    render();
  });

  document.querySelectorAll(".catBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      sidebarSelected = btn.dataset.category;
      activeCategory = sidebarSelected === "all" ? "none" : sidebarSelected;
      setActiveCategoryButton(sidebarSelected);
      updateUploadVisibility();
      render();
      closeSidebarFn();
    });
  });
}

function closeSidebarFn() {
  sidebar.classList.remove("open");
  sidebarBackdrop.hidden = true;
}

function setActiveCategoryButton(cat) {
  document.querySelectorAll(".catBtn").forEach(b =>
    b.classList.toggle("active", b.dataset.category === cat)
  );
}

/* ================= UPLOAD ================= */

function updateUploadVisibility() {
  if (CATEGORIES.includes(activeCategory)) {
    uploadControls.hidden = false;
    uploadLockedHint.hidden = true;
    activeCategoryLabel.textContent = activeCategory;
  } else {
    uploadControls.hidden = true;
    uploadLockedHint.hidden = false;
    activeCategoryLabel.textContent = "—";
  }
}

function initUpload() {
  fileInput.addEventListener("change", async () => {
    if (!CATEGORIES.includes(activeCategory)) {
      setStatus("❌ Bitte zuerst eine Kategorie auswählen");
      fileInput.value = "";
      return;
    }

    let added = 0;
    for (const file of fileInput.files) {
      const ext = getExt(file.name);
      if (!ALLOWED_EXT.has(ext)) continue;

      const dataUrl = await readAsDataURL(file);
      items.push({
        id: crypto.randomUUID(),
        name: file.name,
        ext,
        category: activeCategory,
        addedAt: Date.now(),
        dataUrl
      });
      added++;
    }

    saveItems(items);
    render();
    fileInput.value = "";
    if (added) setStatus(`✅ ${added} Sticker in "${activeCategory}" hinzugefügt`);
  });

  clearAllBtn.addEventListener("click", () => {
    if (confirm("Alle Sticker löschen?")) {
      items = [];
      saveItems(items);
      render();
      setStatus("🗑️ Alle Sticker gelöscht");
    }
  });

  sortSelect.addEventListener("change", render);
}

/* ================= RENDER ================= */

function render() {
  let view = [...items];
  const q = searchInput.value.toLowerCase();

  if (q) view = view.filter(i => i.name.toLowerCase().includes(q));
  if (CATEGORIES.includes(activeCategory)) {
    view = view.filter(i => i.category === activeCategory);
  }

  countEl.textContent = view.length;
  grid.innerHTML = "";

  if (!view.length) {
    grid.innerHTML = `<div class="status">Keine Sticker vorhanden</div>`;
    return;
  }

  view.forEach(it => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="preview"><img src="${it.dataUrl}" /></div>
      <div class="meta">
        <div class="filename">${escapeHtml(it.name)}</div>
        <div class="badge category">${it.category}</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

/* ================= HELPERS ================= */

function loadItems() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveItems(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

function lockUI() {
  appRoot.style.pointerEvents = "none";
  appRoot.style.filter = "blur(6px)";
}

function unlockUI() {
  appRoot.style.pointerEvents = "";
  appRoot.style.filter = "";
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function getExt(name) {
  return name.toLowerCase().split(".").pop();
}

function readAsDataURL(file) {
  return new Promise(res => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.readAsDataURL(file);
  });
}

function setCookie(name, val, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 864e5);
  document.cookie = `${name}=${val};expires=${d.toUTCString()};path=/`;
}

function getCookie(name) {
  return document.cookie.split("; ").find(r => r.startsWith(name + "="))?.split("=")[1] || "";
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, m =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;" }[m])
  );
}
