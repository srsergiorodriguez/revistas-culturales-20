<svelte:options customElement="repository-barchart" />

<script>
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';
  import ItemsBar from "$lib/ItemsBar.svelte";

  let { 
    key = "",     
    top = "10",   
    color = "var(--pico-primary, #4a90e2)", 
    usePalette = "false" 
  } = $props();

  const categoricalPalette = ["#e60049", "#0bb4ff", "#50e991", "#e6d800", "#9b19f5", "#ffa300", "#dc0ab4", "#b3d4ff", "#00bfa0", "#97421dff"];

  const metadata = window.REPOSITORIES_DATA || [];
  const siteDomain = window.CUSTOM_CONTEXT?.siteDomain || "";

  let svgElement = $state();
  let resizeObserver;
  let selectedItems = $state([]);
  let activeCategory = $state(null);

  let chartData = $derived.by(() => {
    if (!key || metadata.length === 0) return [];
    
    const getKeyValue = (item, k) => {
      const val = item[k.toLowerCase()];
      if (val === undefined || val === null || val === "") return undefined;
      
      if (Array.isArray(val)) {
        return val.map(v => (typeof v === 'object' && v !== null) ? (v.name || v.nombre || v.id) : v).join(', ');
      }
      
      if (typeof val === 'object' && val !== null) {
        return val.name || val.nombre || val.id;
      }
      
      return String(val).trim();
    };

    const groups = d3.group(metadata, d => getKeyValue(d, key));
    let sorted = Array.from(groups, ([k, items]) => ({ key: k, count: items.length, items }))
      .filter(d => d.key !== undefined && d.key !== "" && d.key !== null)
      .sort((a, b) => d3.descending(a.count, b.count));

    const topN = parseInt(top, 10);
    if (!isNaN(topN) && topN > 0) sorted = sorted.slice(0, topN);
    return sorted;
  });

  let chartHeight = $derived(chartData.length > 0 ? (chartData.length * 45) + 60 : 200);

  function handleReset() {
    selectedItems = [];
    activeCategory = null;
    if (svgElement) {
      d3.select(svgElement).selectAll(".barchart-bar") // Explicit class selection
        .transition().duration(300)
        .attr("opacity", 1);
    }
  }

  function drawChart() {
    if (!svgElement || chartData.length === 0) return;
    
    const svg = d3.select(svgElement);
    svg.selectAll("*").remove(); 

    const width = svgElement.parentElement.clientWidth;
    const height = chartHeight; 

    svg.attr("viewBox", [0, 0, width, height]);
    const margin = { top: 20, right: 40, bottom: 40, left: 150 };

    svg.append("defs").append("clipPath")
      .attr("id", "mirla-bar-clip")
      .append("rect")
      .attr("x", margin.left)
      .attr("y", 0)
      .attr("width", width - margin.left - margin.right + 20) 
      .attr("height", height);

    const x = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.count)])
      .range([margin.left, width - margin.right])
      .nice();

    const y = d3.scaleBand()
      .domain(chartData.map(d => d.key))
      .range([margin.top, height - margin.bottom])
      .padding(0.25); 

    const colorScale = d3.scaleOrdinal().range(categoricalPalette);

    const suggestedTicks = x.ticks(Math.max(width / 80, 2));
    const integerTicks = suggestedTicks.filter(t => Number.isInteger(t));

    const xAxis = g => g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickValues(integerTicks).tickFormat(d3.format("d")).tickSizeOuter(0))
      .attr("font-family", null)
      .selectAll(".tick text")
      .attr("font-size", "0.8rem") 
      .call(g => g.select(".domain").remove()); 

    const yAxis = g => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickSizeOuter(0))
      .attr("font-size", null) 
      .attr("font-family", null)
      .selectAll(".tick text")
      .attr("font-size", "0.8rem") 
      .call(wrapText, margin.left - 15);

    svg.append("g")
      .attr("clip-path", "url(#mirla-bar-clip)")
      .selectAll(".barchart-bar") // Explicit class selection
      .data(chartData)
      .join("rect")
        .attr("class", "barchart-bar") // Tag the rects here
        .attr("x", x(0))
        .attr("y", d => y(d.key))
        .attr("width", d => Math.max(0, x(d.count) - x(0)))
        .attr("height", y.bandwidth())
        .attr("rx", 6) 
        .attr("fill", (d, i) => usePalette === "true" ? colorScale(i) : color)
        .attr("opacity", d => activeCategory === null || activeCategory === d.key ? 1 : 0.3)
        .style("cursor", "pointer")
        .on("click", (event, d) => {
          activeCategory = d.key;
          selectedItems = d.items;
          svg.selectAll(".barchart-bar") // Explicit class selection
            .transition().duration(300)
            .attr("opacity", rectData => rectData.key === d.key ? 1 : 0.3);
        })
        .on("mouseenter", function(event, d) {
           if (!activeCategory) d3.select(this).attr("opacity", 0.8);
        })
        .on("mouseleave", function(event, d) {
           if (!activeCategory) d3.select(this).attr("opacity", 1);
        });

    svg.append("g").attr("class", "axis x-axis").call(xAxis);
    svg.append("g").attr("class", "axis y-axis").call(yAxis);
  }

  // Updated to the robust, vertically-centering wrapText logic
  function wrapText(text, width) {
    text.each(function() {
      let textNode = d3.select(this),
          words = textNode.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.2, 
          dy = parseFloat(textNode.attr("dy") || 0.32);
          
      textNode.text(null);
      
      let tspan = textNode.append("tspan")
        .attr("x", -12)
        .attr("y", 0) 
        .attr("dy", dy + "em");
      
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width && line.length > 1) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = textNode.append("tspan")
            .attr("x", -12)
            .attr("y", 0) 
            .attr("dy", `${++lineNumber * lineHeight + dy}em`)
            .text(word);
        }
      }

      const yOffset = (lineNumber * lineHeight) / 2;
      textNode.selectAll("tspan").attr("dy", function() {
          const currentDy = parseFloat(d3.select(this).attr("dy"));
          return (currentDy - yOffset) + "em";
      });
    });
  }

  onMount(() => {
    resizeObserver = new ResizeObserver(() => requestAnimationFrame(drawChart));
    if (svgElement?.parentElement) resizeObserver.observe(svgElement.parentElement);
  });

  onDestroy(() => resizeObserver?.disconnect());
  $effect(() => { chartData; color; usePalette; drawChart(); });
</script>

<div class="viz-container">
  {#if chartData.length === 0}
    <div class="empty-message">No data found for key "{key}"</div>
  {:else}
    <div class="viz-area" style="height: {chartHeight}px;">
      <svg bind:this={svgElement}></svg>
      {#if activeCategory}
        <button class="reset-viz-btn" onclick={handleReset} title="Reset">↺</button>
      {/if}
    </div>
    
    <ItemsBar 
      items={selectedItems} 
      {siteDomain} 
      onclose={handleReset} 
    />
  {/if}
</div>

<style>
  @import '../styles/global-styles.css';

  :global(repository-barchart svg text) {
    font-family: var(--pico-font-family, inherit);
    font-size: 0.9rem; 
    fill: var(--pico-color, currentColor); 
  }

  :global(repository-barchart .axis path),
  :global(repository-barchart .axis line) {
    stroke: var(--pico-muted-color, #ccc); 
  }
</style>