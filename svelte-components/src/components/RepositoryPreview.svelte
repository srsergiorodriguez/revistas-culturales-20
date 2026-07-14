<svelte:options customElement="repository-preview" />

<script>
  let { 
    id = "", 
    title = "", 
    alt = "", 
    page = "1" 
  } = $props();

  const items = window.REPOSITORIES_DATA || [];
  const siteDomain = window.CUSTOM_CONTEXT?.siteDomain || "";

  // Make sure we compare as strings in case IDs are numbers
  let found = $derived(items.find(d => String(d.id) === String(id)));
  let imageIndex = $derived(Math.max(0, Number(page) - 1));
</script>

{#if found}
  <div class="preview-card">
    <a href="{found.url || '#'}" target="_blank" rel="noopener noreferrer" class="preview-img-link">
      {#if found.images && found.images[imageIndex]}
        <img 
          src={found.images[imageIndex]} 
          title={title || found.name || found.nombre || id} 
          alt={alt || title || found.name || found.nombre || id}
          loading="lazy"
        />
      {:else}
        <div class="no-image-placeholder">No image available</div>
      {/if}
    </a>
    
    <a class="silent-link" href="{found.url || '#'}" target="_blank" rel="noopener noreferrer">
      {found.name || found.nombre || id}
    </a>
    
    {#if title}
      <p class="custom-title"><em>{title}</em></p>
    {/if}
  </div>
{:else}
  <div class="error-message">
    INCORRECT: CHECK THE ID "{id}"
  </div>
{/if}

<style>
  @import '../styles/global-styles.css';
  
  .no-image-placeholder {
    width: 100%;
    aspect-ratio: 1;
    background: var(--pico-muted-border-color, #eee);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--pico-muted-color, #999);
    border-radius: calc(var(--pico-border-radius, 8px) / 2);
  }
</style>