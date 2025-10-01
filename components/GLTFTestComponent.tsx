"use client";

import { useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';

export default function GLTFTestComponent() {
  const [testResult, setTestResult] = useState<string>('Testing...');
  
  useEffect(() => {
    const testGLTF = async () => {
      try {
        // Try to load the GLTF model directly
        const gltf = useGLTF('/models/ninetales.gltf');
        setTestResult(`✅ GLTF loaded successfully! Scene: ${gltf?.scene ? 'Yes' : 'No'}`);
      } catch (error) {
        setTestResult(`❌ Error loading GLTF: ${error}`);
      }
    };
    
    testGLTF();
  }, []);

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">GLTF Loading Test</h3>
      <p className="text-sm">{testResult}</p>
    </div>
  );
}

