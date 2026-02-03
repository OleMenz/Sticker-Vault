/* =========================================================
   Sticker Vault – SUPABASE Version (based on your working code)
   - Stickers NOT stored locally
   - Files -> Supabase Storage (Bucket: "Sticker-Vault")
   - Metadata -> Supabase Table   (Table:  "Sticker-Vault")
   - localStorage ONLY for theme + remember login
   - Cookie used for legal disclaimer consent
========================================================= */

/* ================= SUPABASE ================= */

const SUPABASE_URL = "https://xmvmvzzthqhbvybugzib.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhtdm12enp0aHFoYnZ5YnVnemliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzU1NjksImV4cCI6MjA4NTYxMTU2OX0.pK5TT9uastEyMkRS4oWvpmj0iAFeKHod-98QeVVvZE0";

// IMPORTANT: don't declare `supabase` again (it exists globally from the CDN script)
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// EXACT names as in Supabase
const BUCKET = "Sticker-Vault";
const TABLE = "Sticker-Vault";

/* ================= CONFIG ================= */

const ALLOWED_EXT = new Set(["png","tiff","tif","jpg","jpeg","webp","heic","svg","gif"]);
const CATEGORIES = ["Gina", "Conor", "Ole", "Leandra", "Lu", "Lea"];

const THEME_KEY = "stickerVault.theme.v2";

const SITE_PASSWORD_PLAIN = "mQ7!zV4#Kp2@Xn9$Hf6^tR8&cL1*Wj5%yD3=Sa0?Ue7+Bg4~Nv2_Zx9";
const AUTH_SESSION_KEY = "stickerVault.auth.session";
const AUTH_PERSIST_KEY = "stickerVault.auth.persist";

const LEGAL_COOKIE_NAME = "sv_legal_accepted";
const LEGAL_COOKIE_DAYS = 365;

/* ================= STATE ================= */

let activeCategory = "none";  // must pick category for upload
let isAuthed = false;
let isLegalAccepted = false;

