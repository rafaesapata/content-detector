// Detector de URLs e software em screenshots
import { SteamDetectionHelpers } from './SteamDetectionHelpers.jsx'
import { AdvancedOCRDetector } from './AdvancedOCRDetector.jsx'

class URLSoftwareDetector {
  constructor() {
    this.isLoaded = false;
    this.patterns = this.initializePatterns();
    this.advancedOCR = new AdvancedOCRDetector();
  }

  async load() {
    await new Promise(resolve => setTimeout(resolve, 50));
    await this.advancedOCR.load();
    this.isLoaded = true;
    console.log('🔧 URLSoftwareDetector carregado com OCR avançado');
  }

  initializePatterns() {
    return {
      // Padrões de URL comuns
      urlPatterns: [
        { pattern: /https?:\/\/[^\s]+/g, type: 'url' },
        { pattern: /www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, type: 'domain' },
        { pattern: /[a-zA-Z0-9.-]+\.com/g, type: 'domain' },
        { pattern: /[a-zA-Z0-9.-]+\.org/g, type: 'domain' },
        { pattern: /[a-zA-Z0-9.-]+\.net/g, type: 'domain' },
        { pattern: /[a-zA-Z0-9.-]+\.br/g, type: 'domain' }
      ],
      
      // Características visuais de software conhecido
      softwareSignatures: {
        'Google Chrome': {
          colors: [[66, 133, 244], [234, 67, 53], [251, 188, 5], [52, 168, 83]],
          uiElements: ['tab', 'address_bar', 'bookmark_bar']
        },
        'Firefox': {
          colors: [[255, 149, 0], [0, 96, 223]],
          uiElements: ['tab', 'address_bar']
        },
        'WhatsApp': {
          colors: [[37, 211, 102], [18, 140, 126]],
          uiElements: ['chat_bubble', 'status_bar']
        },
        'Discord': {
          colors: [[88, 101, 242], [54, 57, 63]],
          uiElements: ['sidebar', 'chat_area']
        },
        'YouTube': {
          colors: [[255, 0, 0], [33, 33, 33]],
          uiElements: ['play_button', 'progress_bar']
        },
        'Instagram': {
          colors: [[225, 48, 108], [255, 220, 128]],
          uiElements: ['story_ring', 'heart_icon']
        },
        'Facebook': {
          colors: [[24, 119, 242], [66, 103, 178]],
          uiElements: ['like_button', 'news_feed']
        },
        'Twitter/X': {
          colors: [[29, 155, 240], [0, 0, 0]],
          uiElements: ['tweet_button', 'timeline']
        },
        'Telegram': {
          colors: [[40, 159, 217], [54, 175, 232]],
          uiElements: ['chat_bubble', 'send_button']
        },
        'Steam': {
          colors: [[23, 26, 33], [27, 40, 56], [102, 192, 244], [16, 20, 24]],
          uiElements: ['game_library', 'store_page'],
          requiredElements: 2, // Precisa de pelo menos 2 elementos
          minDarkRatio: 0.5,   // 50% da tela deve ser escura
          maxBrowserElements: 0.2 // Máximo 20% de elementos de navegador
        }
      },
      
      // Padrões de domínios conhecidos
      knownDomains: {
        'google.com': 'Google',
        'youtube.com': 'YouTube',
        'facebook.com': 'Facebook',
        'instagram.com': 'Instagram',
        'twitter.com': 'Twitter/X',
        'x.com': 'Twitter/X',
        'whatsapp.com': 'WhatsApp',
        'discord.com': 'Discord',
        'telegram.org': 'Telegram',
        'github.com': 'GitHub',
        'stackoverflow.com': 'Stack Overflow',
        'reddit.com': 'Reddit',
        'linkedin.com': 'LinkedIn',
        'amazon.com': 'Amazon',
        'netflix.com': 'Netflix',
        'spotify.com': 'Spotify',
        'twitch.tv': 'Twitch',
        'steam.com': 'Steam',
        'microsoft.com': 'Microsoft',
        'apple.com': 'Apple'
      }
    };
  }

  async analyze(imageElement) {
    if (!this.isLoaded) {
      throw new Error('URL/Software detector not loaded');
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.drawImage(imageElement, 0, 0);
    
    const results = {
      urls: [],
      domains: [],
      software: [],
      confidence: 0
    };

    // Análise de texto via OCR simplificado
    const textResults = await this.extractText(canvas, ctx);
    
    // Detectar URLs e domínios no texto
    this.detectURLsInText(textResults, results);
    
    // Análise visual de software
    const visualResults = await this.detectSoftwareVisually(canvas, ctx);
    results.software = visualResults;
    
    // Calcular confiança geral
    results.confidence = this.calculateConfidence(results);
    
    return results;
  }



  async extractText(canvas, ctx) {
    try {
      // Usar Tesseract.js para OCR real
      const { createWorker } = await import('tesseract.js');
      
      // Tentar múltiplas abordagens de OCR
      const results = await this.tryMultipleOCRApproaches(canvas, ctx, createWorker);
      
      // Retornar o melhor resultado
      return this.selectBestOCRResult(results);
    } catch (error) {
      console.warn('OCR falhou, usando método alternativo:', error);
      // Fallback para método anterior
      return this.extractTextFallback(canvas, ctx);
    }
  }

  async tryMultipleOCRApproaches(canvas, ctx, createWorker) {
    const results = [];
    
    // Abordagem 1: Região específica da barra de endereço com configuração otimizada
    try {
      const addressBarCanvas = this.extractAddressBarRegion(canvas, ctx);
      const worker1 = await createWorker('eng');
      
      await worker1.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789./:?=&-_#%',
        tessedit_pageseg_mode: '8', // Single word - melhor para URLs
        tessedit_ocr_engine_mode: '1', // Neural nets LSTM engine
        preserve_interword_spaces: '0', // Não preservar espaços entre palavras
        user_defined_dpi: '300', // DPI alto para melhor qualidade
      });
      
      const { data: { text: text1, confidence: conf1 } } = await worker1.recognize(addressBarCanvas);
      await worker1.terminate();
      
      const processedText1 = this.postProcessURL(text1.trim());
      
      results.push({
        text: processedText1,
        confidence: this.calculateURLConfidence(processedText1) * (conf1 / 100),
        method: 'address_bar_region',
        ocrConfidence: conf1
      });
      
      console.log('OCR Resultado 1 (barra de endereço):', processedText1, 'Confiança OCR:', conf1);
    } catch (e) {
      console.warn('Abordagem 1 falhou:', e);
    }
    
