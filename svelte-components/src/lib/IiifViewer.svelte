<script>
  let { manifestUrl = "" } = $props();
  
  // We keep the raw variable to bypass Svelte 5 Proxy wrapping in the Shadow DOM
  let viewerContainer; 
  let viewerInstance = null;
  let resizeObserver = null;
  
  let isLoading = $state(false);
  let errorMsg = $state("");

  $effect(() => {
    if (manifestUrl) {
      loadManifest(manifestUrl);
    } else {
      cleanupViewer();
    }
    
    return () => cleanupViewer();
  });

  function cleanupViewer() {
    if (resizeObserver && viewerContainer) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (viewerInstance) {
      viewerInstance.destroy();
      viewerInstance = null;
    }
    errorMsg = "";
  }

  function extractTileSources(data) {
    let sources = [];
    
    const addSource = (id) => {
      if (!id) return;
      const cleanId = id.replace(/\/$/, '').replace(/\/info\.json$/, '');
      sources.push(cleanId + '/info.json');
    };

    try {
      if (data.items) {
        data.items.forEach(canvas => {
          try {
            let body = canvas.items[0].items[0].body;
            if (Array.isArray(body)) body = body[0];
            
            let service = body.service;
            if (Array.isArray(service)) service = service[0];
            
            if (service && (service.id || service['@id'])) {
              addSource(service.id || service['@id']);
            } else if (body.id) {
              sources.push({ type: 'image', url: body.id });
            }
          } catch (e) {
            console.warn("Skipped a canvas due to variance.");
          }
        });
      } 
      else if (data.sequences) {
        data.sequences[0].canvases.forEach(canvas => {
          try {
            let service = canvas.images[0].resource.service;
            if (Array.isArray(service)) service = service[0];

            if (service && (service['@id'] || service.id)) {
              addSource(service['@id'] || service.id);
            } else if (canvas.images[0].resource['@id']) {
               sources.push({ type: 'image', url: canvas.images[0].resource['@id'] });
            }
          } catch(e) {
            console.warn("Skipped a canvas due to variance.");
          }
        });
      }
    } catch (e) {
      console.error("Critical error extracting tile sources:", e);
    }

    return sources;
  }

  async function loadManifest(url) {
    isLoading = true;
    errorMsg = "";
    cleanupViewer();

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("No se pudo acceder al manifiesto.");
      
      const data = await response.json();
      const sources = extractTileSources(data);

      if (sources.length > 0) {
        // Keeps a small delay to make sure Svelte's grid animation finishes opening
        await new Promise(r => setTimeout(r, 350));
        await initOSD(sources);
      } else {
        throw new Error("No se encontraron imágenes en el manifiesto.");
      }
    } catch (err) {
      console.error(err);
      errorMsg = err.message || "Error de red o manifiesto inválido.";
    } finally {
      isLoading = false;
    }
  }

  async function initOSD(sources) {
    if (!window.OpenSeadragon) {
      await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.1/openseadragon.min.js";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }

    if (!viewerContainer) return;

    viewerInstance = window.OpenSeadragon({
      element: viewerContainer,
      // 1. Point directly to the modern Benomrans icons CDN
      prefixUrl: "https://cdn.jsdelivr.net/gh/Benomrans/openseadragon-icons@main/images/", 
      tileSources: sources,
      sequenceMode: sources.length > 1,
      showReferenceStrip: sources.length > 1,
      crossOriginPolicy: "Anonymous", 
      
      // 2. Disable fullscreen option to guarantee layout stability
      showFullPageControl: false,
      
      animationTime: 0.5,
      blendTime: 0.1,
      constrainDuringPan: true,
      maxZoomPixelRatio: 2,
      visibilityRatio: 1,
      zoomPerScroll: 1.5,
      background: "transparent"
    });

    // Automatically recalculates canvas boundaries when layout sizes shift
    resizeObserver = new ResizeObserver(() => {
      if (viewerInstance && viewerInstance.viewport) {
        viewerInstance.viewport.resize();
      }
    });
    resizeObserver.observe(viewerContainer);
  }
</script>

<div class="iiif-container">
  
  <div 
    bind:this={viewerContainer} 
    class="osd-wrapper"
  ></div>
  
  {#if isLoading || errorMsg || !manifestUrl}
    <div class="status-overlay">
      {#if isLoading}
        Cargando documento y mosaicos IIIF...
      {:else if errorMsg}
        <span class="error">{errorMsg}</span>
      {:else}
        Selecciona una fila con una URL válida...
      {/if}
    </div>
  {/if}

</div>

<style>
  .iiif-container {
    position: relative;
    width: 100%;
    height: 500px; 
    border: 1px solid var(--pico-muted-border-color, #ccc);
    border-radius: var(--pico-border-radius, 8px);
    overflow: hidden;
    background-color: var(--pico-form-element-background-color, #f8f9fa);
  }

  .osd-wrapper {
    width: 100%;
    height: 100%;
    background-color: var(--pico-form-element-background-color, #f8f9fa);
  }

  :global(.openseadragon-container img),
  :global(.openseadragon-canvas img),
  :global(.openseadragon-container canvas) {
    max-width: none !important;
    max-height: none !important;
    background-color: transparent !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  :global(.openseadragon-container) {
    background-color: transparent !important;
  }

  .status-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--pico-form-element-background-color, #f8f9fa);
    z-index: 10;
    color: var(--pico-muted-color, #777);
    font-size: 0.95rem;
    font-style: italic;
    text-align: center;
    padding: 2rem;
    pointer-events: none;
  }

  .error {
    color: var(--pico-del-color, #e74c3c);
  }
</style>