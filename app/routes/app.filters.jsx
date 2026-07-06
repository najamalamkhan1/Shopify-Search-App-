import {useEffect, useMemo, useState} from "react";
import {useFetcher, useLoaderData} from "react-router";
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  ChoiceList,
  Icon,
  IndexTable,
  InlineStack,
  Modal,
  Page,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import {
  EditIcon,
  FilterIcon,
  InfoIcon,
  MenuHorizontalIcon,
  PlusIcon,
} from "@shopify/polaris-icons";
import {authenticate} from "../shopify.server";

const API =
  process.env.FILTERS_API_BASE_URL ||
  process.env.BACKEND_API_BASE_URL ||
  "https://search-app-hcwsn.ondigitalocean.app";

const defaultFilters = [
  createDefaultFilter("availability", "Availability", "availability", "availability", "visible", "active", 0),
  createDefaultFilter("price", "Price", "price", "price", "visible", "active", 1),
  createDefaultFilter("product-type", "Product Type", "product_type", "productTypes", "visible", "active", 2),
  createDefaultFilter("vendor", "Vendor", "vendor", "vendors", "hidden", "inactive", 3),
  createDefaultFilter("color", "Color", "color_swatch", "colors", "visible", "active", 4),
  createDefaultFilter("size", "Size", "variant_option", "sizes", "visible", "active", 5),
  createDefaultFilter("material", "Material", "metafield_list", "tags", "hidden", "inactive", 6),
  createDefaultFilter("sustainability-rating", "Sustainability Rating", "metafield_boolean", "tags", "hidden", "inactive", 7),
];

function createDefaultFilter(id, label, filterType, source, visibility, status, position) {
  return {
    id,
    label,
    filterType,
    source,
    visibility,
    status,
    position,
    settings: {
      enabled: status === "active",
      searchable: true,
      multiSelect: filterType !== "price",
      pinned: false,
      group: "Main filters",
    },
    metafield: {
      namespace: "",
      key: "",
    },
  };
}

function normalizeFilters(payload) {
  const list = Array.isArray(payload) ? payload : payload?.filters || payload?.data || [];
  if (!Array.isArray(list) || !list.length) return defaultFilters;
  return list
    .map((filter, index) => ({
      id: String(filter.id || filter._id || filter.key || `filter-${index}`),
      label: filter.label || "Untitled filter",
      filterType: filter.filterType || filter.type || "tag",
      source: filter.source || filter.filterType || "tags",
      visibility: filter.visibility === "hidden" ? "hidden" : "visible",
      status: filter.status === "inactive" ? "inactive" : "active",
      position: Number.isFinite(Number(filter.position)) ? Number(filter.position) : index,
      settings: {
        enabled: filter.settings?.enabled !== false,
        searchable: filter.settings?.searchable !== false,
        multiSelect: filter.settings?.multiSelect !== false,
        pinned: filter.settings?.pinned === true,
        group: filter.settings?.group || "Main filters",
        colorSwatches: filter.settings?.colorSwatches || {},
      },
      metafield: {
        namespace: filter.metafield?.namespace || "",
        key: filter.metafield?.key || "",
      },
    }))
    .sort((a, b) => a.position - b.position);
}

async function safeJson(url, fallback) {
  try {
    const response = await fetch(url, {headers: {Accept: "application/json"}});
    if (!response.ok) return fallback;
    return await response.json();
  } catch {
    return fallback;
  }
}

async function readResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {message: text};
  }
}

function filterPayload(shop, filter) {
  return {
    shop,
    label: filter.label,
    filterType: filter.filterType,
    source: filter.source,
    visibility: filter.visibility,
    status: filter.status,
    position: filter.position || 0,
    settings: {
      enabled: filter.status === "active",
      searchable: filter.settings?.searchable !== false,
      multiSelect: filter.settings?.multiSelect !== false,
      pinned: filter.settings?.pinned === true,
      group: filter.settings?.group || "Main filters",
      colorSwatches: filter.settings?.colorSwatches || {},
    },
    metafield: {
      namespace: filter.metafield?.namespace || "",
      key: filter.metafield?.key || "",
    },
  };
}

