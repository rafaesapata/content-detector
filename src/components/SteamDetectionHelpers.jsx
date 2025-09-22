// Funções auxiliares para detecção específica de Steam e outros softwares

export class SteamDetectionHelpers {
  
  static calculateDarkPixelRatio(imageData) {
    const data = imageData.data;
    let darkPixels = 0;
    let totalPixels = 0;
    
    // Amostragem para performance
    for (let i = 0; i < data.length; i += 16) { // Pular 4 pixels (4 * 4 = 16)
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      
      if (luminance < 80) { // Pixel escuro
        darkPixels++;
      }
      totalPixels++;
    }
    
    return totalPixels > 0 ? darkPixels / totalPixels : 0;
  }
  
  static detectGamingUIElements(imageData) {
    let gamingScore = 0;
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    // 1. Detectar gradientes típicos de interfaces de jogos
    const gradientScore = this.detectGradients(imageData);
    gamingScore += gradientScore * 0.3;
    
    // 2. Detectar botões com bordas arredondadas (típico de Steam)
    const roundedButtonScore = this.detectRoundedButtons(imageData);
    gamingScore += roundedButtonScore * 0.3;
    
    // 3. Detectar layout em grid (biblioteca de jogos)
    const gridScore = this.detectGridLayout(imageData);
    gamingScore += gridScore * 0.4;
    
    console.log(`🎮 Gaming UI Elements: gradientes=${(gradientScore*100).toFixed(1)}%, botões=${(roundedButtonScore*100).toFixed(1)}%, grid=${(gridScore*100).toFixed(1)}%`);
    
    return Math.min(gamingScore, 1);
  }
  
  static detectGradients(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    let gradientRegions = 0;
    
    // Procurar por transições suaves de cor (gradientes)
    for (let y = 0; y < height - 10; y += 10) {
      for (let x = 0; x < width - 10; x += 10) {
        const idx1 = (y * width + x) * 4;
        const idx2 = ((y + 10) * width + (x + 10)) * 4;
        
        const r1 = data[idx1], g1 = data[idx1 + 1], b1 = data[idx1 + 2];
        const r2 = data[idx2], g2 = data[idx2 + 1], b2 = data[idx2 + 2];
        
        const colorDiff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
        
        // Gradiente suave (mudança moderada de cor)
        if (colorDiff > 20 && colorDiff < 100) {
          gradientRegions++;
        }
      }
    }
    
    const totalRegions = (width / 10) * (height / 10);
    return totalRegions > 0 ? Math.min(gradientRegions / totalRegions * 5, 1) : 0;
  }
  
  static detectRoundedButtons(imageData) {
    // Detectar formas retangulares com cantos arredondados
    const width = imageData.width;
    const height = imageData.height;
    let buttonLikeShapes = 0;
    
    // Procurar por regiões retangulares com bordas suaves
    for (let y = 20; y < height - 40; y += 20) {
      for (let x = 20; x < width - 60; x += 20) {
        if (this.isButtonLikeRegion(imageData, x, y, 60, 30)) {
          buttonLikeShapes++;
        }
      }
    }
    
    return Math.min(buttonLikeShapes / 20, 1);
  }
  
  static isButtonLikeRegion(imageData, startX, startY, width, height) {
    const data = imageData.data;
    const imgWidth = imageData.width;
    
    // Verificar se há contraste nas bordas (típico de botões)
    let edgePixels = 0;
    let totalEdgePixels = 0;
    
    // Verificar bordas superior e inferior
    for (let x = startX; x < startX + width && x < imgWidth; x++) {
      // Borda superior
      const topIdx = (startY * imgWidth + x) * 4;
      const topInnerIdx = ((startY + 2) * imgWidth + x) * 4;
      
      if (topIdx < data.length && topInnerIdx < data.length) {
        const topLum = 0.299 * data[topIdx] + 0.587 * data[topIdx + 1] + 0.114 * data[topIdx + 2];
        const innerLum = 0.299 * data[topInnerIdx] + 0.587 * data[topInnerIdx + 1] + 0.114 * data[topInnerIdx + 2];
        
        if (Math.abs(topLum - innerLum) > 30) {
          edgePixels++;
        }
        totalEdgePixels++;
      }
    }
    
    return totalEdgePixels > 0 && (edgePixels / totalEdgePixels) > 0.3;
  }
  
  static detectGridLayout(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    
    // Detectar padrão de grid (múltiplas colunas e linhas regulares)
    let verticalLines = 0;
    let horizontalLines = 0;
    
    // Procurar linhas verticais regulares
    for (let x = width * 0.2; x < width * 0.8; x += width * 0.15) {
      if (this.hasVerticalLine(imageData, Math.floor(x))) {
        verticalLines++;
      }
    }
    
    // Procurar linhas horizontais regulares
    for (let y = height * 0.2; y < height * 0.8; y += height * 0.2) {
      if (this.hasHorizontalLine(imageData, Math.floor(y))) {
        horizontalLines++;
      }
    }
    
    // Grid típico tem pelo menos 2 colunas e 2 linhas
    const gridScore = (verticalLines >= 2 && horizontalLines >= 2) ? 0.8 : 0;
    
    console.log(`📊 Grid Layout: ${verticalLines} colunas, ${horizontalLines} linhas, score=${(gridScore*100).toFixed(1)}%`);
    
    return gridScore;
  }
  
