(function () {
    'use strict';
    if (window.__visomaster) { return; }
    window.__visomaster = true;

    var SVG = function (paths) {
        return '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
    };
    var ICON = {
        masks: SVG('<path d="M13.192 9h6.616a2 2 0 0 1 1.992 2.183l-.567 6.182a4 4 0 0 1 -3.983 3.635h-1.5a4 4 0 0 1 -3.983 -3.635l-.567 -6.182a2 2 0 0 1 1.992 -2.183z"/><path d="M15 13h.01"/><path d="M18 13h.01"/><path d="M15 16.5c1 .667 2 .667 3 0"/><path d="M8.632 15.982a4.037 4.037 0 0 1 -.382 .018h-1.5a4 4 0 0 1 -3.983 -3.635l-.567 -6.182a2 2 0 0 1 1.992 -2.183h6.616a2 2 0 0 1 2 2"/><path d="M6 8h.01"/><path d="M9 8h.01"/><path d="M6 12c.764 -.51 1.528 -.63 2.291 -.36"/>'),
        up: SVG('<path d="M6 15l6 -6l6 6"/>'),
        down: SVG('<path d="M6 9l6 6l6 -6"/>'),
        find: SVG('<path d="M15 8h.01"/><path d="M11.5 21h-5.5a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v5.5"/><path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l2 2"/><path d="M18 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M20.2 20.2l1.8 1.8"/>'),
        clearTarget: SVG('<path d="M15 8h.01"/><path d="M11.5 21h-5.5a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v5.5"/><path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l2 2"/><path d="M15.5 15.5l5 5"/><path d="M20.5 15.5l-5 5"/>'),
        clearInput: SVG('<path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0"/><path d="M6 21v-2a4 4 0 0 1 4 -4h3.5"/><path d="M22 22l-5 -5"/><path d="M17 22l5 -5"/>'),
        clear: SVG('<path d="M19 20h-10.5l-4.21 -4.3a1 1 0 0 1 0 -1.41l10 -10a1 1 0 0 1 1.41 0l5 5a1 1 0 0 1 0 1.41l-9.2 9.3"/><path d="M18 13.3l-6.3 -6.3"/>'),
        swap: SVG('<path d="M16 3l4 4l-4 4"/><path d="M10 7l10 0"/><path d="M8 13l-4 4l4 4"/><path d="M4 17l9 0"/>'),
        presets: SVG('<path d="M4 10a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M6 4v4"/><path d="M6 12v8"/><path d="M10 16a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M12 4v10"/><path d="M12 18v2"/><path d="M16 7a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M18 4v1"/><path d="M18 9v11"/>'),
        back: SVG('<path d="M5 12l14 0"/><path d="M5 12l6 6"/><path d="M5 12l6 -6"/>'),
        folder: SVG('<path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2"/>'),
        movie: SVG('<path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"/><path d="M8 4l0 16"/><path d="M16 4l0 16"/><path d="M4 8l4 0"/><path d="M4 16l4 0"/><path d="M4 12l16 0"/><path d="M16 8l4 0"/><path d="M16 16l4 0"/>'),
        hourglass: SVG('<path d="M6.5 7h11"/><path d="M6.5 17h11"/><path d="M6 20v-2a6 6 0 1 1 12 0v2a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1z"/><path d="M6 4v2a6 6 0 1 0 12 0v-2a1 1 0 0 0 -1 -1h-10a1 1 0 0 0 -1 1z"/>'),
        plug: SVG('<path d="M9.785 6l8.215 8.215l-2.054 2.054a5.81 5.81 0 1 1 -8.215 -8.215l2.054 -2.054z"/><path d="M4 20l3.5 -3.5"/><path d="M15 4l-3.5 3.5"/><path d="M20 9l-3.5 3.5"/>'),
        plugOn: SVG('<path d="M7 12l5 5l-1.5 1.5a3.536 3.536 0 1 1 -5 -5l1.5 -1.5z"/><path d="M17 12l-5 -5l1.5 -1.5a3.536 3.536 0 1 1 5 5l-1.5 1.5z"/><path d="M3 21l2.5 -2.5"/><path d="M18.5 5.5l2.5 -2.5"/><path d="M10 11l-2 2"/><path d="M13 14l-2 2"/>'),
        loader: SVG('<path d="M12 3a9 9 0 1 0 9 9"/>')
    };

    var CSS = [
        '.btnVisoMaster .vmIcon{display:inline-flex;align-items:center;justify-content:center}',
        '.btnVisoMaster.vmOn{color:#00a4dc}',
        '.vmDialogContainer{position:fixed;inset:0;z-index:1000;display:block}',
        '.vmMenu{position:fixed;width:20em;max-width:calc(100vw - 20px);margin:0}',
        '.vmMenu .actionSheetContent{min-height:0;max-height:100%}',
        '.vmMenu .actionSheetScroller{overflow-y:auto;overscroll-behavior:contain;min-height:0}',
        '.vmMenu.actionSheet .actionSheetItemAsideText{margin-left:1em !important;margin-right:.5em !important;display:block;text-align:right;flex-shrink:1;min-width:0;max-width:62%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
        '.vmMenu.actionSheet .actionSheetItemText{min-width:5.5em}',
        '.vmMenu .vmSheetTitle{cursor:pointer;display:flex;align-items:center;gap:.4em;flex-shrink:0}',
        '.vmMenu .vmSheetTitle svg{width:.9em;height:.9em;opacity:.8}',
        '.vmMenu .vmGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.4em;padding:.3em 1em .5em}',
        '.vmMenu .vmGrid.vmInGrid{padding:.1em 1em .3em;grid-auto-rows:max-content;align-content:start}',
        '.vmMenu .vmTile{position:relative;aspect-ratio:1;border:0;padding:0;border-radius:.3em;background:#333;color:#ddd;cursor:pointer;overflow:hidden;outline:2px solid transparent;outline-offset:-2px;font:inherit}',
        '.vmMenu .vmTile img{width:100%;height:100%;object-fit:cover;display:block}',
        '.vmMenu .vmTile.vmSel{outline-color:#00a4dc}',
        '.vmMenu .vmTile.vmPick::after{content:"";position:absolute;right:5px;top:5px;width:10px;height:10px;border-radius:50%;background:#00a4dc}',
        '.vmMenu .vmTile.vmPickBad::after{content:"";position:absolute;right:5px;top:5px;width:10px;height:10px;border-radius:50%;background:#e05353}',
        '.vmMenu .vmTile.vmFlash img{filter:grayscale(1) brightness(.35)}',
        '.vmMenu .vmTile.vmOff img{filter:grayscale(1);opacity:.4}',
        '.vmMenu .vmTile .vmNoFace{position:absolute;left:0;right:0;top:0;bottom:0;display:flex;align-items:center;justify-content:center;text-align:center;font-size:72%;line-height:1.2;color:#fff;padding:2px;pointer-events:none}',
        '.vmMenu .vmTile:focus{outline:none}',
        '.vmMenu .vmTile:focus-visible{box-shadow:0 0 0 2px #fff}',
        '.vmMenu .vmTile .vmName{position:absolute;left:0;right:0;bottom:0;padding:.15em .3em;background:rgba(0,0,0,.6);font-size:75%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
        '.vmMenu .vmTile .vmBadge{position:absolute;left:4px;top:4px;background:#00a4dc;color:#fff;border-radius:9px;font-size:70%;padding:0 .45em;line-height:1.5}',
        '.vmMenu .vmTile .vmEmpty{display:flex;align-items:center;justify-content:center;height:100%;font-size:2em;opacity:.6}',
        '.vmMenu .vmRow.vmSlim{min-height:0 !important;padding-top:0 !important;padding-bottom:0 !important;line-height:1}',
        '.vmMenu .vmRow.vmSlim .listItemBody{padding-top:0 !important;padding-bottom:0 !important;min-height:0 !important}',
        '.vmMenu .vmRow.vmSlim .actionsheetMenuItemIcon{padding:0 !important;margin-top:0 !important;margin-bottom:0 !important;line-height:1}',
        '.vmMenu .vmRow.vmReady{background:rgba(0,164,220,.18)}',
        '.vmMenu .vmInGrid{overflow-y:auto;overscroll-behavior:contain;scroll-snap-type:y mandatory;scrollbar-gutter:stable;box-sizing:border-box}',
        '.vmMenu .vmInGrid .vmTile{scroll-snap-align:start}',
        '.vmMenu .vmNote{padding:.4em 1em;opacity:.7;font-size:85%}',
        '.vmMenu .vmRow.vmOff{opacity:.38;pointer-events:none}',
        '.vmMenu .vmRow.vmOn .actionSheetItemAsideText{color:#00a4dc;opacity:1}',
        '@keyframes vmSpin{to{transform:rotate(360deg)}}',
        '.vmMenu .vmSpin svg{animation:vmSpin 1s linear infinite}',
        '.btnVisoMaster.vmConn{color:#7fd3ef}',
        '@keyframes vmPulse{50%{opacity:.35}}',
        '.btnVisoMaster.vmWait .vmIcon{animation:vmPulse 1.2s ease-in-out infinite}',
        '.vmNotice{position:absolute;left:50%;top:7.5rem;transform:translateX(-50%);z-index:2;background:rgba(0,0,0,.6);color:#fff;padding:.25em .7em;border-radius:.3em;font-size:80%;pointer-events:none;white-space:nowrap}',
        '.vmOverlay{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;background:transparent;opacity:0}',
        '.vmOverlay.vmShown{opacity:1}'
    ].join('\n');

    function api() { return window.ApiClient; }
    function url(path, query) { return api().getUrl(path, query); }
    function token() { return api().accessToken(); }
    function el(tag, cls, html) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (html != null) { e.innerHTML = html; } return e; }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }


    function newId() {
        var b = new Uint8Array(16);
        crypto.getRandomValues(b);
        return btoa(String.fromCharCode.apply(null, b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    var SESSION = newId();

    function post(path, body) {
        body = body || {};
        var sid = SESSION;
        body.session = sid;
        return fetch(url('VisoMasterBridge/' + path), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'MediaBrowser Token="' + token() + '"' },
            body: JSON.stringify(body)
        }).then(function (r) {
            return r.json().catch(function () { return {}; }).then(function (j) {
                if (sid !== SESSION) { var stale = new Error('stale'); stale.stale = true; throw stale; }
                if (j && j.notConnected && state.conn !== 'off') { connectionLost(); }
                if (!r.ok) { throw new Error(j.error || ('HTTP ' + r.status)); }
                return j;
            });
        });
    }

    function fail(e) {
        if (!e || e.stale) { return; }
        var m = e.message || String(e);
        if (/^HTTP \d+|Failed to fetch|NetworkError|Type error/i.test(m)) { m = 'VisoMaster did not answer - try again or reconnect.'; }
        toast(m);
    }

    function toast(text) {
        try { if (window.require) { window.require(['toast'], function (t) { t(text); }); return; } } catch (e) { }
        var t = el('div', null, esc(text));
        t.style.cssText = 'position:fixed;left:50%;bottom:6em;transform:translateX(-50%);background:#333;color:#fff;padding:.6em 1em;border-radius:.3em;z-index:1000000;font-size:90%';
        document.body.appendChild(t);
        setTimeout(function () { t.remove(); }, 4000);
    }

    function livePage() { return document.querySelector('#videoOsdPage:not(.hide)'); }
    function videoEl() { return document.querySelector('.videoPlayerContainer video.htmlvideoplayer') || document.querySelector('.videoPlayerContainer video:not(.vmOverlay)'); }
    function osdTitle() { var t = document.querySelector('#videoOsdPage:not(.hide) .osdTitle'); return t ? t.textContent.trim() : ''; }

    var nowPlaying = { itemId: '', mediaSourceId: '' };
    function playing() {
        var fav = document.querySelector('#videoOsdPage:not(.hide) .btnUserRating[data-id]');
        var local = fav ? fav.getAttribute('data-id') : '';
        var done = function (sid, msid) {
            nowPlaying.itemId = local || sid || nowPlaying.itemId;
            nowPlaying.mediaSourceId = (sid && sid === nowPlaying.itemId && msid) || nowPlaying.itemId;
            return nowPlaying;
        };
        try {
            return api().getJSON(url('Sessions', { deviceId: api().deviceId() })).then(function (list) {
                var s = (list || [])[0];
                return s && s.NowPlayingItem ? done(s.NowPlayingItem.Id, s.PlayState && s.PlayState.MediaSourceId) : done('', '');
            }, function () { return done('', ''); });
        } catch (e) { return Promise.resolve(done('', '')); }
    }

    var state = { faces: [], selected: '', groups: null, groupsError: '', openGroup: '', inputOpen: false,
        presets: null, preset: '', presetWorkspace: '', presetView: false, swapOn: false, busy: false,
        item: '', title: '', left: false, assignSeq: 0, conn: 'off', fpsCap: 0, sheet: '' };

    var FPS_CHOICES = ['Original', '24', '20', '15', '12'];
    var BUFFER_CHOICES = { '5 s': 5, '10 s': 10, '15 s': 15, '20 s': 20, '30 s': 30, '45 s': 45, '1 min': 60, '2 min': 120, '3 min': 180, '5 min': 300 };
    function pref(k, d) { try { var v = localStorage.getItem('vm.' + k); return v === null ? d : v; } catch (e) { return d; } }
    function setPref(k, v) { try { localStorage.setItem('vm.' + k, v); } catch (e) { } }
    function fpsChoice() { var c = pref('fps', ''); if (FPS_CHOICES.indexOf(c) >= 0) { return c; } var v = String(state.fpsCap || ''); return FPS_CHOICES.indexOf(v) >= 0 ? v : 'Original'; }
    function fpsValue() { var c = fpsChoice(); return c === 'Original' ? 0 : parseFloat(c); }
    function fpsLabel() { var v = fpsValue(); return v ? v + ' fps' : 'Original'; }
    function bufferChoice() { var c = pref('buffer', '30 s'); return BUFFER_CHOICES[c] ? c : '30 s'; }

    function newPlaybackSession() {
        var previous = SESSION;
        SESSION = newId();
        state.faces = []; state.selected = ''; state.openGroup = ''; state.inputOpen = false; state.busy = false;
        state.groups = null; state.groupsError = ''; state.presets = null; state.preset = ''; state.presetWorkspace = ''; state.presetView = false; state.sheet = '';
        state.item = ''; state.title = '';
        if (state.conn === 'on') {
            post('Connect', { previous: previous, join: true }).then(function (j) {
                if (j && j.notRunning) { connectionLost(); return; }
                state.preset = (j && j.preset) || '';
                return applySavedPreset();
            }).catch(function () { });
        }
    }

    var presetFor = '';
    function applySavedPreset() {
        var want = pref('preset', '');
        if (!want || want === state.preset || state.conn !== 'on' || presetFor === SESSION) { return Promise.resolve(); }
        presetFor = SESSION;
        return post('Presets').then(function (j) {
            if ((j.presets || []).indexOf(want) < 0) {
                setPref('preset', '');
                state.preset = j.current || '';
                toast('Preset "' + want + '" no longer exists - VisoMaster\'s current settings are used.');
                return;
            }
            return post('Preset', { name: want }).then(function (r) { state.preset = r.current || ''; swapChanged(); });
        }).catch(function (e) { presetFor = ''; fail(e); }).then(function () { render(); });
    }

    function sameFilm(np) {
        var title = osdTitle();
        var changed = (state.item && np.itemId && np.itemId !== state.item) || (state.title && title && title !== state.title);
        if (changed) {
            if (sw || pending) { idleSwap(); }
            newPlaybackSession();
            render();
        }
        if (np.itemId) { state.item = np.itemId; }
        if (title) { state.title = title; }
        return np;
    }

    var reloadTimer = 0;
    function onMediaLoad(e) {
        var v = videoEl();
        if (!v || e.target !== v) { return; }
        endHold = null;
        clearTimeout(reloadTimer);
        reloadTimer = setTimeout(function () {
            var before = state.item, title = state.title;
            playing().then(function (np) {
                var now = osdTitle();
                if ((before && np.itemId && np.itemId !== before) || (title && now && now !== title)) {
                    sameFilm(np);
                } else if (sw && state.swapOn && Date.now() - sw.started > 2500) {
                    sw.restartAt = Date.now();
                }
            }).catch(function () { });
        }, 1500);
    }

    var cfg = null, cfgLoading = false;
    function loadCfg() {
        if (cfgLoading || !api() || !token()) { return; }
        cfgLoading = true;
        api().getJSON(url('VisoMasterBridge/ClientConfiguration')).then(function (c) { cfg = c || {}; cfgLoading = false; ensureButton(); })
            .catch(function () { setTimeout(function () { cfgLoading = false; ensureButton(); }, 30000); });
    }

    var ANCHORS = { Favorite: '.btnUserRating', Subtitles: '.btnSubtitles', Audio: '.btnAudio' };

    var lastAutoStart = 0;
    var endHold = null;
    function autoResume() {
        if (!state.swapOn || sw || pending || state.conn !== 'on' || !hasPick() || !livePage()) { return; }
        var v = videoEl();
        if (!v || v.paused || v.ended || v.readyState < 2 || Date.now() - lastAutoStart < 3000) { return; }
        if (endHold && endHold.video === v && v.currentTime >= endHold.at - 1) { return; }
        lastAutoStart = Date.now();
        startStream();
    }

    var RESPONSIVE_STYLE_ID = 'visomasterButtonResponsiveStyle';
    function refreshResponsiveStyle() {
        var existing = document.getElementById(RESPONSIVE_STYLE_ID);
        if (!cfg || cfg.hideOnNarrow === false) { if (existing) { existing.remove(); } return; }
        if (existing) { return; }
        var style = el('style');
        style.id = RESPONSIVE_STYLE_ID;
        style.textContent = '@media all and (max-width: 50em) { .videoOsdBottom .btnVisoMaster { display: none !important; } }';
        document.head.appendChild(style);
    }
    function ensureButton() {
        var page = livePage();
        if (!page) { return; }
        if (!cfg) { loadCfg(); return; }
        if (cfg.enabled === false || cfg.configured === false) {
            var gone = page.querySelector('.btnVisoMaster');
            if (gone) { gone.remove(); }
            return;
        }
        var bar = page.querySelector('.videoOsdBottom .buttons.focuscontainer-x') || page.querySelector('.videoOsdBottom .buttons');
        if (!bar) { return; }
        var sorted = document.documentElement.hasAttribute('data-jvosd-order-br');
        var anchor = bar.querySelector(ANCHORS[sorted ? 'Favorite' : cfg.buttonPosition] || ANCHORS.Favorite) || bar.querySelector(ANCHORS.Favorite);
        var btn = bar.querySelector('.btnVisoMaster');
        if (!btn) {
            btn = document.createElement('button');
            btn.setAttribute('is', 'paper-icon-button-light');
            btn.type = 'button';
            btn.className = 'paper-icon-button-light autoSize btnVisoMaster';
            btn.title = 'VisoMaster Bridge';
            btn.setAttribute('aria-label', 'VisoMaster Bridge');
            btn.innerHTML = '<span class="xlargePaperIconButton material-icons vmIcon" aria-hidden="true">' + ICON.masks + '</span>';
            btn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); toggleMenu(btn); });
            if (anchor) { anchor.before(btn); } else { bar.appendChild(btn); }
        } else if (!sorted && anchor && btn.nextElementSibling !== anchor) {
            anchor.before(btn);
        }
        if (!sorted && anchor && btn.style.order !== anchor.style.order) { btn.style.order = anchor.style.order; }
        refreshResponsiveStyle();
        autoResume();
        var swapping = state.swapOn && state.conn === 'on' && hasPick();
        btn.classList.toggle('vmOn', swapping);
        btn.classList.toggle('vmConn', state.conn === 'on' && !swapping);
        btn.classList.toggle('vmWait', state.conn === 'wait' || !!(sw && sw.waiting));
    }

    var menu = null;
    var anchor = null;

    function nudgeIdle() {
        try { window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); } catch (e) { }
    }

    function toggleMenu(btn) { if (menu) { closeMenu(); } else { openMenu(btn); } }

    function openMenu(btn) {
        anchor = btn;
        var container = el('div', 'dialogContainer vmDialogContainer');
        var dlg = el('div', 'focuscontainer dialog actionsheet-not-fullscreen actionSheet opened vmMenu');
        dlg.setAttribute('data-history', 'false');
        dlg.setAttribute('tabindex', '-1');
        var content = el('div', 'actionSheetContent');
        var scroller = el('div', 'actionSheetScroller scrollY');
        content.appendChild(scroller);
        dlg.appendChild(content);
        container.appendChild(dlg);
        container.addEventListener('click', function (e) { if (e.target === container) { closeMenu(); } });
        dlg.addEventListener('command', function (e) {
            var c = e.detail && e.detail.command;
            if (c === 'back') { e.preventDefault(); e.stopPropagation(); back(); }
            else if (c === 'up' || c === 'down' || c === 'left' || c === 'right') { e.preventDefault(); e.stopPropagation(); move(c); }
        });
        document.body.appendChild(container);
        menu = { container: container, dlg: dlg, body: scroller, content: content, fresh: true, pushed: false };
        try { history.pushState(Object.assign({}, history.state, { vmMenu: true }), '', location.href); menu.pushed = true; } catch (e) { }
        render();
        setTimeout(nudgeIdle, 0);
        syncConnection(true);
        focusFirst();
    }

    var ignorePop = false;
    function closeMenu(fromHistory) {
        if (!menu) { return; }
        var pushed = menu.pushed;
        menu.container.remove();
        menu = null;
        if (pushed && !fromHistory) { ignorePop = true; try { history.back(); } catch (e) { ignorePop = false; } }
        nudgeIdle();
        if (anchor && anchor.isConnected) { anchor.focus(); }
    }

    function back() {
        if (!menu) { return; }
        if (state.presetView) { state.presetView = false; render(); focusKey('presets'); return; }
        if (state.sheet) { var sh = state.sheet; state.sheet = ''; render(); focusKey(sh); return; }
        if (state.openGroup) { var g = state.openGroup; state.openGroup = ''; render(); focusKey('group:' + g); return; }
        closeMenu();
    }

    function focusables() { return menu ? [].slice.call(menu.dlg.querySelectorAll('button:not([disabled]), [tabindex="0"]')) : []; }
    function move(dir) {
        var f = focusables();
        var cur = document.activeElement;
        if (f.indexOf(cur) < 0) { focusFirst(); return; }
        var a = cur.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2;
        var best = null, bestScore = Infinity;
        f.forEach(function (el2) {
            if (el2 === cur) { return; }
            var b = el2.getBoundingClientRect(), bx = b.left + b.width / 2, by = b.top + b.height / 2;
            var dx = bx - ax, dy = by - ay;
            var ok = dir === 'up' ? dy < -2 : dir === 'down' ? dy > 2 : dir === 'left' ? dx < -2 && Math.abs(dy) < a.height : dx > 2 && Math.abs(dy) < a.height;
            if (!ok) { return; }
            var main = dir === 'up' || dir === 'down' ? Math.abs(dy) : Math.abs(dx);
            var side = dir === 'up' || dir === 'down' ? Math.abs(dx) : Math.abs(dy);
            var score = main + side * 2;
            if (score < bestScore) { bestScore = score; best = el2; }
        });
        if (best) { best.focus(); best.scrollIntoView({ block: 'nearest' }); }
    }

    function focusFirst() {
        var f = focusables();
        var pick = ['swap', 'find'].map(function (k) { return menu && menu.dlg.querySelector('[data-vm-key="' + k + '"]:not([disabled])'); }).filter(Boolean)[0];
        if (!pick) {
            var safe = f.filter(function (x) { return state.conn === 'off' || x.getAttribute('data-vm-key') !== 'connect'; });
            pick = safe[safe.length - 1] || (state.conn === 'off' ? f[f.length - 1] : null);
        }
        if (pick) { pick.focus(); } else if (menu) { menu.dlg.focus(); }
    }
    function focusKey(key) {
        if (!menu) { return; }
        var t = menu.dlg.querySelector('[data-vm-key="' + key + '"]');
        if (t && !t.disabled) { t.focus(); } else { focusFirst(); }
    }

    function onKey(e) {
        if (!menu) { return; }
        var k = e.key;
        var backKeys = ['Escape', 'Backspace', 'GoBack', 'BrowserBack', 'Back'];
        if (backKeys.indexOf(k) >= 0 || e.keyCode === 461 || e.keyCode === 10009) {
            e.preventDefault(); e.stopImmediatePropagation(); back(); return;
        }
        var arrows = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
        if (arrows[k]) { e.preventDefault(); e.stopImmediatePropagation(); move(arrows[k]); return; }
        if (menu.dlg.contains(document.activeElement)) { e.stopImmediatePropagation(); }
    }

    function onPopState(e) {
        if (menu && menu.pushed) { e.stopImmediatePropagation(); menu.pushed = false; closeMenu(true); return; }
        if (ignorePop) { ignorePop = false; e.stopImmediatePropagation(); }
    }

    var syncing = false;
    function syncConnection(withFaces) {
        if (syncing || state.conn === 'wait') { return; }
        syncing = true;
        api().getJSON(url('VisoMasterBridge/Status')).then(function (s) {
            var up = !!(s && s.running && s.ready);
            if (!up) {
                if (state.conn === 'on') { connectionLost(); newPlaybackSession(); toast('VisoMaster was disconnected (by an administrator, unused for a while, or the server restarted).'); }
                return;
            }
            state.conn = 'on';
            return post('Connect', { join: true }).then(function (j) {
                if (j && j.notRunning) { connectionLost(); return; }
                state.fpsCap = (j && j.fpsCap) || state.fpsCap;
                if (j && typeof j.preset === 'string') { state.preset = j.preset; }
                return applySavedPreset();
            })
                .then(function () { return state.conn === 'on' && withFaces ? playing().then(sameFilm).then(function () { return post('Faces'); }).then(function (j) { state.faces = j.faces || []; state.preset = j.preset || ''; }) : null; });
        }).catch(function () { }).then(function () { syncing = false; render(); ensureButton(); });
    }

    var connectGen = 0;
    function connect() {
        if (state.conn !== 'off') { return; }
        state.conn = 'wait';
        state.connSince = Date.now();
        var gen = ++connectGen;
        render();
        ensureButton();
        var ticker = setInterval(function () { if (state.conn !== 'wait' || gen !== connectGen) { clearInterval(ticker); return; } var r = menu && menu.dlg.querySelector('[data-vm-key="connect"] .actionSheetItemText'); if (r) { r.textContent = 'Connecting… ' + Math.floor((Date.now() - state.connSince) / 1000) + ' s'; } }, 1000);
        var attempt = function () {
            return post('Connect').then(function (j) {
                if (gen !== connectGen) { return; }
                if (j && j.starting) { return waitReady(gen, Date.now()).then(attempt); }
                state.fpsCap = (j && j.fpsCap) || 0;
                state.conn = 'on';
                state.faces = []; state.selected = '';
                state.preset = (j && j.preset) || '';
                render();
                ensureButton();
                applySavedPreset();
            });
        };
        attempt().catch(function (e) { if (gen === connectGen) { connectionLost(); fail(e); } });
    }

    function waitReady(gen, since) {
        return api().getJSON(url('VisoMasterBridge/Status')).then(function (s) {
            if (gen !== connectGen) { throw Object.assign(new Error('stale'), { stale: true }); }
            if (s && s.ready) { return; }
            var msg = (s && s.message) || '';
            if (!s || !s.running) { throw new Error('VisoMaster was stopped while connecting.'); }
            if (!/^(loading|starting)/i.test(msg)) { throw new Error('VisoMaster could not be started.'); }
            if (Date.now() - since > 300000) { throw new Error('VisoMaster did not finish loading.'); }
            return new Promise(function (res) { setTimeout(res, 1000); }).then(function () { return waitReady(gen, since); });
        });
    }
    function cancelConnect() {
        connectGen++;
        state.conn = 'off';
        render();
        ensureButton();
    }

    function connectionLost() {
        state.conn = 'off';
        if (sw || pending || state.swapOn) { stopSwap(false); return; }
        render();
        ensureButton();
    }

    function disconnect(quiet) {
        connectGen++;
        if (sw || state.swapOn) { stopSwap(true); }
        var was = state.conn;
        state.conn = 'off';
        if (was !== 'off') { post('Disconnect').catch(function () { }); }
        newPlaybackSession();
        if (!quiet) { render(); }
        ensureButton();
    }

    function place() {
        if (!menu || !anchor) { return; }
        var r = anchor.getBoundingClientRect();
        if (!r.width && !r.height) { closeMenu(); return; }
        var d = menu.dlg;
        var w = d.offsetWidth || 320;
        var left = Math.max(10, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 10));
        d.style.left = left + 'px';
        d.style.bottom = Math.max(10, window.innerHeight - r.top + 8) + 'px';
        var top = menu.body.querySelector('.vmInGrid') ? 10 : Math.max(10, pictureTop());
        var maxH = Math.max(120, r.top - 8 - top);
        d.style.maxHeight = maxH + 'px';
        fitInputRows(maxH);
    }

    function fitInputRows(maxH) {
        var g = menu && menu.body.querySelector('.vmInGrid');
        if (!g) { return; }
        g.style.maxHeight = '';
        var tiles = g.querySelectorAll('.vmTile');
        if (tiles.length) {
            var cs = getComputedStyle(g);
            var gap = parseFloat(cs.rowGap) || 0;
            var padT = parseFloat(cs.paddingTop) || 0;
            var pad = padT + (parseFloat(cs.paddingBottom) || 0);
            var cols = Math.max(1, cs.gridTemplateColumns.split(' ').length);
            var first = tiles[0].getBoundingClientRect();
            var pitch = tiles.length > cols ? tiles[cols].getBoundingClientRect().top - first.top : first.height + gap;
            var rows = Math.min(Math.ceil(tiles.length / cols), document.fullscreenElement ? 4 : 3);
            var chrome = menu.dlg.offsetHeight - menu.body.clientHeight;
            var need = 0;
            for (; rows >= 1; rows--) {
                g.style.maxHeight = (rows * pitch - gap + pad) + 'px';
                var p2 = tiles.length > cols ? tiles[cols].getBoundingClientRect().top - tiles[0].getBoundingClientRect().top : tiles[0].getBoundingClientRect().height + gap;
                if (Math.abs(p2 - pitch) > 0.5) { pitch = p2; g.style.maxHeight = (rows * pitch - gap + pad) + 'px'; }
                need = Math.ceil(chrome + menu.body.scrollHeight);
                if (rows === 1 || need <= maxH) { break; }
            }
            menu.dlg.style.maxHeight = Math.min(need, maxH) + 'px';
            g.style.scrollPaddingTop = padT + 'px';
        }
        var keep = menu.inScroll;
        if (keep && keep.view === g.getAttribute('data-view')) { g.scrollTop = keep.top; }
    }

    function pictureTop() {
        var v = videoEl();
        if (!v) { return 10; }
        var b = v.getBoundingClientRect();
        if (!v.videoWidth || !v.videoHeight || !b.width || !b.height) { return b.top; }
        var shown = Math.min(b.height, b.width * v.videoHeight / v.videoWidth);
        return b.top + (b.height - shown) / 2;
    }

    function row(icon, text, aside, onClick, key, disabled) {
        var cls = 'listItem listItem-button actionSheetMenuItem vmRow';
        var root = document.documentElement.classList;
        if (root.contains('layout-tv')) { cls += ' listItem-focusscale'; }
        if (root.contains('layout-mobile')) { cls += ' actionsheet-xlargeFont'; }
        var b = el('button', cls);
        b.setAttribute('is', 'emby-button');
        b.type = 'button';
        if (key) { b.setAttribute('data-vm-key', key); }
        b.innerHTML = '<span class="actionsheetMenuItemIcon listItemIcon listItemIcon-transparent material-icons" aria-hidden="true">' + icon + '</span>' +
            '<div class="listItemBody actionsheetListItemBody"><div class="listItemBodyText actionSheetItemText">' + esc(text) + '</div></div>' +
            (aside ? '<div class="listItemAside actionSheetItemAsideText">' + esc(aside) + '</div>' : '');
        if (disabled) { b.classList.add('vmOff'); b.disabled = true; b.setAttribute('aria-disabled', 'true'); }
        b.addEventListener('click', function (e) { e.stopPropagation(); if (!b.disabled) { onClick(); } });
        return b;
    }

    function tile(cls, inner, onClick, key) {
        var t = el('button', 'vmTile ' + (cls || ''), inner);
        t.type = 'button';
        if (key) { t.setAttribute('data-vm-key', key); }
        t.addEventListener('click', function (e) { e.stopPropagation(); onClick(); });
        return t;
    }

    function thumbUrl(id) { return url('VisoMasterBridge/Thumb/' + id, { ApiKey: token() }); }
    function dataJpeg(b64) { return /^[A-Za-z0-9+/=]*$/.test(b64 || '') ? 'data:image/jpeg;base64,' + b64 : ''; }

    function render() {
        if (!menu) { return; }
        var d = menu.body;
        var focusedKey = document.activeElement && menu.dlg.contains(document.activeElement) ? document.activeElement.getAttribute('data-vm-key') : null;
        if (focusedKey === 'connect' && menu.connSeen !== undefined && menu.connSeen !== state.conn) { focusedKey = null; menu.refocus = true; }
        menu.connSeen = state.conn;
        var fromBottom = menu.fresh ? 0 : d.scrollHeight - d.scrollTop;
        var inGrid = d.querySelector('.vmInGrid');
        if (inGrid) { menu.inScroll = { view: inGrid.getAttribute('data-view'), top: inGrid.scrollTop }; }
        d.innerHTML = '';
        [].forEach.call(menu.content.querySelectorAll('.vmSheetTitle'), function (x) { x.remove(); });
        var off = state.conn !== 'on';
        if (state.presetView) {
            renderPresets(d);
        } else if (state.sheet) {
            renderChoice(d);
        } else {
            if (state.inputOpen && !off) { d.appendChild(renderInput()); }
            d.appendChild(row(state.inputOpen ? ICON.down : ICON.up, 'Input Faces', '', toggleInput, 'input', off));
            var sel = selectedFace();
            var picks = sel ? (sel.assigned || []).length : 0;
            d.appendChild(row(ICON.clearInput, 'Clear Input Faces', picks ? String(picks) : '', clearInputs, 'clearInput', off || !picks));
            d.appendChild(row(ICON.clearTarget, 'Clear Target Faces', '', clearTarget, 'clearTarget', off || !sel));
            d.appendChild(row(ICON.clear, 'Clear All', '', clearFaces, 'clear', off));

            if (state.faces.length && !off) {
                var g = el('div', 'vmGrid');
                state.faces.forEach(function (f) {
                    var n = (f.assigned || []).length;
                    g.appendChild(tile(f.id === state.selected ? 'vmSel' : '',
                        '<img alt="" src="' + dataJpeg(f.thumb) + '">' + (n ? '<span class="vmBadge">' + n + '</span>' : ''),
                        function () { state.selected = f.id; state.inputOpen = true; state.openGroup = ''; if (!state.groups) { loadGroups(); } render(); },
                        'face:' + f.id));
                });
                d.appendChild(g);
            }
            d.appendChild(row(ICON.find, state.busy === 'find' ? 'Finding Faces…' : 'Find Faces', '', findFaces, 'find', off));
            var canSwap = state.swapOn || hasPick();
            var swapRow = row(ICON.swap, 'Swap Faces', swapAside(), function () { setSwap(!state.swapOn); }, 'swap', off || !canSwap);
            if (state.swapOn) { swapRow.classList.add('vmOn'); } else if (!off && hasPick()) { swapRow.classList.add('vmReady'); }
            d.appendChild(swapRow);
            if (!off && !canSwap) {
                d.appendChild(el('div', 'vmNote', cfg && cfg.inputFaces === false ? 'Swapping needs input faces, which are for administrators only.' : 'Pick a target face and an input face to swap.'));
            }
            d.appendChild(row(ICON.hourglass, 'Buffer', bufferChoice() + ' ›', function () { openSheet('buffer'); }, 'buffer', off));
            d.appendChild(row(ICON.movie, 'Frame Rate', fpsLabel() + ' ›', function () { openSheet('fps'); }, 'fps', off));
            d.appendChild(row(ICON.presets, 'Presets', (state.preset || 'VisoMaster (current)') + ' ›', openPresets, 'presets', off));
            if (state.conn === 'off') { d.appendChild(el('div', 'vmNote', 'Connect to find and swap faces.')); }
            if (state.conn === 'on') {
                var c = row(ICON.plugOn, 'Connected', 'Disconnect', function () { disconnect(false); }, 'connect');
                c.classList.add('vmOn');
                d.appendChild(c);
            } else if (state.conn === 'wait') {
                var secs = Math.floor((Date.now() - (state.connSince || Date.now())) / 1000);
                var w = row(ICON.loader, 'Connecting… ' + secs + ' s', 'Cancel', cancelConnect, 'connect');
                w.querySelector('.actionsheetMenuItemIcon').classList.add('vmSpin');
                d.appendChild(w);
            } else {
                d.appendChild(row(ICON.plug, 'Connect', '', connect, 'connect'));
            }
        }
        place();
        d.scrollTop = menu.fresh ? d.scrollHeight : Math.max(0, d.scrollHeight - fromBottom);
        menu.fresh = false;
        if (menu.refocus) { menu.refocus = false; focusFirst(); } else if (focusedKey) { focusKey(focusedKey); } else if (menu.dlg.contains(document.activeElement) || document.activeElement === document.body) { if (!focusables().length) { menu.dlg.focus(); } }
    }

    function hasPick() { return state.faces.some(function (f) { return (f.assigned || []).length > 0; }); }

    function selectedFace() {
        for (var i = 0; i < state.faces.length; i++) { if (state.faces[i].id === state.selected) { return state.faces[i]; } }
        return null;
    }

    function renderInput() {
        var box = el('div');
        if (!state.groups) { box.appendChild(el('div', 'vmNote', 'Loading…')); return box; }
        if (cfg && cfg.inputFaces === false) { box.appendChild(el('div', 'vmNote', 'Input faces are for administrators only.')); return box; }
        if (state.groupsError) { box.appendChild(el('div', 'vmNote', esc(state.groupsError))); return box; }
        var face = selectedFace();
        if (!face) { box.appendChild(el('div', 'vmNote', 'Find faces first, then pick one.')); return box; }
        var bar = row(ICON.down, '', '', inputBack, 'inbar');
        bar.classList.add('vmSlim');
        bar.setAttribute('aria-label', state.openGroup ? 'Back to the folders' : 'Close Input Faces');
        bar.title = state.openGroup ? 'Back to the folders' : 'Close Input Faces';
        box.appendChild(bar);
        var assigned = face.assigned || [];
        var flatRoot = state.embeddings || [];
        var rootGrp = state.groups.filter(function (x) { return x.id === 'root'; })[0];
        if (!state.openGroup) {
            var g = el('div', 'vmGrid vmInGrid');
            g.setAttribute('data-view', '');
            state.groups.forEach(function (grp) {
                var n = grp.images.concat(embIds(grp)).filter(function (i) { return assigned.indexOf(i) >= 0; }).length;
                g.appendChild(tile('',
                    (grp.cover ? '<img alt="" loading="lazy" src="' + thumbUrl(grp.cover) + '">' : '<span class="vmEmpty">' + ICON.folder + '</span>') +
                    '<span class="vmName">' + esc(grp.name) + '</span>' + (n ? '<span class="vmBadge">' + n + '</span>' : ''),
                    function () { state.openGroup = grp.id; render(); focusKey('inbar'); }, 'group:' + grp.id));
            });
            flatRoot.forEach(function (e) { g.appendChild(embTile(face, e, e.name, e.thumb, rootGrp ? rootGrp.images : [])); });
            box.appendChild(g);
            return box;
        }
        var grp = state.groups.filter(function (x) { return x.id === state.openGroup; })[0];
        if (!grp) { state.openGroup = ''; return renderInput(); }
        var grid = el('div', 'vmGrid vmInGrid');
        grid.setAttribute('data-view', grp.id);
        var rejected = face.rejected || [];
        var embs = embIds(grp).concat(grp.id === 'root' ? flatRoot.map(function (e) { return e.id; }) : []);
        if (grp.embedding) { grid.appendChild(embTile(face, grp.embedding, 'Embedding', grp.cover, grp.images)); }
        (grp.flat || []).forEach(function (e) { grid.appendChild(embTile(face, e, e.name, e.thumb, grp.images)); });
        grp.images.forEach(function (id) {
            var bad = rejected.indexOf(id) >= 0;
            var flash = bad && state.flash && state.flash.id === id && Date.now() < state.flash.until;
            var t = tile(assigned.indexOf(id) >= 0 ? 'vmPick' : bad ? 'vmPickBad' + (flash ? ' vmFlash' : '') : '',
                '<img alt="" loading="lazy" src="' + thumbUrl(id) + '">' + (flash ? '<span class="vmNoFace">No face<br>detected</span>' : ''), function () {
                if (bad) { face.rejected = rejected.filter(function (x) { return x !== id; }); render(); return; }
                var next = (face.assigned || []).filter(function (x) { return embs.indexOf(x) < 0; });
                var at = next.indexOf(id);
                if (at >= 0) { next.splice(at, 1); } else { next.push(id); }
                assignInputs(face, next);
            }, 'img:' + id);
            if (bad) { t.title = 'No face detected'; }
            grid.appendChild(t);
        });
        box.appendChild(grid);
        return box;
    }

    function toggleInput() {
        state.inputOpen = !state.inputOpen;
        if (state.inputOpen) { loadGroups(); }
        render();
    }

    function inputBack() {
        if (state.openGroup) { var g = state.openGroup; state.openGroup = ''; render(); focusKey('group:' + g); return; }
        state.inputOpen = false;
        render();
        focusKey('input');
    }

    function clearInputs() {
        var face = selectedFace();
        if (!face || !(face.assigned || []).length) { return; }
        face.rejected = [];
        assignInputs(face, []);
    }

    function clearTarget() {
        var face = selectedFace();
        if (!face || state.busy === 'find') { return; }
        post('RemoveFace', { target: face.id }).then(function (j) {
            state.faces = j.faces || state.faces.filter(function (x) { return x.id !== face.id; });
            if (state.selected === face.id) { state.selected = ''; state.inputOpen = false; state.openGroup = ''; }
            render();
            focusKey('clearTarget');
            swapChanged();
        }).catch(fail);
    }

    function embIds(grp) {
        return (grp.embedding ? [grp.embedding.id] : []).concat((grp.flat || []).map(function (e) { return e.id; }));
    }

    function embTile(face, e, label, picture, images) {
        var assigned = face.assigned || [];
        var on = assigned.indexOf(e.id) >= 0;
        var why = e.error ? 'Unreadable embedding file' : e.missing ? 'Not available for ' + e.missing : '';
        var t = tile((on ? 'vmPick' : '') + (why ? ' vmOff' : ''),
            (picture ? '<img alt="" loading="lazy" src="' + thumbUrl(picture) + '">' : '<span class="vmEmpty">' + ICON.folder + '</span>') +
            (why ? '<span class="vmNoFace">' + esc(why) + '</span>' : '') + '<span class="vmName">' + esc(label) + '</span>', function () {
            if (why && !on) { return; }
            var next = (face.assigned || []).filter(function (x) { return x !== e.id && images.indexOf(x) < 0; });
            if (!on) { next.push(e.id); }
            assignInputs(face, next);
        }, 'emb:' + e.id);
        t.title = why || 'Ready-made embedding' + (label === 'Embedding' ? '' : ': ' + label);
        return t;
    }

    function assignInputs(face, next) {
        var before = (face.assigned || []).slice();
        face.assigned = next;
        render();
        var seq = ++state.assignSeq;
        post('Assign', { target: face.id, inputs: next }).then(function (j) {
            if (seq !== state.assignSeq) { return; }
            var rej = (j.rejected || []).filter(function (x) { return typeof x === 'string'; });
            var oldRej = {};
            state.faces.forEach(function (x) { if (x.rejected) { oldRej[x.id] = x.rejected; } });
            state.faces = j.faces || state.faces;
            state.faces.forEach(function (x) { if (oldRej[x.id] && !x.rejected) { x.rejected = oldRej[x.id]; } });
            var f2 = state.faces.filter(function (x) { return x.id === face.id; })[0];
            if (f2) { f2.rejected = (face.rejected || []).filter(function (x) { return rej.indexOf(x) < 0; }).concat(rej); }
            if (rej.length) { state.flash = { id: rej[rej.length - 1], until: Date.now() + 2000 }; setTimeout(render, 2050); }
            render();
            if (JSON.stringify(before) !== JSON.stringify(f2 ? f2.assigned : [])) { swapChanged(); }
        }).catch(function (e) { if (seq === state.assignSeq) { face.assigned = before; render(); } fail(e); });
    }

    function checkRow(text, checked, onClick, key) {
        var b = row('', text, '', onClick, key);
        var icon = b.querySelector('.actionsheetMenuItemIcon');
        icon.classList.add('check');
        icon.innerHTML = '';
        if (!checked) { icon.style.visibility = 'hidden'; }
        return b;
    }

    function openSheet(which) { state.sheet = which; render(); focusKey('choice:' + (which === 'fps' ? fpsChoice() : bufferChoice())); }

    function renderChoice(d) {
        var isFps = state.sheet === 'fps';
        sheetTitle(isFps ? 'Frame Rate' : 'Buffer');
        var choices = isFps ? FPS_CHOICES : Object.keys(BUFFER_CHOICES);
        var cur = isFps ? fpsChoice() : bufferChoice();
        choices.forEach(function (c) {
            var label = isFps && c !== 'Original' ? c + ' fps' : c;
            d.appendChild(checkRow(label, c === cur, function () {
                var changed = c !== cur;
                setPref(isFps ? 'fps' : 'buffer', c);
                var key = state.sheet;
                state.sheet = '';
                render();
                focusKey(key);
                if (changed && isFps) { swapChanged(); }
            }, 'choice:' + c));
        });
    }

    function swapAside() {
        if (!state.swapOn) { return 'off'; }
        if (!hasPick()) { return 'on · no input face'; }
        if (!sw) { return 'on · starting'; }
        return 'on · ' + readyText(Math.max(0, bufferedEnd(sw.overlay) - (sw.video.currentTime - sw.t0))) + ' ready';
    }

    function sheetTitle(text) {
        var title = el('h1', 'actionSheetTitle vmSheetTitle', ICON.back + '<span>' + esc(text) + '</span>');
        title.setAttribute('tabindex', '0');
        title.setAttribute('data-vm-key', 'sheet-title');
        title.setAttribute('role', 'button');
        title.setAttribute('aria-label', 'Back');
        title.addEventListener('click', function (e) { e.stopPropagation(); back(); });
        title.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); back(); } });
        menu.content.insertBefore(title, menu.body);
    }

    function openPresets() {
        state.presetView = true;
        state.presets = null;
        render();
        post('Presets').then(function (j) { state.presets = j.presets || []; state.preset = j.current || ''; state.presetWorkspace = j.workspace || ''; render(); focusKey('preset:' + state.preset); })
            .catch(function (e) { state.presets = []; fail(e); render(); });
    }

    function renderPresets(d) {
        sheetTitle('Presets');
        if (!state.presets) { d.appendChild(el('div', 'vmNote', 'Loading…')); return; }
        (state.presetWorkspace ? [] : ['']).concat(state.presets).forEach(function (n) {
            d.appendChild(checkRow(n || 'VisoMaster (current)', n === state.preset, function () {
                if (n === state.preset) { state.presetView = false; render(); focusKey('presets'); return; }
                post('Preset', { name: n })
                    .then(function (j) { state.preset = j.current || ''; setPref('preset', n); state.presetView = false; render(); focusKey('presets'); swapChanged(); if (state.groups) { loadGroups(); } })
                    .catch(fail);
            }, 'preset:' + n));
        });
    }

    function loadGroups() {
        if (cfg && cfg.inputFaces === false) { state.groups = []; return; }
        post('InputFaces').then(function (j) {
            state.groups = j.groups || [];
            state.embeddings = j.embeddings || [];
            state.groupsError = j.error || '';
            render();
            var before = JSON.stringify(state.faces.map(function (x) { return x.assigned; }));
            post('Faces').then(function (f) {
                if (!f || !f.faces || JSON.stringify(f.faces.map(function (x) { return x.assigned; })) === before) { return; }
                state.faces = f.faces; render(); swapChanged();
            }).catch(function () { });
        }).catch(function (e) { if (e.stale) { return; } state.groups = []; state.groupsError = e.message; render(); });
    }

    function findFaces() {
        var v = videoEl();
        if (!v) { toast('No video is playing.'); return; }
        if (state.busy === 'find') { return; }
        state.busy = 'find';
        var at = v.currentTime;
        render();
        playing().then(sameFilm).then(function (np) {
            return post('FindFaces', { itemId: np.itemId, mediaSourceId: np.mediaSourceId, time: at });
        }).then(function (j) {
            state.faces = j.faces || [];
            if (!state.selected && state.faces.length) { state.selected = state.faces[0].id; }
            if (!j.new || !j.new.length) { toast('No new faces in this picture.'); }
        }).catch(fail).then(function () { state.busy = false; render(); });
    }

    function clearFaces() {
        if (state.busy === 'find') { return; }
        post('ClearFaces').then(function () {
            state.faces = []; state.selected = ''; state.openGroup = '';
            render();
            swapChanged();
        }).catch(fail);
    }

    var sw = null;
    var swapGen = 0;
    var pending = null;
    var lastInputAt = 0;
    var retries = [];
    var GIVE_UP_MS = 60000;
    var GIVE_UP_FIRST_MS = 180000;

    var RATE = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate');
    function realRate(v) { return RATE.get.call(v); }
    function setRealRate(v, r) { if (Math.abs(RATE.get.call(v) - r) > 0.0005) { RATE.set.call(v, r); } }
    var rateHold = null;
    function claimRate(v) {
        if (rateHold && rateHold.video === v) { return rateHold; }
        releaseRate();
        var h = { video: v, base: realRate(v) || 1 };
        Object.defineProperty(v, 'playbackRate', {
            configurable: true, enumerable: true,
            get: function () { return h.base; },
            set: function (x) {
                x = Number(x);
                if (!(x > 0) || !isFinite(x)) { return; }
                h.base = x;
                if (!sw || sw.video !== v) { setRealRate(v, x); }
            }
        });
        rateHold = h;
        return h;
    }
    function releaseRate() {
        if (!rateHold) { return; }
        var h = rateHold;
        rateHold = null;
        try { delete h.video.playbackRate; } catch (e) { }
        setRealRate(h.video, h.base);
    }

    function setSwap(on) {
        if (on === state.swapOn) { return; }
        state.swapOn = on;
        render();
        ensureButton();
        if (!on) { stopSwap(true); return; }
        if (hasPick()) { startStream(); }
    }

    function swapChanged() {
        if (!state.swapOn) { return; }
        if (!hasPick()) { idleSwap(); return; }
        if (sw) { sw.restartAt = Date.now() + 300; sw.restartQuiet = true; } else if (pending) { pending.again = true; } else { startStream({ quiet: true }); }
        render();
        ensureButton();
    }

    function idleSwap() {
        var stream = sw && sw.stream;
        swapGen++;
        stopOverlay(false);
        restorePending();
        if (stream) { post('Swap/Stop', { stream: stream }).catch(function () { }); }
        render();
        ensureButton();
    }

    function startStream(keep) {
        var v = videoEl();
        if (!v) { toast('No video is playing.'); state.swapOn = false; render(); ensureButton(); return; }
        if (!hasPick()) { return; }
        claimRate(v);
        var at = v.currentTime;
        var wasPlaying = keep ? keep.wasPlaying : !v.paused;
        stopOverlay(true);
        pending = { video: v, wasPlaying: wasPlaying };
        if (!v.paused) { v.pause(); }
        var quiet = !!(keep && keep.quiet);
        var waitSince = keep && keep.waitSince ? keep.waitSince : Date.now();
        var gen = ++swapGen;
        if (!quiet) { setTimeout(function () { if (gen === swapGen && pending && !sw) { notice('Starting swap…'); } }, NOTICE_DELAY); }
        playing().then(sameFilm).then(function (np) {
            return post('Swap/Start', { itemId: np.itemId, mediaSourceId: np.mediaSourceId, time: at, fps: fpsValue(), lead: BUFFER_CHOICES[bufferChoice()] });
        }).then(function (j) {
            if (j.stale) {
                if (gen === swapGen && state.swapOn) { pending = null; startStream({ wasPlaying: wasPlaying, quiet: quiet }); }
                return;
            }
            if (gen !== swapGen || !state.swapOn) { if (j.stream) { post('Swap/Stop', { stream: j.stream }).catch(function () { }); } return; }
            if (j.t0 > at + 0.04 && Math.abs(v.currentTime - at) < 0.5) { try { v.currentTime = j.t0; } catch (e) { } }
            var o = document.createElement('video');
            o.className = 'vmOverlay';
            o.muted = true;
            o.playsInline = true;
            o.autoplay = false;
            o.preload = 'auto';
            o.style.objectFit = getComputedStyle(v).objectFit || 'contain';
            var feed = feedOverlay(o, url('VisoMasterBridge/Stream/' + j.stream, { ApiKey: token() }), function (msg, retry) {
                if (!sw || sw.overlay !== o) { return; }
                var now = Date.now();
                retries = retries.filter(function (x) { return now - x < 60000; });
                if (retry && retries.length < 3) { retries.push(now); sw.restartAt = now + 1000; return; }
                giveUp(msg || 'The swapped picture stopped.');
            });
            v.after(o);
            var again = pending && pending.again;
            pending = null;
            var t = performance.now();
            sw = { video: v, overlay: o, t0: j.t0, fps: j.fps || 24, stream: j.stream, wasPlaying: wasPlaying, waiting: true,
                quiet: quiet, waitSince: waitSince,
                restartAt: 0, selfPause: false, started: Date.now(), lastReport: 0, gen: gen, track: null, feed: feed,
                frames: 0, lastFrameAt: Date.now(), prevEnd: 0, prevAt: t, prod: 0, rate: 1, factor: 1, reached: false, fill: null,
                finished: false, uncovered: 0 };
            if (!v.paused) { selfPause(); }
            o.addEventListener('error', function () { if (sw && sw.overlay === o) { giveUp('The swapped picture stopped.'); } });
            watchFrames(sw, v, 'vTime');
            watchFrames(sw, o, 'oTime');
            v.addEventListener('seeking', onSeeking);
            v.addEventListener('pause', onUserPause);
            v.addEventListener('play', onUserPlay);
            mirrorSubtitles();
            sw.timer = setInterval(tick, 100);
            if (again) { sw.restartAt = Date.now() + 300; sw.restartQuiet = true; }
        }).catch(function (e) {
            if (gen !== swapGen) { return; }
            notice('');
            fail(e);
            restorePending();
            state.swapOn = false;
            render();
            ensureButton();
        });
    }

    function selfPause() { if (sw) { sw.selfPause = true; } sw.video.pause(); }
    function selfPlay() {
        if (sw) { sw.selfPause = true; }
        var s = sw, p = sw.video.play();
        if (p && p.catch) { p.catch(function () { if (s) { s.selfPause = false; } }); }
    }
    function onUserPause() { if (!sw) { return; } if (sw.selfPause) { sw.selfPause = false; return; } sw.wasPlaying = false; }
    function onUserPlay() {
        if (!sw) { return; }
        if (sw.selfPause) { sw.selfPause = false; return; }
        if (sw.waiting) {
            if (Date.now() - lastInputAt < 800) { sw.wasPlaying = !sw.wasPlaying; }
            selfPause();
            return;
        }
        sw.wasPlaying = true;
    }

    function onSeeking() {
        if (!sw) { return; }
        if (!covered(sw.overlay, sw.video.currentTime - sw.t0, 3)) { sw.restartAt = Date.now() + 400; }
    }

    function covered(o, t, ahead) {
        if (t < -0.05) { return false; }
        var b = o.buffered;
        for (var i = 0; i < b.length; i++) { if (t >= b.start(i) - 0.1 && t <= b.end(i) + ahead) { return true; } }
        return !b.length && t < ahead;
    }

    function reveal(s) {
        var o = s.overlay;
        var done = function () { if (sw === s) { o.classList.add('vmShown'); hideOriginal(s.video, true); } };
        if (o.requestVideoFrameCallback) { o.requestVideoFrameCallback(done); setTimeout(done, 1000); } else { o.addEventListener('seeked', done, { once: true }); setTimeout(done, 1000); }
    }

    function hideOriginal(v, hide) {
        if (!v) { return; }
        if (hide) { if (v.getAttribute('data-vm-hidden') !== '1') { v.setAttribute('data-vm-hidden', '1'); v.style.opacity = '0'; } }
        else if (v.getAttribute('data-vm-hidden') === '1') { v.removeAttribute('data-vm-hidden'); v.style.opacity = ''; }
    }

    function watchFrames(s, video, key) {
        if (!video.requestVideoFrameCallback) { return; }
        var cb = function (now, meta) { if (sw !== s) { return; } s[key] = meta.mediaTime; s[key + 'At'] = performance.now(); video.requestVideoFrameCallback(cb); };
        video.requestVideoFrameCallback(cb);
    }
    function shownTime(s, video, key) {
        var at = s[key + 'At'];
        if (at && performance.now() - at < 250 && !video.paused) { return s[key] + (performance.now() - at) / 1000 * RATE.get.call(video); }
        return video.currentTime;
    }

    var KEEP_BEHIND = 20;
    var MAX_QUEUED = 8 * 1024 * 1024;
    var MAX_AHEAD = 30;
    function feedOverlay(o, src, onFail) {
        var ctrl = window.AbortController ? new AbortController() : null;
        var ms = new MediaSource();
        var objUrl = URL.createObjectURL(ms);
        var sb = null, queue = [], queued = 0, stopped = false, ended = false, data = new Uint8Array(0), init = [];
        o.src = objUrl;
        function fail(msg, retry) { if (!stopped) { stopped = true; onFail(msg, retry); } }
        function concat(a, b) { var c = new Uint8Array(a.length + b.length); c.set(a, 0); c.set(b, a.length); return c; }
        function type(b, i) { return String.fromCharCode(b[i + 4], b[i + 5], b[i + 6], b[i + 7]); }
        function size(b, i) { return ((b[i] << 24) >>> 0) + (b[i + 1] << 16) + (b[i + 2] << 8) + b[i + 3]; }
        function codec(bytes) {
            for (var i = 0; i + 11 < bytes.length; i++) {
                if (bytes[i] === 0x61 && bytes[i + 1] === 0x76 && bytes[i + 2] === 0x63 && bytes[i + 3] === 0x43) {
                    var h = function (x) { return ('0' + x.toString(16)).slice(-2); };
                    return 'avc1.' + h(bytes[i + 5]) + h(bytes[i + 6]) + h(bytes[i + 7]);
                }
            }
            return 'avc1.640028';
        }
        function pump() {
            if (stopped || !sb || sb.updating) { return; }
            if (sb.buffered.length && o.currentTime - sb.buffered.start(0) > KEEP_BEHIND * 1.5) {
                try { sb.remove(0, Math.max(0, o.currentTime - KEEP_BEHIND)); } catch (e) { }
                return;
            }
            if (!queue.length) {
                if (ended && ms.readyState === 'open') { try { ms.endOfStream(); } catch (e) { } }
                return;
            }
            var take = 1, bytes = queue[0].length;
            while (take < queue.length && bytes + queue[take].length <= 1048576) { bytes += queue[take].length; take++; }
            var chunk = queue[0];
            if (take > 1) { chunk = new Uint8Array(bytes); for (var k = 0, at = 0; k < take; k++) { chunk.set(queue[k], at); at += queue[k].length; } }
            try { sb.appendBuffer(chunk); queue.splice(0, take); queued -= bytes; } catch (e) {
                if (e && e.name === 'QuotaExceededError') {
                    var behind = o.currentTime - 1;
                    try { if (sb.buffered.length && behind > sb.buffered.start(0)) { sb.remove(0, behind); return; } } catch (x) { }
                    setTimeout(pump, 500);
                } else { fail('The swapped picture could not be played.'); }
            }
        }
        function boxes() {
            var i = 0;
            while (data.length - i >= 8) {
                var n = size(data, i);
                if (n < 8) { fail('The swapped picture is damaged.'); return; }
                if (data.length - i < n) { break; }
                var box = data.subarray(i, i + n), t = type(data, i);
                i += n;
                if (!sb) {
                    init.push(box.slice());
                    if (t === 'moov') {
                        var all = init.reduce(function (a, b) { return concat(a, b); }, new Uint8Array(0));
                        queued += all.length;
                        var mime = 'video/mp4; codecs="' + codec(all) + '"';
                        try { sb = ms.addSourceBuffer(MediaSource.isTypeSupported(mime) ? mime : 'video/mp4; codecs="avc1.640028"'); } catch (e) { fail('This browser cannot play the swapped picture.'); return; }
                        sb.mode = 'segments';
                        sb.addEventListener('updateend', pump);
                        queue.push(all);
                    }
                } else {
                    queue.push(box.slice());
                    queued += n;
                }
            }
            data = data.subarray(i);
            pump();
        }
        ms.addEventListener('sourceopen', function () {
            if (stopped) { return; }
            fetch(src, ctrl ? { signal: ctrl.signal } : {}).then(function (r) {
                if (!r.ok || !r.body) { fail('The swapped picture stopped.', true); return; }
                var reader = r.body.getReader();
                var read = function () {
                    if (queued > MAX_QUEUED || (sb && bufferedEnd(o) - o.currentTime > MAX_AHEAD)) { return new Promise(function (r) { setTimeout(r, 300); }).then(function () { return stopped ? null : read(); }); }
                    return reader.read().then(function (x) {
                        if (stopped) { return; }
                        if (x.done) { ended = true; pump(); return; }
                        data = data.length ? concat(data, x.value) : x.value;
                        boxes();
                        return read();
                    });
                };
                return read();
            }).catch(function () { if (!stopped) { fail('The swapped picture stopped.', true); } });
        }, { once: true });
        var trim = setInterval(pump, 2000);
        return {
            done: function () { return ended && !queue.length; },
            stop: function () {
                stopped = true;
                clearInterval(trim);
                try { if (ctrl) { ctrl.abort(); } } catch (e) { }
                try { URL.revokeObjectURL(objUrl); } catch (e) { }
            }
        };
    }

    function bufferedEnd(o) {
        var b = o.buffered;
        return b && b.length ? b.end(b.length - 1) : 0;
    }

    function mirrorSubtitles() {
        if (!sw) { return; }
        var src = null;
        for (var i = 0; i < sw.video.textTracks.length; i++) { if (sw.video.textTracks[i].mode === 'showing') { src = sw.video.textTracks[i]; } }
        if (src === (sw.track && sw.track.src)) { return; }
        if (sw.track) { sw.track.src.removeEventListener('cuechange', sw.track.copy); sw.track.dst.mode = 'disabled'; sw.track = null; }
        if (!src) { return; }
        copyCueStyle();
        var dst = sw.overlay.addTextTrack('subtitles', src.label, src.language);
        dst.mode = 'showing';
        var cur = sw;
        var copy = function () {
            if (!cur || cur !== sw) { return; }
            while (dst.cues && dst.cues.length) { dst.removeCue(dst.cues[0]); }
            var act = src.activeCues || [];
            for (var j = 0; j < act.length; j++) {
                try {
                    var c = new VTTCue(Math.max(0, act[j].startTime - cur.t0), Math.max(0.01, act[j].endTime - cur.t0), act[j].text);
                    ['line', 'lineAlign', 'position', 'positionAlign', 'size', 'align', 'vertical', 'snapToLines'].forEach(function (p) { try { if (act[j][p] !== undefined) { c[p] = act[j][p]; } } catch (x) { } });
                    dst.addCue(c);
                } catch (e) { }
            }
        };
        src.addEventListener('cuechange', copy);
        sw.track = { src: src, dst: dst, copy: copy };
        copy();
    }

    function copyCueStyle() {
        var old = document.getElementById('vmCueStyle');
        var css = '';
        [].forEach.call(document.styleSheets, function (s) {
            var rules; try { rules = s.cssRules; } catch (e) { return; }
            [].forEach.call(rules || [], function (r) { if (r.selectorText && r.selectorText.indexOf('htmlvideoplayer::cue') >= 0) { css += r.cssText.split('.htmlvideoplayer::cue').join('.vmOverlay::cue') + '\n'; } });
        });
        if (!old) { old = el('style'); old.id = 'vmCueStyle'; document.head.appendChild(old); }
        old.textContent = css;
    }

    var NOTICE_DELAY = 2000;
    var noticeEl = null;
    function notice(text) {
        if (!text) { if (noticeEl) { noticeEl.remove(); noticeEl = null; } return; }
        var host = document.querySelector('.videoPlayerContainer');
        if (!host) { return; }
        if (!noticeEl || !noticeEl.isConnected) { noticeEl = el('div', 'vmNotice'); host.appendChild(noticeEl); }
        var header = document.querySelector('.osdHeader');
        if (header) {
            var top = Math.round(header.getBoundingClientRect().bottom - host.getBoundingClientRect().top);
            if (top > 0 && noticeEl.style.top !== top + 'px') { noticeEl.style.top = top + 'px'; }
        }
        if (noticeEl.textContent !== text) { noticeEl.textContent = text; }
    }

    function giveUp(message) {
        toast(message);
        stopSwap(true);
    }

    var RESUME_FRAMES = 10;
    var TARGET_LEAD = 1.0;
    var GAIN = 0.4;
    var MIN_RATE = 0.0625;
    var SLEW = 0.1;
    function readyText(s) { return s < 10 ? s.toFixed(1) + ' s' : Math.floor(s) + ' s'; }

    function wantRate(s, lead, base) {
        var over = lead - TARGET_LEAD;
        var floor = RESUME_FRAMES / (s.fps || 24);
        var corr = over >= 0 ? Math.min(GAIN * over, Math.sqrt(2 * SLEW * over))
            : (s.reached ? GAIN * over : (lead < floor ? GAIN * (lead - floor) : -0.1 * s.prod));
        return Math.max(MIN_RATE, Math.min(base, s.prod + corr));
    }

    function mirrorLook(v, o) {
        var cs = getComputedStyle(v);
        if (o.style.objectFit !== cs.objectFit) { o.style.objectFit = cs.objectFit; }
        var f = cs.filter === 'none' ? '' : cs.filter;
        if (o.style.filter !== f) { o.style.filter = f; }
    }

    function tick() {
        if (!sw) { return; }
        var v = sw.video;
        var o = sw.overlay;
        var now = Date.now();
        if (!v.isConnected || v !== videoEl()) { idleSwap(); return; }
        if (sw.restartAt && now >= sw.restartAt) {
            if (document.hidden && v.paused) { return; }
            sw.restartAt = 0;
            if (sw.finished && sw.feed && sw.feed.done()) { return; }
            startStream({ wasPlaying: sw.waiting ? sw.wasPlaying : !v.paused, quiet: !!sw.restartQuiet });
            return;
        }
        var base = rateHold ? rateHold.base : 1;
        var frame = 1 / (sw.fps || 24);
        var target = v.currentTime - sw.t0;
        var end = bufferedEnd(o);
        var lead = end - target;
        var t = performance.now();
        var dt = Math.max(0.001, (t - sw.prevAt) / 1000);
        if (end >= sw.prevEnd && !(v.paused && !sw.waiting)) { sw.prod += ((end - sw.prevEnd) / dt - sw.prod) * Math.min(1, dt / 2); }
        sw.prevEnd = end;
        sw.prevAt = t;
        mirrorLook(v, o);
        if (menu && now - (sw.lastAside || 0) > 500) {
            sw.lastAside = now;
            var a = menu.dlg.querySelector('[data-vm-key="swap"] .actionSheetItemAsideText');
            if (a) { a.textContent = swapAside(); }
        }
        if (now - sw.lastReport > 1500) {
            sw.lastReport = now;
            var s0 = sw;
            post('Swap/Status', { stream: s0.stream, pos: Math.max(0, target), lead: BUFFER_CHOICES[bufferChoice()] }).then(function (j) {
                if (sw !== s0 || !j) { return; }
                if (j.unknownSession) {
                    newPlaybackSession();
                    idleSwap();
                    toast('VisoMaster was restarted - find faces again to swap.');
                    return;
                }
                if (typeof j.frames === 'number' && j.frames > s0.frames) { s0.frames = j.frames; s0.lastFrameAt = Date.now(); }
                if (j.finished) { s0.finished = true; }
                if (j.error) { giveUp('The swapped picture stopped: ' + j.error); }
                else if (j.running === false && !s0.restartAt && !s0.finished) { s0.restartAt = Date.now(); }
            }).catch(function () { });
            mirrorSubtitles();
        }

        var fed = sw.feed && sw.feed.done();
        var atEnd = sw.finished && fed;
        if (atEnd && lead <= 0.25) { endHold = { video: v, at: v.currentTime }; idleSwap(); return; }
        if (fed && !sw.finished && !sw.restartAt) { sw.restartAt = now + 3000; }

        if (sw.waiting && !sw.quiet && now - sw.waitSince >= NOTICE_DELAY) {
            notice((sw.frames === 0 && !end ? 'Starting swap…' : 'Preparing swap… ' + readyText(Math.max(0, lead))) +
                (sw.wasPlaying ? '' : ' · paused'));
        } else { notice(''); }
        if (sw.waiting !== sw.lastWaiting) { sw.lastWaiting = sw.waiting; ensureButton(); }
        if (sw.waiting) {
            if (!sw.fill && end > 0) { sw.fill = { t: t, end: end }; }
            if (lead >= RESUME_FRAMES * frame || (atEnd && lead > 0.05)) {
                sw.waiting = false;
                sw.quiet = false;
                if (sw.fill && t - sw.fill.t > 200) { sw.prod = (end - sw.fill.end) / ((t - sw.fill.t) / 1000); }
                else { sw.prod = Math.max(sw.prod, base); }
                sw.fill = null;
                try { o.currentTime = Math.max(0, target); sw.oTimeAt = 0; } catch (e) { }
                reveal(sw);
                sw.rate = atEnd ? base : wantRate(sw, lead, base);
                if (sw.wasPlaying && v.paused) { setRealRate(v, sw.rate); selfPlay(); }
            } else {
                if (!v.paused) { selfPause(); }
                if (!o.paused) { o.pause(); }
                if (target >= 0 && Math.abs(o.currentTime - target) > 0.5) { try { o.currentTime = target; sw.oTimeAt = 0; } catch (e) { } }
                if (now - sw.lastFrameAt > (sw.frames > 0 ? GIVE_UP_MS : GIVE_UP_FIRST_MS)) { giveUp('No swapped picture arrived - swap stopped.'); }
                return;
            }
        }

        if (lead <= frame && !atEnd && !v.paused) {
            sw.waiting = true;
            sw.wasPlaying = true;
            sw.fill = null;
            sw.reached = false;
            sw.waitSince = now;
            sw.quiet = false;
            selfPause();
            return;
        }
        if (lead >= TARGET_LEAD) { sw.reached = true; }
        if (!covered(o, target, 0.5)) {
            if (!sw.uncovered) { sw.uncovered = now; } else if (now - sw.uncovered > 1000) { sw.uncovered = 0; sw.restartAt = now; }
        } else { sw.uncovered = 0; }

        var want = atEnd ? base : wantRate(sw, lead, base);
        if (v.paused) {
            sw.rate = want;
        } else {
            var step = SLEW * dt;
            if (base > (sw.lastBase || base) && want >= base) { sw.rate = base; }
            sw.rate += Math.max(-step, Math.min(step, want - sw.rate));
            sw.rate = Math.max(MIN_RATE, Math.min(base, sw.rate));
            setRealRate(v, sw.rate);
        }
        sw.factor = sw.rate / base;
        sw.lastBase = base;
        try { v.preservesPitch = true; } catch (e) { }

        var stalled = !v.paused && v.readyState < 3;
        if (v.paused || stalled) { if (!o.paused) { o.pause(); } } else if (o.paused && !o.ended) { o.play().catch(function () { }); }
        if (stalled) { return; }
        var vr = realRate(v);
        var drift = shownTime(sw, o, 'oTime') - (shownTime(sw, v, 'vTime') - sw.t0);
        if (Math.abs(drift) > 0.2) {
            try { o.currentTime = Math.max(0, target); sw.oTimeAt = 0; } catch (e) { }
            o.playbackRate = vr;
        } else {
            o.playbackRate = Math.abs(drift) < 0.02 ? vr : Math.max(MIN_RATE, vr * (1 - drift * 0.8));
        }
    }

    function stopOverlay(restarting) {
        notice('');
        if (!sw) { return; }
        var s = sw;
        sw = null;
        clearInterval(s.timer);
        s.video.removeEventListener('seeking', onSeeking);
        s.video.removeEventListener('pause', onUserPause);
        s.video.removeEventListener('play', onUserPlay);
        if (s.track) { s.track.src.removeEventListener('cuechange', s.track.copy); }
        if (s.feed) { s.feed.stop(); }
        try { s.overlay.removeAttribute('src'); s.overlay.load(); } catch (e) { }
        s.overlay.remove();
        hideOriginal(s.video, false);
        if (!restarting) {
            releaseRate();
            if (s.waiting && s.wasPlaying && s.video.isConnected && s.video.paused) { var p = s.video.play(); if (p && p.catch) { p.catch(function () { }); } }
        }
    }

    function restorePending() {
        var p = pending;
        pending = null;
        if (!sw) { releaseRate(); }
        if (!p || !p.video.isConnected) { return; }
        if (p.wasPlaying && p.video.paused) { var r = p.video.play(); if (r && r.catch) { r.catch(function () { }); } }
    }

    function stopSwap(tellServer) {
        var stream = sw && sw.stream;
        swapGen++;
        stopOverlay(false);
        restorePending();
        state.swapOn = false;
        if (tellServer) { post('Swap/Stop', stream ? { stream: stream } : {}).catch(function () { }); }
        render();
        ensureButton();
    }

    function debugHook() {
        var on = false;
        try { on = localStorage.getItem('vmDebug') === '1'; } catch (e) { }
        if (!on) { return; }
        window.__vmDebug = {
            copyFaces: function (n) {
                var src = state.faces.length ? state.faces : [{ id: 'dbg', thumb: '', assigned: [] }];
                for (var i = 0; i < n; i++) { var f = src[i % src.length]; state.faces.push({ id: f.id + '-copy' + i, thumb: f.thumb, assigned: [] }); }
                render();
                return state.faces.length;
            },
            state: state,
            swap: function () {
                if (!sw) { return null; }
                var target = sw.video.currentTime - sw.t0;
                return { t0: sw.t0, waiting: !!sw.waiting, lead: bufferedEnd(sw.overlay) - target, rate: realRate(sw.video),
                    baseRate: rateHold ? rateHold.base : 1, factor: sw.factor, prod: sw.prod, drift: shownTime(sw, sw.overlay, 'oTime') - (shownTime(sw, sw.video, 'vTime') - sw.t0),
                    shown: sw.overlay.classList.contains('vmShown'), until: sw.until || 0 };
            }
        };
        var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
        var q = function (s) { return document.querySelector(s); };
        var keyEl = function (k) { return q('[data-vm-key="' + k + '"]'); };
        var pct = function (a, p) { if (!a.length) { return null; } var s = a.slice().sort(function (x, y) { return x - y; }); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
        var D = window.__vmDebug;
        D.seek = async function (pos) {
            var np = await playing();
            var item = await api().getItem(api().getCurrentUserId(), np.itemId);
            var runtime = (item && item.RunTimeTicks) ? item.RunTimeTicks / 1e7 : videoEl().duration;
            var s = q('.osdPositionSlider');
            s.value = pos / runtime * 100; s.dispatchEvent(new Event('change', { bubbles: true }));
            await sleep(6000);
            return +videoEl().currentTime.toFixed(1);
        };
        D.setup = async function () {
            if (!menu) { q('.btnVisoMaster').click(); await sleep(800); }
            if (state.conn !== 'on') { connect(); }
            for (var i = 0; i < 40 && state.conn !== 'on'; i++) { await sleep(1000); }
            await sleep(2500);
            clearFaces(); await sleep(1000);
            findFaces();
            for (var j = 0; j < 20 && state.busy === 'find'; j++) { await sleep(1000); }
            if (!state.faces.length) { return { ok: false, why: 'no face at ' + videoEl().currentTime.toFixed(0) }; }
            keyEl('face:' + state.faces[0].id).click(); await sleep(1500);
            var g = q('[data-vm-key^="group:"]'); if (!g) { return { ok: false, why: 'no input folder' }; }
            g.click(); await sleep(1200);
            q('[data-vm-key^="img:"]').click(); await sleep(3000);
            return { ok: hasPick(), at: +videoEl().currentTime.toFixed(1), preset: state.preset };
        };
        D.start = function (label) {
            var m = { label: label, t0: performance.now(), s: [] };
            D.meas = m;
            if (!state.swapOn) { setSwap(true); }
            clearInterval(D.timer);
            D.timer = setInterval(function () { var v = videoEl(); m.s.push({ t: (performance.now() - m.t0) / 1000, sw: D.swap(), film: v ? v.currentTime : null, paused: v ? v.paused : null }); }, 200);
            return 'measuring ' + label;
        };
        D.stop = function () { clearInterval(D.timer); if (state.swapOn) { setSwap(false); } };
        D.report = async function () {
            var m = D.meas; if (!m) { return null; }
            var firstShown = null, waits = 0, waitN = 0, live = 0, drifts = [], leads = [], rates = [], prevWait = true;
            m.s.forEach(function (x) {
                var d = x.sw; if (!d) { return; }
                if (d.shown && firstShown === null) { firstShown = x.t; }
                if (firstShown === null) { return; }
                live++;
                if (d.waiting) { waitN++; if (!prevWait) { waits++; } } else { drifts.push(Math.abs(d.drift) * 1000); rates.push(x.paused ? 0 : d.rate / (d.baseRate || 1)); }
                leads.push(d.lead); prevWait = d.waiting;
            });
            var span = m.s.length ? m.s[m.s.length - 1].t - (firstShown || 0) : 0;
            var film = m.s.filter(function (x) { return x.sw && x.sw.shown; });
            var adv = film.length > 1 ? film[film.length - 1].film - film[0].film : 0;
            var ses = null;
            try { ses = (await api().getJSON(url('Sessions', { deviceId: api().deviceId() })))[0]; } catch (e) { }
            var ti = ses && ses.TranscodingInfo;
            var worker = null;
            try { if (sw) { worker = (await post('Swap/Status', { stream: sw.stream })).speed || null; } } catch (e) { }
            return { label: m.label, worker: worker, seconds: +span.toFixed(1), firstPictureS: firstShown === null ? null : +firstShown.toFixed(1),
                waitingShare: live ? +(waitN / live * 100).toFixed(1) : null, rebuffers: waits,
                filmSpeed: span > 0 ? +(adv / span).toFixed(2) : null,
                rateAvg: rates.length ? +(rates.reduce(function (p, c) { return p + c; }, 0) / rates.length).toFixed(2) : null,
                driftMs: { p50: Math.round(pct(drifts, 0.5)), p95: Math.round(pct(drifts, 0.95)), max: Math.round(pct(drifts, 1)) },
                leadS: { min: +(pct(leads, 0) || 0).toFixed(1), p50: +(pct(leads, 0.5) || 0).toFixed(1) },
                play: ses ? ses.PlayState.PlayMethod : null,
                video: ti ? (ti.IsVideoDirect ? 'copy' : ti.VideoCodec + ' ' + (ti.Bitrate / 1e6).toFixed(1) + ' Mbps') : 'direct',
                reasons: ti ? ti.TranscodeReasons : [] };
        };
    }

    function init() {
        debugHook();
        var style = el('style');
        style.textContent = CSS;
        document.head.appendChild(style);
        var queued = false;
        var obs = new MutationObserver(function () {
            if (queued) { return; }
            queued = true;
            setTimeout(function () {
                queued = false;
                ensureButton();
                if (!livePage()) {
                    if (menu) { closeMenu(true); }
                    if (sw || pending) { idleSwap(); }
                    if (!state.left) { state.left = true; newPlaybackSession(); }
                } else {
                    state.left = false;
                }
            }, 50);
        });
        obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
        document.addEventListener('viewshow', function () { cfg = null; ensureButton(); if (livePage()) { syncConnection(false); } }, true);
        window.addEventListener('keydown', onKey, true);
        ['pointerdown', 'keydown', 'command'].forEach(function (ev) { document.addEventListener(ev, function () { lastInputAt = Date.now(); }, true); });
        window.addEventListener('popstate', onPopState, true);
        document.addEventListener('loadstart', onMediaLoad, true);
        window.addEventListener('resize', place);
        setInterval(function () {
            if (state.conn === 'on' && livePage() && (!sw || sw.restartAt)) { post('Swap/Status', { keepalive: true }).catch(function () { }); }
        }, 60000);
    }

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();