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
const DEFAULT_SEARCH_ENGINE = {
  name: "Google",
  url: "https://www.google.com/search?q={{{s}}}",
};

const getSearchEngine = () =>
  window.LittleHomeSettings?.getSearchEngine?.() || DEFAULT_SEARCH_ENGINE;

const getCustomBangs = () =>
  window.LittleHomeSettings?.getCustomBangs?.() || [];

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
    return (
      AI_PROVIDERS.findIndex((provider) => provider.key === a.aiProviderKey) -
      AI_PROVIDERS.findIndex((provider) => provider.key === b.aiProviderKey)
    );
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
    .appendChild(
      $.div(
        { id: "idleHint" },
        "начните печатать для поиска, пробел - промпт для ИИ",
      ),
    );
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

    for (const bang of [
      ...getAiProviderBangs(),
      ...getCustomBangs(),
      ...bangs,
    ]) {
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
    const allBangs = [
      ...getOrderedAiProviderBangs(),
      ...getCustomBangs(),
      ...bangs,
    ];
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
      if (
        hostname.includes(".") &&
        !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(hostname)
      ) {
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
  var tabsCache = [];
  var tabsCacheAt = 0;
  var searchIdleTimer = null;

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
          result
            .then((value) => resolve(value ?? []))
            .catch((error) => {
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

  const getTabsCached = async () => {
    const now = Date.now();
    if (tabsCache.length > 0 && now - tabsCacheAt < 2000) return tabsCache;

    const tabs = await extensionCall("tabs", extensionApi?.tabs, "query", {});
    tabsCache = tabs;
    tabsCacheAt = Date.now();
    return tabsCache;
  };

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
      : getSearchEngine().url;

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

  const createSearchSuggestion = (query, title = query, subtitle = null) => ({
    type: "search",
    title,
    subtitle: subtitle || `Search ${getSearchEngine().name}`,
    value: title,
    isPrimarySearch: title === query,
  });

  const createDirectUrlSuggestion = (directUrl) =>
    directUrl && {
      type: "url",
      title: getHost(directUrl),
      subtitle: "Open URL",
      url: directUrl,
    };

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
      if (context.directUrl)
        return `open ${escapeHtml(getHost(context.directUrl))}`;
      return searchLabel(
        context.fb?.valid ? context.fb.data.s : getSearchEngine().name,
        getCleanSearchQuery(context.query, context.fb),
      );
    }

    if (suggestion.type === "tab") return `switch to open tab`;
    if (suggestion.type === "history") return `open from history`;
    if (suggestion.type === "bookmark") return `open bookmark`;
    if (suggestion.type === "url")
      return `open ${escapeHtml(getHost(suggestion.url))}`;
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
    if (suggestion.type === "search")
      return searchLabel(getSearchEngine().name, suggestion.title);
    return searchLabel(getSearchEngine().name, context.query);
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
      subtitle: `Prompt ${provider.s}`,
      highlight: cleanedQuery,
      provider,
    };
  };

  const getAiSuggestions = (query, fb) =>
    getOrderedAiProviderBangs().map((provider) =>
      createAiSuggestion(provider, query, fb),
    );

  const getTextMeasureContext = (() => {
    const canvas = document.createElement("canvas");
    return canvas.getContext("2d");
  })();

  const splitQueryLines = (text, h1) => {
    const style = getComputedStyle(h1);
    const maxWidth = Math.min(1040, window.innerWidth - 48);
    getTextMeasureContext.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

    const lines = [];
    let line = "";
    let lineStart = 0;
    let index = 0;

    for (const char of Array.from(text)) {
      const nextLine = `${line}${char}`;
      if (
        line !== "" &&
        getTextMeasureContext.measureText(nextLine).width > maxWidth
      ) {
        lines.push({ text: line, start: lineStart, end: index });
        if (char === " ") {
          line = "";
          lineStart = index + 1;
        } else {
          line = char;
          lineStart = index;
        }
      } else {
        line = nextLine;
      }
      index += char.length;
    }

    if (line !== "") {
      lines.push({ text: line, start: lineStart, end: text.length });
    }
    return lines.length > 0 ? lines : [{ text: "", start: 0, end: 0 }];
  };

  const renderHighlightedLine = (line, highlight) => {
    if (!highlight) return escapeHtml(line.text);

    const start = Math.max(line.start, highlight.start);
    const end = Math.min(line.end, highlight.end);
    if (start >= end) return escapeHtml(line.text);

    const localStart = start - line.start;
    const localEnd = end - line.start;
    return `${escapeHtml(line.text.slice(0, localStart))}<span class="${highlight.className}">${escapeHtml(
      line.text.slice(localStart, localEnd),
    )}</span>${escapeHtml(line.text.slice(localEnd))}`;
  };

  const renderQueryLines = (
    h1,
    text,
    { placeholder = false, highlight = null } = {},
  ) => {
    h1.innerHTML = "";
    splitQueryLines(text, h1).forEach((line) => {
      h1.appendChild(
        $.span(
          {
            class: `queryLine${placeholder ? " placeholder" : ""}`,
          },
          renderHighlightedLine(line, highlight),
        ),
      );
    });
  };

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
    const unique = suggestions
      .filter(Boolean)
      .filter((suggestion) => {
        const key =
          suggestion.type === "tab"
            ? `tab:${suggestion.tabId || suggestion.url}`
            : suggestion.url || `${suggestion.type}:${suggestion.title}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);

    const primarySearch = suggestions.find(
      (suggestion) => suggestion?.type === "search" && suggestion.isPrimarySearch,
    );
    if (!primarySearch || unique.includes(primarySearch)) return unique;

    const replaceIndex = unique.findIndex((suggestion) => suggestion.type === "history");
    if (replaceIndex !== -1) {
      unique[replaceIndex] = primarySearch;
      return unique;
    }

    if (unique.length < 8) return [...unique, primarySearch];
    return [...unique.slice(0, 7), primarySearch];
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
      getTabsCached(),
      extensionCall("bookmarks", extensionApi?.bookmarks, "search", query),
      extensionCall("history", extensionApi?.history, "search", {
        text: query,
        maxResults: 12,
        startTime: 0,
      }),
    ]);

    return [
      createDirectUrlSuggestion(directUrl),
      ...getTabSuggestions(tabs, query),
      createSearchSuggestion(query),
      ...getBookmarkSuggestions(bookmarks),
      ...getHistorySuggestions(history),
    ].filter(Boolean);
  };

  const getTabSuggestions = (tabs, query) =>
    tabs
      .filter(
        (tab) =>
          includesQuery(tab.title, query) || includesQuery(tab.url, query),
      )
      .slice(0, 4)
      .map((tab) => ({
        type: "tab",
        title: tab.title || tab.url || "Open tab",
        subtitle: `Switch to open tab${tab.url ? ` - ${getHost(tab.url)}` : ""}`,
        url: tab.url,
        tabId: tab.id,
        windowId: tab.windowId,
      }));

  const getBookmarkSuggestions = (bookmarks) =>
    bookmarks
      .filter((bookmark) => bookmark.url)
      .slice(0, 2)
      .map((bookmark) => ({
        type: "bookmark",
        title: bookmark.title || bookmark.url,
        subtitle: `Bookmark - ${getHost(bookmark.url)}`,
        url: bookmark.url,
      }));

  const getHistorySuggestions = (history) =>
    history
      .filter((item) => item.url)
      .slice(0, 3)
      .map((item) => ({
        type: "history",
        title: item.title || item.url,
        subtitle: `History - ${getHost(item.url)}`,
        url: item.url,
      }));

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
      createDirectUrlSuggestion(directUrl),
      ...getTabSuggestions(tabsCache, query),
      createSearchSuggestion(query),
    ]);
  };

  const mergeTabSuggestions = (tabs, query, directUrl) => {
    const tabSuggestions = getTabSuggestions(tabs, query);
    if (!directUrl) {
      return uniqueSuggestions([...tabSuggestions, ...renderedSuggestions]);
    }

    const directIndex = renderedSuggestions.findIndex(
      (suggestion) => suggestion.type === "url" && suggestion.url === directUrl,
    );
    if (directIndex === -1) {
      return uniqueSuggestions([...tabSuggestions, ...renderedSuggestions]);
    }

    return uniqueSuggestions([
      ...renderedSuggestions.slice(0, directIndex + 1),
      ...tabSuggestions,
      ...renderedSuggestions.slice(directIndex + 1),
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

    const searchTerms = Array.isArray(searchResponse[1])
      ? searchResponse[1]
      : [];
    return searchTerms
      .filter((term) => term.toLowerCase() !== query.toLowerCase())
      .slice(0, 5)
      .map((term) => createSearchSuggestion(query, term, "Google suggestion"));
  };

  const getBrowserSuggestions = async (query, fb, directUrl) => {
    const [localSuggestions, searchSuggestions] = await Promise.all([
      getLocalSuggestions(query, fb, directUrl),
      fb.found ? [] : getSearchSuggestions(query),
    ]);

    return uniqueSuggestions([...localSuggestions, ...searchSuggestions]);
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
            highlightMatch(
              suggestion.title,
              suggestion.highlight || searchContext.query,
            ),
          ),
          $.span(
            { class: "searchSuggestionMeta" },
            escapeHtml(suggestion.subtitle || ""),
          ),
        ),
      );
      suggestionsEl.appendChild(item);
    });

    void suggestionsEl.offsetWidth;
    suggestionsEl.classList.remove("hidden");
    updateSearchSubtitle();
  };

  const updateSelectedSuggestion = () => {
    suggestionsEl
      .querySelectorAll(".searchSuggestion")
      .forEach((item, index) => {
        item.classList.toggle("selected", index === selectedSuggestion);
      });
    updateSearchSubtitle();
  };

  const clearSearchVisuals = () => {
    suggestionsEl.classList.add("hidden");
    suggestionsEl.innerHTML = "";
    renderedSuggestions = [];
    selectedSuggestion = 0;
    const h1 = document.querySelector("#searchContent > h1");
    const p = document.querySelector("#searchContent > p");
    h1.innerHTML = "";
    p.innerHTML = searchLabel(getSearchEngine().name, "");
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
      extensionCall(
        "windows",
        extensionApi.windows,
        "update",
        suggestion.windowId,
        {
          focused: true,
        },
      );
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
    const searchContentEl = document.querySelector("#searchContent");

    if (searchIdleTimer) {
      clearTimeout(searchIdleTimer);
      searchIdleTimer = null;
    }

    if (query === "") {
      searchEl.classList.remove("active");
      clockEl.classList.remove("hidden");
      idleHintEl?.classList.remove("hidden");
      suggestionsEl.classList.add("hidden");
      searchIdleTimer = setTimeout(() => {
        if (lastquery !== "") return;
        searchEl.style.setProperty("--query-lift", "0px");
        clearSearchVisuals();
        searchIdleTimer = null;
      }, 420);
      return;
    } else {
      clockEl.classList.add("hidden");
      idleHintEl?.classList.add("hidden");
      searchEl.classList.add("active");
    }

    const fb = findbang(query);
    searchContext = { query, fb, directUrl: null };
    let displayQuery = escapeHtml(query);
    let queryLineText = null;
    let queryLinePlaceholder = false;
    let queryLineHighlight = null;
    if (isAiSearchMode(fb)) {
      const aiQuery = getCleanSearchQuery(query, fb);
      displayQuery = aiQuery
        ? escapeHtml(aiQuery)
        : `<span class="placeholder">начните печатать</span>`;
      queryLineText = aiQuery || "начните печатать";
      queryLinePlaceholder = aiQuery === "";
    } else if (fb.found) {
      queryLineText = query;
      queryLineHighlight = {
        start: fb.start,
        end: fb.end,
        className: `bangToken${fb.valid ? "" : " error"}`,
      };
    } else {
      queryLineText = query;
    }
    const directUrl = fb.found ? null : getDirectUrl(query);
    searchContext.directUrl = directUrl;

    const h1 = document.querySelector("#searchContent > h1");
    const p = document.querySelector("#searchContent > p");

    // --- НАЧАЛО АНИМАЦИИ ЦЕНТРИРОВАНИЯ ---

    const oldLine = h1.querySelector(".queryLine:last-child");
    const oldWidth = oldLine?.offsetWidth || h1.offsetWidth;
    if (queryLineText === null) {
      h1.innerHTML = displayQuery;
    } else {
      renderQueryLines(h1, queryLineText, {
        placeholder: queryLinePlaceholder,
        highlight: queryLineHighlight,
      });
    }
    p.innerHTML = getSuggestionLabel(null, searchContext);
    const lineHeight =
      parseFloat(getComputedStyle(h1).lineHeight) || h1.offsetHeight;
    const lineCount =
      h1.querySelectorAll(".queryLine").length ||
      Math.max(1, Math.round(h1.offsetHeight / lineHeight));
    const newLine = h1.querySelector(".queryLine:last-child");
    const newWidth = newLine?.offsetWidth || h1.offsetWidth;
    if (newLine && oldWidth !== 0 && newWidth !== 0 && oldWidth !== newWidth) {
      const deltaX = (newWidth - oldWidth) / 2;
      newLine.classList.add("no-transition");
      newLine.style.transform = `translateX(${deltaX}px)`;
      void newLine.offsetWidth;
      newLine.classList.remove("no-transition");
      newLine.style.transform = `translateX(0)`;
    } else {
      h1.style.transform = `translateX(0)`;
    }

    const maxLift = Math.max(180, Math.round(window.innerHeight * 0.45));
    const lift = Math.min(maxLift, Math.max(0, lineCount - 1) * 30);
    searchEl.style.setProperty("--query-lift", `${lift}px`);
    if (searchEl.scrollTop > searchContentEl.offsetTop) {
      searchEl.scrollTo({ top: searchContentEl.offsetTop, behavior: "smooth" });
    }

    const immediateSuggestions = getImmediateSuggestions(query, fb, directUrl);
    renderSuggestions(immediateSuggestions);

    if (fb.found) return;

    getTabsCached().then((tabs) => {
      if (requestId === suggestionRequest) {
        renderSuggestions(mergeTabSuggestions(tabs, query, directUrl));
      }
    });

    extensionCall("bookmarks", extensionApi?.bookmarks, "search", query).then((bookmarks) => {
      if (requestId === suggestionRequest) {
        renderSuggestions(
          uniqueSuggestions([
            ...renderedSuggestions,
            ...getBookmarkSuggestions(bookmarks),
          ]),
        );
      }
    });

    extensionCall("history", extensionApi?.history, "search", {
      text: query,
      maxResults: 12,
      startTime: 0,
    }).then((history) => {
      if (requestId === suggestionRequest) {
        renderSuggestions(
          uniqueSuggestions([
            ...renderedSuggestions,
            ...getHistorySuggestions(history),
          ]),
        );
      }
    });

    getSearchSuggestions(query).then((searchSuggestions) => {
      if (requestId === suggestionRequest) {
        renderSuggestions(
          uniqueSuggestions([...renderedSuggestions, ...searchSuggestions]),
        );
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
      if (
        fb.valid &&
        isAiBang(fb.data) &&
        getCleanSearchQuery(query, fb) === ""
      ) {
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
      selectedSuggestion =
        (selectedSuggestion + 1) % renderedSuggestions.length;
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
