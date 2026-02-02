/* =========================================================
   Sticker Vault – GitHub Pages + Supabase
   Storage Bucket : "Sticker-Vault" (PUBLIC)
   Table          : "Sticker-Vault"
   localStorage   : NUR für Theme + Login
========================================================= */

/* ================= SUPABASE ================= */

const SUPABASE_URL = "https://xmvmvzzthqhbvybugzib.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhtdm12enp0aHFoYnZ5YnVnemliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzU1NjksImV4cCI6MjA4NTYxMTU2OX0.pK5TT9uastEyMkRS4oWvpmj0iAFeKHod-98QeVVvZE0";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const BUCKET = "Sticker-Vault";
const TABLE  = "Sticker-Vault";

/* ================= CONFIG ================= */

const ALLOWED_EXT = new Set([
  "png","tiff","tif","jpg","jpeg","webp","heic","svg","gif"
]);

const CATEGORIES = ["Gina", "Conor", "Ole", "Leandra", "Lu", "Lea"];

/* ================= ELEMENTS ================= */

const appRoot = document.getElementById("appRoot");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const closeSidebar = document.getElementById("closeSidebar");

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

const themeToggle = document.getElementById("themeToggle");

/* ================= LOGIN (localStorage OK) ================= */

const SITE_PASSWORD_PLAIN = "mQ7!zV4#Kp2@Xn9$Hf6^tR8&cL1*Wj5%yD3=Sa0?Ue7+Bg4~Nv2_Zx9";
const AUTH_SESSION_KEY = "sv_auth_session";
const AUTH_PERSIST_KEY = "sv_auth_persist";

const authOverlay = document.getElementById("authOverlay");
const authForm = document.getElementById("authForm");
const authPassword = document.getElementById("authPassword");
const authRemember = document.getElementById("authRemember");
const authMsg = document.getElementById("authMsg");
const logoutBtn = document.getElementById("logoutBtn");

/* ================= STATE ================= */

let activeCategory = "none";
let sidebarSelected = "all";

/* ================= INIT ================= */

initTheme();
initAuth();
initSidebar();
initUpload();
updateUploadVisibility();
loadAndRender();

/* ================= THEME (localStorage OK) ================= */

function initTheme() {
  const saved = localStorage.getItem("sv_theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
}

themeToggle?.addEventListener("click", () => {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem("sv_theme", next);
});

/* ================= AUTH ================= */

function initAuth() {
  const ok =
    sessionStorage.getItem(AUTH_SESSION_KEY) === "1" ||
    localStorage.getItem(AUTH_PERSIST_KEY) === "1";

  if (!ok) {
    authOverlay.classList.add("show");
    lockUI();
  }

  authForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (authPassword.value === SITE_PASSWORD_PLAIN) {
      authOverlay.classList.remove("show");
      unlockUI();
      if (authRemember.checked) {
        localStorage.setItem(AUTH_PERSIST_KEY, "1");
      } else {
        sessionStorage.setItem(AUTH_SESSION_KEY, "1");
      }
    } else {
      authMsg.textContent = "❌ Falsches Passwort";
    }
  });

  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem(AUTH_PERSIST_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    location.reload();
  });
}

/* ================= SIDEBAR ================= */

function initSidebar() {
  menuBtn?.addEventListener("click", () => {
    sidebar.classList.add("open");
    sidebarBackdrop.hidden = false;
  });

  closeSidebar?.addEventListener("click", closeSidebarFn);
  sidebarBackdrop?.addEventListener("click", closeSidebarFn);

  document.querySelectorAll(".catBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      sidebarSelected = btn.dataset.category;
      activeCategory = sidebarSelected === "all" ? "none" : sidebarSelected;
      updateUploadVisibility();
      await loadAndRender();
      closeSidebarFn();
    });
  });
}

function closeSidebarFn() {
  sidebar.classList.remove("open");
  sidebarBackdrop.hidden = true;
}

/* ================= UPLOAD LOCK ================= */

function updateUploadVisibility() {
  const ok = CATEGORIES.includes(activeCategory);
  uploadControls.hidden = !ok;
  uploadLockedHint.hidden = ok;
  activeCategoryLabel.textContent = ok ? activeCategory : "—";
}

/* ================= UPLOAD ================= */

function initUpload() {
  fileInput?.addEventListener("change", async () => {
    if (!CATEGORIES.includes(activeCategory)) {
      setStatus("❌ Bitte zuerst Kategorie auswählen");
      fileInput.value = "";
      return;
    }

    for (const file of fileInput.files) {
      const ext = getExt(file.name);
      if (!ALLOWED_EXT.has(ext)) continue;

      const id = crypto.randomUUID();
      const safeName = sanitizeFilename(file.name);
      const path = `${activeCategory}/${id}_${safeName}`;

      // Upload file
      await supabase.storage.from(BUCKET).upload(path, file);

      // Insert DB row
      await supabase.from(TABLE).insert({
        id,
        filename: file.name,
        path,
        category: activeCategory
      });
    }

    fileInput.value = "";
    setStatus("✅ Upload erfolgreich");
    await loadAndRender();
  });

  clearAllBtn?.addEventListener("click", async () => {
    if (!CATEGORIES.includes(activeCategory)) return;
    const ok = confirm(`Alle Sticker in "${activeCategory}" löschen?`);
    if (!ok) return;

    const { data } = await supabase
      .from(TABLE)
      .select("id,path")
      .eq("category", activeCategory);

    const paths = data.map(d => d.path);
    const ids = data.map(d => d.id);

    await supabase.storage.from(BUCKET).remove(paths);
    await supabase.from(TABLE).delete().in("id", ids);

    setStatus("🗑️ Kategorie geleert");
    loadAndRender();
  });
}

/* ================= LOAD + RENDER ================= */

async function loadAndRender() {
  if (!CATEGORIES.includes(activeCategory)) {
    grid.innerHTML = `<div class="status">Kategorie auswählen</div>`;
    countEl.textContent = "0";
    return;
  }

  let q = supabase
    .from(TABLE)
    .select("*")
    .eq("category", activeCategory);

  const { data } = await q;
  const items = data || [];

  grid.innerHTML = "";
  countEl.textContent = items.length;

  if (!items.length) {
    grid.innerHTML = `<div class="status">Keine Sticker vorhanden</div>`;
    return;
  }

  for (const it of items) {
    const url = supabase.storage.from(BUCKET).getPublicUrl(it.path).data.publicUrl;

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="preview"><img src="${url}" /></div>
      <div class="meta">
        <div class="filename">${escapeHtml(it.filename)}</div>
        <div class="badge">${escapeHtml(it.category)}</div>
      </div>
    `;
    grid.appendChild(card);
  }
}

/* ================= HELPERS ================= */

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

function getExt(name) {
  return name.toLowerCase().split(".").pop();
}

function sanitizeFilename(name) {
  return name.replace(/[^\w.\-]+/g, "_");
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, m =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;" }[m])
  );
}
