<script>
  let { 
    schema = $bindable(), 
    onRemove 
  } = $props();

  const dataTypes = ['text', 'number', 'date', 'link', 'latlong', 'iiif'];

  function handleNameChange(index, newName) {
    const cleanName = newName.trim().replace(/\s+/g, '_').toLowerCase();
    schema[index].name = cleanName;
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
      {#each schema as field, i (field.id)}
        <tr>
          <td>
            {#if field.fixed}
              <span class="fixed-badge">{field.name}</span>
            {:else}
              <input 
                type="text" 
                value={field.name} 
                oninput={(e) => handleNameChange(i, e.target.value)}
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
              <button 
                class="reset-btn delete-btn" 
                aria-label="Borrar campo"
                onclick={() => onRemove(field.id)}
                title="Borrar"
              >
                ✕
              </button>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  /* This is the crucial missing line that makes the inputs look correct! */
  @import '../styles/global-styles.css';

  .schema-table {
    margin: 0;
    font-size: 0.9rem;
  }

  /* 1. Add the robust wrapper class */
  .table-wrapper {
    width: 100%;
    overflow-x: auto;
    /* Optional: styling the scrollbar to make it look sleek */
    scrollbar-width: thin;
    scrollbar-color: var(--pico-muted-border-color) transparent;
  }

  /* 2. Force the table to expand rather than crush the inputs */
  .schema-table {
    margin: 0;
    font-size: 0.9rem;
    width: 100%;
    min-width: max-content; /* This is the magic property */
    border-collapse: collapse;
  }

  /* 3. Ensure inputs stay inside their cells */
  .compact-input, .compact-select {
    margin: 0 !important;
    padding: 0.3rem 1rem !important;
    font-size: 0.85rem !important;
    height: auto !important;
    width: 100% !important; /* Force to cell width */
    min-width: 140px; /* Minimum usable size */
    box-sizing: border-box;
  }

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

  .delete-btn {
    padding: 0.2rem 0.5rem;
    color: var(--pico-del-color, #e74c3c);
    border-color: transparent;
    font-weight: bold;
    width: auto;
  }

  .delete-btn:hover {
    background-color: var(--pico-del-color, #e74c3c);
    color: white;
    border-color: var(--pico-del-color, #e74c3c);
  }
</style>