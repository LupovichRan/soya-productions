/* Soya's 3D stage (three.js, stored in vendor/ so nothing loads from another site and it works offline).
   A night-sky newsroom: Soya sits in the middle while cartoon 3D objects for this week's stories orbit him
   (a chart, a chip, a globe, a phone, a name tag). Tap an object to jump to its story. Stars twinkle, the
   camera follows the finger a little, and a right quiz answer throws 3D confetti.
   It draws only while the stage is on screen. For reduced motion or Calm mode it draws one still picture
   and no confetti. If the device has no WebGL, the page keeps the flat picture of Soya. */
import * as THREE from './vendor/three.module.min.js';

const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let enabled = true;
const moving = () => enabled && !reduced;
const C = { sun: 0xFFC94D, pink: 0xFF8FB1, mint: 0x5EE0C1, sky: 0x7AA7FF, dark: 0x3B4466, cream: 0xFFF3D1, grey: 0x9AA3B8, red: 0xFF6B6B };

function webgl() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }

/* Cartoon shading: three flat tones instead of smooth light. */
const toneMap = (() => { const d = new Uint8Array([90, 170, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (color) => new THREE.MeshToonMaterial({ color, gradientMap: toneMap });

function box(w, h, d, color) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon(color)); }
function at(m, x, y, z) { m.position.set(x, y, z); return m; }

/* One small 3D object per kind of story, built from simple shapes. */
function makeObject(kind) {
  const g = new THREE.Group();
  if (kind === 'stock') {
    [0.22, 0.38, 0.56].forEach((h, i) => g.add(at(box(0.16, h, 0.16, C.mint), -0.22 + i * 0.22, h / 2 - 0.28, 0)));
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 24), toon(C.sun)); coin.rotation.x = Math.PI / 2; g.add(at(coin, 0.28, 0.32, 0.05));
  } else if (kind === 'chip') {
    g.add(box(0.6, 0.1, 0.6, C.dark)); g.add(at(box(0.32, 0.04, 0.32, C.mint), 0, 0.07, 0));
    for (let i = 0; i < 4; i++) { const o = -0.21 + i * 0.14; [[o, 0.38], [o, -0.38], [0.38, o], [-0.38, o]].forEach(([x, z]) => g.add(at(box(0.06, 0.03, 0.06, C.grey), x, 0, z))); }
    g.rotation.x = 0.9;
  } else if (kind === 'border') {
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 2), new THREE.MeshToonMaterial({ color: C.sky, gradientMap: toneMap, flatShading: true })));
    for (let i = 0; i < 7; i++) { const p = new THREE.Vector3().randomDirection().multiplyScalar(0.33); g.add(at(new THREE.Mesh(new THREE.DodecahedronGeometry(0.07 + Math.random() * 0.05), toon(C.mint)), p.x, p.y, p.z)); }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 8, 48), toon(C.pink)); ring.rotation.x = 1.2; g.add(ring);
  } else if (kind === 'helper') {
    g.add(box(0.36, 0.66, 0.06, C.dark)); g.add(at(box(0.3, 0.54, 0.02, 0x1B2032), 0, 0, 0.035));
    [[C.sun, -0.07, 0.15], [C.mint, 0.07, 0.15], [C.pink, -0.07, 0.01], [C.sky, 0.07, 0.01]].forEach(([c, x, y]) => g.add(at(box(0.1, 0.1, 0.02, c), x, y, 0.05)));
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), toon(0x2A2F3D)); g.add(at(paw, 0.16, -0.22, 0.1));
  } else {
    g.add(box(0.56, 0.44, 0.04, C.cream)); g.add(at(box(0.44, 0.3, 0.02, C.mint), 0, -0.02, 0.03));
    const sunDot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), toon(C.sun)); g.add(at(sunDot, 0.13, 0.08, 0.05));
    const tag = box(0.22, 0.12, 0.03, C.pink); tag.rotation.z = -0.4; g.add(at(tag, 0.3, -0.2, 0.06));
  }
  return g;
}

