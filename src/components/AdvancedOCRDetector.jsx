// Detector avançado de OCR com reconhecimento de palavras-chave e logotipos
import Tesseract from 'tesseract.js';

export class AdvancedOCRDetector {
  constructor() {
    this.isLoaded = false;
    this.keywords = this.initializeKeywords();
    this.logoPatterns = this.initializeLogoPatterns();
  }

  async load() {
    this.isLoaded = true;
    console.log('🔍 AdvancedOCRDetector carregado');
  }

  initializeKeywords() {
    return {
      'YouTube': [
        'youtube', 'youtube.com', 'youtu.be', 'watch?v=', 'Subscribe', 'Inscrever-se',
        'Like', 'Curtir', 'Share', 'Compartilhar', 'Comments', 'Comentários',
        'Views', 'Visualizações', 'Upload', 'Playlist', 'Channel', 'Canal'
      ],
      'Google': [
        'google', 'google.com', 'Search', 'Pesquisar', 'Gmail', 'Drive',
        'Maps', 'Mapas', 'Images', 'Imagens', 'News', 'Notícias'
      ],
      'Facebook': [
        'facebook', 'facebook.com', 'fb.com', 'Like', 'Curtir', 'Share',
        'Compartilhar', 'Comment', 'Comentar', 'Post', 'Timeline', 'Feed'
      ],
      'Instagram': [
        'instagram', 'instagram.com', 'Stories', 'Reels', 'IGTV', 'Follow',
        'Seguir', 'Followers', 'Seguidores', 'Following', 'Seguindo'
      ],
      'Twitter': [
        'twitter', 'twitter.com', 'x.com', 'Tweet', 'Retweet', 'Like',
        'Follow', 'Followers', 'Following', 'Trending', 'Hashtag'
      ],
      'LinkedIn': [
        'linkedin', 'linkedin.com', 'Connect', 'Conectar', 'Network',
        'Professional', 'Job', 'Career', 'Experience', 'Skills'
      ],
      'WhatsApp': [
        'whatsapp', 'whatsapp.com', 'Chat', 'Message', 'Mensagem',
        'Online', 'Last seen', 'Visto por último', 'Typing', 'Digitando'
      ],
      'Telegram': [
        'telegram', 'telegram.org', 't.me', 'Channel', 'Canal', 'Group',
        'Grupo', 'Forward', 'Encaminhar', 'Reply', 'Responder'
      ],
      'Discord': [
        'discord', 'discord.com', 'Server', 'Servidor', 'Channel', 'Canal',
        'Voice', 'Voz', 'Text', 'Texto', 'Online', 'Offline'
      ],
      'Steam': [
        'steam', 'steampowered.com', 'Library', 'Biblioteca', 'Store',
        'Loja', 'Community', 'Comunidade', 'Workshop', 'Friends', 'Amigos'
      ],
      'Netflix': [
        'netflix', 'netflix.com', 'Watch', 'Assistir', 'My List',
        'Minha Lista', 'Continue Watching', 'Continuar Assistindo', 'Episodes'
      ],
      'Amazon': [
        'amazon', 'amazon.com', 'Prime', 'Cart', 'Carrinho', 'Buy Now',
        'Comprar Agora', 'Add to Cart', 'Adicionar ao Carrinho', 'Wishlist'
      ],
      'Microsoft': [
        'microsoft', 'microsoft.com', 'outlook', 'office', 'teams',
        'onedrive', 'xbox', 'windows', 'bing'
      ],
      'Apple': [
        'apple', 'apple.com', 'icloud', 'app store', 'itunes', 'safari',
        'mac', 'iphone', 'ipad'
      ]
    };
  }

