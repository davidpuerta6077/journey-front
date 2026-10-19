import { AnyBlockContent, BlockStyle, BlockType } from '../types';

export const getDefaultContent = (type: BlockType): AnyBlockContent => {
  switch (type) {
    case BlockType.QUIZ: return { question: '', options: [{ id: 'opt-1', label: 'A. ', value: 'A' }, { id: 'opt-2', label: 'B. ', value: 'B' }, { id: 'opt-3', label: 'C. ', value: 'C' }, { id: 'opt-4', label: 'D. ', value: 'D' }], correctValue: 'B', feedbackPositive: '', feedbackNegative: '', submitText: 'Enviar', correctLabel: '¡Correcto!', incorrectLabel: 'Respuesta incorrecta.' };
    case BlockType.HEADING: return { text: 'Título Sección', level: 'h2', colorClass: 'text-primary', showDivider: false, fontWeight: 'bold' };
    case BlockType.TEXT: return { text: '' };
    case BlockType.IMAGE: return { src: 'https://placehold.co/600x400', alt: 'Imagen', caption: '', showShadow: true, imageStyle: 'rounded' };
    case BlockType.VIDEO: return { url: '', ratio: '16:9' };
    case BlockType.TABLE: return { text: '<table class="table table-bordered table-striped"><tbody><tr class="text-white bg-info"><td><strong>Encabezado 1</strong></td><td><strong>Encabezado 2</strong></td></tr><tr><td>Dato 1</td><td>Dato 2</td></tr></tbody></table>' };
    case BlockType.ALERT: return { text: '', bannerText: '', type: 'info', cardStyle: 'alert', headerTitle: 'Título' };
    case BlockType.BUTTON: return { text: 'Clic Aquí', url: '#', variant: 'primary', isFullWidth: true, isBold: true };
    case BlockType.ACCORDION: return { items: [{ id: 'item-0', title: 'Sección 1' }, { id: 'item-1', title: 'Sección 2' }], showBorder: true };
    case BlockType.FLIPCARD: return { frontImage: 'https://placehold.co/877x565/023649/white?text=Frente', backImage: 'https://placehold.co/877x565/023649/white?text=Atras', showFlipHint: true, aspectRatio: '877/565' };
    case BlockType.ICON_CARD: return { title: 'Título Tarjeta', text: '', icon: 'fa-lightbulb', iconPosition: 'left', iconSize: 'md' };
    case BlockType.DIVIDER: return { dividerStyle: 'solid', dividerColor: 'gray', dividerLabel: '' };
    case BlockType.CONCLUSION: return { title: 'Concluyamos', text: '', style: 'border', color: 'info', showTitle: true, titleSize: 'h5' };
    case BlockType.PODCAST: return { title: '', url: '', customLabel: 'Pódcast', number: '1', icon: 'fa-headphones', color: 'info', showBorder: true };
    case BlockType.TABS: return { items: [{ id: 'item-0', title: 'Pestaña 1' }, { id: 'item-1', title: 'Pestaña 2' }], orientation: 'vertical', color: 'dark' };
    case BlockType.CITATION: return { title: 'Identifiquemos', text: '', iconUrl: 'https://media.pascualbravovirtual.edu.co/repositorio/Pregrado/TRANSVERSAL_2025/TIC_COM_DIG/imagenes/Unidad+2/Iconos/01-Identifiquemos.png', iconPosition: 'left', layout: 'horizontal', iconSize: 'md', titleColor: 'text-info', titleSize: 'h5', bgColor: 'none' };
    case BlockType.TASK: return { groupMode: 'individual', itinerary: '', evaluation: '', itineraryColor: 'info', evaluationColor: 'primary', itineraryTitle: '', evaluationTitle: '' };
    case BlockType.FORUM: return { title: 'Foro de discusión', text: '', color: 'primary', showBorder: true };
    case BlockType.SABER_COLUMNS: return {};
    case BlockType.QUESTIONNAIRE: return { title: 'Instrucciones del cuestionario', text: '', color: 'purple', showBorder: true };
    case BlockType.MODAL: return { title: 'Título de la Modal', triggerText: 'Abrir Ventana', triggerType: 'button', variant: 'primary', isSolid: true, isFullWidth: false, align: 'center', size: 'md', centered: false, scrollable: false, staticBackdrop: false, animation: true, showFooter: true };
    case BlockType.POPOVER: return { triggerText: 'Ver Pista', text: '', placement: 'top', variant: 'info' };
    case BlockType.TIMELINE: return { color: 'primary', itemImageHeight: 160, items: [
      { id: 'tl-0', title: 'Fase 1', date: '2024', text: '', imageUrl: '' },
      { id: 'tl-1', title: 'Fase 2', date: '2025', text: '', imageUrl: '' },
      { id: 'tl-2', title: 'Fase 3', date: '2026', text: '', imageUrl: '' },
    ]};
    case BlockType.STAT_CARD: return { showBorder: true, items: [{ id: 'st-0', number: '0', label: '', icon: 'fa-chart-bar', color: 'info' }, { id: 'st-1', number: '0', label: '', icon: 'fa-users', color: 'primary' }, { id: 'st-2', number: '0', label: '', icon: 'fa-lightbulb', color: 'success' }] };
    case BlockType.SECTION_BANNER: return { title: 'Título de Sección', subtitle: '', icon: 'fa-flag', color: 'primary', style: 'solid' };
    case BlockType.BLOCKQUOTE: return { text: '', author: '', source: '', color: 'info', bqStyle: 'border', showIcon: true, textSize: 'md' };
    case BlockType.DOWNLOAD_CARD: return { showBorder: true, showDownloadLabel: false, items: [{ id: 'dl-0', name: 'Guía de estudio.pdf', url: '#', type: 'pdf', size: '2.4 MB' }] };
    case BlockType.CODE_BLOCK: return { code: '<!-- Escribe tu código aquí -->\n<div class="container">\n  <h1>Hola Mundo</h1>\n</div>', language: 'html', showLineNumbers: true, filename: '', theme: 'dark' };
    case BlockType.COLLAPSE_ICON: return { iconUrl: 'https://placehold.co/150/013549/white?text=🔍', iconSize: 'md', iconPosition: 'left', triggerText: 'Clic en el ícono para ver el contenido.', triggerColor: 'orange', contentTitle: '', contentText: '', bgColor: 'white', titleColor: 'text-info', showBorder: true };
    case BlockType.CARD_IMAGE: return { imageUrl: 'https://placehold.co/400x250/013549/white?text=Imagen', title: 'Título de Tarjeta', titleColor: 'text-primary', fullWidth: true, imageHeight: 220, showBorder: true, items: [{ id: 'ci-0', text: '' }, { id: 'ci-1', text: '' }, { id: 'ci-2', text: '' }] };
    case BlockType.INTRO_CARD: return { imageUrl: 'https://placehold.co/140/013549/white?text=📖', imageWidth: 140, imageCol: '2', bgColor: 'info', imagePosition: 'left' };
    default: return {};
  }
};

export const getDefaultStyle = (_type: BlockType): BlockStyle => ({ textAlign: 'left', padding: '0px' });
