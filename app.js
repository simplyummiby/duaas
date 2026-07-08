document.addEventListener("DOMContentLoaded", () => {
  const collections = window.DUAA_COLLECTIONS || {};
  const collectionList = Object.values(collections);
  const isCollectionEnabled = (collection) => collection?.enabled !== false;
  const isTrackedConfig = (collection) => isCollectionEnabled(collection) && collection?.trackerEnabled === true;
  const enabledCollections = collectionList.filter(isCollectionEnabled);
  const trackerCollectionOrder = enabledCollections.filter(isTrackedConfig).map(c => c.id);
  const occasionCollectionOrder = enabledCollections.filter(c => !isTrackedConfig(c)).map(c => c.id);
  const trackedCollectionIds = new Set(trackerCollectionOrder);
  const dayLetters = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const dateKeyFromDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const dateFromKey = (dateKey) => {
    const [year, month, day] = String(dateKey || "").split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  };
  const currentDate = () => new Date();
  const currentDateKey = () => dateKeyFromDate(currentDate());
  const startOfWeek = (date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());
    return start;
  };
  const weekStartKeyForDate = (date) => dateKeyFromDate(startOfWeek(date));
  const weekEndKeyFromStart = (weekStartKey) => {
    const start = dateFromKey(weekStartKey);
    if (!start) return "";
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return dateKeyFromDate(end);
  };
  let renderedDateKey = currentDateKey();

  const $ = (id) => document.getElementById(id);
  const safeParse = (key, fallback = {}) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  };
  const saveJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const progressKey = (id, date = currentDateKey()) => `dc_${id}_progress_${date}`;
  const habitKey = (id, date = currentDateKey()) => `dc_${id}_habit_${date}`;
  const navigationStateKey = "dc_navigation_state";
  const currentWeekStartKey = "dc_current_week_start";
  const weeklyHistoryKey = "dc_weekly_history";
  const weeklyHistoryVersion = 1;
  const weeklyHistoryMigrationKey = "dc_weekly_history_migrated";

  let activeCollectionId = "morning";
  let focusCollectionId = "morning";
  let focusIndex = 0;
  let currentViewName = "home";
  let focusOpen = false;
  let suppressHistoryPush = false;
  let openCategoryIndex = null;

  function collectionEnabled(collectionOrId) {
    const collection = typeof collectionOrId === "string" ? collections[collectionOrId] : collectionOrId;
    return isCollectionEnabled(collection);
  }

  function collectionComingSoon(collectionOrId) {
    const collection = typeof collectionOrId === "string" ? collections[collectionOrId] : collectionOrId;
    return collectionEnabled(collection) && collection?.comingSoon === true;
  }

  function collectionOpenable(collectionOrId) {
    return collectionEnabled(collectionOrId) && !collectionComingSoon(collectionOrId);
  }

  function duaaVerified(item) {
    return item?.verified === true;
  }

  function duaaStatusLabel(item) {
    if (duaaVerified(item)) return "Verified";
    const status = String(item?.sourceStatus || "needs-review").trim().toLowerCase();
    if (status === "in-review" || status === "being-verified") return "Being Verified";
    if (status === "source-needed" || status === "needs-source") return "Source Review Needed";
    return "Coming Soon";
  }

  function duaaLockedMessage(item) {
    return `${duaaStatusLabel(item)} — this duʿā is not available yet because its wording, sources, translation, and study resources are still being checked.`;
  }

  function trackingEnabled(collectionOrId) {
    const collection = typeof collectionOrId === "string" ? collections[collectionOrId] : collectionOrId;
    return isTrackedConfig(collection);
  }

  function storageCollectionIdFromKey(key) {
    const match = /^dc_([^_]+)_(?:progress|habit)_\d{4}-\d{2}-\d{2}$/.exec(key);
    return match?.[1] || "";
  }

  function isWeeklyHistoryStorageKey(key) {
    return key === weeklyHistoryKey || key === currentWeekStartKey;
  }

  function isTrackedStorageKey(key) {
    if (isWeeklyHistoryStorageKey(key)) return true;
    const id = storageCollectionIdFromKey(key);
    return !!id && trackedCollectionIds.has(id);
  }

  function weekDateKeys(weekStartKey) {
    const start = dateFromKey(weekStartKey);
    if (!start) return [];
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return dateKeyFromDate(date);
    });
  }

  function archivedCollectionWeek(id, dates) {
    const collection = collections[id];
    const totalItems = collection?.items?.length || 0;
    const days = dates.map(date => {
      const progress = safeParse(progressKey(id, date));
      const completedItems = totalItems ? collection.items.filter((_, index) => progress[index]).length : 0;
      const habitCompleted = localStorage.getItem(habitKey(id, date)) === "true";
      return {
        date,
        habitCompleted,
        completedItems,
        totalItems,
        completionPercentage: totalItems ? Math.round((completedItems / totalItems) * 100) : 0
      };
    });
    const completedDays = days.filter(day => day.habitCompleted).length;
    const completionPercentage = Math.round((completedDays / dates.length) * 100);
    return {
      id,
      title: collection?.title || id,
      completedDays,
      totalDays: dates.length,
      completionPercentage,
      days
    };
  }

  function archiveWeek(weekStartKey) {
    const dates = weekDateKeys(weekStartKey);
    if (!dates.length) return;
    const history = safeParse(weeklyHistoryKey, { version: weeklyHistoryVersion, weeks: {} });
    const weeks = history.weeks && typeof history.weeks === "object" ? history.weeks : {};
    const collectionsForWeek = {};
    trackerCollectionOrder.forEach(id => {
      collectionsForWeek[id] = archivedCollectionWeek(id, dates);
    });
    weeks[weekStartKey] = {
      weekStart: weekStartKey,
      weekEnd: weekEndKeyFromStart(weekStartKey),
      archivedAt: new Date().toISOString(),
      collections: collectionsForWeek
    };
    saveJson(weeklyHistoryKey, { version: weeklyHistoryVersion, weeks });
  }

  function migrateExistingPastWeeks() {
    if (localStorage.getItem(weeklyHistoryMigrationKey) === "true") return;
    const currentWeekStart = weekStartKeyForDate(currentDate());
    const pastWeekStarts = new Set();
    Object.keys(localStorage).forEach(key => {
      if (!isTrackedStorageKey(key) || isWeeklyHistoryStorageKey(key)) return;
      const match = /_(\d{4}-\d{2}-\d{2})$/.exec(key);
      const date = dateFromKey(match?.[1]);
      if (!date) return;
      const weekStart = weekStartKeyForDate(date);
      if (weekStart < currentWeekStart) pastWeekStarts.add(weekStart);
    });
    [...pastWeekStarts].sort().forEach(archiveWeek);
    localStorage.setItem(weeklyHistoryMigrationKey, "true");
  }

  function ensureCurrentWeek() {
    migrateExistingPastWeeks();
    const currentWeekStart = weekStartKeyForDate(currentDate());
    const storedWeekStart = localStorage.getItem(currentWeekStartKey);
    if (storedWeekStart && storedWeekStart !== currentWeekStart) {
      archiveWeek(storedWeekStart);
    }
    localStorage.setItem(currentWeekStartKey, currentWeekStart);
  }

  function collectionStats(collection) {
    const itemCount = collection?.items?.length || 0;
    const categoryCount = collection?.categories?.length || 0;
    return { itemCount, categoryCount };
  }

  function collectionInfoText(collection) {
    const { itemCount, categoryCount } = collectionStats(collection);
    const duaaLabel = itemCount === 1 ? "1 Duʿā" : `${itemCount} Duʿās`;
    if (!categoryCount) return duaaLabel;
    return `${duaaLabel} · ${categoryCount} ${categoryCount === 1 ? "Category" : "Categories"}`;
  }

  function navigationState() {
    const state = focusOpen
      ? { view: currentViewName, focus: true, collectionId: focusCollectionId, focusIndex }
      : { view: currentViewName };
    if (!state.focus && collections[currentViewName]?.categories?.length && openCategoryIndex !== null) {
      state.categoryIndex = openCategoryIndex;
    }
    return state;
  }

  function validNavigationState(state) {
    if (!state || typeof state !== "object") return null;
    const view = typeof state.view === "string" ? state.view : "home";
    const normalized = { view };
    if (collections[view]) {
      const collection = collections[view];
      if (!collectionOpenable(collection)) return null;
      if (state.categoryIndex !== undefined) {
        const categoryIndex = Number(state.categoryIndex);
        if (!Number.isInteger(categoryIndex) || categoryIndex < 0 || categoryIndex >= (collection.categories?.length || 0)) return null;
        normalized.categoryIndex = categoryIndex;
      }
    } else if (!$(`${view}View`)) {
      return null;
    }
    if (state.focus) {
      const collectionId = typeof state.collectionId === "string" ? state.collectionId : view;
      const collection = collections[collectionId];
      const index = Number(state.focusIndex || 0);
      if (!collectionOpenable(collection) || !Number.isInteger(index) || index < 0 || index >= (collection.items?.length || 0)) return null;
      if (!duaaVerified(collection.items[index])) return null;
      normalized.view = collections[view] && collectionOpenable(view) ? view : collectionId;
      normalized.focus = true;
      normalized.collectionId = collectionId;
      normalized.focusIndex = index;
    }
    return normalized;
  }

  function saveNavigationState() {
    localStorage.setItem(navigationStateKey, JSON.stringify(navigationState()));
  }

  function readNavigationState() {
    return validNavigationState(safeParse(navigationStateKey, null));
  }

  function renderTodayDate() {
    if ($("todayDate")) {
      $("todayDate").textContent = currentDate().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }
  }

  renderTodayDate();

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



  const studyResourceCategories = [
    { type: "video", icon: "▶", title: "Watch / Videos", helper: "Beneficial lectures and reminders about this duaa." },
    { type: "article", icon: "✦", title: "Read / Articles", helper: "Articles and written reflections to deepen understanding." },
    { type: "audio", icon: "♪", title: "Listen / Audios", helper: "Audio reminders and explanations to reflect on." },
    { type: "pdf", icon: "▣", title: "PDF / Book References", helper: "Books, PDFs, and written works for deeper study." },
    { type: "social", icon: "#", title: "Beneficial Posts", helper: "Short reminders, threads, and valuable posts." },
    { type: "link", icon: "↗", title: "Helpful Links", helper: "Other trusted links and resources." }
  ];

  function resourceMeta(resource) {
    const values = [];
    const add = (value) => {
      const text = String(value || "").trim();
      if (text) values.push(text);
    };
    if (resource.type === "video") {
      add(resource.scholarOrSpeaker || resource.speaker);
      add(resource.platform);
      add(resource.duration);
    } else if (resource.type === "article") {
      add(resource.author);
      add(resource.website);
    } else if (resource.type === "audio") {
      add(resource.speaker || resource.scholarOrSpeaker);
      add(resource.platform);
      add(resource.duration);
    } else if (resource.type === "pdf") {
      add(resource.author);
      add(resource.pageNumber ? `Page ${resource.pageNumber}` : "");
    } else if (resource.type === "social") {
      add(resource.platform);
    } else {
      add(resource.website || resource.platform || resource.author);
    }
    return values;
  }

  function studyResourceCardMarkup(resource) {
    const title = escapeHtml(resource.title || resource.url || "Study resource");
    const meta = resourceMeta(resource);
    const metaMarkup = meta.length ? `<p class="study-resource-meta">${meta.map(escapeHtml).join(" <span>•</span> ")}</p>` : "";
    const notes = resource.notes ? `<p class="study-resource-notes">${escapeHtml(resource.notes)}</p>` : "";
    const openButton = resource.url
      ? `<a class="study-resource-open" href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">Open <span aria-hidden="true">↗</span></a>`
      : "";
    return `<article class="study-resource-card"><div><h4>${title}</h4>${metaMarkup}${notes}</div>${openButton}</article>`;
  }

  function studyResourcesMarkup(item) {
    const verified = duaaVerified(item);
    const resources = Array.isArray(item?.studyResources)
      ? item.studyResources.filter(resource => resource && (resource.title || resource.url || resource.notes))
      : [];
    const badge = $("focusStudyResourceBadge");
    if (badge) badge.textContent = verified ? `${resources.length} ${resources.length === 1 ? "resource" : "resources"}` : "Preparing";
    if (!verified) {
      return `<div class="study-empty-state study-empty-state-careful"><strong>Resources are being prepared.</strong><p>We are gathering authentic resources and will add them once this duaa is verified.</p></div>`;
    }
    if (!resources.length) {
      return `<div class="study-empty-state"><strong>Study resources have not been added yet.</strong><p>Checked resources can be added here later without changing the reading layout.</p></div>`;
    }
    return studyResourceCategories.map(category => {
      const categoryResources = resources.filter(resource => String(resource.type || "link").toLowerCase() === category.type);
      const body = categoryResources.length
        ? categoryResources.map(studyResourceCardMarkup).join("")
        : `<p class="study-category-empty">No ${escapeHtml(category.title.toLowerCase())} added yet.</p>`;
      return `<details class="study-category-panel" open><summary><span class="study-category-icon" aria-hidden="true">${category.icon}</span><span><strong>${escapeHtml(category.title)}</strong><em>${escapeHtml(category.helper)}</em></span><span class="study-category-count">${categoryResources.length}</span></summary><div class="study-category-body">${body}</div></details>`;
    }).join("");
  }

  function collectionProgress(id) {
    const data = collections[id]?.items || [];
    if (!trackingEnabled(id)) return { done: 0, total: data.length, progress: {} };
    const progress = safeParse(progressKey(id));
    const done = data.filter((_, index) => progress[index]).length;
    return { done, total: data.length, progress };
  }

  function markHabitIfNeeded(id) {
    if (!trackingEnabled(id)) return;
    const { done } = collectionProgress(id);
    if (done > 0) localStorage.setItem(habitKey(id), "true");
  }
  function collectionIconMarkup(collection, sizeClass = "") {
    const fallback = escapeHtml(collection?.icon || "☼");
    const image = collection?.iconImage ? `<img src="${escapeHtml(collection.iconImage)}" alt="" loading="lazy" onerror="this.hidden=true; this.nextElementSibling.hidden=false;">` : "";
    return `<span class="collection-image-icon ${sizeClass}">${image}<span class="collection-icon-fallback" ${image ? "hidden" : ""}>${fallback}</span></span>`;
  }

  function habitCardMarkup(id, { compact = false } = {}) {
    const c = collections[id];
    const start = startOfWeek(currentDate());
    let cells = dayLetters.map(letter => `<small>${letter}</small>`).join("");
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateKey = dateKeyFromDate(d);
      const done = localStorage.getItem(habitKey(id, dateKey)) === "true";
      cells += `<span class="dot ${done ? "done" : ""}" title="${dateKey}"></span>`;
    }
    return `<article class="habit-card ${id} ${compact ? "compact-habit" : ""}">
      <div class="habit-head">${collectionIconMarkup(c, "tiny-icon")} ${c.title}</div>
      <div class="calendar-week">${cells}</div>
    </article>`;
  }

  function renderHomeCards() {
    const wrap = $("homeCollections");
    if (!wrap) return;
    wrap.innerHTML = trackerCollectionOrder.map(id => {
      const c = collections[id];
      const { done, total } = collectionProgress(id);
      const pct = total ? Math.round((done / total) * 100) : 0;
      const buttonText = done ? "Continue ›" : "Begin ›";
      return `<article class="collection-card ${id}">
        ${collectionIconMarkup(c, "large-icon")}
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
    wrap.innerHTML = trackerCollectionOrder.map(id => habitCardMarkup(id)).join("");
  }

  function renderOccasionCards() {
    const wrap = $("occasionCollections");
    if (!wrap) return;
    wrap.innerHTML = occasionCollectionOrder.map(id => {
      const c = collections[id];
      const comingSoon = collectionComingSoon(c);
      const cardClass = comingSoon ? " coming-soon-card" : "";
      const status = comingSoon ? `<span class="coming-soon-badge">Coming Soon</span>` : "";
      const action = comingSoon
        ? `<button class="btn disabled-btn" type="button" disabled aria-disabled="true">Coming Soon, insha Allah</button>`
        : `<button class="btn" data-open-collection="${id}" type="button">View Collection</button>`;
      return `<article class="collection-card occasion-card ${id}${cardClass}">
        ${collectionIconMarkup(c, "large-icon")}
        <h3>${escapeHtml(c.title)}</h3>
        ${status}
        <p>${escapeHtml(c.description || "")}</p>
        <div class="card-actions">${action}</div>
      </article>`;
    }).join("");
  }

  const homeBanner = {
    bannerImage: "assets/backgrounds/sunset-beach.png",
    bannerImages: [
      "assets/backgrounds/sunset-beach.png",
      "assets/backgrounds/sunset-beach-2.jpg"
    ],
    bannerPosition: "center center"
  };

  const resourcesBanner = {
    bannerImage: "assets/images/collections/banners/resources-banner.png",
    bannerImages: ["assets/images/collections/banners/resources-banner.png"],
    bannerPosition: "center center"
  };

  const backupBanner = {
    bannerImage: "assets/images/collections/backup-restore-banner.png",
    bannerImages: ["assets/images/collections/backup-restore-banner.png"],
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
    applyCollectionBanner($("resourcesHero"), resourcesBanner, "collection");
    applyCollectionBanner($("backupHero"), backupBanner, "collection");
  }

  function renderCollection(id) {
    activeCollectionId = id;
    const c = collections[id];
    if (!c) return;
    const { done, total, progress } = collectionProgress(id);
    const trackerEnabled = trackingEnabled(c);
    applyCollectionBanner(document.querySelector(".collection-hero"), c, "collection");
    $("collectionEyebrow").innerHTML = `${collectionIconMarkup(c, "hero-icon")} <span>Collection</span>`;
    $("collectionTitle").textContent = c.title;
    $("collectionDescription").textContent = c.description;
    $("collectionProgress").textContent = trackerEnabled ? `${done} of ${total}` : `${total} items`;
    $("collectionProgress").nextElementSibling.textContent = trackerEnabled ? "completed today" : "in this collection";
    const supportGrid = document.querySelector(".collection-support-grid");
    supportGrid?.classList.toggle("single-panel", !trackerEnabled);
    supportGrid?.classList.toggle("hidden", !trackerEnabled);
    if ($("collectionProgressLarge")) $("collectionProgressLarge").textContent = trackerEnabled ? `${done} of ${total}` : `${total}`;
    if ($("collectionProgressLarge")) $("collectionProgressLarge").nextElementSibling.textContent = trackerEnabled ? "completed today" : "duʿās and categories";
    if ($("collectionInstructionsText")) {
      const beginning = trackerEnabled ? "Start with the first duʿā, or choose any duʿā below." : "Start with the first duʿā, or choose any duʿā below.";
      $("collectionInstructionsText").textContent = `${beginning} This collection is being reviewed. Duaa cards marked Coming Soon are not yet available because their wording, sources, and study resources are still being checked. Verified duʿās can be opened in Focus Mode.`;
    }
    if ($("collectionHabitCard")) {
      if (trackerEnabled) {
        $("collectionHabitCard").outerHTML = habitCardMarkup(id, { compact: true }).replace('<article class="habit-card', '<article id="collectionHabitCard" class="habit-card collection-habit-card');
      } else {
        $("collectionHabitCard").outerHTML = `<article class="info-card collection-habit-card collection-meta-card" id="collectionHabitCard">${collectionIconMarkup(c, "large-icon")}<h3>${escapeHtml(c.shortTitle || c.title)}</h3><p>${escapeHtml(c.description || "")}</p></article>`;
      }
    }
    const list = $("collectionList");
    if (c.categories?.length) {
      let categoryItemOffset = 0;
      list.innerHTML = c.categories.map((category, categoryIndex) => {
        const startIndex = categoryItemOffset;
        categoryItemOffset += (category.items || []).length;
        return `<article class="collection-card category-card">
        <h3>${escapeHtml(category.name)}</h3>
        <p>${escapeHtml(category.description || "")}</p>
        <div class="card-actions"><button class="btn soft-btn" data-toggle-category="${categoryIndex}" type="button">${openCategoryIndex === categoryIndex ? "Hide Duʿās" : "View Duʿās"}</button></div>
        <div class="category-duaas ${openCategoryIndex === categoryIndex ? "" : "hidden"}" id="category-${categoryIndex}">${(category.items || []).map((item, index) => {
          const itemTitle = item.summary || item.label || item.openingWords || item.title || `Duʿā ${startIndex + index + 1}`;
          const verified = duaaVerified(item);
          const status = duaaStatusLabel(item);
          const disabled = verified ? "" : ` disabled aria-disabled="true" title="${escapeHtml(duaaLockedMessage(item))}"`;
          const actionText = verified ? "Read →" : "Not available yet";
          return `<button class="duaa-main category-duaa-detail ${verified ? "" : "locked-duaa"}" ${verified ? `data-focus-index="${startIndex + index}"` : ""} type="button"${disabled}><span class="duaa-number">${startIndex + index + 1}</span><span class="duaa-copy"><strong>${escapeHtml(itemTitle)}</strong><span class="verification-badge">${escapeHtml(status)}</span><em>${actionText}</em></span></button>`;
        }).join("")}</div>
      </article>`;
      }).join("");
      return;
    }
    list.innerHTML = c.items.map((item, index) => {
      const checked = !!progress[index];
      const title = item.summary || item.label || item.openingWords || item.title || `Duʿā ${index + 1}`;
      const verified = duaaVerified(item);
      const status = duaaStatusLabel(item);
      const marker = trackerEnabled && verified
        ? `<button class="duaa-number ${checked ? "done" : ""}" data-toggle-duaa="${index}" type="button" aria-label="${checked ? "Mark incomplete" : "Mark complete"}">${checked ? "✓" : index + 1}</button>`
        : `<span class="duaa-number" aria-hidden="true">${index + 1}</span>`;
      const focusAction = verified
        ? `<button class="duaa-main" data-focus-index="${index}" type="button">
          <span class="duaa-copy"><strong>${escapeHtml(title)}</strong><em>Read →</em></span>
        </button>`
        : `<button class="duaa-main locked-duaa" type="button" disabled aria-disabled="true" title="${escapeHtml(duaaLockedMessage(item))}">
          <span class="duaa-copy"><strong>${escapeHtml(title)}</strong><span class="verification-badge">${escapeHtml(status)}</span><em>Not available yet</em></span>
        </button>`;
      return `<article class="duaa-row ${trackerEnabled && checked ? "done" : ""} ${verified ? "" : "unverified-duaa"}">
        ${marker}
        ${focusAction}
      </article>`;
    }).join("");
  }

  function appState() {
    return navigationState();
  }

  function pushAppState() {
    saveNavigationState();
    if (suppressHistoryPush) return;
    history.pushState(appState(), "", location.href);
  }

  function showView(name, { push = true } = {}) {
    const targetName = collections[name] && !collectionOpenable(name) ? "home" : name;
    if (targetName !== activeCollectionId) openCategoryIndex = null;
    document.querySelectorAll(".view").forEach(view => view.classList.add("hidden"));
    if (collections[targetName] && collectionOpenable(targetName)) {
      renderCollection(targetName);
      $("collectionView").classList.remove("hidden");
    } else {
      $(`${targetName}View`)?.classList.remove("hidden");
    }
    currentViewName = targetName;
    focusOpen = false;
    document.querySelectorAll(".nav a").forEach(a => a.classList.toggle("active", a.dataset.view === targetName));
    closeMobileMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (push) pushAppState();
  }

  function handleDateChange() {
    ensureCurrentWeek();
    const latestDateKey = currentDateKey();
    if (latestDateKey !== renderedDateKey) {
      renderedDateKey = latestDateKey;
      renderTodayDate();
      renderAll();
      if (!$(`collectionView`).classList.contains("hidden")) renderCollection(activeCollectionId);
    }
  }

  function toggleDuaa(index) {
    if (!trackingEnabled(activeCollectionId)) return;
    const progress = safeParse(progressKey(activeCollectionId));
    progress[index] = !progress[index];
    saveJson(progressKey(activeCollectionId), progress);
    markHabitIfNeeded(activeCollectionId);
    renderAll();
    renderCollection(activeCollectionId);
  }

  function setDuaaComplete(id, index, value) {
    if (!trackingEnabled(id)) return;
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
    if ($("focusStudyContent")) $("focusStudyContent").innerHTML = studyResourcesMarkup(item);
    const trackerEnabled = trackingEnabled(c);
    $("focusPrev").disabled = nextVerifiedFocusIndex(focusIndex, -1) === -1;
    $("closeFocusMode").textContent = trackerEnabled ? "Exit Focus Mode" : "Back to Collection";
    $("focusSkip").hidden = !trackerEnabled;
    $("focusCompleteNext").textContent = trackerEnabled ? "Complete & Next" : "Next";
  }

  function nextVerifiedFocusIndex(startIndex, direction = 1) {
    const items = collections[focusCollectionId]?.items || [];
    for (let index = startIndex + direction; index >= 0 && index < items.length; index += direction) {
      if (duaaVerified(items[index])) return index;
    }
    return -1;
  }

  function advanceFocusOrFinish() {
    const nextIndex = nextVerifiedFocusIndex(focusIndex, 1);
    if (nextIndex !== -1) {
      focusIndex = nextIndex;
      renderFocusItem();
      saveNavigationState();
      return;
    }
    closeFocus({ push: true });
  }

  function openFocus(id, index = 0, { push = true } = {}) {
    if (!collectionOpenable(id)) return;
    const item = collections[id]?.items?.[index];
    if (!duaaVerified(item)) return;
    focusCollectionId = id;
    focusIndex = index;
    renderFocusItem();
    $("focusMode").classList.remove("hidden");
    document.body.style.overflow = "hidden";
    focusOpen = true;
    saveNavigationState();
    if (push) pushAppState();
  }

  function closeFocus({ push = false } = {}) {
    $("focusMode").classList.add("hidden");
    document.body.style.overflow = "";
    focusOpen = false;
    renderAll();
    if (!$(`collectionView`).classList.contains("hidden")) renderCollection(activeCollectionId);
    saveNavigationState();
    if (push) pushAppState();
  }

  function renderAll() {
    renderHomeBanner();
    renderHomeCards();
    renderHabitCards();
    renderOccasionCards();
    renderResources();
  }

  function openMobileMenu(){ $("sidebar").classList.add("open"); $("mobileBackdrop").classList.remove("hidden"); $("mobileMenuToggle")?.setAttribute("aria-expanded", "true"); }
  function closeMobileMenu(){ $("sidebar").classList.remove("open"); $("mobileBackdrop").classList.add("hidden"); $("mobileMenuToggle")?.setAttribute("aria-expanded", "false"); }

  document.addEventListener("click", (e) => {
    const nav = e.target.closest("[data-view]");
    if (nav) { e.preventDefault(); showView(nav.dataset.view); return; }

    const opener = e.target.closest("[data-open-collection]");
    if (opener) {
      if (collectionOpenable(opener.dataset.openCollection)) showView(opener.dataset.openCollection);
      return;
    }

    const toggle = e.target.closest("[data-toggle-duaa]");
    if (toggle) { toggleDuaa(Number(toggle.dataset.toggleDuaa)); return; }

    const focus = e.target.closest("[data-focus-index]");
    if (focus) { openFocus(activeCollectionId, Number(focus.dataset.focusIndex)); return; }

    const category = e.target.closest("[data-toggle-category]");
    if (category) {
      const categoryIndex = Number(category.dataset.toggleCategory);
      const panel = $(`category-${categoryIndex}`);
      panel?.classList.toggle("hidden");
      const isHidden = panel?.classList.contains("hidden");
      openCategoryIndex = isHidden ? null : categoryIndex;
      category.textContent = isHidden ? "View Duʿās" : "Hide Duʿās";
      saveNavigationState();
      return;
    }
  });

  $("mobileMenuToggle")?.addEventListener("click", openMobileMenu);
  $("mobileMenuClose")?.addEventListener("click", closeMobileMenu);
  $("mobileBackdrop")?.addEventListener("click", closeMobileMenu);
  $("closeFocusMode")?.addEventListener("click", () => closeFocus({ push: true }));
  $("focusPrev")?.addEventListener("click", () => {
    const previousIndex = nextVerifiedFocusIndex(focusIndex, -1);
    if (previousIndex !== -1) {
      focusIndex = previousIndex;
      renderFocusItem();
      saveNavigationState();
    }
  });
  $("focusSkip")?.addEventListener("click", advanceFocusOrFinish);
  $("focusCompleteNext")?.addEventListener("click", () => {
    if (trackingEnabled(focusCollectionId)) setDuaaComplete(focusCollectionId, focusIndex, true);
    advanceFocusOrFinish();
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) handleDateChange();
  });
  window.addEventListener("focus", handleDateChange);

  window.addEventListener("popstate", (event) => {
    suppressHistoryPush = true;
    const state = validNavigationState(event.state) || { view: "home" };
    const wasFocusOpen = focusOpen;
    showView(state.view || "home", { push: false });
    if (state.focus) openFocus(state.collectionId || activeCollectionId, Number(state.focusIndex || 0), { push: false });
    else if (wasFocusOpen) closeFocus({ push: false });
    suppressHistoryPush = false;
  });

  $("downloadBackup")?.addEventListener("click", () => {
    const payload = { app: "duaa-companion", version: "1.3", exportedAt: new Date().toISOString(), localStorage: {} };
    Object.keys(localStorage)
      .filter(isTrackedStorageKey)
      .forEach(k => payload.localStorage[k] = localStorage.getItem(k));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `duaa-companion-backup-${currentDateKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  $("restoreBackup")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      if (!payload || payload.app !== "duaa-companion" || !payload.localStorage) throw new Error("Invalid backup file.");
      Object.entries(payload.localStorage)
        .filter(([key]) => isTrackedStorageKey(key))
        .forEach(([key, value]) => localStorage.setItem(key, value));
      ensureCurrentWeek();
      alert("Backup restored successfully.");
      renderAll();
      showView("home");
    } catch (err) {
      alert("This backup file could not be restored.");
    }
  });

  ensureCurrentWeek();
  renderAll();
  const restoredState = readNavigationState() || { view: "home" };
  suppressHistoryPush = true;
  showView(restoredState.view || "home", { push: false });
  if (restoredState.categoryIndex !== undefined) {
    openCategoryIndex = restoredState.categoryIndex;
    renderCollection(restoredState.view);
  }
  if (restoredState.focus) {
    openFocus(restoredState.collectionId, restoredState.focusIndex, { push: false });
  }
  suppressHistoryPush = false;
  saveNavigationState();
  history.replaceState(appState(), "", location.href);
});