    // Abordagem 2: Região superior completa (para capturar URLs que podem estar em outras posições)
    try {
      const topRegionCanvas = this.extractTopRegion(canvas, ctx);
      const worker2 = await createWorker('eng');
      
      await worker2.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789./:?=&-_#',
        tessedit_pageseg_mode: '6', // Single uniform block
      });
      
      const { data: { text: text2 } } = await worker2.recognize(topRegionCanvas);
      await worker2.terminate();
      
      results.push({
        text: text2.trim(),
        confidence: this.calculateURLConfidence(text2.trim()),
        method: 'top_region'
      });
      
      console.log('OCR Resultado 2 (região superior):', text2.trim());
    } catch (e) {
      console.warn('Abordagem 2 falhou:', e);
    }
    
    // Abordagem 3: Imagem completa com foco em URLs
    try {
      const worker3 = await createWorker('eng');
      
      await worker3.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789./:?=&-_#',
        tessedit_pageseg_mode: '11', // Sparse text
      });
      
      const { data: { text: text3 } } = await worker3.recognize(canvas);
      await worker3.terminate();
      
      results.push({
        text: text3.trim(),
        confidence: this.calculateURLConfidence(text3.trim()),
        method: 'full_image'
      });
      
      console.log('OCR Resultado 3 (imagem completa):', text3.trim());
    } catch (e) {
      console.warn('Abordagem 3 falhou:', e);
    }
    
    return results;
  }



  extractTopRegion(canvas, ctx) {
    const topCanvas = document.createElement('canvas');
    const topCtx = topCanvas.getContext('2d');
    
    const regionHeight = Math.min(120, canvas.height * 0.15);
    topCanvas.width = canvas.width;
    topCanvas.height = regionHeight;
    
    topCtx.drawImage(canvas, 0, 0, canvas.width, regionHeight, 0, 0, canvas.width, regionHeight);
    
    return this.preprocessForOCR(topCanvas, topCtx);
  }

  calculateURLConfidence(text) {
    let confidence = 0;
    
    // Verificar se contém padrões de URL
    if (text.includes('http://') || text.includes('https://')) confidence += 0.4;
    if (text.includes('.com') || text.includes('.org') || text.includes('.net') || text.includes('.br') || text.includes('.io')) confidence += 0.3;
    if (text.includes('/')) confidence += 0.2;
    if (text.includes('.')) confidence += 0.1;
    
    // Penalizar textos muito curtos ou muito longos
    if (text.length < 5) confidence -= 0.3;
    if (text.length > 200) confidence -= 0.2;
    
    // Penalizar textos com muitos espaços (provavelmente não é URL)
    const spaceRatio = (text.match(/ /g) || []).length / text.length;
    if (spaceRatio > 0.1) confidence -= spaceRatio;
    
    return Math.max(0, Math.min(1, confidence));
  }

  selectBestOCRResult(results) {
    if (results.length === 0) return '';
    
    // Ordenar por confiança
    results.sort((a, b) => b.confidence - a.confidence);
    
    console.log('Resultados OCR ordenados por confiança:', results);
    
    // Retornar o resultado com maior confiança
    const best = results[0];
    console.log(`Melhor resultado OCR: "${best.text}" (confiança: ${best.confidence}, método: ${best.method})`);
    
    return best.text;
  }

  postProcessURL(rawText) {
    if (!rawText) return '';
    
    let processed = rawText;
    
    // 1. Remover espaços desnecessários
    processed = processed.replace(/\s+/g, '');
    
    // 2. Correções específicas para padrões problemáticos identificados
    processed = this.applySpecificCorrections(processed);
    
    // 3. Corrigir caracteres comuns mal interpretados pelo OCR
    processed = this.applyGeneralCorrections(processed);
    
    // 4. Tentar reconstruir URL válida
    processed = this.reconstructURL(processed);
    
    // 5. Validar e limpar resultado final
    processed = this.cleanFinalURL(processed);
    
    console.log(`Pós-processamento: "${rawText}" → "${processed}"`);
    
    return processed;
  }

  applySpecificCorrections(text) {
    let corrected = text;
    
    // Correções específicas para padrões problemáticos mais comuns
    
    // 1. Correção específica: "5docsgoogle.com" → "docs.google.com"
    corrected = corrected.replace(/5docsgoogle\.com/gi, 'docs.google.com');
    corrected = corrected.replace(/5docs\.google\.com/gi, 'docs.google.com');
    
    // 2. Correção específica: "https://5" → "https://"
    corrected = corrected.replace(/https?:\/\/5([a-zA-Z])/gi, 'https://$1');
    corrected = corrected.replace(/http:\/\/5([a-zA-Z])/gi, 'http://$1');
    
    // 3. Correções para domínios específicos conhecidos
    corrected = corrected.replace(/5www\./gi, 'www.');
    corrected = corrected.replace(/5mail\./gi, 'mail.');
    corrected = corrected.replace(/5drive\./gi, 'drive.');
    corrected = corrected.replace(/5github\./gi, 'github.');
    
    // 4. Padrão geral: número seguido de palavra longa + domínio
    corrected = corrected.replace(/5([a-zA-Z]{4,})\.(com|org|net|br|io|gov)/gi, '$1.$2');
    
    // 5. Correção: "5" no início de subdomínios após protocolo
    corrected = corrected.replace(/:\/\/5([a-zA-Z0-9-]+)\./gi, '://$1.');
    
    // 6. Correção: qualquer número isolado após protocolo
    corrected = corrected.replace(/:\/\/([0-9])([a-zA-Z])/gi, '://$2');
    
    // 7. Correções específicas para outros números problemáticos
    corrected = corrected.replace(/1docs\./gi, 'docs.');
    corrected = corrected.replace(/0docs\./gi, 'docs.');
    corrected = corrected.replace(/3docs\./gi, 'docs.');
    corrected = corrected.replace(/8docs\./gi, 'docs.');
    
    // 8. Correção para URLs sem espaços entre domínio e extensão
    corrected = corrected.replace(/([a-zA-Z])google\.com/gi, '$1.google.com');
    corrected = corrected.replace(/docsgoogle/gi, 'docs.google');
    
    console.log(`Correções específicas: "${text}" → "${corrected}"`);
    
    return corrected;
  }

  applyGeneralCorrections(text) {
    let processed = text;
    
    // Correções gerais de caracteres
    const corrections = {
      // Caracteres especiais
      '.': /[,;]/g,
      '/': /[\\|]/g,
      '-': /_/g,
      ':': /;/g,
      
      // Correções específicas para domínios conhecidos
      'docs.google.com': /d0cs\.g00gle\.c0m|docs\.g00gle\.c0m|d0cs\.google\.c0m/gi,
      'www.google.com': /www\.g00gle\.c0m|www\.g○○gle\.c0m/gi,
      'github.com': /github\.c0m|github\.c○m/gi,
      'stackoverflow.com': /stackoverf10w\.c0m|stackoverflow\.c0m/gi,
      
      // Extensões de domínio
      '.com': /\.c0m|\.c○m|\.c◯m/gi,
      '.org': /\.0rg|\.○rg|\.◯rg/gi,
      '.net': /\.n3t|\.n€t/gi,
      '.io': /\.i0|\.1o|\.10/gi,
      '.br': /\.6r/gi,
      
      // Protocolo HTTP
      'https://': /https?;\/\/|https?:\/|https?;\/|htt[p|]s?:\/\//gi,
      'http://': /htt[p|]:\/\/|http;\/\/|http:\/|http;\//gi,
    };
    
    // Aplicar correções contextuais
    for (const [correct, pattern] of Object.entries(corrections)) {
      if (pattern instanceof RegExp) {
        processed = processed.replace(pattern, correct);
      }
    }
    
    return processed;
  }

  reconstructURL(text) {
    // Tentar identificar e reconstruir componentes da URL
    let reconstructed = text;
    
    // Se não tem protocolo, tentar adicionar
    if (!reconstructed.match(/^https?:\/\//)) {
      // Procurar por padrão de domínio no início
      const domainMatch = reconstructed.match(/^([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (domainMatch) {
        reconstructed = 'https://' + reconstructed;
      }
    }
    
    // Corrigir separadores de path
    reconstructed = reconstructed.replace(/([a-zA-Z0-9])[\\|]([a-zA-Z0-9])/g, '$1/$2');
    
    // Corrigir query parameters
    reconstructed = reconstructed.replace(/([a-zA-Z0-9])[;]([a-zA-Z0-9=])/g, '$1?$2');
    
    return reconstructed;
  }

  cleanFinalURL(url) {
    // Remover caracteres inválidos no final
    let cleaned = url.replace(/[^a-zA-Z0-9./:?=&-_#%]+$/, '');
    
    // Remover caracteres inválidos no início (exceto protocolo)
    if (cleaned.startsWith('http')) {
      const protocolEnd = cleaned.indexOf('://') + 3;
      const protocol = cleaned.substring(0, protocolEnd);
      const rest = cleaned.substring(protocolEnd).replace(/^[^a-zA-Z0-9]+/, '');
      cleaned = protocol + rest;
    }
    
    return cleaned;
  }

  extractAddressBarRegion(canvas, ctx) {
    // Tentar múltiplas regiões para encontrar a barra de endereço
    const regions = this.getMultipleAddressBarRegions(canvas);
    
    for (const region of regions) {
      const addressBarCanvas = document.createElement('canvas');
      const addressBarCtx = addressBarCanvas.getContext('2d');
      
      addressBarCanvas.width = region.width;
      addressBarCanvas.height = region.height;
      
      // Copiar região específica
      addressBarCtx.drawImage(
        canvas,
        region.x, region.y, region.width, region.height,
        0, 0, region.width, region.height
      );
      
      // Verificar se esta região contém uma barra de endereço válida
      if (this.isLikelyAddressBar(addressBarCanvas, addressBarCtx)) {
        console.log(`Região de barra de endereço encontrada: x=${region.x}, y=${region.y}, w=${region.width}, h=${region.height}`);
        return this.preprocessForOCR(addressBarCanvas, addressBarCtx);
      }
    }
    
    // Fallback para região padrão se nenhuma for detectada
    console.log('Usando região padrão da barra de endereço');
    return this.extractDefaultAddressBarRegion(canvas, ctx);
  }

  getMultipleAddressBarRegions(canvas) {
    const regions = [];
    const width = canvas.width;
    const height = canvas.height;
    
    // Região 1: Barra de endereço típica (logo abaixo das abas)
    regions.push({
      x: width * 0.05,
      y: height * 0.06,
      width: width * 0.9,
      height: Math.min(40, height * 0.06)
    });
    
    // Região 2: Barra de endereço mais alta (alguns navegadores)
    regions.push({
      x: width * 0.08,
      y: height * 0.04,
      width: width * 0.85,
      height: Math.min(35, height * 0.05)
    });
    
    // Região 3: Barra de endereço mais baixa (layout diferente)
    regions.push({
      x: width * 0.1,
      y: height * 0.08,
      width: width * 0.8,
      height: Math.min(45, height * 0.07)
    });
    
    // Região 4: Região mais ampla para capturar variações
    regions.push({
      x: width * 0.03,
      y: height * 0.03,
      width: width * 0.94,
      height: Math.min(60, height * 0.09)
    });
    
    return regions;
  }

  isLikelyAddressBar(canvas, ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let lightPixels = 0;
    let totalPixels = 0;
    let uniformityScore = 0;
    
    // Analisar uniformidade da cor (barras de endereço são geralmente uniformes)
    for (let y = 0; y < canvas.height; y += 2) {
      for (let x = 0; x < canvas.width; x += 4) {
        const idx = (y * canvas.width + x) * 4;
        const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        
        if (luminance > 200) lightPixels++; // Pixels claros típicos de barra de endereço
        totalPixels++;
      }
    }
    
    const lightRatio = lightPixels / totalPixels;
    
    // Barra de endereço deve ter alta proporção de pixels claros (fundo branco/claro)
    return lightRatio > 0.6;
  }

  extractDefaultAddressBarRegion(canvas, ctx) {
    const addressBarCanvas = document.createElement('canvas');
    const addressBarCtx = addressBarCanvas.getContext('2d');
    
    // Região padrão conservadora
    const regionHeight = Math.min(50, canvas.height * 0.08);
    const regionY = Math.min(50, canvas.height * 0.06);
    const regionWidth = canvas.width * 0.85;
    const regionX = canvas.width * 0.075;
    
    addressBarCanvas.width = regionWidth;
    addressBarCanvas.height = regionHeight;
    
    addressBarCtx.drawImage(
      canvas,
      regionX, regionY, regionWidth, regionHeight,
      0, 0, regionWidth, regionHeight
    );
    
    return this.preprocessForOCR(addressBarCanvas, addressBarCtx);
  }

  preprocessForOCR(canvas, ctx) {
    // Aplicar múltiplas técnicas de pré-processamento
    const processedCanvas = this.applyAdvancedPreprocessing(canvas, ctx);
    return processedCanvas;
  }

  applyAdvancedPreprocessing(canvas, ctx) {
    // Criar canvas temporário para processamento
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    // Copiar imagem original
    tempCtx.drawImage(canvas, 0, 0);
    
    // 1. Aumentar resolução (upscaling) para melhor OCR
    const scaledCanvas = this.upscaleImage(tempCanvas, tempCtx, 2);
    
    // 2. Aplicar filtros de melhoria
    const enhancedCanvas = this.enhanceForOCR(scaledCanvas);
    
    return enhancedCanvas;
  }

  upscaleImage(canvas, ctx, scale) {
    const scaledCanvas = document.createElement('canvas');
    const scaledCtx = scaledCanvas.getContext('2d');
    
    scaledCanvas.width = canvas.width * scale;
    scaledCanvas.height = canvas.height * scale;
    
    // Usar interpolação suave
    scaledCtx.imageSmoothingEnabled = true;
    scaledCtx.imageSmoothingQuality = 'high';
    
    scaledCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
    
    return scaledCanvas;
  }

  enhanceForOCR(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // 1. Aplicar filtro de nitidez
    const sharpenedData = this.applySharpenFilter(data, canvas.width, canvas.height);
    
    // 2. Melhorar contraste adaptativo
    const contrastedData = this.applyAdaptiveContrast(sharpenedData, canvas.width, canvas.height);
    
    // 3. Binarização inteligente (Otsu's method simplificado)
    const binarizedData = this.applyIntelligentBinarization(contrastedData);
    
    // 4. Remover ruído
    const denoisedData = this.removeNoise(binarizedData, canvas.width, canvas.height);
    
    // Aplicar dados processados
    for (let i = 0; i < data.length; i++) {
      data[i] = denoisedData[i];
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  applySharpenFilter(data, width, height) {
    const result = new Uint8ClampedArray(data.length);
    
    // Kernel de nitidez
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) { // RGB apenas
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              const kernelIdx = (ky + 1) * 3 + (kx + 1);
              sum += data[idx] * kernel[kernelIdx];
            }
          }
          const idx = (y * width + x) * 4 + c;
          result[idx] = Math.max(0, Math.min(255, sum));
        }
        // Preservar alpha
        const alphaIdx = (y * width + x) * 4 + 3;
        result[alphaIdx] = data[alphaIdx];
      }
    }
    
    return result;
  }

  applyAdaptiveContrast(data, width, height) {
    const result = new Uint8ClampedArray(data.length);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Converter para escala de cinza
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Aplicar contraste adaptativo
      let enhanced;
      if (gray < 128) {
        // Escurecer pixels escuros
        enhanced = Math.max(0, gray * 0.7);
      } else {
        // Clarear pixels claros
        enhanced = Math.min(255, gray * 1.3);
      }
      
      result[i] = enhanced;     // R
      result[i + 1] = enhanced; // G
      result[i + 2] = enhanced; // B
      result[i + 3] = data[i + 3]; // A
    }
    
    return result;
  }

  applyIntelligentBinarization(data) {
    const result = new Uint8ClampedArray(data.length);
    
    // Calcular histograma para encontrar threshold ótimo
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i]; // Já está em escala de cinza
      histogram[Math.floor(gray)]++;
    }
    
    // Método de Otsu simplificado
    const threshold = this.calculateOtsuThreshold(histogram);
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i];
      const binary = gray > threshold ? 255 : 0;
      
      result[i] = binary;     // R
      result[i + 1] = binary; // G
      result[i + 2] = binary; // B
      result[i + 3] = data[i + 3]; // A
    }
    
    return result;
  }

  calculateOtsuThreshold(histogram) {
    const total = histogram.reduce((sum, count) => sum + count, 0);
    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }
    
    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let varMax = 0;
    let threshold = 0;
    
    for (let t = 0; t < 256; t++) {
      wB += histogram[t];
      if (wB === 0) continue;
      
      wF = total - wB;
      if (wF === 0) break;
      
      sumB += t * histogram[t];
      
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      
      const varBetween = wB * wF * (mB - mF) * (mB - mF);
      
      if (varBetween > varMax) {
        varMax = varBetween;
        threshold = t;
      }
    }
    
    return threshold;
  }

  removeNoise(data, width, height) {
    const result = new Uint8ClampedArray(data.length);
    
    // Filtro mediano para remover ruído
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const neighbors = [];
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            neighbors.push(data[idx]);
          }
        }
        
        neighbors.sort((a, b) => a - b);
        const median = neighbors[Math.floor(neighbors.length / 2)];
        
        const idx = (y * width + x) * 4;
        result[idx] = median;     // R
        result[idx + 1] = median; // G
        result[idx + 2] = median; // B
        result[idx + 3] = data[idx + 3]; // A
      }
    }
    
    return result;
  }

  async extractTextFallback(canvas, ctx) {
    // Método anterior como fallback
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const textRegions = this.findTextRegions(imageData);
    
    const extractedText = [];
    
    for (const region of textRegions) {
      const text = await this.analyzeTextRegion(imageData, region);
      if (text) {
        extractedText.push(text);
      }
    }
    
    return extractedText.join(' ');
  }

  findTextRegions(imageData) {
    const regions = [];
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Procurar por regiões que podem conter texto (barra de endereço, títulos, etc.)
    const textAreas = [
      // Barra de endereço (topo)
      { x: 0, y: 0, width: width, height: Math.min(100, height * 0.15) },
      // Área de título
      { x: 0, y: 0, width: width, height: Math.min(150, height * 0.2) },
      // Área central (para conteúdo)
      { x: 0, y: height * 0.2, width: width, height: height * 0.6 }
    ];
    
    return textAreas;
  }

  async analyzeTextRegion(imageData, region) {
    // Análise simplificada de padrões de texto
    const data = imageData.data;
    const width = imageData.width;
    
    let textLikePixels = 0;
    let totalPixels = 0;
    
    for (let y = region.y; y < region.y + region.height && y < imageData.height; y += 2) {
      for (let x = region.x; x < region.x + region.width && x < width; x += 2) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        // Detectar pixels que podem ser texto (alto contraste)
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        if (luminance < 50 || luminance > 200) {
          textLikePixels++;
        }
        totalPixels++;
      }
    }
    
    // Se há suficiente contraste, pode haver texto
    if (textLikePixels / totalPixels > 0.3) {
      // Simular possíveis textos baseado na posição
      return this.generatePossibleText(region);
    }
    
    return null;
  }

  generatePossibleText(region) {
    // Análise mais realista baseada em características visuais
    if (region.y < 100) {
      // Região de barra de endereço - apenas se há padrões de texto
      const hasTextPattern = this.hasTextLikePattern(region);
      if (hasTextPattern > 0.5) {
        // Retornar domínios mais prováveis baseado em análise visual
        return this.inferDomainFromVisualCues(region);
      }
    }
    
    return null;
  }

  hasTextLikePattern(region) {
    // Verificar se há padrões típicos de texto (caracteres, espaçamento)
    let textScore = 0;
    
    // Simular análise de padrões de texto
    if (region.width > 200 && region.height > 20 && region.height < 60) {
      textScore += 0.4; // Dimensões típicas de barra de endereço
    }
    
    return textScore;
  }

  inferDomainFromVisualCues(region) {
    // Inferir domínio baseado em pistas visuais (cores, posição, etc.)
    // Por enquanto, retorna null para ser mais conservador
    return null;
  }

  async detectURLsInText(text, results) {
    console.log('🔍 Texto extraído por OCR:', text.substring(0, 200) + '...');
    
    // Usar detector OCR avançado para melhor extração
    const advancedResults = this.advancedOCR.extractURLs(text);
    
    // Adicionar URLs encontradas
    results.urls.push(...advancedResults);
    
    // Extrair domínios das URLs
    for (const url of advancedResults) {
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');
        results.domains.push(domain);
        
        console.log(`🌐 URL detectada: ${url} → Domínio: ${domain}`);
      } catch (e) {
        // Tentar extrair domínio manualmente
        const domainMatch = url.match(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (domainMatch) {
          const domain = domainMatch[1].replace('www.', '');
          results.domains.push(domain);
          console.log(`🌐 Domínio extraído: ${domain}`);
        }
      }
    }
    
    // Detectar serviços por palavras-chave
    const keywordResults = this.advancedOCR.detectKeywords(text);
    for (const result of keywordResults) {
      console.log(`🔑 Serviço detectado por palavra-chave: ${result.service} (${(result.confidence * 100).toFixed(1)}%)`);
      console.log(`   Palavras encontradas: ${result.keywords.join(', ')}`);
    }
    
    // Armazenar resultados de serviços
    if (!results.services) {
      results.services = [];
    }
    
    results.services.push(...keywordResults.map(r => ({
      name: r.service,
      confidence: r.confidence,
      type: 'keyword_detection',
      keywords: r.keywords
    })));
    
    // Padrões adicionais específicos para barras de endereço
    const addressBarPatterns = [
      // Padrão específico para barras de endereço com protocolo
      /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:com|org|net|edu|gov|mil|int|co|io|me|tv|info|biz|name|pro|br|uk|de|fr|jp|cn|ru|in|au|ca|it|es|nl|se|no|dk|fi|pl|cz|hu|ro|bg|hr|si|sk|lt|lv|ee|mt|cy|lu|be|at|ch|li|mc|sm|va|ad|gi|im|je|gg|fo|gl|is|ax|sj|bv|hm|tf|aq|gs|sh|ac|ta|cc|cx|nf|ck|nu|tk|to|tv|fm|pw|mh|ki|nr|sb|vu|nc|pf|wf|ws|as|gu|mp|vi|pr|um|us)(?:\/[^\s<>"{}|\\^`\[\]]*)?)/gi,
      // Padrão para domínios populares
      /(?:youtube|google|facebook|instagram|twitter|linkedin|github|stackoverflow|reddit|wikipedia|amazon|netflix|spotify|apple|microsoft|discord|telegram|whatsapp|steam|twitch|tiktok|snapchat|pinterest|tumblr|flickr|vimeo|dailymotion|soundcloud|bandcamp|medium|quora|slack|zoom|skype|dropbox|onedrive|icloud|gmail|outlook|yahoo|hotmail|bing|duckduckgo|startpage|ecosia|yandex|baidu|naver|daum|weibo|wechat|line|kakaotalk|viber)\.(?:com|org|net|co|io|tv|me|ly|be|to|it|de|fr|br|uk|jp|cn|ru|in|au|ca|es|nl|se|no|dk|fi|pl|cz|hu|ro|bg|hr|si|sk|lt|lv|ee|mt|cy|lu|at|ch|li|mc|sm|va|ad|gi|im|je|gg|fo|gl|is|ax|sj|bv|hm|tf|aq|gs|sh|ac|ta|cc|cx|nf|ck|nu|tk|fm|pw|mh|ki|nr|sb|vu|nc|pf|wf|ws|as|gu|mp|vi|pr|um|us)(?:\/[^\s<>"{}|\\^`\[\]]*)?/gi
    ];
    
    for (const pattern of addressBarPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (let match of matches) {
          // Limpar e processar match
          match = this.advancedOCR.cleanURL(match);
          
          if (match && this.advancedOCR.isValidURL(match)) {
            results.urls.push(match);
            
            try {
              const urlObj = new URL(match);
              const domain = urlObj.hostname.replace('www.', '');
              results.domains.push(domain);
              console.log(`🎯 URL específica detectada: ${match} → ${domain}`);
            } catch (e) {
              console.log(`⚠️ URL detectada mas inválida: ${match}`);
            }
          }
        }
      }
    }
    
    // Detectar padrões específicos de sistemas conhecidos
    const cleanText = this.advancedOCR.cleanText(text);
    this.detectSpecificSystems(cleanText, results);
     // Remover duplicatas
    results.urls = [...new Set(results.urls)];
    results.domains = [...new Set(results.domains)];
    
    // Remover duplicatas de serviços
    if (results.services) {
      const uniqueServices = new Map();
      for (const service of results.services) {
        const existing = uniqueServices.get(service.name);
        if (!existing || service.confidence > existing.confidence) {
          uniqueServices.set(service.name, service);
        }
      }
      results.services = Array.from(uniqueServices.values());
    }
    
    console.log(`🎯 Detecção final: ${results.urls.length} URLs, ${results.domains.length} domínios, ${results.services?.length || 0} serviços`);
    
    return results;
  }

  calculateAdvancedConfidence(results, ocrResults) {
    let confidence = 0;
    
    // URLs encontradas aumentam muito a confiança
    if (results.urls.length > 0) {
      confidence += 0.6;
    }
    
    // Serviços detectados por palavra-chave
    if (results.services.length > 0) {
      confidence += 0.3;
    }
    
    // Múltiplas detecções aumentam confiança
    if (results.urls.length > 1 || results.services.length > 1) {
      confidence += 0.1;
    }
    
    // Confiança do OCR base
    confidence += ocrResults.confidence * 0.2;
    
    return Math.min(confidence, 1);
  }

  detectSpecificSystems(text, results) {
    // Detectar sistemas específicos baseado em padrões de texto
    const systemPatterns = {
      'Redmine': /redmine/i,
      'UDS': /uds|udstec/i,
      'Credishop': /credishop/i,
      'GitHub': /github/i,
      'GitLab': /gitlab/i,
      'Jira': /jira|atlassian/i,
      'Slack': /slack/i,
      'Teams': /teams\.microsoft/i,
      'Google': /google/i,
      'YouTube': /youtube/i
    };
    
    for (const [system, pattern] of Object.entries(systemPatterns)) {
      if (pattern.test(text)) {
        // Adicionar como software detectado se não estiver já
        const existing = results.software || [];
        if (!existing.some(s => s.name === system)) {
          if (!results.software) results.software = [];
          results.software.push({
            name: system,
            confidence: 0.8,
            type: 'text_detection'
          });
        }
      }
    }
  }

  async detectSoftwareVisually(canvas, ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const detectedSoftware = [];
    
    // Limpar logs anteriores
    window.softwareDetectionLogs = [];
    console.log('🔄 Iniciando nova análise de software - logs limpos');
    
    // Detectar navegador genérico primeiro
    const browserScore = this.detectBrowserInterface(imageData);
    if (browserScore > 0.3) {
      detectedSoftware.push({
        name: 'Navegador Web',
        confidence: browserScore,
        type: 'browser_detection'
      });
    }
    
    // Detectar MSN especificamente
    const msnScore = this.detectMSNInterface(imageData);
    if (msnScore > 0.4) {
      detectedSoftware.push({
        name: 'MSN/Bing',
        confidence: msnScore,
        type: 'msn_detection'
      });
    }
    
    for (const [softwareName, signature] of Object.entries(this.patterns.softwareSignatures)) {
      const confidence = this.analyzeSoftwareSignature(imageData, signature, softwareName);
      
      if (confidence > 0.2) { // Threshold mais baixo
        detectedSoftware.push({
          name: softwareName,
          confidence: confidence,
          type: 'visual_detection'
        });
      }
    }
    
    // Ordenar por confiança
    return detectedSoftware.sort((a, b) => b.confidence - a.confidence);
  }

  detectBrowserInterface(imageData) {
    let score = 0;
    const width = imageData.width;
    const height = imageData.height;
    
    // Detectar barra de abas (região superior)
    const tabRegionHeight = Math.min(80, height * 0.1);
    score += this.detectTabRegion(imageData, 0, 0, width, tabRegionHeight) * 0.4;
    
    // Detectar barra de endereço
    const addressBarRegion = Math.min(120, height * 0.15);
    score += this.detectAddressBarRegion(imageData, 0, tabRegionHeight, width, addressBarRegion) * 0.4;
    
    // Detectar área de conteúdo web
    score += this.detectWebContent(imageData) * 0.2;
    
    return Math.min(score, 1);
  }

  detectMSNInterface(imageData) {
    let score = 0;
    
    // Cores características do MSN (azul escuro, branco)
    const msnColors = this.detectMSNColors(imageData);
    score += msnColors * 0.5;
    
    // Layout típico do MSN (cards de notícias)
    const layoutScore = this.detectNewsCardLayout(imageData);
    score += layoutScore * 0.3;
    
    // Elementos de clima/tempo
    const weatherScore = this.detectWeatherWidget(imageData);
    score += weatherScore * 0.2;
    
    return Math.min(score, 1);
  }

  detectTabRegion(imageData, x, y, width, height) {
    let tabScore = 0;
    const data = imageData.data;
    
    // Procurar por padrões horizontais típicos de abas
    for (let row = y; row < y + height && row < imageData.height; row += 5) {
      let darkPixels = 0;
      let lightPixels = 0;
      let totalPixels = 0;
      
      for (let col = x; col < x + width && col < imageData.width; col += 10) {
        const idx = (row * imageData.width + col) * 4;
        const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        
        if (luminance < 100) darkPixels++;
        else if (luminance > 200) lightPixels++;
        totalPixels++;
      }
      
      // Abas têm contraste entre áreas claras e escuras
      if (totalPixels > 0) {
        const contrast = (darkPixels + lightPixels) / totalPixels;
        if (contrast > 0.6) {
          tabScore += 0.2;
        }
      }
    }
    
    return Math.min(tabScore, 1);
  }

  detectAddressBarRegion(imageData, x, y, width, height) {
    let addressScore = 0;
    const data = imageData.data;
    
    // Procurar por região retangular clara (típica de barra de endereço)
    for (let row = y; row < y + height && row < imageData.height; row += 8) {
      let uniformPixels = 0;
      let totalPixels = 0;
      
      for (let col = x + width * 0.1; col < x + width * 0.9 && col < imageData.width; col += 8) {
        const idx = (row * imageData.width + col) * 4;
        const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        
        // Barra de endereço geralmente é clara
        if (luminance > 220) {
          uniformPixels++;
        }
        totalPixels++;
      }
      
      if (totalPixels > 0 && uniformPixels / totalPixels > 0.7) {
        addressScore += 0.3;
      }
    }
    
    return Math.min(addressScore, 1);
  }

  detectWebContent(imageData) {
    // Detectar padrões típicos de conteúdo web (cards, imagens, texto)
    let contentScore = 0;
    const width = imageData.width;
    const height = imageData.height;
    
    // Procurar por regiões retangulares (cards/artigos)
    const cardRegions = this.findRectangularRegions(imageData);
    if (cardRegions > 2) {
      contentScore += 0.5;
    }
    
    return Math.min(contentScore, 1);
  }

  detectMSNColors(imageData) {
    let colorScore = 0;
    const data = imageData.data;
    const step = 20;
    
    let bluePixels = 0;
    let totalSamples = 0;
    
    for (let y = 0; y < imageData.height; y += step) {
      for (let x = 0; x < imageData.width; x += step) {
        const idx = (y * imageData.width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        // Detectar tons de azul do MSN
        if (b > r && b > g && b > 100) {
          bluePixels++;
        }
        
        totalSamples++;
      }
    }
    
    if (totalSamples > 0) {
      colorScore = (bluePixels / totalSamples) * 2; // Amplificar score
    }
    
    return Math.min(colorScore, 1);
  }

  detectNewsCardLayout(imageData) {
    // Detectar layout típico de cards de notícias
    const rectangles = this.findRectangularRegions(imageData);
    
    if (rectangles >= 3) {
      return 0.8; // Alto score se há múltiplos cards
    } else if (rectangles >= 2) {
      return 0.5;
    }
    
    return 0;
  }

  detectWeatherWidget(imageData) {
    // Detectar widget de clima (números grandes, ícones)
    let weatherScore = 0;
    
    // Procurar por regiões com números grandes (temperatura)
    const hasLargeNumbers = this.detectLargeNumbers(imageData);
    if (hasLargeNumbers) {
      weatherScore += 0.6;
    }
    
    return Math.min(weatherScore, 1);
  }

  findRectangularRegions(imageData) {
    // Algoritmo simplificado para detectar regiões retangulares
    let rectangleCount = 0;
    const width = imageData.width;
    const height = imageData.height;
    const step = 50;
    
    for (let y = step; y < height - step; y += step) {
      for (let x = step; x < width - step; x += step) {
        if (this.isRectangularRegion(imageData, x, y, step)) {
          rectangleCount++;
        }
      }
    }
    
    return rectangleCount;
  }

  isRectangularRegion(imageData, centerX, centerY, size) {
    // Verificar se há bordas formando um retângulo
    const edgePoints = [
      [centerX - size/2, centerY - size/2], // top-left
      [centerX + size/2, centerY - size/2], // top-right
      [centerX - size/2, centerY + size/2], // bottom-left
      [centerX + size/2, centerY + size/2]  // bottom-right
    ];
    
    let edgeCount = 0;
    for (const [x, y] of edgePoints) {
      if (x >= 0 && x < imageData.width && y >= 0 && y < imageData.height) {
        const edgeStrength = this.getEdgeStrength(imageData, Math.floor(x), Math.floor(y));
        if (edgeStrength > 15) {
          edgeCount++;
        }
      }
    }
    
    return edgeCount >= 3; // Pelo menos 3 cantos com bordas
  }

  detectLargeNumbers(imageData) {
    // Detectar padrões que podem ser números grandes (temperatura)
    // Simplificado: procurar por regiões com alto contraste em formato de dígitos
    const width = imageData.width;
    const height = imageData.height;
    
    // Procurar na região superior direita (onde geralmente fica o clima)
    const searchX = width * 0.7;
    const searchY = height * 0.2;
    const searchWidth = width * 0.25;
    const searchHeight = height * 0.3;
    
    let highContrastRegions = 0;
    
    for (let y = searchY; y < searchY + searchHeight && y < height; y += 10) {
      for (let x = searchX; x < searchX + searchWidth && x < width; x += 10) {
        const edgeStrength = this.getEdgeStrength(imageData, Math.floor(x), Math.floor(y));
        if (edgeStrength > 30) {
          highContrastRegions++;
        }
      }
    }
    
    return highContrastRegions > 5; // Se há suficiente contraste, pode ser texto grande
  }

  analyzeSoftwareSignature(imageData, signature, softwareName) {
    let colorMatches = 0;
    let totalColorChecks = 0;
    const colorDetails = [];
    
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    console.log(`🔍 [${softwareName}] Iniciando análise de assinatura visual...`);
    
    // Verificar cores características com análise mais rigorosa
    for (let colorIndex = 0; colorIndex < signature.colors.length; colorIndex++) {
      const [targetR, targetG, targetB] = signature.colors[colorIndex];
      let colorMatchesForThisColor = 0;
      let checksForThisColor = 0;
      
      // Amostragem mais esparsa para performance
      for (let y = 0; y < height; y += 15) {
        for (let x = 0; x < width; x += 15) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          
          const distance = Math.sqrt(
            Math.pow(r - targetR, 2) +
            Math.pow(g - targetG, 2) +
            Math.pow(b - targetB, 2)
          );
          
          // Threshold mais rigoroso para Steam (cores muito específicas)
          const threshold = softwareName === 'Steam' ? 30 : 50;
          
          if (distance < threshold) {
            colorMatches++;
            colorMatchesForThisColor++;
          }
          totalColorChecks++;
          checksForThisColor++;
        }
      }
      
      const colorMatchPercentage = checksForThisColor > 0 ? (colorMatchesForThisColor / checksForThisColor) * 100 : 0;
      colorDetails.push({
        targetColor: `rgb(${targetR}, ${targetG}, ${targetB})`,
        matches: colorMatchesForThisColor,
        total: checksForThisColor,
        percentage: colorMatchPercentage.toFixed(2)
      });
      
      console.log(`🎨 [${softwareName}] Cor ${colorIndex + 1} rgb(${targetR}, ${targetG}, ${targetB}): ${colorMatchesForThisColor}/${checksForThisColor} matches (${colorMatchPercentage.toFixed(1)}%)`);
    }
    
    const colorScore = totalColorChecks > 0 ? colorMatches / totalColorChecks : 0;
    
    // Análise de elementos de UI específicos com logs
    console.log(`🔧 [${softwareName}] Analisando elementos de UI: ${signature.uiElements.join(', ')}`);
    const uiScore = this.analyzeUIElements(imageData, signature.uiElements, softwareName);
    
    // Aplicar penalizações específicas para Steam
    let finalScore = (colorScore * 0.6 + uiScore * 0.4);
    let penalties = [];
    
    // Aplicar critérios específicos baseados na assinatura do software
    if (signature.minDarkRatio || signature.maxBrowserElements || signature.requiredElements) {
      
      if (softwareName === 'Steam') {
        // Steam tem critérios ultra-rigorosos
        
        // Critério 1: Ratio de pixels escuros obrigatório
        const darkPixelRatio = SteamDetectionHelpers.calculateDarkPixelRatio(imageData);
        const minDarkRequired = signature.minDarkRatio || 0.5;
        if (darkPixelRatio < minDarkRequired) {
          penalties.push(`Interface não é escura o suficiente (${(darkPixelRatio * 100).toFixed(1)}% < ${(minDarkRequired * 100).toFixed(0)}%)`);
          finalScore = 0; // Eliminatório
        }
        
        // Critério 2: Elementos de gaming obrigatórios
        const gamingElements = SteamDetectionHelpers.detectGamingUIElements(imageData);
        if (gamingElements < 0.4) {
          penalties.push(`Insuficientes elementos de gaming (${(gamingElements * 100).toFixed(1)}% < 40%)`);
          finalScore = 0; // Eliminatório
        }
        
        // Critério 3: Limite rígido de elementos de navegador
        const browserElements = this.detectBrowserInterface(imageData);
        const maxBrowserAllowed = signature.maxBrowserElements || 0.2;
        if (browserElements > maxBrowserAllowed) {
          penalties.push(`Muitos elementos de navegador (${(browserElements * 100).toFixed(1)}% > ${(maxBrowserAllowed * 100).toFixed(0)}%)`);
          finalScore = 0; // Eliminatório
        }
        
        // Critério 4: Score de cores mínimo muito alto
        if (colorScore < 0.25) {
          penalties.push(`Score de cores insuficiente (${(colorScore * 100).toFixed(1)}% < 25%)`);
          finalScore = 0; // Eliminatório
        }
        
        // Critério 5: Score de UI mínimo
        if (uiScore < 0.3) {
          penalties.push(`Score de UI insuficiente (${(uiScore * 100).toFixed(1)}% < 30%)`);
          finalScore = 0; // Eliminatório
        }
        
        // Critério 6: Threshold final ultra-alto
        if (finalScore > 0 && finalScore < 0.7) {
          penalties.push(`Score final insuficiente para Steam (${(finalScore * 100).toFixed(1)}% < 70%)`);
          finalScore = 0; // Eliminatório
        }
        
        // Critério 7: Verificação de múltiplos critérios simultaneamente
        const steamCriteriaMet = [
          darkPixelRatio >= minDarkRequired,
          gamingElements >= 0.4,
          browserElements <= maxBrowserAllowed,
          colorScore >= 0.25,
          uiScore >= 0.3
        ].filter(Boolean).length;
        
        if (steamCriteriaMet < 5) {
          penalties.push(`Steam requer TODOS os critérios (${steamCriteriaMet}/5 atendidos)`);
          finalScore = 0; // Eliminatório
        }
        
        console.log(`🎮 [Steam] Critérios rigorosos: escuro=${(darkPixelRatio*100).toFixed(1)}%, gaming=${(gamingElements*100).toFixed(1)}%, browser=${(browserElements*100).toFixed(1)}%`);
      }
    }
    
    // Log detalhado da decisão
    console.log(`📊 [${softwareName}] Análise completa:`);
    console.log(`   • Score de cores: ${(colorScore * 100).toFixed(1)}% (${colorMatches}/${totalColorChecks} matches)`);
    console.log(`   • Score de UI: ${(uiScore * 100).toFixed(1)}%`);
    console.log(`   • Score combinado: ${((colorScore * 0.6 + uiScore * 0.4) * 100).toFixed(1)}%`);
    
    if (penalties.length > 0) {
      console.log(`   ⚠️ Penalizações aplicadas:`);
      penalties.forEach(penalty => console.log(`     - ${penalty}`));
    }
    
    console.log(`   🎯 Score final: ${(finalScore * 100).toFixed(1)}%`);
    console.log(`   ✅ Decisão: ${finalScore > 0.2 ? 'DETECTADO' : 'NÃO DETECTADO'}`);
    
    // Salvar detalhes para debugging
    if (window.softwareDetectionLogs) {
      window.softwareDetectionLogs.push({
        software: softwareName,
        colorScore: colorScore,
        uiScore: uiScore,
        finalScore: finalScore,
        colorDetails: colorDetails,
        penalties: penalties,
        decision: finalScore > 0.2 ? 'DETECTADO' : 'NÃO DETECTADO'
      });
    } else {
      window.softwareDetectionLogs = [{
        software: softwareName,
        colorScore: colorScore,
        uiScore: uiScore,
        finalScore: finalScore,
        colorDetails: colorDetails,
        penalties: penalties,
        decision: finalScore > 0.2 ? 'DETECTADO' : 'NÃO DETECTADO'
      }];
    }
    
    return finalScore;
  }

  analyzeUIElements(imageData, uiElements, softwareName) {
    // Análise simplificada de elementos de UI
    let uiScore = 0;
    const elementScores = [];
    
    for (const element of uiElements) {
      let elementScore = 0;
      switch (element) {
        case 'tab':
          elementScore = this.detectTabs(imageData) * 0.3;
          break;
        case 'address_bar':
          elementScore = this.detectAddressBar(imageData) * 0.4;
          break;
        case 'chat_bubble':
          elementScore = this.detectChatBubbles(imageData) * 0.3;
          break;
        case 'play_button':
          elementScore = this.detectPlayButton(imageData) * 0.2;
          break;
        case 'game_library':
          elementScore = SteamDetectionHelpers.detectGameLibrary(imageData) * 0.5;
          break;
        case 'store_page':
          elementScore = SteamDetectionHelpers.detectStorePage(imageData) * 0.4;
          break;
        default:
          elementScore = 0;
      }
      
      uiScore += elementScore;
      elementScores.push({
        element: element,
        score: elementScore,
        percentage: (elementScore * 100).toFixed(1)
      });
      
      console.log(`🔧 [${softwareName}] Elemento "${element}": ${(elementScore * 100).toFixed(1)}%`);
    }
    
    const finalUIScore = Math.min(uiScore, 1);
    console.log(`🔧 [${softwareName}] Score total de UI: ${(finalUIScore * 100).toFixed(1)}%`);
    
    return finalUIScore;
  }

  detectTabs(imageData) {
    // Detectar padrões de abas no topo
    const topRegion = Math.min(100, imageData.height * 0.15);
    let tabLikePatterns = 0;
    
    // Procurar por retângulos horizontais no topo
    for (let y = 0; y < topRegion; y += 5) {
      let consecutiveEdges = 0;
      for (let x = 0; x < imageData.width - 1; x += 5) {
        const edgeStrength = this.getEdgeStrength(imageData, x, y);
        if (edgeStrength > 20) {
          consecutiveEdges++;
        } else {
          if (consecutiveEdges > 10) {
            tabLikePatterns++;
          }
          consecutiveEdges = 0;
        }
      }
    }
    
    return Math.min(tabLikePatterns / 10, 1);
  }

  detectAddressBar(imageData) {
    // Detectar barra de endereço (região retangular no topo)
    const topRegion = Math.min(150, imageData.height * 0.2);
    let addressBarScore = 0;
    
    for (let y = 20; y < topRegion; y += 10) {
      let uniformPixels = 0;
      let totalPixels = 0;
      
      for (let x = 50; x < imageData.width - 50; x += 5) {
        const idx = (y * imageData.width + x) * 4;
        const luminance = 0.299 * imageData.data[idx] + 0.587 * imageData.data[idx + 1] + 0.114 * imageData.data[idx + 2];
        
        if (luminance > 240 || luminance < 60) {
          uniformPixels++;
        }
        totalPixels++;
      }
      
      if (totalPixels > 0 && uniformPixels / totalPixels > 0.7) {
        addressBarScore += 0.2;
      }
    }
    
    return Math.min(addressBarScore, 1);
  }

  detectChatBubbles(imageData) {
    // Detectar bolhas de chat (formas arredondadas)
    let bubbleScore = 0;
    const step = 20;
    
    for (let y = step; y < imageData.height - step; y += step) {
      for (let x = step; x < imageData.width - step; x += step) {
        if (this.isRoundedShape(imageData, x, y, step)) {
          bubbleScore += 0.1;
        }
      }
    }
    
    return Math.min(bubbleScore, 1);
  }

  detectPlayButton(imageData) {
    // Detectar botão de play (triângulo)
    let playButtonScore = 0;
    const step = 30;
    
    for (let y = step; y < imageData.height - step; y += step) {
      for (let x = step; x < imageData.width - step; x += step) {
        if (this.isTriangleShape(imageData, x, y, step)) {
          playButtonScore += 0.2;
        }
      }
    }
    
    return Math.min(playButtonScore, 1);
  }

  getEdgeStrength(imageData, x, y) {
    if (x >= imageData.width - 1 || y >= imageData.height - 1) return 0;
    
    const idx1 = (y * imageData.width + x) * 4;
    const idx2 = (y * imageData.width + (x + 1)) * 4;
    
    const lum1 = 0.299 * imageData.data[idx1] + 0.587 * imageData.data[idx1 + 1] + 0.114 * imageData.data[idx1 + 2];
    const lum2 = 0.299 * imageData.data[idx2] + 0.587 * imageData.data[idx2 + 1] + 0.114 * imageData.data[idx2 + 2];
    
    return Math.abs(lum1 - lum2);
  }

  isRoundedShape(imageData, centerX, centerY, radius) {
    // Verificar se há uma forma arredondada
    let edgePoints = 0;
    const totalPoints = 8;
    
    for (let i = 0; i < totalPoints; i++) {
      const angle = (i * 2 * Math.PI) / totalPoints;
      const x = Math.floor(centerX + radius * Math.cos(angle));
      const y = Math.floor(centerY + radius * Math.sin(angle));
      
      if (x >= 0 && x < imageData.width && y >= 0 && y < imageData.height) {
        const edgeStrength = this.getEdgeStrength(imageData, x, y);
        if (edgeStrength > 15) {
          edgePoints++;
        }
      }
    }
    
    return edgePoints >= totalPoints * 0.6;
  }

  isTriangleShape(imageData, centerX, centerY, size) {
    // Verificar se há uma forma triangular (botão play)
    const points = [
      [centerX - size/2, centerY - size/2],
      [centerX - size/2, centerY + size/2],
      [centerX + size/2, centerY]
    ];
    
    let edgePoints = 0;
    for (const [x, y] of points) {
      if (x >= 0 && x < imageData.width && y >= 0 && y < imageData.height) {
        const edgeStrength = this.getEdgeStrength(imageData, Math.floor(x), Math.floor(y));
        if (edgeStrength > 20) {
          edgePoints++;
        }
      }
    }
    
    return edgePoints >= 2;
  }

  calculateConfidence(results) {
    let confidence = 0;
    
    // URLs encontradas aumentam muito a confiança
    if (results.urls.length > 0) {
      confidence += 0.8;
    }
    
    // Domínios encontrados
    if (results.domains.length > 0) {
      confidence += 0.6;
    }
    
    // Software detectado visualmente
    if (results.software.length > 0) {
      const maxSoftwareConfidence = Math.max(...results.software.map(s => s.confidence));
      confidence += maxSoftwareConfidence * 0.8; // Aumentar peso da detecção visual
    }
    
    // Se detectou navegador, adicionar domínio MSN baseado em heurística
    const browserDetected = results.software.some(s => s.name === 'Navegador Web' || s.name === 'MSN/Bing');
    if (browserDetected && results.domains.length === 0) {
      // Inferir MSN se detectou interface MSN
      const msnDetected = results.software.some(s => s.name === 'MSN/Bing');
      if (msnDetected) {
        results.domains.push('msn.com');
        confidence += 0.5;
      }
    }
    
    return Math.min(confidence, 1);
  }

  // Método para mapear domínios para nomes conhecidos
  mapDomainToService(domain) {
    const cleanDomain = domain.toLowerCase().replace('www.', '');
    
    for (const [knownDomain, serviceName] of Object.entries(this.patterns.knownDomains)) {
      if (cleanDomain.includes(knownDomain)) {
        return serviceName;
      }
    }
    
    return cleanDomain;
  }
}

export default URLSoftwareDetector;
