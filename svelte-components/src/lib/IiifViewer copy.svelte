<script>
  let { manifestUrl = "" } = $props();
  
  let imageUrl = $state("");
  let isLoading = $state(false);
  let errorMsg = $state("");

  $effect(() => {
    if (manifestUrl) {
      loadManifest(manifestUrl);
    } else {
      imageUrl = "";
      errorMsg = "";
    }
  });

  function extractImageFromManifest(data) {
    // Attempt 1: IIIF V3 (Presentation API 3.0)
    try {
      let body = data.items[0].items[0].items[0].body;
      if (Array.isArray(body)) body = body[0]; // Sometimes body is an array of annotations
      if (body && body.id) return body.id;
    } catch(e) {}

    // Attempt 2: IIIF V2 (Presentation API 2.1)
    try {
      return data.sequences[0].canvases[0].images[0].resource['@id'];
    } catch(e) {}

    return null;
  }

  async function loadManifest(url) {
    isLoading = true;
    errorMsg = "";
    imageUrl = "";

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("No se pudo acceder al manifiesto.");
      
      const data = await response.json();
      const extractedUrl = extractImageFromManifest(data);

      if (extractedUrl) {
        imageUrl = extractedUrl;
      } else {
        errorMsg = "Estructura de manifiesto no reconocida.";
      }
    } catch (err) {
      console.error(err);
      errorMsg = "Error de red o URL inválida.";
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="iiif-container">
  {#if isLoading}
    <div class="status-msg">Cargando documento...</div>
  {:else if errorMsg}
    <div class="status-msg error">{errorMsg}</div>
  {:else if imageUrl}
    <img src={imageUrl} alt="Documento IIIF" class="iiif-image" loading="lazy" />
  {:else}
    <div class="status-msg">Selecciona una fila con una URL válida...</div>
  {/if}
</div>

<style>
  .iiif-container {
    width: 100%;
    height: 100%;
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--pico-form-element-background-color, #f8f9fa);
    border: 1px dashed var(--pico-muted-border-color, #ccc);
    border-radius: var(--pico-border-radius, 8px);
    overflow: hidden;
  }

  .iiif-image {
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
    border-radius: calc(var(--pico-border-radius, 8px) / 2);
  }

  .status-msg {
    color: var(--pico-muted-color, #777);
    font-size: 0.9rem;
    font-style: italic;
    text-align: center;
    padding: 2rem;
  }

  .error {
    color: var(--pico-del-color, #e74c3c);
  }
</style>