<svelte:options customElement="data-annotator" />

<script>
  import SchemaEditor from '$lib/SchemaEditor.svelte';
  import MetadataEditor from '$lib/MetadataEditor.svelte';
  import IiifViewer from '$lib/IiifViewer.svelte';

  let schema = $state([
    { id: 'p_id', name: 'id', type: 'text', desc: 'Identificador único', fixed: true }
  ]);
  
  let metadata = $state([]);
  let activeRowId = $state(null);

  let fileInputSchema;
  let fileInputMetadata;
  let fileInputProject;

  let iiifFieldId = $derived(schema.find(f => f.type === 'iiif')?.id);

  let currentManifestUrl = $derived.by(() => {
    if (!iiifFieldId || !activeRowId) return "";
    const row = metadata.find(r => r.id === activeRowId);
    return row ? row[iiifFieldId] || "" : "";
  });

  const generateId = (prefix) => prefix + '_' + Math.random().toString(36).substr(2, 9);

  function addSchemaField() {
    schema.push({ 
      id: generateId('p'), 
      name: `campo_${schema.length}`, 
      type: 'text', 
      desc: '', 
      fixed: false 
    });
  }

  function removeSchemaField(id) {
    const index = schema.findIndex(f => f.id === id);
    if (index !== -1 && !schema[index].fixed) {
      schema.splice(index, 1);
      metadata.forEach(row => delete row[id]);
    }
  }

  function addMetadataRow() {
    const newRow = { id: generateId('m') };
    const count = metadata.length + 1;
    
    schema.forEach(field => {
      if (field.id === 'p_id') {
        newRow[field.id] = `OBJ-${String(count).padStart(3, '0')}`;
      } else {
        newRow[field.id] = '';
      }
    });
    
    metadata.push(newRow);
    activeRowId = newRow.id; 
  }

  // --- JSON File Management ---
  function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Transpiles internal IDs to Human-Readable names before downloading JSON
  function exportMetadataJSON() {
    const exportData = metadata.map(row => {
      let obj = {};
      schema.forEach(field => {
        obj[field.name] = row[field.id] || '';
      });
      return obj;
    });
    downloadJSON(exportData, 'metadatos.json');
  }

  // --- CSV Export Logic ---
  function downloadCSV(filename) {
    if (metadata.length === 0) return;
    
    // 1. Use human-readable names for the headers
    const headers = schema.map(f => f.name);
    let csvContent = headers.join(',') + '\n';

    metadata.forEach(row => {
      // 2. Fetch the data using the internal IDs
      let rowValues = schema.map(field => {
        let val = row[field.id] === undefined || row[field.id] === null ? '' : String(row[field.id]);
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          val = '"' + val.replace(/"/g, '""') + '"';
        }
        return val;
      });
      csvContent += rowValues.join(',') + '\n';
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- CSV Import Logic ---
  function importCSV(text) {
    const rows = [];
    let curRow = [];
    let curVal = "";
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const nextC = text[i+1];
      
      if (c === '"' && inQuotes && nextC === '"') {
        curVal += '"'; i++; 
      } else if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        curRow.push(curVal);
        curVal = "";
      } else if ((c === '\n' || c === '\r') && !inQuotes) {
        if (c === '\r' && nextC === '\n') i++; 
        curRow.push(curVal);
        rows.push(curRow);
        curRow = [];
        curVal = "";
      } else {
        curVal += c;
      }
    }
    
    if (curVal !== "" || curRow.length > 0) {
      curRow.push(curVal);
      rows.push(curRow);
    }

    const cleanRows = rows.filter(r => r.length > 1 || r[0] !== "");
    if (cleanRows.length < 2) return;

    const headers = cleanRows[0];
    const newMetadata = cleanRows.slice(1).map(row => {
      let obj = { id: generateId('m') };
      headers.forEach((h, idx) => {
        if (h) {
          // 3. Find the internal ID using the human-readable header name
          const field = schema.find(f => f.name === h.trim());
          if (field) obj[field.id] = row[idx] || '';
        }
      });
      return obj;
    });
    
    metadata = newMetadata;
  }

  function handleFileUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      try {
        // Route CSV files to the custom parser
        if (file.name.toLowerCase().endsWith('.csv') && type === 'metadata') {
          importCSV(content);
        } else {
          // Standard JSON parsing
          const parsed = JSON.parse(content);
          if (type === 'schema') {
            schema = parsed;
          } else if (type === 'metadata') {
            // Transpile human-readable JSON keys back to internal schema IDs
            metadata = parsed.map(row => {
              let obj = { id: generateId('m') };
              for (const [key, value] of Object.entries(row)) {
                const field = schema.find(f => f.name === key);
                if (field) obj[field.id] = value;
              }
              return obj;
            });
          } else if (type === 'project') {
            if (parsed.schema) schema = parsed.schema;
            if (parsed.metadata) metadata = parsed.metadata;
          }
        }
      } catch (err) {
        alert('Error al leer el archivo. Verifica que el formato sea correcto.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  }

  function loadDefaultSchema() {
    schema = [
      { id: 'p_id', name: 'id', type: 'text', desc: 'Identificador único', fixed: true },
      { id: generateId('p'), name: 'nombre', type: 'text', desc: 'Nombre del objeto', fixed: false },
      { id: generateId('p'), name: 'fecha', type: 'date', desc: 'Fecha de creación', fixed: false },
      { id: generateId('p'), name: 'descripción', type: 'text', desc: 'Descripción detallada', fixed: false },
      { id: generateId('p'), name: 'url', type: 'link', desc: 'URL de referencia', fixed: false }
    ];
  }
</script>

<!-- Hidden inputs for file dialogues (Updated metadata to accept both formats) -->
<input type="file" bind:this={fileInputProject} accept=".json" style="display: none;" onchange={(e) => handleFileUpload(e, 'project')} />
<input type="file" bind:this={fileInputSchema} accept=".json" style="display: none;" onchange={(e) => handleFileUpload(e, 'schema')} />
<input type="file" bind:this={fileInputMetadata} accept=".json,.csv" style="display: none;" onchange={(e) => handleFileUpload(e, 'metadata')} />

<div class="app-container">
  
  <div class="menu-bar">
    <details class="dropdown file-menu">
      <!-- svelte-ignore a11y_no_redundant_roles -->
      <summary role="button" class="outline secondary menu-btn">Menú</summary>
      <ul dir="rtl">
        <li><button class="dropdown-btn" onclick={() => fileInputProject.click()}>Abrir Proyecto</button></li>
        <li><button class="dropdown-btn" onclick={() => downloadJSON({ schema, metadata }, 'proyecto_completo.json')}>Guardar Proyecto</button></li>
        <li><hr /></li>
        <li><button class="dropdown-btn" onclick={() => fileInputSchema.click()}>Cargar Esquema</button></li>
        <li><button class="dropdown-btn" onclick={() => downloadJSON(schema, 'esquema.json')}>Guardar Esquema</button></li>
        <li><hr /></li>
        <!-- Grouped metadata interactions logically -->
        <li><button class="dropdown-btn" onclick={() => fileInputMetadata.click()}>Cargar Metadatos (JSON/CSV)</button></li>
        <li><button class="dropdown-btn" onclick={exportMetadataJSON}>Guardar Metadatos (JSON)</button></li>
        <li><button class="dropdown-btn" onclick={() => downloadCSV('metadatos.csv')}>Guardar Metadatos (CSV)</button></li>
        <li><hr /></li>
        <li><button class="dropdown-btn" onclick={loadDefaultSchema}>Esquema por Defecto</button></li>
      </ul>
    </details>
  </div>

  <div class="annotator-grid {iiifFieldId ? 'has-iiif' : ''}">
    
    <div class="data-column">
      <div class="controls-container">
        <div class="section-header">
          <h3 style="margin: 0;">Esquema de Datos</h3>
          <button class="pager-btn outline btn-action" onclick={addSchemaField}>+ Añadir Campo</button>
        </div>
        <SchemaEditor bind:schema={schema} onRemove={removeSchemaField} />
      </div>

      <div class="controls-container">
        <div class="section-header">
          <h3 style="margin: 0;">Anotaciones</h3>
          <button class="pager-btn outline btn-action" onclick={addMetadataRow}>+ Añadir Fila</button>
        </div>
        <MetadataEditor {schema} bind:metadata={metadata} bind:activeRowId={activeRowId} />
      </div>
    </div>

    {#if iiifFieldId}
      <div class="preview-column controls-container">
        <div class="section-header">
          <h3 style="margin: 0;">Visor de Documento</h3>
          <span style="font-size: 0.75rem; color: var(--pico-muted-color);">IIIF Manifest</span>
        </div>
        <IiifViewer manifestUrl={currentManifestUrl} />
      </div>
    {/if}

  </div>
</div>

<style>
  @import '../styles/global-styles.css';

  .menu-bar {
    display: flex;
    justify-content: flex-start;
    margin-bottom: 1.5rem;
  }

  .file-menu {
    margin: 0;
  }
  .file-menu summary {
    margin-bottom: 0;
    padding: 0.4rem 1rem;
  }
  .file-menu ul {
    min-width: 250px; /* Widened slightly to accommodate the new JSON/CSV labels */
  }
  .file-menu hr {
    margin: 0.5rem 0;
  }

  .dropdown-btn {
    width: 100%;
    text-align: right; 
    background: transparent;
    border: none;
    color: var(--pico-dropdown-color);
    padding: calc(var(--pico-nav-link-spacing-vertical) * 0.5) var(--pico-nav-link-spacing-horizontal);
    margin: 0;
    font-size: 1rem;
    font-weight: normal;
    border-radius: 0;
    box-shadow: none;
    cursor: pointer; 
    transition: color 0.2s ease, background-color 0.2s ease;
  }

  .menu-btn {
    cursor: pointer;
  }
  
  .dropdown-btn:hover,
  .dropdown-btn:focus,
  .menu-btn:hover,
  .menu-btn:focus {
    background-color: var(--pico-dropdown-hover-background-color);
    color: var(--pico-primary); 
    text-decoration: underline; 
    outline: none;
    box-shadow: none;
  }

  .annotator-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; transition: all 0.3s ease; }
  
  @media (min-width: 992px) {
    .annotator-grid.has-iiif { grid-template-columns: 3fr 2fr; align-items: start; }
  }

  .section-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 1rem; padding-bottom: 0.8rem; border-bottom: 1px solid var(--pico-muted-border-color);
  }

  .btn-action { padding: 0.3rem 1rem; font-size: 0.85rem; width: auto; margin: 0; }
  .data-column { min-width: 0; }

  /* Makes the viewer stick to the top of the viewport when scrolling down */
  .preview-column {
    position: sticky;
    top: 2rem;
    z-index: 5;
  }
</style>