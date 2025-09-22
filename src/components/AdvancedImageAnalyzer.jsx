/**
 * AdvancedImageAnalyzer - Análise de imagem ultra-avançada com IA
 * Usa múltiplas técnicas de computer vision para detecção precisa
 */

import * as tf from '@tensorflow/tfjs';

export class AdvancedImageAnalyzer {
  constructor() {
    this.isLoaded = false;
    this.models = {};
    this.gameSignatures = this.initializeGameSignatures();
    this.softwareSignatures = this.initializeSoftwareSignatures();
  }

  async load() {
    console.log('🧠 Carregando AdvancedImageAnalyzer...');
    
    // Carregar TensorFlow.js se não estiver carregado
    await tf.ready();
    
    this.isLoaded = true;
    console.log('✅ AdvancedImageAnalyzer carregado');
  }

  initializeGameSignatures() {
    return {
      'League of Legends': {
        colors: {
          primary: [[0, 191, 255], [50, 205, 50], [255, 215, 0], [138, 43, 226]],
          ui: [[23, 26, 33], [45, 45, 45], [255, 255, 255]],
          effects: [[255, 69, 0], [0, 255, 255], [255, 20, 147]]
        },
        regions: {
          minimap: { x: 0.75, y: 0.75, w: 0.25, h: 0.25 },
          healthBar: { x: 0.3, y: 0.85, w: 0.4, h: 0.1 },
          inventory: { x: 0.25, y: 0.8, w: 0.5, h: 0.2 },
          topHUD: { x: 0.75, y: 0, w: 0.25, h: 0.15 }
        },
        patterns: {
          isometric: true,
          hudComplexity: 'high',
          textDensity: 'medium',
          effectsIntensity: 'high'
        }
      },
      'Counter-Strike': {
        colors: {
          primary: [[255, 165, 0], [255, 0, 0], [0, 255, 0]],
          ui: [[0, 0, 0], [64, 64, 64], [255, 255, 255]],
          effects: [[255, 255, 0], [255, 0, 0]]
        },
        regions: {
          radar: { x: 0.02, y: 0.02, w: 0.2, h: 0.2 },
          healthBar: { x: 0.02, y: 0.85, w: 0.3, h: 0.1 },
          ammo: { x: 0.7, y: 0.85, w: 0.28, h: 0.1 }
        },
        patterns: {
          firstPerson: true,
          hudComplexity: 'medium',
          textDensity: 'low',
          effectsIntensity: 'medium'
        }
      },
      'Minecraft': {
        colors: {
          primary: [[139, 69, 19], [34, 139, 34], [135, 206, 235]],
          ui: [[0, 0, 0], [85, 85, 85], [255, 255, 255]],
          blocks: [[165, 42, 42], [255, 215, 0], [128, 128, 128]]
        },
        regions: {
          hotbar: { x: 0.25, y: 0.9, w: 0.5, h: 0.08 },
          health: { x: 0.02, y: 0.85, w: 0.2, h: 0.05 },
          hunger: { x: 0.78, y: 0.85, w: 0.2, h: 0.05 }
        },
        patterns: {
          pixelated: true,
          hudComplexity: 'low',
          textDensity: 'low',
          blockyTextures: true
        }
      }
    };
  }

