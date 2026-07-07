document.addEventListener("DOMContentLoaded", () => {
  const collections = window.DUAA_COLLECTIONS || {};
  const collectionOrder = ["morning", "evening", "sleep"];
  const dayLetters = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  const $ = (id) => document.getElementById(id);
  const safeParse = (key, fallback = {}) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  };
  const saveJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const progressKey = (id, date = todayKey) => `dc_${id}_progress_${date}`;
  const habitKey = (id, date = todayKey) => `dc_${id}_habit_${date}`;

  let activeCollectionId = "morning";
  let focusCollectionId = "morning";
  let focusIndex = 0;

  if ($("todayDate")) {
    $("todayDate").textContent = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  function itemField(item, names) {
    for (const name of names) if (item && item[name]) return String(item[name]);
    return "";
  }


  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function normalizeRepeat(count) {
    const value = String(count || "1x").trim() || "1x";
    return value.replace(/x/g, "×");
  }

  function sourceParts(source) {
    return String(source || "")
      .split(/;|\n/)
      .map(part => part.trim())
      .filter(Boolean);
  }


  function normalizeSourceEntries(value) {
    if (!value) return [];
    const values = Array.isArray(value) ? value : sourceParts(value);
    return values.map(entry => {
      if (!entry) return null;
      if (typeof entry === "string") return { text: entry.trim(), url: "" };
      const text = String(entry.text || entry.title || entry.label || entry.reference || entry.source || "").trim();
      const url = String(entry.url || entry.href || "").trim();
      return text ? { text, url } : null;
    }).filter(Boolean);
  }

  function focusSourceMarkup(item) {
    const entries = [
      ...normalizeSourceEntries(item?.reference),
      ...normalizeSourceEntries(item?.source)
    ];
    if (!entries.length) return "";
    return `Source: ${entries.map(entry => {
      const text = escapeHtml(entry.text);
      if (!entry.url) return text;
      return `<a href="${escapeHtml(entry.url)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    }).join(" • ")}`;
  }

  function supportedStudyContent(item) {
    const source = itemField(item, ["reference", "source"]);
    const sources = sourceParts(source);
    const grade = itemField(item, ["grade"]);
    const explore = Array.isArray(item?.explore) ? item.explore.filter(entry => entry && (entry.title || entry.url || entry.description)) : [];
    return { source, sources, grade, explore, hasContent: !!(source || grade || explore.length) };
  }

  function studyMarkup(item) {
    const { sources, grade, explore } = supportedStudyContent(item);
    const blocks = [];
    if (sources.length) {
      blocks.push(`<section class="focus-study-group"><h3>Sources</h3><ul class="focus-source-list">${sources.map(source => `<li>${escapeHtml(source)}</li>`).join("")}</ul></section>`);
    }
    if (grade) {
      blocks.push(`<section class="focus-study-group"><h3>Grade</h3><p>${escapeHtml(grade)}</p></section>`);
    }
    if (explore.length) {
      blocks.push(`<section class="focus-study-group"><h3>External Resources</h3><ul class="focus-resource-list">${explore.map(resource => {
        const title = escapeHtml(resource.title || resource.url || "Open resource");
        const description = resource.description ? `<span>${escapeHtml(resource.description)}</span>` : "";
        if (!resource.url) return `<li><strong>${title}</strong>${description}</li>`;
        return `<li><a href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">${title}</a>${description}</li>`;
      }).join("")}</ul></section>`);
    }
    return blocks.join("");
  }

  function collectionProgress(id) {
    const data = collections[id]?.items || [];
    const progress = safeParse(progressKey(id));
    const done = data.filter((_, index) => progress[index]).length;
    return { done, total: data.length, progress };
  }

  function markHabitIfNeeded(id) {
    const { done } = collectionProgress(id);
    if (done > 0) localStorage.setItem(habitKey(id), "true");
  }
  function habitCardMarkup(id, { compact = false } = {}) {
    const c = collections[id];
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    let cells = dayLetters.map(letter => `<small>${letter}</small>`).join("");
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateKey = d.toISOString().slice(0, 10);
      const done = localStorage.getItem(habitKey(id, dateKey)) === "true";
      cells += `<span class="dot ${done ? "done" : ""}" title="${dateKey}"></span>`;
    }
    return `<article class="habit-card ${id} ${compact ? "compact-habit" : ""}">
      <div class="habit-head"><span class="tiny-icon">${c.icon}</span> ${c.title}</div>
      <div class="calendar-week">${cells}</div>
    </article>`;
  }

  function renderHomeCards() {
    const wrap = $("homeCollections");
    if (!wrap) return;
    wrap.innerHTML = collectionOrder.map(id => {
      const c = collections[id];
      const { done, total } = collectionProgress(id);
      const pct = total ? Math.round((done / total) * 100) : 0;
      const buttonText = done ? "Continue ›" : "Begin ›";
      return `<article class="collection-card ${id}">
        <div class="collection-icon">${c.icon}</div>
        <h3>${c.title}</h3>
        <div class="collection-count"><span>${done}</span> of <span>${total}</span></div>
        <div class="collection-progress"><span style="width:${pct}%"></span></div>
        <div class="card-actions"><button class="btn" data-open-collection="${id}" type="button">${buttonText}</button></div>
      </article>`;
    }).join("");
  }

  function renderHabitCards() {
    const wrap = $("habitCards");
    if (!wrap) return;
    wrap.innerHTML = collectionOrder.map(id => habitCardMarkup(id)).join("");
  }

  const homeBanner = {
    bannerImage: "assets/images/collections/home-banner.png",
    bannerImages: [
      "assets/images/collections/home-banner.png",
      "assets/images/collections/home.png"
    ],
    bannerPosition: "center center"
  };

  const resources = [
    {
      heading: "General Duʿā",
      items: [
        { title: "Etiquette of Duʿā", description: "A placeholder reference for adab, sincerity, praise, and sending salawat before asking.", url: "#" },
        { title: "Times When Duʿā Is Encouraged", description: "A placeholder guide for moments traditionally emphasized for supplication.", url: "#" }
      ]
    },
    {
      heading: "Morning & Evening Adhkār",
      items: [
        { title: "Morning Adhkār Overview", description: "A replacement-ready link for learning the morning remembrance routine.", url: "#" },
        { title: "Evening Adhkār Overview", description: "A replacement-ready link for learning the evening remembrance routine.", url: "#" }
      ]
    },
    {
      heading: "Before Sleep",
      items: [
        { title: "Before Sleep Remembrance", description: "A placeholder resource for reviewing the Sunnah remembrances before sleep.", url: "#" },
        { title: "Building a Calm Night Routine", description: "A placeholder resource for making before-sleep adhkār consistent and gentle.", url: "#" }
      ]
    }
  ];

  function renderResources() {
    const wrap = $("resourcesWrap");
    if (!wrap) return;
    wrap.innerHTML = resources.map(section => `<section class="resource-section">
      <p class="section-label">${section.heading}</p>
      <div class="resource-grid">
        ${section.items.map(item => `<article class="resource-card">
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <a class="resource-link" href="${item.url}" aria-label="Open resource: ${item.title}">Open Resource →</a>
        </article>`).join("")}
      </div>
    </section>`).join("");
  }

  function resetCollectionBanner(element) {
    if (!element) return;
    element.classList.remove("has-collection-banner");
    element.style.removeProperty("--collection-banner-image");
    element.style.removeProperty("--collection-banner-position");
    element.dataset.bannerImage = "";
  }

  function applyCollectionBanner(element, collection, variant = "collection") {
    if (!element) return;
    const bannerCandidates = [
      ...(Array.isArray(collection?.bannerImages) ? collection.bannerImages : []),
      collection?.bannerImage || ""
    ].filter(Boolean);
    const uniqueBannerCandidates = [...new Set(bannerCandidates)];
    resetCollectionBanner(element);
    if (!uniqueBannerCandidates.length) return;

    const bannerPosition = variant === "focus"
      ? (collection.focusBannerPosition || collection.bannerPosition || "center 52%")
      : (variant === "home"
        ? (collection.homeBannerPosition || collection.bannerPosition || "center center")
        : (collection.collectionBannerPosition || collection.bannerPosition || "center center"));

    const applyCandidate = (index = 0) => {
      const requestedImage = uniqueBannerCandidates[index];
      if (!requestedImage) {
        console.warn(`Banner image could not be loaded from any configured path: ${uniqueBannerCandidates.join(", ")}`);
        resetCollectionBanner(element);
        return;
      }

      element.dataset.bannerImage = requestedImage;
      const image = new Image();
      image.onload = () => {
        if (element.dataset.bannerImage !== requestedImage) return;
        element.classList.add("has-collection-banner");
        element.style.setProperty("--collection-banner-image", `url("${requestedImage}")`);
        element.style.setProperty("--collection-banner-position", bannerPosition);
      };
      image.onerror = () => {
        if (element.dataset.bannerImage !== requestedImage) return;
        console.warn(`Banner image could not be loaded: ${requestedImage}`);
        applyCandidate(index + 1);
      };
      image.src = requestedImage;
    };

    applyCandidate();
  }

  function renderHomeBanner() {
    applyCollectionBanner($("homeHero"), homeBanner, "home");
  }

  function renderCollection(id) {
    activeCollectionId = id;
    const c = collections[id];
    if (!c) return;
    const { done, total, progress } = collectionProgress(id);
    applyCollectionBanner(document.querySelector(".collection-hero"), c, "collection");
    $("collectionEyebrow").textContent = "Collection";
    $("collectionTitle").textContent = c.title;
    $("collectionDescription").textContent = c.description;
    $("collectionProgress").textContent = `${done} of ${total}`;
    if ($("collectionProgressLarge")) $("collectionProgressLarge").textContent = `${done} of ${total}`;
    if ($("collectionCountLabel")) $("collectionCountLabel").textContent = `${total} authentic supplications · Open any duʿā in Focus Mode.`;
    if ($("collectionHabitCard")) $("collectionHabitCard").outerHTML = habitCardMarkup(id, { compact: true }).replace('<article class="habit-card', '<article id="collectionHabitCard" class="habit-card collection-habit-card');
    const list = $("collectionList");
    list.innerHTML = c.items.map((item, index) => {
      const checked = !!progress[index];
      const title = item.label || item.summary || `Duʿā ${index + 1}`;
      const summary = item.summary || item.translation || item.english || "";
      return `<article class="duaa-row ${checked ? "done" : ""}">
        <button class="check-btn" data-toggle-duaa="${index}" type="button" aria-label="${checked ? "Mark incomplete" : "Mark complete"}">${checked ? "✓" : "○"}</button>
        <button class="duaa-main" data-focus-index="${index}" type="button">
          <span class="duaa-number">${index + 1}</span>
          <span class="duaa-copy"><strong>${title}</strong><small>${summary}</small><em>Open →</em></span>
        </button>
        <span class="count-pill">${item.count || ""}</span>
      </article>`;
    }).join("");
  }

  function showView(name) {
    document.querySelectorAll(".view").forEach(view => view.classList.add("hidden"));
    if (["morning", "evening", "sleep"].includes(name)) {
      renderCollection(name);
      $("collectionView").classList.remove("hidden");
    } else {
      $(`${name}View`)?.classList.remove("hidden");
    }
    document.querySelectorAll(".nav a").forEach(a => a.classList.toggle("active", a.dataset.view === name));
    closeMobileMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleDuaa(index) {
    const progress = safeParse(progressKey(activeCollectionId));
    progress[index] = !progress[index];
    saveJson(progressKey(activeCollectionId), progress);
    markHabitIfNeeded(activeCollectionId);
    renderAll();
    renderCollection(activeCollectionId);
  }

  function setDuaaComplete(id, index, value) {
    const progress = safeParse(progressKey(id));
    progress[index] = value;
    saveJson(progressKey(id), progress);
    markHabitIfNeeded(id);
  }

  function renderFocusItem() {
    const c = collections[focusCollectionId];
    const items = c?.items || [];
    const item = items[focusIndex] || {};
    const total = Math.max(1, items.length || 1);
    const pct = ((focusIndex + 1) / total) * 100;
    applyCollectionBanner($("focusBanner"), c, "focus");
    $("focusTitle").textContent = `${c?.title || "Collection"} · Focus Mode`;
    $("focusCount").textContent = `Duaa ${focusIndex + 1} of ${total}`;
    $("focusProgressBar").style.width = `${pct}%`;
    const heading = itemField(item, ["summary"]) || itemField(item, ["label", "openingWords", "title"]) || `Duʿā ${focusIndex + 1}`;
    const repeat = itemField(item, ["count", "repeat", "repeatCount"]);
    const transliteration = itemField(item, ["transliteration", "translit"]);
    const virtues = itemField(item, ["virtues", "benefits"]);


    $("focusDuaaHeading").textContent = heading;
    $("focusRepeatBadge").textContent = `🔁 Repeat: ${normalizeRepeat(repeat)}`;
    const sourceMarkup = focusSourceMarkup(item);
    $("focusSourceMeta").innerHTML = sourceMarkup;
    $("focusSourceMeta").hidden = !sourceMarkup;
    $("focusArabic").textContent = itemField(item, ["arabic", "arabicText"]) || "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ";
    $("focusTranslation").textContent = itemField(item, ["translation", "english", "meaning"]) || "O Allah, You are my Lord; none has the right to be worshipped except You.";
    $("focusTransliteration").textContent = transliteration;
    $("focusTransliterationBlock").hidden = !transliteration;
    $("focusVirtues").textContent = virtues;
    $("focusVirtuesSection").hidden = !virtues;
    $("focusPrev").disabled = focusIndex === 0;
  }

  function advanceFocusOrFinish() {
    const total = collections[focusCollectionId]?.items.length || 1;
    if (focusIndex < total - 1) {
      focusIndex++;
      renderFocusItem();
      return;
    }
    closeFocus();
  }

  function openFocus(id, index = 0) {
    focusCollectionId = id;
    focusIndex = index;
    renderFocusItem();
    $("focusMode").classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeFocus() {
    $("focusMode").classList.add("hidden");
    document.body.style.overflow = "";
    renderAll();
    if (!$(`collectionView`).classList.contains("hidden")) renderCollection(activeCollectionId);
  }

  function renderAll() {
    renderHomeBanner();
    renderHomeCards();
    renderHabitCards();
    renderResources();
  }

  function openMobileMenu(){ $("sidebar").classList.add("open"); $("mobileBackdrop").classList.remove("hidden"); $("mobileMenuToggle")?.setAttribute("aria-expanded", "true"); }
  function closeMobileMenu(){ $("sidebar").classList.remove("open"); $("mobileBackdrop").classList.add("hidden"); $("mobileMenuToggle")?.setAttribute("aria-expanded", "false"); }

  document.addEventListener("click", (e) => {
    const nav = e.target.closest("[data-view]");
    if (nav) { e.preventDefault(); showView(nav.dataset.view); return; }

    const opener = e.target.closest("[data-open-collection]");
    if (opener) { showView(opener.dataset.openCollection); return; }

    const toggle = e.target.closest("[data-toggle-duaa]");
    if (toggle) { toggleDuaa(Number(toggle.dataset.toggleDuaa)); return; }

    const focus = e.target.closest("[data-focus-index]");
    if (focus) { openFocus(activeCollectionId, Number(focus.dataset.focusIndex)); return; }
  });

  $("mobileMenuToggle")?.addEventListener("click", openMobileMenu);
  $("mobileMenuClose")?.addEventListener("click", closeMobileMenu);
  $("mobileBackdrop")?.addEventListener("click", closeMobileMenu);
  $("closeFocusMode")?.addEventListener("click", closeFocus);
  $("focusPrev")?.addEventListener("click", () => { if (focusIndex > 0) { focusIndex--; renderFocusItem(); } });
  $("focusSkip")?.addEventListener("click", advanceFocusOrFinish);
  $("focusCompleteNext")?.addEventListener("click", () => {
    setDuaaComplete(focusCollectionId, focusIndex, true);
    advanceFocusOrFinish();
  });

  $("downloadBackup")?.addEventListener("click", () => {
    const payload = { app: "duaa-companion", version: "1.2", exportedAt: new Date().toISOString(), localStorage: {} };
    Object.keys(localStorage).filter(k => k.startsWith("dc_")).forEach(k => payload.localStorage[k] = localStorage.getItem(k));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `duaa-companion-backup-${todayKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  $("restoreBackup")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      if (!payload || payload.app !== "duaa-companion" || !payload.localStorage) throw new Error("Invalid backup file.");
      Object.entries(payload.localStorage).forEach(([key, value]) => localStorage.setItem(key, value));
      alert("Backup restored successfully.");
      renderAll();
      showView("home");
    } catch (err) {
      alert("This backup file could not be restored.");
    }
  });

  renderAll();
});
