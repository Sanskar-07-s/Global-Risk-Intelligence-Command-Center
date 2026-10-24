import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { NormalizedEvent } from '../types';
import { WORLD_CONTINENTS } from './worldLandmassData';
import { clusterEvents, EventCluster } from './clustering';
import { RotateCcw, ZoomIn, ZoomOut, Layers, Compass } from 'lucide-react';

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
  const hoveredClusterRef = useRef<EventCluster | null>(null);
  const [hoveredCluster, setHoveredCluster] = useState<EventCluster | null>(null);
  const [webGlAvailable, setWebGlAvailable] = useState<boolean>(true);
  const [activeLayer, setActiveLayer] = useState<'all' | 'seismic' | 'hazards' | 'weather'>('all');

  // Filter events based on active visual layer
  const filteredEvents = events.filter(e => {
    if (activeLayer === 'seismic') return e.category === 'earthquake';
    if (activeLayer === 'hazards') return e.domain === 'natural_hazard' && e.category !== 'earthquake';
    if (activeLayer === 'weather') return e.domain === 'weather_extreme';
    return true;
  });

  // Generate procedural, clean Earth texture using real continent polygon outlines (ZERO cyan dots!)
  const createEarthTexture = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4096;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // 1. Oceanic Deep Space Abyss Gradient
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 2048);
    oceanGrad.addColorStop(0, '#030713');
    oceanGrad.addColorStop(0.5, '#050E20');
    oceanGrad.addColorStop(1, '#030713');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 4096, 2048);

    // 2. Graticules (Subtle 30-degree orbital coordinates)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 4096; x += 341.3) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 2048);
      ctx.stroke();
    }
    for (let y = 0; y <= 2048; y += 170.6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(4096, y);
      ctx.stroke();
    }

    // 3. Draw Clean, Recognizable Continent Landmass Polygons (NO NOISY DOTS!)
    ctx.fillStyle = '#0B1728'; // Deep solid continent slate
    ctx.strokeStyle = 'rgba(114, 221, 251, 0.45)'; // Hairline cyan coastlines
    ctx.lineWidth = 1.8;

    WORLD_CONTINENTS.forEach(continent => {
      if (continent.points.length === 0) return;
      ctx.beginPath();

      const [firstLon, firstLat] = continent.points[0];
      const startX = ((firstLon + 180) / 360) * 4096;
      const startY = ((90 - firstLat) / 180) * 2048;
      ctx.moveTo(startX, startY);

      for (let i = 1; i < continent.points.length; i++) {
        const [lon, lat] = continent.points[i];
        const px = ((lon + 180) / 360) * 4096;
        const py = ((90 - lat) / 180) * 2048;
        ctx.lineTo(px, py);
      }

      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
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
    camera.position.set(0, 10, 250);
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

    // 4. Earth Sphere Mesh (Clean vector continent texture)
    const earthTexture = createEarthTexture();
    const globeGeo = new THREE.SphereGeometry(globeRadius, 64, 64);
    const globeMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.85,
      metalness: 0.1,
      transparent: true,
      opacity: 0.98
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // 5. Atmospheric Rayleigh-like Rim Glow (Custom Shader)
    const atmosGeo = new THREE.SphereGeometry(globeRadius * 1.06, 64, 64);
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
          float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
          gl_FragColor = vec4(0.447, 0.867, 0.984, 1.0) * intensity * 0.75;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // 6. Subtle, Restrained Starfield (Low Density)
    const starCount = 500;
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
      size: 1.1,
      transparent: true,
      opacity: 0.35
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 7. Lighting
    const ambientLight = new THREE.AmbientLight(0x05070B, 3.2);
    scene.add(ambientLight);

    const keySun = new THREE.DirectionalLight(0xF2F5FA, 2.4);
    keySun.position.set(180, 100, 160);
    scene.add(keySun);

    const rimScatter = new THREE.DirectionalLight(0x72DDFB, 1.1);
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
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      if (cameraRef.current) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, cameraRef.current);
        const intersects = raycaster.intersectObjects(markersRef.current);

        // Filter out back-facing markers (occluded by Earth)
        const visibleIntersects = intersects.filter(hit => {
          const worldPos = new THREE.Vector3();
          hit.object.getWorldPosition(worldPos);
          const camDir = cameraRef.current!.position.clone().sub(worldPos).normalize();
          return worldPos.clone().normalize().dot(camDir) > 0.15;
        });

        if (visibleIntersects.length > 0) {
          const hit = visibleIntersects[0].object as THREE.Mesh;
          const cluster = hit.userData as EventCluster;
          if (cluster && hoveredClusterRef.current?.id !== cluster.id) {
            hoveredClusterRef.current = cluster;
            setHoveredCluster(cluster);
            container.style.cursor = 'pointer';
          }
        } else if (hoveredClusterRef.current) {
          hoveredClusterRef.current = null;
          setHoveredCluster(null);
          container.style.cursor = isDragging ? 'grabbing' : 'grab';
        }
      }

      if (!isDragging || !globeGroupRef.current) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;

      globeGroupRef.current.rotation.y += dx * 0.0045;
      globeGroupRef.current.rotation.x += dy * 0.0045;
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

      const visibleIntersects = intersects.filter(hit => {
        const worldPos = new THREE.Vector3();
        hit.object.getWorldPosition(worldPos);
        const camDir = cameraRef.current!.position.clone().sub(worldPos).normalize();
        return worldPos.clone().normalize().dot(camDir) > 0.15;
      });

      if (visibleIntersects.length > 0) {
        const hit = visibleIntersects[0].object as THREE.Mesh;
        const cluster = hit.userData as EventCluster;
        if (cluster) {
          if (cluster.isCluster) {
            // Zoom closer to unpack cluster
            if (cameraRef.current && globeGroupRef.current) {
              const phi = (cluster.latitude * Math.PI) / 180;
              const theta = (-cluster.longitude * Math.PI) / 180;
              globeGroupRef.current.rotation.x = phi;
              globeGroupRef.current.rotation.y = theta - Math.PI / 2;
              cameraRef.current.position.z = Math.max(140, cameraRef.current.position.z - 40);
            }
          }
          // Select primary event to inspect details
          onSelectEvent(cluster.primaryEvent);
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

  // Update Spatial Event Markers with Clustering (Compact, Category-specific, No Giant White Discs)
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

    // Cluster geographically overlapping events
    const clusters = clusterEvents(filteredEvents, 3.5);

    clusters.forEach(cluster => {
      const lat = cluster.latitude;
      const lon = cluster.longitude;

      // Coordinate to 3D Cartesian
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const r = globeRadius * 1.008;

      const x = -(r * Math.sin(phi) * Math.cos(theta));
      const z = (r * Math.sin(phi) * Math.sin(theta));
      const y = (r * Math.cos(phi));

      // Semantic Color Palette
      let colorHex = 0x8D9AAA; // Neutral slate
      if (cluster.highestSeverity === 'critical') colorHex = 0xFF626B; // Critical Red
      else if (cluster.highestSeverity === 'high') colorHex = 0xFFBD69; // Signal Amber
      else if (cluster.highestSeverity === 'medium') colorHex = 0x72DDFB; // Intelligence Cyan

      const isSelected = selectedEvent && cluster.events.some(e => e.id === selectedEvent.id);

      // Create Category-Specific Compact Geometry
      let pinGeo: THREE.BufferGeometry;
      const baseRadius = isSelected ? 2.2 : (cluster.isCluster ? 2.0 : 1.4);

      if (cluster.primaryEvent.category === 'earthquake') {
        // Seismic diamond (octahedron)
        pinGeo = new THREE.OctahedronGeometry(baseRadius, 0);
      } else if (cluster.dominantDomain === 'weather_extreme') {
        // Atmospheric vortex ring
        pinGeo = new THREE.TorusGeometry(baseRadius, 0.35, 8, 16);
      } else {
        // Compact sphere beacon
        pinGeo = new THREE.SphereGeometry(baseRadius, 12, 12);
      }

      const pinMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        depthTest: true,
        depthWrite: false
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.set(x, y, z);
      pinMesh.userData = cluster;

      // Look toward Earth radius for perpendicular orientation
      pinMesh.lookAt(new THREE.Vector3(x * 2, y * 2, z * 2));

      // Add a single crisp hairline halo ring
      const haloGeo = new THREE.RingGeometry(baseRadius * 1.15, baseRadius * 1.5, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isSelected ? 0.8 : 0.35,
        depthTest: true,
        depthWrite: false
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      pinMesh.add(haloMesh);

      globeGroup.add(pinMesh);
      markersRef.current.push(pinMesh);
    });
  }, [filteredEvents, selectedEvent]);

  // Selected Event Orientation (Only when lat/lon are valid coordinates)
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
    }, 2000);
  }, [selectedEvent]);

  const handleResetCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 10, 250);
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
          Hardware WebGL acceleration is disabled or unsupported. Please use the intelligence feed below.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden select-none">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating In-Scene Hover Tooltip */}
      {hoveredCluster && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-150 z-30">
          <div className="command-surface-elevated px-3 py-1.5 rounded-xl flex items-center space-x-2 text-xs font-mono shadow-subtle-surface">
            <span className={`w-2 h-2 rounded-full ${
              hoveredCluster.highestSeverity === 'critical' ? 'bg-signal-red' :
              hoveredCluster.highestSeverity === 'high' ? 'bg-signal-amber' : 'bg-signal-cyan'
            }`} />
            <span className="text-content-primary font-medium">
              {hoveredCluster.isCluster 
                ? `${hoveredCluster.clusterCount} Incidents Clustered (${hoveredCluster.primaryEvent.region || 'Regional Sector'})`
                : hoveredCluster.primaryEvent.title}
            </span>
            <span className="text-content-muted">|</span>
            <span className="text-content-secondary font-mono">RISK: {hoveredCluster.highestRiskScore}</span>
          </div>
        </div>
      )}

      {/* Layer Control Pill & Zoom Actions */}
      <div className="absolute bottom-24 right-6 flex items-center space-x-2 z-30">
        <div className="command-surface-elevated p-1 rounded-xl flex items-center space-x-1 shadow-subtle-surface">
          <button
            onClick={() => setActiveLayer('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
              activeLayer === 'all' ? 'bg-signal-cyan/20 text-signal-cyan font-semibold' : 'text-content-muted hover:text-content-primary'
            }`}
          >
            All Layers
          </button>
          <button
            onClick={() => setActiveLayer('seismic')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
              activeLayer === 'seismic' ? 'bg-signal-cyan/20 text-signal-cyan font-semibold' : 'text-content-muted hover:text-content-primary'
            }`}
          >
            Seismic (USGS)
          </button>
          <button
            onClick={() => setActiveLayer('hazards')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
              activeLayer === 'hazards' ? 'bg-signal-cyan/20 text-signal-cyan font-semibold' : 'text-content-muted hover:text-content-primary'
            }`}
          >
            Hazards (EONET)
          </button>
          <button
            onClick={() => setActiveLayer('weather')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
              activeLayer === 'weather' ? 'bg-signal-cyan/20 text-signal-cyan font-semibold' : 'text-content-muted hover:text-content-primary'
            }`}
          >
            Corridors (Weather)
          </button>
        </div>

        {/* Zoom & Reset Controls */}
        <div className="command-surface-elevated p-1 rounded-xl flex items-center space-x-1 shadow-subtle-surface">
          <button
            onClick={() => handleZoom(-30)}
            className="p-1.5 rounded-lg hover:bg-surface-subtle text-content-secondary hover:text-content-primary transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(30)}
            className="p-1.5 rounded-lg hover:bg-surface-subtle text-content-secondary hover:text-content-primary transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-surface-border mx-0.5" />
          <button
            onClick={handleResetCamera}
            className="p-1.5 rounded-lg hover:bg-surface-subtle text-content-secondary hover:text-signal-cyan transition-colors"
            title="Reset Planetary View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
