const AI_PROVIDERS = [
  {
    key: "chatgpt",
    s: "ChatGPT",
    t: "chatgpt",
    u: "https://chatgpt.com/?q={{{s}}}",
  },
  {
    key: "perplexity",
    s: "Perplexity",
    t: "ppx",
    u: "https://www.perplexity.ai/?q={{{s}}}",
  },
  {
    key: "gemini",
    s: "Gemini",
    t: "gemini",
    u: "https://gemini.google.com/app?q={{{s}}}",
  },
  {
    key: "aistudio",
    s: "Google AI Studio",
    t: "aistudio",
    u: "https://aistudio.google.com/prompts/new_chat?prompt={{{s}}}",
  },
  {
    key: "claude",
    s: "Claude",
    t: "claude",
    u: "https://claude.ai/new?q={{{s}}}",
  },
];

const DEFAULT_AI_PROVIDER = "chatgpt";

const getAiProviderKey = () => {
  const stored = getFromStorage("ai_provider") || DEFAULT_AI_PROVIDER;
  return AI_PROVIDERS.some((provider) => provider.key === stored)
    ? stored
    : DEFAULT_AI_PROVIDER;
};

const getAiProviderBangs = () =>
  AI_PROVIDERS.map((provider) => ({
    c: "AI",
    d: new URL(provider.u).hostname,
    r: 0,
    s: provider.s,
    sc: "AI",
    t: provider.t,
    u: provider.u,
    aiProviderKey: provider.key,
  }));

const getOrderedAiProviderBangs = () => {
  const defaultKey = getAiProviderKey();
  return getAiProviderBangs().sort((a, b) => {
    if (a.aiProviderKey === defaultKey) return -1;
    if (b.aiProviderKey === defaultKey) return 1;
    return AI_PROVIDERS.findIndex((provider) => provider.key === a.aiProviderKey) -
      AI_PROVIDERS.findIndex((provider) => provider.key === b.aiProviderKey);
  });
};

window.LittleHomeAI = {
  providers: AI_PROVIDERS,
  defaultProviderKey: getAiProviderKey,
};

const clock = async () => {
  const render = async () => {
    const baseOffset = 100;
    const tsp = (number) =>
      (number < 10 ? `0${number}` : `${number}`)
        .split("")
        .map((e) => parseInt(e) * baseOffset);
    const time = new Date();
    var ft = [
      tsp(time.getHours()),
      tsp(time.getMinutes()),
      tsp(time.getSeconds()),
    ].flat();
    var fe = [
      document.querySelectorAll(".digit.h")[0],
      document.querySelectorAll(".digit.h")[1],
      document.querySelectorAll(".digit.m")[0],
      document.querySelectorAll(".digit.m")[1],
      document.querySelectorAll(".digit.s")[0],
      document.querySelectorAll(".digit.s")[1],
    ];
    var _ = [...Array(6).keys()].map((i) => {
      const value = ft[i];
      const element = fe[i];
      element.style = `transform: translateY(-${value}px)`;
    });
  };

  document.querySelector("body").appendChild(
    $.div(
      { id: "clock" },
      $.div(
        { class: "digit h" },
        [...Array(3).keys()].map((_) => $.span(_.toString())),
      ),
      $.div(
        { class: "digit h" },
        [...Array(11).keys()].map((_) => $.span(_ < 10 ? _.toString() : "0")),
      ),
      $.div({ class: "digit l" }, $.span(":")),
      $.div(
        { class: "digit m" },
        [...Array(7).keys()].map((_) => $.span(_ < 10 ? _.toString() : "0")),
      ),
      $.div(
        { class: "digit m" },
        [...Array(11).keys()].map((_) => $.span(_ < 10 ? _.toString() : "0")),
      ),
      $.div({ class: "digit l" }, $.span(":")),
      $.div(
        { class: "digit s" },
        [...Array(7).keys()].map((_) => $.span(_ < 10 ? _.toString() : "0")),
      ),
      $.div(
        { class: "digit s" },
        [...Array(11).keys()].map((_) => $.span(_ < 10 ? _.toString() : "0")),
      ),
    ),
  );
  document
    .querySelector("body")
    .appendChild($.div({ id: "idleHint" }, "начните печатать для поиска, пробел - промпт для ИИ"));
  render();
  setInterval(() => render(), 200);
};

