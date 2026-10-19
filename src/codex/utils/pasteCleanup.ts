// --- CONSTANTES ---

const BLOCK_TAGS = new Set([
  'P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'LI', 'TD', 'TH', 'BLOCKQUOTE',
]);

const ALLOWED_TAGS = new Set([
  'P', 'BR', 'DIV',
  'B', 'STRONG', 'I', 'EM', 'U', 'S', 'SUB', 'SUP',
  'UL', 'OL', 'LI',
  'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TD', 'TH',
  'IMG', 'A',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'BLOCKQUOTE',
]);

const STRIP_ATTRS = [
  'id', 'class', 'align', 'dir', 'lang', 'role', 'aria-level',
  'width', 'height', 'valign', 'border', 'cellspacing', 'cellpadding', 'bgcolor',
];

// Orden importa: decimal antes que alpha para no confundir "1." con "a."
export const LIST_PATTERNS = [
  { regex: /^[ \s]*(\d+)[.)]\s+/, tag: 'ol' as const, type: '1' },
  // Exige que la palabra siguiente empiece en mayúscula: distingue una viñeta real
  // ("A. Introducción") de una abreviatura/sigla ("E. coli", "D. Juan escribió...").
  { regex: /^[ \s]*([A-Z])[.)]\s+(?=[A-ZÁÉÍÓÚÑ])/, tag: 'ol' as const, type: 'A' },
  { regex: /^[ \s]*([a-z])[.)]\s+/, tag: 'ol' as const, type: 'a' },
  { regex: /^[ \s]*[-•·*]\s+/,      tag: 'ul' as const, type: undefined },
] as const;

type ListPattern = typeof LIST_PATTERNS[number];

// --- UTILIDADES ---

