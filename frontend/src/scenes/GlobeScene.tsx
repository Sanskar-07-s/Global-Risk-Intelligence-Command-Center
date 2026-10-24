import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { NormalizedEvent } from '../types';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Activity, 
  Flame, 
  CloudRain, 
  Globe2,
  Compass,
  AlertTriangle,
  MapPin,
  Check
} from 'lucide-react';
import { clusterEvents, EventCluster } from './clustering';

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
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const cloudMeshRef = useRef<THREE.Mesh | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const markersRef = useRef<THREE.Mesh[]>([]);
  const isInteractingRef = useRef(false);

  const [activeLayer, setActiveLayer] = useState<'all' | 'seismic' | 'hazards' | 'weather'>('all');
  const [hoveredCluster, setHoveredCluster] = useState<EventCluster | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [webGlAvailable, setWebGlAvailable] = useState<boolean>(true);
  const [textureLoaded, setTextureLoaded] = useState<boolean>(false);

  // Filter events based on active layer
  const filteredEvents = events.filter(e => {
    if (activeLayer === 'seismic') return e.category === 'earthquake' || e.domain === 'natural_hazard';
    if (activeLayer === 'hazards') return e.domain === 'natural_hazard';
    if (activeLayer === 'weather') return e.domain === 'weather_extreme';
    return true;
  });

  // Main Three.js Scene Setup
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

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1200);
    camera.position.set(0, 15, 245);
    cameraRef.current = camera;

    // 2. High-Fidelity Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Globe Container Group
    const globeGroup = new THREE.Group();
    // Tilt slightly on Earth's axial inclination (approx 23.4 degrees)
    globeGroup.rotation.x = 0.22;
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    const globeRadius = 78;

    // 4. Texture Loading: NASA Blue Marble Public Domain Equirectangular Assets
    const textureLoader = new THREE.TextureLoader();

    // Earth Day Texture (High Quality NASA Satellite Imagery)
    const dayMap = textureLoader.load(
      '/assets/earth/earth_day.jpg',
      () => setTextureLoaded(true),
      undefined,
      (err) => console.warn('Earth Day texture notice, fallback active:', err)
    );
    dayMap.colorSpace = THREE.SRGBColorSpace;
    dayMap.wrapS = THREE.ClampToEdgeWrapping;
    dayMap.wrapT = THREE.ClampToEdgeWrapping;

    // Earth Normal / Bump Map (Mountain Ranges & Continental Relief)
    const normalMap = textureLoader.load('/assets/earth/earth_normal.jpg');
    normalMap.wrapS = THREE.ClampToEdgeWrapping;
    normalMap.wrapT = THREE.ClampToEdgeWrapping;

    // Earth Specular Mask (Water reflectivity vs matte land)
    const specularMap = textureLoader.load('/assets/earth/earth_specular.jpg');
    specularMap.wrapS = THREE.ClampToEdgeWrapping;
    specularMap.wrapT = THREE.ClampToEdgeWrapping;

    // Earth Night Lights (Soft city lights on shadow hemisphere)
    const nightLightsMap = textureLoader.load('/assets/earth/earth_lights.png');
    nightLightsMap.colorSpace = THREE.SRGBColorSpace;
    nightLightsMap.wrapS = THREE.ClampToEdgeWrapping;
    nightLightsMap.wrapT = THREE.ClampToEdgeWrapping;

    // Earth Cloud Map (Translucent atmospheric moisture layer)
    const cloudsMap = textureLoader.load('/assets/earth/earth_clouds.png');
    cloudsMap.wrapS = THREE.ClampToEdgeWrapping;
    cloudsMap.wrapT = THREE.ClampToEdgeWrapping;

    // 5. Photorealistic Planetary Surface Mesh (Standard PBR)
    const globeGeo = new THREE.SphereGeometry(globeRadius, 64, 64);
    const globeMat = new THREE.MeshStandardMaterial({
      map: dayMap,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: specularMap,
      roughness: 0.72,
      metalness: 0.04,
      emissiveMap: nightLightsMap,
      emissive: new THREE.Color(0xfff1cc),
      emissiveIntensity: 0.38
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // 6. Translucent Cloud Layer (Concentric Sphere with Parallax Drift)
    const cloudGeo = new THREE.SphereGeometry(globeRadius * 1.011, 64, 64);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudsMap,
      transparent: true,
      opacity: 0.44,
      blending: THREE.NormalBlending,
      depthWrite: false,
      roughness: 0.9,
      metalness: 0.0
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    globeGroup.add(cloudMesh);
    cloudMeshRef.current = cloudMesh;

    // 7. Atmospheric Limb Scattering (Thin Blue Rayleigh Halo Shader)
    const atmosGeo = new THREE.SphereGeometry(globeRadius * 1.026, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-mvPos.xyz);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          float rim = 1.0 - max(dot(vNormal, vViewDir), 0.0);
          float intensity = pow(rim, 3.6);
          // Realistic Rayleigh blue scattering (approx ~450nm)
          vec3 atmosphericBlue = vec3(0.28, 0.58, 0.98);
          gl_FragColor = vec4(atmosphericBlue, intensity * 0.82);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    scene.add(atmosMesh);

    // 8. Subtle, Restrained Outer Space Starfield
    const starCount = 650;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 1200;
      starPositions[i + 1] = (Math.random() - 0.5) * 1200;
      starPositions[i + 2] = (Math.random() - 0.5) * 1200;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x94A3B8,
      size: 1.1,
      transparent: true,
      opacity: 0.38
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 9. Physically Balanced Sunlight & Space Lighting
    // Directional Sunlight (Sun position angled across daytime hemisphere)
    const sunLight = new THREE.DirectionalLight(0xFFFFFF, 2.7);
    sunLight.position.set(190, 60, 150);
    scene.add(sunLight);

    // Restrained Dark Space Ambient (Permits reading city lights and geographic silhouettes)
    const ambientLight = new THREE.AmbientLight(0x0A101C, 0.42);
    scene.add(ambientLight);

    // Soft Secondary Rim Light (Simulates cosmic bounce)
    const spaceRim = new THREE.DirectionalLight(0x386B99, 0.55);
    spaceRim.position.set(-180, -60, -140);
    scene.add(spaceRim);

    // 10. Interaction & Rotation Controls
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    const idleRotationSpeed = 0.00065;

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

      // Raycast markers
      if (cameraRef.current) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, cameraRef.current);
        const intersects = raycaster.intersectObjects(markersRef.current);

        // Filter out back-facing occluded markers
        const visibleIntersects = intersects.filter(hit => {
          const worldPos = new THREE.Vector3();
          hit.object.getWorldPosition(worldPos);
          const camDir = cameraRef.current!.position.clone().sub(worldPos).normalize();
          return worldPos.clone().normalize().dot(camDir) > 0.12;
        });

        if (visibleIntersects.length > 0) {
          const hit = visibleIntersects[0].object as THREE.Mesh;
          const cluster = hit.userData as EventCluster;
          if (cluster) {
            setHoveredCluster(cluster);
            setTooltipPos({ x: e.clientX, y: e.clientY });
            container.style.cursor = 'pointer';
          }
        } else {
          setHoveredCluster(null);
          setTooltipPos(null);
          container.style.cursor = isDragging ? 'grabbing' : 'grab';
        }
      }

      if (!isDragging) return;
      const deltaX = e.clientX - prevMouse.x;
      const deltaY = e.clientY - prevMouse.y;

      globeGroup.rotation.y += deltaX * 0.005;
      globeGroup.rotation.x = Math.max(-1.1, Math.min(1.1, globeGroup.rotation.x + deltaY * 0.005));

      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
      setTimeout(() => {
        isInteractingRef.current = false;
      }, 1800);
      container.style.cursor = 'grab';
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(120, Math.min(360, camera.position.z + e.deltaY * 0.18));
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(markersRef.current);

      const visibleIntersects = intersects.filter(hit => {
        const worldPos = new THREE.Vector3();
        hit.object.getWorldPosition(worldPos);
        const camDir = camera.position.clone().sub(worldPos).normalize();
        return worldPos.clone().normalize().dot(camDir) > 0.12;
      });

      if (visibleIntersects.length > 0) {
        const hit = visibleIntersects[0].object as THREE.Mesh;
        const cluster = hit.userData as EventCluster;
        if (cluster && cluster.primaryEvent) {
          onSelectEvent(cluster.primaryEvent);
        }
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('click', onClick);

    // 11. Responsive Resize Observer
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    // 12. Animation Render Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Subtle planetary rotation when user is idle
      if (!isDragging && !isInteractingRef.current) {
        globeGroup.rotation.y += idleRotationSpeed;
      }

      // Dynamic independent cloud drift
      if (cloudMeshRef.current) {
        cloudMeshRef.current.rotation.y += idleRotationSpeed * 1.25;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup resources upon unmount
    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);

      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      globeGeo.dispose();
      globeMat.dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
      starGeo.dispose();
      starMat.dispose();
    };
  }, []);

  // Event Markers Synchronization
  useEffect(() => {
    if (!globeGroupRef.current) return;
    const globeGroup = globeGroupRef.current;

    // Dispose old markers
    markersRef.current.forEach(mesh => {
      globeGroup.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else if (mesh.material) {
        mesh.material.dispose();
      }
    });
    markersRef.current = [];

    const globeRadius = 78;

    // Cluster geographically overlapping events (< 3.5 degrees)
    const clusters = clusterEvents(filteredEvents, 3.5);

    clusters.forEach(cluster => {
      const lat = cluster.latitude;
      const lon = cluster.longitude;

      // Coordinate to 3D Cartesian coordinates (aligned with equirectangular map UV standard)
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      // Place marker just outside the translucent cloud sphere (r * 1.018)
      const r = globeRadius * 1.018;

      const x = -(r * Math.sin(phi) * Math.cos(theta));
      const z = (r * Math.sin(phi) * Math.sin(theta));
      const y = (r * Math.cos(phi));

      // Semantic Color Palette
      let colorHex = 0x8D9AAA; // Neutral slate
      if (cluster.highestSeverity === 'critical') colorHex = 0xFF4D4D; // Vivid Critical Red
      else if (cluster.highestSeverity === 'high') colorHex = 0xF59E0B; // Signal Amber
      else if (cluster.highestSeverity === 'medium') colorHex = 0x06B6D4; // Cyan

      const isSelected = selectedEvent && cluster.events.some(e => e.id === selectedEvent.id);

      // Category-Specific Compact 3D Geometry
      let pinGeo: THREE.BufferGeometry;
      const baseRadius = isSelected ? 2.1 : (cluster.isCluster ? 1.8 : 1.3);

      if (cluster.primaryEvent.category === 'earthquake') {
        // Seismic octahedron diamond
        pinGeo = new THREE.OctahedronGeometry(baseRadius, 0);
      } else if (cluster.dominantDomain === 'weather_extreme') {
        // Atmospheric vortex ring
        pinGeo = new THREE.TorusGeometry(baseRadius, 0.35, 8, 16);
      } else {
        // Compact beacon sphere
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

      // Orient perpendicular to the surface of the Earth
      pinMesh.lookAt(new THREE.Vector3(x * 2, y * 2, z * 2));

      // Crisp hairline halo ring
      const haloGeo = new THREE.RingGeometry(baseRadius * 1.15, baseRadius * 1.45, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isSelected ? 0.85 : 0.32,
        depthTest: true,
        depthWrite: false
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      pinMesh.add(haloMesh);

      globeGroup.add(pinMesh);
      markersRef.current.push(pinMesh);
    });
  }, [filteredEvents, selectedEvent]);

  // Selected Event Orientation (Only when lat/lon coordinates are valid)
  useEffect(() => {
    if (!selectedEvent || selectedEvent.latitude === null || selectedEvent.latitude === undefined || 
        selectedEvent.longitude === null || selectedEvent.longitude === undefined) return;
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
      cameraRef.current.position.set(0, 15, 245);
    }
    if (globeGroupRef.current) {
      globeGroupRef.current.rotation.set(0.22, 0, 0);
    }
    if (onResetView) onResetView();
  };

  const handleZoom = (delta: number) => {
    if (!cameraRef.current) return;
    cameraRef.current.position.z = Math.max(120, Math.min(360, cameraRef.current.position.z + delta));
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

      {/* Layer Filter Controls (Compact Top Left Dock) */}
      <div className="absolute top-20 left-24 z-30 flex items-center space-x-1.5 command-surface-elevated p-1 rounded-xl shadow-subtle-surface">
        <button
          onClick={() => setActiveLayer('all')}
          className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
            activeLayer === 'all' ? 'bg-signal-cyan/20 text-signal-cyan font-medium' : 'text-content-secondary hover:text-content-primary'
          }`}
        >
          All Layers
        </button>
        <button
          onClick={() => setActiveLayer('seismic')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
            activeLayer === 'seismic' ? 'bg-signal-cyan/20 text-signal-cyan font-medium' : 'text-content-secondary hover:text-content-primary'
          }`}
        >
          <Activity className="w-3 h-3 text-signal-cyan" />
          <span>Seismic</span>
        </button>
        <button
          onClick={() => setActiveLayer('hazards')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
            activeLayer === 'hazards' ? 'bg-signal-red/20 text-signal-red font-medium' : 'text-content-secondary hover:text-content-primary'
          }`}
        >
          <Flame className="w-3 h-3 text-signal-red" />
          <span>Hazards</span>
        </button>
        <button
          onClick={() => setActiveLayer('weather')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
            activeLayer === 'weather' ? 'bg-signal-amber/20 text-signal-amber font-medium' : 'text-content-secondary hover:text-content-primary'
          }`}
        >
          <CloudRain className="w-3 h-3 text-signal-amber" />
          <span>Weather</span>
        </button>
      </div>

      {/* Camera & Navigation Controls (Bottom Right Floating Dock) */}
      <div className="absolute bottom-28 right-6 z-30 flex flex-col space-y-1.5">
        <button
          onClick={() => handleZoom(-30)}
          className="p-2 rounded-xl command-surface-elevated text-content-secondary hover:text-signal-cyan transition-colors"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(30)}
          className="p-2 rounded-xl command-surface-elevated text-content-secondary hover:text-signal-cyan transition-colors"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetCamera}
          className="p-2 rounded-xl command-surface-elevated text-content-secondary hover:text-signal-cyan transition-colors"
          title="Reset Earth Camera Orientation"
          aria-label="Reset Earth Camera Orientation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Hover Tooltip Surface */}
      {hoveredCluster && tooltipPos && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full mb-3"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <div className="command-surface-elevated p-2.5 rounded-xl border border-surface-border text-xs font-mono shadow-subtle-surface space-y-1 min-w-[190px] max-w-xs animate-fade-in">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                hoveredCluster.highestSeverity === 'critical' ? 'bg-signal-red/20 text-signal-red' :
                hoveredCluster.highestSeverity === 'high' ? 'bg-signal-amber/20 text-signal-amber' : 'bg-signal-cyan/20 text-signal-cyan'
              }`}>
                {hoveredCluster.highestSeverity}
              </span>
              <span className="text-[10px] text-content-muted">
                {hoveredCluster.isCluster ? `${hoveredCluster.clusterCount} Events Clustered` : hoveredCluster.primaryEvent.category?.toUpperCase()}
              </span>
            </div>
            <div className="font-semibold text-content-primary line-clamp-2">
              {hoveredCluster.primaryEvent.title}
            </div>
            <div className="flex items-center justify-between text-[10px] text-content-muted border-t border-surface-border/50 pt-1 mt-1">
              <span className="flex items-center space-x-1 truncate max-w-[120px]">
                <MapPin className="w-3 h-3 text-signal-cyan flex-shrink-0" />
                <span className="truncate">{hoveredCluster.primaryEvent.region || 'Coordinates'}</span>
              </span>
              <span className="font-bold text-content-primary">
                Risk: {hoveredCluster.primaryEvent.calculated_risk_score}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
