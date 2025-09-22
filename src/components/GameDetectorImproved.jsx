// Detector de jogos melhorado baseado na análise do League of Legends
class GameDetectorImproved {
  constructor() {
    this.isLoaded = false;
    this.gamePatterns = this.initializeGamePatterns();
  }

  async load() {
    await new Promise(resolve => setTimeout(resolve, 100));
    this.isLoaded = true;
    console.log('🎮 GameDetector melhorado carregado (baseado em LoL)');
    return true;
  }

  initializeGamePatterns() {
    return {
      // Cores específicas baseadas na análise do League of Legends
      gameColors: [
        [0, 191, 255],    // Ciano (mana, efeitos mágicos)
        [50, 205, 50],    // Verde (vida, terreno)
        [255, 215, 0],    // Dourado (recursos, itens)
        [138, 43, 226],   // Roxo (habilidades, magia)
        [255, 69, 0],     // Vermelho-laranja (dano, alertas)
        [30, 144, 255],   // Azul (UI, interface)
        [255, 165, 0],    // Laranja (experiência, alertas)
        [255, 20, 147],   // Rosa (efeitos especiais)
        [0, 255, 255],    // Ciano claro (efeitos)
        [255, 255, 0],    // Amarelo (ouro, recursos)
        [128, 0, 128],    // Roxo escuro (magia)
        [34, 139, 34]     // Verde floresta (terreno)
      ],
      
      // Regiões típicas de HUD de jogos (configuráveis via .env)
      hudRegions: {
        minimapa: { 
          x: parseFloat(import.meta.env.VITE_GAME_MINIMAP_X) || 0.75, 
          y: parseFloat(import.meta.env.VITE_GAME_MINIMAP_Y) || 0.75, 
          width: parseFloat(import.meta.env.VITE_GAME_MINIMAP_WIDTH) || 0.25, 
          height: parseFloat(import.meta.env.VITE_GAME_MINIMAP_HEIGHT) || 0.25 
        },
        healthBar: { 
          x: parseFloat(import.meta.env.VITE_GAME_HEALTHBAR_X) || 0.3, 
          y: parseFloat(import.meta.env.VITE_GAME_HEALTHBAR_Y) || 0.85, 
          width: parseFloat(import.meta.env.VITE_GAME_HEALTHBAR_WIDTH) || 0.4, 
          height: parseFloat(import.meta.env.VITE_GAME_HEALTHBAR_HEIGHT) || 0.1 
        },
        inventory: { 
          x: parseFloat(import.meta.env.VITE_GAME_INVENTORY_X) || 0.25, 
          y: parseFloat(import.meta.env.VITE_GAME_INVENTORY_Y) || 0.8, 
          width: parseFloat(import.meta.env.VITE_GAME_INVENTORY_WIDTH) || 0.5, 
          height: parseFloat(import.meta.env.VITE_GAME_INVENTORY_HEIGHT) || 0.15 
        },
        topRight: { 
          x: parseFloat(import.meta.env.VITE_GAME_TOPRIGHT_X) || 0.7, 
          y: parseFloat(import.meta.env.VITE_GAME_TOPRIGHT_Y) || 0.0, 
          width: parseFloat(import.meta.env.VITE_GAME_TOPRIGHT_WIDTH) || 0.3, 
          height: parseFloat(import.meta.env.VITE_GAME_TOPRIGHT_HEIGHT) || 0.15 
        }
      },
      
      // Palavras-chave para OCR
      gameKeywords: [
        'FPS', 'fps', 'MS', 'ms', 'ping', 'PING',
        'Level', 'level', 'LVL', 'lvl',
        'Gold', 'gold', 'XP', 'xp',
        'Health', 'health', 'HP', 'hp',
        'Mana', 'mana', 'MP', 'mp',
        'Cooldown', 'cooldown', 'CD', 'cd',
        'Score', 'score', 'Kill', 'kill',
        'Death', 'death', 'Assist', 'assist'
      ]
    };
  }

