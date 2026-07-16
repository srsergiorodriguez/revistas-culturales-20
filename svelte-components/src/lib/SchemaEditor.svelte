<script>
  let { 
    schema = $bindable(), 
    onRemove 
  } = $props();

  const dataTypes = ['text', 'number', 'date', 'link', 'youtube', 'latlong', 'iiif'];

  // --- Pagination Logic ---
  let currentPage = $state(1);
  const rowsPerPage = 10; // Adjust this number as needed
  let previousLength = $state(schema.length);

  let totalPages = $derived(Math.max(1, Math.ceil(schema.length / rowsPerPage)));
  let paginatedSchema = $derived(schema.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage));

  // Automatically go back a page if deleting the last item on the current page
  $effect(() => {
    // If exactly one field was added manually, jump to the new last page
    if (schema.length === previousLength + 1) {
      currentPage = totalPages;
    } 
    // If items were deleted and we are now out of bounds, snap back to the last valid page
    else if (currentPage > totalPages) {
      currentPage = totalPages;
    }
    
    // Always update the tracker
    previousLength = schema.length;
  });

  // Updated to mutate the field proxy directly instead of using the array index
  function handleNameChange(field, newName) {
    field.name = newName;
  }
</script>

<div class="table-wrapper">
  <table class="striped schema-table">
    <thead>
      <tr>
        <th scope="col" style="width: 25%;">Atributo</th>
        <th scope="col" style="width: 25%;">Tipo</th>
        <th scope="col" style="width: 40%;">Descripción</th>
        <th scope="col" style="width: 10%; text-align: center;">Acción</th>
      </tr>
    </thead>
    <tbody>
      <!-- Loop now uses paginatedSchema -->
      {#each paginatedSchema as field (field.id)}
        <tr>
          <td>
            {#if field.fixed}
              <span class="fixed-badge">{field.name}</span>
            {:else}
              <input 
                type="text" 
                value={field.name} 
                oninput={(e) => handleNameChange(field, e.target.value)}
                class="search-bar compact-input"
                placeholder="nombre_campo"
              />
            {/if}
          </td>
          <td>
            {#if field.fixed}
              <span class="fixed-badge">{field.type}</span>
            {:else}
              <select bind:value={field.type} class="filter-select compact-select">
                {#each dataTypes as option}
                  <option value={option}>{option}</option>
                {/each}
              </select>
            {/if}
          </td>
          <td>
            <input 
              type="text" 
              bind:value={field.desc} 
              class="search-bar compact-input"
              placeholder="Describe este campo..."
            />
          </td>
          <td style="text-align: center;">
            {#if !field.fixed}
              <button class="reset-btn delete-btn" aria-label="Borrar campo" onclick={() => onRemove(field.id)} title="Borrar">✕</button>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<!-- Pagination Controls -->
{#if totalPages > 1}
  <div class="pagination-controls">
    <button class="pager-btn outline" onclick={() => currentPage--} disabled={currentPage === 1}>«</button>
    <span class="page-info">Página {currentPage} de {totalPages}</span>
    <button class="pager-btn outline" onclick={() => currentPage++} disabled={currentPage === totalPages}>»</button>
  </div>
{/if}

<style>
  @import '../styles/global-styles.css';

  .schema-table { margin: 0; font-size: 0.9rem; width: 100%; min-width: max-content; border-collapse: collapse; }
  .table-wrapper { width: 100%; overflow-x: auto; scrollbar-width: thin; scrollbar-color: var(--pico-muted-border-color) transparent; }
  .compact-input, .compact-select { margin: 0 !important; padding: 0.3rem 1rem !important; font-size: 0.85rem !important; height: auto !important; width: 100% !important; min-width: 140px; box-sizing: border-box; }
  
  .fixed-badge {
    background: var(--pico-form-element-disabled-background-color);
    border: 1px solid var(--pico-muted-border-color);
    padding: 0.2rem 0.5rem;
    border-radius: var(--pico-border-radius);
    color: var(--pico-muted-color);
    font-weight: 600;
    font-family: monospace;
    font-size: 0.8rem;
    display: inline-block;
  }

  .delete-btn { padding: 0.2rem 0.5rem; color: var(--pico-del-color, #e74c3c); border-color: transparent; font-weight: bold; width: auto; }
  .delete-btn:hover { background-color: var(--pico-del-color, #e74c3c); color: white; border-color: var(--pico-del-color, #e74c3c); }

  /* Pagination Styles */
  .pagination-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--pico-muted-border-color);
  }
  .page-info {
    font-size: 0.85rem;
    color: var(--pico-muted-color);
  }
  .pager-btn {
    width: auto;
    padding: 0.2rem 1rem;
    font-size: 0.85rem;
    margin: 0;
  }
</style>