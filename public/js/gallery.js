// public/js/gallery.js

// --- Helpers ---------------------------------------------------------------

// Build Drive API URL (files.list)
function driveListUrl({
  q,
  fields = "files(id,name,mimeType,modifiedTime,createdTime)",
  orderBy,
  key,
  pageSize = 100,
}) {
  const params = new URLSearchParams({
    q,
    fields,
    key,
    pageSize: String(pageSize),
  });
  if (orderBy) params.set("orderBy", orderBy);
  return `https://www.googleapis.com/drive/v3/files?${params.toString()}`;
}

// Allowed extensions (extra guard on top of mimeType contains 'image/')
const IMG_EXT = /\.(jpe?g|png|gif|webp|bmp|tiff?)$/i;

// Preferred image host: Google image CDN (reliable in <img>)
const driveImgSrc = (id, w = 1600) =>
  `https://lh3.googleusercontent.com/d/${id}=w${w}`;

// Fallback image host: direct bytes
const driveFallbackSrc = (id) =>
  `https://drive.usercontent.google.com/uc?id=${id}&export=view`;

// --- Main ------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", async function () {
  const section = document.getElementById("gallery");
  const grid = document.getElementById("gallery-grid");
  const status = document.getElementById("gallery-status");
  const apiKey = section?.dataset.apiKey;
  const parentId = section?.dataset.parentId;

  const lightbox = document.getElementById("lightbox");
  const closeBtn = document.getElementById("lightbox-close");
  const stage = document.getElementById("lightbox-stage");

  if (!apiKey || !parentId) {
    if (status) status.textContent = "Missing Drive configuration.";
    return;
  }

  try {
    // 1) Find the most recently updated subfolder
    const qFolders = [
      `'${parentId}' in parents`,
      "trashed = false",
      `mimeType = 'application/vnd.google-apps.folder'`,
    ].join(" and ");

    const foldersUrl = driveListUrl({
      q: qFolders,
      orderBy: "modifiedTime desc",
      key: apiKey,
      fields: "files(id,name,mimeType,modifiedTime)",
      pageSize: 100,
    });

    const fRes = await fetch(foldersUrl);
    if (!fRes.ok) throw new Error(`Drive API (folders) ${fRes.status}: ${await fRes.text()}`);
    const fData = await fRes.json();
    const newestFolder = (fData.files || [])[0];

    if (!newestFolder) {
      if (status) status.textContent = "No subfolders found.";
      return;
    }

    // 2) List images within that subfolder
    const qImages = [
      `'${newestFolder.id}' in parents`,
      "trashed = false",
      "mimeType contains 'image/'",
    ].join(" and ");

    const filesUrl = driveListUrl({
      q: qImages,
      orderBy: "createdTime",
      key: apiKey,
      fields: "files(id,name,mimeType,createdTime,modifiedTime)",
      pageSize: 200,
    });

    const iRes = await fetch(filesUrl);
    if (!iRes.ok) throw new Error(`Drive API (files) ${iRes.status}: ${await iRes.text()}`);
    const iData = await iRes.json();

    // Extra guard: filter by extension too
    const images = (iData.files || []).filter((f) => IMG_EXT.test(f.name || ""));

    if (images.length === 0) {
      if (status) status.textContent = `Newest folder (${newestFolder.name}) has no images.`;
      return;
    }

    // 3) Render grid
    if (status) {
      status.innerHTML = `<span class="opacity-70">Showing latest folder:</span> <strong>${newestFolder.name}</strong>`;
    }

    grid.innerHTML = images
      .map((f, idx) => {
        const alt = (f.name || "").replace(IMG_EXT, "").replace(/[_-]/g, " ");
        const src = driveImgSrc(f.id, 800); // thumbnail-ish
        const fallback = driveFallbackSrc(f.id);

        return `
          <div class="group cursor-pointer relative overflow-hidden">
            <img
              src="${src}"
              onerror="this.onerror=null;this.src='${fallback}';"
              referrerpolicy="no-referrer"
              alt="${alt.replace(/"/g, "&quot;")}"
              loading="lazy"
              decoding="async"
              class="w-full h-48 object-cover rounded-lg transition-transform transform scale-100 group-hover:scale-105"
              data-index="${idx}"
            />
            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                class="bg-white text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                data-index="${idx}"
              >
                View
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    // 4) Prepare lightbox images (hidden by default)
    stage.innerHTML = images
      .map((f, idx) => {
        const alt = (f.name || "").replace(IMG_EXT, "").replace(/[_-]/g, " ");
        const src = driveImgSrc(f.id, 2400); // bigger for lightbox
        const fallback = driveFallbackSrc(f.id);

        return `
          <img
            src="${src}"
            onerror="this.onerror=null;this.src='${fallback}';"
            referrerpolicy="no-referrer"
            alt="${alt.replace(/"/g, "&quot;")}"
            class="w-full h-auto object-contain rounded-lg lightbox-img"
            data-lightbox-index="${idx}"
            style="display:none"
          />
        `;
      })
      .join("");

    // 5) Lightbox behavior
    function openAt(idx) {
      const lightboxImages = document.querySelectorAll(".lightbox-img");
      lightboxImages.forEach((img) => (img.style.display = "none"));
      const selected = document.querySelector(`.lightbox-img[data-lightbox-index="${idx}"]`);
      if (selected) selected.style.display = "block";
      lightbox.classList.remove("hidden");
      document.body.style.overflow = "hidden";
      closeBtn?.focus();
    }

    grid.querySelectorAll("[data-index]").forEach((el) => {
      el.addEventListener("click", () => openAt(el.dataset.index));
    });

    closeBtn.addEventListener("click", () => {
      lightbox.classList.add("hidden");
      document.querySelectorAll(".lightbox-img").forEach((img) => (img.style.display = "none"));
      document.body.style.overflow = "";
    });

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        lightbox.classList.add("hidden");
        document.querySelectorAll(".lightbox-img").forEach((img) => (img.style.display = "none"));
        document.body.style.overflow = "";
      }
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !lightbox.classList.contains("hidden")) {
        lightbox.classList.add("hidden");
        document.querySelectorAll(".lightbox-img").forEach((img) => (img.style.display = "none"));
        document.body.style.overflow = "";
      }
    });
  } catch (err) {
    console.error(err);
    if (status) status.textContent = "Failed to load images.";
  }
});