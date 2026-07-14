<svelte:options customElement="repository-timeline" />

<script>
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';
  import ItemsBar from "$lib/ItemsBar.svelte";

  let { 
    startKey = "fecha_inicio", 
    endKey = "fecha_fin",
    yKey = "coleccion", 
    itemsPerPage = "10", // Added default items per page limit
    color = "var(--pico-primary, #4a90e2)", 
    accent = "var(--pico-secondary, #ffcc00)" 
  } = $props();

  const metadata = window.REPOSITORIES_DATA || [];
  const siteDomain = window.CUSTOM_CONTEXT?.siteDomain || "";

  let svgElement = $state();
  let resizeObserver;
  let selectedItems = $state([]);
  let activeCategory = $state(null);
  let zoomHandler;
  
  // Pagination State
  let currentPage = $state(0);

  function parseMirlaDate(val) {
    if (!val) return null;
    if ((typeof val === 'number' && val > 1000 && val < 2100) || 
        (typeof val === 'string' && /^\d{4}$/.test(val.trim()))) {
      return new Date(parseInt(val), 0, 1);
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  let timelineData = $derived.by(() => {
    if (!startKey || !endKey || !yKey || metadata.length === 0) return [];
    
    const sk = startKey.toLowerCase();
    const ek = endKey.toLowerCase();
    const yk = yKey.toLowerCase();

    const validItems = metadata.map(d => {
      const start = parseMirlaDate(d[sk]);
      const end = parseMirlaDate(d[ek]);
      const label = d[yk];
      return { item: d, start, end, label };
    }).filter(d => d.start && d.end && d.label && d.start <= d.end);

    const groups = d3.group(validItems, d => d.label);
    
    return Array.from(groups, ([label, groupData]) => {
      const minStart = d3.min(groupData, d => d.start);
      const maxEnd = d3.max(groupData, d => d.end);
      return {
        label,
        start: minStart,
        end: maxEnd,
        items: groupData.map(g => g.item),
        count: groupData.length
      };
    }).sort((a, b) => d3.ascending(a.start, b.start));
  });

  // Pagination Logic
  let limit = $derived(parseInt(itemsPerPage, 10) || 10);
  let totalPages = $derived(Math.ceil(timelineData.length / limit));
  let paginatedData = $derived(
    timelineData.slice(currentPage * limit, (currentPage + 1) * limit)
  );

  // Keep pagination in bounds if data changes
  $effect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      currentPage = totalPages - 1;
    }
  });

  // Calculate height based on the currently visible page of data
  let chartHeight = $derived(paginatedData.length > 0 ? (paginatedData.length * 55) + 60 : 200);

  function handleReset() {
    selectedItems = [];
    activeCategory = null;
    if (svgElement) {
      const svg = d3.select(svgElement);
      svg.selectAll(".timeline-bar")
        .transition().duration(300)
        .attr("fill", color)
        .attr("opacity", 1);

      if (zoomHandler) {
        svg.transition().duration(750)
          .ease(d3.easeQuadOut)
          .call(zoomHandler.transform, d3.zoomIdentity);
      }
    }
  }

  function drawTimeline() {
    if (!svgElement || paginatedData.length === 0) return;

    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();

    const width = svgElement.parentElement.clientWidth;
    const height = chartHeight;
    const margin = { top: 20, right: 40, bottom: 40, left: 250 };

    svg.attr("viewBox", [0, 0, width, height]);

    const defs = svg.append("defs");
    defs.append("clipPath")
      .attr("id", "clip-timeline")
      .append("rect")
      .attr("x", margin.left)
      .attr("y", 0)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height);

    // Global X Scale: Keeps context between pages by using the full timelineData domain
    const x = d3.scaleTime()
      .domain([d3.min(timelineData, d => d.start), d3.max(timelineData, d => d.end)])
      .range([margin.left, width - margin.right])
      .nice();

    // Local Y Scale: Maps only the currently paginated items
    const y = d3.scaleBand()
      .domain(paginatedData.map(d => d.label))
      .range([margin.top, height - margin.bottom])
      .padding(0.3);

    const xAxis = (g, scale) => g
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(scale).tickSizeOuter(0))
      .attr("font-size", null)
      .attr("font-family", null)
      .selectAll(".tick text")
      .attr("font-size", "0.8rem");

    const yAxis = g => g
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).tickSizeOuter(0))
      .attr("font-size", null)
      .attr("font-family", null)
      .selectAll(".tick text")
      .attr("font-size", "0.8rem")
      .call(wrapText, margin.left - 15);

    const gx = svg.append("g").attr("class", "axis x-axis");
    const gy = svg.append("g").attr("class", "axis y-axis").call(yAxis);
    
    const g = svg.append("g").attr("clip-path", "url(#clip-timeline)");

    const bars = g.selectAll("rect")
      .data(paginatedData)
      .join("rect")
        .attr("class", "timeline-bar")
        .attr("y", d => y(d.label))
        .attr("height", y.bandwidth())
        .attr("rx", 4)
        .attr("fill", d => activeCategory === d.label ? accent : color)
        .attr("opacity", d => activeCategory === null || activeCategory === d.label ? 1 : 0.3)
        .style("cursor", "pointer")
        .on("click", function(event, d) {
          selectedItems = d.items;
          activeCategory = d.label;
          
          g.selectAll(".timeline-bar")
            .transition().duration(200)
            .attr("fill", color)
            .attr("opacity", 0.3);
          
          d3.select(this)
            .transition().duration(200)
            .attr("fill", accent)
            .attr("opacity", 1);
        })
        .on("mouseenter", function(event, d) {
           if (!activeCategory) d3.select(this).attr("opacity", 0.8);
        })
        .on("mouseleave", function(event, d) {
           if (!activeCategory) d3.select(this).attr("opacity", 1);
        });

    zoomHandler = d3.zoom()
      .scaleExtent([1, 20])
      .translateExtent([[0, 0], [width, height]])
      .on("zoom", ({transform}) => {
        const zx = transform.rescaleX(x);
        gx.call(xAxis, zx);
        bars.attr("x", d => zx(d.start))
            .attr("width", d => Math.max(2, zx(d.end) - zx(d.start))); 
      });

    svg.call(zoomHandler);
    
    gx.call(xAxis, x);
    bars.attr("x", d => x(d.start))
        .attr("width", d => Math.max(2, x(d.end) - x(d.start)));
  }

  function wrapText(text, width) {
    text.each(function() {
      let textNode = d3.select(this),
          words = textNode.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.2, 
          yAttr = textNode.attr("y"),
          dy = parseFloat(textNode.attr("dy") || 0.32),
          tspan = textNode.text(null).append("tspan").attr("x", -12).attr("y", yAttr).attr("dy", dy + "em");
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = textNode.append("tspan").attr("x", -12).attr("y", yAttr).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
        }
      }
    });
  }

  onMount(() => {
    resizeObserver = new ResizeObserver(() => requestAnimationFrame(drawTimeline));
    resizeObserver.observe(svgElement.parentElement);
  });

  onDestroy(() => resizeObserver?.disconnect());
  
  // Re-draw when paginated data or styling changes
  $effect(() => { paginatedData; color; accent; drawTimeline(); });