export const loader = async ({request}) => {
  const {session} = await authenticate.admin(request);
  const shop = session.shop;
  const [filtersPayload, options] = await Promise.all([
    safeJson(`${API}/api/filters?shop=${encodeURIComponent(shop)}`, []),
    safeJson(`${API}/api/filter-options?shop=${encodeURIComponent(shop)}`, {}),
  ]);

  return {
    shop,
    apiBaseUrl: API,
    filters: normalizeFilters(filtersPayload),
    options: options || {},
  };
};

export const action = async ({request}) => {
  const {session} = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "create") {
      const filter = JSON.parse(String(formData.get("filter") || "{}"));
      const response = await fetch(`${API}/api/filters`, {
        method: "POST",
        headers: {"Content-Type": "application/json", Accept: "application/json"},
        body: JSON.stringify(filterPayload(shop, filter)),
      });
      const data = await readResponse(response);
      return {ok: response.ok, intent, filter: data.filter || data, error: response.ok ? "" : data.message || "Could not create filter"};
    }

    if (intent === "update") {
      const id = formData.get("id");
      const filter = JSON.parse(String(formData.get("filter") || "{}"));
      const response = await fetch(`${API}/api/filters/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json", Accept: "application/json"},
        body: JSON.stringify(filterPayload(shop, filter)),
      });
      const data = await readResponse(response);
      return {ok: response.ok, intent, filter: data.filter || data, error: response.ok ? "" : data.message || "Could not update filter"};
    }

    if (intent === "status") {
      const id = formData.get("id");
      const status = formData.get("status");
      const response = await fetch(`${API}/api/filters/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json", Accept: "application/json"},
        body: JSON.stringify({status}),
      });
      const data = await readResponse(response);
      return {ok: response.ok, intent, id, status, error: response.ok ? "" : data.message || "Could not update status"};
    }

    if (intent === "visibility") {
      const id = formData.get("id");
      const visibility = formData.get("visibility");
      const response = await fetch(`${API}/api/filters/${encodeURIComponent(id)}/visibility`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json", Accept: "application/json"},
        body: JSON.stringify({visibility}),
      });
      const data = await readResponse(response);
      return {ok: response.ok, intent, id, visibility, error: response.ok ? "" : data.message || "Could not update visibility"};
    }

    return {ok: false, error: "Unknown filter action"};
  } catch (error) {
    return {ok: false, error: error.message || "Could not connect to filters API"};
  }
};

