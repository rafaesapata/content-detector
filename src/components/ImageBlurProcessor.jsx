/**
 * Processador de Borramento de Imagens
 * Aplica borramento automático em conteúdo detectado como NSFW ou jogos
 * Mantém identificação superficial para validação de evidências
 */

class ImageBlurProcessor {
  constructor() {
    this.blurLevels = {
      light: 3,      // Borramento leve para jogos
      medium: 8,     // Borramento médio para conteúdo sexy
      heavy: 15,     // Borramento pesado para conteúdo explícito
      extreme: 25    // Borramento extremo para conteúdo muito explícito
    }
  }

  /**
   * Determinar nível de borramento baseado na detecção
   * @param {Object} results - Resultados da detecção NSFW
   * @param {Object} gameResults - Resultados da detecção de jogos
   * @param {boolean} isLikelyGame - Se é provável que seja um jogo
   * @returns {string|null} Nível de borramento ou null se não aplicar
   */
  determineBlurLevel(results, gameResults, isLikelyGame) {
    // Configurações via .env
    const blurGames = import.meta.env.VITE_BLUR_GAMES !== 'false';
    const blurNSFW = import.meta.env.VITE_BLUR_NSFW !== 'false';
    const gameBlurLevel = import.meta.env.VITE_GAME_BLUR_LEVEL || 'light';
    
    if (!blurGames && !blurNSFW) return null;

    // Verificar conteúdo NSFW primeiro (prioridade mais alta)
    if (blurNSFW && results) {
      const pornProb = results.find(r => r.className === 'Porn')?.probability || 0;
      const hentaiProb = results.find(r => r.className === 'Hentai')?.probability || 0;
      const sexyProb = results.find(r => r.className === 'Sexy')?.probability || 0;

      // Thresholds configuráveis
      const pornThreshold = parseFloat(import.meta.env.VITE_NSFW_PORN_THRESHOLD) || 0.5;
      const hentaiThreshold = parseFloat(import.meta.env.VITE_NSFW_HENTAI_THRESHOLD) || 0.5;
      const sexyThreshold = parseFloat(import.meta.env.VITE_NSFW_SEXY_THRESHOLD) || 0.7;

      // Conteúdo explícito - borramento extremo
      if (pornProb > pornThreshold || hentaiProb > hentaiThreshold) {
        if (pornProb > 0.8 || hentaiProb > 0.8) {
          return 'extreme';
        }
        return 'heavy';
      }

      // Conteúdo sexy - borramento médio
      if (sexyProb > sexyThreshold) {
        if (sexyProb > 0.9) {
          return 'heavy';
        }
        return 'medium';
      }
    }

    // Verificar jogos
    if (blurGames && isLikelyGame) {
      return gameBlurLevel;
    }

    return null;
  }

  /**
   * Aplicar borramento na imagem
   * @param {HTMLImageElement} imageElement - Elemento da imagem
   * @param {string} blurLevel - Nível de borramento
   * @returns {Promise<string>} URL da imagem borrada
   */
  async applyBlur(imageElement, blurLevel) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Usar dimensões originais
      canvas.width = imageElement.naturalWidth || imageElement.width;
      canvas.height = imageElement.naturalHeight || imageElement.height;
      
      // Aplicar filtro de borramento
      const blurValue = this.blurLevels[blurLevel] || this.blurLevels.medium;
      ctx.filter = `blur(${blurValue}px)`;
      
      // Desenhar imagem borrada
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
      
      // Adicionar marca d'água de evidência
      this.addEvidenceWatermark(ctx, canvas.width, canvas.height, blurLevel);
      