  async classify(imageElement) {
    if (!this.isLoaded) {
      throw new Error('Game detector not loaded');
    }

    console.log('🎮 Iniciando análise melhorada de jogo...');

    // Criar canvas para análise
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Usar resolução original para melhor análise
    canvas.width = imageElement.naturalWidth || imageElement.width;
    canvas.height = imageElement.naturalHeight || imageElement.height;
    ctx.drawImage(imageElement, 0, 0);
    
    // Análises específicas baseadas no LoL
    const colorAnalysis = this.analyzeGameColors(canvas, ctx);
    const hudAnalysis = this.analyzeGameHUD(canvas, ctx);
    const perspectiveAnalysis = this.analyzePerspective(canvas, ctx);
    const complexityAnalysis = this.analyzeVisualComplexity(canvas, ctx);
    const textAnalysis = await this.analyzeGameText(canvas, ctx);
    
    // Score final com pesos configuráveis via .env
    const colorWeight = parseFloat(import.meta.env.VITE_GAME_COLOR_WEIGHT) || 0.20;
    const hudWeight = parseFloat(import.meta.env.VITE_GAME_HUD_WEIGHT) || 0.40;
    const perspectiveWeight = parseFloat(import.meta.env.VITE_GAME_PERSPECTIVE_WEIGHT) || 0.25;
    const complexityWeight = parseFloat(import.meta.env.VITE_GAME_COMPLEXITY_WEIGHT) || 0.15;
    const textWeight = parseFloat(import.meta.env.VITE_GAME_TEXT_WEIGHT) || 0.00;
    
    const confidence = (
      colorAnalysis.score * colorWeight +
      hudAnalysis.score * hudWeight +
      perspectiveAnalysis.score * perspectiveWeight +
      complexityAnalysis.score * complexityWeight +
      textAnalysis.score * textWeight
    );
    
    const gameThreshold = parseFloat(import.meta.env.VITE_GAME_DETECTION_THRESHOLD) || 0.30;
    const isGaming = confidence > gameThreshold;
    
    console.log(`🎮 ANÁLISE COMPLETA LoL: ${(confidence * 100).toFixed(1)}% confiança`);
    console.log(`   🎨 Cores: ${(colorAnalysis.score * 100).toFixed(1)}% (peso ${(colorWeight * 100).toFixed(0)}%)`);
    console.log(`   🎯 HUD: ${(hudAnalysis.score * 100).toFixed(1)}% (peso ${(hudWeight * 100).toFixed(0)}%)`);
    console.log(`   📐 Perspectiva: ${(perspectiveAnalysis.score * 100).toFixed(1)}% (peso ${(perspectiveWeight * 100).toFixed(0)}%)`);
    console.log(`   🌈 Complexidade: ${(complexityAnalysis.score * 100).toFixed(1)}% (peso ${(complexityWeight * 100).toFixed(0)}%)`);
    console.log(`   📝 Texto: ${(textAnalysis.score * 100).toFixed(1)}% (peso ${(textWeight * 100).toFixed(0)}%)`);
    console.log(`   🎮 RESULTADO: ${isGaming ? '✅ JOGO DETECTADO' : '❌ NÃO É JOGO'} (threshold: ${(gameThreshold * 100).toFixed(0)}%)`);
    
    // Log detalhado das cores encontradas
    console.log(`   🎨 Detalhes cores: ${colorAnalysis.matches}/${colorAnalysis.totalPixels} matches, saturação média: ${(colorAnalysis.avgSaturation * 100).toFixed(1)}%`);
    
    return {
      isGaming,
      confidence,
      details: {
        colors: colorAnalysis,
        hud: hudAnalysis,
        perspective: perspectiveAnalysis,
        complexity: complexityAnalysis,
        text: textAnalysis
      }
    };
  }

  analyzeGameColors(canvas, ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let gameColorMatches = 0;
    let totalPixels = 0;
    let saturationSum = 0;
    
    // Analisar cores com amostragem
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calcular saturação (jogos tendem a ter cores mais saturadas)
      const saturation = this.calculateSaturation(r, g, b);
      saturationSum += saturation;
      
      // Verificar cores específicas de jogos
      for (const [gr, gg, gb] of this.gamePatterns.gameColors) {
        const distance = Math.sqrt(
          Math.pow(r - gr, 2) + 
          Math.pow(g - gg, 2) + 
          Math.pow(b - gb, 2)
        );
        
        if (distance < 60) {
          gameColorMatches++;
          break;
        }
      }
      
      totalPixels++;
    }
    
    const colorScore = totalPixels > 0 ? gameColorMatches / totalPixels : 0;
    const avgSaturation = totalPixels > 0 ? saturationSum / totalPixels : 0;
    
    // Bonus para alta saturação (típico de jogos) - configurável via .env
    const saturationThreshold = parseFloat(import.meta.env.VITE_GAME_SATURATION_THRESHOLD) || 0.3;
    const saturationBonusValue = parseFloat(import.meta.env.VITE_GAME_SATURATION_BONUS) || 0.2;
    const saturationBonus = avgSaturation > saturationThreshold ? saturationBonusValue : 0;
    const finalScore = Math.min(colorScore + saturationBonus, 1);
    
