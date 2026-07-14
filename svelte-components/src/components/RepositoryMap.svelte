<svelte:options customElement="repository-map" />

<script>
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';
  import * as topojson from 'topojson-client';
  import ItemsBar from "$lib/ItemsBar.svelte"; // Ensure path is correct

  let { 
    latKey = "latitud",  // Expects the header for the latitude column
    lonKey = "longitud", // Expects the header for the longitude column
    color = "var(--pico-primary, #4a90e2)",
    accent = "var(--pico-secondary, #ffcc00)"
  } = $props();

  const metadata = window.REPOSITORIES_DATA || [];
  const siteDomain = window.CUSTOM_CONTEXT?.siteDomain || "";

  let svgElement = $state();
  let resizeObserver;
  let selectedItems = $state([]); 
  let activeCoordId = $state(null);
  let zoomHandler;
  
  let worldCountries = $state(null);

  // Updated Data Transformation for separate Lat/Lon columns
  let mapData = $derived.by(() => {
    if (!latKey || !lonKey || metadata.length === 0) return [];
    
    // Convert keys to lowercase to match PapaParse output
    const cleanLatKey = latKey.toLowerCase();
    const cleanLonKey = lonKey.toLowerCase();

    const validItems = metadata.filter(d => {
      const latVal = d[cleanLatKey];
      const lonVal = d[cleanLonKey];
      
      if (latVal === undefined || lonVal === undefined || latVal === "" || lonVal === "") return false;
      
      const lat = parseFloat(latVal);
      const lon = parseFloat(lonVal);
      return !isNaN(lat) && !isNaN(lon);
    });

    const groups = d3.group(validItems, d => {
      const lat = parseFloat(d[cleanLatKey]);
      const lon = parseFloat(d[cleanLonKey]);
      return `${lat.toFixed(4)},${lon.toFixed(4)}`;
    });
    
    return Array.from(groups, ([coordId, items]) => {
      const lat = parseFloat(items[0][cleanLatKey]);
      const lon = parseFloat(items[0][cleanLonKey]);
      return { coordId, lat, lon, items, count: items.length };
    });
  });

  function handleReset() {
    selectedItems = [];
    activeCoordId = null;
    if (svgElement) {
      d3.select(svgElement).selectAll(".map-marker")
        .transition().duration(300)
        .attr("fill", color)
        .attr("stroke-width", 1.5)
        .attr("r", d => d3.scaleSqrt().domain([1, d3.max(mapData, m => m.count)]).range([4, 12])(d.count));
      
      if (zoomHandler) {
        d3.select(svgElement).transition().duration(750)
          .call(zoomHandler.transform, d3.zoomIdentity);
      }
    }
  }

  function drawMap() {
    if (!svgElement || !worldCountries) return;

    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();

    const width = svgElement.parentElement.clientWidth;
    const height = 400;

    svg.attr("viewBox", [0, 0, width, height]);

    const projection = d3.geoNaturalEarth1().fitSize([width, height], worldCountries);
    const path = d3.geoPath(projection);

    const g = svg.append("g");

    g.selectAll("path")
      .data(worldCountries.features)
      .join("path")
      .attr("d", path)
      .attr("fill", "var(--pico-muted-color, #ccc)")
      .attr("fill-opacity", 0.3) 
      .attr("stroke", "var(--pico-background-color, #ffffff)")
      .attr("stroke-width", 0.5);

    const radiusScale = d3.scaleSqrt()
      .domain([1, d3.max(mapData, d => d.count) || 1])
      .range([4, 12]);

    const markers = g.selectAll("circle")
      .data(mapData)
      .join("circle")
      .attr("class", "map-marker")
      .attr("cx", d => projection([d.lon, d.lat])[0])
      .attr("cy", d => projection([d.lon, d.lat])[1])
      .attr("r", d => radiusScale(d.count))
      .attr("fill", d => (activeCoordId === d.coordId) ? accent : color)
      .attr("stroke", "var(--pico-background-color, #ffffff)")
      .attr("stroke-width", d => (activeCoordId === d.coordId) ? 3 : 1.5)
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        selectedItems = d.items;
        activeCoordId = d.coordId;

        g.selectAll(".map-marker")
          .transition().duration(200)
          .attr("fill", color)
          .attr("stroke-width", 1.5)
          .attr("r", m => radiusScale(m.count));

        d3.select(this)
          .transition().duration(200)
          .attr("fill", accent)
          .attr("stroke-width", 3)
          .attr("r", radiusScale(d.count) + 4); 
          
        const [x, y] = projection([d.lon, d.lat]);
        svg.transition().duration(750).call(
          zoomHandler.transform, 
          d3.zoomIdentity.translate(width / 2, height / 2).scale(3).translate(-x, -y)
        );
      });

    zoomHandler = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        markers.attr("r", d => (radiusScale(d.count) + (activeCoordId === d.coordId ? 4 : 0)) / event.transform.k)
               .attr("stroke-width", d => ((activeCoordId === d.coordId) ? 3 : 1.5) / event.transform.k);
      });

    svg.call(zoomHandler);
  }

  onMount(() => {
    d3.json("https://unpkg.com/world-atlas@2.0.2/countries-110m.json").then(data => {
      worldCountries = topojson.feature(data, data.objects.countries);
      requestAnimationFrame(drawMap);
    });

    resizeObserver = new ResizeObserver(() => requestAnimationFrame(drawMap));
    if (svgElement?.parentElement) resizeObserver.observe(svgElement.parentElement);
  });

  onDestroy(() => resizeObserver?.disconnect());
  
  $effect(() => { 
    mapData; color; accent; 
    if (worldCountries) drawMap(); 
  });
</script>

<!-- Swapped to the shared viz-container classes -->
<div class="viz-container">
  <!-- Small container adjustment specifically for maps to keep the bounding box visible -->
  <div class="viz-area map-border">
    {#if mapData.length === 0}
      <div class="empty-message map-empty-overlay">No valid geographic coordinates found.</div>
    {/if}
    <svg bind:this={svgElement}></svg>
    
    {#if activeCoordId}
      <button class="reset-viz-btn" onclick={handleReset} title="Reset Map">↺</button>
    {/if}
  </div>

  <ItemsBar 
    items={selectedItems} 
    {siteDomain} 
    onclose={handleReset} 
  />
</div>

<style>
  @import '../styles/global-styles.css';

  .map-border {
    border-radius: var(--pico-border-radius, 8px);
    border: 1px solid var(--pico-form-element-border-color, rgba(0,0,0,0.1));
    background: var(--pico-card-background-color, transparent);
    overflow: hidden;
  }

  /* Force the map SVG to 400px height (unlike the barchart which scales) */
  svg {
    height: 400px !important; 
    cursor: grab;
  }
  
  svg:active { cursor: grabbing; }

  /* Overlay the empty message directly onto the map box */
  .map-empty-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 5;
    background: var(--pico-card-background-color, rgba(255, 255, 255, 0.9));
  }
</style>