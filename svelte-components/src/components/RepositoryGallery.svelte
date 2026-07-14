<svelte:options customElement="repository-gallery" />

<script>
  let { 
    key = "", 
    value = "",
    limit = "" 
  } = $props();

  const items = window.REPOSITORIES_DATA || [];

  const splitValues = (val) => {
    if (val === null || val === undefined) return [];
    if (typeof val !== 'string') return [String(val)];
    return val.split(/[;,]+/).map(s => s.trim()).filter(s => s !== "");
  };

  let filteredItems = $derived.by(() => {
    if (!key || !value) return items;

    let matches = items.filter(item => {
      const vals = splitValues(item[key.toLowerCase()]);
      return vals.includes(value);
    });

    const max = parseInt(limit, 10);
    if (!isNaN(max) && max > 0) {
      matches = matches.slice(0, max);
    }
    return matches;
  });
</script>

<div class="gallery-container">
  {#if items.length === 0}
      <div class="error-message">
        NO REPOSITORY DATA FOUND. Check plugin execution.
      </div>
  {:else if filteredItems.length === 0}
    <div class="empty-message">
      No repositories found for "{key}: {value}"
    </div>
  {:else}
    <div class="gallery-grid">
      {#each filteredItems as item, index (item.id || index)}
        <a href="{item.url || '#'}" target="_blank" rel="noopener noreferrer" class="gallery-item">
          <div class="image-wrapper">
            {#if item.images && item.images.length > 0}
              <img src={item.images[0]} alt={item.name || item.id} loading="lazy" />
            {:else}
              <div class="no-img">No Image</div>
            {/if}
          </div>
          <span class="item-label">{item.name || item.id}</span>
          {#if item.ciudad && item.pais}
             <span class="item-meta">{item.ciudad}, {item.pais}</span>
          {/if}
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  /* Inject the shared structural CSS into the Shadow DOM */
  @import '../styles/global-styles.css';
</style>