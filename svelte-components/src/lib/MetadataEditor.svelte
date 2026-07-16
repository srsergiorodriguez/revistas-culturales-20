<script>
  let {
    schema = [],
    metadata = $bindable(),
    activeRowId = $bindable(null) 
  } = $props();

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
        {#each metadata as row (row.id)}
          <tr class={activeRowId === row.id ? 'active-row' : ''}>
            {#each schema as field (field.id)}
              <td>
                <!-- Bound to field.id instead of field.name -->
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
</style>