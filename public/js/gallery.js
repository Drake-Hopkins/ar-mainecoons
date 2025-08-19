// public/js/gallery.js  (inline styles; resilient image URLs)

/* -------------------- helpers -------------------- */
function driveListUrl({ q, fields = "files(id,name,mimeType,modifiedTime,createdTime)", orderBy, key, pageSize = 100 }) {
  const params = new URLSearchParams({ q, fields, key, pageSize: String(pageSize) });
  if (orderBy) params.set("orderBy", orderBy);
  return `https://www.googleapis.com/drive/v3/files?${params.toString()}`;
}

// filename guard on top of mimeType
const IMG_EXT = /\.(jpe?g|png|gif|webp|bmp|tiff?)$/i;

// robust image URL chain (try in this order)
const urlDriveUserContent = (id) => `https://drive.usercontent.google.com/uc?id=${id}&export=view`;
const urlGoogleThumb       = (id, w = 1600) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`;
const urlLh3               = (id, w = 1600) => `https://lh3.googleusercontent.com/d/${id}=w${w}`;

function bestSrc(id, w) {
  // primary: usercontent (least 403-y)
  return urlDriveUserContent(id) + `#w=${w || 1600}`;
}
function fallbackSrc(id, w) {
  // first fallback: thumbnail endpoint
  return urlGoogleThumb(id, w || 1600);
}
function lastResortSrc(id, w) {
  return urlLh3(id, w || 1600);
}

/* -------------------- main -------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  const section  = document.getElementById("gallery");
  const grid     = document.getElementById("gallery-grid");
  const status   = document.getElementById("gallery-status");
  const apiKey   = section?.dataset.apiKey;
  const parentId = section?.dataset.parentId;

  const lightbox = document.getElementById("lightbox");
  const closeBtn = document.getElementById("lightbox-close");
  const stage    = document.getElementById("lightbox-stage");

  if (!apiKey || !parentId) {
    status && (status.textContent = "Missing Drive configuration.");
    return;
  }

  try {
    // 1) newest subfolder
    const qFolders = [
      `'${parentId}' in parents`,
      "trashed = false",
      `mimeType = 'application/vnd.google-apps.folder'`,
    ].join(" and ");

    const fRes = await fetch(driveListUrl({
      q: qFolders,
      orderBy: "modifiedTime desc",
      key: apiKey,
      fields: "files(id,name,mimeType,modifiedTime)",
      pageSize: 100,
    }));
    if (!fRes.ok) throw new Error(`Drive API (folders) ${fRes.status}: ${await fRes.text()}`);
    const newestFolder = (await fRes.json()).files?.[0];
    if (!newestFolder) {
      status && (status.textContent = "No subfolders found.");
      return;
    }

    // 2) images in subfolder
    const qImages = [
      `'${newestFolder.id}' in parents`,
      "trashed = false",
      "mimeType contains 'image/'",
    ].join(" and ");

    const iRes = await fetch(driveListUrl({
      q: qImages,
      orderBy: "createdTime",
      key: apiKey,
      fields: "files(id,name,mimeType,createdTime,modifiedTime)",
      pageSize: 200,
    }));
    if (!iRes.ok) throw new Error(`Drive API (files) ${iRes.status}: ${await iRes.text()}`);
    const images = (await iRes.json()).files?.filter(f => IMG_EXT.test(f.name || "")) ?? [];
    if (!images.length) {
      status && (status.textContent = `Newest folder (${newestFolder.name}) has no images.`);
      return;
    }

    status && (status.innerHTML = `<span class="opacity-70">Showing latest folder:</span> <strong>${newestFolder.name}</strong>`);

    // 3) render grid (uniform aspect; no Tailwind reliance)
    grid.innerHTML = images.map((f, idx) => {
      const alt = (f.name || "").replace(IMG_EXT, "").replace(/[_-]/g, " ");
      const src1 = bestSrc(f.id, 800);
      const src2 = fallbackSrc(f.id, 800);
      const src3 = lastResortSrc(f.id, 800);

      return `
        <div style="cursor:pointer;">
          <div style="position:relative; overflow:hidden; border-radius:12px; aspect-ratio:3/4; background:rgba(0,0,0,.04);">
            <img
              src="${src1}"
              referrerpolicy="no-referrer"
              alt="${alt.replace(/"/g, "&quot;")}"
              loading="lazy"
              decoding="async"
              style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transform:scale(1); transition:transform .3s ease;"
              data-index="${idx}"
              onmouseenter="this.style.transform='scale(1.04)'"
              onmouseleave="this.style.transform='scale(1)'"
              onerror="if (this.dataset.alt=='0'){this.src='${src3}';this.dataset.alt='1'} else if (!this.dataset.alt){this.src='${src2}';this.dataset.alt='0'}"
            />
            <button
              data-index="${idx}"
              style="position:absolute; left:50%; bottom:10px; transform:translateX(-50%); padding:.35rem .7rem; border:none; border-radius:.5rem; background:rgba(255,255,255,.92); color:#111; font-weight:600; box-shadow:0 6px 18px rgba(0,0,0,.18); cursor:pointer;"
            >
              View
            </button>
          </div>
        </div>
      `;
    }).join("");

    // 4) lightbox images (fit viewport)
    stage.innerHTML = images.map((f, idx) => {
      const alt = (f.name || "").replace(IMG_EXT, "").replace(/[_-]/g, " ");
      const src1 = bestSrc(f.id, 2400);
      const src2 = fallbackSrc(f.id, 2400);
      const src3 = lastResortSrc(f.id, 2400);

      return `
        <img
          src="${src1}"
          referrerpolicy="no-referrer"
          alt="${alt.replace(/"/g, "&quot;")}"
          class="lightbox-img"
          data-lightbox-index="${idx}"
          style="display:none; max-height:85vh; width:auto; height:auto; object-fit:contain; border-radius:14px; box-shadow:0 12px 30px rgba(0,0,0,.45); margin:0 auto;"
          onerror="if (this.dataset.alt=='0'){this.src='${src3}';this.dataset.alt='1'} else if (!this.dataset.alt){this.src='${src2}';this.dataset.alt='0'}"
        />
      `;
    }).join("");

    // 5) lightbox behavior
    function openAt(idx) {
      document.querySelectorAll(".lightbox-img").forEach(img => img.style.display = "none");
      const selected = document.querySelector(`.lightbox-img[data-lightbox-index="${idx}"]`);
      if (selected) selected.style.display = "block";

      lightbox.style.display = "flex";
      lightbox.style.alignItems = "center";
      lightbox.style.justifyContent = "center";
      document.body.style.overflow = "hidden";
      closeBtn?.focus();
    }

    grid.querySelectorAll("[data-index]").forEach(el => {
      el.addEventListener("click", () => openAt(el.dataset.index));
    });

    function closeLightbox() {
      lightbox.style.display = "none";
      document.querySelectorAll(".lightbox-img").forEach(img => img.style.display = "none");
      document.body.style.overflow = "";
    }

    closeBtn.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
    window.addEventListener("keydown", (e) => { if (e.key === "Escape" && lightbox.style.display !== "none") closeLightbox(); });
  } catch (err) {
    console.error(err);
    status && (status.textContent = "Failed to load images.");
  }
});