"use client";

import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import { Group, Object3D } from 'three';
import { gltfManager, ModelInfo } from '@/lib/gltf-manager';

interface AROverlayProps {
  detectedCard: string | null;
  isVisible: boolean;
  onModelLoaded?: (model: Object3D) => void;
}

interface ModelRendererProps {
  modelInfo: ModelInfo;
  onModelLoaded?: (model: Object3D) => void;
}

function ModelRenderer({ modelInfo, onModelLoaded }: ModelRendererProps) {
  const groupRef = useRef<Group>(null);
  
  // Use a more robust GLTF loading approach
  const gltf = useGLTF(modelInfo.path, true); // true for draco support
  
  useEffect(() => {
    if (gltf?.scene && onModelLoaded) {
      // Clone the scene to avoid modifying the original
      const clonedScene = gltf.scene.clone();
      onModelLoaded(clonedScene);
    }
  }, [gltf, onModelLoaded]);

  useFrame((state) => {
    if (groupRef.current) {
      // Add subtle rotation animation and floating effect
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }
  });

  if (!gltf?.scene) {
    return (
      <group
        ref={groupRef}
        scale={modelInfo.scale || 1}
        position={modelInfo.position || [0, 0, 0]}
        rotation={modelInfo.rotation || [0, 0, 0]}
      >
        <mesh>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial 
            color="#ff6b35" 
            transparent 
            opacity={0.8}
            emissive="#ff6b35"
            emissiveIntensity={0.2}
          />
        </mesh>
      </group>
    );
  }

  return (
    <group
      ref={groupRef}
      scale={modelInfo.scale || 1}
      position={modelInfo.position || [0, 0, 0]}
      rotation={modelInfo.rotation || [0, 0, 0]}
    >
      <primitive object={gltf.scene} />
    </group>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.3, 12, 12]} />
      <meshStandardMaterial 
        color="#00d4ff" 
        transparent 
        opacity={0.6}
        emissive="#00d4ff"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

export default function AROverlay({ detectedCard, isVisible, onModelLoaded }: AROverlayProps) {
  const modelInfo = detectedCard ? gltfManager.getModelInfo(detectedCard) : null;

  if (!isVisible || !modelInfo) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        style={{ 
          background: 'transparent',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
        gl={{ 
          alpha: true, 
          antialias: true,
          premultipliedAlpha: false
        }}
        onError={(error) => {
          console.error('Canvas error:', error);
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 3]} intensity={0.6} />
          <pointLight position={[-3, 2, 1]} intensity={0.3} />
          
          <ModelRenderer 
            modelInfo={modelInfo} 
            onModelLoaded={onModelLoaded}
          />
          
          <OrbitControls 
            enablePan={false}
            enableZoom={false}
            enableRotate={true}
            autoRotate={true}
            autoRotateSpeed={1.2}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