export default function FiltersPage() {
  const {filters: initialFilters, options, apiBaseUrl} = useLoaderData();
  const fetcher = useFetcher();
  const [enableOnSearch, setEnableOnSearch] = useState(true);
  const [enableOnCollections, setEnableOnCollections] = useState(true);
  const [filters, setFilters] = useState(initialFilters);
  const [editingFilter, setEditingFilter] = useState(null);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  useEffect(() => {
    if (!fetcher.data?.ok) return;
    if (fetcher.data.intent === "status") {
      setFilters((current) =>
        current.map((filter) =>
          filter.id === fetcher.data.id ? {...filter, status: fetcher.data.status} : filter,
        ),
      );
    }
    if (fetcher.data.intent === "visibility") {
      setFilters((current) =>
        current.map((filter) =>
          filter.id === fetcher.data.id ? {...filter, visibility: fetcher.data.visibility} : filter,
        ),
      );
    }
  }, [fetcher.data]);

  const activeCount = useMemo(
    () => filters.filter((filter) => filter.status === "active" && filter.visibility === "visible").length,
    [filters],
  );

  function submitForm(fields) {
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
    fetcher.submit(formData, {method: "post"});
  }

  function handleAddFilter() {
    const nextFilter = createDefaultFilter(`custom-${Date.now()}`, "New Filter", "tag", "tags", "hidden", "inactive", filters.length);
    setFilters((current) => [...current, nextFilter]);
    submitForm({intent: "create", filter: JSON.stringify(nextFilter)});
  }

  function handleEditFilter(filter) {
    setEditingFilter(filter);
  }

  function handleSaveEdit(filter) {
    setFilters((current) => current.map((item) => (item.id === filter.id ? filter : item)));
    setEditingFilter(null);
    submitForm({intent: "update", id: filter.id, filter: JSON.stringify(filter)});
  }

  function toggleStatus(filter) {
    const status = filter.status === "active" ? "inactive" : "active";
    setFilters((current) => current.map((item) => (item.id === filter.id ? {...item, status} : item)));
    submitForm({intent: "status", id: filter.id, status});
  }

  function toggleVisibility(filter) {
    const visibility = filter.visibility === "visible" ? "hidden" : "visible";
    setFilters((current) => current.map((item) => (item.id === filter.id ? {...item, visibility} : item)));
    submitForm({intent: "visibility", id: filter.id, visibility});
  }

  const rows = filters.map((filter, index) => (
    <IndexTable.Row id={filter.id} key={filter.id} position={index}>
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd" fontWeight="semibold">
          {filter.label}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>{sourceLabel(filter)}</IndexTable.Cell>
      <IndexTable.Cell>
        <VisibilityBadge value={filter.visibility} onClick={() => toggleVisibility(filter)} />
      </IndexTable.Cell>
      <IndexTable.Cell>
        <button className="status-button" type="button" onClick={() => toggleStatus(filter)}>
          <StatusPill value={filter.status} />
        </button>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Button icon={EditIcon} accessibilityLabel={`Edit ${filter.label}`} onClick={() => handleEditFilter(filter)} />
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page
      title="Search Filters"
      subtitle="Manage filters shown on collection and search result pages"
      primaryAction={{content: "Add Filter", icon: PlusIcon, onAction: handleAddFilter}}
    >
      <BlockStack gap="500">
        <Card padding="400">
          <InlineStack gap="300" align="start" blockAlign="start" wrap={false}>
            <Box width="24px" minWidth="24px">
              <Icon source={InfoIcon} tone="info" />
            </Box>
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">
                Optimize your discovery experience
              </Text>
              <Text as="p" tone="subdued">
                Filters help customers find products faster. You can show up to 20 filters at a time.
                High-performance stores typically use 5-8 key filters.
              </Text>
            </BlockStack>
          </InlineStack>
        </Card>

        {fetcher.data?.error ? (
          <Banner tone="critical">
            <Text as="p">{fetcher.data.error}</Text>
            <Text as="p" tone="subdued">
              API: {apiBaseUrl}
            </Text>
          </Banner>
        ) : null}

        <div className="filters-layout">
          <aside className="filters-sidebar">
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    General Settings
                  </Text>
                  <SettingToggle
                    title="Enable on Search"
                    description="Show filter drawer on search result pages"
                    checked={enableOnSearch}
                    onChange={() => setEnableOnSearch((value) => !value)}
                  />
                  <SettingToggle
                    title="Enable on Collections"
                    description="Show filter drawer on all collection pages"
                    checked={enableOnCollections}
                    onChange={() => setEnableOnCollections((value) => !value)}
                  />
                </BlockStack>
              </Card>

              <div className="promo-card">
                <span className="promo-shape promo-shape-one" />
                <span className="promo-shape promo-shape-two" />
                <span className="promo-shape promo-shape-three" />
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd" tone="text-inverse">
                    New! Advanced Logic
                  </Text>
                  <Text as="p" tone="text-inverse">
                    Use metafields for complex filtering scenarios.
                  </Text>
                </BlockStack>
              </div>
            </BlockStack>
          </aside>

          <main className="filters-content">
            <Card padding="0">
              <Box padding="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="050">
                    <Text as="h2" variant="headingMd">
                      Filters ({filters.length})
                    </Text>
                    <Text as="p" tone="subdued">
                      {activeCount} visible filters available on storefront search.
                    </Text>
                  </BlockStack>
                  <InlineStack gap="200">
                    <Button icon={FilterIcon} accessibilityLabel="Filter table" />
                    <Button icon={MenuHorizontalIcon} accessibilityLabel="More actions" />
                  </InlineStack>
                </InlineStack>
              </Box>
              <IndexTable
                resourceName={{singular: "filter", plural: "filters"}}
                itemCount={filters.length}
                selectable={false}
                headings={[
                  {title: "LABEL"},
                  {title: "SOURCE"},
                  {title: "VISIBILITY"},
                  {title: "STATUS"},
                  {title: "ACTIONS"},
                ]}
              >
                {rows}
              </IndexTable>
            </Card>
          </main>
        </div>
      </BlockStack>

      {editingFilter ? (
        <EditFilterModal
          filter={editingFilter}
          options={options}
          onClose={() => setEditingFilter(null)}
          onSave={handleSaveEdit}
        />
      ) : null}

      <style>{`
        .filters-layout {
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          gap: 20px;
          align-items: start;
        }

        .filters-sidebar,
        .filters-content {
          min-width: 0;
        }

        .promo-card {
          position: relative;
          overflow: hidden;
          min-height: 148px;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: flex-end;
          background:
            radial-gradient(circle at 82% 18%, rgba(149, 213, 178, 0.42), transparent 28%),
            linear-gradient(135deg, #004c3f 0%, #006f52 55%, #008060 100%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
        }

        .promo-shape {
          position: absolute;
          display: block;
          pointer-events: none;
        }

        .promo-shape-one {
          width: 92px;
          height: 92px;
          right: -18px;
          top: -22px;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.13);
          transform: rotate(18deg);
        }

        .promo-shape-two {
          width: 42px;
          height: 42px;
          right: 64px;
          top: 30px;
          border-radius: 50%;
          background: rgba(183, 223, 196, 0.28);
        }

        .promo-shape-three {
          width: 120px;
          height: 28px;
          right: -26px;
          bottom: 26px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          transform: rotate(-24deg);
        }

        .setting-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 16px;
          align-items: center;
        }

        .polaris-toggle {
          appearance: none;
          position: relative;
          width: 44px;
          height: 24px;
          margin: 0;
          border: 0;
          border-radius: 999px;
          background: #8c9196;
          cursor: pointer;
          transition: background 160ms ease;
        }

        .polaris-toggle:checked {
          background: #008060;
        }

        .polaris-toggle::after {
          content: "";
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.28);
          transition: transform 160ms ease;
        }

        .polaris-toggle:checked::after {
          transform: translateX(20px);
        }

        .status-button,
        .badge-button {
          appearance: none;
          padding: 0;
          border: 0;
          background: transparent;
          cursor: pointer;
          font: inherit;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 22px;
          color: #202223;
          font-size: 13px;
          line-height: 20px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #8c9196;
        }

        .status-dot-active {
          background: #008060;
        }

        @media (max-width: 990px) {
          .filters-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Page>
  );
}

function SettingToggle({title, description, checked, onChange}) {
  return (
    <div className="setting-row">
      <BlockStack gap="100">
        <Text as="h3" variant="bodyMd" fontWeight="semibold">
          {title}
        </Text>
        <Text as="p" tone="subdued">
          {description}
        </Text>
      </BlockStack>
      <input className="polaris-toggle" type="checkbox" checked={checked} onChange={onChange} aria-label={title} />
    </div>
  );
}

function VisibilityBadge({value, onClick}) {
  const visible = value === "visible";
  return (
    <button className="badge-button" type="button" onClick={onClick}>
      <Badge tone={visible ? "success" : undefined}>{visible ? "Visible" : "Hidden"}</Badge>
    </button>
  );
}

function StatusPill({value}) {
  const active = value === "active";
  return (
    <span className="status-pill">
      <span className={active ? "status-dot status-dot-active" : "status-dot"} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function sourceLabel(filter) {
  const map = {
    availability: "List",
    price: "Range",
    product_type: "List",
    vendor: "List",
    tag: "List",
    collection: "List",
    variant_option: "Variant",
    color_swatch: "Visual Swatch",
    metafield_boolean: "Boolean",
    metafield_text: "Metafield",
    metafield_list: "Metafield",
  };
  return map[filter.filterType] || filter.source || "List";
}

function EditFilterModal({filter, options, onClose, onSave}) {
  const [draft, setDraft] = useState(filter);
  const filterTypeOptions = [
    {label: "Availability", value: "availability"},
    {label: "Price", value: "price"},
    {label: "Product Type", value: "product_type"},
    {label: "Vendor", value: "vendor"},
    {label: "Tag", value: "tag"},
    {label: "Collection", value: "collection"},
    {label: "Variant Option", value: "variant_option"},
    {label: "Color Swatch", value: "color_swatch"},
    {label: "Metafield Boolean", value: "metafield_boolean"},
    {label: "Metafield Text", value: "metafield_text"},
    {label: "Metafield List", value: "metafield_list"},
  ];
  const sourceOptions = [
    {label: "Availability", value: "availability"},
    {label: `Vendors (${(options.vendors || []).length})`, value: "vendors"},
    {label: `Colors (${(options.colors || []).length})`, value: "colors"},
    {label: `Sizes (${(options.sizes || []).length})`, value: "sizes"},
    {label: `Collections (${(options.collectionOptions || options.collections || []).length})`, value: "collections"},
    {label: `Product types (${(options.productTypes || []).length})`, value: "productTypes"},
    {label: `Tags (${(options.tags || []).length})`, value: "tags"},
    {label: "Price", value: "price"},
  ];

  function update(key, value) {
    setDraft((current) => ({...current, [key]: value}));
  }

  function updateSetting(key, value) {
    setDraft((current) => ({
      ...current,
      settings: {...current.settings, [key]: value},
    }));
  }

  function updateMetafield(key, value) {
    setDraft((current) => ({
      ...current,
      metafield: {...current.metafield, [key]: value},
    }));
  }

  return (
    <Modal
      open
      title="Edit filter"
      onClose={onClose}
      primaryAction={{content: "Save", onAction: () => onSave(draft)}}
      secondaryActions={[{content: "Cancel", onAction: onClose}]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <TextField label="Label" value={draft.label} onChange={(value) => update("label", value)} autoComplete="off" />
          <Select label="Filter type" options={filterTypeOptions} value={draft.filterType} onChange={(value) => update("filterType", value)} />
          <Select label="Source" options={sourceOptions} value={draft.source} onChange={(value) => update("source", value)} />
          <InlineStack gap="400" align="start">
            <ChoiceList
              title="Visibility"
              choices={[
                {label: "Visible", value: "visible"},
                {label: "Hidden", value: "hidden"},
              ]}
              selected={[draft.visibility]}
              onChange={([value]) => update("visibility", value)}
            />
            <ChoiceList
              title="Status"
              choices={[
                {label: "Active", value: "active"},
                {label: "Inactive", value: "inactive"},
              ]}
              selected={[draft.status]}
              onChange={([value]) => update("status", value)}
            />
          </InlineStack>
          <ChoiceList
            title="Settings"
            allowMultiple
            choices={[
              {label: "Searchable", value: "searchable"},
              {label: "Multi-select", value: "multiSelect"},
              {label: "Pinned", value: "pinned"},
            ]}
            selected={["searchable", "multiSelect", "pinned"].filter((key) => draft.settings?.[key])}
            onChange={(selected) => {
              updateSetting("searchable", selected.includes("searchable"));
              updateSetting("multiSelect", selected.includes("multiSelect"));
              updateSetting("pinned", selected.includes("pinned"));
            }}
          />
          <TextField label="Group" value={draft.settings?.group || ""} onChange={(value) => updateSetting("group", value)} autoComplete="off" />
          <InlineStack gap="400" align="start">
            <Box width="calc(50% - 8px)">
              <TextField label="Metafield namespace" value={draft.metafield?.namespace || ""} onChange={(value) => updateMetafield("namespace", value)} autoComplete="off" />
            </Box>
            <Box width="calc(50% - 8px)">
              <TextField label="Metafield key" value={draft.metafield?.key || ""} onChange={(value) => updateMetafield("key", value)} autoComplete="off" />
            </Box>
          </InlineStack>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
