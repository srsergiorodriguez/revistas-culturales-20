<svelte:options customElement="contributors-table" />

<script>
  import { onMount } from 'svelte';

  let contributors = $state([]);
  let status = $state('loading');
  let errorMessage = $state('');

  onMount(() => {
    // Lee la variable global inyectada por el plugin
    if (window.CONTRIBUTORS_DATA) {
      contributors = window.CONTRIBUTORS_DATA;
      status = 'success';
    } else {
      status = 'error';
      errorMessage = "No se encontraron los datos. Asegúrate de que el CSV esté subido y el archivo JS enlazado.";
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
          <th>Biografía</th>
          <th>Correo</th>
        </tr>
      </thead>
      <tbody>
        {#each contributors as person}
          <tr>
            <td>
              {#if person.url && person.url.trim() !== ''}
                <a href="https://orcid.org/{person.url.trim()}" target="_blank" rel="noopener noreferrer">
                  {person.name || 'Sin nombre'}
                </a>
              {:else}
                {person.name || 'Sin nombre'}
              {/if}
            </td>
            <td>{person.bio || ''}</td>
            <td>
              <!-- Se imprime como texto plano para evitar recolección de bots -->
              {person.email || ''}
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
    padding: 1rem; /* Aumenta el margen interno para que respire */
    border: none;
    border-bottom: 1px solid var(--mirla-border, #ccc);
    text-align: left;
    vertical-align: top;
  }

  /* Redondea las esquinas superiores de los encabezados */
  tr:first-child th:first-child {
    border-top-left-radius: var(--pico-border-radius, 8px);
  }
  tr:first-child th:last-child {
    border-top-right-radius: var(--pico-border-radius, 8px);
  }

  /* Elimina el borde inferior de la última fila para que no choque con el borde de la tabla */
  tbody tr:last-child td {
    border-bottom: none;
  }

  th {
    background-color: var(--pico-card-sectioning-background-color, rgba(0,0,0,0.05));
    font-weight: 600;
  }

  /* Si desea que la fila completa tenga un efecto sutil al pasar el mouse */
  tbody tr {
    transition: background-color 0.2s ease;
  }
  
  tbody tr:hover {
    background-color: var(--pico-form-element-background-color, rgba(0,0,0,0.02));
  }
</style>