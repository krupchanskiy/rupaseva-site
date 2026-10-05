// Рантайм для страниц, перенесённых с холста Claude Design (.dc.html).
// Шаблон <x-dc> с дырками {{x}}, <sc-if>, <sc-for> и класс Component из
// <script type="text/x-dc">. При setState DOM не пересоздаётся, а
// аккуратно обновляется: меняются только атрибуты, тексты и обработчики.
// Узел с другим значением key пересоздаётся (так перезапускаются анимации).
(function () {
  window.DCLogic = class {
    constructor(p) { this.props = p || {}; this.state = {}; }
    setState(u) { Object.assign(this.state, typeof u === 'function' ? u(this.state) : u); sched(); }
    forceUpdate() { sched(); }
  };

  let inst, tpl, host, pending = false, mounted = false;
  // кадр анимации, а если вкладка в фоне и кадров нет — таймер
  function sched() {
    if (pending) return; pending = true;
    const run = () => { if (!pending) return; pending = false; render(); };
    requestAnimationFrame(run); setTimeout(run, 50);
  }

  function look(p, sc) {
    p = p.trim();
    if (p === 'true') return true; if (p === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(p)) return +p;
    let v = sc; for (const k of p.split('.')) { if (v == null) return undefined; v = v[k]; }
    return v;
  }
  function interp(s, sc) {
    const m = s.match(/^\s*\{\{([^}]+)\}\}\s*$/); if (m) return look(m[1], sc);
    return s.replace(/\{\{([^}]+)\}\}/g, (_, p) => { const v = look(p, sc); return v == null ? '' : v; });
  }
  const EV = { onclick: 'click', onmouseenter: 'mouseenter', onmouseleave: 'mouseleave', onmousemove: 'mousemove', onchange: 'input', oninput: 'input', onpointerdown: 'pointerdown', onpointermove: 'pointermove', onpointerup: 'pointerup', onpointerleave: 'pointerleave', onpointerenter: 'pointerenter', onanimationend: 'animationend', onfocus: 'focus', onblur: 'blur', onkeydown: 'keydown' };

  // Строим «черновые» узлы: атрибуты в __a, обработчики в __h, ключ в __k
  function build(n, sc, out) {
    if (n.nodeType === 3) { out.push(document.createTextNode(interp(n.nodeValue, sc))); return; }
    if (n.nodeType !== 1) return;
    const tag = n.localName;
    if (tag === 'sc-if') { if (interp(n.getAttribute('value') || '', sc)) n.childNodes.forEach(c => build(c, sc, out)); return; }
    if (tag === 'sc-for') {
      const list = interp(n.getAttribute('list') || '', sc) || []; const as = n.getAttribute('as') || 'item';
      list.forEach((it, i) => { const s2 = Object.assign(Object.create(sc), { [as]: it, $index: i }); n.childNodes.forEach(c => build(c, s2, out)); });
      return;
    }
    const el = document.createElementNS(n.namespaceURI, n.localName);
    el.__a = {}; el.__h = {}; el.__k = null;
    for (const a of n.attributes) {
      const nm = a.name.toLowerCase();
      if (nm === 'key') { el.__k = String(interp(a.value, sc)); continue; }
      if (nm.startsWith('hint-')) continue;
      if (EV[nm]) {
        const f = interp(a.value, sc);
        if (typeof f === 'function') { el.__h[EV[nm]] = f; if (nm === 'onchange') el.__h.change = f; }
        continue;
      }
      const v = interp(a.value, sc);
      if (nm === 'checked' || nm === 'disabled') { if (v && v !== 'false') el.__a[a.name] = ''; continue; }
      el.__a[a.name] = v == null ? '' : String(v);
    }
    for (const k in el.__a) el.setAttribute(k, el.__a[k]);
    const ch = []; n.childNodes.forEach(c => build(c, sc, ch)); ch.forEach(c => el.appendChild(c));
    out.push(el);
  }

  // Подключаем обработчики через постоянную обёртку, чтобы их можно было менять
  function bindEvents(el, h) {
    el.__hw = el.__hw || {};
    el.__h = h;
    for (const t in h) if (!el.__hw[t]) { const w = e => { const f = el.__h[t]; if (f) f(e); }; el.__hw[t] = w; el.addEventListener(t, w); }
  }
  function adopt(el) { // первый раз вставляем черновой узел в живой DOM
    if (el.nodeType !== 1) return el;
    bindEvents(el, el.__h || {});
    syncProps(el);
    [...el.childNodes].forEach(adopt);
    return el;
  }
  function syncProps(el) {
    if (el.localName === 'input') {
      const v = el.__a.value;
      if (v != null && el.value !== v && document.activeElement !== el) el.value = v;
      if (v != null && el.type === 'range' && el.value !== v) el.value = v;
      el.checked = 'checked' in el.__a;
    }
  }
  function same(a, b) {
    if (a.nodeType !== b.nodeType) return false;
    if (a.nodeType === 3) return true;
    return a.namespaceURI === b.namespaceURI && a.localName === b.localName && (a.__k || null) === (b.__k || null);
  }
  function morph(cur, nxt) {
    if (cur.nodeType === 3) { if (cur.nodeValue !== nxt.nodeValue) cur.nodeValue = nxt.nodeValue; return; }
    const old = cur.__a || {};
    for (const k in old) if (!(k in nxt.__a)) cur.removeAttribute(k);
    for (const k in nxt.__a) if (old[k] !== nxt.__a[k]) cur.setAttribute(k, nxt.__a[k]);
    cur.__a = nxt.__a;
    bindEvents(cur, nxt.__h);
    syncProps(cur);
    morphKids(cur, [...nxt.childNodes]);
  }
  function morphKids(parent, next) {
    const live = [...parent.childNodes].filter(n => n.nodeType === 3 || n.__a); // чужие узлы не трогаем
    let i = 0;
    for (; i < next.length; i++) {
      const c = live[i], n = next[i];
      if (c && same(c, n)) morph(c, n);
      else if (c) parent.replaceChild(adopt(n), c);
      else parent.appendChild(adopt(n));
    }
    for (; i < live.length; i++) live[i].remove();
  }

  function render() {
    const vals = inst.renderVals ? inst.renderVals() : {};
    const out = []; tpl.childNodes.forEach(c => build(c, vals, out));
    morphKids(host, out);
    if (!mounted) { mounted = true; inst.componentDidMount && inst.componentDidMount(); }
    else inst.componentDidUpdate && inst.componentDidUpdate();
  }

  document.addEventListener('DOMContentLoaded', () => {
    // шаблон лежит в инертном <template data-dc>, чтобы браузер не грузил src="{{…}}"
    const t = document.querySelector('template[data-dc]');
    const frag = t.content; // не импортируем: <img> внутри начал бы грузиться
    const x = frag.querySelector('x-dc') || frag; const h = x.querySelector('helmet');
    if (h) { [...h.children].forEach(c => document.head.appendChild(document.importNode(c, true))); h.remove(); }
    tpl = x; host = document.createElement('div'); host.className = 'dc-root'; t.replaceWith(host);
    const sc = document.querySelector('script[data-dc-script]');
    const C = new Function(sc.textContent + '\n;return Component;')();
    inst = new C({}); render();
  });
})();