/* Soya's drawing becomes a picture on a flat card that always faces the camera. */
function loadTexture(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { const c = document.createElement('canvas'); c.width = 512; c.height = 564; c.getContext('2d').drawImage(img, 0, 0, 512, 564); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; resolve(t); };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

let stage = null;

async function mountStage(items, opts) {
  if (stage || !webgl()) return null;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.className = 'stage-canvas';
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', opts.label || '');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 2, 0.1, 50);
  camera.position.set(0, 1.25, 5.4);
  scene.add(new THREE.HemisphereLight(0xBFD4FF, 0x1A2135, 1.4));
  const key = new THREE.DirectionalLight(0xFFF1CC, 2.2); key.position.set(3, 5, 4); scene.add(key);

  // Stars: a slowly turning sky of small points.
  const starGeo = new THREE.BufferGeometry(), N = 360, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(9 + Math.random() * 6); pos.set([v.x, Math.abs(v.y) * 0.8 + 0.5, v.z - 4], i * 3); }
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xFFF3D1, size: 0.07, transparent: true, opacity: 0.85 });
  const stars = new THREE.Points(starGeo, starMat); scene.add(stars);

  // The floor Soya sits on: a soft round rug with a glowing edge.
  const floor = new THREE.Mesh(new THREE.CircleGeometry(2.6, 48), new THREE.MeshToonMaterial({ color: 0x222B44, gradientMap: toneMap }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.62; scene.add(floor);
  const glow = new THREE.Mesh(new THREE.RingGeometry(2.45, 2.6, 64), new THREE.MeshBasicMaterial({ color: C.mint, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = -0.61; scene.add(glow);

  // Soya in the middle, with three faces: sitting, smiling (also used for blinks), and wow.
  const [sit, happy, wow] = await Promise.all(['sit', 'happy', 'wow'].map((p) => loadTexture('assets/soya-' + p + '.svg')));
  const soyaMat = new THREE.MeshBasicMaterial({ map: sit, transparent: true, alphaTest: 0.05 });
  const soya = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 1.71), soyaMat); soya.position.y = 0.22; scene.add(soya);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.6, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.6; scene.add(shadow);

  // The week's stories orbit around him.
  const orbit = new THREE.Group(); scene.add(orbit);
  const objs = items.map((it, i) => {
    const o = makeObject(it.art); const a = (i / items.length) * Math.PI * 2;
    o.userData = { id: it.id, a, y: 0.15 + (i % 2) * 0.45, spin: 0.4 + Math.random() * 0.5, jump: 0 };
    o.position.set(Math.cos(a) * 2.05, o.userData.y, Math.sin(a) * 1.35); orbit.add(o); return o;
  });

  let face = sit, faceUntil = 0, nextBlink = 1.8, t = 0, last = performance.now(), running = false, visible = true, raf = 0;
  const target = { x: 0, y: 0 }, look = { x: 0, y: 0 };
  function setFace(tex, secs) { if (tex) { soyaMat.map = tex; soyaMat.needsUpdate = true; face = tex; faceUntil = t + secs; } }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    if (moving()) {
      orbit.rotation.y += dt * 0.25;
      objs.forEach((o, i) => {
        const u = o.userData; u.jump = Math.max(0, u.jump - dt * 1.6);
        o.position.y = u.y + Math.sin(t * 1.6 + i) * 0.08 + Math.sin(u.jump * Math.PI) * 0.6;
        o.rotation.y += dt * u.spin * (1 + u.jump * 6);
      });
      soya.position.y = 0.22 + Math.abs(Math.sin(t * 2.2)) * 0.03;
      stars.rotation.y += dt * 0.01; starMat.opacity = 0.7 + Math.sin(t * 2.3) * 0.15;
      look.x += (target.x - look.x) * Math.min(1, dt * 3); look.y += (target.y - look.y) * Math.min(1, dt * 3);
      if (face !== sit && t > faceUntil) setFace(sit, 0);
      if (t > nextBlink && face === sit) { setFace(happy, 0.14); nextBlink = t + 2.2 + Math.random() * 3.5; }
    }
    camera.position.x = look.x * 0.6; camera.position.y = 1.25 + look.y * 0.3;
    camera.lookAt(0, 0.25, 0);
    soya.quaternion.copy(camera.quaternion);
    // Objects in front of Soya draw over him, behind him under him.
    renderer.render(scene, camera);
    if (running) raf = requestAnimationFrame(frame);
  }
  function start() { if (running || !moving() || !visible || document.visibilityState !== 'visible') { if (!running) { last = performance.now(); frame(last); } return; } running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  function size() {
    const host = renderer.domElement.parentElement; if (!host) return;
    const w = host.clientWidth || 360, h = Math.round(Math.min(300, Math.max(220, w * 0.62)));
    renderer.setSize(w, h, false); renderer.domElement.style.width = '100%'; renderer.domElement.style.height = h + 'px';
    camera.aspect = w / h; camera.updateProjectionMatrix(); if (!running) { last = performance.now(); frame(last); }
  }

  // Tap an object: it jumps and spins, Soya says wow, and the page goes to that story.
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  renderer.domElement.addEventListener('pointerdown', (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(objs, true)[0];
    if (hit) { let o = hit.object; while (o.parent && !o.userData.id) o = o.parent; o.userData.jump = 1; setFace(wow, 0.9); if (!running) start(); if (opts.onPick) setTimeout(() => opts.onPick(o.userData.id), moving() ? 450 : 0); }
    else { setFace(happy, 0.8); if (opts.onSoya) opts.onSoya(); }
  });
  renderer.domElement.addEventListener('pointermove', (e) => { const r = renderer.domElement.getBoundingClientRect(); target.x = ((e.clientX - r.left) / r.width) * 2 - 1; target.y = -(((e.clientY - r.top) / r.height) * 2 - 1); });
  renderer.domElement.addEventListener('pointerleave', () => { target.x = 0; target.y = 0; });

  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => { visible = es[0].isIntersecting; visible ? start() : stop(); }, { threshold: 0.05 }) : null;
  document.addEventListener('visibilitychange', () => (document.visibilityState === 'visible' ? start() : stop()));
  window.addEventListener('resize', size);

  stage = {
    attach(host) {
      if (!host) return; host.innerHTML = ''; host.appendChild(renderer.domElement); host.classList.add('live3d');
      if (io) { io.disconnect(); io.observe(host); }
      size(); start();
    },
    smile() { setFace(happy, 1.2); if (!running) start(); },
    wow() { setFace(wow, 1.0); if (!running) start(); },
    refresh() { stop(); start(); }
  };
  return stage;
}

/* Confetti: a burst of small 3D paper pieces from a point on the screen, drawn on a see-through layer. */
let fx = null;
function burst(x, y) {
  if (!moving() || !webgl()) return;
  if (!fx) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.domElement.className = 'fx-canvas';
    document.body.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(0, 1, 0, 1, -10, 10);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 2.4));
    fx = { renderer, scene, camera, bits: [], running: false };
  }
  const W = window.innerWidth, H = window.innerHeight;
  fx.renderer.setSize(W, H); fx.camera.right = W; fx.camera.bottom = H; fx.camera.updateProjectionMatrix();
  const colors = [C.sun, C.pink, C.mint, C.sky, C.cream];
  for (let i = 0; i < 70; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(9, 14), new THREE.MeshBasicMaterial({ color: colors[i % colors.length], side: THREE.DoubleSide }));
    m.position.set(x, y, 0); const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, s = 260 + Math.random() * 380;
    m.userData = { vx: Math.cos(a) * s, vy: Math.sin(a) * s, rx: Math.random() * 12, ry: Math.random() * 12, life: 1.6 + Math.random() * 0.6 };
    fx.scene.add(m); fx.bits.push(m);
  }
  fx.renderer.domElement.hidden = false;
  if (fx.running) return; fx.running = true;
  let last = performance.now();
  (function step(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    fx.bits = fx.bits.filter((m) => {
      const u = m.userData; u.life -= dt; u.vy += 900 * dt; u.vx *= 0.99;
      m.position.x += u.vx * dt; m.position.y += u.vy * dt; m.rotation.x += u.rx * dt; m.rotation.y += u.ry * dt;
      if (u.life <= 0 || m.position.y > H + 40) { fx.scene.remove(m); m.geometry.dispose(); m.material.dispose(); return false; }
      return true;
    });
    fx.renderer.render(fx.scene, fx.camera);
    if (fx.bits.length) requestAnimationFrame(step); else { fx.running = false; fx.renderer.domElement.hidden = true; }
  })(last);
}

window.Soya3D = {
  mount: mountStage,
  burst,
  setEnabled(on) { enabled = !!on; if (stage) stage.refresh(); },
  get stage() { return stage; }
};
document.dispatchEvent(new CustomEvent('soya3d-ready'));
