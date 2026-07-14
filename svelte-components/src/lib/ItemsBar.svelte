<script>
  import { fade } from 'svelte/transition';
  let { items = [], siteDomain = "", onclose } = $props();

  // Pull translations from the global context with a safe fallback
  const i18n = window.CUSTOM_CONTEXT?.i18n || {
    resultsFound: "results found"
  };
</script>

{#if items.length > 0}
  <div class="items-bar" transition:fade={{ duration: 300 }}>
    <div class="items-bar-header">
      <span><strong>{items.length}</strong> {i18n.resultsFound}</span>
      <button onclick={onclose} aria-label="Close items bar">×</button>
    </div>
    <div class="items-thumb-grid">
      {#each items as item (item.id)}
        <a href="{item.url || '#'}" target="_blank" rel="noopener noreferrer" class="item-thumb">
          {#if item.images && item.images[0]}
            <img src={item.images[0]} alt={item.name || item.nombre || item.id} title={item.name || item.nombre || item.id} loading="lazy" />
          {:else}
            <div class="no-img"></div>
          {/if}
        </a>
      {/each}
    </div>
  </div>
{/if}

<style>
  @import '../styles/global-styles.css';
</style>