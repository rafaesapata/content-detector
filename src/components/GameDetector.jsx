// Detector de jogos melhorado com análise avançada de características visuais
class GameDetector {
  constructor() {
    this.isLoaded = false;
  }

  async load() {
    // Simular carregamento
    await new Promise(resolve => setTimeout(resolve, 100));
    this.isLoaded = true;
    return true;
  }

  async classify(imageElement) {
    if (!this.isLoaded) {
      throw new Error('Game detector not loaded');
    }

    // Criar canvas para análise
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Redimensionar para análise otimizada
    const size = 224;
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(imageElement, 0, 0, size, size);
    
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    
    // Extrair características avançadas
    const features = this.extractAdvancedFeatures(data, size);
    
    // Calcular score com algoritmo melhorado
    const confidence = this.calculateGameScore(features);
    const isGaming = confidence > 0.65; // Threshold mais restritivo para reduzir falsos positivos
    
    return {
      isGaming,
      confidence,
      features
    };
  }

  extractAdvancedFeatures(data, size) {
    const features = {
      uiElements: 0,
      colorComplexity: 0,
      edgeDensity: 0,
      geometricPatterns: 0,
      artificialColors: 0,
      contrastVariation: 0,
      textureComplexity: 0
    };

    // Análise de cores e padrões
    const colorMap = new Map();
    const edgeMap = new Array(size * size).fill(0);
    let totalPixels = 0;
    let highSaturationPixels = 0;
    let highContrastPixels = 0;

    // Primeira passada: análise básica de pixels
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        totalPixels++;
        
        // Análise de saturação
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max > 0 ? (max - min) / max : 0;
        
        if (saturation > 0.7) {
          highSaturationPixels++;
        }
        
        // Análise de luminância
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Detectar cores artificiais típicas de jogos
        if (this.isArtificialColor(r, g, b)) {
          features.artificialColors++;
        }
        
        // Mapa de cores para complexidade
        const colorKey = `${Math.floor(r/32)}-${Math.floor(g/32)}-${Math.floor(b/32)}`;
        colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
        
        // Detectar bordas (Sobel)
        if (x > 0 && x < size - 1 && y > 0 && y < size - 1) {
          const edgeStrength = this.calculateEdgeStrength(data, x, y, size);
          edgeMap[y * size + x] = edgeStrength;
          
          if (edgeStrength > 30) {
            features.edgeDensity++;
          }
        }
        
        // Contraste local
        if (luminance > 200 || luminance < 50) {
          highContrastPixels++;
        }
      }
    }

    // Normalizar métricas básicas
    features.artificialColors /= totalPixels;
    features.edgeDensity /= totalPixels;
    features.colorComplexity = Math.min(colorMap.size / 100, 1);
    features.contrastVariation = highContrastPixels / totalPixels;

    // Análise de padrões geométricos
    features.geometricPatterns = this.detectGeometricPatterns(edgeMap, size);
    
    // Análise de elementos de UI
    features.uiElements = this.detectUIElements(data, size);
    
    // Análise de textura
    features.textureComplexity = this.calculateTextureComplexity(data, size);

    return features;
  }

  isArtificialColor(r, g, b) {
    // Detectar cores típicas de jogos (muito saturadas ou específicas)
    const colors = [
      // Cores típicas de UI de jogos
      [255, 0, 0],   // Vermelho puro
      [0, 255, 0],   // Verde puro
      [0, 0, 255],   // Azul puro
      [255, 255, 0], // Amarelo
      [255, 0, 255], // Magenta
      [0, 255, 255], // Ciano
    ];

    for (const [cr, cg, cb] of colors) {
      const distance = Math.sqrt((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2);
      if (distance < 50) return true;
    }

    // Cores muito saturadas
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max > 0 ? (max - min) / max : 0;
    
    return saturation > 0.8 && max > 150;
  }

  calculateEdgeStrength(data, x, y, size) {
    // Operador Sobel para detecção de bordas
    const getPixel = (px, py) => {
      const idx = (py * size + px) * 4;
      return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    };

    const gx = 
      -1 * getPixel(x - 1, y - 1) + 1 * getPixel(x + 1, y - 1) +
      -2 * getPixel(x - 1, y) + 2 * getPixel(x + 1, y) +
      -1 * getPixel(x - 1, y + 1) + 1 * getPixel(x + 1, y + 1);

    const gy = 
      -1 * getPixel(x - 1, y - 1) - 2 * getPixel(x, y - 1) - 1 * getPixel(x + 1, y - 1) +
      1 * getPixel(x - 1, y + 1) + 2 * getPixel(x, y + 1) + 1 * getPixel(x + 1, y + 1);

    return Math.sqrt(gx * gx + gy * gy);
  }

  detectGeometricPatterns(edgeMap, size) {
    let patternScore = 0;
    
    // Detectar linhas horizontais e verticais (típicas de UI)
    for (let y = 10; y < size - 10; y += 5) {
      let horizontalEdges = 0;
      for (let x = 10; x < size - 10; x++) {
        if (edgeMap[y * size + x] > 25) {
          horizontalEdges++;
        }
      }
      if (horizontalEdges > size * 0.3) {
        patternScore += 0.1;
      }
    }

    // Detectar linhas verticais
    for (let x = 10; x < size - 10; x += 5) {
      let verticalEdges = 0;
      for (let y = 10; y < size - 10; y++) {
        if (edgeMap[y * size + x] > 25) {
          verticalEdges++;
        }
      }
      if (verticalEdges > size * 0.3) {
        patternScore += 0.1;
      }
    }

    // Detectar retângulos (elementos de UI)
    patternScore += this.detectRectangles(edgeMap, size);

    return Math.min(patternScore, 1);
  }

  detectRectangles(edgeMap, size) {
    let rectangleScore = 0;
    const step = 20;

    for (let y = step; y < size - step; y += step) {
      for (let x = step; x < size - step; x += step) {
        // Verificar se há um padrão retangular
        let corners = 0;
        
        // Verificar cantos
        if (edgeMap[y * size + x] > 20) corners++;
        if (edgeMap[y * size + (x + step)] > 20) corners++;
        if (edgeMap[(y + step) * size + x] > 20) corners++;
        if (edgeMap[(y + step) * size + (x + step)] > 20) corners++;
        
        if (corners >= 3) {
          rectangleScore += 0.05;
        }
      }
    }

    return Math.min(rectangleScore, 1);
  }

  detectUIElements(data, size) {
    let uiScore = 0;
    
    // Detectar barras de status (regiões com cor uniforme nas bordas)
    const borderWidth = Math.floor(size * 0.1);
    
    // Verificar borda superior
    uiScore += this.analyzeUIRegion(data, 0, 0, size, borderWidth, size);
    
    // Verificar borda inferior
    uiScore += this.analyzeUIRegion(data, 0, size - borderWidth, size, borderWidth, size);
    
    // Verificar cantos (minimapa, inventário)
    uiScore += this.analyzeCornerElements(data, size);

    return Math.min(uiScore, 1);
  }

  analyzeUIRegion(data, startX, startY, width, height, imageSize) {
    let uniformityScore = 0;
    const samples = [];
    const colors = [];
    
    // Coletar amostras da região
    for (let y = startY; y < startY + height && y < imageSize; y += 3) {
      for (let x = startX; x < startX + width && x < imageSize; x += 3) {
        const idx = (y * imageSize + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        samples.push(luminance);
        colors.push([r, g, b]);
      }
    }
    
    if (samples.length > 10) {
      // Calcular variância de luminância
      const mean = samples.reduce((a, b) => a + b) / samples.length;
      const variance = samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / samples.length;
      
      // Verificar se há cores típicas de UI (preto, branco, cinza, cores puras)
      let uiColorCount = 0;
      for (const [r, g, b] of colors) {
        if (this.isUIColor(r, g, b)) {
          uiColorCount++;
        }
      }
      
      const uiColorRatio = uiColorCount / colors.length;
      
      // UI típica: baixa variância + cores específicas de interface
      if (variance < 300 && uiColorRatio > 0.6) {
        uniformityScore = 0.4;
      } else if (variance < 100 && uiColorRatio > 0.3) {
        uniformityScore = 0.2;
      }
    }
    
    return uniformityScore;
  }

  isUIColor(r, g, b) {
    // Cores típicas de UI de jogos
    const uiColors = [
      // Tons de cinza/preto/branco
      () => Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20,
      // Preto puro ou quase preto
      () => r < 30 && g < 30 && b < 30,
      // Branco puro ou quase branco  
      () => r > 220 && g > 220 && b > 220,
      // Cores puras saturadas (típicas de botões/indicadores)
      () => {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        return max > 200 && (max - min) > 150;
      }
    ];
    
    return uiColors.some(check => check());
  }

  analyzeCornerElements(data, size) {
    let cornerScore = 0;
    const cornerSize = Math.floor(size * 0.15);
    
    // Analisar 4 cantos
    const corners = [
      [0, 0], // Superior esquerdo
      [size - cornerSize, 0], // Superior direito
      [0, size - cornerSize], // Inferior esquerdo
      [size - cornerSize, size - cornerSize] // Inferior direito
    ];
    
    for (const [startX, startY] of corners) {
      let hasStructure = false;
      let edgeCount = 0;
      
      for (let y = startY; y < startY + cornerSize && y < size - 1; y += 3) {
        for (let x = startX; x < startX + cornerSize && x < size - 1; x += 3) {
          const edgeStrength = this.calculateEdgeStrength(data, x, y, size);
          if (edgeStrength > 25) {
            edgeCount++;
          }
        }
      }
      
      // Se há muitas bordas no canto, provavelmente é um elemento de UI
      if (edgeCount > cornerSize * 0.1) {
        cornerScore += 0.1;
      }
    }
    
    return cornerScore;
  }

  calculateTextureComplexity(data, size) {
    // Calcular complexidade de textura usando variação local
    let complexity = 0;
    const windowSize = 8;
    
    for (let y = 0; y < size - windowSize; y += windowSize) {
      for (let x = 0; x < size - windowSize; x += windowSize) {
        const variance = this.calculateLocalVariance(data, x, y, windowSize, size);
        complexity += variance;
      }
    }
    
    return Math.min(complexity / 100000, 1);
  }

  calculateLocalVariance(data, startX, startY, windowSize, imageSize) {
    const values = [];
    
    for (let y = startY; y < startY + windowSize; y++) {
      for (let x = startX; x < startX + windowSize; x++) {
        const idx = (y * imageSize + x) * 4;
        const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        values.push(luminance);
      }
    }
    
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return variance;
  }

  calculateGameScore(features) {
    // Pesos rebalanceados para reduzir falsos positivos
    const weights = {
      uiElements: 0.40,        // Aumentar peso de UI específica
      geometricPatterns: 0.30, // Padrões geométricos específicos
      artificialColors: 0.15,  // Reduzir peso de cores (muitas fotos têm cores vibrantes)
      edgeDensity: 0.10,       // Reduzir peso de bordas (fotos naturais têm muitas bordas)
      textureComplexity: 0.03, // Reduzir complexidade
      colorComplexity: 0.02    // Reduzir variedade de cores
    };

    let score = 0;
    score += features.uiElements * weights.uiElements;
    score += features.geometricPatterns * weights.geometricPatterns;
    score += features.artificialColors * weights.artificialColors;
    score += features.edgeDensity * weights.edgeDensity;
    score += features.textureComplexity * weights.textureComplexity;
    score += features.colorComplexity * weights.colorComplexity;

    // Penalizar se não há elementos de UI claros
    if (features.uiElements < 0.2) {
      score *= 0.5; // Reduzir score drasticamente sem UI
    }

    // Penalizar se não há padrões geométricos
    if (features.geometricPatterns < 0.2) {
      score *= 0.7;
    }

    // Boost apenas se múltiplas características FORTES estão presentes
    const strongFeatures = Object.values(features).filter(v => v > 0.5).length;
    if (strongFeatures >= 2 && features.uiElements > 0.3) {
      score *= 1.1; // Boost menor e mais restritivo
    }

    // Aplicar filtros anti-falso-positivo
    score = this.applyAntiNoiseFilters(features, score);

    return Math.min(Math.max(score, 0), 1);
  }

  applyAntiNoiseFilters(features, score) {
    // Filtro 1: Se há muita complexidade de textura mas pouco UI, provavelmente é foto
    if (features.textureComplexity > 0.7 && features.uiElements < 0.3) {
      score *= 0.3;
    }

    // Filtro 2: Se há muitas bordas mas pouco padrão geométrico, provavelmente é paisagem
    if (features.edgeDensity > 0.6 && features.geometricPatterns < 0.3) {
      score *= 0.4;
    }

    // Filtro 3: Cores artificiais sozinhas não indicam jogo
    if (features.artificialColors > 0.5 && features.uiElements < 0.2 && features.geometricPatterns < 0.2) {
      score *= 0.2;
    }

    return score;
  }
}

export default GameDetector;
