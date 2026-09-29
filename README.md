# Documentación técnica de Revistas Culturales 2.0

## Instalación de herramientas y clonación del repositorio

Para gestionar el contenido del portal es necesario instalar tanto el gestor de contenidos como un cliente de control de versiones. Se recomienda usar GitHub desktop para facilitar el proceso visualmente sin necesidad de usar la línea de comandos. Siga esta secuencia para dejar el entorno de trabajo listo:

1. **Descarga de Publii**: ingrese al sitio web oficial (getpublii.com) y descargue la versión correspondiente a su sistema operativo. Instale el programa siguiendo las instrucciones por defecto, pero no cree ningún sitio web nuevo todavía.
2. **Descarga de GitHub desktop**: ingrese a desktop.github.com, descargue la aplicación, instálela e inicie sesión con la cuenta de GitHub que recibió los permisos de acceso al repositorio del proyecto.
3. **Ubicación de la carpeta de destino**: abra su explorador de archivos y busque la carpeta raíz donde Publii guarda los datos locales. En Windows, esta ruta es por defecto `Documentos\Publii\sites\`. En macOS, se encuentra en `Documentos/Publii/sites/`.
4. **Clonación del repositorio**: abra GitHub desktop, vaya al menú de archivo (File) y seleccione la opción para clonar un repositorio (Clone repository). En la pestaña de GitHub, busque y seleccione el repositorio del proyecto.
5. **Ruta exacta de clonado**: en la misma ventana de clonación, el programa le pedirá elegir una ruta local (Local path). Es fundamental que haga clic en el botón de examinar y seleccione exactamente la carpeta `sites` que ubicó en el paso 3. El programa se encargará de crear una subcarpeta con el nombre del repositorio (por ejemplo, `revistas-culturales-20`) directamente dentro de `sites`.
6. **Descarga**: haga clic en el botón de clonar y espere a que se descarguen todos los archivos. Esto trasladará a su computador la base de datos completa, los textos editables, las imágenes y el tema personalizado.
7. **Reconocimiento en Publii**: abra la aplicación de Publii. El programa escaneará la carpeta `sites` al iniciar, detectará la base de datos descargada y mostrará el sitio en su lista de proyectos disponibles, dejándolo completamente operativo y listo para su edición.

## Instalación y activación del plugin de datos

El repositorio incluye un complemento esencial para el procesamiento de las bases de datos locales. Sin este archivo, la tabla de colaboradores y las visualizaciones interactivas del explorador de colecciones no funcionarán, ya que este código es el encargado de convertir los archivos CSV en información legible para los componentes de la página.

1. **Localice el archivo**: abra su explorador de archivos y navegue hasta la carpeta del repositorio que acaba de clonar (por defecto en `Documentos\Publii\sites\revistas-culturales-20`). Allí encontrará un archivo comprimido llamado `RevistasCulturalesPlugin.zip`. Tenga presente esta ubicación.
2. **Abra el menú de plugins**: dentro de la aplicación Publii, diríjase a la barra lateral izquierda. Haga clic en la sección de herramientas y configuración (Tools & Plugins) situada en la parte inferior del menú y seleccione la ventana de plugins.
3. **Instale el complemento**: en la interfaz de plugins, busque el botón superior derecho (tres puntos o campana) para instalar uno nuevo (Install plugin). Se desplegará una ventana de navegación de archivos; regrese a la carpeta del paso 1, seleccione el archivo `RevistasCulturalesPlugin.zip` y confirme la acción. Publii extraerá e instalará el paquete internamente.
4. **Active el funcionamiento**: terminada la instalación, el complemento aparecerá listado en la pantalla. Haga clic en el interruptor ubicado en la esquina de la tarjeta del plugin para encenderlo.
5. **Verificación**: al dejar este interruptor en estado activo, el sistema se asegurará de leer y compilar los datos de forma silenciosa cada vez que guarde un cambio o sincronice el sitio con el servidor. No es necesario realizar ninguna modificación en las configuraciones internas del plugin.

## Gestión de contenidos y componentes visuales interactivos

Los administradores pueden modificar libremente las entradas (posts) y las páginas del sitio, cambiar sus textos y agregar contenidos nuevos utilizando el editor visual de Publii.

El sitio utiliza etiquetas HTML personalizadas para transformar los datos del archivo CSV en visualizaciones gráficas y galerías. Para insertar estos componentes interactivos en las páginas, se debe usar la herramienta de código (Custom HTML) del editor. Cuando pegue el ejemplo del componente en su código, bastará con llamarlo mediante su etiqueta personalizada.

Cada componente requiere de ciertos atributos que le indican al sistema cuáles columnas de la base de datos debe procesar. A continuación se detalla el funcionamiento de cada etiqueta: tenga en cuenta que el nombre de las columnas en los atributos debe coincidir exactamente con los encabezados de su archivo `repositorios.csv`.

### Índice de repositorios (repository-index)

Este componente renderiza la galería principal de colecciones, incluyendo una barra de búsqueda en tiempo real, filtros dinámicos y un sistema de paginación. Al hacer clic sobre cualquier repositorio, se abre una ventana modal con los datos extendidos.

Ejemplo de implementación:
`<repository-index filters="tipo, pais, ciudad" itemsperpage="12" modalfields="tipo, alcance, país, ciudad, tipo_institución, temas_dominantes"></repository-index>`

Parámetros de configuración:

* `filters`: especifica las columnas que se transformarán en menús desplegables para filtrar la galería.
* `itemsperpage`: define el número de tarjetas que se mostrarán antes de generar una nueva página.
* `modalfields`: establece la lista exacta de campos de metadatos que se imprimirán dentro de la ventana emergente al inspeccionar un ítem.

### Gráfico de barras (repository-barchart)

Renderiza un diagrama de barras que contabiliza y compara visualmente la frecuencia de una variable específica dentro de la colección.

Ejemplo de implementación:
`<repository-barchart key="tipo"></repository-barchart>`

Parámetros de configuración:

* `key`: indica el nombre de la columna que el gráfico debe agrupar y cuantificar.

### Mapa geográfico (repository-map)

Proyecta la ubicación espacial de los proyectos o colecciones sobre un mapa interactivo.

Ejemplo de implementación:
`<repository-map latkey="Latitud" lonkey="Longitud"></repository-map>`

Parámetros de configuración:

* `latkey`: indica la columna que contiene los datos de latitud.
* `lonkey`: indica la columna que contiene los datos de longitud.

### Red de relaciones (repository-network)

Genera un diagrama de red compuesto por nodos y aristas para explorar las correlaciones entre dos categorías distintas (por ejemplo, cómo se relaciona el origen del financiamiento con los protocolos de interoperabilidad usados).

Ejemplo de implementación:
`<repository-network sourcekey="interoperabilidad" targetkey="financiamiento"></repository-network>`

Parámetros de configuración:

* `sourcekey`: determina la primera variable de análisis (el nodo de origen).
* `targetkey`: determina la segunda variable (el nodo de destino con el que se establecerá la conexión).

### Línea de tiempo (repository-timeline)

Dibuja un diagrama cronológico que ilustra gráficamente el rango temporal que cubre cada colección, permitiendo agrupar la información por distintas categorías (como el país de origen o el nombre del proyecto).

Ejemplo de implementación:
`<repository-timeline startkey="periodo_desde" endkey="periodo_hasta" ykey="país"></repository-timeline>`

Parámetros de configuración:

* `startkey`: define la columna que registra el año de inicio de la cobertura.
* `endkey`: define la columna que registra el año de finalización.
* `ykey`: establece la categoría que se usará en el eje vertical para agrupar las barras de tiempo.

## Actualización de las bases de datos (archivos CSV)

Toda la información estructurada se alimenta desde dos archivos de texto que pueden modificarse en cualquier programa de hojas de cálculo. Modificar estos archivos hará que la tabla de participantes y el explorador de colecciones se actualicen automáticamente al sincronizar la web.

Ruta de los archivos: `Documents\Publii\sites\revistas-culturales-20\input\media\files`

* **contributors.csv**: contiene la lista de participantes. Los encabezados exactos son: `Name`, `Url`, `Bio` y `Email`. La columna url está destinada exclusivamente para el código ORCID del investigador.
* **repositorios.csv**: contiene la base de datos de las colecciones y sigue el esquema metodológico planteado por Danilo.

## Gestión de imágenes de repositorios

Las fotografías que ilustran el explorador de colecciones deben optimizarse para reducir el espacio de almacenamiento del servidor.

Ruta de las imágenes: `Documents\Publii\sites\revistas-culturales-20\input\media\files\imagenes-repositorios`

* **Nomenclatura**: el nombre del archivo de imagen debe ser exactamente igual al valor puesto en la columna `id` del archivo `repositorios.csv`.
* **Formatos y optimización**: aunque se permiten archivos jpg o png, es altamente recomendable usar imágenes en formato webp para ahorrar espacio.
* **Procesamiento**: en el repositorio se incluye un archivo llamado `image-processor.html`. Al abrirlo en el navegador, podrá usarlo para comprimir las imágenes pesadas y crear automáticamente los thumbnails (miniaturas) que requiere la galería. Las imágenes resultantes deben guardarse en la ruta indicada arriba, junto a los archivos CSV.

## Configuración del servidor y publicación

Una vez que el sitio local esté listo, los cambios deben enviarse al servidor institucional para que sean accesibles al público. Siga estos pasos para configurar la conexión de transferencia por primera vez:

1. **Acceso a la configuración**: en el menú lateral izquierdo de Publii, haga clic en la opción de servidor (Server).
2. **Selección del protocolo**: en el primer menú desplegable, seleccione el método de conexión. Para los requerimientos de seguridad de este proyecto, elija siempre la opción SFTP.
3. **Ingreso de credenciales**: llene los campos del formulario con los datos proporcionados por el administrador de sistemas de la universidad. Preste especial atención a los siguientes elementos:
* **Dominio (Website URL)**: la dirección web pública y definitiva del proyecto.
* **Servidor (Server)**: la dirección IP o el nombre del servidor (host) donde se alojan los archivos.
* **Puerto (Port)**: el puerto de conexión, que usualmente es el 22 para SFTP.
* **Usuario y contraseña (Username / Password)**: las credenciales de acceso. Es indispensable que esta cuenta tenga permisos de escritura en la carpeta de destino; de lo contrario, la transferencia fallará.
* **Ruta remota (Remote path)**: la ubicación exacta dentro del servidor donde deben guardarse los archivos de la página.


4. **Prueba de conexión**: antes de confirmar, presione el botón para probar la conexión (Test connection). Si los datos y los permisos son correctos, el programa mostrará un mensaje de éxito. Si ocurre un error, verifique los datos ingresados o consulte con el soporte técnico de la universidad si el firewall está bloqueando su dirección IP.
5. **Guardado y publicación**: guarde la configuración. A partir de este momento, cada vez que desee aplicar sus actualizaciones al sitio en vivo, solo debe hacer clic en el botón de sincronizar sitio (Sync your website) ubicado en la barra lateral. El programa compilará todos los datos, entradas e imágenes nuevas y subirá la versión actualizada al servidor de forma automática.