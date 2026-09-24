<svelte:options customElement="data-annotator" />

<script>
  import SchemaEditor from '$lib/SchemaEditor.svelte';
  import MetadataEditor from '$lib/MetadataEditor.svelte';
  import IiifViewer from '$lib/IiifViewer.svelte';

  const generateId = (prefix) => prefix + '_' + Math.random().toString(36).substr(2, 9);

  function getDefaultSchema() {
    return [
      { id: 'p_id', name: 'id', type: 'text', desc: 'Identificador único', fixed: true },
      { id: generateId('p'), name: 'titulo', type: 'text', desc: 'Título del artículo (dcterms:title)', fixed: false },
      { id: generateId('p'), name: 'numero_fasciculo', type: 'text', desc: 'Número del fascículo (schema:issueNumber)', fixed: false },
      { id: generateId('p'), name: 'publicacion', type: 'text', desc: 'Publicación o revista', fixed: false },
      { id: generateId('p'), name: 'fecha', type: 'date', desc: 'Fecha de publicación (dcterms:date)', fixed: false },
      { id: generateId('p'), name: 'editor', type: 'text', desc: 'Editor de la revista (schema:editor)', fixed: false },
      { id: generateId('p'), name: 'editorial', type: 'text', desc: 'Editorial (schema:publisher)', fixed: false },
      { id: generateId('p'), name: 'autor', type: 'text', desc: 'Autor del artículo (dcterms:creator)', fixed: false },
      { id: generateId('p'), name: 'seudonimo', type: 'text', desc: 'Seudónimo (skos:altLabel)', fixed: false },
      { id: generateId('p'), name: 'idioma', type: 'text', desc: 'Idioma (schema:inLanguage)', fixed: false },
      { id: generateId('p'), name: 'idioma_original', type: 'text', desc: 'Idioma original (dcterms:language)', fixed: false },
      { id: generateId('p'), name: 'paginacion', type: 'text', desc: 'Paginación (bf:extent)', fixed: false },
      { id: generateId('p'), name: 'colaborador', type: 'text', desc: 'Traductor u otro colaborador (dcterms:contributor)', fixed: false },
      { id: generateId('p'), name: 'rol', type: 'text', desc: 'Rol del colaborador (bf:role)', fixed: false },
      { id: generateId('p'), name: 'obra_original', type: 'text', desc: 'Obra original (bf:translationOf)', fixed: false },
      { id: generateId('p'), name: 'genero', type: 'text', desc: 'Género (bf:genreForm)', fixed: false },
      { id: generateId('p'), name: 'tipo_recurso', type: 'text', desc: 'Tipo de recurso (dcterms:type)', fixed: false },
      { id: generateId('p'), name: 'manifiesto_iiif', type: 'iiif', desc: 'URL del manifiesto IIIF para visor', fixed: false }
    ];
  }

  let schema = $state(getDefaultSchema());
  let metadata = $state([]);
  let activeRowId = $state(null);

  // --- Lógica del borde arrastrable (Resizer) ---
  let leftWidth = $state(60); 
  let isDragging = $state(false);
  let gridContainer; // Variable para enlazar el DOM internamente y saltarse el Shadow DOM

  function startDrag(e) {
    e.preventDefault();
    isDragging = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  function onDrag(e) {
    if (!isDragging || !gridContainer) return; // Se usa la variable local en vez de querySelector
    
    const rect = gridContainer.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    
    if (newWidth > 20 && newWidth < 80) {
      leftWidth = newWidth;
    }
  }

  function stopDrag() {
    if (isDragging) {
      isDragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }

  let fileInputSchema;
  let fileInputMetadata;
  let fileInputProject;

  let iiifFieldId = $derived(schema.find(f => f.type === 'iiif')?.id);

  let currentManifestUrl = $derived.by(() => {
    if (!iiifFieldId || !activeRowId) return "";
    const row = metadata.find(r => r.id === activeRowId);
    return row ? row[iiifFieldId] || "" : "";
  });

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

  function clearAll() {
    if (confirm("¿Estás seguro de que deseas borrar todo el esquema y los datos actuales?")) {
      schema = [{ id: 'p_id', name: 'id', type: 'text', desc: 'Identificador único', fixed: true }];
      metadata = [];
      activeRowId = null;
    }
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
    const headers = schema.map(f => f.name);
    let csvContent = headers.join(',') + '\n';

    metadata.forEach(row => {
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
        if (file.name.toLowerCase().endsWith('.csv') && type === 'metadata') {
          importCSV(content);
        } else {
          const parsed = JSON.parse(content);
          if (type === 'schema') {
            schema = parsed;
          } else if (type === 'metadata') {
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
    schema = getDefaultSchema();
  }
</script>

<svelte:window onmousemove={onDrag} onmouseup={stopDrag} />

<input type="file" bind:this={fileInputProject} accept=".json" style="display: none;" onchange={(e) => handleFileUpload(e, 'project')} />
<input type="file" bind:this={fileInputSchema} accept=".json" style="display: none;" onchange={(e) => handleFileUpload(e, 'schema')} />
<input type="file" bind:this={fileInputMetadata} accept=".json,.csv" style="display: none;" onchange={(e) => handleFileUpload(e, 'metadata')} />

<div class="app-container">
  
  <div class="menu-bar">
    <details class="dropdown file-menu">
      <!-- svelte-ignore a11y_no_redundant_roles -->
      <summary role="button" class="outline secondary menu-btn">Menú</summary>
      <ul dir="rtl">
        <li><button class="dropdown-btn" onclick={() => fileInputProject.click()}>Abrir proyecto</button></li>
        <li><button class="dropdown-btn" onclick={() => downloadJSON({ schema, metadata }, 'proyecto_completo.json')}>Guardar proyecto</button></li>
        <li><hr /></li>
        <li><button class="dropdown-btn" onclick={() => fileInputSchema.click()}>Cargar esquema</button></li>
        <li><button class="dropdown-btn" onclick={() => downloadJSON(schema, 'esquema.json')}>Guardar esquema</button></li>
        <li><hr /></li>
        <li><button class="dropdown-btn" onclick={() => fileInputMetadata.click()}>Cargar metadatos (JSON/CSV)</button></li>
        <li><button class="dropdown-btn" onclick={exportMetadataJSON}>Guardar metadatos (JSON)</button></li>
        <li><button class="dropdown-btn" onclick={() => downloadCSV('metadatos.csv')}>Guardar metadatos (CSV)</button></li>
        <li><hr /></li>
        <li><button class="dropdown-btn" onclick={loadDefaultSchema}>Esquema por defecto</button></li>
        <li><button class="dropdown-btn" onclick={clearAll}>Proyecto en blanco</button></li>
      </ul>
    </details>
  </div>

  <div bind:this={gridContainer} class="annotator-grid {iiifFieldId ? 'has-iiif' : ''}" 
       style={iiifFieldId ? `grid-template-columns: ${leftWidth}fr 12px ${100 - leftWidth}fr;` : ''}>
    
    <div class="data-column">
      <div class="controls-container">
        <div class="section-header">
          <h3 style="margin: 0;">Esquema de datos</h3>
          <button class="pager-btn outline btn-action" onclick={addSchemaField}>+ Añadir campo</button>
        </div>
        <SchemaEditor bind:schema={schema} onRemove={removeSchemaField} />
      </div>

      <div class="controls-container" style="margin-top: 0.75rem;">
        <div class="section-header">
          <h3 style="margin: 0;">Anotaciones</h3>
          <button class="pager-btn outline btn-action" onclick={addMetadataRow}>+ Añadir fila</button>
        </div>
        <MetadataEditor {schema} bind:metadata={metadata} bind:activeRowId={activeRowId} />
      </div>
    </div>

    {#if iiifFieldId}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="resizer" onmousedown={startDrag} title="Arrastrar para redimensionar">
        <div class="resizer-handle"></div>
      </div>

      <div class="preview-column controls-container">
        <div class="section-header">
          <h3 style="margin: 0;">Visor de documento</h3>
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
    margin-bottom: 1rem;
  }

  .file-menu { margin: 0; }
  
  /* Asegura que el summary tenga el cursor interactivo */
  .file-menu summary { 
    margin-bottom: 0; 
    padding: 0.4rem 1rem; 
    cursor: pointer !important;
  }
  
  .file-menu ul { min-width: 260px; }
  .file-menu hr { margin: 0.5rem 0; }

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

  .annotator-grid { display: grid; grid-template-columns: 1fr; gap: 0.75rem; transition: none; align-items: start; }

  .section-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 1rem; padding-bottom: 0.8rem; border-bottom: 1px solid var(--pico-muted-border-color);
  }

  .btn-action { padding: 0.3rem 1rem; font-size: 0.85rem; width: auto; margin: 0; }
  .data-column { min-width: 0; }

  .resizer {
    width: 12px;
    height: 100vh;
    position: sticky;
    top: 2rem;
    cursor: col-resize;
    display: flex;
    justify-content: center;
    align-items: center;
    background: transparent;
    border-radius: 4px;
    transition: background 0.2s;
    user-select: none;
  }

  .resizer:hover, .resizer:active {
    background: var(--pico-muted-border-color);
  }

  .resizer-handle {
    width: 4px;
    height: 40px;
    background: var(--pico-muted-color);
    border-radius: 2px;
  }

  .preview-column {
    position: sticky;
    top: 2rem;
    z-index: 5;
  }
</style>