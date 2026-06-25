<svelte:options customElement="contributors-table" />

<script>
  import { onMount } from 'svelte';

  let contributors = $state([]);
  let status = $state('loading');
  let errorMessage = $state('');

  onMount(() => {
    // Read the global variable injected by the plugin
    if (window.CONTRIBUTORS_DATA) {
      contributors = window.CONTRIBUTORS_DATA;
      status = 'success';
    } else {
      status = 'error';
      errorMessage = "Data not found. Make sure the CSV is uploaded and the JS file is linked.";
    }
  });
</script>

<figure>
  {#if status === 'loading'}
    <p aria-busy="true">Loading contributors...</p>
    
  {:else if status === 'error'}
    <article style="border-color: var(--pico-del-color);">
      <p style="color: var(--pico-del-color); margin: 0;">{errorMessage}</p>
    </article>
    
  {:else}
    <table class="striped">
      <thead>
        <tr>
          <th>Name</th>
          <th>Bio</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        {#each contributors as person}
          <tr>
            <td>
              {#if person.url && person.url.trim() !== ''}
                <a href={person.url} target="_blank" rel="noopener noreferrer">
                  {person.name || 'Unnamed'}
                </a>
              {:else}
                {person.name || 'Unnamed'}
              {/if}
            </td>
            <td>{person.bio || ''}</td>
            <td>
              {#if person.email && person.email.trim() !== ''}
                <a href="mailto:{person.email}">{person.email}</a>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</figure>