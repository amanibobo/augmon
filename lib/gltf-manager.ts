/**
 * GLTF Model Manager
 * Handles mapping detected Pokemon cards to their corresponding 3D models
 */

export interface ModelInfo {
  name: string;
  path: string;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export class GLTFManager {
  private static instance: GLTFManager;
  private modelMap: Map<string, ModelInfo> = new Map();

  private constructor() {
    this.initializeModelMap();
  }

  public static getInstance(): GLTFManager {
    if (!GLTFManager.instance) {
      GLTFManager.instance = new GLTFManager();
    }
    return GLTFManager.instance;
  }

  private initializeModelMap(): void {
    // Map detected card names to their GLTF models
    this.modelMap.set('ninetales', {
      name: 'ninetales',
      path: '/models/ninetales.gltf',
      scale: 0.8,
      position: [0, -0.5, 0],
      rotation: [0, 0, 0]
    });

    // Add more Pokemon models as they become available
    // this.modelMap.set('pikachu', {
    //   name: 'pikachu',
    //   path: '/models/pikachu.gltf',
    //   scale: 0.8,
    //   position: [0, 0, 0],
    //   rotation: [0, 0, 0]
    // });
  }

  /**
   * Get model information for a detected card
   */
  public getModelInfo(cardName: string): ModelInfo | null {
    const normalizedName = cardName.toLowerCase().trim();
    return this.modelMap.get(normalizedName) || null;
  }

  /**
   * Check if a model exists for the given card
   */
  public hasModel(cardName: string): boolean {
    return this.getModelInfo(cardName) !== null;
  }

  /**
   * Get all available models
   */
  public getAllModels(): ModelInfo[] {
    return Array.from(this.modelMap.values());
  }

  /**
   * Add a new model mapping
   */
  public addModel(cardName: string, modelInfo: ModelInfo): void {
    this.modelMap.set(cardName.toLowerCase().trim(), modelInfo);
  }

  /**
   * Remove a model mapping
   */
  public removeModel(cardName: string): void {
    this.modelMap.delete(cardName.toLowerCase().trim());
  }

  /**
   * Get model path for a card (useful for preloading)
   */
  public getModelPath(cardName: string): string | null {
    const modelInfo = this.getModelInfo(cardName);
    return modelInfo ? modelInfo.path : null;
  }

  /**
   * Check if all required models are available
   */
  public validateModels(): { available: string[], missing: string[] } {
    const available: string[] = [];
    const missing: string[] = [];

    for (const [cardName, modelInfo] of this.modelMap) {
      // In a real implementation, you might want to check if the file actually exists
      // For now, we'll assume all mapped models are available
      available.push(cardName);
    }

    return { available, missing };
  }
}

export const gltfManager = GLTFManager.getInstance();