  initializeLogoPatterns() {
    return {
      'YouTube': {
        colors: [[255, 0, 0], [255, 255, 255], [33, 33, 33]],
        shapes: ['play_button', 'rounded_rectangle'],
        text_nearby: ['Subscribe', 'Inscrever-se']
      },
      'Google': {
        colors: [[66, 133, 244], [234, 67, 53], [251, 188, 5], [52, 168, 83]],
        shapes: ['circle', 'rounded_rectangle'],
        text_nearby: ['Search', 'Pesquisar']
      },
      'Facebook': {
        colors: [[24, 119, 242], [255, 255, 255]],
        shapes: ['rounded_square'],
        text_nearby: ['Facebook', 'Like', 'Share']
      },
      'Instagram': {
        colors: [[225, 48, 108], [255, 220, 128], [64, 93, 230]],
        shapes: ['rounded_square', 'circle'],
        text_nearby: ['Instagram', 'Stories']
      },
      'WhatsApp': {
        colors: [[37, 211, 102], [255, 255, 255]],
        shapes: ['circle', 'chat_bubble'],
        text_nearby: ['WhatsApp', 'Chat']
      },
      'Steam': {
        colors: [[23, 26, 33], [102, 192, 244], [255, 255, 255]],
        shapes: ['rounded_rectangle'],
        text_nearby: ['Steam', 'Library', 'Store']
      }
    };
  }

  async detectByOCR(canvas, ctx) {
    console.log('🔍 Iniciando detecção avançada por OCR...');
    
    const results = {
      urls: [],
      keywords: [],
      confidence: 0
    };

    try {
      // Múltiplas estratégias de OCR
      const ocrStrategies = [
        { name: 'Barra de endereço', region: this.getAddressBarRegion(canvas) },
        { name: 'Região superior', region: this.getTopRegion(canvas) },
        { name: 'Texto visível', region: this.getTextRegions(canvas, ctx) },
        { name: 'Imagem completa', region: null }
      ];

      for (const strategy of ocrStrategies) {
        console.log(`🔍 Tentativa OCR: ${strategy.name}`);
        
        const ocrResult = await this.performOCR(canvas, ctx, strategy.region);
        
        if (ocrResult.text && ocrResult.text.length > 5) {
          console.log(`📝 Texto detectado (${strategy.name}): "${ocrResult.text.substring(0, 100)}..."`);
          
          // Extrair URLs
          const urls = this.extractURLs(ocrResult.text);
          results.urls.push(...urls);
          
          // Detectar palavras-chave
          const keywords = this.detectKeywords(ocrResult.text);
          results.keywords.push(...keywords);
          
          if (urls.length > 0 || keywords.length > 0) {
            console.log(`✅ Sucesso com estratégia: ${strategy.name}`);
            break; // Parar na primeira estratégia bem-sucedida
          }
        }
      }

      // Remover duplicatas
      results.urls = [...new Set(results.urls)];
      results.keywords = [...new Set(results.keywords.map(k => k.service))];
      
      // Calcular confiança
      results.confidence = this.calculateOCRConfidence(results);
      
      console.log(`🎯 OCR Final: ${results.urls.length} URLs, ${results.keywords.length} serviços, ${(results.confidence * 100).toFixed(1)}% confiança`);
      
      return results;
      
    } catch (error) {
      console.error('❌ Erro no OCR:', error);
      return results;
    }
  }

  getAddressBarRegion(canvas) {
    // Região típica da barra de endereço (15% superior, centro horizontal)
    const width = canvas.width;
    const height = canvas.height;
    
    return {
      x: Math.floor(width * 0.1),
      y: Math.floor(height * 0.02),
      width: Math.floor(width * 0.8),
      height: Math.floor(height * 0.15)
    };
  }

  getTopRegion(canvas) {
    // Região superior (25% da tela)
    return {
      x: 0,
      y: 0,
      width: canvas.width,
      height: Math.floor(canvas.height * 0.25)
    };
  }

  getTextRegions(canvas, ctx) {
    // Detectar regiões com alta densidade de texto
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const textRegions = this.findTextDenseRegions(imageData);
    
    if (textRegions.length > 0) {
      return textRegions[0]; // Retornar a região com mais texto
    }
    
    return null;
  }