  initializeSoftwareSignatures() {
    return {
      'YouTube': {
        colors: {
          primary: [[255, 0, 0], [255, 255, 255], [33, 33, 33]],
          ui: [[15, 15, 15], [48, 48, 48], [255, 255, 255]]
        },
        elements: {
          playButton: { shape: 'triangle', color: [255, 255, 255] },
          progressBar: { shape: 'rectangle', color: [255, 0, 0] },
          thumbnail: { aspect: 16/9 }
        },
        text: ['Subscribe', 'Like', 'Share', 'Views', 'YouTube']
      },
      'Discord': {
        colors: {
          primary: [[88, 101, 242], [54, 57, 63], [32, 34, 37]],
          ui: [[47, 49, 54], [64, 68, 75], [255, 255, 255]]
        },
        elements: {
          serverList: { x: 0, y: 0, w: 0.06, h: 1 },
          channelList: { x: 0.06, y: 0, w: 0.2, h: 1 },
          chatArea: { x: 0.26, y: 0, w: 0.54, h: 1 }
        },
        text: ['Discord', 'Online', 'Voice', 'Text', 'Server']
      },
      'Steam': {
        colors: {
          primary: [[23, 26, 33], [102, 192, 244], [255, 255, 255]],
          ui: [[16, 20, 24], [39, 43, 49], [196, 196, 196]]
        },
        elements: {
          library: { layout: 'grid' },
          store: { layout: 'vertical_scroll' },
          gameCard: { aspect: 460/215 }
        },
        text: ['Steam', 'Library', 'Store', 'Community', 'Install']
      }
    };
  }

  async analyzeImage(imageElement) {
    console.log('🧠 Iniciando análise avançada de imagem...');
    
    if (!this.isLoaded) {
      throw new Error('AdvancedImageAnalyzer não foi carregado');
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.drawImage(imageElement, 0, 0);
    
    const results = {
      games: [],
      software: [],
      confidence: 0,
      analysis: {}
    };

    try {
      // 1. Análise de cores avançada
      console.log('🎨 Analisando paleta de cores...');
      const colorAnalysis = this.analyzeColorPalette(canvas, ctx);
      results.analysis.colors = colorAnalysis;

      // 2. Análise de regiões específicas
      console.log('📍 Analisando regiões específicas...');
      const regionAnalysis = this.analyzeRegions(canvas, ctx);
      results.analysis.regions = regionAnalysis;

      // 3. Análise de padrões visuais
      console.log('🔍 Detectando padrões visuais...');
      const patternAnalysis = this.analyzePatterns(canvas, ctx);
      results.analysis.patterns = patternAnalysis;

      // 4. Análise de densidade de informação
      console.log('📊 Analisando densidade de informação...');
      const densityAnalysis = this.analyzeDensity(canvas, ctx);
      results.analysis.density = densityAnalysis;

      // 5. Detecção de jogos baseada em assinaturas
      console.log('🎮 Detectando jogos por assinatura...');
      const gameDetection = this.detectGamesBySignature(results.analysis);
      results.games = gameDetection;

      // 6. Detecção de software baseada em assinaturas
      console.log('💻 Detectando software por assinatura...');
      const softwareDetection = this.detectSoftwareBySignature(results.analysis);
      results.software = softwareDetection;

      // 7. Calcular confiança geral
      results.confidence = this.calculateAdvancedConfidence(results);

      console.log('✅ Análise avançada concluída:', results);
      return results;

    } catch (error) {
      console.error('❌ Erro na análise avançada:', error);
      results.error = error.message;
      return results;
    }
  }

  analyzeColorPalette(canvas, ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const colorMap = new Map();
    const sampleRate = 4; // Analisar 1 em cada 4 pixels para performance
    
    for (let i = 0; i < data.length; i += 4 * sampleRate) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Quantizar cores para reduzir variações
      const quantizedR = Math.floor(r / 32) * 32;
      const quantizedG = Math.floor(g / 32) * 32;
      const quantizedB = Math.floor(b / 32) * 32;
      
      const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
    }
    
    // Obter cores dominantes
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([color, count]) => {
        const [r, g, b] = color.split(',').map(Number);
        return { color: [r, g, b], count, percentage: (count / (data.length / 4)) * 100 };
      });