  static hasVerticalLine(imageData, x) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    let edgePoints = 0;
    
    for (let y = 10; y < height - 10; y += 5) {
      const leftIdx = (y * width + Math.max(0, x - 2)) * 4;
      const rightIdx = (y * width + Math.min(width - 1, x + 2)) * 4;
      
      if (leftIdx < data.length && rightIdx < data.length) {
        const leftLum = 0.299 * data[leftIdx] + 0.587 * data[leftIdx + 1] + 0.114 * data[leftIdx + 2];
        const rightLum = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];
        
        if (Math.abs(leftLum - rightLum) > 25) {
          edgePoints++;
        }
      }
    }
    
    return edgePoints > (height / 10); // Linha deve ter contraste em pelo menos 10% da altura
  }
  
  static hasHorizontalLine(imageData, y) {
    const data = imageData.data;
    const width = imageData.width;
    let edgePoints = 0;
    
    for (let x = 10; x < width - 10; x += 5) {
      const topIdx = (Math.max(0, y - 2) * width + x) * 4;
      const bottomIdx = (Math.min(imageData.height - 1, y + 2) * width + x) * 4;
      
      if (topIdx < data.length && bottomIdx < data.length) {
        const topLum = 0.299 * data[topIdx] + 0.587 * data[topIdx + 1] + 0.114 * data[topIdx + 2];
        const bottomLum = 0.299 * data[bottomIdx] + 0.587 * data[bottomIdx + 1] + 0.114 * data[bottomIdx + 2];
        
        if (Math.abs(topLum - bottomLum) > 25) {
          edgePoints++;
        }
      }
    }
    
    return edgePoints > (width / 10); // Linha deve ter contraste em pelo menos 10% da largura
  }
  
  static detectGameLibrary(imageData) {
    // Detectar layout típico de biblioteca de jogos (grid de capas)
    const gridScore = this.detectGridLayout(imageData);
    const imageRegions = this.detectImageRegions(imageData);
    
    // Biblioteca de jogos tem grid + múltiplas imagens (capas)
    return (gridScore * 0.6 + imageRegions * 0.4);
  }
  
  static detectStorePage(imageData) {
    // Detectar layout típico de loja (imagens grandes, botões de compra)
    const largeImages = this.detectLargeImageRegions(imageData);
    const buttons = this.detectRoundedButtons(imageData);
    
    return (largeImages * 0.5 + buttons * 0.5);
  }
  
  static detectImageRegions(imageData) {
    // Detectar regiões que parecem ser imagens (alta variação de cor)
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    let imageRegions = 0;
    
    // Dividir em blocos e analisar variação de cor
    const blockSize = 40;
    for (let y = 0; y < height - blockSize; y += blockSize) {
      for (let x = 0; x < width - blockSize; x += blockSize) {
        const colorVariation = this.calculateColorVariation(imageData, x, y, blockSize, blockSize);
        
        if (colorVariation > 0.3) { // Alta variação = provável imagem
          imageRegions++;
        }
      }
    }
    
    const totalBlocks = Math.ceil(width / blockSize) * Math.ceil(height / blockSize);
    return totalBlocks > 0 ? Math.min(imageRegions / totalBlocks * 3, 1) : 0;
  }
  
  static detectLargeImageRegions(imageData) {
    // Similar ao detectImageRegions, mas procura por blocos maiores
    const width = imageData.width;
    const height = imageData.height;
    let largeImageRegions = 0;
    
    const blockSize = 80; // Blocos maiores
    for (let y = 0; y < height - blockSize; y += blockSize) {
      for (let x = 0; x < width - blockSize; x += blockSize) {
        const colorVariation = this.calculateColorVariation(imageData, x, y, blockSize, blockSize);
        
        if (colorVariation > 0.4) { // Variação ainda maior para imagens grandes
          largeImageRegions++;
        }
      }
    }
    
    const totalBlocks = Math.ceil(width / blockSize) * Math.ceil(height / blockSize);
    return totalBlocks > 0 ? Math.min(largeImageRegions / totalBlocks * 2, 1) : 0;
  }
  
  static calculateColorVariation(imageData, startX, startY, blockWidth, blockHeight) {
    const data = imageData.data;
    const width = imageData.width;
    
    let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
    let samples = 0;
    
    for (let y = startY; y < startY + blockHeight && y < imageData.height; y += 2) {
      for (let x = startX; x < startX + blockWidth && x < width; x += 2) {
        const idx = (y * width + x) * 4;
        
        if (idx < data.length) {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          
          minR = Math.min(minR, r);
          maxR = Math.max(maxR, r);
          minG = Math.min(minG, g);
          maxG = Math.max(maxG, g);
          minB = Math.min(minB, b);
          maxB = Math.max(maxB, b);
          
          samples++;
        }
      }
    }
    
    if (samples === 0) return 0;
    
    const rVariation = (maxR - minR) / 255;
    const gVariation = (maxG - minG) / 255;
    const bVariation = (maxB - minB) / 255;
    
    return (rVariation + gVariation + bVariation) / 3;
  }
}
