/* eslint-disable react/prop-types */
import {useEffect, useState} from "react";
import {Link, useLoaderData} from "react-router";
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  Icon,
  InlineGrid,
  InlineStack,
  Layout,
  Page,
  ProgressBar,
  SkeletonBodyText,
  Text,
} from "@shopify/polaris";
import {RefreshIcon, SearchIcon, SettingsIcon, ViewIcon} from "@shopify/polaris-icons";
import {boundary} from "@shopify/shopify-app-react-router/server";
import {authenticate} from "../shopify.server";

const API = "https://search-app-hcwsn.ondigitalocean.app/backend";
const SYNC_API = import.meta.env.VITE_API_URL || API;

export const loader = async ({request}) => {
  const {session} = await authenticate.admin(request);
  return {shop: session.shop};
};

export default function Index() {
  const {shop} = useLoaderData();
  const [mounted, setMounted] = useState(false);
  const [overview, setOverview] = useState(null);
  const [topSearches, setTopSearches] = useState([]);
  const [selectedSearch, setSelectedSearch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [productVisionEnabled, setProductVisionEnabled] = useState(false);
  const [syncState, setSyncState] = useState({
    products: createSyncStatus(),
    collections: createSyncStatus(),
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setDashboardError("");
        const [overviewRes, searchesRes] = await Promise.all([
          fetch(`${API}/api/analytics/overview?store=${encodeURIComponent(shop)}&days=7`),
          fetch(`${API}/api/analytics/top-searches?store=${encodeURIComponent(shop)}`),
        ]);

        if (!overviewRes.ok || !searchesRes.ok) throw new Error("Could not load dashboard data");

        setOverview(await overviewRes.json());
        setTopSearches((await searchesRes.json()) || []);
      } catch (error) {
        setDashboardError(error.message || "Could not load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [shop]);

  async function runSync(type) {
    const endpoint = type === "products" ? "sync-products" : "sync-collections";
    const includeVision = type === "products" && productVisionEnabled;
    updateSync(type, {
      loading: true,
      progress: 5,
      status: `Starting ${titleFor(type).toLowerCase()} sync...`,
      detail: syncStartDetail(type, includeVision),
      response: "",
      error: "",
      syncedCount: null,
    });

    let progressTimer;
    try {
      const stages = syncStages(type, includeVision);
      progressTimer = window.setInterval(() => {
        setSyncState((current) => ({
          ...current,
          [type]: {
            ...current[type],
            progress: Math.min(current[type].progress + 4, 95),
            status: current[type].syncedCount != null
              ? current[type].status
              : stages[Math.min(stages.length - 1, Math.floor(current[type].progress / 25))],
          },
        }));
      }, 900);

      const response = await fetch(`${SYNC_API}/api/${endpoint}`, {
        method: "POST",
        headers: {"Content-Type": "application/json", Accept: "text/event-stream, application/json, text/plain"},
        body: JSON.stringify({
          shop,
          skipVision: !includeVision,
        }),
      });

      const body = await readLiveResponse(response, (chunk, fullBody, event) => {
        const live = event
          ? liveSyncStatus(type, "", event)
          : liveSyncStatus(type, chunk, fullBody);
        updateSync(type, {
          status: live.status,
          detail: live.detail,
          syncedCount: live.syncedCount,
        });
      });

      if (!response.ok) throw new Error(syncErrorMessage(type, body));

      const summary = syncSummary(type, body, includeVision);

      updateSync(type, {
        loading: false,
        progress: 100,
        status: `${titleFor(type)} sync completed`,
        detail: summary.detail,
        response: summary.message,
      });
    } catch (error) {
      updateSync(type, {
        loading: false,
        progress: 100,
        status: `${titleFor(type)} sync failed`,
        detail: "",
        error: error.message || "Sync failed",
      });
    } finally {
      if (progressTimer) window.clearInterval(progressTimer);
    }
  }

  function updateSync(type, patch) {
    setSyncState((current) => {
      const previous = current[type];
      const response = patch.responseAppend
        ? `${previous.response}${patch.responseAppend}`
        : patch.response ?? previous.response;

      return {
        ...current,
        [type]: {
          ...previous,
          ...patch,
          response,
          responseAppend: undefined,
        },
      };
    });
  }

  if (!mounted) return null;

  return (
    <Page title="Search & Discovery" subtitle="Improve product discovery and keep storefront data fresh">
      <div className="dashboard-shell">
        <BlockStack gap="500">
          {dashboardError ? (
            <Banner tone="critical">
              <Text as="p">{dashboardError}</Text>
            </Banner>
          ) : null}

          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center" gap="300">
                <BlockStack gap="100">
                  <Text as="h2" variant="headingMd">
                    Store overview
                  </Text>
                  <Text as="p" tone="subdued">
                    Metrics from the last 7 days for {shop}.
                  </Text>
                </BlockStack>
                <Badge tone="info">Live store</Badge>
              </InlineStack>

              {loading ? (
                <SkeletonBodyText lines={4} />
              ) : (
                <InlineGrid columns={{xs: 1, sm: 2, md: 4}} gap="400">
                  <MetricCard label="Total searches" value={overview?.totalSearches || 0} trend={overview?.searchGrowth} />
                  <MetricCard label="Avg. results" value={overview?.avgResults || 0} trend={overview?.avgResultsGrowth} />
                  <MetricCard label="CTR" value={`${overview?.ctr || 0}%`} trend={overview?.ctrGrowth} />
                  <MetricCard label="Zero result rate" value={`${overview?.zeroResultRate || 0}%`} trend={overview?.zeroResultGrowth} />
                </InlineGrid>
              )}
            </BlockStack>
          </Card>

          <Layout>
            <Layout.Section>
              <Card padding="0">
                <Box padding="400" borderBlockEndWidth="025" borderColor="border">
                  <InlineStack align="space-between" blockAlign="center">
                    <BlockStack gap="050">
                      <Text as="h2" variant="headingMd">
                        Recent searches
                      </Text>
                      <Text as="p" tone="subdued">
                        Terms customers are using most often.
                      </Text>
                    </BlockStack>
                    <Button url="/app/analytics" variant="plain">
                      View analytics
                    </Button>
                  </InlineStack>
                </Box>

                {loading ? (
                  <Box padding="400">
                    <SkeletonBodyText lines={6} />
                  </Box>
                ) : topSearches.length ? (
                  <BlockStack gap="0">
                    {topSearches.slice(0, 8).map((item, index) => {
                      const isSelected = selectedSearch?.query === item.query;

                      return (
                        <div className="recent-search-item" key={`${item.query}-${index}`}>
                          <button
                            type="button"
                            className="recent-search-row"
                            onClick={() => setSelectedSearch(isSelected ? null : item)}
                          >
                            <Box padding="400" borderBlockEndWidth="025" borderColor="border">
                              <InlineStack align="space-between" blockAlign="center" gap="300">
                                <InlineStack gap="300" blockAlign="center">
                                  <Box width="32px">
                                    <Icon source={SearchIcon} tone="subdued" />
                                  </Box>
                                  <BlockStack gap="050">
                                    <Text as="p" fontWeight="semibold">
                                      {item.query}
                                    </Text>
                                    <Text as="p" tone="subdued">
                                      {item.count} searches
                                    </Text>
                                  </BlockStack>
                                </InlineStack>
                                <Badge tone={isSelected ? "success" : "info"}>{isSelected ? "Open" : "View"}</Badge>
                              </InlineStack>
                            </Box>
                          </button>

                          {isSelected ? (
                            <Box padding="400" background="bg-surface-secondary" borderBlockEndWidth="025" borderColor="border">
                              <BlockStack gap="300">
                                <InlineGrid columns={{xs: 1, sm: 2}} gap="300">
                                  <BlockStack gap="050">
                                    <Text as="p" tone="subdued">
                                      Search term
                                    </Text>
                                    <Text as="p" fontWeight="semibold">
                                      {item.query || "-"}
                                    </Text>
                                  </BlockStack>
                                  <BlockStack gap="050">
                                    <Text as="p" tone="subdued">
                                      Total searches
                                    </Text>
                                    <Text as="p" fontWeight="semibold">
                                      {item.count || 0}
                                    </Text>
                                  </BlockStack>
                                </InlineGrid>
                                <InlineStack gap="200">
                                  <Button
                                    url={`https://${shop}/search?q=${encodeURIComponent(item.query || "")}`}
                                    target="_blank"
                                  >
                                    Open storefront search
                                  </Button>
                                  <Button url="/app/analytics" variant="plain">
                                    View full analytics
                                  </Button>
                                </InlineStack>
                              </BlockStack>
                            </Box>
                          ) : null}
                        </div>
                      );
                    })}
                  </BlockStack>
                ) : (
                  <Box padding="600">
                    <BlockStack gap="100" inlineAlign="center">
                      <Text as="h3" variant="headingMd">
                        No searches yet
                      </Text>
                      <Text as="p" tone="subdued">
                        Search activity will appear here after customers start using storefront search.
                      </Text>
                    </BlockStack>
                  </Box>
                )}
              </Card>

            </Layout.Section>

            <Layout.Section variant="oneThird">
              <BlockStack gap="400">
                <Card>
                  <BlockStack gap="300">
                    <Text as="h2" variant="headingMd">
                      Quick actions
                    </Text>
                    <ButtonGroupLink to="/app/filters" icon={SettingsIcon}>
                      Configure filters
                    </ButtonGroupLink>
                    <ButtonGroupLink to="/app/analytics" icon={ViewIcon}>
                      View analytics
                    </ButtonGroupLink>
                  </BlockStack>
                </Card>

                <SyncCard
                  title="Sync products"
                  description="Update searchable products, variants, pricing, and availability."
                  state={syncState.products}
                  onSync={() => runSync("products")}
                  visionEnabled={productVisionEnabled}
                  onVisionChange={setProductVisionEnabled}
                />

                <SyncCard
                  title="Sync collections"
                  description="Refresh collection data used by filters and category discovery."
                  state={syncState.collections}
                  onSync={() => runSync("collections")}
                />

                <PromoCard />
              </BlockStack>
            </Layout.Section>
          </Layout>
        </BlockStack>
      </div>

      <style>{`
        .dashboard-shell {
          max-width: 1180px;
          margin: 0 auto;
          width: 100%;
        }
        .sync-response {
          border-radius: 8px;
          background: #f0f8f4;
          border: 1px solid #b7e1c5;
          padding: 14px 16px;
        }
        .sync-options {
          border-radius: 8px;
          background: #f6f6f7;
          padding: 12px;
        }
        .action-link {
          text-decoration: none;
        }
        .recent-search-row {
          appearance: none;
          border: 0;
          background: transparent;
          color: inherit;
          display: block;
          padding: 0;
          text-align: left;
          width: 100%;
          cursor: pointer;
        }
        .recent-search-row:hover {
          background: #f6f6f7;
        }
        .recent-search-item:last-child .recent-search-row > .Polaris-Box {
          border-block-end-width: 0;
        }
        .promo-card {
          min-height: 160px;
          overflow: hidden;
          border-radius: 8px;
          background-image: linear-gradient(to top, rgba(16, 72, 47, 0.62), rgba(16, 72, 47, 0.18)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuDdRt4EsAXps7r37kOr3PjuPr1-MzN1BZOtx8JjJBg6Tp-uR13zLSYBsnzQYc3SZdnT-LAK47kx5eQYH5f1h5USTQUhuYXUfkQz7ncz1GXx8WfhU5XinUVjBm3S9xk33Ao4N5ntFL-zl0j7i8oBgCr6SXu4fPU7pcpu_7Zet9MaB8XO_Ffqq001DIE9SpBi9Fi1U2x9T4PmdfnR9gSZQsUy5d3e1KWlvJme1E5kxRbv5HMoIB3SPKWseS7fd6KL2Afx6phGdmPAzPue');
          background-position: center;
          background-size: cover;
          display: flex;
          align-items: flex-end;
          padding: 24px;
        }
      `}</style>
    </Page>
  );
}

function PromoCard() {
  return (
    <div className="promo-card">
      <BlockStack gap="200">
        <Text as="h2" variant="headingLg" tone="text-inverse">
          New! Search Synonyms
        </Text>
        <Text as="p" tone="text-inverse">
          Improve results for related terms automatically.
        </Text>
      </BlockStack>
    </div>
  );
}

function MetricCard({label, value, trend}) {
  const trendText = trend || "0%";
  const trendTone = String(trendText).includes("-") ? "critical" : "success";

  return (
    <Card background="bg-surface-secondary">
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="p" tone="subdued">
            {label}
          </Text>
          <Badge tone={trendTone}>{trendText}</Badge>
        </InlineStack>
        <Text as="p" variant="heading2xl">
          {value}
        </Text>
      </BlockStack>
    </Card>
  );
}

function SyncCard({title, description, state, onSync, visionEnabled, onVisionChange}) {
  const showVisionToggle = typeof visionEnabled === "boolean" && onVisionChange;

  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="start" gap="300">
          <BlockStack gap="100">
            <Text as="h2" variant="headingMd">
              {title}
            </Text>
            <Text as="p" tone="subdued">
              {description}
            </Text>
          </BlockStack>
          <Button icon={RefreshIcon} loading={state.loading} disabled={state.loading} onClick={onSync}>
            Sync
          </Button>
        </InlineStack>

        {showVisionToggle ? (
          <div className="sync-options">
            <BlockStack gap="200">
            <Checkbox
              label="Run Vision analysis with products sync"
              checked={visionEnabled}
              disabled={state.loading}
              onChange={onVisionChange}
              helpText="Keep this off for normal product sync. Turn it on only when image/visual attributes need to be refreshed."
            />
            </BlockStack>
          </div>
        ) : null}

        {state.loading || state.status ? (
          <BlockStack gap="200">
            <ProgressBar progress={state.progress} tone={state.error ? "critical" : "primary"} size="small" />
            <InlineStack align="space-between" blockAlign="center">
              <Text as="p" tone={state.error ? "critical" : "subdued"}>
                {state.error || state.status}
              </Text>
              <Text as="p" tone="subdued">
                {state.progress}%
              </Text>
            </InlineStack>
            {state.detail ? (
              <Text as="p" variant="bodySm" tone="subdued">
                {state.detail}
              </Text>
            ) : null}
          </BlockStack>
        ) : null}

        {state.response ? (
          <Box className="sync-response">
            <Text as="p" variant="bodyMd" tone="success">
              {state.response}
            </Text>
          </Box>
        ) : null}
      </BlockStack>
    </Card>
  );
}

function ButtonGroupLink({to, icon, children}) {
  return (
    <Link className="action-link" to={to}>
      <Button fullWidth icon={icon}>
        {children}
      </Button>
    </Link>
  );
}

function createSyncStatus() {
  return {
    loading: false,
    progress: 0,
    status: "",
    detail: "",
    syncedCount: null,
    response: "",
    error: "",
  };
}

function titleFor(type) {
  return type === "products" ? "Products" : "Collections";
}

async function readLiveResponse(response, onChunk) {
  if (!response.body || !response.body.getReader) {
    const body = await response.text();
    onChunk(body, body);
    return body;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let pending = "";

  let reading = true;
  while (reading) {
    const {value, done} = await reader.read();
    if (done) {
      reading = false;
      continue;
    }
    const chunk = decoder.decode(value, {stream: true});
    body += chunk;
    onChunk(chunk, body);
    pending += chunk;
    pending = emitSseEvents(pending, function(event){
      onChunk("", body, event);
    });
  }

  const tail = decoder.decode();
  if(tail){
    body += tail;
    pending += tail;
    pending = emitSseEvents(pending, function(event){
      onChunk("", body, event);
    });
  }
  return body;
}

function emitSseEvents(buffer, onEvent) {
  const parts = String(buffer).split(/\r?\n\r?\n/);
  const rest = parts.pop() || "";
  parts.forEach((part) => {
    part.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*data:\s*(.+)$/);
      if (!match) return;
      try {
        const event = JSON.parse(match[1]);
        if (event && typeof event === "object") onEvent(event);
      } catch {
        return;
      }
    });
  });
  return rest;
}

function syncStages(type, includeVision = false) {
  if (type === "products") {
    return includeVision
      ? [
          "Preparing product sync with Vision...",
          "Fetching products from Shopify...",
          "Analyzing product images...",
          "Updating searchable product index...",
          "Finalizing product sync...",
        ]
      : [
          "Preparing product sync...",
          "Fetching products from Shopify...",
          "Updating searchable product index...",
          "Refreshing product filters...",
          "Finalizing product sync...",
        ];
  }

  return [
    "Preparing collection sync...",
    "Fetching collections from Shopify...",
    "Updating collection index...",
    "Refreshing collection filters...",
    "Finalizing collection sync...",
  ];
}

function syncStartDetail(type, includeVision = false) {
  if (type === "products" && includeVision) {
    return "Vision is enabled, so this sync can take longer while product images are analyzed.";
  }

  if (type === "products") {
    return "Products sync is running in backend batches. Synced count will update here as data arrives.";
  }

  return `Syncing ${titleFor(type).toLowerCase()} data from Shopify to the search backend.`;
}

function liveSyncStatus(type, chunk = "", fullBody = "") {
  const text = String(chunk).toLowerCase();
  const stats = syncStats(fullBody || chunk, type);
  const synced = stats.synced;

  if (type === "products" && synced != null) {
    const indexedText = stats.indexed != null ? `, ${stats.indexed.toLocaleString()} indexed` : "";
    const totalText = stats.total != null ? ` of ${stats.total.toLocaleString()} total` : "";
    return {
      status: `Syncing products... ${synced.toLocaleString()} synced${indexedText}`,
      detail: `${synced.toLocaleString()} products synced${stats.indexed != null ? `, ${stats.indexed.toLocaleString()} indexed` : ""}${totalText}.`,
      syncedCount: synced,
    };
  }

  if (type === "collections" && synced != null) {
    return {
      status: `Syncing collections... ${synced.toLocaleString()} synced`,
      detail: `${synced.toLocaleString()} collections have been synced so far.`,
      syncedCount: synced,
    };
  }

  if (text.includes("collection")) {
    return {status: "Syncing collections...", detail: "Backend is updating collection data.", syncedCount: null};
  }
  if (text.includes("vision") || text.includes("image")) {
    return {status: "Running Vision analysis...", detail: "Backend is analyzing product images.", syncedCount: null};
  }
  if (text.includes("product")) {
    return {status: "Syncing products...", detail: "Backend is updating product data.", syncedCount: null};
  }
  return {
    status: `Syncing ${titleFor(type).toLowerCase()}...`,
    detail: "Backend is still working. Keep this page open until the sync finishes.",
    syncedCount: null,
  };
}

function syncSummary(type, body, includeVision = false) {
  const stats = syncStats(body, type);
  const count = stats.synced;
  const label = titleFor(type);
  const totalText = count != null ? count.toLocaleString() : "";
  const hasProductStats = stats.synced != null || stats.indexed != null || stats.total != null;
  const message = type === "products"
    ? (hasProductStats
      ? productSyncMessage(stats)
      : `Products synced successfully.`)
    : (count != null
      ? `Total number of ${totalText} ${label} synced successfully.`
      : `${label} synced successfully.`);

  return {
    message,
    detail: type === "products" && includeVision
      ? "Products sync completed with Vision analysis enabled."
      : type === "products"
        ? "Products sync completed and the search backend is up to date."
        : `${label} sync completed and the search backend is up to date.`,
  };
}

function productSyncMessage(stats) {
  const parts = [];
  if (stats.synced != null) parts.push(`${stats.synced.toLocaleString()} synced`);
  if (stats.indexed != null) parts.push(`${stats.indexed.toLocaleString()} indexed`);
  if (stats.total != null) parts.push(`${stats.total.toLocaleString()} total products`);
  return `Products sync completed: ${parts.join(", ")}.`;
}

function syncErrorMessage(type, body) {
  if (typeof body === "string") {
    const errorEvent = parseSseEvents(body).find((event) => event.type === "error");
    if (errorEvent) return errorEvent.message || `${titleFor(type)} sync failed`;
  }
  const data = parseSyncPayload(body);
  if (data && typeof data === "object") {
    return data.error || data.message || `${titleFor(type)} sync failed`;
  }

  return body || `${titleFor(type)} sync failed`;
}

function syncStats(data, type) {
  var empty = {synced: null, indexed: null, total: null};
  if (!data) return empty;
  if (typeof data === "string") {
    const events = parseSseEvents(data);
    if (events.length) return statsFromSseEvents(events, type);
    return {
      synced: latestNumber(data, /SYNCED:\s*([0-9,]+)/gi),
      indexed: latestNumber(data, /INDEXED:\s*([0-9,]+)/gi),
      total: latestNumber(data, /(?:TOTAL(?:\s+PRODUCTS)?|PRODUCTS\s+TOTAL):\s*([0-9,]+)/gi),
    };
  }
  if (typeof data !== "object") return empty;
  if (data.type === "done") {
    const doneTotal = numericOrNull(data.total ?? data.synced ?? data.count);
    return {
      synced: type === "products" ? doneTotal : (numericOrNull(data.synced ?? data.count) ?? doneTotal),
      indexed: numericOrNull(data.indexed ?? data.indexedCount),
      total: type === "products" ? doneTotal : numericOrNull(data.total),
    };
  }
  if (data.type === "progress") {
    return {
      synced: numericOrNull(data.synced ?? data.total ?? data.count),
      indexed: numericOrNull(data.indexed ?? data.indexedCount),
      total: null,
    };
  }
  const synced = type === "products"
    ? (
        data.synced ??
        data.productsSynced ??
        data.batchSynced ??
        data.processed ??
        data.syncedCount
      )
    : (
        data.synced ??
        data.collectionsSynced ??
        data.totalSynced ??
        data.count ??
        data.total
      );
  const indexed = data.indexed ?? data.productsIndexed ?? data.indexedProducts ?? data.indexedCount ?? data.totalIndexed;
  const total = type === "products"
    ? (data.totalProducts ?? data.productsTotal ?? data.total ?? data.count)
    : (data.totalCollections ?? data.collectionsTotal ?? data.total ?? data.count);
  return {
    synced: numericOrNull(synced),
    indexed: numericOrNull(indexed),
    total: numericOrNull(total),
  };
}

function latestNumber(value, regex) {
  const matches = [...String(value).matchAll(regex)];
  if (!matches.length) return null;
  return numericOrNull(matches[matches.length - 1][1]);
}

function numericOrNull(value) {
  if (value == null || value === "") return null;
  const number = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(number) ? number : null;
}

function parseSseEvents(value) {
  const events = [];
  String(value)
    .split(/\r?\n/)
    .forEach((line) => {
      const match = line.match(/^\s*data:\s*(.+)$/);
      if (!match) return;
      try {
        const event = JSON.parse(match[1]);
        if (event && typeof event === "object") events.push(event);
      } catch {
        return;
      }
    });
  return events;
}

function statsFromSseEvents(events, type) {
  const stats = {synced: null, indexed: null, total: null};
  events.forEach((event) => {
    if (event.type === "progress") {
      stats.synced = numericOrNull(event.synced ?? event.total ?? event.count) ?? stats.synced;
      stats.indexed = numericOrNull(event.indexed ?? event.indexedCount) ?? stats.indexed;
    }
    if (event.type === "done") {
      const doneTotal = numericOrNull(event.total ?? event.synced ?? event.count);
      if (type === "products") {
        stats.synced = doneTotal ?? stats.synced;
        stats.total = doneTotal ?? stats.total;
      } else {
        stats.synced = doneTotal ?? stats.synced;
      }
      stats.indexed = numericOrNull(event.indexed ?? event.indexedCount) ?? stats.indexed;
    }
  });
  return stats;
}

function parseSyncPayload(value) {
  if (!value) return "";
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    const jsonMatch = value.match(/\{[\s\S]*\}\s*$/);
    if (!jsonMatch) return value;
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return value;
    }
  }
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
