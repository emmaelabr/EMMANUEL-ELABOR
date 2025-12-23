
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ExperimentState } from '../types';
import { Play, Pause, RotateCcw, Settings2 } from 'lucide-react';

interface LabSceneProps {
  experiment: ExperimentState | null;
  onUpdateParameters: (params: Record<string, number>) => void;
  onDataUpdate: (point: { x: number; y: number }) => void;
}

const LabScene: React.FC<LabSceneProps> = ({ experiment, onUpdateParameters, onDataUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // Animation and simulation references
  const apparatusGroupRef = useRef<THREE.Group | null>(null);
  const frameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene Setup - Pure Black
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(5, 5, 10);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Subtle Grid Floor
    const grid = new THREE.GridHelper(20, 20, 0x1e293b, 0x1e293b);
    scene.add(grid);

    // Apparatus Group
    const group = new THREE.Group();
    scene.add(group);
    apparatusGroupRef.current = group;

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
      if (rendererRef.current) {
        containerRef.current?.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Handle Experiment Visualization
  useEffect(() => {
    if (!apparatusGroupRef.current || !experiment) return;

    // Clear previous apparatus
    while (apparatusGroupRef.current.children.length > 0) {
      const child = apparatusGroupRef.current.children[0];
      apparatusGroupRef.current.remove(child);
    }

    // Add Apparatus Based on Type
    if (experiment.type === 'physics') {
      if (experiment.name.toLowerCase().includes('pendulum')) {
        const pivot = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        pivot.position.y = 8;
        apparatusGroupRef.current.add(pivot);

        const bob = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
        bob.name = 'pendulum_bob';
        apparatusGroupRef.current.add(bob);

        const string = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 8, 0), new THREE.Vector3(0, 0, 0)]),
          new THREE.LineBasicMaterial({ color: 0xffffff })
        );
        string.name = 'pendulum_string';
        apparatusGroupRef.current.add(string);
      } else if (experiment.name.toLowerCase().includes('projectile')) {
        const launcher = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        launcher.rotation.z = Math.PI / 4;
        launcher.position.set(-5, 1, 0);
        launcher.name = 'launcher';
        apparatusGroupRef.current.add(launcher);

        const projectile = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
        projectile.name = 'projectile';
        projectile.position.set(-5, 1, 0);
        apparatusGroupRef.current.add(projectile);
      }
    } else if (experiment.type === 'chemistry') {
      const beaker = new THREE.Group();
      const glass = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 3, 32, 1, true),
        new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, transmission: 0.9 })
      );
      beaker.add(glass);

      const bottom = new THREE.Mesh(new THREE.CircleGeometry(1.5, 32), new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
      bottom.rotation.x = Math.PI / 2;
      bottom.position.y = -1.5;
      beaker.add(bottom);

      const liquid = new THREE.Mesh(
        new THREE.CylinderGeometry(1.45, 1.45, 2, 32),
        new THREE.MeshStandardMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.6 })
      );
      liquid.position.y = -0.5;
      liquid.name = 'liquid';
      beaker.add(liquid);

      apparatusGroupRef.current.add(beaker);
    }
  }, [experiment]);

  // Simulation Loop
  useEffect(() => {
    if (!isRunning || !experiment) return;

    let currentT = 0;

    const update = () => {
      if (!isRunning) return;
      currentT += 0.016; 
      setTime(currentT);

      if (experiment.name.toLowerCase().includes('pendulum')) {
        const L = experiment.parameters.length || 5;
        const g = experiment.parameters.gravity || 9.81;
        const angle = 0.5 * Math.cos(Math.sqrt(g / L) * currentT);
        
        const bob = apparatusGroupRef.current?.getObjectByName('pendulum_bob');
        const string = apparatusGroupRef.current?.getObjectByName('pendulum_string') as THREE.Line;
        
        if (bob && string) {
          const x = L * Math.sin(angle);
          const y = 8 - L * Math.cos(angle);
          bob.position.set(x, y, 0);
          string.geometry.setFromPoints([new THREE.Vector3(0, 8, 0), new THREE.Vector3(x, y, 0)]);
          onDataUpdate({ x: currentT, y: angle });
        }
      } else if (experiment.name.toLowerCase().includes('projectile')) {
        const v0 = experiment.parameters.velocity || 10;
        const angle = (experiment.parameters.angle || 45) * (Math.PI / 180);
        const g = 9.81;

        const x = v0 * Math.cos(angle) * currentT - 5;
        const y = v0 * Math.sin(angle) * currentT - 0.5 * g * currentT * currentT + 1;

        const projectile = apparatusGroupRef.current?.getObjectByName('projectile');
        if (projectile) {
          if (y >= 0) {
            projectile.position.set(x, y, 0);
            onDataUpdate({ x: currentT, y: y });
          } else {
            setIsRunning(false);
          }
        }
      } else if (experiment.type === 'chemistry') {
        const liquid = apparatusGroupRef.current?.getObjectByName('liquid');
        if (liquid) {
          const ph = 7 + 7 * Math.sin(currentT * 0.5);
          const color = new THREE.Color().setHSL(ph / 14, 1, 0.5);
          (liquid.material as THREE.MeshStandardMaterial).color = color;
          onDataUpdate({ x: currentT, y: ph });
        }
      }

      frameIdRef.current = requestAnimationFrame(update);
    };

    update();
    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    };
  }, [isRunning, experiment, onDataUpdate]);

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    if (experiment?.name.toLowerCase().includes('projectile')) {
      const projectile = apparatusGroupRef.current?.getObjectByName('projectile');
      if (projectile) projectile.position.set(-5, 1, 0);
    }
  };

  return (
    <div className="flex-1 relative bg-black" ref={containerRef}>
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl px-8 py-3 rounded-2xl border border-white/10 flex items-center gap-8 z-10 shadow-2xl shadow-blue-500/5">
        <button 
          onClick={() => setIsRunning(!isRunning)}
          className={`p-3 rounded-xl transition-all ${isRunning ? 'text-red-400 bg-red-500/10' : 'text-blue-400 bg-blue-500/10 hover:scale-105'}`}
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button onClick={handleReset} className="p-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <RotateCcw size={24} />
        </button>
        <div className="w-[1px] h-10 bg-white/10 mx-2" />
        <div className="text-sm font-mono tracking-widest text-slate-500">
          T: <span className="text-white font-bold">{time.toFixed(2)}s</span>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`p-3 rounded-xl transition-all ${showSettings ? 'text-blue-400 bg-blue-500/20' : 'text-slate-400 hover:text-white'}`}
        >
          <Settings2 size={24} />
        </button>
      </div>

      {showSettings && experiment && (
        <div className="absolute top-24 right-8 bg-black/90 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 w-72 z-10 shadow-2xl animate-in fade-in slide-in-from-right-4">
          <h3 className="text-[10px] font-black text-blue-500 mb-6 flex items-center gap-2 uppercase tracking-[0.3em]">
            <Settings2 size={14} /> Control Panel
          </h3>
          <div className="space-y-6">
            {Object.entries(experiment.parameters).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between text-[9px] text-slate-500 uppercase tracking-widest font-black mb-2">
                  <span>{key}</span>
                  <span className="text-white font-mono">{value}</span>
                </div>
                <input 
                  type="range" 
                  min={1} 
                  max={20} 
                  step={0.1}
                  value={value}
                  onChange={(e) => onUpdateParameters({ [key]: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LabScene;
