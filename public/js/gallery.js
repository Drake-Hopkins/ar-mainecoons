// public/js/gallery.js

// ---------- Helpers ---------------------------------------------------------

function driveListUrl({
  q,
  fields = "files(id,name,mimeType,modifiedTime,createdTime)",
  orderBy,
  key,
  pageSize = 100,
}) {
  const params = new URLSearchParams({ q, fields, key, pageSize: String(pageSize) });
  if (orderBy) params.set("orderBy", orderBy);
  return `https://www.googleapis.com/drive/v3/files?${params.toString()}`;
}

// Extra guard on top of mimeType check
const IMG_EXT = /\.(jpe?g|png|gif|webp|bmp|tiff?)$/i;

// Preferred image host (Google image CDN) + dimension hint
const driveImgSrc = (id, w = 1600) =>
  `https://lh3.googleusercontent.com/d/${id}=w${w}`;

// Fallback host (direct bytes if CDN ever fails)
const driveFallbackSrc = (id) =>
  `https://drive.usercontent.google.com/uc?id=${id}&export=view`;

// ---------- Main ------------------------------------------------------------

document.addEventListener("DOMContentLoaded", async function () {
  const section = document.getElementById("gallery");
const grid = document.getElementById("gallery-grid");
files.forEach((file) => {
  const item = document.createElement("div");
  item.className =
    "relative rounded-xl overflow-hidden shadow-md bg-base-100 hover:shadow-lg transition";

  item.innerHTML = `
    <img
      src="${file.thumbnailLink}"
      alt="${file.name}"
      class="w-full h-64 object-cover"
    />
    <button
      class="absolute bottom-2 left-1/2 -translate-x-1/2 btn btn-sm btn-primary shadow"
      data-id="${file.id}"
    >
      View
    </button>
  `;
  grid.appendChild(item);
});  const status = document.getElementById("gallery-status");
  const apiKey = section?.dataset.apiKey;
  const parentId = section?.dataset.parentId;

  const lightbox = document.getElementById("lightbox");
  const closeBtn = document.getElementById("lightbox-close");
const stage = document.getElementById("lightbox-stage");
stage.innerHTML = `
  <img
    src="https://drive.google.com/uc?id=${fileId}"
    alt="Lightbox"
    class="max-h-[90vh] max-w-full mx-auto rounded-xl shadow-lg object-contain"
  />
`;
  if (!apiKey || !parentId) {
    status && (status.textContent = "Missing Drive configuration.");
    return;
  }

  try {
    // 1) Latest subfolder
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
      status && (status.textContent = "No subfolders found.");
      return;
    }

    // 2) Images inside it
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

    const images = (iData.files || []).filter((f) => IMG_EXT.test(f.name || ""));
    if (images.length === 0) {
      status && (status.textContent = `Newest folder (${newestFolder.name}) has no images.`);
      return;
    }

    status &&
      (status.innerHTML = `<span class="opacity-70">Showing latest folder:</span> <strong>${newestFolder.name}</strong>`);

    // 3) Grid (uniform thumbnails: 3:4 aspect)
    grid.innerHTML = images
      .map((f, idx) => {
        const alt = (f.name || "").replace(IMG_EXT, "").replace(/[_-]/g, " ");
        const src = driveImgSrc(f.id, 800);
        const fallback = driveFallbackSrc(f.id);

        return `
          <div class="group cursor-pointer">
            <div class="relative rounded-xl overflow-hidden aspect-[3/4] bg-base-200">
              <img
                src="${src}"
                onerror="this.onerror=null;this.src='${fallback}';"
                referrerpolicy="no-referrer"
                alt="${alt.replace(/"/g, "&quot;")}"
                loading="lazy"
                decoding="async"
                class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                data-index="${idx}"
              />
              <div class="absolute inset-0 flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2">
                <button
                  class="btn btn-sm bg-white/90 text-gray-900 border-none shadow-lg hover:bg-white"
                  data-index="${idx}"
                >
                  View
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    // 4) Lightbox images (fit viewport, consistent sizing)
    stage.innerHTML = images
      .map((f, idx) => {
        const alt = (f.name || "").replace(IMG_EXT, "").replace(/[_-]/g, " ");
        const src = driveImgSrc(f.id, 2400);
        const fallback = driveFallbackSrc(f.id);

        return `
          <img
            src="${src}"
            onerror="this.onerror=null;this.src='${fallback}';"
            referrerpolicy="no-referrer"
            alt="${alt.replace(/"/g, "&quot;")}"
            class="mx-auto max-h-[85vh] w-auto h-auto object-contain rounded-xl shadow-2xl lightbox-img"
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
      lightbox.classList.add("flex"); // ensure centering works
      document.body.style.overflow = "hidden";
      closeBtn && closeBtn.focus();
    }

    grid.querySelectorAll("[data-index]").forEach((el) => {
      el.addEventListener("click", () => openAt(el.dataset.index));
    });

    function closeLightbox() {
      lightbox.classList.add("hidden");
      lightbox.classList.remove("flex");
      document.querySelectorAll(".lightbox-img").forEach((img) => (img.style.display = "none"));
      document.body.style.overflow = "";
    }

    closeBtn.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !lightbox.classList.contains("hidden")) closeLightbox();
    });
  } catch (err) {
    console.error(err);
    status && (status.textContent = "Failed to load images.");
  }
});