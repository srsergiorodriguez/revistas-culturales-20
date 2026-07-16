<script>
  let {
    schema = [],
    metadata = $bindable(),
    activeRowId = $bindable(null) 
  } = $props();

  // --- Pagination Logic ---
  let currentPage = $state(1);
  const rowsPerPage = 10;
  let previousLength = $state(metadata.length);

  let totalPages = $derived(Math.max(1, Math.ceil(metadata.length / rowsPerPage)));
  let paginatedMetadata = $derived(metadata.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage));

  $effect(() => {
    // If exactly one row was added manually, jump to the new last page
    if (metadata.length === previousLength + 1) {
      currentPage = totalPages;
    } 
    // If rows were deleted and we are now out of bounds, snap back to the last valid page
    else if (currentPage > totalPages) {
      currentPage = totalPages;
    }
    
    // Always update the tracker
    previousLength = metadata.length;
  });

  function removeRow(id) {
    metadata = metadata.filter(row => row.id !== id);
    if (activeRowId === id) activeRowId = null;
  }

  function updateCell(rowId, fieldId, value) {
    const rowIndex = metadata.findIndex(r => r.id === rowId);
    if (rowIndex !== -1) {
      metadata[rowIndex][fieldId] = value;
    }
  }
</script>

<div class="table-wrapper">
  {#if metadata.length === 0}
    <div class="empty-message">No hay anotaciones. Añade una fila para comenzar.</div>
  {:else}
    <table class="striped metadata-table">
      <thead>
        <tr>
          {#each schema as field (field.id)}
            <th scope="col">
              {field.name}
              <span class="type-badge">{field.type}</span>
            </th>
          {/each}
          <th scope="col" style="text-align: center; width: 60px;">Acción</th>
        </tr>
      </thead>
      <tbody>
        <!-- Loop now uses paginatedMetadata -->
        {#each paginatedMetadata as row (row.id)}
          <tr class={activeRowId === row.id ? 'active-row' : ''}>
            {#each schema as field (field.id)}
              <td>
                <input
                  type="text"
                  value={row[field.id] || ''}
                  oninput={(e) => updateCell(row.id, field.id, e.target.value)}
                  onfocus={() => activeRowId = row.id} 
                  class="search-bar compact-input"
                  placeholder={field.id === 'p_id' ? 'OBJ-001' : '...'}
                />
              </td>
            {/each}
            <td style="text-align: center;">
              <button class="reset-btn delete-btn" aria-label="Borrar fila" onclick={() => removeRow(row.id)} title="Borrar">✕</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    <!-- Pagination Controls -->
    {#if totalPages > 1}
      <div class="pagination-controls">
        <button class="pager-btn outline" onclick={() => currentPage--} disabled={currentPage === 1}>Anterior</button>
        <span class="page-info">Página {currentPage} de {totalPages}</span>
        <button class="pager-btn outline" onclick={() => currentPage++} disabled={currentPage === totalPages}>Siguiente</button>
      </div>
    {/if}
  {/if}
</div>

<style>
  @import '../styles/global-styles.css';

  .active-row td { background-color: var(--pico-form-element-background-color) !important; }
  .table-wrapper { width: 100%; max-width: 100%; overflow-x: auto; scrollbar-width: thin; scrollbar-color: var(--pico-muted-border-color) transparent; }
  .metadata-table { margin: 0; font-size: 0.85rem; width: 100%; min-width: max-content; }
  .metadata-table th { white-space: nowrap; padding-bottom: 0.8rem; padding-right: 1rem; }
  .compact-input { margin: 0 !important; padding: 0.3rem 1rem !important; font-size: 0.85rem !important; height: auto !important; width: 100% !important; min-width: 150px; box-sizing: border-box; }
  .type-badge { display: block; font-size: 0.65rem; color: var(--pico-muted-color); font-weight: normal; text-transform: uppercase; margin-top: 0.2rem; }
  .delete-btn { padding: 0.2rem 0.5rem; color: var(--pico-del-color, #e74c3c); border-color: transparent; font-weight: bold; width: auto; margin: 0 auto; }
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