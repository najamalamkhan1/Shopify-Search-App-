import {
  Page,
  Card,
  Text,
  TextField,
  Select,
  Checkbox,
  Button,
  InlineGrid,
  BlockStack,
  Badge,
  Banner,
  Modal,
  FormLayout,
  Divider,
  InlineStack,
  Thumbnail,
  Box,
} from "@shopify/polaris";
import { useState, useCallback, useRef, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { useLoaderData, useFetcher } from "react-router";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const API = "https://search-app-hcwsn.ondigitalocean.app";

// ─── Loader: all GET endpoints parallel ──────────────────────────────────────
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const safe = async (url) => {
    try {
      const res = await fetch(url);
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  };

  const [
    settings,
    searchOptions,
    aiSettings,
    trendingSettings,
    synonyms,
    synonymSuggestions,
    performance,
    excludedProducts,
    displaySettings,
    adminSuggestions,
    typoSuggestionSettings,
  ] = await Promise.all([
    safe(`${API}/api/settings?shop=${shop}`),
    safe(`${API}/api/admin/search-options?shop=${shop}`),
    safe(`${API}/api/admin/ai-settings?shop=${shop}`),
    safe(`${API}/api/admin/trending-settings?shop=${shop}`),
    safe(`${API}/api/admin/synonyms?shop=${shop}`),
    safe(`${API}/api/admin/synonyms/suggestions?shop=${shop}&days=30`),
    safe(`${API}/api/search-performance?shop=${shop}&days=30`),
    safe(`${API}/api/admin/trending/excluded-products?shop=${shop}`),
    safe(`${API}/api/admin/display-settings?shop=${shop}`),
    safe(`${API}/api/admin/suggestions?shop=${shop}`),
    safe(`${API}/api/admin/search-settings?shop=${shop}`),
  ]);

  const mergedSettings = {
    ...(settings || {}),
    ...(typoSuggestionSettings || {}),
  };

  return {
    shop,
    settings: {
      placeholder: "",
      searchType: "semantic",
      defaultSort: "created-descending",
      typoTolerance: true,
      typoSuggestionsEnabled: true,
      typoSuggestionsAiEnabled: true,
      stopWords:
        "a, an, and, are, as, at, be, but, by, for, if, in, into, is, it, no, not, of, on, or, such, that, the",
      ...mergedSettings,
    },
    searchOptions: searchOptions || {
      searchInTitle: false,
      searchInDescription: false,
      searchInTags: true,
      searchInVendor: false,
      searchInCollections: false,
      searchInVariants: false,
      searchInMetafields: false,
      colorMetafieldKey: "custom.color",
    },
    aiSettings: aiSettings || {
      geminiEnabled: false,
      geminiModel: "llama-3.1-8b-instant",
    },
    trendingSettings: trendingSettings || {
      analyticsWindowDays: 30,
      maxTrendingProducts: 6,
    },
    synonyms: Array.isArray(synonyms) ? synonyms : [],
    synonymSuggestions: Array.isArray(synonymSuggestions) ? synonymSuggestions : [],
    performance: performance || {
      searchVolume: 0,
      conversionRate: "0%",
      noResultsRate: "0%",
    },
    excludedProducts: Array.isArray(excludedProducts) ? excludedProducts : [],
    displaySettings: normalizeDisplaySettings(displaySettings),
    adminSuggestions: Array.isArray(adminSuggestions) ? adminSuggestions : [],
  };
};

// ─── Shopify Admin GraphQL helpers: title → numeric ID ───────────────────────
async function lookupProductId(admin, title) {
  try {
    const res = await admin.graphql(
      `#graphql
      query GetProduct($q: String!) {
        products(first: 1, query: $q) {
          edges { node { id title } }
        }
      }`,
      { variables: { q: `title:${title}` } }
    );
    const json = await res.json();
    const node = json.data?.products?.edges?.[0]?.node;
    return node ? node.id.split("/").pop() : null;
  } catch {
    return null;
  }
}

async function lookupCollectionId(admin, title) {
  try {
    const res = await admin.graphql(
      `#graphql
      query GetCollection($q: String!) {
        collections(first: 1, query: $q) {
          edges { node { id title } }
        }
      }`,
      { variables: { q: `title:${title}` } }
    );
    const json = await res.json();
    const node = json.data?.collections?.edges?.[0]?.node;
    return node ? node.id.split("/").pop() : null;
  } catch {
    return null;
  }
}

function normalizeDisplaySettings(settings) {
  const showSuggestions = settings?.showSuggestions === true;
  return {
    showSuggestions,
    showTrendingCollections: settings?.showTrendingCollections === false ? false : !showSuggestions,
  };
}

// ─── Action: all PUT / POST / DELETE intents ──────────────────────────────────
export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  const call = async (method, path, body = {}) => {
    try {
      const res = await fetch(`${API}${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, ...body }),
      });
      return { ok: res.ok, intent };
    } catch {
      return { ok: false, intent };
    }
  };

  switch (intent) {
    // ── Main settings ─────────────────────────────────────────────────────
    case "save-settings":
      return call("PUT", "/api/settings", {
      placeholder: formData.get("placeholder"),
      searchType: formData.get("searchType"),
      defaultSort: formData.get("defaultSort"),
      typoTolerance: formData.get("typoTolerance") === "true",
      querySuggestions: formData.get("querySuggestions") === "true",
      typoSuggestionsEnabled: formData.get("typoSuggestionsEnabled") === "true",
      typoSuggestionsAiEnabled: formData.get("typoSuggestionsAiEnabled") === "true",
      stopWords: formData.get("stopWords"),
      });

    case "save-typo-suggestions":
      return call("PUT", "/api/admin/search-settings", {
        typoSuggestionsEnabled: formData.get("typoSuggestionsEnabled") === "true",
        typoSuggestionsAiEnabled: formData.get("typoSuggestionsAiEnabled") === "true",
      });

    case "reset-settings":
      return call("POST", "/api/settings/reset");

    // ── Search field toggles ──────────────────────────────────────────────
    case "save-search-options":
      return call("PUT", "/api/admin/search-options", {
        searchInTitle: formData.get("searchInTitle") === "true",
        searchInDescription: formData.get("searchInDescription") === "true",
        searchInTags: formData.get("searchInTags") === "true",
        searchInVendor: formData.get("searchInVendor") === "true",
        searchInCollections: formData.get("searchInCollections") === "true",
        searchInVariants: formData.get("searchInVariants") === "true",
        searchInMetafields: formData.get("searchInMetafields") === "true",
        colorMetafieldKey: formData.get("colorMetafieldKey") || "custom.color",
      });

    // ── AI (Groq) settings ────────────────────────────────────────────────
    case "save-ai-settings":
      return call("PUT", "/api/admin/ai-settings", {
        geminiEnabled: formData.get("groqEnabled") === "true",
        geminiModel: "llama-3.3-70b-versatile",
      });

    // ── Trending settings ─────────────────────────────────────────────────
    case "save-trending-settings":
      return call("PUT", "/api/admin/trending-settings", {
        analyticsWindowDays: Number(formData.get("analyticsWindowDays")),
        maxTrendingProducts: Number(formData.get("maxTrendingProducts")),
      });

    // ── Product pins — title → Shopify lookup → productId ─────────────────
    case "pin-product": {
      const title = formData.get("productTitle");
      const productId = await lookupProductId(admin, title);
      if (!productId) return { ok: false, intent, error: `Product "${title}" not found` };
      return call("POST", "/api/admin/trending/pin-product", { productId });
    }
    case "unpin-product": {
      const title = formData.get("productTitle");
      const productId = await lookupProductId(admin, title);
      if (!productId) return { ok: false, intent, error: `Product "${title}" not found` };
      return call("DELETE", "/api/admin/trending/pin-product", { productId });
    }

    // ── Collection pins — title → Shopify lookup → collectionId ──────────
    case "pin-collection": {
      const title = formData.get("collectionTitle");
      const collectionId = await lookupCollectionId(admin, title);
      if (!collectionId) return { ok: false, intent, error: `Collection "${title}" not found` };
      return call("POST", "/api/admin/trending/pin-collection", { collectionId });
    }
    case "unpin-collection": {
      const title = formData.get("collectionTitle");
      const collectionId = await lookupCollectionId(admin, title);
      if (!collectionId) return { ok: false, intent, error: `Collection "${title}" not found` };
      return call("DELETE", "/api/admin/trending/pin-collection", { collectionId });
    }

    // ── Brand pins — already use name, no lookup needed ───────────────────
    case "pin-brand":
      return call("POST", "/api/admin/trending/pin-brand", { brandName: formData.get("brandName") });
    case "unpin-brand":
      return call("DELETE", "/api/admin/trending/pin-brand", { brandName: formData.get("brandName") });
    case "clear-pins":
      return call("POST", "/api/admin/trending/clear-pins");

    // ── Exclude — title → lookup; restore uses id from the excluded list ──
    case "exclude-product": {
      const title = formData.get("productTitle");
      const productId = await lookupProductId(admin, title);
      if (!productId) return { ok: false, intent, error: `Product "${title}" not found` };
      return call("POST", "/api/admin/trending/exclude-product", { productId });
    }
    case "restore-product":
      return call("DELETE", "/api/admin/trending/exclude-product", { productId: formData.get("productId") });
    case "clear-excluded":
      return call("POST", "/api/admin/trending/clear-excluded");

    // ── Synonyms ──────────────────────────────────────────────────────────
    case "add-synonym":
      return call("POST", "/api/admin/synonyms", {
        query: formData.get("query"),
        synonymWords: formData
          .get("synonymWords")
          .split(",")
          .map((w) => w.trim())
          .filter(Boolean),
      });

    case "delete-synonym":
      return call("DELETE", `/api/admin/synonyms/${formData.get("id")}`);

    case "update-synonym":
      return call("PUT", `/api/admin/synonyms/${formData.get("id")}`, {
        query: formData.get("query"),
        synonymWords: formData
          .get("synonymWords")
          .split(",")
          .map((w) => w.trim())
          .filter(Boolean),
      });

    case "add-synonym-word":
      return call("POST", `/api/admin/synonyms/${formData.get("id")}/add-word`, {
        word: formData.get("word"),
      });

    case "remove-synonym-word":
      return call("DELETE", `/api/admin/synonyms/${formData.get("id")}/remove-word`, {
        word: formData.get("word"),
      });

    case "auto-detect-synonyms":
      return call("POST", "/api/admin/synonyms/auto-detect", {
        threshold: Number(formData.get("threshold") || 5),
        days: Number(formData.get("days") || 30),
        autoSave: formData.get("autoSave") === "true",
      });

    // ── Display settings ──────────────────────────────────────────────────
    case "save-display-settings":
      return call("PUT", "/api/admin/display-settings", {
        showTrendingCollections: formData.get("showTrendingCollections") === "true",
        showSuggestions: formData.get("showSuggestions") === "true",
      });

    // ── Suggestions ───────────────────────────────────────────────────────
    case "add-suggestion":
      return call("POST", "/api/admin/suggestions", {
        text: formData.get("text"),
      });

    case "delete-suggestion":
      return call("DELETE", "/api/admin/suggestions", {
        text: formData.get("text"),
      });

    default:
      return { ok: false, intent: "unknown" };
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function SearchesPage() {
  const {
    settings: s,
    searchOptions: so,
    aiSettings: ai,
    trendingSettings: ts,
    synonyms: initialSynonyms,
    synonymSuggestions,
    performance,
    excludedProducts: initialExcluded,
    displaySettings: ds,
    adminSuggestions: initialAdminSuggestions,
  } = useLoaderData();

  // Main settings
  const placeholder = s.placeholder ?? "";
  const [searchType, setSearchType] = useState(s.searchType ?? "semantic");
  const [defaultSort, setDefaultSort] = useState(normalizeSortValue(s.defaultSort));
  const [typoTolerance, setTypoTolerance] = useState(s.typoTolerance ?? true);
  const initialSuggestionsEnabled = s.typoSuggestionsEnabled ?? s.querySuggestions ?? s.suggestionsEnabled ?? true;
  const [querySuggestions, setQuerySuggestions] = useState(initialSuggestionsEnabled);
  const [typoSuggestionsEnabled, setTypoSuggestionsEnabled] = useState(initialSuggestionsEnabled);
  const [typoSuggestionsAiEnabled, setTypoSuggestionsAiEnabled] = useState(s.typoSuggestionsAiEnabled ?? initialSuggestionsEnabled);
  const [stopWords, setStopWords] = useState(s.stopWords ?? "");

  // Search options
  const [searchInTitle, setSearchInTitle] = useState(so.searchInTitle ?? false);
  const [searchInDescription, setSearchInDescription] = useState(so.searchInDescription ?? false);
  const [searchInTags, setSearchInTags] = useState(so.searchInTags ?? true);
  const [searchInVendor, setSearchInVendor] = useState(so.searchInVendor ?? false);
  const [searchInCollections, setSearchInCollections] = useState(so.searchInCollections ?? false);
  const [searchInVariants, setSearchInVariants] = useState(so.searchInVariants ?? false);
  const [searchInMetafields, setSearchInMetafields] = useState(so.searchInMetafields ?? false);
  const [colorMetafieldKey, setColorMetafieldKey] = useState(so.colorMetafieldKey ?? "custom.color");

  // Groq AI settings
  const [groqEnabled, setGroqEnabled] = useState(ai.geminiEnabled ?? false);

  // Trending settings
  const [analyticsWindowDays, setAnalyticsWindowDays] = useState(
    String(ts.analyticsWindowDays ?? 30)
  );
  const [maxTrendingProducts, setMaxTrendingProducts] = useState(
    String(ts.maxTrendingProducts ?? 6)
  );
  const [pinProduct, setPinProduct] = useState("");
  const [includeProduct, setIncludeProduct] = useState("");
  const [pinCollection, setPinCollection] = useState("");
  const [pinBrand, setPinBrand] = useState("");
  const [excludeProduct, setExcludeProduct] = useState("");
  const [excludedProducts, setExcludedProducts] = useState(initialExcluded);

  // Pinned items — optimistic state (initialized from trending settings if backend returns them)
  const [pinnedProducts, setPinnedProducts] = useState(
    Array.isArray(ts.pinnedProducts) ? ts.pinnedProducts : []
  );
  const [pinnedCollections, setPinnedCollections] = useState(
    Array.isArray(ts.pinnedCollections) ? ts.pinnedCollections : []
  );
  const [pinnedBrands, setPinnedBrands] = useState(
    Array.isArray(ts.pinnedBrands) ? ts.pinnedBrands : []
  );

  // Synonyms
  const [synonyms, setSynonyms] = useState(initialSynonyms);
  const [synonymModalOpen, setSynonymModalOpen] = useState(false);
  const [synonymQuery, setSynonymQuery] = useState("");
  const [synonymWords, setSynonymWords] = useState("");
  const [editingSynonymId, setEditingSynonymId] = useState("");
  const [editingSynonymQuery, setEditingSynonymQuery] = useState("");
  const [editingSynonymWords, setEditingSynonymWords] = useState("");

  // Display settings (mutually exclusive)
  const [showTrendingCollections, setShowTrendingCollections] = useState(ds.showTrendingCollections ?? true);
  const [showSuggestions, setShowSuggestions] = useState(ds.showSuggestions ?? false);

  // Suggestions management
  const [adminSuggestions, setAdminSuggestions] = useState(initialAdminSuggestions);
  const [newSuggestion, setNewSuggestion] = useState("");
  const setUnifiedSuggestions = (value) => {
    setQuerySuggestions(value);
    setTypoSuggestionsEnabled(value);
    setTypoSuggestionsAiEnabled(value);
  };

  // Banner
  const [banner, setBanner] = useState(null);

  // Fetchers — one per section to avoid state collisions
  const settingsFetcher = useFetcher();
  const searchOptionsFetcher = useFetcher();
  const aiSettingsFetcher = useFetcher();
  const trendingSettingsFetcher = useFetcher();
  const trendingActionFetcher = useFetcher();
  const synonymFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const displaySettingsFetcher = useFetcher();
  const suggestionFetcher = useFetcher();
  const typoSuggestionsFetcher = useFetcher();

  const showBanner = useCallback((tone, msg) => {
    setBanner({ tone, msg });
    setTimeout(() => setBanner(null), 4000);
  }, []);

  // Helper: build FormData and submit
  const submit = (fetcher, intent, fields = {}) => {
    const fd = new FormData();
    fd.set("intent", intent);
    Object.entries(fields).forEach(([k, v]) => fd.set(k, String(v)));
    fetcher.submit(fd, { method: "POST" });
  };

  // ── Watch fetchers → show real success / error banner ─────────────────────
  const prevStates = useRef({});
  useEffect(() => {
    const checks = [
      { key: "settings",         fetcher: settingsFetcher,         msg: "Settings saved." },
      { key: "searchOptions",    fetcher: searchOptionsFetcher,    msg: "Search fields saved." },
      { key: "aiSettings",       fetcher: aiSettingsFetcher,       msg: "AI settings saved." },
      { key: "trendingSettings", fetcher: trendingSettingsFetcher, msg: "Trending settings saved." },
      { key: "trendingAction",   fetcher: trendingActionFetcher,   msg: "Done." },
      { key: "synonym",          fetcher: synonymFetcher,          msg: "Synonym saved." },
      { key: "deleteSynonym",    fetcher: deleteFetcher,           msg: "Synonym removed." },
      { key: "displaySettings",  fetcher: displaySettingsFetcher,  msg: "Display settings saved." },
      { key: "suggestion",       fetcher: suggestionFetcher,       msg: "Suggestion updated." },
      { key: "typoSuggestions",  fetcher: typoSuggestionsFetcher,  msg: "Typo suggestions settings saved." },
    ];

    for (const { key, fetcher, msg } of checks) {
      const prev = prevStates.current[key];
      if (prev === "submitting" && fetcher.state === "idle" && fetcher.data != null) {
        if (fetcher.data.ok) {
          showBanner("success", msg);
        } else {
          showBanner(
            "critical",
            fetcher.data.error ||
              "Save failed — could not reach the backend API."
          );
        }
      }
      prevStates.current[key] = fetcher.state;
    }
  }, [
    settingsFetcher.state, settingsFetcher.data,
    searchOptionsFetcher.state, searchOptionsFetcher.data,
    aiSettingsFetcher.state, aiSettingsFetcher.data,
    trendingSettingsFetcher.state, trendingSettingsFetcher.data,
    trendingActionFetcher.state, trendingActionFetcher.data,
    synonymFetcher.state, synonymFetcher.data,
    deleteFetcher.state, deleteFetcher.data,
    displaySettingsFetcher.state, displaySettingsFetcher.data,
    suggestionFetcher.state, suggestionFetcher.data,
    typoSuggestionsFetcher.state, typoSuggestionsFetcher.data,
    showBanner,
  ]);

  // ── Save All — single button saves every section at once ─────────────────
  const isSaving =
    settingsFetcher.state === "submitting" ||
    searchOptionsFetcher.state === "submitting" ||
    aiSettingsFetcher.state === "submitting" ||
    trendingSettingsFetcher.state === "submitting" ||
    displaySettingsFetcher.state === "submitting" ||
    typoSuggestionsFetcher.state === "submitting";

  const handleSaveAll = () => {
    submit(settingsFetcher, "save-settings", {
      placeholder, searchType, defaultSort, typoTolerance, querySuggestions,
      typoSuggestionsEnabled, typoSuggestionsAiEnabled, stopWords,
    });
    submit(searchOptionsFetcher, "save-search-options", {
      searchInTitle, searchInDescription, searchInTags,
      searchInVendor, searchInCollections, searchInVariants,
      searchInMetafields, colorMetafieldKey: colorMetafieldKey || "custom.color",
    });
    submit(aiSettingsFetcher, "save-ai-settings", {
      groqEnabled,
    });
    submit(trendingSettingsFetcher, "save-trending-settings", {
      analyticsWindowDays, maxTrendingProducts,
    });
    submit(displaySettingsFetcher, "save-display-settings", {
      showTrendingCollections,
      showSuggestions,
    });
    submit(typoSuggestionsFetcher, "save-typo-suggestions", {
      typoSuggestionsEnabled,
      typoSuggestionsAiEnabled,
    });
  };

  const handleTrendingAction = (intent, fields = {}) => {
    submit(trendingActionFetcher, intent, fields);
  };

  // ── Pin / Unpin handlers with optimistic UI ────────────────────────────────
  const handlePinProduct = () => {
    if (!pinProduct.trim()) return;
    if (pinnedProducts.length >= 10) {
      showBanner("critical", "Maximum 10 pinned products allowed.");
      return;
    }
    const title = pinProduct.trim();
    setPinnedProducts((prev) => [...prev, { id: `temp-${Date.now()}`, title }]);
    submit(trendingActionFetcher, "pin-product", { productTitle: title });
    setPinProduct("");
  };
  const handleIncludeProduct = () => {
    if (!includeProduct.trim()) return;
    if (pinnedProducts.length >= 10) {
      showBanner("critical", "Maximum 10 included/pinned products allowed.");
      return;
    }
    const title = includeProduct.trim();
    setPinnedProducts((prev) => [...prev, { id: `temp-${Date.now()}`, title }]);
    submit(trendingActionFetcher, "pin-product", { productTitle: title });
    setIncludeProduct("");
    showBanner("success", `"${title}" included in trending.`);
  };
  const handleUnpinProduct = (id, title) => {
    setPinnedProducts((prev) => prev.filter((p) => p.id !== id));
    submit(trendingActionFetcher, "unpin-product", { productTitle: title });
  };

  const handlePinCollection = () => {
    if (!pinCollection.trim()) return;
    if (pinnedCollections.length >= 10) {
      showBanner("critical", "Maximum 10 pinned collections allowed.");
      return;
    }
    const title = pinCollection.trim();
    setPinnedCollections((prev) => [...prev, { id: `temp-${Date.now()}`, title }]);
    submit(trendingActionFetcher, "pin-collection", { collectionTitle: title });
    setPinCollection("");
  };
  const handleUnpinCollection = (id, title) => {
    setPinnedCollections((prev) => prev.filter((c) => c.id !== id));
    submit(trendingActionFetcher, "unpin-collection", { collectionTitle: title });
  };

  const handlePinBrand = () => {
    if (!pinBrand.trim()) return;
    if (pinnedBrands.length >= 10) {
      showBanner("critical", "Maximum 10 pinned brands allowed.");
      return;
    }
    const name = pinBrand.trim();
    setPinnedBrands((prev) => [...prev, { name }]);
    submit(trendingActionFetcher, "pin-brand", { brandName: name });
    setPinBrand("");
  };
  const handleUnpinBrand = (name) => {
    setPinnedBrands((prev) => prev.filter((b) => b.name !== name));
    submit(trendingActionFetcher, "unpin-brand", { brandName: name });
  };

  const handleClearAllPins = () => {
    setPinnedProducts([]);
    setPinnedCollections([]);
    setPinnedBrands([]);
    submit(trendingActionFetcher, "clear-pins");
  };

  const handleExcludeProduct = () => {
    if (!excludeProduct.trim()) return;
    setExcludedProducts((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, title: excludeProduct.trim() },
    ]);
    submit(trendingActionFetcher, "exclude-product", { productTitle: excludeProduct.trim() });
    setExcludeProduct("");
    showBanner("success", `"${excludeProduct.trim()}" excluded from trending.`);
  };

  const handleRestoreProduct = (productId, productTitle) => {
    setExcludedProducts((prev) => prev.filter((p) => p.id !== productId));
    submit(trendingActionFetcher, "restore-product", { productId });
    showBanner("success", `"${productTitle}" restored to trending.`);
  };

  // ── Display settings (mutually exclusive) ─────────────────────────────────
  const handleToggleTrendingCollections = (val) => {
    setShowTrendingCollections(val);
    if (val) setShowSuggestions(false);
  };

  const handleToggleSuggestions = (val) => {
    setShowSuggestions(val);
    if (val) setShowTrendingCollections(false);
  };

  // ── Suggestion handlers ────────────────────────────────────────────────────
  const handleAddSuggestion = () => {
    const text = newSuggestion.trim();
    if (!text) return;
    setAdminSuggestions((prev) => [...prev, text]);
    submit(suggestionFetcher, "add-suggestion", { text });
    setNewSuggestion("");
  };

  const handleDeleteSuggestion = (text) => {
    setAdminSuggestions((prev) => prev.filter((s) => s !== text));
    submit(suggestionFetcher, "delete-suggestion", { text });
  };

  // ── Synonym handlers ───────────────────────────────────────────────────────
  const handleAddSynonym = () => {
    if (!synonymQuery.trim() || !synonymWords.trim()) return;
    const optimistic = {
      id: `temp-${Date.now()}`,
      query: synonymQuery.trim(),
      synonymWords: synonymWords.split(",").map((w) => w.trim()).filter(Boolean),
    };
    setSynonyms((prev) => [...prev, optimistic]);
    submit(synonymFetcher, "add-synonym", {
      query: synonymQuery.trim(),
      synonymWords: synonymWords.trim(),
    });
    setSynonymQuery("");
    setSynonymWords("");
    setSynonymModalOpen(false);
    showBanner("success", `Synonym added: "${optimistic.query}"`);
  };

  const handleDeleteSynonym = (id) => {
    setSynonyms((prev) => prev.filter((syn) => syn.id !== id));
    submit(deleteFetcher, "delete-synonym", { id });
  };

  const startEditSynonym = (syn) => {
    setEditingSynonymId(syn.id);
    setEditingSynonymQuery(syn.query || "");
    setEditingSynonymWords(Array.isArray(syn.synonymWords) ? syn.synonymWords.join(", ") : syn.synonymWords || "");
  };

  const handleUpdateSynonym = () => {
    if (!editingSynonymId || !editingSynonymQuery.trim() || !editingSynonymWords.trim()) return;
    setSynonyms((prev) => prev.map((syn) => (
      syn.id === editingSynonymId
        ? {
          ...syn,
          query: editingSynonymQuery.trim(),
          synonymWords: editingSynonymWords.split(",").map((word) => word.trim()).filter(Boolean),
        }
        : syn
    )));
    submit(synonymFetcher, "update-synonym", {
      id: editingSynonymId,
      query: editingSynonymQuery.trim(),
      synonymWords: editingSynonymWords.trim(),
    });
    setEditingSynonymId("");
    setEditingSynonymQuery("");
    setEditingSynonymWords("");
  };

  return (
    <Page
      title="Search Configuration"
      subtitle="Control how search works across your storefront"
      primaryAction={{
        content: "Save All",
        onAction: handleSaveAll,
        loading: isSaving,
      }}
    >
      <div className="search-config-shell">
      <BlockStack gap="500">

        {/* Banner */}
        {banner && (
          <Banner tone={banner.tone} onDismiss={() => setBanner(null)}>
            {banner.msg}
          </Banner>
        )}

        {/* ── Row 1: Search Behavior | Search Fields ── */}
        <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">

          {/* Search Behavior */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">
                Search Behavior
              </Text>

              <Select
                label="Search Type"
                value={searchType}
                onChange={setSearchType}
                options={[
                  { label: "Semantic (AI Powered)", value: "semantic" },
                  { label: "Full Text Search", value: "fulltext" },
                  { label: "Fuzzy Match", value: "fuzzy" },
                  { label: "Combined (AI + Fuzzy + Full Text)", value: "combined" },
                ]}
                helpText={
                  searchType === "combined"
                    ? "Uses all three engines simultaneously for maximum recall"
                    : undefined
                }
              />

              <Select
                label="Default Sort"
                value={defaultSort}
                onChange={setDefaultSort}
                options={[
                  { label: "Newest Arrivals", value: "created-descending" },
                  { label: "Relevance", value: "relevance" },
                  { label: "Price: Low to High", value: "price-ascending" },
                  { label: "Price: High to Low", value: "price-descending" },
                  { label: "Best Selling", value: "best-selling" },
                ]}
              />

              <Checkbox
                label="Enable Typo Tolerance"
                checked={typoTolerance}
                onChange={setTypoTolerance}
              />

              <Checkbox
                label="Enable AI Search"
                checked={groqEnabled}
                onChange={setGroqEnabled}
                helpText="AI improves query understanding and semantic matching."
              />

              <Checkbox
                label="Suggestions"
                checked={querySuggestions}
                onChange={setUnifiedSuggestions}
                helpText="Show AI typo suggestions and recommendation chips while customers type."
              />
            </BlockStack>
          </Card>

          {/* Search Fields */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">
                Search Fields
              </Text>

              <Text as="p" tone="subdued">
                Choose which product fields are included in search.
              </Text>

              <Checkbox
                label="Search in Title"
                checked={searchInTitle}
                onChange={setSearchInTitle}
              />
              <Checkbox
                label="Search in Description"
                checked={searchInDescription}
                onChange={setSearchInDescription}
              />
              <Checkbox
                label="Search in Tags"
                checked={searchInTags}
                onChange={setSearchInTags}
              />
              <Checkbox
                label="Search in Vendor"
                checked={searchInVendor}
                onChange={setSearchInVendor}
              />
              <Checkbox
                label="Search in Collections"
                checked={searchInCollections}
                onChange={setSearchInCollections}
              />
              <Checkbox
                label="Search in Variants"
                checked={searchInVariants}
                onChange={setSearchInVariants}
              />

              <Divider />

              <Checkbox
                label="Search in Metafields"
                checked={searchInMetafields}
                onChange={setSearchInMetafields}
                helpText="Match products by metafield values (e.g. color, material)"
              />

              {searchInMetafields && (
                <TextField
                  label="Metafield Keys"
                  value={colorMetafieldKey}
                  onChange={setColorMetafieldKey}
                  autoComplete="off"
                  placeholder="custom.color, custom.fabric"
                  helpText="Shopify metafield namespace.key — color queries will match this field"
                />
              )}
            </BlockStack>
          </Card>

        </InlineGrid>

        {/* ── Row 2: Display Settings | Suggestions Management ── */}
        <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">

          {/* Display Settings */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Display Settings</Text>
              <Text as="p" tone="subdued">
                Choose what appears in the Collections slot of the search dropdown.
                Only one option can be active at a time.
              </Text>

              <BlockStack gap="300">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 14px", background: showTrendingCollections ? "#f0faf0" : "#fafafa", borderRadius: "8px", border: `1px solid ${showTrendingCollections ? "#b5e6b5" : "#e6e6e6"}` }}>
                  <div>
                    <Text variant="bodyMd" fontWeight="semibold">Trending Collections</Text>
                    <Text as="p" variant="bodySm" tone="subdued">Show auto-generated trending collections based on analytics</Text>
                  </div>
                  <Checkbox
                    label=""
                    checked={showTrendingCollections}
                    onChange={handleToggleTrendingCollections}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 14px", background: showSuggestions ? "#f0faf0" : "#fafafa", borderRadius: "8px", border: `1px solid ${showSuggestions ? "#b5e6b5" : "#e6e6e6"}` }}>
                  <div>
                    <Text variant="bodyMd" fontWeight="semibold">Suggestions</Text>
                    <Text as="p" variant="bodySm" tone="subdued">Show curated AI / seasonal suggestions instead of collections</Text>
                  </div>
                  <Checkbox
                    label=""
                    checked={showSuggestions}
                    onChange={handleToggleSuggestions}
                  />
                </div>

                {!showTrendingCollections && !showSuggestions && (
                  <Banner tone="warning">
                    Both options are off — the Collections slot will be hidden from the storefront.
                  </Banner>
                )}
              </BlockStack>

            </BlockStack>
          </Card>

          {/* Suggestions Management */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Suggestions</Text>
              <Text as="p" tone="subdued">
                Manage the suggestion chips shown when Suggestions mode is ON.
                These also power the seasonal AI suggestions on the storefront.
              </Text>

              <TextField
                label="New Suggestion"
                value={newSuggestion}
                onChange={setNewSuggestion}
                placeholder="e.g. Summer Sale, New Arrivals"
                autoComplete="off"
                connectedRight={
                  <Button
                    disabled={!newSuggestion.trim()}
                    onClick={handleAddSuggestion}
                    loading={suggestionFetcher.state === "submitting" && suggestionFetcher.formData?.get("intent") === "add-suggestion"}
                  >
                    Add
                  </Button>
                }
              />

              {adminSuggestions.length === 0 ? (
                <Text tone="subdued" as="p">No suggestions added yet.</Text>
              ) : (
                <BlockStack gap="200">
                  {adminSuggestions.map((text, i) => (
                    <Card background="bg-surface-secondary" key={i}>
                      <div style={{ padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Text as="span" variant="bodySm">{text}</Text>
                        <button
                          onClick={() => handleDeleteSuggestion(text)}
                          style={{ border: "none", background: "none", cursor: "pointer", color: "#999", fontSize: "16px", lineHeight: 1, padding: "0 4px" }}
                          title="Remove"
                        >×</button>
                      </div>
                    </Card>
                  ))}
                </BlockStack>
              )}
            </BlockStack>
          </Card>

        </InlineGrid>

        {/* ── Row 3 (was Row 2): Synonyms | Stopwords | Trending Settings ── */}
        <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">

          {/* Synonyms */}
          <Card>
            <BlockStack gap="300">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text variant="headingMd" as="h3">
                  Synonyms
                </Text>
                <Button variant="plain" onClick={() => setSynonymModalOpen(true)}>
                  + Add Synonym
                </Button>
              </div>

              {synonyms.length === 0 ? (
                <Text tone="subdued" as="p">
                  No synonyms defined yet.
                </Text>
              ) : (
                synonyms.map((syn) => (
                  <Card background="bg-surface-secondary" key={syn.id}>
                    <div
                      style={{
                        padding: "10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>
                        {syn.query} →{" "}
                        {Array.isArray(syn.synonymWords)
                          ? syn.synonymWords.join(", ")
                          : syn.synonymWords}
                      </span>
                      <Button size="slim" onClick={() => startEditSynonym(syn)}>
                        Edit
                      </Button>
                      <button
                        onClick={() => handleDeleteSynonym(syn.id)}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "#999",
                          fontSize: "16px",
                          lineHeight: 1,
                          padding: "0 4px",
                        }}
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  </Card>
                ))
              )}

              {editingSynonymId && (
                <Card background="bg-surface-secondary">
                  <Box padding="300">
                    <BlockStack gap="200">
                      <Text variant="headingSm" as="h4">Update synonym</Text>
                      <TextField label="Search term" value={editingSynonymQuery} onChange={setEditingSynonymQuery} autoComplete="off" />
                      <TextField label="Synonyms" value={editingSynonymWords} onChange={setEditingSynonymWords} autoComplete="off" helpText="Comma-separated words" />
                      <InlineStack gap="200">
                        <Button size="slim" variant="primary" onClick={handleUpdateSynonym}>Update</Button>
                        <Button size="slim" onClick={() => setEditingSynonymId("")}>Cancel</Button>
                      </InlineStack>
                    </BlockStack>
                  </Box>
                </Card>
              )}

              {synonymSuggestions.length > 0 && (
                <BlockStack gap="100">
                  <Text tone="subdued" variant="bodySm">
                    Zero-result queries (no synonym yet):
                  </Text>
                  {synonymSuggestions.slice(0, 3).map((sg, i) => (
                    <Card background="bg-surface-secondary" key={i}>
                      <div
                        style={{
                          padding: "8px 10px",
                          fontSize: "12px",
                          color: "#d82c0d",
                        }}
                      >
                        <InlineStack align="space-between" blockAlign="center">
                          <Text as="span" variant="bodySm" tone="critical">&quot;{sg.query}&quot;</Text>
                          <InlineStack gap="200">
                            <Button size="slim" onClick={() => {
                              setSynonymQuery(sg.query || "");
                              setSynonymWords("");
                              setSynonymModalOpen(true);
                            }}>
                              Add
                            </Button>
                            <Button size="slim" variant="plain" onClick={() => showBanner("success", `"${sg.query}" removed from this view.`)}>
                              Remove
                            </Button>
                          </InlineStack>
                        </InlineStack>
                      </div>
                    </Card>
                  ))}
                </BlockStack>
              )}

              <Button variant="plain">
                View all synonyms
              </Button>
            </BlockStack>
          </Card>

          {/* Stopwords */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">
                Stopwords
              </Text>

              <Text as="p" tone="subdued">
                Define words that should be ignored by the search engine.
              </Text>

              <TextField
                label=""
                multiline={10}
                autoComplete="off"
                value={stopWords}
                onChange={setStopWords}
              />
            </BlockStack>
          </Card>

          {/* Trending Settings */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">
                Trending Settings
              </Text>

              <Select
                label="Analytics Window"
                value={analyticsWindowDays}
                onChange={setAnalyticsWindowDays}
                options={[
                  { label: "7 days", value: "7" },
                  { label: "14 days", value: "14" },
                  { label: "30 days", value: "30" },
                  { label: "60 days", value: "60" },
                  { label: "90 days", value: "90" },
                ]}
              />

              <TextField
                label="Max Trending Products"
                type="number"
                value={maxTrendingProducts}
                onChange={setMaxTrendingProducts}
                autoComplete="off"
                min={1}
                max={12}
              />

              <Divider />

              <Text variant="headingSm" as="h4">Include in Trending</Text>

              <TextField
                label="Product Title"
                value={includeProduct}
                onChange={setIncludeProduct}
                autoComplete="off"
                placeholder="e.g. Bestseller Kurta"
                connectedRight={
                  <Button
                    disabled={!includeProduct.trim() || pinnedProducts.length >= 10}
                    onClick={handleIncludeProduct}
                  >
                    Include
                  </Button>
                }
                helpText={`${pinnedProducts.length}/10 trending products included.`}
              />

              {pinnedProducts.length > 0 && (
                <BlockStack gap="200">
                  {pinnedProducts.map((p) => (
                    <Card background="bg-surface-secondary" key={p.id || p.title}>
                      <Box padding="300">
                        <InlineStack align="space-between" blockAlign="center" gap="300">
                          <InlineStack gap="300" blockAlign="center">
                            {productImage(p) ? (
                              <img className="pinned-product-image" src={productImage(p)} alt="" />
                            ) : (
                              <Thumbnail source="" alt="" size="small" />
                            )}
                            <Text as="span" variant="bodySm">{p.title}</Text>
                          </InlineStack>
                          <Button size="slim" tone="critical" variant="plain" onClick={() => handleUnpinProduct(p.id, p.title)}>
                            Remove
                          </Button>
                        </InlineStack>
                      </Box>
                    </Card>
                  ))}
                </BlockStack>
              )}

              <Divider />

              <Text variant="headingSm" as="h4">Exclude from Trending</Text>

              <TextField
                label="Product Title"
                value={excludeProduct}
                onChange={setExcludeProduct}
                autoComplete="off"
                placeholder="e.g. Old Model X"
                connectedRight={
                  <Button
                    disabled={!excludeProduct.trim()}
                    onClick={handleExcludeProduct}
                  >
                    Exclude
                  </Button>
                }
              />

              {/* Excluded products list with Restore */}
              {excludedProducts.length > 0 && (
                <BlockStack gap="200">
                  {excludedProducts.map((p) => (
                    <Card background="bg-surface-secondary" key={p.id}>
                      <div
                        style={{
                          padding: "8px 12px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <InlineStack gap="300" blockAlign="center">
                          {productImage(p) ? (
                            <img className="pinned-product-image" src={productImage(p)} alt="" />
                          ) : (
                            <Thumbnail source="" alt="" size="small" />
                          )}
                          <Text as="span" variant="bodySm">{p.title}</Text>
                        </InlineStack>
                        <Button
                          size="slim"
                          variant="plain"
                          onClick={() => handleRestoreProduct(p.id, p.title)}
                        >
                          Restore
                        </Button>
                      </div>
                    </Card>
                  ))}
                </BlockStack>
              )}

              <Button
                variant="plain"
                tone="critical"
                onClick={() => {
                  setExcludedProducts([]);
                  handleTrendingAction("clear-excluded");
                }}
              >
                Restore All Excluded
              </Button>
            </BlockStack>
          </Card>

        </InlineGrid>

        {/* ── Pinned Items ── */}
        <Card>
          <BlockStack gap="400">

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text variant="headingMd" as="h3">Pinned Items</Text>
              <Button variant="plain" tone="critical" onClick={handleClearAllPins}>
                Clear All Pins
              </Button>
            </div>

            <div className="pinned-collections-brands">
            <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">

              {/* ── Products ── */}
              <BlockStack gap="300">
                <Text variant="headingSm" as="h4">Products</Text>

                <TextField
                  label=""
                  value={pinProduct}
                  onChange={setPinProduct}
                  placeholder="Product title..."
                  autoComplete="off"
                  connectedRight={
                    <Button disabled={!pinProduct.trim()} onClick={handlePinProduct}>
                      Pin
                    </Button>
                  }
                />

                {pinnedProducts.length === 0 ? (
                  <Text tone="subdued" variant="bodySm">No pinned products</Text>
                ) : (
                  pinnedProducts.map((p) => (
                    <Card background="bg-surface-secondary" key={p.id}>
                      <div style={{
                        padding: "10px 12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}>
                        <Text as="span" variant="bodySm">{p.title}</Text>
                        <button
                          onClick={() => handleUnpinProduct(p.id, p.title)}
                          style={{ border: "none", background: "none", cursor: "pointer", color: "#999", fontSize: "16px", lineHeight: 1, padding: "0 4px" }}
                          title="Unpin"
                        >×</button>
                      </div>
                    </Card>
                  ))
                )}
              </BlockStack>

              {/* ── Collections ── */}
              <BlockStack gap="300">
                <Text variant="headingSm" as="h4">Collections</Text>

                <TextField
                  label=""
                  value={pinCollection}
                  onChange={setPinCollection}
                  placeholder="Collection title..."
                  autoComplete="off"
                  connectedRight={
                    <Button disabled={!pinCollection.trim()} onClick={handlePinCollection}>
                      Pin
                    </Button>
                  }
                />

                {pinnedCollections.length === 0 ? (
                  <Text tone="subdued" variant="bodySm">No pinned collections</Text>
                ) : (
                  pinnedCollections.map((c) => (
                    <Card background="bg-surface-secondary" key={c.id}>
                      <div style={{
                        padding: "10px 12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}>
                        <Text as="span" variant="bodySm">{c.title}</Text>
                        <button
                          onClick={() => handleUnpinCollection(c.id, c.title)}
                          style={{ border: "none", background: "none", cursor: "pointer", color: "#999", fontSize: "16px", lineHeight: 1, padding: "0 4px" }}
                          title="Unpin"
                        >×</button>
                      </div>
                    </Card>
                  ))
                )}
              </BlockStack>

              {/* ── Brands ── */}
              <BlockStack gap="300">
                <Text variant="headingSm" as="h4">Brands</Text>

                <TextField
                  label=""
                  value={pinBrand}
                  onChange={setPinBrand}
                  placeholder="Brand name..."
                  autoComplete="off"
                  connectedRight={
                    <Button disabled={!pinBrand.trim()} onClick={handlePinBrand}>
                      Pin
                    </Button>
                  }
                />

                {pinnedBrands.length === 0 ? (
                  <Text tone="subdued" variant="bodySm">No pinned brands</Text>
                ) : (
                  pinnedBrands.map((b) => (
                    <Card background="bg-surface-secondary" key={b.name}>
                      <div style={{
                        padding: "10px 12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}>
                        <Text as="span" variant="bodySm">{b.name}</Text>
                        <button
                          onClick={() => handleUnpinBrand(b.name)}
                          style={{ border: "none", background: "none", cursor: "pointer", color: "#999", fontSize: "16px", lineHeight: 1, padding: "0 4px" }}
                          title="Unpin"
                        >×</button>
                      </div>
                    </Card>
                  ))
                )}
              </BlockStack>

            </InlineGrid>
            </div>
          </BlockStack>
        </Card>

        {/* ── Search Performance Overview ── */}
        <Card>
          <BlockStack gap="400">

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text variant="headingMd" as="h3">
                Search Performance Overview
              </Text>

              <Badge tone="success">
                Active Optimizer
              </Badge>
            </div>

            <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">

              <Card background="bg-surface-secondary">
                <BlockStack gap="100">
                  <Text tone="subdued">SEARCH VOLUME (30D)</Text>
                  <Text variant="heading2xl" as="p">
                    {performance?.searchVolume?.toLocaleString() ?? "—"}
                  </Text>
                </BlockStack>
              </Card>

              <Card background="bg-surface-secondary">
                <BlockStack gap="100">
                  <Text tone="subdued">CONVERSION RATE</Text>
                  <Text variant="heading2xl" as="p">
                    {performance?.conversionRate ?? "—"}
                  </Text>
                </BlockStack>
              </Card>

              <Card background="bg-surface-secondary">
                <BlockStack gap="100">
                  <Text tone="subdued">NO RESULTS RATE</Text>
                  <Text variant="heading2xl" as="p">
                    {performance?.noResultsRate ?? "—"}
                  </Text>
                </BlockStack>
              </Card>

            </InlineGrid>

            <div className="search-performance-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={normalizePerformanceSeries(performance)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="searches" stroke="#008060" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="clicks" stroke="#5c6ac4" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

          </BlockStack>
        </Card>

        <style>{`
          .search-config-shell {
            max-width: 1180px;
            margin: 0 auto;
            width: 100%;
          }
          .pinned-product-image {
            width: 64px;
            height: 64px;
            border-radius: 8px;
            object-fit: cover;
            background: #f1f2f4;
            border: 1px solid #e1e3e5;
          }
          .search-performance-chart {
            height: 260px;
          }
          .pinned-collections-brands > .Polaris-InlineGrid > :first-child {
            display: none;
          }
        `}</style>

        {/* ── Add Synonym Modal ── */}
        <Modal
          open={synonymModalOpen}
          onClose={() => setSynonymModalOpen(false)}
          title="Add Synonym"
          primaryAction={{
            content: "Add",
            onAction: handleAddSynonym,
            disabled: !synonymQuery.trim() || !synonymWords.trim(),
          }}
          secondaryActions={[
            { content: "Cancel", onAction: () => setSynonymModalOpen(false) },
          ]}
        >
          <Modal.Section>
            <FormLayout>
              <TextField
                label="Search Term"
                value={synonymQuery}
                onChange={setSynonymQuery}
                placeholder="e.g. sneakers"
                autoComplete="off"
                helpText="The term a customer might type"
              />
              <TextField
                label="Maps To"
                value={synonymWords}
                onChange={setSynonymWords}
                placeholder="e.g. shoes, trainers"
                autoComplete="off"
                helpText="Comma-separated list of equivalent terms"
              />
            </FormLayout>
          </Modal.Section>
        </Modal>

      </BlockStack>
      </div>
    </Page>
  );
}

function normalizePerformanceSeries(performance) {
  const series = performance?.series || performance?.history || performance?.chart || performance?.data;
  if (Array.isArray(series) && series.length) {
    return series.map((item, index) => ({
      label: item.label || item.date || item.day || `${index + 1}`,
      searches: Number(item.searches || item.searchVolume || item.count || 0),
      clicks: Number(item.clicks || item.productClicks || item.conversions || 0),
    }));
  }

  const volume = Number(performance?.searchVolume || 0);
  const clicks = Math.round(volume * parsePercent(performance?.conversionRate));
  return [
    {label: "W1", searches: Math.round(volume * 0.18), clicks: Math.round(clicks * 0.18)},
    {label: "W2", searches: Math.round(volume * 0.24), clicks: Math.round(clicks * 0.24)},
    {label: "W3", searches: Math.round(volume * 0.26), clicks: Math.round(clicks * 0.26)},
    {label: "W4", searches: Math.round(volume * 0.32), clicks: Math.round(clicks * 0.32)},
  ];
}

function parsePercent(value) {
  const number = Number(String(value || "0").replace("%", ""));
  return Number.isFinite(number) ? number / 100 : 0;
}

function productImage(product) {
  return product?.image || product?.featuredImage || product?.featured_image || product?.media?.[0]?.src || "";
}

function normalizeSortValue(value) {
  const map = {
    newest: "created-descending",
    price_asc: "price-ascending",
    price_desc: "price-descending",
    best_selling: "best-selling",
  };
  return map[value] || value || "created-descending";
}
