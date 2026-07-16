<svelte:options customElement="repository-index" />

<script>
  let { 
    itemsPerPage = 12,
    filters = "",
    modalFields = ""
  } = $props();

  const allItems = window.REPOSITORIES_DATA || [];
  
  let filterKeys = $derived(
    filters ? filters.split(',').map(s => s.trim().toLowerCase()) : []
  );

  let displayFields = $derived(
    modalFields ? modalFields.split(',').map(s => s.trim().toLowerCase()) : []
  );

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

  // --- Modal State ---
  let activeModalItem = $state(null);

  // --- Dynamic Grid Calculations ---
  let gridElement = $state();
  let currentColumns = $state(1);

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

  let totalPages = $derived(Math.ceil(filteredItems.length / dynamicItemsPerPage));
  
  let paginatedItems = $derived(
    filteredItems.slice(currentPage * dynamicItemsPerPage, (currentPage + 1) * dynamicItemsPerPage)
  );

  $effect(() => {
    searchQuery;
    activeFilters;
    currentPage = 0;
  });

  $effect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      currentPage = totalPages - 1;
    }
  });

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

  // --- Modal Helpers ---
  function openModal(event, item) {
    event.preventDefault();
    activeModalItem = item;
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  }

  function closeModal() {
    activeModalItem = null;
    document.body.style.overflow = "";
  }

  // Format array/object data for the table safely
  function formatFieldValue(val) {
    if (Array.isArray(val)) {
      return val.map(v => typeof v === 'object' && v !== null ? v.name || v.nombre || v.id : String(v)).join(", ");
    } else if (typeof val === 'object' && val !== null) {
      return val.name || val.nombre || val.id;
    }
    return String(val);
  }
</script>

<div class="app-container">
  
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

  {#if totalPages > 1}
    <div class="pager-container">
      <button class="pager-btn outline" disabled={currentPage === 0} onclick={() => currentPage--}>«</button>
      <div class="page-numbers">{currentPage + 1} / {totalPages}</div>
      <button class="pager-btn outline" disabled={currentPage >= totalPages - 1} onclick={() => currentPage++}>»</button>
    </div>
  {/if}

  {#if filteredItems.length === 0}
     <div class="empty-message">
      {i18n.noRecordsFound}
     </div>
  {:else}
    <div class="gallery-grid" bind:this={gridElement}>
      {#each paginatedItems as item, index (item.id || index)}
        <!-- svelte-ignore a11y_invalid_attribute -->
        <a 
          href="{item.url || '#'}" 
          onclick={(e) => openModal(e, item)} 
          class="gallery-item"
        >
          <div class="image-wrapper">
            <!-- Grid explicitly uses THUMBNAILS first -->
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

  {#if totalPages > 1}
    <div class="pager-container">
      <button class="pager-btn outline" disabled={currentPage === 0} onclick={() => currentPage--}>«</button>
      <div class="page-numbers">{currentPage + 1} / {totalPages}</div>
      <button class="pager-btn outline" disabled={currentPage >= totalPages - 1} onclick={() => currentPage++}>»</button>
    </div>
  {/if}

  <!-- MODAL OVERLAY -->
  {#if activeModalItem}
    <dialog open class="mirla-modal" onclick={(e) => e.target.tagName === 'DIALOG' && closeModal()}>
      <article>
        <header class="modal-header">
          <button aria-label="Close" class="close" onclick={closeModal}>x</button>
          <h4>
            <a href="{activeModalItem.url || '#'}" target="_blank" rel="noopener noreferrer">
              {activeModalItem.name || activeModalItem.nombre || activeModalItem.id}
            </a>
          </h4>
        </header>
        
        <div class="modal-body">
          <div class="modal-image-container">
            <a href="{activeModalItem.url || '#'}" target="_blank" rel="noopener noreferrer">
              <!-- Modal explicitly uses full-res IMAGES first -->
              {#if activeModalItem.images && activeModalItem.images.length > 0}
                <img src={activeModalItem.images[0]} alt={activeModalItem.name || activeModalItem.nombre} loading="lazy" />
              {:else if activeModalItem.thumbnails && activeModalItem.thumbnails.length > 0}
                <img src={activeModalItem.thumbnails[0]} alt={activeModalItem.name || activeModalItem.nombre} loading="lazy" />
              {:else}
                <div class="no-img">{i18n.noImage}</div>
              {/if}
            </a>
          </div>

          {#if displayFields.length > 0}
            <div class="modal-metadata">
              <table class="striped">
                <tbody>
                  {#each displayFields as field}
                    {#if activeModalItem[field]}
                      <tr>
                        <th scope="row">{field.replace(/_/g, ' ')}</th>
                        <td>{formatFieldValue(activeModalItem[field])}</td>
                      </tr>
                    {/if}
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>
      </article>
    </dialog>
  {/if}

</div>

<style>
  @import '../styles/global-styles.css';

  /* --- MODAL STYLES --- */
  .mirla-modal {
    display: flex;
    position: fixed;
    z-index: 999;
    top: 0; right: 0; bottom: 0; left: 0;
    align-items: center;
    justify-content: center;
    width: inherit;
    min-width: 100%;
    height: inherit;
    min-height: 100%;
    padding: var(--pico-spacing);
    border: 0;
    background-color: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
    opacity: 1;
    transition: opacity 0.2s ease-in-out;
  }

  .mirla-modal article {
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    margin: 0;
    overflow-y: auto;
    border-radius: var(--pico-border-radius);
    box-shadow: var(--pico-box-shadow, 0 10px 30px rgba(0,0,0,0.3));
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: var(--pico-spacing);
    margin-bottom: var(--pico-spacing);
    border-bottom: 1px solid var(--mirla-border);
  }

  .modal-header h4 {
    margin: 0;
    font-size: 1.25rem;
  }

  .modal-header a {
    color: var(--pico-color);
    text-decoration: none;
    transition: color 0.2s;
  }

  .modal-header a:hover {
    color: var(--pico-primary);
  }

  .modal-body {
    display: grid;
    gap: 2rem;
    grid-template-columns: 1fr;
  }

  @media (min-width: 768px) {
    .modal-body {
      grid-template-columns: 1fr 1fr; /* Image left, table right */
      align-items: start;
    }
  }

  .modal-image-container img {
    width: 100%;
    height: auto;
    border-radius: var(--pico-border-radius);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transition: transform 0.2s;
  }

  .modal-image-container img:hover {
    transform: scale(1.02);
  }

  .modal-metadata table {
    width: 100%;
    margin: 0;
    font-size: 0.9rem;
  }

  .modal-metadata th {
    text-transform: capitalize;
    width: 35%;
    color: var(--pico-muted-color);
    font-weight: 600;
  }
</style>