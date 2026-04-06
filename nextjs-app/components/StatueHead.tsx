"use client";

import { useEffect, useRef, useState } from "react";
import type * as THREE from "three";

export default function StatueHead() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let animId: number;
    let cleanupFn: (() => void) | undefined;

    (async () => {
      try {
        const [ThreeMod, JZMod, { OBJLoader }] = await Promise.all([
          import("three"),
          import("jszip"),
          import("three/examples/jsm/loaders/OBJLoader.js"),
        ]);
        const THREE = ThreeMod as typeof import("three");
        const JSZip = JZMod.default;

        // Fetch and extract zip
        const res = await fetch(
          "https://rpczwepbpuayxfkxphdm.supabase.co/storage/v1/object/public/portfoil/head-of-aphrodite.zip"
        );
        const buf = await res.arrayBuffer();
        const zip = await JSZip.loadAsync(buf);

        let objText = "";
        for (const name of Object.keys(zip.files)) {
          const file = zip.files[name];
          if (!file.dir && name.endsWith(".obj") && !name.includes("__MACOSX")) {
            objText = await file.async("text");
            break;
          }
        }
        if (!objText) return;

        // Scene
        const W = mount.clientWidth || 360;
        const H = mount.clientHeight || 360;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
        camera.position.z = 4;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mount.appendChild(renderer.domElement);

        // Lighting — warm key light + red rim for brand coherence
        scene.add(new THREE.AmbientLight(0xffffff, 0.45));

        const key = new THREE.DirectionalLight(0xfff5e0, 2.2);
        key.position.set(2, 3, 3);
        scene.add(key);

        const rim = new THREE.DirectionalLight(0xff1418, 0.5);
        rim.position.set(-3, -1, -2);
        scene.add(rim);

        const fill = new THREE.DirectionalLight(0xd0e8ff, 0.4);
        fill.position.set(-2, 2, 1);
        scene.add(fill);

        // Load OBJ
        const loader = new OBJLoader();
        const obj = loader.parse(objText);

        const mat = new THREE.MeshStandardMaterial({
          color: 0xede8e1,
          roughness: 0.6,
          metalness: 0.05,
        });

        obj.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh) mesh.material = mat;
        });

        // Center and scale to fit
        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        obj.position.sub(center);
        obj.scale.setScalar(2.6 / Math.max(size.x, size.y, size.z));
        scene.add(obj);

        setLoaded(true);

        // Cursor tracking
        let targetY = 0, targetX = 0, curY = 0, curX = 0;

        const onMove = (e: MouseEvent) => {
          targetY = ((e.clientX / window.innerWidth) * 2 - 1) * 0.42;
          targetX = -((e.clientY / window.innerHeight) * 2 - 1) * 0.28;
        };
        window.addEventListener("mousemove", onMove);

        const animate = () => {
          animId = requestAnimationFrame(animate);
          curY += (targetY - curY) * 0.055;
          curX += (targetX - curX) * 0.055;
          obj.rotation.y = curY;
          obj.rotation.x = curX;
          renderer.render(scene, camera);
        };
        animate();

        cleanupFn = () => {
          window.removeEventListener("mousemove", onMove);
          cancelAnimationFrame(animId);
          renderer.dispose();
          if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
        };
      } catch (e) {
        console.error("StatueHead error:", e);
      }
    })();

    return () => cleanupFn?.();
  }, []);

  return (
    <div
      ref={mountRef}
      className="statue-head"
      style={{ opacity: loaded ? 1 : 0, transition: "opacity 1.2s ease" }}
    />
  );
}
