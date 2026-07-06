/* eslint-disable react/prop-types */
import {useEffect, useMemo, useState} from "react";
import {useLoaderData} from "react-router";
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  EmptySearchResult,
  IndexTable,
  InlineGrid,
  InlineStack,
  Page,
  ProgressBar,
  SkeletonBodyText,
  Tabs,
  Text,
} from "@shopify/polaris";
import {CheckIcon} from "@shopify/polaris-icons";
import {boundary} from "@shopify/shopify-app-react-router/server";
import {authenticate} from "../shopify.server";

const API = import.meta.env.VITE_API_URL || "https://search-app-hcwsn.ondigitalocean.app";

export const loader = async ({request}) => {
  const {session} = await authenticate.admin(request);
  return {shop: session.shop};
};

export default function AnalyticsPage() {
  const {shop} = useLoaderData();
  const [selectedTab, setSelectedTab] = useState(0);
  const [days, setDays] = useState(7);
  const [overview, setOverview] = useState(null);
  const [topSearches, setTopSearches] = useState([]);
  const [zeroSearches, setZeroSearches] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [deviceSplit, setDeviceSplit] = useState([]);
  const [recommendation, setRecommendation] = useState("");
  const [recommendationApplied, setRecommendationApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");

        const [overviewData, searchesData, zeroData, trendingData, deviceData, recommendationData] = await Promise.all([
          fetchJson(`${API}/api/analytics/overview?store=${encodeURIComponent(shop)}&days=${days}`, {}),
          fetchJson(`${API}/api/analytics/top-searches?store=${encodeURIComponent(shop)}&days=${days}`, []),
          fetchJson(`${API}/api/analytics/zero-results?store=${encodeURIComponent(shop)}&days=${days}`, []),
          fetchJson(`${API}/api/analytics/trending?store=${encodeURIComponent(shop)}&days=${days}`, []),
          fetchJson(`${API}/api/analytics/device-split?store=${encodeURIComponent(shop)}&days=${days}`, []),
          fetchJson(`${API}/api/analytics/recommendation?store=${encodeURIComponent(shop)}`, {}),
        ]);

        const normalizedTop = normalizeSearchRows(searchesData);
        const normalizedZero = normalizeSearchRows(zeroData);
        const normalizedTrending = normalizeSearchRows(trendingData);

        setOverview(normalizeOverview(overviewData, normalizedTop));
        setTopSearches(normalizedTop);
        setZeroSearches(normalizedZero);
        setTrendingSearches(normalizedTrending);
        setRecommendation(recommendationData?.message || "Review zero-result searches and add synonyms for high-intent terms.");
        setDeviceSplit(Array.isArray(deviceData) ? deviceData : deviceData?.data || []);
      } catch (err) {
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [days, shop]);

  const tabs = [
    {id: "top-searches", content: "Top Searches"},
    {id: "zero-results", content: "Zero Results"},
    {id: "trending", content: "Trending"},
  ];

  const visibleSearches = useMemo(() => {
    if (selectedTab === 1) {
      if (zeroSearches.length) return zeroSearches;
      return topSearches.filter((item) => item.zeroResults || Number(item.results || 0) === 0 || Number(item.ctr || 0) === 0);
    }

    if (selectedTab === 2) {
      if (trendingSearches.length) return trendingSearches;
      return [...topSearches]
        .sort((a, b) => Number(b.count || 0) - Number(a.count || 0));
    }

    return topSearches;
  }, [selectedTab, topSearches, trendingSearches, zeroSearches]);

  const tableTitle = tabs[selectedTab].content;
  const normalizedDevices = normalizeDeviceSplit(deviceSplit);

  function applyRecommendation() {
    setRecommendationApplied(true);
    window.setTimeout(() => setRecommendationApplied(false), 2600);
  }

  return (
    <Page title="Search Analytics" subtitle="Understand what customers search, where results fail, and which terms are gaining traction">
      <div className="analytics-shell">
        <BlockStack gap="500">
          {error ? (
            <Banner tone="critical">
              <Text as="p">{error}</Text>
            </Banner>
          ) : null}

          {recommendationApplied ? (
            <Banner tone="success" icon={CheckIcon}>
              <Text as="p">Recommendation applied done.</Text>
            </Banner>
          ) : null}

          <Card>
            <InlineStack align="space-between" blockAlign="center" gap="400">
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">
                  Analytics overview
                </Text>
                <Text as="p" tone="subdued">
                  Showing the last {days} days for {shop}.
                </Text>
              </BlockStack>
              <InlineStack gap="200">
                {[7, 30, 90].map((item) => (
                  <Button key={item} pressed={days === item} onClick={() => setDays(item)}>
                    {item} days
                  </Button>
                ))}
              </InlineStack>
            </InlineStack>
          </Card>

          {loading ? (
            <Card>
              <SkeletonBodyText lines={10} />
            </Card>
          ) : (
            <>
              <InlineGrid columns={{xs: 1, sm: 3}} gap="400">
                <MetricCard
                  label="Total searches"
                  value={overview?.totalSearches || 0}
                  trend={overview?.searchGrowth}
                  progress={Math.min(Number(overview?.totalSearches || 0) / 10, 100)}
                />
                <MetricCard
                  label="Zero result rate"
                  value={`${overview?.zeroResultRate || 0}%`}
                  trend={overview?.zeroResultGrowth}
                  progress={Number(overview?.zeroResultRate || 0)}
                  critical
                />
                <MetricCard
                  label="Searches with clicks"
                  value={`${overview?.ctr || 0}%`}
                  trend={overview?.ctrGrowth}
                  progress={Number(overview?.ctr || 0)}
                />
              </InlineGrid>

              <InlineGrid columns={{xs: 1, md: "2fr 1fr"}} gap="500">
                <Card padding="0">
                  <Box padding="400" borderBlockEndWidth="025" borderColor="border">
                    <InlineStack align="space-between" blockAlign="center" gap="300">
                      <BlockStack gap="050">
                        <Text as="h2" variant="headingMd">
                          {tableTitle}
                        </Text>
                        <Text as="p" tone="subdued">
                          {copyForTab(selectedTab)}
                        </Text>
                      </BlockStack>
                      <Badge tone="info">{visibleSearches.length} rows</Badge>
                    </InlineStack>
                  </Box>

                  <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab} fitted />

                  <SearchTable searches={visibleSearches} />
                </Card>

                <BlockStack gap="400">
                  <RecommendationCard
                    recommendation={recommendation}
                    applied={recommendationApplied}
                    onApply={applyRecommendation}
                  />
                  <DeviceSplitCard devices={normalizedDevices} />
                  <ProTipCard />
                </BlockStack>
              </InlineGrid>
            </>
          )}
        </BlockStack>
      </div>

      <style>{`
        .analytics-shell {
          max-width: 1180px;
          margin: 0 auto;
          width: 100%;
        }
        .analytics-protip {
          min-height: 180px;
          border-radius: 8px;
          overflow: hidden;
          background-image: linear-gradient(to top, rgba(0,0,0,.58), rgba(0,0,0,.16)), url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop');
          background-position: center;
          background-size: cover;
          display: flex;
          align-items: flex-end;
          padding: 20px;
        }
        .device-circles {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        .device-circle {
          display: grid;
          justify-items: center;
          gap: 8px;
          min-width: 0;
        }
        .device-ring {
          --device-color: #008060;
          --device-value: 0%;
          width: 78px;
          aspect-ratio: 1;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: conic-gradient(var(--device-color) var(--device-value), #e3e3e3 0);
          position: relative;
        }
        .device-ring::before {
          content: "";
          position: absolute;
          inset: 8px;
          border-radius: inherit;
          background: #fff;
        }
        .device-ring-value {
          position: relative;
          z-index: 1;
          font-weight: 650;
          color: #202223;
          font-size: 13px;
        }
        @media (max-width: 640px) {
          .device-circles {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Page>
  );
}

function MetricCard({label, value, trend, progress, critical}) {
  const trendText = trend || "0%";
  const trendTone = String(trendText).includes("-") ? (critical ? "success" : "critical") : critical ? "critical" : "success";

  return (
    <Card>
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
        <ProgressBar progress={Math.max(0, Math.min(Number(progress || 0), 100))} tone={critical ? "critical" : "primary"} size="small" />
      </BlockStack>
    </Card>
  );
}

function SearchTable({searches}) {
  if (!searches.length) {
    return (
      <Box padding="600">
        <EmptySearchResult title="No analytics data found" description="Try another date range or tab." withIllustration />
      </Box>
    );
  }

  return (
    <IndexTable
      resourceName={{singular: "search", plural: "searches"}}
      itemCount={searches.length}
      selectable={false}
      headings={[
        {title: "Rank"},
        {title: "Query"},
        {title: "Searches"},
        {title: "CTR"},
        {title: "Avg. position"},
      ]}
    >
      {searches.map((item, index) => (
        <IndexTable.Row id={`${item.query}-${index}`} key={`${item.query}-${index}`} position={index}>
          <IndexTable.Cell>
            <Badge>{index + 1}</Badge>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text as="span" fontWeight="semibold">
              {item.query || "-"}
            </Text>
          </IndexTable.Cell>
          <IndexTable.Cell>{item.count || 0}</IndexTable.Cell>
          <IndexTable.Cell>{item.ctr || 0}%</IndexTable.Cell>
          <IndexTable.Cell>{item.avgPosition || 0}</IndexTable.Cell>
        </IndexTable.Row>
      ))}
    </IndexTable>
  );
}

function RecommendationCard({recommendation, applied, onApply}) {
  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h2" variant="headingMd">
            Recommendation
          </Text>
          {applied ? <Badge tone="success">Done</Badge> : null}
        </InlineStack>
        <Text as="p" tone="subdued">
          {recommendation || "No recommendation available yet."}
        </Text>
        <Button variant="primary" icon={applied ? CheckIcon : undefined} disabled={applied} onClick={onApply}>
          {applied ? "Recommendation applied" : "Apply recommendation"}
        </Button>
      </BlockStack>
    </Card>
  );
}

function DeviceSplitCard({devices}) {
  return (
    <Card>
      <BlockStack gap="400">
        <BlockStack gap="050">
          <Text as="h2" variant="headingMd">
            Device split
          </Text>
          <Text as="p" tone="subdued">
            Traffic distribution by device.
          </Text>
        </BlockStack>

        {devices.length ? (
          <div className="device-circles">
            {devices.map((item) => (
              <div className="device-circle" key={item.name}>
                <div
                  className="device-ring"
                  style={{
                    "--device-color": item.color,
                    "--device-value": `${Math.max(0, Math.min(item.value, 100))}%`,
                  }}
                >
                  <span className="device-ring-value">{item.value}%</span>
                </div>
                <BlockStack gap="050" inlineAlign="center">
                  <Text as="p" fontWeight="semibold">
                    {item.name}
                  </Text>
                  <Text as="p" tone="subdued" variant="bodySm">
                    Traffic
                  </Text>
                </BlockStack>
              </div>
            ))}
          </div>
        ) : (
          <Text as="p" tone="subdued">
            No device analytics available.
          </Text>
        )}
      </BlockStack>
    </Card>
  );
}

function ProTipCard() {
  return (
    <div className="analytics-protip">
      <BlockStack gap="150">
        <Text as="h2" variant="headingMd" tone="text-inverse">
          PRO TIP
        </Text>
        <Text as="p" tone="text-inverse">
          Visualizing search intent helps tailor your product descriptions for SEO.
        </Text>
      </BlockStack>
    </div>
  );
}

function copyForTab(tab) {
  if (tab === 1) return "Search terms with activity but no clicks or results.";
  if (tab === 2) return "High-volume searches that are gaining momentum.";
  return "Most searched customer terms in the selected date range.";
}

function normalizeDeviceSplit(items) {
  var colors = {
    mobile: "#008060",
    desktop: "#5c6ac4",
    tablet: "#d82c0d",
  };

  return (items || [])
    .map((item) => ({
      name: item.name || item.device || item.type || "Unknown",
      value: Number(item.value ?? item.percentage ?? item.percent ?? item.count ?? 0),
    }))
    .filter((item) => item.name && Number.isFinite(item.value))
    .map((item) => {
      var key = String(item.name || "").toLowerCase();
      var color = key.indexOf("mobile") !== -1 ? colors.mobile : key.indexOf("desktop") !== -1 ? colors.desktop : key.indexOf("tablet") !== -1 ? colors.tablet : "#8a6116";
      return {...item, color};
    });
}

async function fetchJson(url, fallback) {
  try {
    var response = await fetch(url);
    if (!response.ok) return fallback;
    return await response.json();
  } catch {
    return fallback;
  }
}

function normalizeOverview(payload, searches) {
  var overview = payload || {};
  var ctr = pickNumber(overview, ["ctr", "clickThroughRate", "searchCtr", "searchesWithClicksRate", "clickRate"]);
  if (!ctr && searches.length) {
    var total = searches.reduce((sum, item) => sum + Number(item.count || 0), 0);
    var clicked = searches.reduce((sum, item) => sum + Number(item.clicks || 0), 0);
    ctr = total ? Math.round((clicked / total) * 100) : 0;
  }

  return {
    ...overview,
    totalSearches: pickNumber(overview, ["totalSearches", "searches", "total", "count"]),
    zeroResultRate: pickNumber(overview, ["zeroResultRate", "zeroResultsRate", "zeroRate"]),
    ctr,
  };
}

function normalizeSearchRows(payload) {
  var rows = Array.isArray(payload) ? payload : payload?.data || payload?.searches || payload?.items || [];
  return rows.map((item) => {
    var count = pickNumber(item, ["count", "searches", "totalSearches", "total"]);
    var clicks = pickNumber(item, ["clicks", "productClicks", "searchClicks"]);
    var ctr = pickNumber(item, ["ctr", "clickThroughRate", "clickRate"]);
    if (!ctr && count && clicks) ctr = Math.round((clicks / count) * 100);
    var results = pickNumber(item, ["results", "resultCount", "resultsCount", "avgResults"]);
    return {
      ...item,
      query: item.query || item.term || item.keyword || item.search || "-",
      count,
      clicks,
      ctr,
      results,
      avgPosition: pickNumber(item, ["avgPosition", "averagePosition", "position"]),
      zeroResults: item.zeroResults === true || item.hasResults === false || results === 0,
    };
  });
}

function pickNumber(source, keys) {
  for (var i = 0; i < keys.length; i += 1) {
    var value = source?.[keys[i]];
    if (value == null || value === "") continue;
    var number = Number(String(value).replace("%", ""));
    if (Number.isFinite(number)) return Math.round(number * 100) / 100;
  }
  return 0;
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