</script>

<div class="viz-container">
  <!-- TOP PAGINATOR (Optional, helpful if placed before the chart) -->
  {#if totalPages > 1}
    <div class="pager-container" style="margin-top: 0;">
      <button class="pager-btn outline" disabled={currentPage === 0} onclick={() => { currentPage--; handleReset(); }}>«</button>
      <div class="page-numbers">{currentPage + 1} / {totalPages}</div>
      <button class="pager-btn outline" disabled={currentPage >= totalPages - 1} onclick={() => { currentPage++; handleReset(); }}>»</button>
    </div>
  {/if}

  {#if timelineData.length === 0}
    <div class="empty-message">No valid time span data found.</div>
  {:else}
    <div class="viz-area" style="height: {chartHeight}px;">
      <svg bind:this={svgElement}></svg>
      
      {#if activeCategory}
        <button class="reset-viz-btn" onclick={handleReset} title="Reset Zoom">↺</button>
      {/if}
    </div>

    <ItemsBar 
      items={selectedItems} 
      {siteDomain} 
      onclose={handleReset} 
    />
  {/if}
  
  <!-- BOTTOM PAGINATOR -->
  {#if totalPages > 1}
    <div class="pager-container">
      <button class="pager-btn outline" disabled={currentPage === 0} onclick={() => { currentPage--; handleReset(); }}>«</button>
      <div class="page-numbers">{currentPage + 1} / {totalPages}</div>
      <button class="pager-btn outline" disabled={currentPage >= totalPages - 1} onclick={() => { currentPage++; handleReset(); }}>»</button>
    </div>
  {/if}
</div>

<style>
  @import '../styles/global-styles.css';

  svg {
    width: 100%;
    display: block;
    cursor: ew-resize; 
    overflow: visible;
  }

  svg:active { cursor: grabbing; }

  :global(repository-timeline .axis path),
  :global(repository-timeline .axis line) {
    stroke: var(--pico-muted-color, #ccc);
  }

  :global(repository-timeline .axis text) {
    fill: var(--pico-color, currentColor); 
    font-family: var(--pico-font-family, inherit);
  }
</style>