(function () {
  const collectionMap = new Map(collections.map((item) => [item.id, item]));
  const state = {
    activeCollection: "all",
    visiblePhotos: photos,
    lightboxIndex: 0,
  };

  const gallery = document.querySelector("[data-gallery]");
  const collectionGrid = document.querySelector("[data-collection-grid]");
  const filterBar = document.querySelector("[data-filter-bar]");
  const heroMedia = document.querySelector("[data-hero-media]");
  const header = document.querySelector("[data-header]");
  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  const year = document.querySelector("[data-year]");
  const lightbox = document.querySelector("[data-lightbox]");
  const lightboxImage = document.querySelector("[data-lightbox-image]");
  const lightboxTitle = document.querySelector("[data-lightbox-title]");
  const lightboxMeta = document.querySelector("[data-lightbox-meta]");
  const lightboxCaption = document.querySelector("[data-lightbox-caption]");

  const imageGradient = {
    "antarctica-southern-ocean":
      "linear-gradient(135deg, #d7eef3, #577381 55%, #142126)",
    europe: "linear-gradient(135deg, #d7e1c7, #697d4c 48%, #1f3023)",
    "science-at-sea": "linear-gradient(135deg, #d8e7e8, #557a83 52%, #22323d)",
    landscapes: "linear-gradient(135deg, #eadfc9, #8a785f 52%, #25221c)",
  };

  function init() {
    year.textContent = new Date().getFullYear();
    renderHero();
    renderCollections();
    renderFilters();
    renderGallery();
    bindNavigation();
    bindLightbox();
  }

  function renderHero() {
    const lead = photos[0];
    heroMedia.style.backgroundImage = `${imageGradient[lead.collection]}, url("${lead.src}")`;
  }

  function renderCollections() {
    collectionGrid.innerHTML = collections
      .map((collection) => {
        const lead = photos.find((photo) => photo.collection === collection.id);
        const count = photos.filter(
          (photo) => photo.collection === collection.id,
        ).length;
        const imageStyle = lead
          ? `style="background-image: ${imageGradient[collection.id]}, url('${lead.src}')"`
          : `style="background-image: ${imageGradient[collection.id]}"`;

        return `
          <article class="collection-card">
            <a href="#gallery" data-collection-link="${collection.id}" aria-label="Open ${collection.title}">
              <span class="collection-image" ${imageStyle}></span>
              <span class="collection-body">
                <span class="collection-count">${count} ${count === 1 ? "photo" : "photos"}</span>
                <strong>${collection.title}</strong>
                <span>${collection.intro}</span>
              </span>
            </a>
          </article>
        `;
      })
      .join("");

    collectionGrid
      .querySelectorAll("[data-collection-link]")
      .forEach((link) => {
        link.addEventListener("click", () =>
          setFilter(link.dataset.collectionLink),
        );
      });
  }

  function renderFilters() {
    const buttons = [
      { id: "all", title: "All" },
      ...collections.map((collection) => ({
        id: collection.id,
        title: shortTitle(collection.title),
      })),
    ];

    filterBar.innerHTML = buttons
      .map(
        (button) => `
          <button type="button" class="filter-button" data-filter="${button.id}" aria-pressed="${button.id === "all"}">
            ${button.title}
          </button>
        `,
      )
      .join("");

    filterBar.querySelectorAll("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => setFilter(button.dataset.filter));
    });
  }

  function renderGallery() {
    state.visiblePhotos =
      state.activeCollection === "all"
        ? photos
        : photos.filter((photo) => photo.collection === state.activeCollection);

    gallery.innerHTML = state.visiblePhotos
      .map((photo, index) => {
        const collection = collectionMap.get(photo.collection);
        return `
          <article class="photo-tile ${photo.orientation || "landscape"}">
            <button type="button" data-photo-index="${index}" aria-label="Open ${photo.title}">
              <img src="${photo.src}" alt="${photo.alt}" loading="lazy" onerror="this.closest('.photo-tile').classList.add('missing-image')">
              <span class="photo-fallback" aria-hidden="true">${collection.title}</span>
              <span class="photo-info">
                <strong>${photo.title}</strong>
                <span>${formatMeta(photo)}</span>
              </span>
            </button>
          </article>
        `;
      })
      .join("");

    gallery.querySelectorAll("[data-photo-index]").forEach((button) => {
      button.addEventListener("click", () =>
        openLightbox(Number(button.dataset.photoIndex)),
      );
    });
  }

  function setFilter(collectionId) {
    state.activeCollection = collectionId;
    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.filter === collectionId),
      );
    });
    renderGallery();
  }

  function bindNavigation() {
    menuToggle.addEventListener("click", () => {
      const isOpen = header.classList.toggle("nav-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      document.body.classList.toggle("menu-open", isOpen);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        header.classList.remove("nav-open");
        menuToggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("menu-open");
      });
    });
  }

  function bindLightbox() {
    document
      .querySelector("[data-lightbox-close]")
      .addEventListener("click", closeLightbox);
    document
      .querySelector("[data-lightbox-prev]")
      .addEventListener("click", showPrevious);
    document
      .querySelector("[data-lightbox-next]")
      .addEventListener("click", showNext);
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", (event) => {
      if (lightbox.hidden) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    });
  }

  function openLightbox(index) {
    state.lightboxIndex = index;
    updateLightbox();
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    document.querySelector("[data-lightbox-close]").focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
  }

  function showPrevious() {
    state.lightboxIndex =
      (state.lightboxIndex - 1 + state.visiblePhotos.length) %
      state.visiblePhotos.length;
    updateLightbox();
  }

  function showNext() {
    state.lightboxIndex =
      (state.lightboxIndex + 1) % state.visiblePhotos.length;
    updateLightbox();
  }

  function updateLightbox() {
    const photo = state.visiblePhotos[state.lightboxIndex];
    lightboxImage.src = photo.src;
    lightboxImage.alt = photo.alt;
    lightboxImage.onerror = () =>
      lightbox.classList.add("missing-lightbox-image");
    lightboxImage.onload = () =>
      lightbox.classList.remove("missing-lightbox-image");
    lightboxTitle.textContent = photo.title;
    lightboxMeta.textContent = formatMeta(photo);
    lightboxCaption.textContent = photo.caption;
  }

  function formatMeta(photo) {
    return [photo.location, photo.date].filter(Boolean).join(" | ");
  }

  function shortTitle(title) {
    return title
      .replace("Wildlife from ", "")
      .replace("Antarctica & Southern Ocean", "Antarctica")
      .replace("Science at Sea", "At Sea");
  }

  init();
})();
