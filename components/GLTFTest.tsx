"use client";

import { useEffect, useState } from 'react';
import { gltfManager } from '@/lib/gltf-manager';

export default function GLTFTest() {
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    const runTests = () => {
      const results: string[] = [];
      
      // Test 1: Check if ninetales model exists
      const hasNinetales = gltfManager.hasModel('ninetales');
      results.push(`✅ Ninetales model available: ${hasNinetales}`);
      
      // Test 2: Get model info
      const ninetalesInfo = gltfManager.getModelInfo('ninetales');
      if (ninetalesInfo) {
        results.push(`✅ Model info: ${ninetalesInfo.name} -> ${ninetalesInfo.path}`);
      }
      
      // Test 3: Check non-existent model
      const hasPikachu = gltfManager.hasModel('pikachu');
      results.push(`❌ Pikachu model available: ${hasPikachu}`);
      
      // Test 4: Get all models
      const allModels = gltfManager.getAllModels();
      results.push(`📋 Total models: ${allModels.length}`);
      allModels.forEach(model => {
        results.push(`  - ${model.name}: ${model.path}`);
      });
      
      // Test 5: Validate models
      const validation = gltfManager.validateModels();
      results.push(`🔍 Available models: ${validation.available.join(', ')}`);
      results.push(`⚠️ Missing models: ${validation.missing.join(', ') || 'None'}`);
      
      setTestResults(results);
    };
    
    runTests();
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">GLTF Manager Test Results</h3>
      <div className="space-y-1">
        {testResults.map((result, index) => (
          <div key={index} className="text-sm font-mono">
            {result}
          </div>
        ))}
      </div>
    </div>
  );
}


