import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { NormalizedEvent } from '../types';
import { RotateCcw, ZoomIn, ZoomOut, Compass } from 'lucide-react';

interface GlobeSceneProps {
  events: NormalizedEvent[];
  selectedEvent: NormalizedEvent | null;
  onSelectEvent: (event: NormalizedEvent) => void;
  onResetView?: () => void;
}

export const GlobeScene: React.FC<GlobeSceneProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
  onResetView
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const markersRef = useRef<THREE.Mesh[]>([]);
  const isInteractingRef = useRef<boolean>(false);
  const hoveredEventRef = useRef<NormalizedEvent | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<NormalizedEvent | null>(null);
  const [webGlAvailable, setWebGlAvailable] = useState<boolean>(true);

  // Generate procedural realistic high-fidelity Earth texture
  const createEarthTexture = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4096;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // 1. Deep Oceanic Abyss Gradient
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 2048);
    oceanGrad.addColorStop(0, '#02050D');
    oceanGrad.addColorStop(0.5, '#050D1C');
    oceanGrad.addColorStop(1, '#02050D');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 4096, 2048);

    // 2. Graticules (Subtle 30-degree orbital coordinates)
    ctx.strokeStyle = 'rgba(114, 221, 251, 0.035)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x <= 4096; x += 341) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 2048);
      ctx.stroke();
    }
    for (let y = 0; y <= 2048; y += 170) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(4096, y);
      ctx.stroke();
    }

    // 3. Procedural Continents Shading with Landmass Clusters
    // Major continental centroid approximations with density distributions
    const continentalCenters = [
      // North America
      { x: 1100, y: 650, rad: 380, count: 500 },
      // South America
      { x: 1450, y: 1350, rad: 320, count: 420 },
      // Eurasia / Europe
      { x: 2200, y: 580, rad: 320, count: 480 },
      // Asia
      { x: 2900, y: 700, rad: 520, count: 700 },
      // Africa
      { x: 2250, y: 1150, rad: 420, count: 550 },
      // Australia
      { x: 3350, y: 1450, rad: 260, count: 320 },
      // Southeast Asia / Maritime
      { x: 3100, y: 1100, rad: 280, count: 360 }
    ];

    ctx.fillStyle = 'rgba(114, 221, 251, 0.16)';
    continentalCenters.forEach(center => {
      for (let i = 0; i < center.count; i++) {
        const u = Math.random() + Math.random();
        const r = (u > 1 ? 2 - u : u) * center.rad;
        const theta = Math.random() * Math.PI * 2;
        const cx = center.x + r * Math.cos(theta);
        const cy = center.y + r * Math.sin(theta) * 0.85;
        const pSize = 1.5 + Math.random() * 4.5;

        ctx.beginPath();
        ctx.arc(cx, cy, pSize, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL support
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlAvailable(false);
        return;
      }
    } catch {
      setWebGlAvailable(false);
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 15, 255);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Globe Container Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    const globeRadius = 78;

    // 4. Earth Sphere Mesh
    const earthTexture = createEarthTexture();
    const globeGeo = new THREE.SphereGeometry(globeRadius, 64, 64);
    const globeMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.82,
      metalness: 0.15,
      transparent: true,
      opacity: 0.98
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // 5. Atmospheric Rayleigh-like Rim Glow (Custom Shader)
    const atmosGeo = new THREE.SphereGeometry(globeRadius * 1.075, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.6);
          // Soft intelligence cyan with faint deep-blue scatter
          vec3 atmosphereColor = vec3(0.447, 0.867, 0.984);
          gl_FragColor = vec4(atmosphereColor, 1.0) * intensity * 0.85;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // 6. Deep Space Background Starfield
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 1100;
      starPositions[i + 1] = (Math.random() - 0.5) * 1100;
      starPositions[i + 2] = (Math.random() - 0.5) * 1100;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x8D9AAA,
      size: 1.2,
      transparent: true,
      opacity: 0.45
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 7. Lighting
    const ambientLight = new THREE.AmbientLight(0x05070B, 3.2);
    scene.add(ambientLight);

    const keySun = new THREE.DirectionalLight(0xF2F5FA, 2.5);
    keySun.position.set(180, 100, 160);
    scene.add(keySun);

    const rimScatter = new THREE.DirectionalLight(0x72DDFB, 1.2);
    rimScatter.position.set(-180, -90, -120);
    scene.add(rimScatter);

    // 8. Interaction & Controls
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    const idleRotationSpeed = 0.0006;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      isInteractingRef.current = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      // Raycasting for marker hover
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      if (cameraRef.current) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, cameraRef.current);
        const intersects = raycaster.intersectObjects(markersRef.current);

        if (intersects.length > 0) {
          const hit = intersects[0].object as THREE.Mesh;
          const ev = hit.userData as NormalizedEvent;
          if (ev && hoveredEventRef.current?.id !== ev.id) {
            hoveredEventRef.current = ev;
            setHoveredEvent(ev);
            container.style.cursor = 'pointer';
          }
        } else if (hoveredEventRef.current) {
          hoveredEventRef.current = null;
          setHoveredEvent(null);
          container.style.cursor = isDragging ? 'grabbing' : 'grab';
        }
      }

      if (!isDragging || !globeGroupRef.current) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;

      globeGroupRef.current.rotation.y += dx * 0.0045;
      globeGroupRef.current.rotation.x += dy * 0.0045;
      // Clamp pitch rotation to avoid pole flip
      globeGroupRef.current.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, globeGroupRef.current.rotation.x));

      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
      setTimeout(() => {
        isInteractingRef.current = false;
      }, 1800);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      cameraRef.current.position.z = Math.max(125, Math.min(360, cameraRef.current.position.z + e.deltaY * 0.18));
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      if (!cameraRef.current) return;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(markersRef.current);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const ev = hit.userData as NormalizedEvent;
        if (ev) {
          onSelectEvent(ev);
        }
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('click', onClick);

    // Resize
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Idle planet spin when untouched
      if (globeGroupRef.current && !isInteractingRef.current) {
        globeGroupRef.current.rotation.y += idleRotationSpeed;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('click', onClick);

      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      globeGeo.dispose();
      globeMat.dispose();
      earthTexture.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
      starGeo.dispose();
      starMat.dispose();
    };
  }, [createEarthTexture, onSelectEvent]);

  // Update Glowing Incident Markers
  useEffect(() => {
    if (!globeGroupRef.current) return;
    const globeGroup = globeGroupRef.current;

    // Dispose old markers
    markersRef.current.forEach(m => {
      globeGroup.remove(m);
      m.geometry.dispose();
      if (Array.isArray(m.material)) {
        m.material.forEach(mat => mat.dispose());
      } else {
        m.material.dispose();
      }
    });
    markersRef.current = [];

    const globeRadius = 78;

    events.forEach(ev => {
      if (ev.latitude === null || ev.latitude === undefined || ev.longitude === null || ev.longitude === undefined) {
        return;
      }

      const lat = ev.latitude;
      const lon = ev.longitude;

      // WGS84 to Cartesian Spherical
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const r = globeRadius * 1.018;

      const x = -(r * Math.sin(phi) * Math.cos(theta));
      const z = (r * Math.sin(phi) * Math.sin(theta));
      const y = (r * Math.cos(phi));

      // Restrained Semantic Colors
      let colorHex = 0xA5C4D4; // Ice Low
      if (ev.severity === 'critical') colorHex = 0xFF626B; // Critical Red
      else if (ev.severity === 'high') colorHex = 0xFFBD69; // Signal Amber
      else if (ev.severity === 'medium') colorHex = 0x72DDFB; // Intelligence Cyan

      const isSelected = selectedEvent?.id === ev.id;
      const pinRadius = isSelected ? 2.8 : Math.max(1.4, Math.min(2.4, 1.2 + ev.calculated_risk_score / 60));

      const pinGeo = new THREE.SphereGeometry(pinRadius, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({
        color: colorHex
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.set(x, y, z);
      pinMesh.userData = ev;

      // Perpendicular Orbital Halo Ring
      const haloGeo = new THREE.RingGeometry(pinRadius * 1.2, pinRadius * 2.2, 24);
      const haloMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isSelected ? 0.8 : 0.45
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.lookAt(new THREE.Vector3(0, 0, 0));
      pinMesh.add(haloMesh);

      globeGroup.add(pinMesh);
      markersRef.current.push(pinMesh);
    });
  }, [events, selectedEvent]);

  // Selected Event Coordinate Orientation
  useEffect(() => {
    if (!selectedEvent || selectedEvent.latitude === null || selectedEvent.latitude === undefined || selectedEvent.longitude === null || selectedEvent.longitude === undefined) return;
    if (!globeGroupRef.current) return;

    const lat = selectedEvent.latitude;
    const lon = selectedEvent.longitude;

    const phi = (lat * Math.PI) / 180;
    const theta = (-lon * Math.PI) / 180;

    globeGroupRef.current.rotation.x = phi;
    globeGroupRef.current.rotation.y = theta - Math.PI / 2;
    isInteractingRef.current = true;
    setTimeout(() => {
      isInteractingRef.current = false;
    }, 2500);
  }, [selectedEvent]);

  const handleResetCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 15, 255);
    }
    if (globeGroupRef.current) {
      globeGroupRef.current.rotation.set(0, 0, 0);
    }
    if (onResetView) onResetView();
  };

  const handleZoom = (delta: number) => {
    if (!cameraRef.current) return;
    cameraRef.current.position.z = Math.max(125, Math.min(360, cameraRef.current.position.z + delta));
  };

  if (!webGlAvailable) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-space p-6 text-center select-none">
        <Compass className="w-12 h-12 text-content-muted mb-3" />
        <h3 className="text-sm font-semibold text-content-primary">Planetary Visualization Unavailable</h3>
        <p className="text-xs text-content-secondary max-w-sm mt-1">
          Hardware WebGL acceleration is disabled or unsupported. Please use the high-contrast data stream on the left.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden select-none">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating In-Scene Hover Tooltip */}
      {hoveredEvent && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-150">
          <div className="command-surface-elevated px-3 py-1.5 rounded-lg flex items-center space-x-2 text-xs font-mono shadow-subtle-surface">
            <span className={`w-2 h-2 rounded-full ${
              hoveredEvent.severity === 'critical' ? 'bg-signal-red' :
              hoveredEvent.severity === 'high' ? 'bg-signal-amber' : 'bg-signal-cyan'
            }`} />
            <span className="text-content-primary font-medium">{hoveredEvent.title}</span>
            <span className="text-content-muted">|</span>
            <span className="text-content-secondary font-mono">RISK: {hoveredEvent.calculated_risk_score}</span>
          </div>
        </div>
      )}

      {/* Spatial Camera & Reset Controls */}
      <div className="absolute bottom-6 right-6 flex items-center space-x-1.5 command-surface p-1 rounded-lg">
        <button
          onClick={() => handleZoom(-30)}
          className="p-1.5 rounded hover:bg-surface-subtle text-content-secondary hover:text-content-primary transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(30)}
          className="p-1.5 rounded hover:bg-surface-subtle text-content-secondary hover:text-content-primary transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-surface-border mx-0.5" />
        <button
          onClick={handleResetCamera}
          className="p-1.5 rounded hover:bg-surface-subtle text-content-secondary hover:text-signal-cyan transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Coordinate Telemetry (Restrained) */}
      <div className="absolute bottom-6 left-6 pointer-events-none text-[11px] font-mono text-content-muted">
        <div>WGS84 // RAYLEIGH LIMB SCATTER ACTIVE</div>
        <div>REAL-TIME SENSOR FUSION</div>
      </div>
    </div>
  );
};
