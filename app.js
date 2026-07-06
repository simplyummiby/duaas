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

  function renderCollectionsGrid() {
    const wrap = $("collectionsGrid");
    if (!wrap) return;
    wrap.innerHTML = collectionOrder.map(id => {
      const c = collections[id];
      const { done, total } = collectionProgress(id);
      return `<article class="collection-card ${id}">
        <div class="collection-icon">${c.icon}</div>
        <h3>${c.title}</h3>
        <p class="muted">${c.description}</p>
        <div class="collection-count">${done} of ${total} completed today</div>
        <div class="card-actions"><button class="btn" data-open-collection="${id}" type="button">Open Collection ›</button></div>
      </article>`;
    }).join("");
  }

  function renderCollection(id) {
    activeCollectionId = id;
    const c = collections[id];
    if (!c) return;
    const { done, total, progress } = collectionProgress(id);
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
          <span class="duaa-copy"><strong>${title}</strong><small>${summary}</small><em>Open in Focus Mode →</em></span>
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
    const progress = safeParse(progressKey(focusCollectionId));
    const isDone = !!progress[focusIndex];

    $("focusTitle").textContent = `${c?.title || "Collection"} · Focus Mode`;
    $("focusCount").textContent = `${focusIndex + 1} of ${total}`;
    $("focusProgressBar").style.width = `${pct}%`;
    $("focusArabic").textContent = itemField(item, ["arabic", "arabicText"]) || "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ";
    $("focusTranslation").textContent = itemField(item, ["translation", "english", "meaning"]) || "O Allah, You are my Lord; none has the right to be worshipped except You.";
    $("focusTransliteration").textContent = itemField(item, ["transliteration", "translit"]) || "";
    const source = itemField(item, ["reference", "source"]);
    $("focusSource").textContent = source ? `Source: ${source}` : "";
    $("focusPrev").disabled = focusIndex === 0;
    $("focusNext").disabled = focusIndex >= total - 1;
    $("focusMark").textContent = isDone ? "✓ Completed" : "✓ Complete";
    $("focusMark").classList.toggle("completed", isDone);
    $("focusUndo").classList.toggle("hidden", !isDone);
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
    renderHomeCards();
    renderHabitCards();
    renderCollectionsGrid();
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
  $("focusNext")?.addEventListener("click", () => { const total = collections[focusCollectionId]?.items.length || 1; if (focusIndex < total - 1) { focusIndex++; renderFocusItem(); } });
  $("focusMark")?.addEventListener("click", () => { setDuaaComplete(focusCollectionId, focusIndex, true); renderFocusItem(); });
  $("focusUndo")?.addEventListener("click", () => { setDuaaComplete(focusCollectionId, focusIndex, false); renderFocusItem(); });

  $("downloadBackup")?.addEventListener("click", () => {
    const payload = { app: "duaa-companion", version: "1.1", exportedAt: new Date().toISOString(), localStorage: {} };
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
