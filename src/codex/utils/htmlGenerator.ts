import { BlockData, BlockType } from '../types';

// --- FUNCIÓN DE LIMPIEZA PROFUNDA (DOM PURIFIER) ---
const cleanHTML = (rawHtml: string, isTableBlock: boolean = false): string => {
  if (!rawHtml) return '';

  const wrapper = document.createElement('div');
  wrapper.innerHTML = rawHtml;

  wrapper.querySelectorAll('colgroup, col').forEach(el => el.remove());

  const allElements = wrapper.querySelectorAll('*');
  allElements.forEach(el => {
    
    let preservedClasses = '';
    const currentClasses = el.getAttribute('class') || '';
    if (el.tagName === 'SPAN' && currentClasses) {
        const validColors = currentClasses.split(' ').filter(c => c.startsWith('text-') || c.startsWith('bg-'));
        if (validColors.length > 0) {
            preservedClasses = validColors.join(' ');
        }
    } else if (['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(el.tagName)) {
        const alignClasses = currentClasses.split(' ').filter(c => c === 'text-center' || c === 'text-start' || c === 'text-end' || c === 'text-justify');
        if (alignClasses.length > 0) preservedClasses = alignClasses.join(' ');
    }

    const bannedAttributes = [
      'style', 'class', 'dir', 'lang', 'width', 'height', 
      'align', 'valign', 'border', 'cellpadding', 'cellspacing', 'bgcolor'
    ];
    
    bannedAttributes.forEach(attr => el.removeAttribute(attr));

    if (preservedClasses) {
        el.className = preservedClasses;
    }

    if (el.tagName === 'SPAN' && !preservedClasses) {
        const parent = el.parentNode;
        if (parent) {
            while (el.firstChild) parent.insertBefore(el.firstChild, el);
            parent.removeChild(el);
        }
    }
  });

  const paragraphs = wrapper.querySelectorAll('p');
  paragraphs.forEach(p => {
    const text = p.textContent?.replace(/\u00a0/g, ' ').trim() || '';
    const hasMedia = p.querySelector('img, iframe, audio, video');
    if (!text && !hasMedia) {
        p.remove();
    }
  });

  const tables = wrapper.querySelectorAll('table');
  if (tables.length > 0) {
      tables.forEach(table => {
          table.className = 'table table-bordered table-striped';
          const firstRow = table.querySelector('tr');
          if (firstRow) {
              firstRow.className = 'text-white bg-info';
              firstRow.querySelectorAll('p').forEach(p => {
                  p.removeAttribute('style'); 
              });
          }
      });
  }

  return wrapper.innerHTML;
};

// ── HELPER: escapa caracteres HTML en campos de texto plano ──
const escapeHtml = (str: string | undefined): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// ── HELPER: renderiza area si existe, si no usa HTML string ──
const renderAreaOrHtml = (block: BlockData, areaId: string, htmlFallback: string): string => {
  const area = block.areas?.[areaId];
  if (area && area.length > 0) {
    return generateMoodleHTML(area);
  }
  return cleanHTML(htmlFallback || '');
};

export const generateMoodleHTML = (blocks: BlockData[]): string => {
  let html = '';

  blocks.forEach(block => {
    const uniqueId = block.id.replace(/-/g, '_');

    switch (block.type) {
      
      // ==========================================================================================
      // 1. IMAGEN
      // ==========================================================================================
      case BlockType.IMAGE: {
        const imgStyleClassMap: Record<string, string> = { normal: '', rounded: 'rounded', circle: 'rounded-circle', thumbnail: 'img-thumbnail' };
        const imgStyleClass = imgStyleClassMap[block.content.imageStyle || 'rounded'] || '';
        const shadowClass = block.content.showShadow !== false ? 'shadow' : '';
        const imgClass = ['img-fluid', imgStyleClass, shadowClass, 'atto_image_button_text-bottom', 'mt-1'].filter(Boolean).join(' ');
        const imgSizeAttrs = [
          block.content.width ? `width="${escapeHtml(block.content.width)}"` : '',
          block.content.height ? `height="${escapeHtml(block.content.height)}"` : '',
        ].filter(Boolean).join(' ');

        let imgContent = `<img src="${escapeHtml(block.content.src)}" alt="${escapeHtml(block.content.alt)}" role="presentation" class="${imgClass}"${imgSizeAttrs ? ' ' + imgSizeAttrs : ''}>`;

        const imgHasModal = block.content.modalEnabled === true && !!block.areas?.modal?.length;

        if (imgHasModal) {
            imgContent = `<a href="#" role="button" data-bs-toggle="modal" data-bs-target="#img_mdl_${uniqueId}" style="cursor:pointer;">${imgContent}</a>`;
        } else if (block.content.lightbox) {
            imgContent = `<a href="${escapeHtml(block.content.src)}" data-lightbox="image-${uniqueId}" data-title="${escapeHtml(block.content.caption)}">${imgContent}</a>`;
        }

        const wrapAlign = block.style?.textAlign || 'center';
        const wrapClass = wrapAlign === 'left' ? 'float-start' : wrapAlign === 'right' ? 'float-end' : 'text-center';

        html += `<div class="${wrapClass}">${imgContent}${block.content.caption ? `<br><small class="text-muted">${escapeHtml(block.content.caption)}</small>` : ''}</div>`;

        if (imgHasModal) {
            html += `<div class="modal fade" id="img_mdl_${uniqueId}" tabindex="-1" role="dialog" aria-hidden="true" aria-labelledby="img_mdl_${uniqueId}_title"><div class="modal-dialog modal-lg"><div class="modal-content"><div class="modal-header"><h5 class="modal-title" id="img_mdl_${uniqueId}_title">${escapeHtml(block.content.modalTitle)}</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div><div class="modal-body">${generateMoodleHTML(block.areas!.modal)}</div></div></div></div>`;
        }
        break;
      }

      // ==========================================================================================
      // 2. QUIZ
      // ==========================================================================================
      case BlockType.QUIZ:
        const quizId = `q_${uniqueId}`;
        const dataJson = JSON.stringify({
            val: block.content.correctValue || 'A',
            pos: encodeURIComponent(block.content.feedbackPositive || '¡Correcto!'),
            neg: encodeURIComponent(block.content.feedbackNegative || 'Incorrecto.')
        }).replace(/"/g, '&quot;').replace(/'/g, '&#39;');

        html += `
        <div class="moodle-quiz-component card mb-4 p-3 shadow-sm border bg-white">
            <div class="mb-3 fw-bold">${cleanHTML(block.content.question || '')}</div>
            <form onsubmit="return false;">
                ${block.content.options?.map((opt: any, optIdx: number) => `
                <div class="form-check mb-2 border rounded p-2">
                    <input class="form-check-input ms-1" type="radio" id="${quizId}_opt${optIdx}" name="${quizId}" value="${escapeHtml(opt.value)}">
                    <label class="form-check-label ms-4 w-100 pointer" for="${quizId}_opt${optIdx}">${cleanHTML(opt.label || '')}</label>
                </div>`).join('')}
            </form>
            <div class="quiz-feedback mt-3 p-3 rounded d-none"></div>
            <div class="mt-3">
                <button type="button" class="btn btn-primary" data-ans='${dataJson}' data-qn="${quizId}" onclick="var btn=this;var wrap=btn.closest('.moodle-quiz-component');var fb=wrap.querySelector('.quiz-feedback');var rst=btn.nextElementSibling;var qName=btn.getAttribute('data-qn');var inps=wrap.querySelectorAll('input[name='+qName+']');var sel=null;for(var i=0;i<inps.length;i++){if(inps[i].checked){sel=inps[i].value;break;}}if(!sel){alert('Selecciona una opción');return;}var dat=JSON.parse(btn.getAttribute('data-ans'));var isOk=(sel===dat.val);fb.classList.remove('d-none');fb.className='quiz-feedback mt-3 p-3 rounded '+(isOk?'alert-success':'alert-danger');fb.innerHTML=(isOk?'<strong>✅ ¡Correcto!</strong><br>':'<strong>❌ Incorrecto</strong><br>')+decodeURIComponent(isOk?dat.pos:dat.neg);if(window.MathJax&&window.MathJax.Hub){window.MathJax.Hub.Queue(['Typeset',MathJax.Hub,fb]);}btn.classList.add('d-none');rst.classList.remove('d-none');rst.style.display='inline-block';">Enviar</button>
                <button type="button" class="btn btn-secondary ms-2 d-none" onclick="var rst=this;var wrap=rst.closest('.moodle-quiz-component');var btn=rst.previousElementSibling;var fb=wrap.querySelector('.quiz-feedback');var qName=btn.getAttribute('data-qn');fb.classList.add('d-none');fb.innerHTML='';var inps=wrap.querySelectorAll('input[name='+qName+']');for(var i=0;i<inps.length;i++){inps[i].checked=false;}rst.classList.add('d-none');btn.classList.remove('d-none');">Intentar de nuevo</button>
            </div>
        </div>`;
        break;

      // ==========================================================================================
      // 3. ELEMENTOS BÁSICOS
      // ==========================================================================================
      case BlockType.HEADING:
        const level = block.content.level || 'h2';
        const hAlign = block.style?.textAlign === 'center' ? 'text-center' : (block.style?.textAlign === 'right' ? 'text-end' : 'text-start');
        const colorClass = block.content.colorClass || '';
        
        const bgHexMap: Record<string,string> = {
          'bg-primary':'#0d6efd','bg-info':'#07b3c1','bg-purple':'#5a31b5',
          'bg-orange':'#e0421f','bg-success':'#16a34a','bg-warning':'#eab308',
          'bg-danger':'#dc2626','bg-secondary':'#6c757d',
        };
        if (colorClass.startsWith('bg-')) {
          const bgHex = bgHexMap[colorClass] || '#0d6efd';
          html += `<div class="${hAlign} mb-1"><${level} style="color:#fff;background-color:${bgHex};display:inline-block;padding:2px 12px;border-radius:4px;margin:0;">${escapeHtml(block.content.text)}</${level}></div>`;
        } else {
            html += `<${level} class="${colorClass} ${hAlign} mb-1">${escapeHtml(block.content.text)}</${level}>`;
        }
        break;

      case BlockType.TEXT:
        html += block.content.text ? `${cleanHTML(block.content.text)}` : '';
        break;

      case BlockType.VIDEO: {
        const vUrl = block.content.url || '';
        const ytMatch = vUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&?\s]+)/);
        const embedSrc = ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}` : vUrl;
        html += `<div class="ratio ratio-16x9 rounded overflow-hidden mb-4 shadow-sm"><iframe src="${escapeHtml(embedSrc)}" allowfullscreen></iframe></div>`;
        break;
      }

      case BlockType.TABLE:
        const tableHtml = cleanHTML(block.content.text || '', true);
        html += `<div class="table-responsive mb-4">${tableHtml}</div>`;
        break;

      case BlockType.DIVIDER:
        html += `<hr class="my-5 border-top">`;
        break;

      // ==========================================================================================
      // 4. COMPONENTES UI
      // ==========================================================================================
      case BlockType.ALERT:
        const aType = block.content.type || 'info';
        const aBootstrapType = aType === 'yellow' ? 'warning' : aType;
        const cStyle = block.content.cardStyle || 'alert';

        // ── Contenido: area o texto ──
        const alertBody = renderAreaOrHtml(block, 'content', block.content.text || '');

        if (cStyle === 'alert') {
            html += `<div class="alert alert-${aBootstrapType} mb-2" role="alert">${alertBody}</div>`;
        } else if (cStyle === 'header_card') {
            html += `<div class="card border-${aBootstrapType} mb-2"><div class="card-header bg-${aBootstrapType} text-white fw-bold">${escapeHtml(block.content.headerTitle) || 'Info'}</div><div class="card-body text-dark">${alertBody}</div></div>`;
        } else if (cStyle === 'banner') {
             html += `<div class="row m-1 rounded shadow mb-2 bg-white rounded"><div class="col-md-2"><p><img src="${escapeHtml(block.content.imageUrl) || 'https://placehold.co/150'}" alt="" class="img-fluid rounded" role="presentation"></p></div><div class="col-md-10 align-self-center text-info"><h5>${alertBody}</h5></div></div>`;
        } else {
            html += `<div class="card border-${aBootstrapType} mb-2"><div class="card-body text-${aBootstrapType}">${alertBody}</div></div>`;
        }
        break;

      case BlockType.BUTTON: {
        const btnUrl = block.content.url || '#';
        const btnText = block.content.text || 'Botón';
        const btnVariant = block.content.variant || 'primary';
        const btnFullWidth = block.content.isFullWidth !== false;
        const btnWidthClass = btnFullWidth ? 'w-100' : '';
        const btnBoldClass = block.content.isBold !== false ? 'fw-bold' : '';
        const btnHasModal = block.content.modalEnabled === true && !!block.areas?.modal?.length;

        const btnBadgeType = block.content.badgeType || 'none';
        const btnBadgeColor = block.content.badgeColor || 'danger';
        const btnBadgeText = block.content.badgeText || '';
        const btnNeedsRelative = btnBadgeType === 'pill' || btnBadgeType === 'dot';

        let btnBadgeHtml = '';
        if (btnBadgeType === 'pill') {
          btnBadgeHtml = ` <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-${btnBadgeColor}">${escapeHtml(btnBadgeText)}<span class="visually-hidden">notificaciones</span></span>`;
        } else if (btnBadgeType === 'inline') {
          btnBadgeHtml = ` <span class="badge bg-${btnBadgeColor}">${escapeHtml(btnBadgeText)}</span>`;
        } else if (btnBadgeType === 'dot') {
          btnBadgeHtml = ` <span class="position-absolute top-0 start-100 translate-middle p-2 bg-${btnBadgeColor} border border-light rounded-circle"><span class="visually-hidden">Nueva alerta</span></span>`;
        }

        const btnVariantClass = block.content.isSolid ? `btn-${btnVariant}` : `btn-outline-${btnVariant}`;
        const btnClass = ['btn', btnVariantClass, btnWidthClass, btnBoldClass, btnNeedsRelative ? 'position-relative mt-2' : ''].filter(Boolean).join(' ');

        if (btnHasModal) {
          html += `
        <p>
          <a class="${btnClass}" href="#" role="button" data-bs-toggle="modal" data-bs-target="#btn_mdl_${uniqueId}">
            ${escapeHtml(btnText)}${btnBadgeHtml}
          </a>
        </p>
        <div class="modal fade" id="btn_mdl_${uniqueId}" tabindex="-1" role="dialog" aria-hidden="true" aria-labelledby="btn_mdl_${uniqueId}_title"><div class="modal-dialog modal-lg"><div class="modal-content"><div class="modal-header"><h5 class="modal-title" id="btn_mdl_${uniqueId}_title">${escapeHtml(block.content.modalTitle)}</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div><div class="modal-body">${generateMoodleHTML(block.areas!.modal)}</div></div></div></div>`;
        } else {
          html += `
        <p>
          <a class="${btnClass}" href="${escapeHtml(btnUrl)}" target="_blank">
            ${escapeHtml(btnText)}${btnBadgeHtml}
          </a>
        </p>`;
        }
        break;
      }

      case BlockType.ACCORDION:
        const accMainId = `accordion_${uniqueId}`;
        const accBorderClass = block.content.showBorder !== false ? '' : 'border-0';
        const accColor = block.content.color;
        const accColorClass = accColor && accColor !== 'none' ? ` accordion-${accColor}` : '';

        html += `<div class="row m-1"><div class="col-md-12"><div class="card mb-3 h-100 ${accBorderClass}"><div class="card-body"><div class="accordion${accColorClass}" id="${accMainId}">`;

        block.content.items?.forEach((item: any, i: number) => {
            const itemNum = i + 1;
            const cId = `collapse_${uniqueId}_${itemNum}`;
            const hId = `heading_${uniqueId}_${itemNum}`;

            const collapseClass = '';
            const btnCollapsedClass = 'collapsed';
            const ariaExpanded = 'false';

            const itemAreaId = item.id || `item-${i}`;
            const itemContent = renderAreaOrHtml(block, itemAreaId, item.content || '');

            html += `
            <div class="card mb-3">
                <div class="card-header p-0" id="${hId}">
                    <h2 class="mb-0">
                        <button class="btn btn-link w-100 d-flex justify-content-between align-items-center text-start p-3 ${btnCollapsedClass}" type="button" data-bs-toggle="collapse" data-bs-target="#${cId}" aria-expanded="${ariaExpanded}" aria-controls="${cId}">
                            ${escapeHtml(item.title)}
                            <span class="arrow-icon">
                                <i class="fas fa-angle-down"></i>
                                <i class="fas fa-angle-up"></i>
                            </span>
                        </button>
                    </h2>
                </div>
                <div id="${cId}" class="collapse ${collapseClass}" aria-labelledby="${hId}" data-bs-parent="#${accMainId}">
                    <div class="card-body p-4">${itemContent}</div>
                </div>
            </div>`;
        });
        html += `</div></div></div></div></div>`;
        break;

      case BlockType.TABS: {
        const isV = block.content.orientation === 'vertical';
        const tabsColor = block.content.color;
        const navPillsColorClass = tabsColor && tabsColor !== 'none' ? ` nav-pills-${tabsColor}` : '';
        if (isV) {
            const tabId = `pills-${uniqueId}`;
            html += `
            <div class="card m-1 mb-3 border border-light rounded bg-white text-dark">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-3 px-3">
                            <div class="card-body">
                                <ul class="nav nav-pills flex-column w-100${navPillsColorClass}" id="${tabId}-tab" role="tablist" style="list-style: none;">
                                    ${block.content.items?.map((it: any, i: number) => `
                                    <li class="nav-item mb-2" role="presentation">
                                        <button class="nav-link ${i === 0 ? 'active' : ''} w-100" id="${tabId}-${i}-tab" data-bs-toggle="pill" data-bs-target="#${tabId}-${i}" type="button" role="tab" aria-controls="${tabId}-${i}" aria-selected="${i === 0 ? 'true' : 'false'}">
                                            ${escapeHtml(it.title)}
                                            <i class="fa-solid fa-caret-right ms-2"></i>
                                        </button>
                                    </li>`).join('')}
                                </ul>
                            </div>
                        </div>
                        <div class="col-md-9 px-3">
                            <div class="tab-content" id="${tabId}-tabContent">
                                <hr>
                                ${block.content.items?.map((it: any, i: number) => {
                                  const tabItemAreaId = it.id || `item-${i}`;
                                  const tabContent = renderAreaOrHtml(block, tabItemAreaId, it.content || '');
                                  return `
                                <div aria-labelledby="${tabId}-${i}-tab" class="tab-pane fade ${i === 0 ? 'show active' : ''}" id="${tabId}-${i}" role="tabpanel">
                                    <div class="card-body">
                                        ${tabContent}
                                    </div>
                                </div>`;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        } else {
            html += `
            <div class="row m-1">
                <div class="col-12">
                    <div class="card mb-3 h-100">
                        <div class="card-body">
                            <ul class="nav nav-pills nav-fill${navPillsColorClass}" role="tablist" style="list-style: none;">
                                ${block.content.items?.map((it: any, i: number) => `
                                <li class="nav-item" role="presentation">
                                    <a class="btn nav-link ${i === 0 ? 'active' : ''}" data-bs-toggle="tab" href="#h_${uniqueId}_${i}" role="tab" aria-controls="h_${uniqueId}_${i}" aria-selected="${i === 0 ? 'true' : 'false'}" tabindex="${i === 0 ? '0' : '-1'}">${escapeHtml(it.title)}</a>
                                </li>`).join('')}
                            </ul>
                            <div class="mt-3 tab-content border rounded p-3">
                                ${block.content.items?.map((it: any, i: number) => {
                                  const tabHAreaId = it.id || `item-${i}`;
                                  const tabContent = renderAreaOrHtml(block, tabHAreaId, it.content || '');
                                  return `<div class="tab-pane fade ${i === 0 ? 'show active' : ''}" id="h_${uniqueId}_${i}" role="tabpanel">${tabContent}</div>`;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        }
        break;
      }

      case BlockType.MODAL: {
        const mVar = block.content.variant || 'primary';
        const mSize = block.content.size || 'md';
        const mTrig = block.content.triggerType || 'button';
        const mId = `mdl_${uniqueId}`;
        const mLabel = escapeHtml(block.content.triggerText) || 'Abrir';

        const dlgClasses = ['modal-dialog',
          mSize === 'fullscreen' ? 'modal-fullscreen' : (mSize !== 'md' ? `modal-${mSize}` : ''),
          block.content.centered ? 'modal-dialog-centered' : '',
          block.content.scrollable ? 'modal-dialog-scrollable' : '',
        ].filter(Boolean).join(' ');
        const fadeClass = block.content.animation !== false ? ' fade' : '';
        const backdropAttrs = block.content.staticBackdrop ? ' data-bs-backdrop="static" data-bs-keyboard="false"' : '';

        let mTrigHtml;
        if (mTrig === 'text') {
          mTrigHtml = `<a href="#" role="button" class="text-${mVar} fw-bold" data-bs-toggle="modal" data-bs-target="#${mId}">${mLabel}</a>`;
        } else if (mTrig === 'badge') {
          mTrigHtml = `<span class="badge bg-${mVar}" role="button" style="cursor:pointer;" data-bs-toggle="modal" data-bs-target="#${mId}">${mLabel}</span>`;
        } else {
          const mBtnClass = block.content.isSolid === false ? `btn-outline-${mVar}` : `btn-${mVar}`;
          const mWidth = block.content.isFullWidth ? ' w-100' : '';
          mTrigHtml = `<button type="button" class="btn ${mBtnClass} fw-bold${mWidth}" data-bs-toggle="modal" data-bs-target="#${mId}">${mLabel}</button>`;
        }
        const mAlignClass = block.content.align === 'left' ? 'text-start' : block.content.align === 'right' ? 'text-end' : 'text-center';

        const mFooterHtml = block.content.showFooter !== false
          ? `<div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button></div>`
          : '';
        const mBodyHtml = block.areas?.modal?.length ? generateMoodleHTML(block.areas.modal) : '';

        html += `
        <p class="${mAlignClass} mb-4">${mTrigHtml}</p>
        <div class="modal${fadeClass}" id="${mId}" tabindex="-1"${backdropAttrs} role="dialog" aria-hidden="true" aria-labelledby="${mId}_title">
          <div class="${dlgClasses}">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="${mId}_title">${escapeHtml(block.content.title)}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
              </div>
              <div class="modal-body">${mBodyHtml}</div>
              ${mFooterHtml}
            </div>
          </div>
        </div>`;
        break;
      }

      case BlockType.POPOVER: {
        // data-content mantiene HTML (Moodle habilita `html:true` en su init de popovers);
        // solo se escapan comillas para no romper el atributo, no las etiquetas.
        const popoverContent = cleanHTML(block.content.text || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        html += `<div class="mb-4 text-center"><button type="button" class="btn btn-${block.content.variant || 'info'}" data-bs-container="body" data-bs-toggle="popover" data-bs-placement="${block.content.placement || 'top'}" data-bs-content="${popoverContent}" title="${escapeHtml(block.content.triggerText)}">${escapeHtml(block.content.triggerText) || 'Ver más'}</button></div>`;
        break;
      }

      // ==========================================================================================
      // 5. BLOQUES PEDAGÓGICOS
      // ==========================================================================================
      
      case BlockType.CITATION: {
        const citLayout = block.content.layout || 'horizontal';
        const citIconPos = block.content.iconPosition || 'left';
        const citationBody = renderAreaOrHtml(block, 'content', block.content.text || '');

        // Icon size — clase CSS adicional de Moodle
        const citIconSizeClass = `pb-cit-icon-${block.content.iconSize || 'md'}`;

        // Title
        const citTitleColor = block.content.titleColor || 'text-info';
        const citTitleTag = block.content.titleSize || 'h5';

        // Background — clase CSS adicional de Moodle (none = sin clase extra)
        const citBgClass = block.content.bgColor && block.content.bgColor !== 'none'
          ? `pb-cit-bg-${block.content.bgColor}`
          : '';

        if (citLayout === 'vertical') {
          // Vertical: icono arriba centrado — clase pb-citation-vertical del CSS adicional
          html += `<div class="pb-citation-vertical box-prime m-4 p-3 ${citBgClass}"><div class="text-center mb-3"><img src="${escapeHtml(block.content.iconUrl)}" alt="" class="img-fluid ${citIconSizeClass}" style="border-radius:8px;"></div><${citTitleTag} class="${citTitleColor} fw-bold mb-2">${escapeHtml(block.content.title)}</${citTitleTag}><div>${citationBody}</div></div>`;
        } else {
          // Horizontal: estructura original box-prime con d-flex
          const rev = citIconPos === 'right' ? 'flex-row-reverse' : 'flex-row';
          html += `<div class="d-flex ${rev} align-items-center mb-4 m-4 p-3 box-prime ${citBgClass}"><div class="p-3 flex-shrink-0"><img src="${escapeHtml(block.content.iconUrl)}" alt="" class="img-fluid ${citIconSizeClass}"></div><div class="flex-grow-1"><${citTitleTag} class="${citTitleColor} fw-bold">${escapeHtml(block.content.title)}</${citTitleTag}><div>${citationBody}</div></div></div>`;
        }
        break;
      }

      case BlockType.TASK: {
        const taskItinerary = renderAreaOrHtml(block, 'itinerary', block.content.itinerary || '');
        const taskEvaluation = renderAreaOrHtml(block, 'evaluation', block.content.evaluation || '');
        const showTaskAlert = block.content.groupMode !== 'none';
        const taskAlertHtml = showTaskAlert ? (() => {
          const al = block.content.groupMode === 'group' ? 'alert-success' : 'alert-warning';
          const ic = block.content.groupMode === 'group' ? 'fa-users' : 'fa-user';
          const mg = block.content.groupMode === 'group' ? 'Esta actividad debe entregarse en grupo.' : 'Esta actividad debe entregarse de manera individual.';
          return `<div class="alert ${al} d-flex align-items-center mb-3" role="alert"><i class="fas ${ic} fa-lg me-3"></i><div><strong>¡Atención!</strong> ${mg}</div></div>`;
        })() : '';
        html += `${taskAlertHtml}<div class="card border-secondary mb-4 shadow-sm"><div class="card-header bg-info text-white d-flex align-items-center"><i class="fas fa-route me-2"></i><h5 class="mb-0">Itinerario o Ruta de Desarrollo</h5></div><div class="card-body">${taskItinerary}</div></div><div class="card border-info shadow-sm"><div class="card-header bg-primary text-white d-flex align-items-center"><i class="fas fa-check-double me-2"></i><h5 class="mb-0">Técnica / Instrumento de Evaluación</h5></div><div class="card-body">${taskEvaluation}</div></div>`;
        break;
      }

      case BlockType.PODCAST: {
        const pColor = block.content.color || 'info';
        const pBorder = block.content.showBorder !== false ? `border-${pColor}` : 'border-0';
        const pText = `text-${pColor}`;
        const pLabelText = escapeHtml(block.content.customLabel) || 'Pódcast';
        const pNum = block.content.number ? ` ${escapeHtml(block.content.number)}` : '';
        const pIcon = escapeHtml(block.content.icon) || 'fa-headphones';
        html += `<div class="container"><div class="card mb-3 ${pBorder} rounded bg-white text-dark"><div class="card-body"><div class="row mx-lg-n5"><div class="col-md-2 col-sm-12 text-center"><p><i class="fa ${pIcon} ${pText} display-1 ps-3 pt-3"></i></p></div><div class="col-md-10 col-sm-12 align-self-center"><p class="${pText} text-start"><strong>${pLabelText}${pNum}:</strong> ${escapeHtml(block.content.title)}</p><p class="me-5"><audio class="w-100" controls="controls"><source src="${escapeHtml(block.content.url)}" type="audio/mpeg"></audio></p></div></div></div></div></div>`;
        break;
      }

      case BlockType.FLIPCARD: {
        // Las URLs van dentro de un string JS de comillas simples (onmouseover/onmouseout):
        // escapeHtml no alcanza (no toca comillas simples ni backslash) — se necesita escapar
        // el string JS aparte para no permitir salir del literal e inyectar código.
        const escJs = (s: string | undefined) => (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const frontImg = escapeHtml(block.content.frontImage);
        html += `<div class="row m-1 justify-content-center"><div class="col-md-6"><div class="card border-0"><div class="card-body text-center p-0"><img src="${frontImg}" alt="Pasa el cursor para ver el reverso" class="img-fluid rounded shadow-sm pointer" onmouseover="this.src='${escJs(block.content.backImage)}'" onmouseout="this.src='${escJs(block.content.frontImage)}'" style="transition:0.2s"></div></div></div></div>`;
        break;
      }

      case BlockType.ICON_CARD:
        const icC = block.content.color || 'primary';
        const icText = `text-${icC}`;
        html += `<div class="card box-prime h-100 border-0 m-1 mb-4 bg-white rounded"><div class="card-body p-4"><div class="d-flex align-items-center"><div class="me-4"><i class="fas ${block.content.icon || ''} fa-3x ${icText}"></i></div><div><h5 class="card-title mt-0 ${icText}">${escapeHtml(block.content.title)}</h5><div class="mb-0">${cleanHTML(block.content.text || '')}</div></div></div></div></div>`;
        break;

case BlockType.CONCLUSION:
        const clr = block.content.color || 'info';
        const stl = block.content.style || 'border';
        let cardClass = '';
        let titleClass = '';
        
        if (stl === 'filled') {
            cardClass = `bg-${clr} text-white mb-4`;
            titleClass = 'text-white fw-bold mb-3';
            if (clr === 'yellow' || clr === 'light') {
                cardClass = `bg-${clr} text-dark mb-4`;
                titleClass = 'text-dark fw-bold mb-3';
            }
        } else if (stl === 'filled_light') {
            // Se añade dinámicamente la clase bg-[color]-light en vez de usar style
            cardClass = `bg-${clr}-light text-dark mb-4`;
            titleClass = `text-${clr} fw-bold mb-3`;
        } else {
            cardClass = `border-${clr} bg-white mb-4`;
            titleClass = `text-${clr} fw-bold mb-3`;
        }

        // ── Contenido: area o texto ──
        const conclusionBody = renderAreaOrHtml(block, 'content', block.content.text || '');

        // Título: respeta showTitle y titleSize (h4/h5/h6)
        const conclusionTitleTag = block.content.titleSize || 'h5';
        const conclusionTitleHtml = block.content.showTitle !== false
            ? `<${conclusionTitleTag} class="${titleClass}">${escapeHtml(block.content.title)}</${conclusionTitleTag}>`
            : '';

        // El HTML ahora queda completamente limpio de atributos style
        html += `<div class="card ${cardClass}"><div class="card-body">${conclusionTitleHtml}<div class="card-text">${conclusionBody}</div></div></div>`;
        break;

      case BlockType.QUESTIONNAIRE: {
        const questionnaireBody = renderAreaOrHtml(block, 'content', block.content.text || '');
        const qColor = block.content.color || 'purple';
        const qBorderStyle = block.content.showBorder !== false ? 'shadow-sm' : 'border-0';
        html += `<div class="card border-${qColor} mb-4 ${qBorderStyle}"><div class="card-header bg-${qColor} text-white fw-bold"><i class="fa fa-check-square-o me-2"></i>${escapeHtml(block.content.title)}</div><div class="card-body">${questionnaireBody}</div></div>`;
        break;
      }

      case BlockType.FORUM: {
        const forumBody = renderAreaOrHtml(block, 'content', block.content.text || '');
        const fColor = block.content.color || 'primary';
        const fBorderStyle = block.content.showBorder !== false ? 'shadow-sm' : 'border-0';
        const showForumAlert = block.content.groupMode === 'individual' || block.content.groupMode === 'group';
        const forumAlertHtml = showForumAlert ? (() => {
          const al = block.content.groupMode === 'group' ? 'alert-success' : 'alert-warning';
          const ic = block.content.groupMode === 'group' ? 'fa-users' : 'fa-user';
          const mg = block.content.groupMode === 'group' ? 'Esta actividad debe entregarse en grupo.' : 'Esta actividad debe entregarse de manera individual.';
          return `<div class="alert ${al} d-flex align-items-center mb-3" role="alert"><i class="fas ${ic} fa-lg me-3"></i><div><strong>¡Atención!</strong> ${mg}</div></div>`;
        })() : '';
        html += `${forumAlertHtml}<div class="card border-${fColor} mb-4 ${fBorderStyle}"><div class="card-header bg-${fColor} text-white fw-bold"><i class="fa fa-comments me-2"></i>${escapeHtml(block.content.title)}</div><div class="card-body">${forumBody}</div></div>`;
        break;
      }

      // ==========================================================================================
      // 6. LAYOUTS
      // ==========================================================================================
      
      case BlockType.SABER_COLUMNS:
        html += `<div class="row m-1">`;
        block.columns?.forEach(col => {
            const innerContent = generateMoodleHTML(col.blocks);
            html += `
            <div class="col-md-6 col-sm-12">
                <div class="card mb-3 h-100">
                    <div class="row g-0">
                        <div class="col-12">
                            <div class="card-body">
                                ${innerContent}
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        });
        html += `</div>`;
        break;

      case BlockType.LAYOUT:
        html += `<div class="row m-1">`;
        block.columns?.forEach(col => {
            let cls = 'col-md-6';
            const w = parseInt(col.width) || 50;

            if (w > 90) cls = 'col-12';
            else if (w > 70) cls = 'col-md-9';
            else if (w > 60) cls = 'col-md-8';
            else if (w > 45) cls = 'col-md-6';
            else if (w > 30) cls = 'col-md-4';
            else if (w > 20) cls = 'col-md-3';

            html += `<div class="${cls}">${generateMoodleHTML(col.blocks)}</div>`;
        });
        html += `</div>`;
        break;


      // ==========================================================================================
      // 7. NUEVOS COMPONENTES
      // ==========================================================================================

case BlockType.TIMELINE: {
        const tlColor = block.content.color || 'primary';
        html += `<div class="pb-afrodita-timeline pb-timeline-${tlColor}">`;
        block.content.items?.forEach((item: any) => {
          html += `
          <div class="pb-timeline-item">
            <div class="pb-timeline-dot"></div>
            ${item.date ? `<small class="pb-timeline-date">${escapeHtml(item.date)}</small>` : ''}
            <div class="card border-0 shadow-sm pb-timeline-card">
              ${item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" class="img-fluid pb-timeline-img">` : ''}
              <div class="card-body pb-timeline-body">
                <p class="fw-bold pb-timeline-title">${escapeHtml(item.title)}</p>
                <p class="text-muted pb-timeline-text">${escapeHtml(item.text)}</p>
              </div>
            </div>
          </div>`;
        });
        html += `</div>`;
        break;
      }

      case BlockType.STAT_CARD: {
        const items = block.content.items || [];
        const colSize = items.length === 2 ? 'col-md-6' : items.length >= 3 ? 'col-md-4' : 'col-12';
        
        const statBorderClass = block.content.showBorder !== false ? 'shadow-sm' : 'border-0';
        html += `<div class="row pb-stat-row">`;
        items.forEach((item: any) => {
          const clr = item.color || 'info';
          html += `
          <div class="${colSize} pb-stat-col">
            <div class="card border-0 ${statBorderClass} text-center pb-stat-card pb-stat-border-${clr}">
              <div class="card-body pb-stat-body">
                <i class="fas ${item.icon || 'fa-chart-bar'} fa-2x pb-stat-icon text-${clr}"></i>
                <div class="display-4 fw-bolder pb-stat-number text-${clr}">${escapeHtml(item.number)}</div>
                <p class="text-muted text-uppercase fw-bold pb-stat-label">${escapeHtml(item.label)}</p>
              </div>
            </div>
          </div>`;
        });
        html += `</div>`;
        break;
      }


     case BlockType.COLLAPSE_ICON: {
  const colId = `col_${uniqueId}`;
  const citIconSizeClass = `pb-cit-icon-${block.content.iconSize || 'md'}`;
  const bgField = block.content.bgColor || 'white';
  const bgClass = bgField === 'none' ? '' : `pb-cit-bg-${bgField}`;
  const triggerColorClass = `text-${block.content.triggerColor || 'orange'}`;
  const titleColorClass = block.content.titleColor || 'text-info';

  html += `
  <div class="d-flex flex-row align-items-center box-prime ${bgClass} m-4 p-3">
    <div class="p-3 flex-shrink-0">
      <a href="#${colId}" data-bs-toggle="collapse" style="cursor:pointer;" aria-expanded="false" aria-controls="${colId}">
        <img src="${escapeHtml(block.content.iconUrl)}" class="img-fluid ${citIconSizeClass}" alt="icono">
      </a>
    </div>
    <div class="flex-grow-1">
      <h5 class="mb-0">
        <strong>
          <a href="#${colId}" data-bs-toggle="collapse" class="${triggerColorClass}" style="text-decoration:none;cursor:pointer;" aria-expanded="false" aria-controls="${colId}">
            ${escapeHtml(block.content.triggerText) || 'Clic para ver el contenido'}
            <i class="fas fa-chevron-down ms-2" style="font-size:0.8em;"></i>
          </a>
        </strong>
      </h5>
      <div class="collapse mt-3" id="${colId}">
        <div class="p-3 border-start ${titleColorClass.replace('text-','border-')} rounded">
          ${block.content.contentTitle ? `<h6 class="${titleColorClass} fw-bold mb-3">${escapeHtml(block.content.contentTitle)}</h6>` : ''}
          <div class="list-content">
            ${cleanHTML(block.content.contentText || '')}
          </div>
        </div>
      </div>
    </div>
  </div>`;
  break;
}

      case BlockType.CARD_IMAGE: {
        const titleColorClass = block.content.titleColor || 'text-primary';
        const cardBody = renderAreaOrHtml(block, 'content', '');
        const widthAttr = block.content.fullWidth ? '' : 'style="width: 28rem;"';

        html += `
        <div class="card" ${widthAttr}>
          ${block.content.imageUrl ? `<img src="${escapeHtml(block.content.imageUrl)}" class="card-img-top" alt="${escapeHtml(block.content.title)}">` : ''}
          <div class="card-body">
            ${block.content.title ? `<h5 class="card-title ${titleColorClass}">${escapeHtml(block.content.title)}</h5>` : ''}
            ${cardBody}
          </div>
        </div>`;
        break;
      }

      case BlockType.CODE_BLOCK: {
  const lang = block.content.language || 'html';
  const filename = block.content.filename || '';
  const cleanLang = lang.toLowerCase() === 'js' ? 'javascript' : lang.toLowerCase();

const escaped = (block.content.code || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/\n/g, '&#10;');

  html += `
  <div class="pb-code-block-wrapper">
    <div class="pb-code-header">
      <div class="pb-code-dots">
        <span class="pb-dot-red"></span>
        <span class="pb-dot-yellow"></span>
        <span class="pb-dot-green"></span>
        ${filename ? `<span class="pb-code-filename">${escapeHtml(filename)}</span>` : ''}
      </div>
      <span class="bg-code-${cleanLang} fw-bold rounded pb-code-badge px-2 py-1 ${cleanLang === 'javascript' ? 'text-dark' : 'text-white'}">${lang.toUpperCase()}</span>
    </div>
    <pre class="pb-code-pre language-${cleanLang}" style="margin:0;border-radius:0 0 8px 8px;"><code class="language-${cleanLang}">${escaped}</code></pre>
  </div>`;
  break;
}

  case BlockType.SECTION_BANNER: {
        const sbColor = block.content.color || 'primary';
        const sbStyle = block.content.style || 'solid';
        const sbMap: Record<string,string> = {
          primary:'#0d6efd', info:'#07b3c1', success:'#198754', danger:'#dc3545',
          warning:'#ffc107', yellow:'#d4a000', purple:'#6f42c1', orange:'#fd7e14', secondary:'#6c757d'
        };
        const sbLightMap: Record<string,string> = {
          primary:'#cfe2ff', info:'#cff4fc', success:'#d1e7dd', danger:'#f8d7da',
          warning:'#fff3cd', yellow:'#fff8e6', purple:'#e9e0f8', orange:'#ffe5d0', secondary:'#e2e3e5'
        };
        const sbHex = sbMap[sbColor] || sbMap.primary;
        const sbLight = sbLightMap[sbColor] || sbLightMap.primary;
        const iconSize = block.content.iconSize || 'md';
        const iconBoxSizeMap: Record<string,string> = { sm:'32px', md:'44px', lg:'58px' };
        const iconFontSizeMap: Record<string,string> = { sm:'1.1rem', md:'1.6rem', lg:'2.2rem' };
 
        let wrapStyle = 'margin-bottom:16px;';
        let titleStyle = `color:${sbHex};font-weight:800;font-size:1.15rem;margin-bottom:2px;`;
        let subtitleStyle = 'color:#6c757d;font-size:0.88rem;margin-bottom:0;';
        let iconColor = sbHex;
        let iconBg = `${sbHex}22`;
 
        if (sbStyle === 'solid') {
          wrapStyle += `background-color:${sbHex};border-radius:12px;padding:20px 28px;`;
          titleStyle = 'color:white;font-weight:800;font-size:1.15rem;margin-bottom:2px;';
          subtitleStyle = 'color:rgba(255,255,255,0.85);font-size:0.88rem;margin-bottom:0;';
          iconColor = 'white'; iconBg = 'rgba(255,255,255,0.2)';
        } else if (sbStyle === 'light') {
          wrapStyle += `background-color:${sbLight};border-left:6px solid ${sbHex};border-radius:0 8px 8px 0;padding:18px 24px;`;
        } else if (sbStyle === 'outline') {
          wrapStyle += `border:2px solid ${sbHex};border-radius:12px;padding:18px 24px;background-color:white;`;
        } else if (sbStyle === 'gradient') {
          wrapStyle += `background:linear-gradient(135deg,${sbHex}18 0%,${sbLight} 100%);border-radius:12px;padding:20px 28px;border-left:4px solid ${sbHex};`;
        }
 
        html += `
        <div style="${wrapStyle}">
          <div class="d-flex align-items-center">
            ${block.content.icon ? `
            <div class="d-flex align-items-center justify-content-center flex-shrink-0 me-3"
              style="width:${iconBoxSizeMap[iconSize]};height:${iconBoxSizeMap[iconSize]};background-color:${iconBg};border-radius:10px;">
              <i class="fas ${block.content.icon}" style="color:${iconColor};font-size:${iconFontSizeMap[iconSize]};"></i>
            </div>` : ''}
            <div>
              <h3 style="${titleStyle}">${escapeHtml(block.content.title)}</h3>
              ${block.content.subtitle ? `<p style="${subtitleStyle}">${escapeHtml(block.content.subtitle)}</p>` : ''}
            </div>
          </div>
        </div>`;
        break;
      }

    case BlockType.DOWNLOAD_CARD: {
        html += `<div class="pb-download-card-container">`;
        block.content.items?.forEach((item: any) => {
          const type = item.type || 'default';
          html += `
          <div class="d-flex align-items-center bg-white border rounded shadow-sm pb-download-card-row">
            <div class="d-flex align-items-center justify-content-center rounded pb-download-icon-frame pb-download-bg-${type}">
              <i class="fas fa-file-${type === 'pdf' ? 'pdf' : type === 'word' ? 'word' : type === 'excel' ? 'excel' : 'alt'} fa-lg pb-download-icon-${type}"></i>
            </div>
            <div class="flex-grow-1 overflow-hidden pb-download-meta-frame">
              <p class="fw-bold mb-0 pb-download-name text-dark">${escapeHtml(item.name)}</p>
              ${item.size ? `<small class="text-muted pb-download-size-text">${escapeHtml(item.size)}</small>` : ''}
            </div>
            <a href="${escapeHtml(item.url) || '#'}" target="_blank" class="btn rounded pb-download-action-btn pb-download-btn-${type}" aria-label="Descargar ${escapeHtml(item.name) || 'archivo'}">
              <i class="fas fa-download text-white"></i>
            </a>
          </div>`;
        });
        html += `</div>`;
        break;
      }

      case BlockType.INTRO_CARD: {
        const bgColorMap: Record<string, string> = {
          info: 'bg-info-light', primary: 'bg-primary-light', success: 'bg-success-light',
          danger: 'bg-danger-light', warning: 'bg-warning-light', yellow: 'bg-warning-light',
          purple: 'bg-purple-light', orange: 'bg-orange-light', secondary: 'bg-secondary-light',
        };
        const bgClass = bgColorMap[block.content.bgColor || 'info'] || 'bg-info-light';
        // Clamp a 1-11 para que la columna de texto (12 - imgCol) nunca sea col-md-0 ni negativa
        const imgColNum = Math.min(11, Math.max(1, parseInt(block.content.imageCol || '2') || 2));
        const imgCol = String(imgColNum);
        const textCol = String(12 - imgColNum);
        const width = block.content.imageWidth || 140;
        const contentBody = renderAreaOrHtml(block, 'content', '');

        html += `
        <div class="card mb-3 rounded ${bgClass}">
          <div class="card-body">
            <div class="row">
              <div class="col-md-${imgCol} d-flex justify-content-center align-self-center">
                <img src="${escapeHtml(block.content.imageUrl)}" alt="" class="img-fluid rounded" width="${width}">
              </div>
              <div class="col-md-${textCol}">
                ${contentBody}
              </div>
            </div>
          </div>
        </div>`;
        break;
      }

      case BlockType.BLOCKQUOTE: {
        const bqColor = block.content.color || 'info';
        const bqStyle = block.content.bqStyle || 'border';
        const bqHexMap: Record<string,string> = {
          primary:'#0d6efd', info:'#07b3c1', success:'#198754', danger:'#dc3545',
          warning:'#ffc107', yellow:'#d4a000', purple:'#6f42c1', orange:'#fd7e14', secondary:'#6c757d'
        };
        const bqLightMap: Record<string,string> = {
          primary:'#cfe2ff', info:'#cff4fc', success:'#d1e7dd', danger:'#f8d7da',
          warning:'#fff3cd', yellow:'#fff8e6', purple:'#e9e0f8', orange:'#ffe5d0', secondary:'#e2e3e5'
        };
        const bqHex = bqHexMap[bqColor] || bqHexMap.info;
        const bqLight = bqLightMap[bqColor] || bqLightMap.info;
        const textSizeMap: Record<string,string> = { sm:'0.9rem', md:'1.05rem', lg:'1.2rem' };
        const tSize = textSizeMap[block.content.textSize || 'md'] || '1.05rem';
        const showIcon = block.content.showIcon !== false;
        let bqContainerStyle = '';
        if (bqStyle === 'border') {
          bqContainerStyle = `border-left:5px solid ${bqHex};padding-left:20px;padding-top:8px;padding-bottom:8px;margin:16px 0;`;
        } else if (bqStyle === 'filled') {
          bqContainerStyle = `background-color:${bqLight};border-left:5px solid ${bqHex};border-radius:0 8px 8px 0;padding:20px 24px;margin:16px 0;`;
        } else {
          bqContainerStyle = `background-color:${bqLight};border-radius:8px;padding:20px 24px;margin:16px 0;border:1px solid ${bqHex}44;`;
        }
        html += `<div style="${bqContainerStyle}">
          ${showIcon ? `<i class="fas fa-quote-left mb-2 d-block" style="color:${bqHex};opacity:0.4;font-size:1.4rem;"></i>` : ''}
          <p style="font-size:${tSize};font-style:italic;color:#2b303a;line-height:1.7;margin-bottom:10px;">"${escapeHtml(block.content.text)}"</p>
          ${(block.content.author || block.content.source) ? `<footer style="font-size:0.88rem;color:#6c757d;margin-top:8px;">${block.content.author ? `<strong style="color:#343a40;">— ${escapeHtml(block.content.author)}</strong>` : ''}${block.content.source ? ` (${escapeHtml(block.content.source)})` : ''}</footer>` : ''}
        </div>`;
        break;
      }

      default:
        break;
    }
  });

  // Espacio, no cadena vacía: un salto de línea entre tags es inofensivo (HTML colapsa
  // espacios), pero uno dentro de texto plano de usuario (ej. un input sin rich-text con
  // salto de línea pegado) no debe desaparecer y juntar palabras.
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/[\r\n]+/g, ' ')
    // Icono vacío <i ...></i> → se le mete un comentario para que el TinyMCE de Moodle no lo borre.
    .replace(/(<i\b[^>]*>)\s*(<\/i>)/g, '$1<!-- -->$2');
};