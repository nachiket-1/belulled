import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface FeelSmallProps {
  onDone: () => void;
}

// Beat-by-beat captions tied to camera zoom
const STAGES = [
  { at: 0,  label: 'a quiet morning',         caption: 'this is where you are.' },
  { at: 6,  label: 'one mountain on earth',   caption: 'a small world. a soft sun.' },
  { at: 13, label: 'one planet',              caption: 'the earth. small, blue.' },
  { at: 20, label: 'one star',                caption: 'the sun — one of billions.' },
  { at: 27, label: 'one galaxy',              caption: 'our galaxy — one of trillions.' },
  { at: 34, label: 'everything we know',      caption: 'and here, somehow, you are.' },
  { at: 40, label: '',                         caption: 'still small. still here.' },
  { at: 45, label: '',                         caption: 'and that is enough.' },
];

const TOTAL = 50;

const FeelSmall: React.FC<FeelSmallProps> = ({ onDone }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const container = containerRef.current!;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05050a, 0.0008);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100000);
    camera.position.set(0, 5, 20);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ── LIGHTING ──
    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambient);
    const sunLight = new THREE.DirectionalLight(0xffe0b0, 1.2);
    sunLight.position.set(20, 15, 10);
    scene.add(sunLight);
    const rimLight = new THREE.DirectionalLight(0x8090ff, 0.4);
    rimLight.position.set(-10, 5, -10);
    scene.add(rimLight);

    // ── MOUNTAIN (low-poly) ──
    const mountainGroup = new THREE.Group();
    const mountainGeo = new THREE.ConeGeometry(8, 12, 6, 1, false);
    // Slightly randomize vertices for organic feel
    const positions = mountainGeo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      if (y < 5) {
        positions.setX(i, positions.getX(i) + (Math.random() - 0.5) * 0.6);
        positions.setZ(i, positions.getZ(i) + (Math.random() - 0.5) * 0.6);
      }
    }
    mountainGeo.computeVertexNormals();

    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x2a2540,
      flatShading: true,
      roughness: 0.95,
      metalness: 0.0,
    });
    const mountain = new THREE.Mesh(mountainGeo, mountainMat);
    mountain.position.y = -2;
    mountainGroup.add(mountain);

    // Snow cap
    const snowGeo = new THREE.ConeGeometry(2.5, 4, 6, 1, false);
    const snowMat = new THREE.MeshStandardMaterial({
      color: 0xf0e8e0,
      flatShading: true,
      roughness: 0.9,
    });
    const snow = new THREE.Mesh(snowGeo, snowMat);
    snow.position.y = 4;
    mountainGroup.add(snow);

    // Smaller mountains around
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const r = 14 + Math.random() * 4;
      const m = mountain.clone();
      m.material = mountainMat.clone();
      (m.material as THREE.MeshStandardMaterial).color.setHSL(0.7, 0.2, 0.15 + Math.random() * 0.05);
      m.scale.setScalar(0.5 + Math.random() * 0.4);
      m.position.set(Math.cos(angle) * r, -3, Math.sin(angle) * r);
      mountainGroup.add(m);
    }

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(60, 60, 20, 20);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a1530,
      flatShading: true,
      roughness: 1.0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    mountainGroup.add(ground);

    scene.add(mountainGroup);

    // ── EARTH ──
    const earthGroup = new THREE.Group();
    const earthGeo = new THREE.IcosahedronGeometry(3, 12); // smooth-ish but lightweight
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x2a6da8,
      roughness: 0.6,
      metalness: 0.1,
      emissive: 0x0a2545,
      emissiveIntensity: 0.3,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earth);

    // Continents — abstracted dark patches
    const continentMat = new THREE.MeshStandardMaterial({
      color: 0x3a5a3a,
      roughness: 0.8,
      flatShading: true,
    });
    for (let i = 0; i < 6; i++) {
      const cGeo = new THREE.SphereGeometry(0.6 + Math.random() * 0.8, 6, 4);
      const c = new THREE.Mesh(cGeo, continentMat);
      const phi = Math.random() * Math.PI;
      const theta = Math.random() * Math.PI * 2;
      c.position.setFromSphericalCoords(3, phi, theta);
      c.scale.set(1, 0.4, 1);
      c.lookAt(0, 0, 0);
      earthGroup.add(c);
    }

    // Atmosphere glow
    const atmoGeo = new THREE.SphereGeometry(3.4, 32, 32);
    const atmoMat = new THREE.ShaderMaterial({
      uniforms: { c: { value: 0.3 }, p: { value: 4.5 } },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        varying vec3 vNormal;
        uniform float c;
        uniform float p;
        void main() {
          float intensity = pow(c - dot(vNormal, vec3(0, 0, 1.0)), p);
          gl_FragColor = vec4(0.5, 0.7, 1.0, 1.0) * intensity;
        }`,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    const atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
    earthGroup.add(atmosphere);

    earthGroup.position.set(0, 0, -300);
    earthGroup.visible = false;
    scene.add(earthGroup);

    // ── SUN ──
    const sunGroup = new THREE.Group();
    const sunGeo = new THREE.SphereGeometry(8, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffd49a });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunGroup.add(sunMesh);

    // Sun glow sprite
    const glowGeo = new THREE.SphereGeometry(14, 32, 32);
    const glowMat = new THREE.ShaderMaterial({
      uniforms: { c: { value: 0.1 }, p: { value: 3.0 } },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        varying vec3 vNormal;
        uniform float c;
        uniform float p;
        void main() {
          float intensity = pow(c - dot(vNormal, vec3(0, 0, 1.0)), p);
          gl_FragColor = vec4(1.0, 0.85, 0.6, 1.0) * intensity;
        }`,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    const sunGlow = new THREE.Mesh(glowGeo, glowMat);
    sunGroup.add(sunGlow);

    sunGroup.position.set(0, 0, -1500);
    sunGroup.visible = false;
    scene.add(sunGroup);

    // Other stars near the sun stage
    const otherStarsGeo = new THREE.BufferGeometry();
    const otherStarPos: number[] = [];
    for (let i = 0; i < 80; i++) {
      otherStarPos.push(
        (Math.random() - 0.5) * 800,
        (Math.random() - 0.5) * 600,
        -1500 + (Math.random() - 0.5) * 400
      );
    }
    otherStarsGeo.setAttribute('position', new THREE.Float32BufferAttribute(otherStarPos, 3));
    const otherStarsMat = new THREE.PointsMaterial({
      color: 0xffd4a0,
      size: 6,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
    });
    const otherStars = new THREE.Points(otherStarsGeo, otherStarsMat);
    otherStars.visible = false;
    scene.add(otherStars);

    // ── GALAXY (spiral particles) ──
    const galaxyGeo = new THREE.BufferGeometry();
    const galaxyCount = 4000;
    const galaxyPos = new Float32Array(galaxyCount * 3);
    const galaxyColors = new Float32Array(galaxyCount * 3);
    const inner = new THREE.Color(0xffd0a0);
    const outer = new THREE.Color(0x6080ff);
    for (let i = 0; i < galaxyCount; i++) {
      const radius = Math.pow(Math.random(), 0.7) * 400;
      const branchAngle = ((i % 3) / 3) * Math.PI * 2;
      const spinAngle = radius * 0.012;
      const randomness = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 30;
      const randomY = (Math.random() - 0.5) * 30 * (radius / 400);
      galaxyPos[i * 3]     = Math.cos(branchAngle + spinAngle) * radius + randomness;
      galaxyPos[i * 3 + 1] = randomY;
      galaxyPos[i * 3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomness;
      const c = new THREE.Color().lerpColors(inner, outer, Math.min(1, radius / 400));
      galaxyColors[i * 3] = c.r;
      galaxyColors[i * 3 + 1] = c.g;
      galaxyColors[i * 3 + 2] = c.b;
    }
    galaxyGeo.setAttribute('position', new THREE.BufferAttribute(galaxyPos, 3));
    galaxyGeo.setAttribute('color', new THREE.BufferAttribute(galaxyColors, 3));
    const galaxyMat = new THREE.PointsMaterial({
      size: 1.4,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const galaxy = new THREE.Points(galaxyGeo, galaxyMat);
    galaxy.position.set(0, 0, -8000);
    galaxy.rotation.x = 0.3;
    galaxy.visible = false;
    scene.add(galaxy);

    // ── DISTANT GALAXIES (cosmos) ──
    const cosmosGeo = new THREE.BufferGeometry();
    const cosmosCount = 800;
    const cosmosPos = new Float32Array(cosmosCount * 3);
    const cosmosColors = new Float32Array(cosmosCount * 3);
    for (let i = 0; i < cosmosCount; i++) {
      cosmosPos[i * 3]     = (Math.random() - 0.5) * 30000;
      cosmosPos[i * 3 + 1] = (Math.random() - 0.5) * 20000;
      cosmosPos[i * 3 + 2] = -25000 + (Math.random() - 0.5) * 10000;
      const tints = [
        [0.85, 0.75, 1.0],
        [1.0, 0.8, 0.85],
        [0.8, 0.95, 1.0],
        [1.0, 0.95, 0.85],
      ];
      const t = tints[Math.floor(Math.random() * tints.length)];
      cosmosColors[i * 3] = t[0];
      cosmosColors[i * 3 + 1] = t[1];
      cosmosColors[i * 3 + 2] = t[2];
    }
    cosmosGeo.setAttribute('position', new THREE.BufferAttribute(cosmosPos, 3));
    cosmosGeo.setAttribute('color', new THREE.BufferAttribute(cosmosColors, 3));
    const cosmosMat = new THREE.PointsMaterial({
      size: 30,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cosmos = new THREE.Points(cosmosGeo, cosmosMat);
    cosmos.visible = false;
    scene.add(cosmos);

    // ── BACKGROUND STARFIELD (always visible) ──
    const bgStarsGeo = new THREE.BufferGeometry();
    const bgPos: number[] = [];
    for (let i = 0; i < 1500; i++) {
      const r = 50000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      bgPos.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
    }
    bgStarsGeo.setAttribute('position', new THREE.Float32BufferAttribute(bgPos, 3));
    const bgStarsMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 80,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.5,
    });
    const bgStars = new THREE.Points(bgStarsGeo, bgStarsMat);
    scene.add(bgStars);

    // ── RESIZE ──
    const resize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', resize);

    // ── ANIMATION ──
    const startTime = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const e = (t - startTime) / 1000;
      setElapsed(e);

      // Camera zoom path — non-linear, dramatic
      const ease = (x: number) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
      const tt = Math.min(1, e / 45);
      const eased = ease(tt);

      // Move camera back through space — exponential curve so each "stage" feels distinct
      const camZ = 20 + Math.pow(eased, 2.5) * 27000;
      camera.position.set(
        Math.sin(e * 0.05) * (camZ * 0.02), // gentle drift
        5 + camZ * 0.01,
        camZ
      );
      camera.lookAt(0, 0, 0);

      // Show/hide objects based on distance
      mountainGroup.visible = camZ < 350;

      earthGroup.visible = camZ > 80 && camZ < 1800;
      if (earthGroup.visible) {
        earthGroup.rotation.y = e * 0.15;
        earthGroup.position.z = -300;
      }

      sunGroup.visible = camZ > 800 && camZ < 5000;
      otherStars.visible = sunGroup.visible;
      if (sunGroup.visible) {
        sunMesh.rotation.y = e * 0.05;
      }

      galaxy.visible = camZ > 3000 && camZ < 20000;
      if (galaxy.visible) {
        galaxy.rotation.y = e * 0.02;
      }

      cosmos.visible = camZ > 12000;

      // Mountain breathing animation
      mountainGroup.position.y = Math.sin(e * 0.5) * 0.05;

      renderer.render(scene, camera);

      if (e >= TOTAL) {
        setTimeout(onDone, 1500);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      mountainGeo.dispose();
      snowGeo.dispose();
      groundGeo.dispose();
      earthGeo.dispose();
      atmoGeo.dispose();
      sunGeo.dispose();
      glowGeo.dispose();
      otherStarsGeo.dispose();
      galaxyGeo.dispose();
      cosmosGeo.dispose();
      bgStarsGeo.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [onDone]);

  // Determine current caption
  let currentStage = STAGES[0];
  for (const s of STAGES) {
    if (elapsed >= s.at) currentStage = s;
  }

  return (
    <div className="lull-small">
      <div ref={containerRef} className="lull-small-canvas" />
      <div className="lull-small-overlay">
        {currentStage.label && (
          <p className="lull-small-label" key={`label-${currentStage.at}`}>
            {currentStage.label}
          </p>
        )}
        <p className="lull-small-caption" key={`cap-${currentStage.at}`}>
          {currentStage.caption}
        </p>
      </div>
      <button className="lull-small-skip" onClick={onDone}>skip</button>
    </div>
  );
};

export default FeelSmall;
