import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { NormalizedEvent } from '../types';

interface GlobeSceneProps {
  events: NormalizedEvent[];
  selectedEvent: NormalizedEvent | null;
  onSelectEvent: (event: NormalizedEvent) => void;
}

export const GlobeScene: React.FC<GlobeSceneProps> = ({
  events,
  selectedEvent,
  onSelectEvent
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const markersRef = useRef<THREE.Mesh[]>([]);
  const isInteractingRef = useRef<boolean>(false);
  const targetCameraPosRef = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 240);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Globe Container Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // 4. Procedural Earth Texture Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Ocean gradient
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, 1024);
      oceanGrad.addColorStop(0, '#040b1e');
      oceanGrad.addColorStop(0.5, '#061330');
      oceanGrad.addColorStop(1, '#020714');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, 2048, 1024);

      // Fine tactical latitude/longitude grid lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= 2048; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1024);
        ctx.stroke();
      }
      for (let y = 0; y <= 1024; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(2048, y);
        ctx.stroke();
      }

      // Procedural continents representation dots
      ctx.fillStyle = 'rgba(0, 240, 255, 0.22)';
      for (let i = 0; i < 4500; i++) {
        const cx = Math.random() * 2048;
        const cy = 100 + Math.random() * 824;
        const r = 1 + Math.random() * 3.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const earthTexture = new THREE.CanvasTexture(canvas);
    const globeRadius = 75;

    // Earth Sphere
    const globeGeo = new THREE.SphereGeometry(globeRadius, 64, 64);
    const globeMat = new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpScale: 0.8,
      specular: new THREE.Color(0x00f0ff),
      shininess: 15,
      transparent: true,
      opacity: 0.95
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // Volumetric Atmosphere Glow
    const atmosGeo = new THREE.SphereGeometry(globeRadius * 1.08, 64, 64);
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
          float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          gl_FragColor = vec4(0.0, 0.94, 1.0, 1.0) * intensity * 0.75;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // 5. Starfield Background Particles
    const starCount = 1500;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 1200;
      starPositions[i + 1] = (Math.random() - 0.5) * 1200;
      starPositions[i + 2] = (Math.random() - 0.5) * 1200;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x70d6ff,
      size: 1.5,
      transparent: true,
      opacity: 0.65
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 6. Lighting
    const ambientLight = new THREE.AmbientLight(0x0b1a30, 2.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.8);
    sunLight.position.set(200, 120, 180);
    scene.add(sunLight);

    const cyanRimLight = new THREE.DirectionalLight(0x00f0ff, 1.5);
    cyanRimLight.position.set(-180, -100, -100);
    scene.add(cyanRimLight);

    // 7. Mouse Drag Controls
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let rotationVelocity = { x: 0.0008, y: 0.0018 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      isInteractingRef.current = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !globeGroupRef.current) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      globeGroupRef.current.rotation.y += deltaX * 0.005;
      globeGroupRef.current.rotation.x += deltaY * 0.005;

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
      setTimeout(() => {
        isInteractingRef.current = false;
      }, 1500);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      cameraRef.current.position.z = Math.max(110, Math.min(360, cameraRef.current.position.z + e.deltaY * 0.15));
    };

    // 8. Raycasting for Event Click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (!cameraRef.current) return;
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(markersRef.current);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const evData = hitMesh.userData as NormalizedEvent;
        if (evData) {
          onSelectEvent(evData);
        }
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('click', onClick);

    // 9. Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Continuous subtle idle rotation when user is not actively dragging
      if (globeGroupRef.current && !isInteractingRef.current) {
        globeGroupRef.current.rotation.y += rotationVelocity.y;
      }

      // Smooth camera interpolation if fly-to is targeted
      if (cameraRef.current && targetCameraPosRef.current) {
        cameraRef.current.position.lerp(targetCameraPosRef.current, 0.05);
        if (cameraRef.current.position.distanceTo(targetCameraPosRef.current) < 1.0) {
          targetCameraPosRef.current = null;
        }
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
  }, [onSelectEvent]);

  // Marker Updating Effect
  useEffect(() => {
    if (!globeGroupRef.current) return;
    const globeGroup = globeGroupRef.current;

    // Clean existing markers
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

    const globeRadius = 75;

    // Add glowing marker pins for each event with valid coordinates
    events.forEach(ev => {
      if (ev.latitude === null || ev.latitude === undefined || ev.longitude === null || ev.longitude === undefined) {
        return;
      }

      const lat = ev.latitude;
      const lon = ev.longitude;

      // Coordinate projection to Cartesian space
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const r = globeRadius * 1.02;

      const x = -(r * Math.sin(phi) * Math.cos(theta));
      const z = (r * Math.sin(phi) * Math.sin(theta));
      const y = (r * Math.cos(phi));

      // Severity Color Palette
      let hexColor = 0x70d6ff; // ice blue (low)
      if (ev.severity === 'critical') hexColor = 0xff0054; // neon crimson
      else if (ev.severity === 'high') hexColor = 0xffb703; // amber
      else if (ev.severity === 'medium') hexColor = 0x00f0ff; // cyan

      const markerGeo = new THREE.SphereGeometry(1.6 + (ev.calculated_risk_score / 60), 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({
        color: hexColor,
        wireframe: false
      });

      const markerMesh = new THREE.Mesh(markerGeo, markerMat);
      markerMesh.position.set(x, y, z);
      markerMesh.userData = ev;

      // Glow halo ring
      const haloGeo = new THREE.RingGeometry(2.0, 3.8, 24);
      const haloMat = new THREE.MeshBasicMaterial({
        color: hexColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.lookAt(new THREE.Vector3(0, 0, 0));
      markerMesh.add(haloMesh);

      globeGroup.add(markerMesh);
      markersRef.current.push(markerMesh);
    });
  }, [events]);

  // Selected event camera focus transition
  useEffect(() => {
    if (!selectedEvent || selectedEvent.latitude === null || selectedEvent.latitude === undefined || selectedEvent.longitude === null || selectedEvent.longitude === undefined) return;
    if (!globeGroupRef.current) return;

    const lat = selectedEvent.latitude;
    const lon = selectedEvent.longitude;

    // Smoothly rotate globe so selected coordinate faces camera
    const phi = (lat * Math.PI) / 180;
    const theta = (-lon * Math.PI) / 180;

    globeGroupRef.current.rotation.x = phi;
    globeGroupRef.current.rotation.y = theta - Math.PI / 2;
    isInteractingRef.current = true;
    setTimeout(() => {
      isInteractingRef.current = false;
    }, 2500);
  }, [selectedEvent]);

  return (
    <div className="relative w-full h-full min-h-[480px]">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      
      {/* 3D Scene Tactical HUD Overlays */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="flex items-center space-x-2 text-xs font-mono text-cyber-cyan uppercase tracking-wider bg-obsidian-900/80 px-3 py-1.5 rounded border border-cyber-cyan/30 backdrop-blur">
          <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
          <span>3D ORBITAL SENSOR GRID // REAL-TIME FUSION</span>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="text-[11px] font-mono text-slate-400 bg-obsidian-900/80 p-2.5 rounded border border-slate-700/50 backdrop-blur space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-red" />
            <span>CRITICAL (&gt;80 Risk)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-amber" />
            <span>HIGH (60-80 Risk)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-cyan" />
            <span>MEDIUM (35-60 Risk)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-ice" />
            <span>LOW (&lt;35 Risk)</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 pointer-events-none text-right font-mono text-[10px] text-slate-400">
        <div>PROJECTION: WGS84 CARTESIAN SPHERICAL</div>
        <div>FOV: 45 DEG // SENSOR REFRESH: LIVE</div>
      </div>
    </div>
  );
};
