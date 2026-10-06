<svelte:options customElement="contributors-table" />

<script>
  import { onMount } from 'svelte';

  // Propiedad para definir qué base de datos cargar ('principales' o 'asociados')
  let { type = 'principales' } = $props();

  let contributors = $state([]);
  let status = $state('loading');
  let errorMessage = $state('');

  onMount(() => {
    // Selecciona la variable global dependiendo del prop 'type'
    const data = type === 'asociados' ? window.ASOCIADOS_DATA : window.PRINCIPALES_DATA;

    if (data) {
      contributors = data;
      status = 'success';
    } else {
      status = 'error';
      errorMessage = `No se encontraron los datos. Asegúrese de que el archivo participantes_${type}.csv esté subido.`;
    }
  });
</script>

<figure>
  {#if status === 'loading'}
    <p aria-busy="true">Cargando colaboradores...</p>
    
  {:else if status === 'error'}
    <article style="border-color: var(--pico-del-color);">
      <p style="color: var(--pico-del-color); margin: 0;">{errorMessage}</p>
    </article>
    
  {:else}
    <table class="striped">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Bio</th>
          <th>Contacto</th>
        </tr>
      </thead>
      <tbody>
        {#each contributors as person}
          <tr>
            <td>
              <!-- Se reemplazó person.url por person.orcid -->
              {#if person.orcid && person.orcid.trim() !== ''}
                <a href="https://orcid.org/{person.orcid.trim()}" target="_blank" rel="noopener noreferrer">
                  {person.nombre || 'Sin nombre'}
                </a>
              {:else}
                {person.nombre || 'Sin nombre'}
              {/if}
            </td>
            <td>{person.bio || ''}</td>
            <td>
              <!-- Se imprime como texto plano para evitar recolección de bots -->
              {person.contacto || ''}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</figure>

<style>
  /* Importa las variables y utilidades base del sistema de diseño */
  @import '../styles/global-styles.css';

  table {
    display: table; 
    width: 100%;
    border-collapse: separate; 
    border-spacing: 0;
    border: 1px solid var(--mirla-border, #ccc);
    border-radius: var(--pico-border-radius, 8px);
    background: var(--pico-card-background-color, transparent);
    margin: 2em 0;
  }

  th, td {
    padding: 1rem; 
    border: none;
    border-bottom: 1px solid var(--mirla-border, #ccc);
    text-align: left;
    vertical-align: top;
  }

  tr:first-child th:first-child {
    border-top-left-radius: var(--pico-border-radius, 8px);
  }
  tr:first-child th:last-child {
    border-top-right-radius: var(--pico-border-radius, 8px);
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  th {
    background-color: var(--pico-card-sectioning-background-color, rgba(0,0,0,0.05));
    font-weight: 600;
  }

  tbody tr {
    transition: background-color 0.2s ease;
  }
  
  tbody tr:hover {
    background-color: var(--pico-form-element-background-color, rgba(0,0,0,0.02));
  }
</style>