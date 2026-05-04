/**
 * myHQ Learning Progress Widget
 * ─────────────────────────────
 * Drop this <script> block into any page and it self-injects
 * a floating progress card icon + slide-in panel.
 * All state is persisted in localStorage. Zero dependencies.
 *
 * localStorage keys:
 *   myhq_name           — user's full name
 *   myhq_email          — user's email
 *   myhq_ch1_complete   — "true" | null
 *   myhq_ch1_score      — "8/10" | null
 *   myhq_ch2_complete   — "true" | null
 *   myhq_ch2_score      — "2/3" | null
 *   myhq_last_page      — last page visited label
 *   myhq_registered_at  — ISO date string
 */

(function() {
  'use strict';

  // ── Read state ──────────────────────────────────────────────
  function getState() {
    return {
      name:         localStorage.getItem('myhq_name') || '',
      email:        localStorage.getItem('myhq_email') || '',
      ch1Complete:  localStorage.getItem('myhq_ch1_complete') === 'true',
      ch1Score:     localStorage.getItem('myhq_ch1_score') || null,
      ch2Complete:  localStorage.getItem('myhq_ch2_complete') === 'true',
      ch2Score:     localStorage.getItem('myhq_ch2_score') || null,
      lastPage:     localStorage.getItem('myhq_last_page') || 'Course Hub',
      registeredAt: localStorage.getItem('myhq_registered_at') || null,
    };
  }

  // ── Track page visit ─────────────────────────────────────────
  function trackCurrentPage() {
    const path = window.location.pathname;
    let label = 'Course Hub';
    if (path.includes('landing'))   label = 'Registration';
    if (path.includes('chapter1'))  label = 'Chapter 1 — India CRE';
    if (path.includes('chapter2'))  label = 'Chapter 2 — Origin Story';
    if (path.includes('chapter3'))  label = 'Chapter 3 — Business Model';
    if (path.includes('chapter4'))  label = 'Chapter 4 — Culture & Policies';
    localStorage.setItem('myhq_last_page', label);
  }
  trackCurrentPage();

  // ── Compute overall progress ─────────────────────────────────
  function computeProgress(s) {
    const total = 2; // chapters currently live
    const done  = (s.ch1Complete ? 1 : 0) + (s.ch2Complete ? 1 : 0);
    return { done, total, pct: Math.round((done / total) * 100) };
  }

  // ── Don't show on landing page ───────────────────────────────
  if (window.location.pathname.includes('landing')) return;

  // ── Inject CSS ───────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    /* ── Progress Widget ── */
    :root {
      --pw-blue:  #1E22AA;
      --pw-mint:  #ADDFB3;
      --pw-dark:  #080B1A;
      --pw-dark2: #0D1020;
      --pw-white: #FFFFFF;
      --pw-font:  'Montserrat', system-ui, -apple-system, 'Segoe UI', sans-serif;
    }

    #pw-fab {
      position: fixed;
      bottom: 28px;
      right: 28px;
      width: 54px;
      height: 54px;
      background: var(--pw-blue);
      border: none;
      cursor: pointer;
      z-index: 9000;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 5px 5px 0 rgba(30,34,170,0.35), 0 8px 32px rgba(0,0,0,0.4);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      font-family: var(--pw-font);
      flex-direction: column;
      gap: 3px;
    }
    #pw-fab:hover {
      transform: translate(-2px, -2px);
      box-shadow: 7px 7px 0 rgba(30,34,170,0.4), 0 12px 40px rgba(0,0,0,0.5);
    }
    #pw-fab:active {
      transform: translate(1px, 1px);
      box-shadow: 3px 3px 0 rgba(30,34,170,0.35);
    }

    /* Progress ring on FAB */
    #pw-fab-ring {
      position: absolute;
      inset: 0;
    }
    #pw-fab-ring circle {
      transition: stroke-dashoffset 0.6s ease;
    }
    #pw-fab-icon {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
      align-items: center;
    }
    #pw-fab-icon span {
      display: block;
      width: 16px;
      height: 2px;
      background: var(--pw-white);
    }
    #pw-fab-icon span:nth-child(2) { width: 11px; margin-right: 5px; }
    #pw-fab-icon span:nth-child(3) { width: 14px; }

    /* Badge showing % */
    #pw-fab-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      background: var(--pw-mint);
      color: var(--pw-dark);
      font-family: var(--pw-font);
      font-size: 8px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.04em;
      padding: 2px 5px;
      min-width: 26px;
      text-align: center;
      line-height: 1.4;
    }

    /* ── Overlay backdrop ── */
    #pw-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.55);
      z-index: 8999;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.22s ease;
    }
    #pw-overlay.visible {
      opacity: 1;
      pointer-events: all;
    }

    /* ── Slide-in panel ── */
    #pw-panel {
      position: fixed;
      bottom: 96px;
      right: 28px;
      width: 340px;
      background: var(--pw-dark);
      border: 1px solid rgba(255,255,255,0.1);
      border-top: 2px solid var(--pw-mint);
      box-shadow: -6px 6px 0 rgba(30,34,170,0.3), 0 24px 60px rgba(0,0,0,0.6);
      z-index: 9001;
      font-family: var(--pw-font);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
      transform: translateY(16px);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.22s ease, opacity 0.22s ease;
    }
    #pw-panel.visible {
      transform: translateY(0);
      opacity: 1;
      pointer-events: all;
    }

    .pw-header {
      padding: 18px 20px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }
    .pw-header-left {}
    .pw-eyebrow {
      font-size: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--pw-mint);
      margin-bottom: 3px;
    }
    .pw-user-name {
      font-size: 15px;
      font-weight: 700;
      color: var(--pw-white);
      letter-spacing: -0.02em;
      line-height: 1.2;
    }
    .pw-user-email {
      font-size: 9px;
      color: rgba(255,255,255,0.3);
      font-weight: 500;
      margin-top: 2px;
    }

    .pw-close {
      background: none;
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.4);
      width: 26px;
      height: 26px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-family: var(--pw-font);
      transition: all 0.15s ease;
    }
    .pw-close:hover {
      background: rgba(255,255,255,0.06);
      color: var(--pw-white);
      border-color: rgba(255,255,255,0.2);
    }

    /* Overall progress bar */
    .pw-overall {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.02);
    }
    .pw-overall-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .pw-overall-label {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(255,255,255,0.3);
    }
    .pw-overall-pct {
      font-size: 14px;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      color: var(--pw-white);
      letter-spacing: -0.02em;
    }
    .pw-bar-track {
      width: 100%;
      height: 5px;
      background: rgba(255,255,255,0.07);
      position: relative;
    }
    .pw-bar-fill {
      height: 100%;
      background: var(--pw-mint);
      transition: width 0.6s ease;
      position: relative;
    }
    .pw-bar-fill::after {
      content: '';
      position: absolute;
      right: 0; top: -2px;
      width: 2px; height: 9px;
      background: var(--pw-mint);
    }

    /* Chapter rows */
    .pw-chapters {
      padding: 12px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .pw-ch-title {
      font-size: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255,255,255,0.22);
      margin-bottom: 10px;
    }
    .pw-ch-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .pw-ch-row:last-child { border-bottom: none; }

    .pw-ch-dot {
      width: 18px;
      height: 18px;
      border: 1.5px solid rgba(255,255,255,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 8px;
      color: rgba(255,255,255,0.2);
      font-weight: 600;
    }
    .pw-ch-dot.done {
      background: var(--pw-mint);
      border-color: var(--pw-mint);
      color: var(--pw-dark);
    }
    .pw-ch-dot.active {
      border-color: var(--pw-blue);
      color: var(--pw-blue);
      background: rgba(30,34,170,0.12);
    }

    .pw-ch-info { flex: 1; min-width: 0; }
    .pw-ch-name {
      font-size: 11px;
      font-weight: 700;
      color: var(--pw-white);
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pw-ch-name.muted { color: rgba(255,255,255,0.3); }
    .pw-ch-status {
      font-size: 8px;
      font-weight: 600;
      color: rgba(255,255,255,0.28);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-top: 1px;
    }
    .pw-ch-status.mint { color: var(--pw-mint); }

    .pw-ch-score {
      font-size: 10px;
      font-weight: 800;
      color: var(--pw-mint);
      letter-spacing: -0.3px;
      flex-shrink: 0;
    }
    .pw-ch-lock {
      font-size: 11px;
      flex-shrink: 0;
      opacity: 0.2;
    }

    /* Last active */
    .pw-footer {
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .pw-last-active {
      font-size: 8px;
      font-weight: 600;
      color: rgba(255,255,255,0.2);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      line-height: 1.5;
    }
    .pw-last-active strong {
      display: block;
      color: rgba(255,255,255,0.45);
      font-size: 9px;
    }
    .pw-hub-btn {
      font-family: var(--pw-font);
      font-size: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 8px 14px;
      background: transparent;
      color: var(--pw-mint);
      border: 1px solid var(--pw-mint);
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      transition: all 0.15s ease;
    }
    .pw-hub-btn:hover {
      background: var(--pw-mint);
      color: var(--pw-dark);
    }
  `;
  document.head.appendChild(style);

  // ── Build DOM ────────────────────────────────────────────────
  function buildWidget() {
    const s = getState();

    // Don't show widget if user isn't registered
    if (!s.name) return;

    const prog = computeProgress(s);
    const firstName = s.name.split(' ')[0];

    // Circumference for SVG ring on FAB
    const r = 22, circ = 2 * Math.PI * r;
    const offset = circ - (prog.pct / 100) * circ;

    // FAB
    const fab = document.createElement('button');
    fab.id = 'pw-fab';
    fab.setAttribute('aria-label', 'View progress report card');
    fab.innerHTML = `
      <svg id="pw-fab-ring" viewBox="0 0 54 54" style="position:absolute;inset:0;">
        <circle cx="27" cy="27" r="${r}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2.5"/>
        <circle cx="27" cy="27" r="${r}" fill="none" stroke="#ADDFB3" stroke-width="2.5"
          stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
          stroke-linecap="square" transform="rotate(-90 27 27)"/>
      </svg>
      <div id="pw-fab-icon">
        <span></span><span></span><span></span>
      </div>
      <div id="pw-fab-badge">${prog.pct}%</div>
    `;

    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'pw-overlay';

    // Panel
    const panel = document.createElement('div');
    panel.id = 'pw-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Progress Report Card');

    // Chapter data
    const chapters = [
      {
        num: '01',
        name: 'India CRE — The Industry',
        complete: s.ch1Complete,
        score: s.ch1Score,
        href: 'chapter1.html',
        live: true,
      },
      {
        num: '02',
        name: 'myHQ — The Origin Story',
        complete: s.ch2Complete,
        score: s.ch2Score,
        href: 'chapter2.html',
        live: s.ch1Complete,
      },
    ];

    const chRows = chapters.map(ch => {
      const dotClass = ch.complete ? 'pw-ch-dot done' : ch.live ? 'pw-ch-dot active' : 'pw-ch-dot';
      const dotInner = ch.complete ? '✓' : ch.num;
      const nameClass = ch.live || ch.complete ? 'pw-ch-name' : 'pw-ch-name muted';
      const statusText = ch.complete ? 'Complete' : ch.live ? 'In Progress' : 'Locked';
      const statusClass = ch.complete ? 'pw-ch-status mint' : 'pw-ch-status';
      const right = ch.complete && ch.score
        ? `<div class="pw-ch-score">${ch.score}</div>`
        : !ch.live ? `<div class="pw-ch-lock">🔒</div>` : '';
      return `
        <div class="pw-ch-row">
          <div class="${dotClass}">${dotInner}</div>
          <div class="pw-ch-info">
            <div class="${nameClass}">${ch.name}</div>
            <div class="${statusClass}">${statusText}</div>
          </div>
          ${right}
        </div>
      `;
    }).join('');

    const lastVisit = s.registeredAt
      ? new Date(s.registeredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : '—';

    panel.innerHTML = `
      <div class="pw-header">
        <div class="pw-header-left">
          <div class="pw-eyebrow">Progress Report</div>
          <div class="pw-user-name">${firstName}</div>
          <div class="pw-user-email">${s.email}</div>
        </div>
        <button class="pw-close" id="pw-close-btn" aria-label="Close">&#x2715;</button>
      </div>

      <div class="pw-overall">
        <div class="pw-overall-row">
          <div class="pw-overall-label">Module 1 Overall</div>
          <div class="pw-overall-pct">${prog.pct}%</div>
        </div>
        <div class="pw-bar-track">
          <div class="pw-bar-fill" id="pw-fill" style="width:${prog.pct}%"></div>
        </div>
      </div>

      <div class="pw-chapters">
        <div class="pw-ch-title">Chapters &mdash; Module 1</div>
        ${chRows}
      </div>

      <div class="pw-footer">
        <div class="pw-last-active">
          Last page visited<strong>${s.lastPage}</strong>
        </div>
        <a class="pw-hub-btn" href="index.html">Course Hub &rarr;</a>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(panel);
    document.body.appendChild(fab);

    // ── Toggle logic ─────────────────────────────────────────
    let open = false;

    function openPanel() {
      open = true;
      panel.classList.add('visible');
      overlay.classList.add('visible');
      fab.setAttribute('aria-expanded', 'true');
    }
    function closePanel() {
      open = false;
      panel.classList.remove('visible');
      overlay.classList.remove('visible');
      fab.setAttribute('aria-expanded', 'false');
    }

    fab.addEventListener('click', () => open ? closePanel() : openPanel());
    overlay.addEventListener('click', closePanel);
    document.getElementById('pw-close-btn').addEventListener('click', closePanel);

    // Keyboard: Escape closes
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && open) closePanel();
    });
  }

  // Build after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildWidget);
  } else {
    buildWidget();
  }

  // ── Public API — call these from chapter pages ────────────────
  window.myhqProgress = {
    /**
     * Mark a chapter complete and optionally store a score.
     * Call this when a user finishes a chapter quiz.
     * @param {number} chapterNum  1 or 2
     * @param {string} [score]     e.g. "8/10"
     */
    markComplete: function(chapterNum, score) {
      localStorage.setItem('myhq_ch' + chapterNum + '_complete', 'true');
      if (score) localStorage.setItem('myhq_ch' + chapterNum + '_score', score);
    },

    /**
     * Read current progress state.
     */
    getState: getState,
  };

})();