      // Converter para URL
      const blurredDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      resolve(blurredDataUrl);
    });
  }

  /**
   * Adicionar marca d'água de evidência
   * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
   * @param {number} width - Largura da imagem
   * @param {number} height - Altura da imagem
   * @param {string} blurLevel - Nível de borramento
   */
  addEvidenceWatermark(ctx, width, height, blurLevel) {
    // Configurações da marca d'água
    const showWatermark = import.meta.env.VITE_SHOW_EVIDENCE_WATERMARK !== 'false';
    if (!showWatermark) return;

    // Resetar filtros para a marca d'água
    ctx.filter = 'none';
    
    // Configurar texto
    const fontSize = Math.max(12, Math.min(width, height) * 0.03);
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    
    // Textos da marca d'água
    const timestamp = new Date().toLocaleString('pt-BR');
    const detectionText = this.getDetectionText(blurLevel);
    const evidenceText = 'EVIDÊNCIA PROCESSADA';
    
    // Posições
    const centerX = width / 2;
    const bottomY = height - 20;
    const middleY = height / 2;
    
    // Desenhar marca d'água no centro
    ctx.strokeText(evidenceText, centerX, middleY - fontSize);
    ctx.fillText(evidenceText, centerX, middleY - fontSize);
    
    ctx.strokeText(detectionText, centerX, middleY);
    ctx.fillText(detectionText, centerX, middleY);
    
    // Desenhar timestamp no rodapé
    ctx.font = `${fontSize * 0.7}px Arial`;
    ctx.strokeText(timestamp, centerX, bottomY);
    ctx.fillText(timestamp, centerX, bottomY);
    
    // Adicionar cantos com identificação
    this.addCornerMarkers(ctx, width, height, blurLevel);
  }

  /**
   * Obter texto de detecção baseado no nível de borramento
   * @param {string} blurLevel - Nível de borramento
   * @returns {string} Texto descritivo
   */
  getDetectionText(blurLevel) {
    const texts = {
      light: 'CONTEÚDO DE JOGO DETECTADO',
      medium: 'CONTEÚDO INAPROPRIADO DETECTADO',
      heavy: 'CONTEÚDO EXPLÍCITO DETECTADO',
      extreme: 'CONTEÚDO ALTAMENTE EXPLÍCITO'
    };
    
    return texts[blurLevel] || 'CONTEÚDO FILTRADO';
  }

  /**
   * Adicionar marcadores nos cantos
   * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
   * @param {number} width - Largura da imagem
   * @param {number} height - Altura da imagem
   * @param {string} blurLevel - Nível de borramento
   */
  addCornerMarkers(ctx, width, height, blurLevel) {
    const showCorners = import.meta.env.VITE_SHOW_CORNER_MARKERS !== 'false';
    if (!showCorners) return;

    // Cores por nível
    const colors = {
      light: '#FFA500',    // Laranja para jogos
      medium: '#FF6B6B',   // Vermelho claro para sexy
      heavy: '#FF0000',    // Vermelho para explícito
      extreme: '#8B0000'   // Vermelho escuro para muito explícito
    };

    const color = colors[blurLevel] || '#FF6B6B';
    const size = Math.max(10, Math.min(width, height) * 0.02);
    
    // Configurar estilo
    ctx.fillStyle = color;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    
    // Desenhar círculos nos cantos
    const positions = [
      [size, size],                    // Superior esquerdo
      [width - size, size],            // Superior direito
      [size, height - size],           // Inferior esquerdo
      [width - size, height - size]    // Inferior direito
    ];
    
    positions.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });
  }

  /**
   * Criar versão borrada para download
   * @param {HTMLImageElement} imageElement - Elemento da imagem
   * @param {string} blurLevel - Nível de borramento
   * @param {string} originalFilename - Nome do arquivo original
   * @returns {Promise<Object>} Objeto com URL e nome do arquivo
   */
  async createBlurredVersion(imageElement, blurLevel, originalFilename) {
    const blurredUrl = await this.applyBlur(imageElement, blurLevel);
    
    // Gerar nome do arquivo com sufixo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = originalFilename.replace(/\.[^/.]+$/, '');
    const extension = originalFilename.split('.').pop();
    const blurredFilename = `${baseName}_BORRADO_${blurLevel.toUpperCase()}_${timestamp}.${extension}`;
    
    return {
      url: blurredUrl,
      filename: blurredFilename,
      level: blurLevel,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Verificar se deve aplicar borramento
   * @param {Object} results - Resultados NSFW
   * @param {Object} gameResults - Resultados de jogos
   * @param {boolean} isLikelyGame - Se é provável que seja jogo
   * @returns {boolean} Se deve aplicar borramento
   */
  shouldBlur(results, gameResults, isLikelyGame) {
    return this.determineBlurLevel(results, gameResults, isLikelyGame) !== null;
  }

  /**
   * Obter estatísticas de borramento
   * @param {string} blurLevel - Nível de borramento
   * @returns {Object} Estatísticas
   */
  getBlurStats(blurLevel) {
    return {
      level: blurLevel,
      intensity: this.blurLevels[blurLevel],
      description: this.getDetectionText(blurLevel),
      timestamp: new Date().toISOString(),
      processor: 'ImageBlurProcessor v1.0'
    };
  }
}

export default ImageBlurProcessor
