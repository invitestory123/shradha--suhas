import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

function setup(source, restored = false) {
  const classes = new Set(restored ? ['is-open', 'v5-title-ready'] : ['is-closed']);
  const listeners = new Map();
  const timers = new Map();
  let now = 0, serial = 0, observer, additions = 0;
  const hero = { dataset: {}, classList: {
    contains: value => classes.has(value),
    add: value => { classes.add(value); if (value === 'v5-title-ready') additions++; }
  }};
  const video = { currentTime: 0, duration: 5.166667, ended: false, error: null,
    addEventListener: (name, fn) => {
      if (!listeners.has(name)) listeners.set(name, []);
      listeners.get(name).push(fn);
    }
  };
  const context = {
    document: { querySelector: selector => selector === '#hero' ? hero : selector === '#introVideo' ? video : null,
      documentElement: { classList: { add() {} } } },
    MutationObserver: class { constructor(fn) { observer = fn; } observe() {} },
    window: { addEventListener() {} },
    setTimeout(fn, delay) { const id = ++serial; timers.set(id, { at: now + delay, fn }); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  vm.runInNewContext(source, context);
  return {
    hero, video,
    open() { classes.delete('is-closed'); classes.add('is-open'); observer(); },
    emit(name) { (listeners.get(name) || []).forEach(fn => fn()); },
    ready() { return classes.has('v5-title-ready'); },
    additions() { return additions; },
    advance(ms) {
      const to = now + ms;
      while (true) {
        const next = [...timers].filter(([, timer]) => timer.at <= to).sort((a,b) => a[1].at-b[1].at)[0];
        if (!next) break;
        now = next[1].at; timers.delete(next[0]); next[1].fn();
      }
      now = to;
    }
  };
}

for (const template of ['amber', 'ruby']) {
  const source = fs.readFileSync(new URL(`../../${template}/assets/js/v5-playback.js`, import.meta.url), 'utf8');
  const normal = setup(source);
  normal.open(); normal.open();
  normal.advance(5200);
  assert.equal(normal.ready(), false, 'wall clock alone must not reveal title');
  normal.video.currentTime = 2; normal.emit('timeupdate');
  normal.advance(8000);
  assert.equal(normal.ready(), false, 'buffered mid-film must retain title gate');
  normal.video.currentTime = 5.16; normal.emit('timeupdate');
  assert.equal(normal.ready(), true);
  normal.video.ended = true; normal.emit('ended'); normal.open();
  assert.equal(normal.additions(), 1, 'repeat input and ended must not replay title fade');

  const slow = setup(source);
  slow.video.duration = 12; slow.open();
  slow.video.currentTime = 5.2; slow.emit('timeupdate');
  assert.equal(slow.ready(), false, 'longer media must not use a fixed 5.2-second cutoff');
  slow.video.currentTime = 11.95; slow.emit('timeupdate');
  assert.equal(slow.ready(), true);

  const failed = setup(source); failed.open(); failed.advance(12000);
  assert.equal(failed.ready(), true, 'unavailable media must have a bounded title fallback');
  assert.equal(failed.hero.dataset.v5TitleReason, 'media-fallback');

  const errored = setup(source);
  errored.video.error = { code: 4 }; errored.emit('error');
  assert.equal(errored.ready(), false, 'closed cover must stay closed on preload error');
  errored.open(); assert.equal(errored.ready(), true);

  const restored = setup(source, true);
  restored.emit('ended');
  assert.equal(restored.additions(), 0, 'restored ready title must not animate again');
  console.log(`${template}: 6 media-state scenarios passed`);
}

// An external/system pause must be recoverable with one click, regardless of
// any private playing flag in the original app.
for (const template of ['amber', 'ruby']) {
  const events = new Map(), attrs = {}, label = { textContent: '' };
  let click, capture, playCalls = 0, pauseCalls = 0;
  const audio = { paused: true, ended: false, error: null,
    addEventListener(name, fn) { events.set(name, fn); },
    play() { playCalls++; this.paused = false; events.get('play')?.(); return Promise.resolve(); },
    pause() { pauseCalls++; this.paused = true; events.get('pause')?.(); }
  };
  const button = {
    classList: { toggle() {} },
    setAttribute(name, value) { attrs[name] = value; },
    addEventListener(name, fn, useCapture) { if (name === 'click') { click = fn; capture = useCapture; } }
  };
  vm.runInNewContext(fs.readFileSync(new URL(`../../${template}/assets/js/v5-playback.js`, import.meta.url), 'utf8'), {
    document: { querySelector: selector => ({ '#backgroundMusic': audio, '#musicToggle': button, '#musicLabel': label })[selector] || null },
    window: { addEventListener() {} }
  });
  assert.equal(capture, true);
  const gesture = () => { let stopped = false; click({ preventDefault() {}, stopImmediatePropagation() { stopped = true; } }); assert.equal(stopped, true); };
  gesture(); assert.equal(playCalls, 1); assert.equal(attrs['aria-pressed'], 'true'); assert.equal(label.textContent, 'Playing');
  audio.paused = true; events.get('pause')(); // External pause, not our button.
  assert.equal(attrs['aria-label'], 'Play background music');
  gesture(); assert.equal(playCalls, 2, 'first click after external pause must resume'); assert.equal(audio.paused, false);
  gesture(); assert.equal(pauseCalls, 1); assert.equal(attrs['aria-pressed'], 'false'); assert.equal(label.textContent, 'Music');
  console.log(`${template}: music click, external-pause recovery and pause passed`);
}
