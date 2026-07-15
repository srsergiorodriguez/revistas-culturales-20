<svelte:options customElement="repository-index" />

<script>
  let { 
    itemsPerPage = 12,
    filters = "" 
  } = $props();

  const allItems = window.REPOSITORIES_DATA || [];
  
  let filterKeys = $derived(
    filters ? filters.split(',').map(s => s.trim().toLowerCase()) : []
  );

  // Added a fallback just in case the context isn't loaded yet
  const i18n = window.CUSTOM_CONTEXT?.i18n || {
    searchPlaceholder: "Search...",
    resultsFound: "results found",
    all: "All",
    clearSearch: "Clear search",
    noRecordsFound: "No records found.",
    noImage: "No Image"
  };

  let searchQuery = $state("");
  let activeFilters = $state({});
  let currentPage = $state(0);

  // --- NEW: Dynamic Grid Calculations ---
  let gridElement = $state();
  let currentColumns = $state(1);

  // Snap the requested itemsPerPage to the nearest full row
  let dynamicItemsPerPage = $derived.by(() => {
    if (currentColumns <= 1) return itemsPerPage;
    const targetRows = Math.max(1, Math.round(itemsPerPage / currentColumns));
    return targetRows * currentColumns;
  });

  let filteredItems = $derived(
    allItems.filter(item => {
      const matchesSearch = searchQuery.trim() === "" || 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
        if (!value || value === "") return true;
        
        const itemVal = item[key];
        let strVal = "";
        
        if (Array.isArray(itemVal)) {
          strVal = itemVal.map(v => typeof v === 'object' && v !== null ? v.name || v.nombre || v.id : String(v)).join(",");
        } else if (typeof itemVal === 'object' && itemVal !== null) {
          strVal = itemVal.name || itemVal.nombre || itemVal.id;
        } else {
          strVal = String(itemVal || "");
        }
        
        return strVal === String(value);
      });

      return matchesSearch && matchesFilters;
    })
  );

  // --- UPDATED: Use dynamicItemsPerPage instead of itemsPerPage ---
  let totalPages = $derived(Math.ceil(filteredItems.length / dynamicItemsPerPage));
  
  let paginatedItems = $derived(
    filteredItems.slice(currentPage * dynamicItemsPerPage, (currentPage + 1) * dynamicItemsPerPage)
  );

  // Reset to first page if search or filters change
  $effect(() => {
    searchQuery;
    activeFilters;
    currentPage = 0;
  });

  // Keep pagination in bounds if the user resizes the window and total pages shrink
  $effect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      currentPage = totalPages - 1;
    }
  });

  // Observe the CSS Grid and count the computed columns
  $effect(() => {
    if (!gridElement) return;
    
    const observer = new ResizeObserver(() => {
      const computedCols = window.getComputedStyle(gridElement).gridTemplateColumns;
      const colCount = computedCols.split(' ').length;
      
      if (colCount !== currentColumns) {
        currentColumns = colCount;
      }
    });
    
    observer.observe(gridElement);
    return () => observer.disconnect();
  });

  function getUniqueOptions(key) {
    const options = allItems.flatMap(item => {
      const val = item[key];
      if (val === undefined || val === null || val === "") return [];
      
      if (Array.isArray(val)) {
         return val.map(v => typeof v === 'object' && v !== null ? v.name || v.nombre || v.id : String(v));
      } else if (typeof val === 'object' && val !== null) {
         return [val.name || val.nombre || val.id];
      }
      return [String(val)];
    });
    return [...new Set(options)].sort();
  }

  function clearAll() {
    searchQuery = "";
    let resetFilters = {};
    filterKeys.forEach(key => resetFilters[key] = "");
    activeFilters = resetFilters;
  }
</script>

<div class="app-container">
  
  <!-- CONTROLS SECTION -->
  <div class="controls-container">
    <div class="search-bar-container">
      <input 
        class="search-bar" 
        type="search" 
        placeholder={i18n.searchPlaceholder} 
        bind:value={searchQuery} 
      />
    </div>

    {#if filterKeys.length > 0}
      <div class="filters-grid">
        {#each filterKeys as key}
          <div class="filter-group">
            <label for="filter-{key.replace(/\s+/g, '-')}">{key.replace(/_/g, ' ')}</label>
            <select id="filter-{key.replace(/\s+/g, '-')}" class="filter-select" bind:value={activeFilters[key]}>
              <option value="">- {i18n.all} -</option>
              {#each getUniqueOptions(key) as option}
                <option value={option}>{option}</option>
              {/each}
            </select>
          </div>
        {/each}
      </div>
    {/if}

    <div class="status-bar">
      <span><strong>{filteredItems.length}</strong> {i18n.resultsFound}</span>
      <div class="status-actions">
        {#if searchQuery || Object.values(activeFilters).some(v => v !== "")}
          <button class="reset-btn" onclick={clearAll} title={i18n.clearSearch}>
            {i18n.clearSearch}
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- TOP PAGINATOR -->
  {#if totalPages > 1}
    <div class="pager-container">
      <button class="pager-btn outline" disabled={currentPage === 0} onclick={() => currentPage--}>«</button>
      <div class="page-numbers">{currentPage + 1} / {totalPages}</div>
      <button class="pager-btn outline" disabled={currentPage >= totalPages - 1} onclick={() => currentPage++}>»</button>
    </div>
  {/if}

  <!-- GALLERY SECTION -->
  {#if filteredItems.length === 0}
     <div class="empty-message">
      {i18n.noRecordsFound}
     </div>
  {:else}
    <div class="gallery-grid" bind:this={gridElement}>
      {#each paginatedItems as item, index (item.id || index)}
        <a href="{item.url || '#'}" target="_blank" rel="noopener noreferrer" class="gallery-item">
          <div class="image-wrapper">
            {#if item.thumbnails && item.thumbnails.length > 0}
              <img src={item.thumbnails[0]} alt={item.name || item.nombre || item.id} loading="lazy" />
            {:else if item.images && item.images.length > 0}
              <img src={item.images[0]} alt={item.name || item.nombre || item.id} loading="lazy" />
            {:else}
              <div class="no-img">{i18n.noImage}</div>
            {/if}
          </div>
          <span class="item-label">{item.name || item.nombre || item.id}</span>
          {#if item.ciudad && item.pais}
             <span class="item-meta">{item.ciudad}, {item.pais}</span>
          {/if}
        </a>
      {/each}
    </div>
  {/if}

  <!-- BOTTOM PAGINATOR -->
  {#if totalPages > 1}
    <div class="pager-container">
      <button class="pager-btn outline" disabled={currentPage === 0} onclick={() => currentPage--}>«</button>
      <div class="page-numbers">{currentPage + 1} / {totalPages}</div>
      <button class="pager-btn outline" disabled={currentPage >= totalPages - 1} onclick={() => currentPage++}>»</button>
    </div>
  {/if}

</div>

<style>
  /* Inject ALL shared structural CSS into the Shadow DOM */
  @import '../styles/global-styles.css';
</style>