/* ================= INIT (after DOM ready) ================= */

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const appRoot = document.getElementById("appRoot");

  const authOverlay = document.getElementById("authOverlay");
  const authForm = document.getElementById("authForm");
  const authPassword = document.getElementById("authPassword");
  const authRemember = document.getElementById("authRemember");
  const authMsg = document.getElementById("authMsg");
  const logoutBtn = document.getElementById("logoutBtn");

  const legalOverlay = document.getElementById("legalOverlay");
  const legalAcceptCheck = document.getElementById("legalAcceptCheck");
  const legalAcceptBtn = document.getElementById("legalAcceptBtn");
  const legalDeclineBtn = document.getElementById("legalDeclineBtn");
  const legalMsg = document.getElementById("legalMsg");

  const themeToggle = document.getElementById("themeToggle");

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

  /* ---------- UI helpers ---------- */

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function lockUI() {
    if (!appRoot) return;
    appRoot.style.pointerEvents = "none";
    appRoot.style.userSelect = "none";
    appRoot.style.filter = "blur(6px)";
  }

  function unlockUI() {
    if (!appRoot) return;
    appRoot.style.pointerEvents = "";
    appRoot.style.userSelect = "";
    appRoot.style.filter = "";
  }

  function updateUploadVisibility() {
    const ok = CATEGORIES.includes(activeCategory);
    if (uploadControls) uploadControls.hidden = !ok;
    if (uploadLockedHint) uploadLockedHint.hidden = ok;
    if (activeCategoryLabel) activeCategoryLabel.textContent = ok ? activeCategory : "—";
  }

  /* ---------- THEME ---------- */

  (function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || "dark";
    document.documentElement.setAttribute("data-theme", saved);
  })();

  themeToggle?.addEventListener("click", () => {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
  });

  /* ---------- AUTH + LEGAL ---------- */

  function refreshAccess() {
    // reset
    authOverlay?.classList.remove("show");
    legalOverlay?.classList.remove("show");
    unlockUI();

    if (!isAuthed) {
      authOverlay?.classList.add("show");
      lockUI();
      return;
    }
    if (!isLegalAccepted) {
      legalOverlay?.classList.add("show");
      lockUI();
      return;
    }
    unlockUI();
  }

  (function initAuthState() {
    const hasSession = sessionStorage.getItem(AUTH_SESSION_KEY) === "1";
    const hasPersist = localStorage.getItem(AUTH_PERSIST_KEY) === "1";
    isAuthed = hasSession || hasPersist;

    isLegalAccepted = getCookie(LEGAL_COOKIE_NAME) === "1";
    refreshAccess();
  })();

  authForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    authMsg.textContent = "";

    if (authPassword.value === SITE_PASSWORD_PLAIN) {
      if (authRemember?.checked) localStorage.setItem(AUTH_PERSIST_KEY, "1");
      else sessionStorage.setItem(AUTH_SESSION_KEY, "1");

      authPassword.value = "";
      isAuthed = true;
      setStatus("🔓 Entsperrt.");
      refreshAccess();
    } else {
      authMsg.textContent = "❌ Falsches Passwort.";
      authPassword.select();
    }
  });

  logoutBtn?.addEventListener("click", () => {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_PERSIST_KEY);
    isAuthed = false;
    refreshAccess();
    setStatus("🔒 Abgemeldet.");
  });

  // Legal accept logic (same as your working code)
  if (legalAcceptBtn && legalAcceptCheck) {
    legalAcceptBtn.disabled = true;

    legalAcceptCheck.addEventListener("change", () => {
      legalAcceptBtn.disabled = !legalAcceptCheck.checked;
      if (legalMsg) legalMsg.textContent = "";
    });

    legalAcceptBtn.addEventListener("click", () => {
      if (!legalAcceptCheck.checked) {
        if (legalMsg) legalMsg.textContent = "Bitte Checkbox aktivieren, um zu akzeptieren.";
        return;
      }
      setCookie(LEGAL_COOKIE_NAME, "1", LEGAL_COOKIE_DAYS);
      isLegalAccepted = true;
      setStatus("✅ Hinweis akzeptiert.");
      refreshAccess();
    });
  }

  legalDeclineBtn?.addEventListener("click", () => {
    if (legalMsg) legalMsg.textContent = "Ohne Zustimmung kannst du diese Seite nicht nutzen.";
    setTimeout(() => (window.location.href = "about:blank"), 600);
  });

  /* ---------- SIDEBAR ---------- */

  function openSidebar() {
    if (!sidebar || !sidebarBackdrop) return;
    sidebar.classList.add("open");
    sidebarBackdrop.hidden = false;
    sidebar.setAttribute("aria-hidden", "false");
    menuBtn?.setAttribute("aria-expanded", "true");
    if (sidebarSearch) setTimeout(() => sidebarSearch.focus(), 0);
  }

  function closeSidebarFn() {
    if (!sidebar || !sidebarBackdrop) return;
    sidebar.classList.remove("open");
    sidebarBackdrop.hidden = true;
    sidebar.setAttribute("aria-hidden", "true");
    menuBtn?.setAttribute("aria-expanded", "false");
  }

  menuBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    openSidebar();
  });

  closeSidebar?.addEventListener("click", (e) => {
    e.preventDefault();
    closeSidebarFn();
  });

  sidebarBackdrop?.addEventListener("click", () => closeSidebarFn());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSidebarFn();
  });

  // Search sync
  sidebarSearch?.addEventListener("input", () => {
    if (searchInput) searchInput.value = sidebarSearch.value;
    render();
  });

  searchInput?.addEventListener("input", () => {
    if (sidebarSearch && sidebarSearch.value !== searchInput.value) {
      sidebarSearch.value = searchInput.value;
    }
    render();
  });

  // Category buttons
  document.querySelectorAll(".catBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const chosen = btn.dataset.category || "all";

      document.querySelectorAll(".catBtn").forEach(b => {
        b.classList.toggle("active", (b.dataset.category || "all") === chosen);
      });

      activeCategory = (chosen === "all") ? "none" : chosen;
      updateUploadVisibility();
      render();
      closeSidebarFn();
    });
  });

  /* ---------- SUPABASE HELPERS ---------- */

  function getPublicUrl(path) {
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    return data?.publicUrl || "";
  }

  async function fetchCategoryItems(category) {
    const { data, error } = await sb
      .from(TABLE)
      .select("id, filename, path, category, created_at")
      .eq("category", category);

    if (error) throw error;
    return data || [];
  }

  /* ---------- UPLOAD (SUPABASE) ---------- */

  fileInput?.addEventListener("change", async (e) => {
    try {
      if (!CATEGORIES.includes(activeCategory)) {
        setStatus("❌ Bitte zuerst eine Kategorie auswählen.");
        fileInput.value = "";
        return;
      }

      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      let added = 0;

      for (const file of files) {
        const ext = getExt(file.name);
        if (!ALLOWED_EXT.has(ext)) continue;

        const id = crypto.randomUUID();
        const safeName = sanitizeFilename(file.name);
        const path = `${activeCategory}/${id}_${safeName}`;

        // Upload file to storage
        const { error: upErr } = await sb.storage
          .from(BUCKET)
          .upload(path, file, {
            upsert: false,
            cacheControl: "3600",
            contentType: file.type || undefined
          });

        if (upErr) {
          console.error(upErr);
          setStatus(`❌ Upload fehlgeschlagen: "${file.name}"`);
          continue;
        }

        // Insert DB row
        const { error: insErr } = await sb
          .from(TABLE)
          .insert([{
            id,
            filename: file.name,
            path,
            category: activeCategory
          }]);

        if (insErr) {
          console.error(insErr);
          setStatus(`⚠️ Datei hochgeladen, aber DB-Eintrag fehlgeschlagen: "${file.name}"`);
          // Optional rollback:
          // await sb.storage.from(BUCKET).remove([path]);
          continue;
        }

        added++;
      }

      fileInput.value = "";
      if (added) setStatus(`✅ ${added} Sticker in "${activeCategory}" hochgeladen.`);
      render();
    } catch (err) {
      console.error(err);
      setStatus("❌ Upload-Fehler (Policy/RLS?). Siehe Console.");
    }
  });

  /* ---------- CLEAR CATEGORY (SUPABASE) ---------- */

  clearAllBtn?.addEventListener("click", async () => {
    try {
      if (!CATEGORIES.includes(activeCategory)) {
        setStatus("❌ Bitte zuerst eine Kategorie auswählen.");
        return;
      }
      const ok = confirm(`Wirklich alle Sticker in "${activeCategory}" löschen?`);
      if (!ok) return;

      const { data, error } = await sb
        .from(TABLE)
        .select("id, path")
        .eq("category", activeCategory);

      if (error) throw error;

      const rows = data || [];
      const paths = rows.map(r => r.path).filter(Boolean);

      if (paths.length) {
        const { error: rmErr } = await sb.storage.from(BUCKET).remove(paths);
        if (rmErr) throw rmErr;
      }

      const { error: delErr } = await sb.from(TABLE).delete().eq("category", activeCategory);
      if (delErr) throw delErr;

      setStatus(`🗑️ "${activeCategory}" geleert.`);
      render();
    } catch (err) {
      console.error(err);
      setStatus("❌ Löschen fehlgeschlagen (Policy/RLS?). Siehe Console.");
    }
  });

  sortSelect?.addEventListener("change", () => render());

  /* ---------- RENDER (SUPABASE) ---------- */

  async function render() {
    if (!grid || !countEl) return;

    // require category to show (so "Alle" means: nothing until category chosen)
    if (!CATEGORIES.includes(activeCategory)) {
      countEl.textContent = "0";
      grid.innerHTML = `
        <div class="status" style="grid-column: 1 / -1;">
          Wähle links im Menü eine Kategorie, um Sticker zu sehen oder hochzuladen.
        </div>`;
      return;
    }

    try {
      const s = (searchInput?.value || "").trim().toLowerCase();

      let view = await fetchCategoryItems(activeCategory);

      // search filter
      if (s) {
        view = view.filter(it => String(it.filename || "").toLowerCase().includes(s));
      }

      // sort (same options as before)
      const sortMode = sortSelect?.value || "newest";
      if (sortMode === "newest") view.sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      if (sortMode === "oldest") view.sort((a,b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
      if (sortMode === "az") view.sort((a,b) => String(a.filename||"").localeCompare(String(b.filename||"")));
      if (sortMode === "za") view.sort((a,b) => String(b.filename||"").localeCompare(String(a.filename||"")));

      countEl.textContent = String(view.length);
      grid.innerHTML = "";

      if (!view.length) {
        grid.innerHTML = `
          <div class="status" style="grid-column: 1 / -1;">
            In <strong>${escapeHtml(activeCategory)}</strong> sind noch keine Sticker.
          </div>`;
        return;
      }

      for (const it of view) {
        const card = document.createElement("div");
        card.className = "card";

        const safeName = escapeHtml(it.filename || "sticker");
        const url = getPublicUrl(it.path);

        card.innerHTML = `
          <div class="preview">
            ${url ? `<img src="${url}" alt="${safeName}" loading="lazy" />` : ""}
          </div>
          <div class="meta">
            <div class="nameRow">
              <div class="filename" title="${safeName}">${safeName}</div>
              <div class="badge category">${escapeHtml(it.category || "")}</div>
            </div>
            <div class="cardActions">
              <button class="btn secondary" data-action="download">⬇️ Download</button>
              <button class="btn danger" data-action="delete">🗑️</button>
            </div>
          </div>
        `;

        card.addEventListener("click", async (ev) => {
          const btn = ev.target.closest("button");
          if (!btn) return;

          const action = btn.dataset.action;

          if (action === "download") {
            if (!url) {
              setStatus("❌ Keine URL verfügbar.");
              return;
            }
            triggerDownload(url, it.filename || "sticker");
            setStatus(`⬇️ Download gestartet: "${it.filename}"`);
          }

          if (action === "delete") {
            const ok = confirm(`Sticker löschen?\n${it.filename}`);
            if (!ok) return;

            try {
              if (it.path) {
                const { error: rmErr } = await sb.storage.from(BUCKET).remove([it.path]);
                if (rmErr) throw rmErr;
              }
              const { error: delErr } = await sb.from(TABLE).delete().eq("id", it.id);
              if (delErr) throw delErr;

              setStatus("🗑️ Sticker gelöscht.");
              render();
            } catch (err) {
              console.error(err);
              setStatus("❌ Löschen fehlgeschlagen (Policy/RLS?). Siehe Console.");
            }
          }
        });

        grid.appendChild(card);
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Laden fehlgeschlagen (Policy/RLS?). Siehe Console.");
      grid.innerHTML = `
        <div class="status" style="grid-column: 1 / -1;">
          Fehler beim Laden. Öffne F12 → Console und sende mir die Fehlermeldung.
        </div>`;
    }
  }

  // boot
  updateUploadVisibility();
  render();
});

/* ================= HELPERS ================= */

function getExt(filename) {
  const m = (filename || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

function sanitizeFilename(name) {
  return String(name)
    .replaceAll("\\", "_")
    .replaceAll("/", "_")
    .replaceAll("..", "_")
    .replace(/[^\w.\-() ]+/g, "_")
    .trim();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;" }[m])
  );
}

function triggerDownload(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "sticker";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* Cookies */
function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "expires=" + d.toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  const target = encodeURIComponent(name) + "=";
  const parts = document.cookie.split(";").map((x) => x.trim());
  for (const p of parts) {
    if (p.startsWith(target)) return decodeURIComponent(p.substring(target.length));
  }
  return "";
}
