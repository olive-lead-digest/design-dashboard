'use client';

import * as THREE from 'three';
import { useEffect, useRef, useState } from 'react';
import { Box, MousePointer2 } from 'lucide-react';
import type { Box3D } from '@/lib/floorplan';

export interface Model3D {
  totalW: number;
  totalD: number;
  wallHeight: number;
  boxes: Box3D[];
}

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * Three.js 3D floor plan viewer.
 * Manual pointer-drag orbit (spherical coords) + wheel zoom — no OrbitControls import.
 * Auto-rotates gently until the first interaction.
 */
export default function FloorPlan3DViewer({ model }: { model: Model3D }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const wireframeRef = useRef(false);
  const [wireframe, setWireframe] = useState(false);
  const [webglOk, setWebglOk] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglOk(detectWebGL());
  }, []);

  useEffect(() => {
    if (!webglOk) return;
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const center = new THREE.Vector3(model.totalW / 2, model.wallHeight / 2, model.totalD / 2);
    const span = Math.max(model.totalW, model.totalD);
    const orbit = { radius: span * 1.55, theta: Math.PI / 4, phi: Math.PI / 3.1 };
    let autoRotate = true;

    const applyCamera = () => {
      camera.position.set(
        center.x + orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta),
        center.y + orbit.radius * Math.cos(orbit.phi),
        center.z + orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta),
      );
      camera.lookAt(center);
    };

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(model.totalW, model.wallHeight * 6, model.totalD * 0.8);
    scene.add(dir);

    const disposables: { dispose(): void }[] = [];

    // Floor plane
    const floorGeo = new THREE.PlaneGeometry(model.totalW * 1.45, model.totalD * 1.45);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.95, metalness: 0 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(center.x, -0.06, center.z);
    scene.add(floor);
    disposables.push(floorGeo, floorMat);

    // Subtle grid
    const grid = new THREE.GridHelper(span * 1.45, 24, 0xcbd5e1, 0xe7ebf0);
    grid.position.set(center.x, 0, center.z);
    scene.add(grid);

    // Per-room extruded translucent boxes + wall edge lines
    meshesRef.current = [];
    for (const b of model.boxes) {
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(b.color),
        transparent: true,
        opacity: 0.85,
        roughness: 0.6,
        metalness: 0.05,
        wireframe: wireframeRef.current,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x + b.w / 2, b.y + b.h / 2, b.z + b.d / 2);
      mesh.name = b.name;
      scene.add(mesh);
      meshesRef.current.push(mesh);

      const edgeGeo = new THREE.EdgesGeometry(geo);
      const edgeMat = new THREE.LineBasicMaterial({ color: 0x0f172a });
      const edges = new THREE.LineSegments(edgeGeo, edgeMat);
      edges.position.copy(mesh.position);
      scene.add(edges);

      disposables.push(geo, mat, edgeGeo, edgeMat);
    }

    // Manual orbit + zoom
    const el = renderer.domElement;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onPointerDown = (e: PointerEvent) => {
      autoRotate = false;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* capture unsupported */
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      orbit.theta -= (e.clientX - lastX) * 0.005;
      orbit.phi = Math.min(Math.max(orbit.phi - (e.clientY - lastY) * 0.005, 0.18), Math.PI / 2 - 0.04);
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerUp = (e: PointerEvent) => {
      dragging = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      autoRotate = false;
      orbit.radius = Math.min(Math.max(orbit.radius * (1 + e.deltaY * 0.001), span * 0.55), span * 4);
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointerleave', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: false });

    // Render loop — soft auto-rotate until first interaction
    let raf = 0;
    const loop = () => {
      if (autoRotate) orbit.theta += 0.0032;
      applyCamera();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    applyCamera();
    loop();

    // Container resize handling
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointerleave', onPointerUp);
      el.removeEventListener('wheel', onWheel);
      disposables.forEach((d) => d.dispose());
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
      renderer.dispose();
      meshesRef.current = [];
      if (el.parentElement === container) container.removeChild(el);
    };
  }, [model, webglOk]);

  // Wireframe toggle — applied to live materials without a scene rebuild.
  useEffect(() => {
    wireframeRef.current = wireframe;
    for (const mesh of meshesRef.current) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.wireframe = wireframe;
    }
  }, [wireframe]);

  if (webglOk === false) {
    return (
      <div className="h-[420px] rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 text-center px-6">
        <Box size={28} className="text-gray-300" aria-hidden />
        <p className="text-sm font-semibold text-gray-500">3D preview unavailable</p>
        <p className="text-xs text-gray-400 max-w-xs">
          WebGL is not supported in this browser. Use the 2D view or Dimensions tab instead.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
          <MousePointer2 size={12} aria-hidden /> Drag to orbit · Scroll to zoom · Auto-rotates until you interact
        </p>
        <button
          onClick={() => setWireframe((v) => !v)}
          aria-pressed={wireframe}
          className={`btn-ghost border !py-2 text-xs ${
            wireframe ? 'border-secondary/50 bg-secondary/10 text-secondary' : 'border-gray-200'
          }`}
        >
          <Box size={14} /> Wireframe
        </button>
      </div>
      <div
        ref={containerRef}
        className="h-[420px] sm:h-[500px] rounded-xl border border-gray-200 overflow-hidden touch-none cursor-grab active:cursor-grabbing"
        role="application"
        aria-label="3D floor plan model — drag to orbit, scroll to zoom"
      />
    </div>
  );
}