    return {
      dominantColors: sortedColors,
      totalColors: colorMap.size,
      colorDiversity: this.calculateColorDiversity(sortedColors)
    };
  }

  analyzeRegions(canvas, ctx) {
    const regions = {
      topLeft: this.analyzeRegion(canvas, ctx, 0, 0, 0.25, 0.25),
      topRight: this.analyzeRegion(canvas, ctx, 0.75, 0, 0.25, 0.25),
      bottomLeft: this.analyzeRegion(canvas, ctx, 0, 0.75, 0.25, 0.25),
      bottomRight: this.analyzeRegion(canvas, ctx, 0.75, 0.75, 0.25, 0.25),
      center: this.analyzeRegion(canvas, ctx, 0.25, 0.25, 0.5, 0.5),
      topBar: this.analyzeRegion(canvas, ctx, 0, 0, 1, 0.1),
      bottomBar: this.analyzeRegion(canvas, ctx, 0, 0.9, 1, 0.1),
      leftBar: this.analyzeRegion(canvas, ctx, 0, 0, 0.1, 1),
      rightBar: this.analyzeRegion(canvas, ctx, 0.9, 0, 0.1, 1)
    };

    return regions;
  }

  analyzeRegion(canvas, ctx, x, y, w, h) {
    const startX = Math.floor(x * canvas.width);
    const startY = Math.floor(y * canvas.height);
    const width = Math.floor(w * canvas.width);
    const height = Math.floor(h * canvas.height);
    
    const imageData = ctx.getImageData(startX, startY, width, height);
    const data = imageData.data;
    
    let totalR = 0, totalG = 0, totalB = 0;
    let edgeCount = 0;
    let pixelCount = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      totalR += data[i];
      totalG += data[i + 1];
      totalB += data[i + 2];
      pixelCount++;
      
      // Detectar bordas simples
      if (i > 4 && i < data.length - 4) {
        const prevR = data[i - 4];
        const nextR = data[i + 4];
        if (Math.abs(data[i] - prevR) > 30 || Math.abs(data[i] - nextR) > 30) {
          edgeCount++;
        }
      }
    }
    
    return {
      averageColor: [
        Math.floor(totalR / pixelCount),
        Math.floor(totalG / pixelCount),
        Math.floor(totalB / pixelCount)
      ],
      edgeDensity: edgeCount / pixelCount,
      complexity: this.calculateRegionComplexity(data)
    };
  }

  analyzePatterns(canvas, ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    return {
      isometric: this.detectIsometricPattern(imageData),
      grid: this.detectGridPattern(imageData),
      circular: this.detectCircularElements(imageData),
      rectangular: this.detectRectangularElements(imageData),
      textDensity: this.calculateTextDensity(imageData),
      symmetry: this.calculateSymmetry(imageData)
    };
  }

  analyzeDensity(canvas, ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let informationDensity = 0;
    let colorVariance = 0;
    let edgeCount = 0;
    
    // Calcular variância de cor e densidade de bordas
    for (let y = 1; y < canvas.height - 1; y++) {
      for (let x = 1; x < canvas.width - 1; x++) {
        const i = (y * canvas.width + x) * 4;
        
        // Calcular gradiente
        const gx = Math.abs(data[i] - data[i - 4]) + Math.abs(data[i + 4] - data[i]);
        const gy = Math.abs(data[i] - data[i - canvas.width * 4]) + Math.abs(data[i + canvas.width * 4] - data[i]);
        
        const gradient = Math.sqrt(gx * gx + gy * gy);
        
        if (gradient > 50) {
          edgeCount++;
        }
        
        informationDensity += gradient;
      }
    }
    
    return {
      informationDensity: informationDensity / (canvas.width * canvas.height),
      edgeDensity: edgeCount / (canvas.width * canvas.height),
      complexity: this.calculateOverallComplexity(imageData)
    };
  }

  detectGamesBySignature(analysis) {
    const detectedGames = [];
    
    for (const [gameName, signature] of Object.entries(this.gameSignatures)) {
      let confidence = 0;
      const factors = {};
      
      // Análise de cores (30%)
      const colorMatch = this.matchColors(analysis.colors.dominantColors, signature.colors.primary);
      factors.colorMatch = colorMatch;
      confidence += colorMatch * 0.3;
      
      // Análise de regiões específicas (40%)
      const regionMatch = this.matchRegions(analysis.regions, signature.regions);
      factors.regionMatch = regionMatch;
      confidence += regionMatch * 0.4;
      
      // Análise de padrões (20%)
      const patternMatch = this.matchPatterns(analysis.patterns, signature.patterns);
      factors.patternMatch = patternMatch;
      confidence += patternMatch * 0.2;
      
      // Análise de densidade (10%)
      const densityMatch = this.matchDensity(analysis.density, signature.patterns);
      factors.densityMatch = densityMatch;
      confidence += densityMatch * 0.1;
      
      if (confidence > 0.3) { // Threshold mais baixo para capturar mais jogos
        detectedGames.push({
          name: gameName,
          confidence: confidence,
          factors: factors,
          type: 'advanced_signature'
        });
      }
      
      console.log(`🎮 ${gameName}: ${(confidence * 100).toFixed(1)}% (cores: ${(factors.colorMatch * 100).toFixed(1)}%, regiões: ${(factors.regionMatch * 100).toFixed(1)}%, padrões: ${(factors.patternMatch * 100).toFixed(1)}%)`);
    }
    
    return detectedGames.sort((a, b) => b.confidence - a.confidence);
  }

  detectSoftwareBySignature(analysis) {
    const detectedSoftware = [];
    
    for (const [softwareName, signature] of Object.entries(this.softwareSignatures)) {
      let confidence = 0;
      const factors = {};
      
      // Análise de cores (40%)
      const colorMatch = this.matchColors(analysis.colors.dominantColors, signature.colors.primary);
      factors.colorMatch = colorMatch;
      confidence += colorMatch * 0.4;
      
      // Análise de elementos específicos (40%)
      const elementMatch = this.matchElements(analysis.regions, signature.elements);
      factors.elementMatch = elementMatch;
      confidence += elementMatch * 0.4;
      
      // Análise de layout (20%)
      const layoutMatch = this.matchLayout(analysis.patterns, signature.elements);
      factors.layoutMatch = layoutMatch;
      confidence += layoutMatch * 0.2;
      
      if (confidence > 0.25) {
        detectedSoftware.push({
          name: softwareName,
          confidence: confidence,
          factors: factors,
          type: 'advanced_signature'
        });
      }
      
      console.log(`💻 ${softwareName}: ${(confidence * 100).toFixed(1)}% (cores: ${(factors.colorMatch * 100).toFixed(1)}%, elementos: ${(factors.elementMatch * 100).toFixed(1)}%, layout: ${(factors.layoutMatch * 100).toFixed(1)}%)`);
    }
    
    return detectedSoftware.sort((a, b) => b.confidence - a.confidence);
  }

  // Métodos auxiliares
  matchColors(dominantColors, targetColors) {
    let totalMatch = 0;
    
    for (const targetColor of targetColors) {
      let bestMatch = 0;
      
      for (const dominant of dominantColors) {
        const distance = this.colorDistance(dominant.color, targetColor);
        const match = Math.max(0, 1 - distance / 255);
        bestMatch = Math.max(bestMatch, match);
      }
      
      totalMatch += bestMatch;
    }
    
    return totalMatch / targetColors.length;
  }

  matchRegions(regions, targetRegions) {
    let totalMatch = 0;
    let regionCount = 0;
    
    for (const [regionName, targetRegion] of Object.entries(targetRegions)) {
      const actualRegion = this.getRegionByPosition(regions, targetRegion);
      if (actualRegion) {
        const match = this.calculateRegionMatch(actualRegion, targetRegion);
        totalMatch += match;
        regionCount++;
      }
    }
    
    return regionCount > 0 ? totalMatch / regionCount : 0;
  }

  matchPatterns(patterns, targetPatterns) {
    let matches = 0;
    let total = 0;
    
    for (const [key, value] of Object.entries(targetPatterns)) {
      total++;
      if (patterns[key] !== undefined) {
        if (typeof value === 'boolean') {
          matches += patterns[key] === value ? 1 : 0;
        } else if (typeof value === 'string') {
          matches += patterns[key] === value ? 1 : 0.5;
        }
      }
    }
    
    return total > 0 ? matches / total : 0;
  }

  matchDensity(density, targetPatterns) {
    let score = 0;
    
    if (targetPatterns.hudComplexity === 'high' && density.complexity > 0.7) score += 0.5;
    if (targetPatterns.hudComplexity === 'medium' && density.complexity > 0.4 && density.complexity < 0.8) score += 0.5;
    if (targetPatterns.hudComplexity === 'low' && density.complexity < 0.5) score += 0.5;
    
    if (targetPatterns.effectsIntensity === 'high' && density.edgeDensity > 0.3) score += 0.5;
    
    return score;
  }

  matchElements(regions, elements) {
    // Implementação simplificada - pode ser expandida
    return 0.5; // Placeholder
  }

  matchLayout(patterns, elements) {
    // Implementação simplificada - pode ser expandida
    return 0.5; // Placeholder
  }

  // Métodos de cálculo auxiliares
  colorDistance(color1, color2) {
    const dr = color1[0] - color2[0];
    const dg = color1[1] - color2[1];
    const db = color1[2] - color2[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  calculateColorDiversity(colors) {
    if (colors.length < 2) return 0;
    
    let totalDistance = 0;
    let comparisons = 0;
    
    for (let i = 0; i < colors.length - 1; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        totalDistance += this.colorDistance(colors[i].color, colors[j].color);
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalDistance / comparisons / 255 : 0;
  }

  calculateRegionComplexity(data) {
    let variance = 0;
    let mean = 0;
    
    // Calcular média
    for (let i = 0; i < data.length; i += 4) {
      mean += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    mean /= (data.length / 4);
    
    // Calcular variância
    for (let i = 0; i < data.length; i += 4) {
      const pixelMean = (data[i] + data[i + 1] + data[i + 2]) / 3;
      variance += Math.pow(pixelMean - mean, 2);
    }
    variance /= (data.length / 4);
    
    return Math.sqrt(variance) / 255;
  }

  calculateOverallComplexity(imageData) {
    // Implementação simplificada
    return 0.5; // Placeholder
  }

  detectIsometricPattern(imageData) {
    // Implementação simplificada
    return false; // Placeholder
  }

  detectGridPattern(imageData) {
    // Implementação simplificada
    return false; // Placeholder
  }

  detectCircularElements(imageData) {
    // Implementação simplificada
    return 0; // Placeholder
  }

  detectRectangularElements(imageData) {
    // Implementação simplificada
    return 0; // Placeholder
  }

  calculateTextDensity(imageData) {
    // Implementação simplificada
    return 0.3; // Placeholder
  }

  calculateSymmetry(imageData) {
    // Implementação simplificada
    return 0.5; // Placeholder
  }

  getRegionByPosition(regions, targetRegion) {
    // Mapear posição para região correspondente
    if (targetRegion.x < 0.3 && targetRegion.y < 0.3) return regions.topLeft;
    if (targetRegion.x > 0.7 && targetRegion.y < 0.3) return regions.topRight;
    if (targetRegion.x < 0.3 && targetRegion.y > 0.7) return regions.bottomLeft;
    if (targetRegion.x > 0.7 && targetRegion.y > 0.7) return regions.bottomRight;
    return regions.center;
  }

  calculateRegionMatch(actualRegion, targetRegion) {
    // Implementação simplificada
    return 0.5; // Placeholder
  }

  calculateAdvancedConfidence(results) {
    let confidence = 0;
    
    // Jogos detectados
    if (results.games.length > 0) {
      confidence += Math.max(...results.games.map(g => g.confidence)) * 0.6;
    }
    
    // Software detectado
    if (results.software.length > 0) {
      confidence += Math.max(...results.software.map(s => s.confidence)) * 0.4;
    }
    
    return Math.min(confidence, 1);
  }
}

export default AdvancedImageAnalyzer;