searcher = () => {
  const escapeHtml = (value) =>
    value.replace(/[&<>"']/g, (char) => {
      const escaped = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };
      return escaped[char];
    });

  const findbang = (query) => {
    const match = query.match(/(?:^|\s)!([^\s]*)/);
    if (!match) return { found: false, valid: false };

    const inputed = match[1];
    const start = match.index + match[0].indexOf("!");
    const end = start + inputed.length + 1;

    for (const bang of [...getAiProviderBangs(), ...bangs]) {
      if (bang.t == inputed)
        return {
          found: true,
          valid: true,
          inputed: inputed,
          start: start,
          end: end,
          data: bang,
        };
    }
    return {
      found: true,
      valid: false,
      inputed: inputed,
      start: start,
      end: end,
    };
  };

  const getBangSuggestions = (inputed) => {
    const needle = inputed.toLowerCase();
    const allBangs = [...getOrderedAiProviderBangs(), ...bangs];
    if (needle === "") return allBangs.slice(0, 8);

    return allBangs
      .filter((bang) => {
        const tag = bang.t.toLowerCase();
        const name = bang.s.toLowerCase();
        return tag.startsWith(needle) || name.includes(needle);
      })
      .sort((a, b) => {
        const at = a.t.toLowerCase();
        const bt = b.t.toLowerCase();
        if (at.startsWith(needle) !== bt.startsWith(needle)) {
          return at.startsWith(needle) ? -1 : 1;
        }
        return a.t.length - b.t.length || a.t.localeCompare(b.t);
      })
      .slice(0, 8);
  };

  const getDirectUrl = (query) => {
    if (query.includes(" ") || query.startsWith("!")) return null;

    try {
      const url = new URL(
        /^[a-z][a-z0-9+.-]*:\/\//i.test(query) ? query : `https://${query}`,
      );
      const hostname = url.hostname;

      if (!hostname.includes(".") && hostname !== "localhost") return null;
      if (hostname.includes(".") && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(hostname)) {
        return null;
      }

      return url.href;
    } catch {
      return null;
    }
  };

  var lastquery = "";
  var selectedSuggestion = 0;
  var selectionExplicit = false;
  var aiMode = false;
  var renderedSuggestions = [];
  var suggestionRequest = 0;
  var searchContext = { query: "", fb: null, directUrl: null };

  const suggestionsEl = $.div({ id: "searchSuggestions", class: "hidden" });
  document.querySelector("#searchContent").appendChild(suggestionsEl);

  const browserApi = typeof browser === "undefined" ? null : browser;
  const chromeApi = typeof chrome === "undefined" ? null : chrome;
  const extensionApi = browserApi || chromeApi;

  const logSuggestionError = (source, error) => {
    console.warn(`[LittleHome] ${source} suggestions unavailable`, error);
  };

  const extensionCall = (source, api, method, ...args) =>
    new Promise((resolve) => {
      if (!api || typeof api[method] !== "function") {
        logSuggestionError(source, "API is not available");
        resolve([]);
        return;
      }

      try {
        const result = api[method](...args);
        if (result && typeof result.then === "function") {
          result.then((value) => resolve(value ?? [])).catch((error) => {
            logSuggestionError(source, error);
            resolve([]);
          });
          return;
        }
      } catch {
        // Chrome callback APIs can throw when called without a callback.
      }

      try {
        api[method](...args, (result) => {
          if (extensionApi?.runtime?.lastError) {
            logSuggestionError(source, extensionApi.runtime.lastError.message);
            resolve([]);
            return;
          }
          resolve(result ?? []);
        });
      } catch (error) {
        logSuggestionError(source, error);
        resolve([]);
      }
    });

  extensionCall("permissions", extensionApi?.permissions, "contains", {
    permissions: ["tabs", "bookmarks", "history"],
  }).then((hasPermissions) => {
    if (hasPermissions === false) {
      console.warn(
        "[LittleHome] Missing tabs/bookmarks/history permissions. Reload or reinstall the extension and accept the new permissions.",
      );
    }
  });

  const includesQuery = (value, query) =>
    (value || "").toLowerCase().includes(query.toLowerCase());

  const highlightMatch = (value, query) => {
    const text = value || "";
    const needle = query.trim();
    if (needle === "") return escapeHtml(text);

    const index = text.toLowerCase().indexOf(needle.toLowerCase());
    if (index === -1) return escapeHtml(text);

    return `${escapeHtml(text.slice(0, index))}<mark>${escapeHtml(
      text.slice(index, index + needle.length),
    )}</mark>${escapeHtml(text.slice(index + needle.length))}`;
  };

  const getHost = (url) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const getSearchUrl = (query, fb = findbang(query)) => {
    const url = fb.valid
      ? fb.data.u
      : "https://www.google.com/search?q={{{s}}}";

    return url.replace(
      "{{{s}}}",
      encodeURIComponent(
        fb.found
          ? `${query.slice(0, fb.start)}${query.slice(fb.end)}`.trim()
          : query.trim(),
      ),
    );
  };

  const getCleanSearchQuery = (query, fb = findbang(query)) =>
    fb.found
      ? `${query.slice(0, fb.start)}${query.slice(fb.end)}`.trim()
      : query.trim();

  const isAiBang = (bang) => Boolean(bang?.aiProviderKey);

  const isAiSearchMode = (fb) => aiMode && fb?.valid && isAiBang(fb.data);

  const getAiUrl = (provider, query) =>
    provider.u.replace("{{{s}}}", encodeURIComponent(query.trim()));

  const searchLabel = (engine, query) => {
    const cleaned = query.trim();
    return `search via <strong>${escapeHtml(engine)}</strong>${
      cleaned ? ` for ${escapeHtml(cleaned)}` : ""
    }`;
  };

  const getSuggestionLabel = (suggestion, context = searchContext) => {
    if (!suggestion) {
      if (context.directUrl) return `open ${escapeHtml(getHost(context.directUrl))}`;
      return searchLabel(
        context.fb?.valid ? context.fb.data.s : "Google",
        getCleanSearchQuery(context.query, context.fb),
      );
    }

    if (suggestion.type === "tab") return `switch to open tab`;
    if (suggestion.type === "history") return `open from history`;
    if (suggestion.type === "bookmark") return `open bookmark`;
    if (suggestion.type === "url") return `open ${escapeHtml(getHost(suggestion.url))}`;
    if (suggestion.type === "ai") {
      return searchLabel(
        suggestion.provider.s,
        getCleanSearchQuery(context.query, context.fb),
      );
    }
    if (suggestion.type === "bang") {
      return searchLabel(
        suggestion.bang.s,
        getCleanSearchQuery(context.query, context.fb),
      );
    }
    if (suggestion.type === "search") return searchLabel("Google", suggestion.title);
    return searchLabel("Google", context.query);
  };

  const updateSearchSubtitle = () => {
    const p = document.querySelector("#searchContent > p");
    const suggestion = renderedSuggestions[selectedSuggestion];
    p.innerHTML = getSuggestionLabel(suggestion);
  };

  const createBangSuggestion = (bang, query, fb) => {
    const cleanedQuery = getCleanSearchQuery(query, fb);
    return {
      type: "bang",
      title: cleanedQuery || `!${bang.t}`,
      subtitle: cleanedQuery ? `Search ${bang.s}` : bang.s,
      highlight: cleanedQuery || fb.inputed,
      bang,
    };
  };

  const createAiSuggestion = (provider, query, fb) => {
    const cleanedQuery = getCleanSearchQuery(query, fb);
    return {
      type: "ai",
      title: cleanedQuery || provider.s,
      subtitle: cleanedQuery ? `Prompt ${provider.s}` : "AI assistant",
      highlight: cleanedQuery,
      provider,
    };
  };

  const getAiSuggestions = (query, fb) =>
    getOrderedAiProviderBangs().map((provider) =>
      createAiSuggestion(provider, query, fb),
    );

  const applyBangSuggestion = (bang) => {
    const searchInput = document.querySelector("#search_ddd");
    const query = searchInput.value.trim();
    const fb = findbang(query);
    if (!fb.found) return;

    searchInput.value = `${query.slice(0, fb.start)}!${bang.t}${query.slice(
      fb.end,
    )}`.trimStart();
    selectedSuggestion = 0;
    proceed(searchInput.value.trim(), true);
  };

  const uniqueSuggestions = (suggestions) => {
    const seen = new Set();
    return suggestions
      .filter(Boolean)
      .filter((suggestion) => {
        const key = suggestion.url || `${suggestion.type}:${suggestion.title}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);
  };

  const getLocalSuggestions = async (query, fb, directUrl) => {
    if (query === "") return [];
    if (isAiSearchMode(fb)) {
      return getAiSuggestions(query, fb);
    }
    if (fb.found) {
      return getBangSuggestions(fb.inputed).map((bang) =>
        createBangSuggestion(bang, query, fb),
      );
    }

    const [tabs, bookmarks, history] = await Promise.all([
      extensionCall("tabs", extensionApi?.tabs, "query", {}),
      extensionCall("bookmarks", extensionApi?.bookmarks, "search", query),
      extensionCall("history", extensionApi?.history, "search", {
        text: query,
        maxResults: 12,
        startTime: 0,
      }),
    ]);

    const filteredTabs = tabs
      .filter((tab) => includesQuery(tab.title, query) || includesQuery(tab.url, query))
      .slice(0, 4)
      .map((tab) => ({
        type: "tab",
        title: tab.title || tab.url || "Open tab",
        subtitle: `Switch to open tab${tab.url ? ` - ${getHost(tab.url)}` : ""}`,
        url: tab.url,
        tabId: tab.id,
        windowId: tab.windowId,
      }));

    const filteredBookmarks = bookmarks
      .filter((bookmark) => bookmark.url)
      .slice(0, 4)
      .map((bookmark) => ({
        type: "bookmark",
        title: bookmark.title || bookmark.url,
        subtitle: `Bookmark - ${getHost(bookmark.url)}`,
        url: bookmark.url,
      }));

    const filteredHistory = history
      .filter((item) => item.url)
      .slice(0, 4)
      .map((item) => ({
        type: "history",
        title: item.title || item.url,
        subtitle: `History - ${getHost(item.url)}`,
        url: item.url,
      }));

    return uniqueSuggestions([
      ...filteredTabs,
      directUrl && {
        type: "url",
        title: getHost(directUrl),
        subtitle: "Open URL",
        url: directUrl,
      },
      ...filteredBookmarks,
      ...filteredHistory,
    ]);
  };

  const getImmediateSuggestions = (query, fb, directUrl) => {
    if (query === "") return [];
    if (isAiSearchMode(fb)) {
      return getAiSuggestions(query, fb);
    }
    if (fb.found) {
      return getBangSuggestions(fb.inputed).map((bang) =>
        createBangSuggestion(bang, query, fb),
      );
    }

    return uniqueSuggestions([
      directUrl && {
        type: "url",
        title: getHost(directUrl),
        subtitle: "Open URL",
        url: directUrl,
      },
      {
        type: "search",
        title: query,
        subtitle: "Search Google",
        value: query,
      },
    ]);
  };

  const getSearchSuggestions = async (query) => {
    if (query === "") return [];

    const searchResponse = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(
        query,
      )}`,
    )
      .then((response) => (response.ok ? response.json() : []))
      .catch(() => []);

    const searchTerms = Array.isArray(searchResponse[1]) ? searchResponse[1] : [];
    return searchTerms.slice(0, 5).map((term) => ({
      type: "search",
      title: term,
      subtitle: "Google suggestion",
      value: term,
    }));
  };

  const getBrowserSuggestions = async (query, fb, directUrl) => {
    const [localSuggestions, searchSuggestions] = await Promise.all([
      getLocalSuggestions(query, fb, directUrl),
      fb.found ? [] : getSearchSuggestions(query),
    ]);

    return uniqueSuggestions([
      ...localSuggestions,
      ...searchSuggestions,
    ]);
  };

  const renderSuggestions = (suggestions) => {
    renderedSuggestions = suggestions;

    if (suggestions.length === 0) {
      suggestionsEl.classList.add("hidden");
      suggestionsEl.innerHTML = "";
      selectedSuggestion = 0;
      return;
    }

    selectedSuggestion = Math.min(selectedSuggestion, suggestions.length - 1);
    suggestionsEl.innerHTML = "";

    suggestions.forEach((suggestion, index) => {
      const isSelected = index === selectedSuggestion;
      const item = $.button(
        {
          class: `searchSuggestion ${suggestion.type}${
            isSelected ? " selected" : ""
          }`,
          type: "button",
          onmousedown: (event) => {
            event.preventDefault();
            runSuggestion(suggestion);
          },
        },
        $.span({ class: "searchSuggestionType" }, suggestion.type),
        $.span(
          { class: "searchSuggestionText" },
          $.span(
            { class: "searchSuggestionTitle" },
            highlightMatch(suggestion.title, suggestion.highlight || searchContext.query),
          ),
          $.span({ class: "searchSuggestionMeta" }, escapeHtml(suggestion.subtitle || "")),
        ),
      );
      suggestionsEl.appendChild(item);
    });

    void suggestionsEl.offsetWidth;
    suggestionsEl.classList.remove("hidden");
    updateSearchSubtitle();
  };

  const updateSelectedSuggestion = () => {
    suggestionsEl.querySelectorAll(".searchSuggestion").forEach((item, index) => {
      item.classList.toggle(
        "selected",
        index === selectedSuggestion,
      );
    });
    updateSearchSubtitle();
  };

  const runSuggestion = (suggestion) => {
    if (!suggestion) return false;

    if (suggestion.type === "bang") {
      applyBangSuggestion(suggestion.bang);
      return true;
    }

    if (suggestion.type === "ai") {
      if (window.__littleHomeStopNtpFocus) window.__littleHomeStopNtpFocus();
      window.location.href = getAiUrl(
        suggestion.provider,
        getCleanSearchQuery(searchContext.query, searchContext.fb),
      );
      return true;
    }

    if (suggestion.type === "tab") {
      if (!extensionApi?.windows || !extensionApi?.tabs) return false;
      if (window.__littleHomeStopNtpFocus) window.__littleHomeStopNtpFocus();
      extensionCall("windows", extensionApi.windows, "update", suggestion.windowId, {
        focused: true,
      });
      extensionCall("tabs", extensionApi.tabs, "update", suggestion.tabId, {
        active: true,
      });
      extensionCall("tabs", extensionApi.tabs, "getCurrent").then((tab) => {
        if (tab?.id) {
          extensionCall("tabs", extensionApi.tabs, "remove", tab.id);
        }
      });
      return true;
    }

    if (suggestion.type === "search") {
      if (window.__littleHomeStopNtpFocus) window.__littleHomeStopNtpFocus();
      window.location.href = getSearchUrl(suggestion.value);
      return true;
    }

    if (suggestion.url) {
      if (window.__littleHomeStopNtpFocus) window.__littleHomeStopNtpFocus();
      window.location.href = suggestion.url;
      return true;
    }

    return false;
  };

  const proceed = async (query, force = false) => {
    if (query == lastquery && !force) return;
    lastquery = query;
    const requestId = ++suggestionRequest;

    // Плавное переключение классов
    const clockEl = document.querySelector("#clock");
    const idleHintEl = document.querySelector("#idleHint");
    const searchEl = document.querySelector("#searcher");

    if (query === "") {
      clockEl.classList.remove("hidden");
      idleHintEl?.classList.remove("hidden");
      searchEl.classList.remove("active");
      renderSuggestions([]);
    } else {
      clockEl.classList.add("hidden");
      idleHintEl?.classList.add("hidden");
      searchEl.classList.add("active");
    }

    const fb = findbang(query);
    searchContext = { query, fb, directUrl: null };
    let displayQuery = escapeHtml(query);
    if (isAiSearchMode(fb)) {
      displayQuery = escapeHtml(getCleanSearchQuery(query, fb));
    } else if (fb.found) {
      displayQuery = `${escapeHtml(query.slice(0, fb.start))}<span class="${
        fb.valid ? "" : "error"
      }">${escapeHtml(query.slice(fb.start, fb.end))}</span>${escapeHtml(
        query.slice(fb.end),
      )}`;
    }
    const directUrl = fb.found ? null : getDirectUrl(query);
    searchContext.directUrl = directUrl;

    const h1 = document.querySelector("#searchContent > h1");
    const p = document.querySelector("#searchContent > p");

    // --- НАЧАЛО АНИМАЦИИ ЦЕНТРИРОВАНИЯ ---

    const oldWidth = h1.offsetWidth;
    h1.innerHTML = displayQuery;
    p.innerHTML = getSuggestionLabel(null, searchContext);
    const newWidth = h1.offsetWidth;
    if (oldWidth !== 0 && newWidth !== 0 && oldWidth !== newWidth) {
      const deltaX = (newWidth - oldWidth) / 2;
      h1.classList.add("no-transition");
      h1.style.transform = `translateX(${deltaX}px)`;
      void h1.offsetWidth;
      h1.classList.remove("no-transition");
      h1.style.transform = `translateX(0)`;
    } else {
      h1.style.transform = `translateX(0)`;
    }

    const immediateSuggestions = getImmediateSuggestions(query, fb, directUrl);
    renderSuggestions(immediateSuggestions);

    if (fb.found) return;

    getLocalSuggestions(query, fb, directUrl).then((localSuggestions) => {
      if (requestId === suggestionRequest) {
        renderSuggestions(uniqueSuggestions([...localSuggestions, ...immediateSuggestions]));
      }
    });

    getSearchSuggestions(query).then((searchSuggestions) => {
      if (requestId === suggestionRequest) {
        renderSuggestions(uniqueSuggestions([...renderedSuggestions, ...searchSuggestions]));
      }
    });
  };
  const find = (element) => {
    const query = element.target.value.trim();
    const fb = findbang(query);
    const directUrl = fb.found ? null : getDirectUrl(query);

    if (directUrl) {
      if (window.__littleHomeStopNtpFocus) window.__littleHomeStopNtpFocus();
      window.location.href = directUrl;
      return;
    }

    if (window.__littleHomeStopNtpFocus) window.__littleHomeStopNtpFocus();
    window.location.href = getSearchUrl(query, fb);
  };
  const searchInput = document.querySelector("#search_ddd");

  // Do not use the native "change" event for search.
  // A text input fires "change" not only on Enter, but also when it loses focus
  // after its value changed. The new-tab focus workaround briefly fights Chrome's
  // omnibox focus, which can create a blur/change cycle and instantly navigate.
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === " " && e.target.value === "") {
      e.preventDefault();
      const defaultProvider = getOrderedAiProviderBangs()[0];
      aiMode = true;
      selectedSuggestion = 0;
      selectionExplicit = false;
      e.target.value = `!${defaultProvider.t} `;
      proceed(e.target.value.trim(), true);
      return;
    }

    if (e.key === "Backspace" && aiMode) {
      const query = e.target.value.trim();
      const fb = findbang(query);
      if (fb.valid && isAiBang(fb.data) && getCleanSearchQuery(query, fb) === "") {
        e.preventDefault();
        e.target.value = "";
        selectedSuggestion = 0;
        selectionExplicit = false;
        aiMode = false;
        proceed("", true);
        return;
      }
    }

    if (e.key === "Escape" && e.target.value.trim() !== "") {
      e.preventDefault();
      e.target.value = "";
      selectedSuggestion = 0;
      selectionExplicit = false;
      aiMode = false;
      proceed("", true);
      return;
    }

    if (renderedSuggestions.length > 0 && e.key === "ArrowDown") {
      e.preventDefault();
      selectedSuggestion = (selectedSuggestion + 1) % renderedSuggestions.length;
      selectionExplicit = true;
      updateSelectedSuggestion();
      return;
    }

    if (renderedSuggestions.length > 0 && e.key === "ArrowUp") {
      e.preventDefault();
      selectedSuggestion =
        (selectedSuggestion - 1 + renderedSuggestions.length) %
        renderedSuggestions.length;
      selectionExplicit = true;
      updateSelectedSuggestion();
      return;
    }

    if (renderedSuggestions.length > 0 && e.key === "Tab") {
      e.preventDefault();
      selectionExplicit = true;
      runSuggestion(renderedSuggestions[selectedSuggestion]);
      return;
    }

    if (e.key !== "Enter") return;
    if (e.isComposing) return;
    if (e.target.value.trim() === "") return;

    e.preventDefault();
    const query = e.target.value.trim();
    const fb = findbang(query);
    const suggestion = renderedSuggestions[selectedSuggestion];
    if (suggestion?.type === "ai" && runSuggestion(suggestion)) return;

    if (fb.valid) {
      find(e);
      return;
    }

    if (runSuggestion(suggestion)) return;
    find(e);
  });

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    const fb = findbang(query);
    if (query === "" || (aiMode && (!fb.valid || !isAiBang(fb.data)))) {
      aiMode = false;
    }
    if (!(aiMode && selectionExplicit)) {
      selectedSuggestion = 0;
      selectionExplicit = false;
    }
    proceed(query);
  });

  setInterval(() => {
    if (document.activeElement !== searchInput) {
      searchInput.focus({ preventScroll: true });
    }
    proceed(searchInput.value.trim());
  }, 100);
};