function escapeHTML(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function unwrap(el: Element): void {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

// Extrae el valor numérico de inicio de un marcador de lista
function getListStartValue(marker: string, type: string | undefined): number {
  if (!type) return 1;
  if (type === '1') return parseInt(marker, 10) || 1;
  if (type === 'A') return marker.toUpperCase().charCodeAt(0) - 64; // A=1, B=2...
  if (type === 'a') return marker.toLowerCase().charCodeAt(0) - 96; // a=1, b=2...
  return 1;
}

// Quita el marcador de lista del primer nodo de texto del elemento
function stripListMarkerFromNode(el: HTMLElement, regex: RegExp): void {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const first = walker.nextNode() as Text | null;
  if (first) {
    first.textContent = (first.textContent || '')
      .replace(/^ /, '')
      .replace(regex, '');
  }
}

// Detecta list-style-type de CSS inline y lo convierte al atributo type de <ol>
function getListTypeFromStyle(el: HTMLElement): string | null {
  const style = el.getAttribute('style') || '';
  const m = style.match(/list-style-type\s*:\s*([^;,\s]+)/i);
  if (!m) return null;
  const v = m[1].toLowerCase().trim();
  const map: Record<string, string> = {
    'lower-alpha': 'a', 'lower-latin': 'a',
    'upper-alpha': 'A', 'upper-latin': 'A',
    'upper-roman': 'I', 'lower-roman': 'i',
    'decimal': '1',
  };
  return map[v] ?? null;
}

// --- TEXTO PLANO → HTML (con soporte de listas anidadas) ---

export function plainTextToHTML(text: string): string {
  const lines = text.split(/\n/);
  const result: string[] = [];

  type Level = { tag: string; type?: string; items: string[]; indent: number; start: number };
  const stack: Level[] = [];

  const closeLevel = () => {
    const lvl = stack.pop()!;
    const typeAttr = lvl.type ? ` type="${lvl.type}"` : '';
    const startAttr = lvl.start > 1 ? ` start="${lvl.start}"` : '';
    const html = `<${lvl.tag}${typeAttr}${startAttr}>${lvl.items.map(i => `<li>${i}</li>`).join('')}</${lvl.tag}>`;
    if (stack.length > 0) {
      // Anidar dentro del último ítem del nivel padre
      const parent = stack[stack.length - 1];
      parent.items[parent.items.length - 1] += html;
    } else {
      result.push(html);
    }
  };

  for (const raw of lines) {
    // Normalizar non-breaking spaces antes de procesar
    const lineEnd = raw.replace(/ /g, ' ').trimEnd();
    if (!lineEnd.trim()) continue;

    // Calcular indent (tabs = 2 espacios)
    const indentLen = (lineEnd.match(/^[ \t]*/)?.[0] ?? '')
      .replace(/\t/g, '  ').length;
    const trimmed = lineEnd.trim();

    let matched = false;
    for (const p of LIST_PATTERNS) {
      const markerMatch = trimmed.match(p.regex);
      if (markerMatch) {
        const item = escapeHTML(trimmed.replace(p.regex, ''));
        const startVal = getListStartValue(markerMatch[1] ?? '1', p.type as string);

        // Cerrar niveles más profundos que el indent actual
        while (stack.length > 0 && stack[stack.length - 1].indent > indentLen) {
          closeLevel();
        }

        const top = stack[stack.length - 1];
        if (top && top.indent === indentLen && top.tag === p.tag && top.type === p.type) {
          // Mismo nivel y mismo tipo: agregar ítem
          top.items.push(item);
        } else if (!top || top.indent < indentLen) {
          // Nivel más profundo: iniciar lista anidada
          stack.push({ tag: p.tag, type: p.type as string | undefined, items: [item], indent: indentLen, start: startVal });
        } else {
          // Mismo indent pero distinto tipo: cerrar y abrir nueva lista
          while (stack.length > 0 && stack[stack.length - 1].indent >= indentLen) closeLevel();
          stack.push({ tag: p.tag, type: p.type as string | undefined, items: [item], indent: indentLen, start: startVal });
        }

        matched = true;
        break;
      }
    }

    if (!matched) {
      while (stack.length > 0) closeLevel();
      result.push(`<p>${escapeHTML(trimmed)}</p>`);
    }
  }

  while (stack.length > 0) closeLevel();
  return result.join('');
}

// --- DETECCIÓN DE LISTAS EN PÁRRAFOS (Word-style) con soporte de niveles ---

function getParagraphPattern(node: Node): ListPattern | null {
  if (node.nodeName !== 'P') return null;
  const text = ((node as HTMLElement).textContent || '').replace(/ /g, ' ').trim();
  return LIST_PATTERNS.find(p => p.regex.test(text)) ?? null;
}

function getParagraphLevel(el: HTMLElement): number {
  return parseInt(el.getAttribute('data-list-level') || '1', 10);
}

function detectListsInParagraphs(doc: Document): void {
  let nodes = Array.from(doc.body.childNodes);
  let i = 0;

  while (i < nodes.length) {
    const node = nodes[i] as HTMLElement;
    const pattern = getParagraphPattern(node);
    if (!pattern) { i++; continue; }

    // Estructura de stack para listas anidadas
    type LvlStack = { el: HTMLElement; level: number };
    const baseLevel = getParagraphLevel(node);
    const rootList = doc.createElement(pattern.tag);
    if (pattern.type) rootList.setAttribute('type', pattern.type);
    // Detectar start desde el primer ítem
    const firstText = ((node as HTMLElement).textContent || '').replace(/ /g, ' ').trim();
    const firstMatch = firstText.match(pattern.regex);
    if (firstMatch && firstMatch[1]) {
      const startVal = getListStartValue(firstMatch[1], pattern.type as string);
      if (startVal > 1) rootList.setAttribute('start', String(startVal));
    }

    const listStack: LvlStack[] = [{ el: rootList, level: baseLevel }];

    let j = i;
    while (j < nodes.length) {
      const cur = nodes[j] as HTMLElement;
      const curPattern = getParagraphPattern(cur);
      if (!curPattern) break;

      const curLevel = getParagraphLevel(cur);

      // Retroceder en stack si el nivel disminuye
      while (listStack.length > 1 && listStack[listStack.length - 1].level > curLevel) {
        listStack.pop();
      }

      let targetList = listStack[listStack.length - 1].el;

      // Cambio de tipo al mismo nivel: cerrar stack hasta el padre y abrir nueva lista
      if (listStack[listStack.length - 1].level === curLevel &&
          (targetList.tagName.toLowerCase() !== curPattern.tag ||
           (targetList.getAttribute('type') ?? undefined) !== curPattern.type)) {
        if (listStack.length > 1) listStack.pop();
        const newList = doc.createElement(curPattern.tag);
        if (curPattern.type) newList.setAttribute('type', curPattern.type);
        const parentLi = listStack[listStack.length - 1].el.lastElementChild;
        if (parentLi) parentLi.appendChild(newList);
        else listStack[listStack.length - 1].el.appendChild(newList);
        listStack.push({ el: newList, level: curLevel });
        targetList = newList;
      }

      // Nivel más profundo: crear lista anidada dentro del último <li>
      if (curLevel > listStack[listStack.length - 1].level) {
        const newList = doc.createElement(curPattern.tag);
        if (curPattern.type) newList.setAttribute('type', curPattern.type);
        const parentLi = listStack[listStack.length - 1].el.lastElementChild;
        if (parentLi) parentLi.appendChild(newList);
        else listStack[listStack.length - 1].el.appendChild(newList);
        listStack.push({ el: newList, level: curLevel });
        targetList = newList;
      }

      const li = doc.createElement('li');
      li.innerHTML = cur.innerHTML;
      stripListMarkerFromNode(li, curPattern.regex);
      targetList.appendChild(li);
      cur.parentNode?.removeChild(cur);

      nodes = Array.from(doc.body.childNodes);
      // j no avanza porque removimos el nodo actual
    }

    const refNode = nodes[j];
    if (refNode) doc.body.insertBefore(rootList, refNode);
    else doc.body.appendChild(rootList);

    nodes = Array.from(doc.body.childNodes);
    i++;
  }
}

// --- LIMPIEZA DE HTML PEGADO ---

export function cleanPastedHTML(input: string): string {
  const doc = new DOMParser().parseFromString(input, 'text/html');

  // 0. Eliminar comentarios HTML
  const iter = document.createNodeIterator(doc.body, NodeFilter.SHOW_COMMENT);
  let curr: Node | null;
  const comments: Node[] = [];
  while ((curr = iter.nextNode())) comments.push(curr);
  comments.forEach(c => c.parentNode?.removeChild(c));

  // 1. Eliminar etiquetas basura (Word/Docs)
  doc.querySelectorAll('script, style, link, meta, title, xml, o\\:p, comment').forEach(n => n.remove());

  // 1b. Pre-procesar: extraer nivel de lista de párrafos Word (mso-list / margin-left)
  //     ANTES de que cleanNode stripe los estilos
  doc.querySelectorAll('p[style]').forEach(p => {
    const style = p.getAttribute('style') || '';
    const msoLevel = style.match(/mso-list:[^;]*\blevel(\d+)\b/i);
    if (msoLevel) {
      p.setAttribute('data-list-level', msoLevel[1]);
      return;
    }
    const marginMatch = style.match(/margin-left\s*:\s*([\d.]+)(pt|px|in|cm)/i);
    if (marginMatch) {
      const val = parseFloat(marginMatch[1]);
      const unit = marginMatch[2].toLowerCase();
      let pts = val;
      if (unit === 'px') pts = val * 0.75;
      if (unit === 'in') pts = val * 72;
      if (unit === 'cm') pts = val * 28.35;
      const level = Math.max(1, Math.round(pts / 36));
      if (level > 1) p.setAttribute('data-list-level', String(level));
    }
  });

  // 2a. Desempaquetar elementos que actúan como wrappers estructurales con bloques adentro
  //     (Google Docs envuelve TODO en <b> o <span>; Word usa divs; ninguno es negrita legítima)
  doc.querySelectorAll('span, b, strong').forEach(el => {
    if (el.querySelector('p, div, h1, h2, h3, h4, h5, h6, ul, ol, table, blockquote')) unwrap(el);
  });

  // 2b. Desempaquetar <b>/<strong> decorativos sin peso real (font-weight: normal/400/inherit)
  doc.querySelectorAll('b, strong').forEach(el => {
    if (/font-weight\s*:\s*(normal|400|inherit)/i.test(el.getAttribute('style') || '')) unwrap(el);
  });

  // 2c. Inferir type y start de <ol> desde los <li> ANTES de que cleanNode borre styles
  //     Google Docs pone list-style-type en cada <li>, no en el <ol>
  const LI_TYPE_MAP: Record<string, string> = {
    'lower-alpha': 'a', 'lower-latin': 'a',
    'upper-alpha': 'A', 'upper-latin': 'A',
    'decimal': '1', 'upper-roman': 'I', 'lower-roman': 'i',
  };
  doc.querySelectorAll('ol').forEach(ol => {
    // Inferir type desde primer <li> si el <ol> no tiene type ni list-style-type propio
    if (!ol.getAttribute('type') && !getListTypeFromStyle(ol as HTMLElement)) {
      const firstLi = ol.querySelector('li');
      if (firstLi) {
        const m = (firstLi.getAttribute('style') || '').match(/list-style-type\s*:\s*([^;,\s]+)/i);
        if (m) {
          const t = LI_TYPE_MAP[m[1].toLowerCase().trim()];
          if (t) ol.setAttribute('type', t);
        }
      }
    }
    // Inferir start: counter-reset en el <ol>, o value="N" en el primer <li>
    if (!ol.getAttribute('start')) {
      const cr = (( ol as HTMLElement).getAttribute('style') || '').match(/counter-reset\s*:\s*list-item\s+(\d+)/i);
      if (cr) {
        const v = parseInt(cr[1], 10) + 1;
        if (v > 1) ol.setAttribute('start', String(v));
      }
      if (!ol.getAttribute('start')) {
        const firstLi = ol.querySelector('li');
        const liVal = firstLi?.getAttribute('value');
        if (liVal && parseInt(liVal, 10) > 1) ol.setAttribute('start', liVal);
      }
    }
  });

  // 3. Convertir estilos CSS inline a etiquetas semánticas (solo elementos inline)
  //    FIX: manejar combinaciones bold+italic+underline en el mismo nodo
  Array.from(doc.querySelectorAll('[style]')).forEach(node => {
    if (!(node instanceof HTMLElement) || BLOCK_TAGS.has(node.tagName)) return;
    const style = node.getAttribute('style') || '';

    const isBold      = /font-weight\s*:\s*(bold|[6-9]\d\d)/i.test(style)
                        && node.tagName !== 'B' && node.tagName !== 'STRONG';
    const isItalic    = /font-style\s*:\s*italic/i.test(style)
                        && node.tagName !== 'I' && node.tagName !== 'EM';
    const isUnderline = /text-decoration[^;]*underline/i.test(style)
                        && node.tagName !== 'U';

    if (isBold || isItalic || isUnderline) {
      let inner = node.innerHTML;
      if (isUnderline) inner = `<u>${inner}</u>`;
      if (isItalic)    inner = `<em>${inner}</em>`;
      if (isBold)      inner = `<strong>${inner}</strong>`;
      const parent = node.parentNode;
      if (parent) {
        const tmp = doc.createElement('span');
        tmp.innerHTML = inner;
        while (tmp.firstChild) parent.insertBefore(tmp.firstChild, node);
        parent.removeChild(node);
      }
    }
  });

  // 4. Lista blanca de etiquetas y limpieza de atributos
  const cleanNode = (node: Node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName;

    if (tag === 'COLGROUP' || tag === 'COL') { el.remove(); return; }

    if (!ALLOWED_TAGS.has(tag)) {
      const parent = el.parentNode;
      if (parent) {
        // Los hijos reubicados quedan como hermanos fuera del snapshot que ya tomó el
        // forEach exterior: sin este re-procesamiento, un tag peligroso escondido dentro
        // de un wrapper no permitido (ej. <font><marquee onstart=...>) sobrevivía intacto,
        // atributos incluidos, porque nunca volvía a pasar por la lista blanca.
        const children = Array.from(el.childNodes);
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
        children.forEach(cleanNode);
      }
      return;
    }

    // Preservar atributos importantes antes de limpiar
    const typeVal = tag === 'OL' ? (el.getAttribute('type') || getListTypeFromStyle(el)) : null;
    const startVal = (() => {
      if (tag !== 'OL') return null;
      // Atributo explícito (Word, HTML nativo)
      const explicit = el.getAttribute('start');
      if (explicit && parseInt(explicit, 10) > 1) return explicit;
      // Google Docs usa counter-reset: list-item N en el style (0-indexed → +1)
      const m = (el.getAttribute('style') || '').match(/counter-reset\s*:\s*list-item\s+(\d+)/i);
      if (m) { const v = parseInt(m[1], 10) + 1; return v > 1 ? String(v) : null; }
      return null;
    })();
    const listLevel = el.getAttribute('data-list-level');
    const currentClasses = el.getAttribute('class') || '';
    const gridClasses = currentClasses.split(' ').filter(c => c === 'row' || c.startsWith('col-') || c.startsWith('offset-'));

    STRIP_ATTRS.forEach(a => el.removeAttribute(a));
    el.removeAttribute('data-list-level');
    el.removeAttribute('start');
    if (typeVal) el.setAttribute('type', typeVal);
    if (startVal) el.setAttribute('start', startVal);
    if (listLevel && tag === 'P') el.setAttribute('data-list-level', listLevel);
    if (tag === 'DIV' && gridClasses.length > 0) el.className = gridClasses.join(' ');
    if (tag !== 'IMG') el.removeAttribute('style');

    if (tag === 'TABLE') {
      el.querySelectorAll('colgroup, col').forEach(c => c.remove());
      el.className = 'table table-bordered table-striped';
      el.style.width = '100%';
      const firstRow = el.querySelector('tr');
      if (firstRow) {
        firstRow.className = 'text-white bg-info';
        Array.from(firstRow.children).forEach(cell => {
          if (!cell.querySelector('strong, b')) cell.innerHTML = `<strong>${cell.innerHTML}</strong>`;
          cell.querySelectorAll('p').forEach(p => (p as HTMLElement).style.marginBottom = '0');
        });
      }
    }

    if (tag === 'IMG') el.classList.add('img-fluid', 'rounded');
    if (tag === 'A') el.setAttribute('target', '_blank');

    if (tag === 'UL' || tag === 'OL') {
      Array.from(el.children).forEach(child => {
        if (child.tagName !== 'LI') {
          const li = doc.createElement('li');
          li.innerHTML = child.outerHTML;
          el.replaceChild(li, child);
        }
      });
    }

    if (tag === 'DIV' && el.attributes.length === 0) {
      const parent = el.parentNode;
      if (parent) { while (el.firstChild) parent.insertBefore(el.firstChild, el); parent.removeChild(el); }
      return;
    }

    Array.from(node.childNodes).forEach(cleanNode);
  };

  Array.from(doc.body.childNodes).forEach(cleanNode);

  // 5. Convertir párrafos con patrones de lista (Word exporta listas como <p>)
  detectListsInParagraphs(doc);

  // 6. Mover listas anidadas huérfanas: <li> cuyo único hijo es <ul>/<ol>
  //    debe fusionarse con el <li> anterior (artefacto de exportación Moodle/Word)
  doc.querySelectorAll('li').forEach(li => {
    const nonEmpty = Array.from(li.childNodes).filter(n =>
      !(n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim() === '')
    );
    if (
      nonEmpty.length === 1 &&
      nonEmpty[0].nodeType === Node.ELEMENT_NODE &&
      ['UL', 'OL'].includes((nonEmpty[0] as Element).tagName)
    ) {
      const nestedList = nonEmpty[0] as Element;
      const prev = li.previousElementSibling;
      if (prev && prev.tagName === 'LI') {
        prev.appendChild(nestedList);
        li.remove();
      }
    }
  });

  // 7. Unificar <ol> consecutivos del mismo tipo separados por una sola sección
  //    (artefacto Moodle: secciones numeradas como <ol> separados que quedan todos en "1.")
  //    Solo mergea <ol> adyacentes (sin contenido entre ellos)
  const bodyChildren = Array.from(doc.body.children);
  for (let i = bodyChildren.length - 1; i > 0; i--) {
    const cur = bodyChildren[i];
    const prev = bodyChildren[i - 1];
    if (
      cur.tagName === 'OL' && prev.tagName === 'OL' &&
      (cur.getAttribute('type') || '1') === (prev.getAttribute('type') || '1') &&
      !cur.hasAttribute('start')
    ) {
      Array.from(cur.children).forEach(li => prev.appendChild(li));
      cur.remove();
      bodyChildren.splice(i, 1);
    }
  }

  // 8. Numerar secuencialmente <ol> de nivel superior que tienen un solo <li>
  //    con solo contenido inline (artefacto Moodle: secciones numeradas separadas)
  const BLOCK_INLINE = new Set(['STRONG','B','EM','I','U','S','SPAN','A','BR','SUP','SUB','CODE']);
  const topOls = Array.from(doc.body.children).filter(el => el.tagName === 'OL') as HTMLElement[];
  const sectionOls = topOls.filter(ol => {
    const lis = Array.from(ol.children).filter(c => c.tagName === 'LI');
    if (lis.length !== 1) return false;
    return !Array.from(lis[0].childNodes).some(n =>
      n.nodeType === Node.ELEMENT_NODE && !BLOCK_INLINE.has((n as Element).tagName)
    );
  });
  if (sectionOls.length > 1) {
    sectionOls.forEach((ol, idx) => {
      if (idx > 0) ol.setAttribute('start', String(idx + 1));
    });
  }

  // 9. Desempaquetar <p> único dentro de <li> para evitar margin-bottom extra
  doc.querySelectorAll('li').forEach(li => {
    const blockChildren = Array.from(li.children).filter(c => c.tagName !== 'UL' && c.tagName !== 'OL');
    if (blockChildren.length === 1 && blockChildren[0].tagName === 'P') {
      const p = blockChildren[0];
      while (p.firstChild) li.insertBefore(p.firstChild, p);
      p.remove();
    }
  });

  // 9b. Convertir todos los headings a <p> — el paste nunca debe introducir títulos
  doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
    const p = doc.createElement('p');
    p.innerHTML = el.innerHTML;
    el.parentNode?.replaceChild(p, el);
  });

  // 10. Eliminar párrafos y list items vacíos
  doc.querySelectorAll('p, li').forEach(el => {
    const text = el.textContent?.replace(/ /g, ' ').trim();
    if (!text && !el.querySelector('img, br')) el.remove();
  });

  // 11. Envolver contenido bare (sin bloque raíz) en <p>
  const BLOCK_ROOT = new Set(['P','DIV','H1','H2','H3','H4','H5','H6','UL','OL','TABLE','BLOCKQUOTE','PRE','FIGURE','SECTION','ARTICLE','ASIDE','MAIN','NAV','HEADER','FOOTER']);
  const hasRootBlock = Array.from(doc.body.childNodes).some(n =>
    n.nodeType === Node.ELEMENT_NODE && BLOCK_ROOT.has((n as Element).tagName)
  );
  if (!hasRootBlock && doc.body.innerHTML.trim()) {
    doc.body.innerHTML = `<p>${doc.body.innerHTML}</p>`;
  }

  return doc.body.innerHTML;
}