  findTextDenseRegions(imageData) {
    const regions = [];
    const blockSize = 50;
    const width = imageData.width;
    const height = imageData.height;
    
    for (let y = 0; y < height - blockSize; y += blockSize) {
      for (let x = 0; x < width - blockSize; x += blockSize) {
        const textDensity = this.calculateTextDensity(imageData, x, y, blockSize, blockSize);
        
        if (textDensity > 0.3) { // Alta densidade de texto
          regions.push({
            x: x,
            y: y,
            width: blockSize,
            height: blockSize,
            density: textDensity
          });
        }
      }
    }
    
    // Ordenar por densidade de texto
    return regions.sort((a, b) => b.density - a.density);
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
        const bottomIdx = ((y + 1) * width + x) * 4;
        
        if (idx < data.length && rightIdx < data.length && bottomIdx < data.length) {
          const currentLum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          const rightLum = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];
          const bottomLum = 0.299 * data[bottomIdx] + 0.587 * data[bottomIdx + 1] + 0.114 * data[bottomIdx + 2];
          
          const horizontalEdge = Math.abs(currentLum - rightLum);
          const verticalEdge = Math.abs(currentLum - bottomLum);
          
          if (horizontalEdge > 30 || verticalEdge > 30) {
            edgePixels++;
          }
          totalPixels++;
        }
      }
    }
    
    return totalPixels > 0 ? edgePixels / totalPixels : 0;
  }

  async performOCR(canvas, ctx, region) {
    let targetCanvas = canvas;
    let targetCtx = ctx;
    
    // Se há uma região específica, criar canvas recortado
    if (region) {
      targetCanvas = document.createElement('canvas');
      targetCanvas.width = region.width;
      targetCanvas.height = region.height;
      targetCtx = targetCanvas.getContext('2d');
      
      // Copiar região específica
      const imageData = ctx.getImageData(region.x, region.y, region.width, region.height);
      targetCtx.putImageData(imageData, 0, 0);
    }
    
    // Pré-processamento para melhorar OCR
    const processedCanvas = this.preprocessForOCR(targetCanvas, targetCtx);
    
    // Configurações otimizadas do Tesseract para URLs e texto de interface
    const ocrResult = await Tesseract.recognize(processedCanvas, 'eng', {
      logger: () => {}, // Silenciar logs
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
      tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.:/-_?&=@%#',
      preserve_interword_spaces: '0',
      user_defined_dpi: '300',
      tessedit_do_invert: '0',
      classify_bln_numeric_mode: '0'
    });
    
    return {
      text: ocrResult.data.text,
      confidence: ocrResult.data.confidence / 100
    };
  }

  preprocessForOCR(canvas, ctx) {
    // Criar canvas para pré-processamento
    const processedCanvas = document.createElement('canvas');
    processedCanvas.width = canvas.width * 2; // Upscale 2x
    processedCanvas.height = canvas.height * 2;
    const processedCtx = processedCanvas.getContext('2d');
    
    // Upscale com interpolação suave
    processedCtx.imageSmoothingEnabled = true;
    processedCtx.imageSmoothingQuality = 'high';
    processedCtx.drawImage(canvas, 0, 0, processedCanvas.width, processedCanvas.height);
    
    // Aplicar filtros para melhorar legibilidade
    const imageData = processedCtx.getImageData(0, 0, processedCanvas.width, processedCanvas.height);
    const data = imageData.data;
    
    // Aumentar contraste e binarizar
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Converter para escala de cinza
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Binarização adaptativa
      const threshold = 128;
      const newValue = gray > threshold ? 255 : 0;
      
      data[i] = newValue;     // R
      data[i + 1] = newValue; // G
      data[i + 2] = newValue; // B
      // Alpha permanece inalterado
    }
    
    processedCtx.putImageData(imageData, 0, 0);
    return processedCanvas;
  }

  extractURLs(text) {
    const urls = [];
    
    // Padrões de URL mais abrangentes
    const urlPatterns = [
      // URLs completas
      /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi,
      // Domínios sem protocolo
      /(?:^|\s)([a-zA-Z0-9-]+\.(?:com|org|net|edu|gov|mil|int|co|io|me|tv|info|biz|name|pro|museum|aero|coop|jobs|travel|mobi|asia|cat|tel|xxx|post|geo|local|localhost)(?:\/[^\s<>"{}|\\^`\[\]]*)?)/gi,
      // Padrões específicos
      /(?:youtube\.com|youtu\.be|google\.com|facebook\.com|instagram\.com|twitter\.com|linkedin\.com|github\.com|stackoverflow\.com|reddit\.com|wikipedia\.org|amazon\.com|netflix\.com|spotify\.com|apple\.com|microsoft\.com)(?:\/[^\s<>"{}|\\^`\[\]]*)?/gi
    ];
    
    for (const pattern of urlPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (let match of matches) {
          match = match.trim();
          
          // Limpar e validar URL
          const cleanedUrl = this.cleanURL(match);
          if (cleanedUrl && this.isValidURL(cleanedUrl)) {
            urls.push(cleanedUrl);
          }
        }
      }
    }
    
    return [...new Set(urls)]; // Remover duplicatas
  }

  cleanURL(url) {
    // Remover caracteres inválidos no final
    url = url.replace(/[.,;:!?)\]}]+$/, '');
    
    // Adicionar protocolo se necessário
    if (!url.startsWith('http') && !url.startsWith('//')) {
      url = 'https://' + url;
    }
    
    // Correções comuns de OCR
    const corrections = {
      'htt|': 'http',
      'htt1': 'http',
      'https://5': 'https://',
      'https://1': 'https://',
      'https://0': 'https://',
      '.c0m': '.com',
      '.c○m': '.com',
      '.c◯m': '.com',
      'goog1e': 'google',
      'youtu6e': 'youtube',
      'face6ook': 'facebook'
    };
    
    for (const [wrong, correct] of Object.entries(corrections)) {
      url = url.replace(new RegExp(wrong, 'gi'), correct);
    }
    
    return url;
  }

  isValidURL(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  cleanText(text) {
    if (!text) return '';
    
    // Remover caracteres de controle e caracteres especiais problemáticos
    let cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Normalizar espaços em branco
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Remover caracteres que podem interferir na detecção
    cleaned = cleaned.replace(/[^\w\s./:?=&-_#%@]/g, '');
    
    return cleaned;
  }

  detectKeywords(text) {
    const detectedServices = [];
    const textLower = text.toLowerCase();
    
    for (const [service, keywords] of Object.entries(this.keywords)) {
      let matches = 0;
      const foundKeywords = [];
      
      for (const keyword of keywords) {
        if (textLower.includes(keyword.toLowerCase())) {
          matches++;
          foundKeywords.push(keyword);
        }
      }
      
      if (matches > 0) {
        const confidence = Math.min(matches / keywords.length, 1);
        detectedServices.push({
          service: service,
          matches: matches,
          keywords: foundKeywords,
          confidence: confidence
        });
      }
    }
    
    // Ordenar por confiança
    return detectedServices.sort((a, b) => b.confidence - a.confidence);
  }

  calculateOCRConfidence(results) {
    let confidence = 0;
    
    // URLs encontradas aumentam confiança
    if (results.urls.length > 0) {
      confidence += 0.5;
    }
    
    // Palavras-chave encontradas aumentam confiança
    if (results.keywords.length > 0) {
      confidence += 0.3;
    }
    
    // Múltiplas detecções aumentam confiança
    if (results.urls.length > 1 || results.keywords.length > 1) {
      confidence += 0.2;
    }
    
    return Math.min(confidence, 1);
  }

  async detectByVisualPatterns(canvas, ctx) {
    console.log('🎨 Iniciando detecção por padrões visuais...');
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const detectedLogos = [];
    
    for (const [service, pattern] of Object.entries(this.logoPatterns)) {
      const logoScore = this.detectLogo(imageData, pattern, service);
      
      if (logoScore > 0.3) {
        detectedLogos.push({
          service: service,
          confidence: logoScore,
          type: 'visual_logo'
        });
        
        console.log(`🎨 Logo detectado: ${service} (${(logoScore * 100).toFixed(1)}%)`);
      }
    }
    
    return detectedLogos.sort((a, b) => b.confidence - a.confidence);
  }

  detectLogo(imageData, pattern, serviceName) {
    let score = 0;
    
    // Detectar cores características
    const colorScore = this.detectPatternColors(imageData, pattern.colors);
    score += colorScore * 0.4;
    
    // Detectar formas características
    const shapeScore = this.detectPatternShapes(imageData, pattern.shapes);
    score += shapeScore * 0.3;
    
    // Detectar texto próximo (simulado - seria necessário OCR localizado)
    const textScore = this.detectNearbyText(imageData, pattern.text_nearby);
    score += textScore * 0.3;
    
    console.log(`🎨 [${serviceName}] Cores: ${(colorScore*100).toFixed(1)}%, Formas: ${(shapeScore*100).toFixed(1)}%, Texto: ${(textScore*100).toFixed(1)}%`);
    
    return Math.min(score, 1);
  }

  detectPatternColors(imageData, colors) {
    const data = imageData.data;
    let totalMatches = 0;
    let totalSamples = 0;
    
    // Amostragem para performance
    for (let i = 0; i < data.length; i += 16) { // Pular 4 pixels
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      for (const [targetR, targetG, targetB] of colors) {
        const distance = Math.sqrt(
          Math.pow(r - targetR, 2) +
          Math.pow(g - targetG, 2) +
          Math.pow(b - targetB, 2)
        );
        
        if (distance < 50) { // Tolerância de cor
          totalMatches++;
          break; // Contar apenas uma vez por pixel
        }
      }
      
      totalSamples++;
    }
    
    return totalSamples > 0 ? totalMatches / totalSamples : 0;
  }

  detectPatternShapes(imageData, shapes) {
    // Implementação simplificada de detecção de formas
    let shapeScore = 0;
    
    for (const shape of shapes) {
      switch (shape) {
        case 'play_button':
          shapeScore += this.detectPlayButtonShape(imageData) * 0.5;
          break;
        case 'rounded_rectangle':
          shapeScore += this.detectRoundedRectangles(imageData) * 0.3;
          break;
        case 'circle':
          shapeScore += this.detectCircles(imageData) * 0.4;
          break;
        case 'rounded_square':
          shapeScore += this.detectRoundedSquares(imageData) * 0.3;
          break;
      }
    }
    
    return Math.min(shapeScore, 1);
  }

  detectPlayButtonShape(imageData) {
    // Detectar formas triangulares (botão play)
    const width = imageData.width;
    const height = imageData.height;
    let triangularShapes = 0;
    
    // Procurar por padrões triangulares em regiões pequenas
    for (let y = 20; y < height - 40; y += 20) {
      for (let x = 20; x < width - 40; x += 20) {
        if (this.isTriangularRegion(imageData, x, y, 20, 20)) {
          triangularShapes++;
        }
      }
    }
    
    return Math.min(triangularShapes / 10, 1);
  }

  isTriangularRegion(imageData, startX, startY, width, height) {
    // Implementação simplificada para detectar formas triangulares
    const data = imageData.data;
    const imgWidth = imageData.width;
    
    // Verificar se há um padrão triangular básico
    let edgePoints = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const actualX = startX + x;
        const actualY = startY + y;
        
        if (actualX < imgWidth && actualY < imageData.height) {
          const idx = (actualY * imgWidth + actualX) * 4;
          const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          
          // Verificar se está na borda de um triângulo (aproximação)
          const centerX = width / 2;
          const distanceFromCenter = Math.abs(x - centerX);
          const expectedWidth = (y / height) * centerX;
          
          if (Math.abs(distanceFromCenter - expectedWidth) < 2 && luminance < 100) {
            edgePoints++;
          }
        }
      }
    }
    
    return edgePoints > (width * height * 0.1);
  }

  detectRoundedRectangles(imageData) {
    // Implementação simplificada
    return 0.2; // Placeholder
  }

  detectCircles(imageData) {
    // Implementação simplificada
    return 0.2; // Placeholder
  }

  detectRoundedSquares(imageData) {
    // Implementação simplificada
    return 0.2; // Placeholder
  }

  detectNearbyText(imageData, textPatterns) {
    // Implementação simplificada - seria necessário OCR localizado
    // Por enquanto, retornar score baixo
    return 0.1;
  }
}

export default AdvancedOCRDetector;
