import { BlockData, BlockType } from '../types';

interface Template {
  name: string;
  description: string;
  emoji: string;
  blocks: () => BlockData[];
}

export const BUILT_IN_TEMPLATES: Template[] = [
  {
    name: 'Saber 1 — Página principal del saber',
    description: 'Título + intro + plan de acción + recursos en 2 col + tabs de herramientas + actividades',
    emoji: '📖',
    blocks: (): BlockData[] => [
      { id: 'h1', type: BlockType.HEADING, content: { text: 'Saber 1: Lorem Ipsum Dolor Sit Amet', level: 'h4', colorClass: 'text-info' }, style: { textAlign: 'left', padding: '0px' } },
      { id: 't1', type: BlockType.TEXT, content: { text: '<p>El desarrollo de aplicaciones se centra en lorem ipsum dolor sit amet consectetur adipiscing elit. Este proceso se apoya en tecnologías que hacen posible estructurar el contenido, definir su presentación visual y proporcionar interactividad.</p><p>La construcción de una solución funcional implica seguir pasos organizados: el análisis de la necesidad, el diseño de la estructura, la incorporación de elementos interactivos y la validación en distintos contextos.</p>' }, style: { textAlign: 'left', padding: '0px' } },
      { id: 'cit1', type: BlockType.CITATION, content: { title: 'Pongamos a prueba nuestro aprendizaje', text: '', iconUrl: 'https://placehold.co/150/013549/white?text=🎯', iconPosition: 'left', layout: 'horizontal', iconSize: 'sm', titleColor: 'text-info', titleSize: 'h5', bgColor: 'white' }, style: { textAlign: 'left', padding: '0px' }, areas: { content: [{ id: 'ct1', type: BlockType.TEXT, content: { text: '<p>Para desarrollar soluciones funcionales y accesibles, definiremos nuestra estrategia respondiendo a tres preguntas clave:</p><p><strong>¿Qué tipo de solución vamos a construir?</strong></p><p><strong>¿Qué herramientas y principios utilizaremos?</strong></p><p><strong>¿Qué criterios aplicaremos para garantizar su calidad?</strong></p>' }, style: { textAlign: 'left', padding: '0px' } }] } },
      { id: 'lay1', type: BlockType.LAYOUT, content: {}, style: { padding: '0px' }, columns: [
        { id: 'c1', width: '50%', blocks: [
          { id: 'cit2', type: BlockType.CITATION, content: { title: 'Metodología de aprendizaje', text: '', iconUrl: 'https://placehold.co/150/009AB2/white?text=📚', iconPosition: 'left', layout: 'horizontal', iconSize: 'sm', titleColor: 'text-info', titleSize: 'h5', bgColor: 'white' }, style: { textAlign: 'left', padding: '0px' }, areas: { content: [{ id: 'cm1', type: BlockType.TEXT, content: { text: '<p>Aplicaremos el aprendizaje basado en proyectos, donde cada actividad estará orientada al desarrollo del proyecto de aula. A partir de un reto específico, el estudiante diseñará y estructurará soluciones, fomentando el trabajo colaborativo.</p>' }, style: {} }] } },
          { id: 'cit3', type: BlockType.CITATION, content: { title: 'Abordaje de materiales', text: '', iconUrl: 'https://placehold.co/150/5a31b5/white?text=📋', iconPosition: 'left', layout: 'horizontal', iconSize: 'sm', titleColor: 'text-info', titleSize: 'h5', bgColor: 'white' }, style: { textAlign: 'left', padding: '0px' }, areas: { content: [{ id: 'ca1', type: BlockType.TEXT, content: { text: '<p><strong>Abordaje de los materiales y recursos de estudio dispuestos en el saber contenido.</strong></p>' }, style: {} }] } },
        ]},
        { id: 'c2', width: '50%', blocks: [
          { id: 'cit4', type: BlockType.CITATION, content: { title: 'Práctica', text: '', iconUrl: 'https://placehold.co/150/e0421f/white?text=⚡', iconPosition: 'left', layout: 'horizontal', iconSize: 'sm', titleColor: 'text-info', titleSize: 'h5', bgColor: 'white' }, style: { textAlign: 'left', padding: '0px' }, areas: { content: [{ id: 'cp1', type: BlockType.TEXT, content: { text: '<p>Los contenidos tienen un enfoque práctico y aplicado. Para ello, se realizará el Taller 1.</p>' }, style: {} }] } },
          { id: 'cit5', type: BlockType.CITATION, content: { title: 'Momento evaluativo', text: '', iconUrl: 'https://placehold.co/150/198754/white?text=✓', iconPosition: 'left', layout: 'horizontal', iconSize: 'sm', titleColor: 'text-info', titleSize: 'h5', bgColor: 'white' }, style: { textAlign: 'left', padding: '0px' }, areas: { content: [{ id: 'ce1', type: BlockType.TEXT, content: { text: '<p>Al finalizar el desarrollo del saber, presentaremos la Fase 1 del proyecto de aula.</p><p><strong>Importante:</strong> Esta entrega corresponde a un porcentaje de la calificación definido en el curso.</p>' }, style: {} }] } },
        ]},
      ]},
      { id: 'sec1', type: BlockType.HEADING, content: { text: 'Momento 1 — Exploramos los fundamentos', level: 'h5', colorClass: 'text-primary' }, style: { textAlign: 'left', padding: '0px' } },
      { id: 't2', type: BlockType.TEXT, content: { text: '<p>Antes de escribir código, necesitamos entender el terreno de juego. En este libro conoceremos los conceptos clave y las bases del tema. Este recorrido nos dará el vocabulario y la lógica mínima para construir soluciones profesionales.</p>' }, style: { textAlign: 'left', padding: '0px' } },
      { id: 'btn1', type: BlockType.BUTTON, content: { text: 'Libro. Lorem ipsum dolor sit amet consectetur', url: '#', variant: 'primary', isFullWidth: true }, style: { textAlign: 'left', padding: '0px' } },
      { id: 'sec2', type: BlockType.HEADING, content: { text: 'Herramientas del saber', level: 'h5', colorClass: 'text-primary' }, style: { textAlign: 'left', padding: '0px' } },
      { id: 't3', type: BlockType.TEXT, content: { text: '<p>Para el desarrollo de las actividades utilizaremos herramientas que facilitarán la comprensión y práctica de los conceptos. Realicemos clic para explorar la información.</p>' }, style: { textAlign: 'left', padding: '0px' } },
      { id: 'tabs1', type: BlockType.TABS, content: { orientation: 'horizontal', items: [{ id: 'item-0', title: '🛠 Herramienta 1' }, { id: 'item-1', title: '🛠 Herramienta 2' }] }, style: { textAlign: 'left', padding: '0px' }, areas: { 'item-0': [{ id: 'tab0', type: BlockType.TEXT, content: { text: '<h5 class="text-success">Herramienta 1</h5><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Esta herramienta ofrece explicaciones claras, ejemplos interactivos y ejercicios para practicar directamente desde el navegador.</p><p><strong>Ruta de acceso:</strong> <a href="#">https://lorem-ipsum.com</a></p>' }, style: {} }], 'item-1': [{ id: 'tab1', type: BlockType.TEXT, content: { text: '<h5 class="text-info">Herramienta 2</h5><p>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Es compatible con múltiples sistemas operativos y soporta gran cantidad de funcionalidades.</p><p><strong>Descarga:</strong> <a href="#">https://herramienta2.com</a></p>' }, style: {} }] } },
      { id: 'sec3', type: BlockType.HEADING, content: { text: 'Momento 2 — Profundizamos', level: 'h5', colorClass: 'text-primary' }, style: { textAlign: 'left', padding: '0px' } },
      { id: 't4', type: BlockType.TEXT, content: { text: '<p>Una vez tengamos claros los fundamentos, es momento de profundizar. Aprenderemos a construir soluciones más robustas y a evaluar su calidad con criterios profesionales.</p>' }, style: { textAlign: 'left', padding: '0px' } },
      { id: 'btn2', type: BlockType.BUTTON, content: { text: 'Libro. Lorem ipsum — profundización y criterios de calidad', url: '#', variant: 'primary', isFullWidth: true }, style: { textAlign: 'left', padding: '0px' } },
      { id: 'btn3', type: BlockType.BUTTON, content: { text: 'Interactivo. Principios y buenas prácticas', url: '#', variant: 'secondary', isFullWidth: true }, style: { textAlign: 'left', padding: '0px' } },
      { id: 'sec4', type: BlockType.HEADING, content: { text: 'Momento 3 — Aplicamos', level: 'h5', colorClass: 'text-primary' }, style: { textAlign: 'left', padding: '0px' } },
      { id: 't5', type: BlockType.TEXT, content: { text: '<p>Con lo revisado, ya contamos con los insumos necesarios. Ahora es momento de llevarlo a la acción.</p>' }, style: { textAlign: 'left', padding: '0px' } },
      { id: 'btn4', type: BlockType.BUTTON, content: { text: 'Taller 1: Taller práctico — lorem ipsum dolor sit amet', url: '#', variant: 'info', isFullWidth: true }, style: { textAlign: 'left', padding: '0px' } },
      { id: 'conc1', type: BlockType.CONCLUSION, content: { title: 'Importante', style: 'filled_light', color: 'yellow' }, style: { textAlign: 'left', padding: '0px' }, areas: { content: [{ id: 'ci1', type: BlockType.TEXT, content: { text: '<p>Es momento de trabajar en la Fase 1 del proyecto de aula. Esta es una oportunidad para trabajar en grupo, compartir saberes y aplicar lo aprendido en un contexto real.</p><p>Para empezar, es esencial que establezcamos nuestro grupo de trabajo colaborativo.</p>' }, style: {} }] } },
      { id: 'btn5', type: BlockType.BUTTON, content: { text: 'Tarea auténtica. Fase 1 — Analizamos y diseñamos', url: '#', variant: 'info', isFullWidth: true }, style: { textAlign: 'left', padding: '0px' } },
    ]
  },
  {
    name: 'Saber 2 — Contenido con estructura numerada',
    description: 'Intro + secciones H5 numeradas + alertas de actividad + botones de recursos + colapso evaluativo',
    emoji: '📝',
    blocks: (): BlockData[] => [
      { id: 't0', type: BlockType.TEXT, content: { text: '<p>Las estructuras de datos son herramientas fundamentales en lorem ipsum dolor sit amet consectetur adipiscing elit. A diferencia de los tipos simples, las estructuras tienen la capacidad de agrupar información del mismo tipo o de diferentes tipos dentro de una única unidad.</p><p>Los lenguajes modernos ofrecen diversas estructuras para este fin. En este saber explicaremos en detalle los conceptos y sus métodos de procesamiento.</p>' }, style: { textAlign: 'left', padding: '0px' } },
      { id: 'alert1', type: BlockType.ALERT, content: { type: 'info', cardStyle: 'card' }, style: { textAlign: 'left', padding: '0px' }, areas: { content: [{ id: 'a1', type: BlockType.TEXT, content: { text: '<p class="d-flex align-items-center text-primary"><strong>Para dominar este saber</strong>, hemos diseñado un plan de acción. Al explorarlo, definiremos juntos nuestra estrategia respondiendo a tres preguntas clave: ¿qué problemas resolveremos?, ¿qué recursos seguiremos?, y ¿cuáles serán nuestros acuerdos para el éxito?</p>' }, style: {} }] } },
      { id: 'div1', type: BlockType.DIVIDER, content: {}, style: {} },
      { id: 'h1', type: BlockType.HEADING, content: { text: '1. Conceptos fundamentales del tema', level: 'h5', colorClass: 'text-primary' }, style: { textAlign: 'left', padding: '0px' } },
      { id: 't1', type: BlockType.TEXT, content: { text: '<p>Comencemos con el estudio de esta unidad, explorando los conceptos fundamentales. En este sentido, definiremos qué es exactamente el tema, cómo se compone de elementos básicos y entenderemos el rol crucial de cada componente en el almacenamiento y manipulación de la información.</p>' }, style: { textAlign: 'left', padding: '0px' } },
      { id: 'btn1', type: BlockType.BUTTON, content: { text: 'Presentación. Lorem ipsum dolor sit amet', url: '#', variant: 'dark', isFullWidth: true }, style: {} },
      { id: 'h2', type: BlockType.HEADING, content: { text: '2. Variables, constantes y expresiones', level: 'h5', colorClass: 'text-primary' }, style: { textAlign: 'left', padding: '0px' } },
      { id: 't2', type: BlockType.TEXT, content: { text: '<p>En el centro de cualquier programa reside la capacidad de manejar información. Para lograrlo disponemos de herramientas cruciales: las <em>variables</em>, que actúan como contenedores flexibles; las <em>constantes</em>, que resguardan valores fijos; y los <em>tipos de datos</em>, que definen la naturaleza de la información.</p>' }, style: { textAlign: 'left', padding: '0px' } },
      { id: 'btn2', type: BlockType.BUTTON, content: { text: 'Libro. Variables, constantes, expresiones y tipos de datos', url: '#', variant: 'primary', isFullWidth: true }, style: {} },
      { id: 'h3', type: BlockType.HEADING, content: { text: '3. Estructuras y métodos de procesamiento', level: 'h5', colorClass: 'text-primary' }, style: { textAlign: 'left', padding: '0px' } },
      { id: 't3', type: BlockType.TEXT, content: { text: '<p>La capacidad de tomar decisiones es lo que permite que un programa sea verdaderamente útil y dinámico. Las estructuras son las herramientas que nos otorgan este poder, pues permiten que el flujo de ejecución se adapte a diferentes situaciones.</p>' }, style: { textAlign: 'left', padding: '0px' } },
      { id: 'btn3', type: BlockType.BUTTON, content: { text: 'Libro. Estructuras y condiciones compuestas', url: '#', variant: 'primary', isFullWidth: true }, style: {} },
      { id: 'h4', type: BlockType.HEADING, content: { text: '4. Validación y pruebas', level: 'h5', colorClass: 'text-primary' }, style: { textAlign: 'left', padding: '0px' } },
      { id: 't4', type: BlockType.TEXT, content: { text: '<p>Una vez diseñado y codificado el algoritmo surge una pregunta crucial: ¿funcionará como esperamos? Las pruebas nos permiten simular manualmente la ejecución, paso a paso, para identificar errores lógicos antes de ejecutarlo en producción.</p>' }, style: { textAlign: 'left', padding: '0px' } },
      { id: 'btn4', type: BlockType.BUTTON, content: { text: 'Presentación. Pruebas de escritorio', url: '#', variant: 'dark', isFullWidth: true }, style: {} },
      { id: 't5', type: BlockType.TEXT, content: { text: '<p>¡Llegó el momento de demostrar lo aprendido! Realizaremos dos talleres prácticos que nos permitirán aplicar los conceptos.</p>' }, style: {} },
      { id: 'alert2', type: BlockType.ALERT, content: { type: 'info', cardStyle: 'header_card', headerTitle: 'Taller práctico 1' }, style: {}, areas: { content: [{ id: 'at1', type: BlockType.TEXT, content: { text: '<p>Prepárate para llevar tus habilidades al siguiente nivel. A través de este taller dominaremos los conceptos fundamentales.</p>' }, style: {} }, { id: 'ab1', type: BlockType.BUTTON, content: { text: 'Taller. Lorem ipsum — estructuras básicas', url: '#', variant: 'info', isFullWidth: true }, style: {} }] } },
      { id: 'alert3', type: BlockType.ALERT, content: { type: 'secondary', cardStyle: 'card' }, style: {}, areas: { content: [{ id: 'at2', type: BlockType.TEXT, content: { text: '<p>El objetivo de este segundo taller es desarrollar y perfeccionar nuestras competencias. Se requiere atención total y práctica reiterada.</p>' }, style: {} }, { id: 'ab2', type: BlockType.BUTTON, content: { text: 'Taller. Lorem ipsum — estructuras compuestas', url: '#', variant: 'info', isFullWidth: true }, style: {} }] } },
    ]
  },
  {
    name: 'Saber dos columnas — Teoría y práctica',
    description: 'Layout 2 columnas: col izq con concepto + video/genially, col der con jumbotron + recursos + evaluación con collapse',
    emoji: '⚡',
    blocks: (): BlockData[] => [
      { id: 'lay1', type: BlockType.LAYOUT, content: {}, style: { padding: '0px' }, columns: [
        { id: 'c1', width: '50%', blocks: [
          { id: 'h1', type: BlockType.HEADING, content: { text: '1. Lorem ipsum dolor sit amet consectetur', level: 'h4', colorClass: 'text-info' }, style: { textAlign: 'left', padding: '0px' } },
          { id: 't1', type: BlockType.TEXT, content: { text: '<p>Lorem ipsum dolor sit amet consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' }, style: {} },
          { id: 'h1a', type: BlockType.HEADING, content: { text: '1.1 Primer concepto', level: 'h5', colorClass: 'text-primary' }, style: { textAlign: 'left', padding: '0px' } },
          { id: 't1a', type: BlockType.TEXT, content: { text: '<p>Definamos el concepto a través de la interacción con el siguiente recurso:</p>' }, style: {} },
          { id: 'vid1', type: BlockType.VIDEO, content: { url: '' }, style: {} },
          { id: 'h1b', type: BlockType.HEADING, content: { text: '1.2 Segundo concepto', level: 'h5', colorClass: 'text-primary' }, style: { textAlign: 'left', padding: '0px' } },
          { id: 't1b', type: BlockType.TEXT, content: { text: '<p>Reconocemos ahora el segundo concepto como una disciplina que trasciende la aplicación técnica para convertirse en arte, habilidad y profesión.</p>' }, style: {} },
          { id: 'tabs1', type: BlockType.TABS, content: { orientation: 'vertical', items: [{ id: 'item-0', title: 'Aspecto 1' }, { id: 'item-1', title: 'Aspecto 2' }, { id: 'item-2', title: 'Aspecto 3' }] }, style: {}, areas: { 'item-0': [{ id: 'tp0', type: BlockType.TEXT, content: { text: '<h5 class="text-primary">Aspecto 1:</h5><p>Se refiere a que está compuesto por un conjunto de actividades que se realizan de manera metódica y organizada.</p>' }, style: {} }], 'item-1': [{ id: 'tp1', type: BlockType.TEXT, content: { text: '<h5 class="text-primary">Aspecto 2:</h5><p>Dichas actividades obedecen reglas, lineamientos y principios que respetan un orden establecido.</p>' }, style: {} }], 'item-2': [{ id: 'tp2', type: BlockType.TEXT, content: { text: '<h5 class="text-primary">Aspecto 3:</h5><p>Se puede medir con base en métricas, lo que facilita la toma de decisiones y la mejora continua.</p>' }, style: {} }] } },
        ]},
        { id: 'c2', width: '50%', blocks: [
          { id: 'alert1', type: BlockType.ALERT, content: { type: 'info', cardStyle: 'header_card', headerTitle: '💡 En esencia' }, style: {}, areas: { content: [{ id: 'ae1', type: BlockType.TEXT, content: { text: '<p class="lead" style="font-size:1rem"><strong>En esencia…</strong> Lorem ipsum dolor sit amet consectetur adipiscing elit. Esta disciplina busca integrar la totalidad del sistema, considerando todas sus partes como interdependientes para generar soluciones que favorezcan el bienestar.</p>' }, style: {} }] } },
          { id: 't2', type: BlockType.TEXT, content: { text: '<p>Conozcamos una visión sobre la cual se fundamenta este concepto. Explora el siguiente recurso e interactúa con su contenido:</p>' }, style: {} },
          { id: 'btn1', type: BlockType.BUTTON, content: { text: 'Libro. Introducción al tema', url: '#', variant: 'primary', isFullWidth: true }, style: {} },
          { id: 'div1', type: BlockType.DIVIDER, content: {}, style: {} },
          { id: 'h2', type: BlockType.HEADING, content: { text: 'Tarea formativa de conocimientos previos', level: 'h4', colorClass: 'text-info' }, style: {} },
          { id: 't3', type: BlockType.TEXT, content: { text: '<p>Es hora de ordenar y justificar las secuencias lógicas fundamentales, demostrando una comprensión clara del flujo de trabajo. Comienza a retar tus métodos de razonamiento:</p>' }, style: {} },
          { id: 'btn2', type: BlockType.BUTTON, content: { text: 'Tarea formativa: Ordena y reflexiona sobre el tema', url: '#', variant: 'info', isFullWidth: true }, style: {} },
          { id: 'alert2', type: BlockType.ALERT, content: { type: 'info', cardStyle: 'card' }, style: {}, areas: { content: [{ id: 'ae2', type: BlockType.TEXT, content: { text: '<h5 class="d-flex align-items-center text-primary font-weight-bold"><i class="fas fa-tasks me-2"></i>¿Cómo evidencias lo aprendido?</h5><p>El propósito de esta unidad es identificar los fundamentos y relacionarlos con la solución de problemas. Para lograrlo abordaremos dos evidencias de aprendizaje:</p>' }, style: {} }, { id: 'ab1', type: BlockType.BUTTON, content: { text: 'Evidencia 1: Proyecto de curso — Fase 1', url: '#', variant: 'info', isFullWidth: true }, style: {} }, { id: 'ab2', type: BlockType.BUTTON, content: { text: 'Evidencia 2: Cuestionario sobre el tema', url: '#', variant: 'warning', isFullWidth: true }, style: {} }, { id: 'ab3', type: BlockType.BUTTON, content: { text: '¿Qué incluye esta estrategia evaluativa?', url: '#', variant: 'danger', isFullWidth: true }, style: {} }, { id: 'ac1', type: BlockType.CONCLUSION, content: { title: 'Cuando vayas a resolver cuestionarios…', style: 'filled_light', color: 'yellow' }, style: {}, areas: { content: [{ id: 'cc1', type: BlockType.TEXT, content: { text: '<p>Asegúrate de estar en el ambiente apropiado (sin interrupciones) y que la conexión sea estable. Para iniciar, haz clic en <em>Intentar resolver el cuestionario ahora.</em></p>' }, style: {} }] } }] } },
        ]},
      ]},
    ]
  },
  {
    name: 'Página inicial de libro — Banner + tabs verticales',
    description: 'Banner de imagen + card con concepto + tabs verticales de contenido teórico',
    emoji: '📗',
    blocks: (): BlockData[] => [
      { id: 'img1', type: BlockType.IMAGE, content: { src: 'https://placehold.co/1200x300/013549/white?text=Banner+del+Libro', alt: 'Banner', caption: '' }, style: { textAlign: 'center', padding: '0px' } },
      { id: 'alert1', type: BlockType.ALERT, content: { type: 'info', cardStyle: 'card' }, style: {}, areas: { content: [
        { id: 'ah1', type: BlockType.HEADING, content: { text: 'Lorem Ipsum Dolor Sit Amet', level: 'h4', colorClass: 'text-info' }, style: {} },
        { id: 'at1', type: BlockType.TEXT, content: { text: '<p>De acuerdo con la <em>guía de referencia</em>, el concepto se refiere a la aplicación de un enfoque sistemático, disciplinado y cuantificable al desarrollo, funcionamiento y mantenimiento del tema. Esta guía establece 3 elementos importantes que exploraremos a continuación.</p>' }, style: {} },
        { id: 'tabs1', type: BlockType.TABS, content: { orientation: 'vertical', items: [{ id: 'item-0', title: 'Sistemático' }, { id: 'item-1', title: 'Disciplinado' }, { id: 'item-2', title: 'Cuantificable' }] }, style: {}, areas: {
          'item-0': [{ id: 'tp0', type: BlockType.TEXT, content: { text: '<h5 class="text-primary">Sistemático:</h5><p>Se refiere a que está compuesto por un conjunto de actividades que se realizan de manera metódica, ordenada y organizada. Lorem ipsum dolor sit amet consectetur adipiscing elit.</p>' }, style: {} }],
          'item-1': [{ id: 'tp1', type: BlockType.TEXT, content: { text: '<h5 class="text-primary">Disciplinado:</h5><p>Dichas actividades obedecen reglas, lineamientos y principios que respetan el orden establecido. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' }, style: {} }],
          'item-2': [{ id: 'tp2', type: BlockType.TEXT, content: { text: '<h5 class="text-primary">Cuantificable:</h5><p>Se puede medir con base en métricas, lo que facilita la toma de decisiones y la mejora continua. Ut enim ad minim veniam quis nostrud exercitation ullamco.</p>' }, style: {} }],
        } },
        { id: 'ah2', type: BlockType.HEADING, content: { text: 'Enfoques del tema', level: 'h5', colorClass: 'text-primary' }, style: { textAlign: 'center', padding: '0px' } },
        { id: 'img2', type: BlockType.IMAGE, content: { src: 'https://placehold.co/800x400/013549/white?text=Diagrama+o+Infografía', alt: 'Diagrama', caption: 'Figura 1. Lorem ipsum dolor sit amet consectetur.' }, style: { textAlign: 'center', padding: '0px' } },
        { id: 'at2', type: BlockType.TEXT, content: { text: '<p>También, el tema es una disciplina que se ocupa del desarrollo, diseño, implementación y mantenimiento, utilizando principios y prácticas rigurosas. Su objetivo es crear sistemas de alta calidad, que sean confiables, eficientes y que cumplan con los requisitos del usuario.</p>' }, style: {} },
      ] } },
    ]
  },
  {
    name: 'Página interna de libro — Sección con tabs numeradas',
    description: 'Sección con H5 + párrafos + tabs horizontales numeradas + infografía + alert de cierre',
    emoji: '📄',
    blocks: (): BlockData[] => [
      { id: 'h1', type: BlockType.HEADING, content: { text: '1.2.3 Lorem ipsum dolor sit amet', level: 'h5', colorClass: 'text-primary' }, style: { textAlign: 'left', padding: '0px' } },
      { id: 't1', type: BlockType.TEXT, content: { text: '<p>Lorem ipsum dolor sit amet consectetur adipiscing elit. Surgieron por la necesidad de reducir la aparente gran sobrecarga asociada con los métodos tradicionales. Para ello, siguen los principios y valores expuestos en el <em>Manifiesto por el desarrollo ágil</em>.</p><p>En el ámbito de este campo, existen diversos métodos y marcos de trabajo diseñados para mejorar la eficiencia, la adaptabilidad y la calidad. Entre los más representativos se encuentran:</p>' }, style: {} },
      { id: 'lay1', type: BlockType.LAYOUT, content: {}, style: { padding: '0px' }, columns: [
        { id: 'c1', width: '25%', blocks: [
          { id: 'cit1', type: BlockType.CITATION, content: { title: '', text: '', iconUrl: 'https://placehold.co/150/009AB2/white?text=🔄', iconPosition: 'left', layout: 'vertical', iconSize: 'lg', titleColor: 'text-info', titleSize: 'h5', bgColor: 'white' }, style: {}, areas: { content: [] } },
        ]},
        { id: 'c2', width: '75%', blocks: [
          { id: 'tabs1', type: BlockType.TABS, content: { orientation: 'horizontal', items: [{ id: 'item-0', title: '1' }, { id: 'item-1', title: '2' }, { id: 'item-2', title: '3' }, { id: 'item-3', title: '4' }, { id: 'item-4', title: '5' }] }, style: {}, areas: {
            'item-0': [{ id: 'tp0', type: BlockType.TEXT, content: { text: '<p><strong>Lorem Ipsum</strong>, más que un concepto, es considerado uno de los marcos de trabajo más populares. Organiza el trabajo en iteraciones cortas y promueve la colaboración constante entre los miembros del equipo.</p>' }, style: {} }],
            'item-1': [{ id: 'tp1', type: BlockType.TEXT, content: { text: '<p><strong>Desarrollo Rápido (RAD):</strong> Se enfoca en la entrega rápida mediante la creación de prototipos y la participación constante del usuario. Es ideal para proyectos con requisitos cambiantes y tiempos ajustados.</p>' }, style: {} }],
            'item-2': [{ id: 'tp2', type: BlockType.TEXT, content: { text: '<p><strong>Programación Extrema (XP):</strong> Promueve buenas prácticas como desarrollo en parejas, integración continua y diseño simple. Su objetivo es mejorar la calidad y la capacidad de adaptación a cambios frecuentes.</p>' }, style: {} }],
            'item-3': [{ id: 'tp3', type: BlockType.TEXT, content: { text: '<p><strong>Híbrido Lorem-Ipsum:</strong> Combina la estructura iterativa con la flexibilidad y el enfoque visual. Es útil para equipos que desean transición suave entre modelos o adaptar el método a entornos más dinámicos.</p>' }, style: {} }],
            'item-4': [{ id: 'tp4', type: BlockType.TEXT, content: { text: '<p><strong>Desarrollo Ligero:</strong> Derivado de principios de manufactura eficiente. Busca eliminar desperdicios, optimizar recursos, reducir tiempos de entrega y maximizar el valor entregado al cliente.</p>' }, style: {} }],
          } },
        ]},
      ]},
      { id: 't2', type: BlockType.TEXT, content: { text: '<p>El dominio de estos métodos es vital para la entrega continua de valor en ambientes complejos. Este enfoque iterativo y empírico es el estándar moderno para la gestión de riesgos y el éxito de proyectos.</p><p>Interactúa con el siguiente recurso para ampliar cada método y sus principales características:</p>' }, style: {} },
      { id: 'img1', type: BlockType.IMAGE, content: { src: 'https://placehold.co/900x500/013549/white?text=Tabla+Comparativa', alt: 'Tabla comparativa', caption: 'Tabla 1. Comparativa de métodos y marcos de trabajo.' }, style: { textAlign: 'center', padding: '0px' } },
      { id: 'alert1', type: BlockType.ALERT, content: { type: 'yellow', cardStyle: 'card' }, style: {}, areas: { content: [{ id: 'aa1', type: BlockType.TEXT, content: { text: '<p>Hemos finalizado con los modelos y métodos. Ahora concluimos este saber con el enfoque práctico de la identificación del problema.</p>' }, style: {} }] } },
    ]
  },
  {
    name: 'Página de reflexión y evaluación',
    description: 'Podcast + flip cards + quiz + foro de cierre',
    emoji: '🎓',
    blocks: (): BlockData[] => [
      { id: 'b1', type: BlockType.HEADING, content: { text: 'Reflexión: Lorem Ipsum Dolor Sit Amet', level: 'h2', colorClass: 'text-primary' }, style: { textAlign: 'left', padding: '0px' } },
      { id: 'b2', type: BlockType.PODCAST, content: { title: 'Lorem ipsum dolor sit amet consectetur adipiscing elit', url: 'https://ejemplo.com/audio.mp3', customLabel: 'Reflexión', color: 'purple' }, style: { textAlign: 'left', padding: '0px' } },
      { id: 'b3', type: BlockType.HEADING, content: { text: '¿Recuerdas estos conceptos?', level: 'h4', colorClass: 'text-info' }, style: { textAlign: 'center', padding: '0px' } },
      { id: 'lay1', type: BlockType.LAYOUT, content: {}, style: { padding: '0px' }, columns: [
        { id: 'c1', width: '33%', blocks: [{ id: 'fc1', type: BlockType.FLIPCARD, content: { frontImage: 'https://placehold.co/877x565/013549/white?text=Concepto+1', backImage: 'https://placehold.co/877x565/009AB2/white?text=Lorem+ipsum+dolor+sit+amet+consectetur' }, style: { textAlign: 'left', padding: '0px' } }] },
        { id: 'c2', width: '33%', blocks: [{ id: 'fc2', type: BlockType.FLIPCARD, content: { frontImage: 'https://placehold.co/877x565/013549/white?text=Concepto+2', backImage: 'https://placehold.co/877x565/5a31b5/white?text=Sed+do+eiusmod+tempor+incididunt' }, style: { textAlign: 'left', padding: '0px' } }] },
        { id: 'c3', width: '33%', blocks: [{ id: 'fc3', type: BlockType.FLIPCARD, content: { frontImage: 'https://placehold.co/877x565/013549/white?text=Concepto+3', backImage: 'https://placehold.co/877x565/e0421f/white?text=Ut+enim+ad+minim+veniam+quis' }, style: { textAlign: 'left', padding: '0px' } }] },
      ]},
      { id: 'b4', type: BlockType.QUIZ, content: { question: '¿Cuál de las siguientes opciones describe mejor el concepto lorem ipsum?', options: [{ id: 'opt-1', label: 'A. Lorem ipsum dolor sit amet consectetur.', value: 'A' }, { id: 'opt-2', label: 'B. Sed do eiusmod tempor incididunt ut labore.', value: 'B' }, { id: 'opt-3', label: 'C. Ut enim ad minim veniam quis nostrud.', value: 'C' }, { id: 'opt-4', label: 'D. Duis aute irure dolor in reprehenderit.', value: 'D' }], correctValue: 'C', feedbackPositive: '¡Excelente! Lorem ipsum dolor sit amet consectetur adipiscing elit.', feedbackNegative: 'Revisa el contenido. Sed do eiusmod tempor incididunt ut labore et dolore.' }, style: { textAlign: 'left', padding: '0px' } },
      { id: 'b5', type: BlockType.FORUM, content: { title: 'Foro de Cierre — Lorem ipsum dolor sit amet', text: '' }, style: { textAlign: 'left', padding: '0px' }, areas: { content: [{ id: 'ft1', type: BlockType.TEXT, content: { text: '<p>Lorem ipsum dolor sit amet. Comparte tu reflexión sobre lo aprendido.</p><p><strong>Instrucciones</strong></p><ul><li>Elabora una entrada de mínimo 200 palabras.</li><li>Comenta la reflexión de al menos dos compañeros.</li><li>Usa argumentos basados en el contenido trabajado.</li></ul>' }, style: {} }] } },
    ]
  },
];
