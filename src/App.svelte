<script>
  import { onMount } from "svelte";
  import yaml from "js-yaml";
  import snarkdown from "snarkdown";

  let loading = true;
  let error = null;
  let versions = [];
  let matrices = {};
  let classOptions = [];
  let activeClass = "viewer";
  let activeLabel = "Viewers";
  let activeToolCount = 0;

  const CLASS_LABELS = {
    viewer: "Viewers",
    reader_and_writer: "Readers & Writers",
  };
  const CLASS_KEYS = ["viewer", "reader_and_writer"];

  // Modal state for cell details
  let selectedCell = null;
  // Modal state for info popup (tools or features)
  let selectedInfo = null;

  function openCellDetails(tool, feature, result) {
    if (result) {
      selectedCell = { tool, feature, result };
    }
  }

  function closeCellDetails() {
    selectedCell = null;
  }

  function openInfo(title, content) {
    if (content) {
      selectedInfo = { title, content };
    }
  }

  function getFeatureInfoContent(feature) {
    let content = feature.description || "";
    if (feature.definition_of_support) {
      content +=
        "\n\n**Definition of support:**\n\n" + feature.definition_of_support;
    }
    return content;
  }

  function closeInfo() {
    selectedInfo = null;
  }

  function featureAppliesTo(feature, toolClass) {
    if (!feature.applies_to) return true;
    if (Array.isArray(feature.applies_to)) {
      return feature.applies_to.includes(toolClass);
    }
    return feature.applies_to === toolClass;
  }

  function updateClassInUrl(key) {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("class", key);
    window.history.replaceState({}, "", url);
  }

  function setActiveClass(key, { updateUrl = true } = {}) {
    if (!matrices[key]) return;
    activeClass = key;
    activeLabel = CLASS_LABELS[key] || key;
    versions = matrices[key].versions || [];
    activeToolCount = matrices[key].toolsCount || 0;
    selectedCell = null;
    selectedInfo = null;
    if (updateUrl) updateClassInUrl(key);
  }

  onMount(async () => {
    try {
      const base = import.meta.env.BASE_URL || "/";
      const withBase = (path) => `${base}${path}`;

      const [featuresRes, toolClassRes] = await Promise.all([
        fetch(withBase("data/features.yml")),
        fetch(withBase("data/tool_classes.yml")),
      ]);
      const featureList = yaml.load(await featuresRes.text()) || [];
      const rawToolClasses = yaml.load(await toolClassRes.text()) || {};
      const toolClasses = {
        viewer: Array.isArray(rawToolClasses.viewer)
          ? rawToolClasses.viewer
          : [],
        reader_and_writer: Array.isArray(rawToolClasses.reader_and_writer)
          ? rawToolClasses.reader_and_writer
          : [],
      };

      const toolIds = Array.from(
        new Set([...toolClasses.viewer, ...toolClasses.reader_and_writer]),
      ).filter(Boolean);

      let toolFiles = toolIds.map((id) => `data/tools/${id}.yml`);
      if (toolFiles.length === 0) {
        const indexRes = await fetch(withBase("data/tools/index.json"));
        const indexFiles = await indexRes.json();
        toolFiles = indexFiles;
        toolClasses.viewer = indexFiles.map((file) =>
          file
            .split("/")
            .pop()
            .replace(/\.ya?ml$/i, ""),
        );
      }

      const toolFilePromises = toolFiles.map((file) => {
        return (async () => {
          try {
            const cleanPath = file.replace(/^\/+/, "");
            const res = await fetch(withBase(cleanPath));
            const raw = yaml.load(await res.text());
            const id = cleanPath
              .split("/")
              .pop()
              .replace(/\.ya?ml$/i, "");
            return { id, raw };
          } catch (e) {
            console.warn("Failed to load", file);
            return null;
          }
        })();
      });

      const tools = (await Promise.all(toolFilePromises)).filter(
        (tool) => tool !== null,
      );
      const toolsById = tools.reduce((acc, tool) => {
        acc[tool.id] = tool;
        return acc;
      }, {});

      matrices = CLASS_KEYS.reduce((acc, toolClass) => {
        const ids = toolClasses[toolClass] || [];
        const filteredFeatures = featureList.filter((feature) =>
          featureAppliesTo(feature, toolClass),
        );
        const classTools = (ids || [])
          .map((id) => toolsById[id])
          .filter(Boolean);
        acc[toolClass] = {
          versions: buildMatrix(filteredFeatures, classTools),
          toolsCount: classTools.length,
          featureCount: filteredFeatures.length,
        };
        return acc;
      }, {});

      classOptions = CLASS_KEYS.filter(
        (key) =>
          matrices[key]?.toolsCount > 0 || matrices[key]?.featureCount > 0,
      ).map((key) => ({
        key,
        label: CLASS_LABELS[key] || key,
      }));

      const urlParams = new URLSearchParams(window.location.search);
      const requestedClass = urlParams.get("class");
      const hasRequested = classOptions.some(
        (option) => option.key === requestedClass,
      );
      const defaultClass =
        (hasRequested && requestedClass) || classOptions[0]?.key;

      if (defaultClass) {
        setActiveClass(defaultClass, { updateUrl: false });
      } else {
        versions = [];
        activeToolCount = 0;
      }

      loading = false;
    } catch (e) {
      error = e.message;
      loading = false;
    }
  });

  function buildMatrix(featureList = [], tools = []) {
    // Collect all versions from features
    const versionSet = new Set();
    featureList.forEach((f) => {
      if (f.versions) Object.keys(f.versions).forEach((v) => versionSet.add(v));
    });

    const versionOrder = Array.from(versionSet).sort(
      (a, b) => parseFloat(b) - parseFloat(a),
    );

    return versionOrder.map((version) => {
      // Get features for this version
      const features = featureList
        .filter((f) => f.versions && f.versions[version])
        .map((f) => {
          const vData = Array.isArray(f.versions[version])
            ? f.versions[version].reduce(
                (acc, item) => ({ ...acc, ...item }),
                {},
              )
            : f.versions[version];
          return {
            slug: f.slug,
            name: vData.name || f.name,
            description: vData.description || f.description,
            definition_of_support:
              vData.definition_of_support || f.definition_of_support,
            sample_url: vData.sample_url || f.sample_url,
            sample_name: vData.sample_name || f.sample_name,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      // Get tool results for this version
      const toolData = tools.map((tool) => {
        const info = tool.raw?.tool_info || { id: tool.id, name: tool.id };
        const testInfo = tool.raw?.test_info || {};

        // Collect results for each feature, with newer tests taking precedence
        const results = {};

        // Sort test keys so newer tests (higher numbers) are processed last and override older ones
        const sortedTestKeys = Object.keys(testInfo).sort((a, b) => {
          // Extract numeric part from test names like "test-1", "test-2"
          const numA = parseInt(a.replace(/\D/g, "")) || 0;
          const numB = parseInt(b.replace(/\D/g, "")) || 0;
          return numA - numB; // Lower numbers first, higher numbers last (so newer wins)
        });

        sortedTestKeys.forEach((testKey) => {
          const test = testInfo[testKey];
          const versionBlock = test.features?.[version];
          if (versionBlock) {
            Object.entries(versionBlock).forEach(([slug, result]) => {
              // Store result with test metadata
              const dateVal = test.date;
              const dateStr =
                dateVal instanceof Date
                  ? dateVal.toISOString().slice(0, 10)
                  : dateVal;
              results[slug] = {
                ...result,
                _testId: testKey,
                _toolVersion: test.tool_version,
                _additionalVersions: test.additional_versions,
                _date: dateStr,
              };
            });
          }
        });

        return {
          id: tool.id,
          name: info.name || info.label || tool.id,
          viewer_url: info.viewer_url,
          viewer_url_postfix: info.viewer_url_postfix,
          test_instructions: info.test_instructions,
          results,
        };
      });

      return { version, features, tools: toolData };
    });
  }

  function getStatus(result) {
    if (!result) return "missing";
    if (result.supported === true || result.supported === "yes")
      return "supported";
    if (result.opens === false || result.opens === "no") return "fails";
    if (result.opens === true || result.opens === "yes") return "ignored";
    return "missing";
  }

  function getViewerUrl(tool, feature, result) {
    if (result?.viewer_url) return result.viewer_url;
    if (tool.viewer_url && feature.sample_url) {
      return (
        tool.viewer_url + feature.sample_url + (tool.viewer_url_postfix || "")
      );
    }
    return null;
  }

  function handleKeydown(e) {
    if (e.key === "Escape") {
      if (selectedCell) closeCellDetails();
      if (selectedInfo) closeInfo();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="app">
  <header class="hero">
    <p class="eyebrow">OME-NGFF Tools</p>
    <h1>OME-Zarr {activeLabel} Matrix</h1>
    <p class="lede">Version-specific support pulled from tool test YAMLs.</p>
    {#if classOptions.length > 1}
      <div class="class-toggle" role="group" aria-label="Tool classes">
        {#each classOptions as option}
          <button
            type="button"
            class:active={activeClass === option.key}
            on:click={() => setActiveClass(option.key)}
            aria-pressed={activeClass === option.key}
          >
            {option.label}
          </button>
        {/each}
      </div>
    {/if}
    {#if versions.length}
      <div class="version-links">
        {#each versions as v}
          <a href="#version-{v.version}" class="chip">{v.version}</a>
        {/each}
      </div>
    {/if}
  </header>

  <main>
    <div class="legend">
      <div class="legend-item supported">Supported</div>
      <div class="legend-item ignored">Opens (no effect)</div>
      <div class="legend-item fails">Fails to open</div>
      <div class="legend-item missing">Not tested</div>
    </div>

    {#if loading}
      <p>Loading...</p>
    {:else if error}
      <p class="error">Error: {error}</p>
    {:else if !versions.length}
      <p class="empty">
        No feature data available for {activeLabel} yet.
      </p>
    {:else}
      {#if activeToolCount === 0}
        <p class="empty">No tools registered for {activeLabel} yet.</p>
      {/if}
      {#each versions as v}
        <section class="version-section" id="version-{v.version}">
          <h2>OME-Zarr {v.version}</h2>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th class="sticky">Feature</th>
                  <th>Sample</th>
                  {#each v.tools as tool}
                    <th
                      class="tool-header {tool.test_instructions
                        ? 'clickable'
                        : ''}"
                      on:click={() =>
                        openInfo(tool.name, tool.test_instructions)}
                      on:keydown={(e) =>
                        e.key === "Enter" &&
                        openInfo(tool.name, tool.test_instructions)}
                      tabindex={tool.test_instructions ? 0 : -1}
                      role={tool.test_instructions ? "button" : undefined}
                    >
                      <span>{tool.name}</span>
                      {#if tool.test_instructions}
                        <i class="fas fa-question-circle info-icon"></i>
                      {/if}
                    </th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each v.features as feature}
                  <tr>
                    <td
                      class="sticky {feature.description ||
                      feature.definition_of_support
                        ? 'clickable'
                        : ''}"
                      on:click={() =>
                        openInfo(feature.name, getFeatureInfoContent(feature))}
                      on:keydown={(e) =>
                        e.key === "Enter" &&
                        openInfo(feature.name, getFeatureInfoContent(feature))}
                      tabindex={feature.description ||
                      feature.definition_of_support
                        ? 0
                        : -1}
                      role={feature.description || feature.definition_of_support
                        ? "button"
                        : undefined}
                    >
                      <div class="feature-cell">
                        <span class="feature-name">{feature.name}</span>
                        {#if feature.description || feature.definition_of_support}
                          <i class="fas fa-info-circle info-icon"></i>
                        {/if}
                      </div>
                    </td>
                    <td class="sample-cell">
                      {#if feature.sample_url}
                        <a href={feature.sample_url} target="_blank"
                          >{feature.sample_name || "Sample"}</a
                        >
                      {/if}
                    </td>
                    {#each v.tools as tool}
                      {@const result = tool.results[feature.slug]}
                      {@const status = getStatus(result)}
                      {@const viewerUrl = getViewerUrl(tool, feature, result)}
                      <td
                        class="{status} {result ? 'clickable' : ''}"
                        on:click={() => openCellDetails(tool, feature, result)}
                        on:keydown={(e) =>
                          e.key === "Enter" &&
                          openCellDetails(tool, feature, result)}
                        tabindex={result ? 0 : -1}
                        role={result ? "button" : undefined}
                      >
                        {#if viewerUrl}
                          <a
                            href={viewerUrl}
                            target="_blank"
                            class="icon-link"
                            title="Open in viewer"
                            on:click|stopPropagation
                          >
                            <i class="fas fa-eye"></i>
                          </a>
                        {/if}
                        {#if result?.issue_url}
                          <a
                            href={result.issue_url}
                            target="_blank"
                            class="icon-link"
                            title="GitHub issue"
                            on:click|stopPropagation
                          >
                            <i class="fab fa-github"></i>
                          </a>
                        {/if}
                        {#if result?.notes}
                          <i
                            class="fas fa-info-circle notes-icon"
                            title={result.notes}
                          ></i>
                        {/if}
                      </td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </section>
      {/each}
    {/if}
  </main>
</div>

<!-- Cell Details Modal -->
{#if selectedCell}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
  <div class="modal-overlay" role="presentation" on:click={closeCellDetails}>
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
    <div class="modal" on:click|stopPropagation role="dialog" aria-modal="true">
      <button
        class="modal-close"
        on:click={closeCellDetails}
        aria-label="Close"
      >
        <i class="fas fa-times"></i>
      </button>
      <h3>{selectedCell.tool.name} — {selectedCell.feature.name}</h3>

      <div class="modal-content">
        <div class="modal-row">
          <strong>Status:</strong>
          <span class="status-badge {getStatus(selectedCell.result)}"
            >{getStatus(selectedCell.result)}</span
          >
        </div>

        {#if selectedCell.result._toolVersion}
          <div class="modal-row">
            <strong>Tool Version:</strong>
            <span>{selectedCell.result._toolVersion}</span>
          </div>
        {/if}

        {#if selectedCell.result._additionalVersions}
          <div class="modal-row">
            <strong>Dependencies:</strong>
            <ul class="version-list">
              {#each Object.entries(selectedCell.result._additionalVersions) as [pkg, ver]}
                <li>{pkg}: {ver}</li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if selectedCell.result._testId}
          <div class="modal-row">
            <strong>Test ID:</strong>
            <span>{selectedCell.result._testId}</span>
          </div>
        {/if}

        {#if selectedCell.result._date}
          <div class="modal-row">
            <strong>Date:</strong>
            <span>{selectedCell.result._date}</span>
          </div>
        {/if}

        {#if selectedCell.result.notes}
          <div class="modal-row">
            <strong>Notes:</strong>
            <p class="notes-text">{selectedCell.result.notes}</p>
          </div>
        {/if}

        {#if selectedCell.result.issue_url}
          <div class="modal-row">
            <strong>Issue:</strong>
            <a href={selectedCell.result.issue_url} target="_blank"
              >{selectedCell.result.issue_url}</a
            >
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Info Modal (for tools and features) -->
{#if selectedInfo}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
  <div class="modal-overlay" role="presentation" on:click={closeInfo}>
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
    <div class="modal" on:click|stopPropagation role="dialog" aria-modal="true">
      <button class="modal-close" on:click={closeInfo} aria-label="Close">
        <i class="fas fa-times"></i>
      </button>
      <h3>{selectedInfo.title}</h3>

      <div class="modal-content">
        <p class="notes-text">{@html snarkdown(selectedInfo.content)}</p>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(:root) {
    --bg: #f6f2ea;
    --ink: #171717;
    --muted: #4b5563;
    --card: #ffffff;
    --stroke: rgba(17, 24, 39, 0.12);
    --accent: #0f766e;
    --supported: #7ac943;
    --fails: #e24a3b;
    --ignored: #f2c14e;
    --missing: #d7d7d7;
    --font-body: "IBM Plex Sans", sans-serif;
    --font-display: "Space Grotesk", sans-serif;
  }

  :global(*) {
    box-sizing: border-box;
  }
  :global(body) {
    margin: 0;
    font-family: var(--font-body);
    color: var(--ink);
    background: linear-gradient(180deg, #f6f2ea 0%, #fbf9f6 60%, #f6f2ea 100%);
    min-height: 100vh;
  }

  .app {
    min-height: 100vh;
  }

  .hero {
    padding: 48px 6vw 32px;
    border-bottom: 1px solid var(--stroke);
  }
  .eyebrow {
    margin: 0 0 8px;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    font-size: 0.75rem;
    color: var(--muted);
  }
  .hero h1 {
    margin: 0 0 8px;
    font-family: var(--font-display);
    font-size: clamp(2rem, 4vw, 3rem);
  }
  .lede {
    margin: 0 0 16px;
    color: var(--muted);
  }
  .version-links {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 12px;
  }
  .chip {
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid var(--stroke);
    background: white;
    color: var(--ink);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.85rem;
  }
  .chip:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .class-toggle {
    display: inline-flex;
    gap: 6px;
    padding: 6px;
    border-radius: 999px;
    border: 1px solid var(--stroke);
    background: var(--card);
    margin: 8px 0 0;
  }
  .class-toggle button {
    border: 1px solid transparent;
    background: transparent;
    color: var(--ink);
    padding: 6px 14px;
    border-radius: 999px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
  }
  .class-toggle button.active {
    background: var(--accent);
    color: white;
  }
  .class-toggle button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  main {
    padding: 32px 6vw 56px;
  }

  .legend {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }
  .legend-item {
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
  }
  .legend-item.supported {
    background: var(--supported);
  }
  .legend-item.ignored {
    background: var(--ignored);
  }
  .legend-item.fails {
    background: var(--fails);
    color: white;
  }
  .legend-item.missing {
    background: var(--missing);
  }

  .version-section {
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid var(--stroke);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 24px;
  }
  .version-section h2 {
    margin: 0 0 16px;
    font-family: var(--font-display);
    font-size: 1.4rem;
  }

  .table-wrap {
    overflow: auto;
    max-height: 70vh;
    border-radius: 8px;
    border: 1px solid var(--stroke);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 600px;
  }
  th,
  td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid var(--stroke);
    font-size: 0.9rem;
  }
  th {
    background: var(--card);
    position: sticky;
    top: 0;
    z-index: 2;
    font-weight: 600;
  }
  .sticky {
    position: sticky;
    left: 0;
    background: var(--card);
    z-index: 1;
    min-width: 200px;
  }
  th.sticky {
    z-index: 3;
  }

  .feature-cell {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .feature-name {
    font-weight: 600;
  }
  .info-icon {
    color: var(--muted);
    cursor: help;
    font-size: 0.85em;
  }
  .sample-cell a {
    color: var(--ink);
  }

  td.supported {
    background: var(--supported);
  }
  td.fails {
    background: var(--fails);
  }
  td.ignored {
    background: var(--ignored);
  }
  td.missing {
    background: var(--missing);
  }

  .icon-link {
    color: inherit;
    opacity: 0.7;
    margin-right: 6px;
  }
  .icon-link:hover {
    opacity: 1;
  }

  .error {
    color: var(--fails);
  }
  .empty {
    color: var(--muted);
    font-size: 0.95rem;
    margin-top: 12px;
  }

  /* Tool header */
  .tool-header {
    white-space: nowrap;
  }
  .tool-header span {
    margin-right: 4px;
  }

  /* Notes icon in cells */
  .notes-icon {
    color: inherit;
    opacity: 0.7;
    cursor: help;
    font-size: 0.85em;
  }

  /* Clickable cells and headers */
  .clickable {
    cursor: pointer;
  }
  .clickable:hover {
    filter: brightness(0.95);
  }

  /* Modal styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .modal {
    background: var(--card);
    border-radius: 12px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
  .modal h3 {
    margin: 0 0 16px;
    font-family: var(--font-display);
    font-size: 1.2rem;
    padding-right: 30px;
  }
  .modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: var(--muted);
    padding: 4px 8px;
  }
  .modal-close:hover {
    color: var(--ink);
  }
  .modal-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .modal-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .modal-row strong {
    font-size: 0.85rem;
    color: var(--muted);
  }
  .modal-row a {
    color: var(--accent);
    word-break: break-all;
  }
  .status-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.85rem;
    width: fit-content;
  }
  .status-badge.supported {
    background: var(--supported);
  }
  .status-badge.fails {
    background: var(--fails);
    color: white;
  }
  .status-badge.ignored {
    background: var(--ignored);
  }
  .status-badge.missing {
    background: var(--missing);
  }
  .version-list {
    margin: 0;
    padding-left: 20px;
    font-size: 0.9rem;
  }
  .version-list li {
    margin: 2px 0;
  }
  .notes-text {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.5;
    background: rgba(0, 0, 0, 0.03);
    padding: 8px 12px;
    border-radius: 6px;
  }
  .notes-text :global(a) {
    color: var(--accent);
    text-decoration: underline;
  }
  .notes-text :global(a:hover) {
    opacity: 0.8;
  }
  .notes-text :global(code) {
    background: rgba(0, 0, 0, 0.06);
    padding: 2px 4px;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.85em;
  }
  .notes-text :global(ul),
  .notes-text :global(ol) {
    margin: 8px 0;
    padding-left: 20px;
  }
  .notes-text :global(li) {
    margin: 4px 0;
  }
  .notes-text :global(strong) {
    font-weight: 700;
  }
  .notes-text :global(em) {
    font-style: italic;
  }
</style>
