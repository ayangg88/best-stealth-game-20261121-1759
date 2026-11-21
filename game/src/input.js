// Moonmoth Shrine — keyboard and mouse input.
// One file, one job: turn keys and clicks into game intents.

export function createInput(canvas) {
  const keys = new Set();
  // The last mouse click, in canvas pixels, consumed by the game
  // loop when it tosses a pebble. Null when there is none pending.
  let click = null;
  let pausedToggle = false;
  let restartToggle = false;
  let anyKey = false;

  function keyName(event) {
    return event.key.length === 1 ? event.key.toLowerCase() : event.key;
  }

  function onKeyDown(event) {
    const name = keyName(event);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }
    if (name === 'p' || name === 'P') pausedToggle = true;
    if (name === 'r' || name === 'R') restartToggle = true;
    anyKey = true;
    keys.add(name);
    keys.add(event.key);
  }

  function onKeyUp(event) {
    keys.delete(keyName(event));
    keys.delete(event.key);
  }

  function onMouseDown(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    click = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  function onBlur() {
    keys.clear();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('mousedown', onMouseDown);

  function held(...names) {
    return names.some((name) => keys.has(name));
  }

  return {
    // A unit movement vector from the keys held this frame.
    moveVector() {
      let x = 0;
      let y = 0;
      if (held('a', 'A', 'ArrowLeft')) x -= 1;
      if (held('d', 'D', 'ArrowRight')) x += 1;
      if (held('w', 'W', 'ArrowUp')) y -= 1;
      if (held('s', 'S', 'ArrowDown')) y += 1;
      if (x !== 0 && y !== 0) {
        const len = Math.hypot(x, y);
        x /= len;
        y /= len;
      }
      return { x, y };
    },
    sneaking() {
      return held('Shift');
    },
    // True once per P press; the game clears it by reading it.
    takePauseToggle() {
      const value = pausedToggle;
      pausedToggle = false;
      return value;
    },
    takeRestartToggle() {
      const value = restartToggle;
      restartToggle = false;
      return value;
    },
    // True once per click; the game clears it by reading it.
    takeClick() {
      const value = click;
      click = null;
      return value;
    },
    // True once per key press; the game clears it by reading it.
    takeAnyKey() {
      const value = anyKey;
      anyKey = false;
      return value;
    },
    // Used by the autopilot: pretend keys are held.
    injectMove(x, y, sneak) {
      keys.clear();
      if (x < -0.2) keys.add('a');
      if (x > 0.2) keys.add('d');
      if (y < -0.2) keys.add('w');
      if (y > 0.2) keys.add('s');
      if (sneak) keys.add('Shift');
    },
    releaseAll() {
      keys.clear();
    },
  };
}