    return {
      score: finalScore,
      matches: gameColorMatches,
      totalPixels: totalPixels,
      avgSaturation: avgSaturation
    };
  }

  analyzeGameHUD(canvas, ctx) {
    let totalHudScore = 0;
    const hudResults = {};
    
    // Analisar cada região de HUD
    for (const [regionName, region] of Object.entries(this.gamePatterns.hudRegions)) {
      const regionScore = this.analyzeHUDRegion(canvas, ctx, region, regionName);
      hudResults[regionName] = regionScore;
      
      // Pesos específicos por região (configuráveis via .env)
      const weights = {
        minimapa: parseFloat(import.meta.env.VITE_GAME_MINIMAP_WEIGHT) || 0.35,
        healthBar: parseFloat(import.meta.env.VITE_GAME_HEALTHBAR_WEIGHT) || 0.30,
        inventory: parseFloat(import.meta.env.VITE_GAME_INVENTORY_WEIGHT) || 0.25,
        topRight: parseFloat(import.meta.env.VITE_GAME_TOPRIGHT_WEIGHT) || 0.10
      };
      
      totalHudScore += regionScore * (weights[regionName] || 0.1);
    }
    
    return {
      score: Math.min(totalHudScore, 1),
      regions: hudResults
    };
  }

  analyzeHUDRegion(canvas, ctx, region, regionName) {
    const x = Math.floor(canvas.width * region.x);
    const y = Math.floor(canvas.height * region.y);
    const width = Math.floor(canvas.width * region.width);
    const height = Math.floor(canvas.height * region.height);
    
    // Verificar se a região é válida
    if (x + width > canvas.width || y + height > canvas.height) {
      return 0;
    }
    
    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;
    
    let uiElements = 0;
    let totalPixels = 0;
    let edgePixels = 0;
    
    // Cores específicas por tipo de região
    const regionColors = {
      minimapa: [[0, 100, 0], [0, 0, 100], [100, 100, 100], [139, 69, 19]], // Verde, azul, cinza, marrom
      healthBar: [[0, 255, 0], [0, 0, 255], [255, 215, 0], [255, 0, 0]], // Verde, azul, dourado, vermelho
      inventory: [[64, 64, 64], [128, 128, 128], [255, 215, 0], [139, 69, 19]], // Cinza, dourado, marrom
      topRight: [[255, 255, 255], [255, 255, 0], [0, 255, 0]] // Branco, amarelo, verde (texto)
    };
    
    const targetColors = regionColors[regionName] || regionColors.inventory;
    
    for (let i = 0; i < data.length; i += 12) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Verificar cores típicas da região
      for (const [tr, tg, tb] of targetColors) {
        const distance = Math.sqrt(
          Math.pow(r - tr, 2) + 
          Math.pow(g - tg, 2) + 
          Math.pow(b - tb, 2)
        );
        
        if (distance < 80) {
          uiElements++;
          break;
        }
      }
      
      // Detectar bordas (elementos de UI têm muitas bordas)
      if (i < data.length - 12) {
        const nextR = data[i + 12];
        const nextG = data[i + 13];
        const nextB = data[i + 14];
        
        const edgeStrength = Math.abs(r - nextR) + Math.abs(g - nextG) + Math.abs(b - nextB);
        if (edgeStrength > 60) {
          edgePixels++;
        }
      }
      
      totalPixels++;
    }
    
    const colorScore = totalPixels > 0 ? uiElements / totalPixels : 0;
    const edgeScore = totalPixels > 0 ? edgePixels / totalPixels : 0;
    
    // Combinar scores (UI tem cores específicas E muitas bordas)
    const finalScore = (colorScore * 0.6) + (edgeScore * 0.4);
    
    console.log(`  🎯 HUD ${regionName}: Região(${x},${y},${width}x${height}) Cores=${(colorScore*100).toFixed(1)}%, Bordas=${(edgeScore*100).toFixed(1)}%, Final=${(finalScore*100).toFixed(1)}%`);
    
    return Math.min(finalScore, 1);
  }

  analyzePerspective(canvas, ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    
    let diagonalEdges = 0;
    let totalEdges = 0;
    let depthIndicators = 0;
    
    // Procurar por linhas diagonais (perspectiva isométrica)
    for (let y = 2; y < height - 2; y += 4) {
      for (let x = 2; x < width - 2; x += 4) {
        const idx = (y * width + x) * 4;
        
        if (idx < data.length - 4) {
          const current = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          
          // Verificar diagonais (45° típico de isométrico)
          const diag1Idx = ((y - 2) * width + (x - 2)) * 4;
          const diag2Idx = ((y - 2) * width + (x + 2)) * 4;
          const diag3Idx = ((y + 2) * width + (x - 2)) * 4;
          const diag4Idx = ((y + 2) * width + (x + 2)) * 4;
          
          if (diag1Idx >= 0 && diag4Idx < data.length) {
            const diag1 = 0.299 * data[diag1Idx] + 0.587 * data[diag1Idx + 1] + 0.114 * data[diag1Idx + 2];
            const diag2 = 0.299 * data[diag2Idx] + 0.587 * data[diag2Idx + 1] + 0.114 * data[diag2Idx + 2];
            
            // Detectar mudanças diagonais significativas
            if (Math.abs(current - diag1) > 40 || Math.abs(current - diag2) > 40) {
              diagonalEdges++;
            }
            
            // Detectar gradientes de profundidade
            const gradient = Math.abs(diag1 - diag2);
            if (gradient > 20 && gradient < 100) {
              depthIndicators++;
            }
            
            totalEdges++;
          }
        }
      }
    }
    
    const perspectiveScore = totalEdges > 0 ? (diagonalEdges / totalEdges) : 0;
    const depthScore = totalEdges > 0 ? (depthIndicators / totalEdges) : 0;
    
    // Combinar scores de perspectiva e profundidade
    const finalScore = Math.min((perspectiveScore * 0.7) + (depthScore * 0.3), 1);
    
    return {
      score: finalScore,
      diagonalEdges: diagonalEdges,
      depthIndicators: depthIndicators,
      totalEdges: totalEdges
    };
  }

  analyzeVisualComplexity(canvas, ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let colorChanges = 0;
    let totalSamples = 0;
    let uniqueColors = new Set();
    
    // Analisar complexidade de cores
    for (let i = 0; i < data.length - 16; i += 16) {
      const r1 = data[i], g1 = data[i + 1], b1 = data[i + 2];
      const r2 = data[i + 16], g2 = data[i + 17], b2 = data[i + 18];
      
      // Adicionar cor única (quantizada para reduzir variações)
      const quantizedColor = `${Math.floor(r1/32)},${Math.floor(g1/32)},${Math.floor(b1/32)}`;
      uniqueColors.add(quantizedColor);
      
      // Calcular mudança de cor
      const colorDistance = Math.sqrt(
        Math.pow(r1 - r2, 2) + 
        Math.pow(g1 - g2, 2) + 
        Math.pow(b1 - b2, 2)
      );
      
      if (colorDistance > 30) {
        colorChanges++;
      }
      totalSamples++;
    }
    
    const changeRate = totalSamples > 0 ? colorChanges / totalSamples : 0;
    const colorDiversity = uniqueColors.size / Math.max(totalSamples / 100, 1);
    
    // Jogos têm alta complexidade visual
    const complexityScore = Math.min((changeRate * 0.6) + (colorDiversity * 0.4), 1);
    
    return {
      score: complexityScore,
      changeRate: changeRate,
      uniqueColors: uniqueColors.size,
      colorDiversity: colorDiversity
    };
  }

  async analyzeGameText(canvas, ctx) {
    // Análise simplificada de texto (sem OCR completo para performance)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let textLikeRegions = 0;
    let totalRegions = 0;
    
    // Procurar por regiões que parecem conter texto (alta densidade de bordas horizontais)
    const blockSize = 20;
    for (let y = 0; y < canvas.height - blockSize; y += blockSize) {
      for (let x = 0; x < canvas.width - blockSize; x += blockSize) {
        const textDensity = this.calculateTextDensity(imageData, x, y, blockSize, blockSize);
        
        if (textDensity > 0.3) {
          textLikeRegions++;
        }
        totalRegions++;
      }
    }
    
    const textScore = totalRegions > 0 ? textLikeRegions / totalRegions : 0;
    
    return {
      score: Math.min(textScore * 2, 1), // Amplificar score de texto
      textRegions: textLikeRegions,
      totalRegions: totalRegions
    };
  }

  calculateSaturation(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return max > 0 ? (max - min) / max : 0;
  }

  calculateTextDensity(imageData, startX, startY, blockWidth, blockHeight) {
    const data = imageData.data;
    const width = imageData.width;
    let edgePixels = 0;
    let totalPixels = 0;
    
    for (let y = startY; y < startY + blockHeight && y < imageData.height - 1; y++) {
      for (let x = startX; x < startX + blockWidth && x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const rightIdx = (y * width + (x + 1)) * 4;
        
        if (idx < data.length && rightIdx < data.length) {
          const currentLum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          const rightLum = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];
          
          const horizontalEdge = Math.abs(currentLum - rightLum);
          
          if (horizontalEdge > 40) {
            edgePixels++;
          }
          totalPixels++;
        }
      }
    }
    
    return totalPixels > 0 ? edgePixels / totalPixels : 0;
  }
}

export default GameDetectorImproved;
