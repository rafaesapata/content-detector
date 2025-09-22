/**
 * Detector de Ociosidade - Análise de Screenshots Sequenciais
 * Compara screenshots para identificar períodos de inatividade
 */

class IdlenessDetector {
  constructor() {
    this.screenshots = []
    // Parâmetros configuráveis via .env
    this.threshold = parseFloat(import.meta.env.VITE_IDLENESS_CHANGE_THRESHOLD) || 0.05
    this.maxIdleTime = parseInt(import.meta.env.VITE_IDLENESS_MAX_IDLE_TIME) || (5 * 60 * 1000)
  }

  /**
   * Adiciona um screenshot para análise
   * @param {File} file - Arquivo de imagem
   */
  async addScreenshot(file) {
    try {
      // Extrair timestamp do nome do arquivo
      const timestamp = this.extractTimestamp(file.name)
      if (!timestamp) {
        throw new Error(`Formato de timestamp inválido: ${file.name}`)
      }

      // Processar imagem
      const imageData = await this.processImage(file)
      
      const screenshot = {
        filename: file.name,
        timestamp: timestamp,
        imageData: imageData,
        hash: this.calculateHash(imageData),
        regions: this.analyzeRegions(imageData)
      }

      this.screenshots.push(screenshot)
      this.screenshots.sort((a, b) => a.timestamp - b.timestamp)
      
      console.log(`📸 Screenshot adicionado: ${file.name} (${timestamp.toLocaleTimeString()})`)
      
    } catch (error) {
      console.error(`❌ Erro ao processar screenshot ${file.name}:`, error)
      throw error
    }
  }

  /**
   * Extrai timestamp do nome do arquivo
   * Formato esperado: nome_AAAAMMDDHHMMSS.ext
   */
  extractTimestamp(filename) {
    const match = filename.match(/_(\d{14})/)
    if (!match) return null

    const timestampStr = match[1]
    const year = parseInt(timestampStr.substring(0, 4))
    const month = parseInt(timestampStr.substring(4, 6)) - 1 // JS months são 0-indexed
    const day = parseInt(timestampStr.substring(6, 8))
    const hour = parseInt(timestampStr.substring(8, 10))
    const minute = parseInt(timestampStr.substring(10, 12))
    const second = parseInt(timestampStr.substring(12, 14))

    return new Date(year, month, day, hour, minute, second)
  }

  /**
   * Processa imagem e extrai dados para análise
   */
  async processImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      img.onload = () => {
        // Redimensionar para otimizar performance (configurável via .env)
        const maxSize = parseInt(import.meta.env.VITE_IDLENESS_MAX_RESOLUTION) || 800
        let { width, height } = img
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        const imageData = ctx.getImageData(0, 0, width, height)
        resolve(imageData)
      }

      img.onerror = () => reject(new Error('Erro ao carregar imagem'))
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Calcula hash simples da imagem para comparação rápida
   */
  calculateHash(imageData) {
    let hash = 0
    const data = imageData.data
    
    // Amostragem para performance (a cada 100 pixels)
    for (let i = 0; i < data.length; i += 400) {
      hash = ((hash << 5) - hash + data[i]) & 0xffffffff
    }
    
    return hash
  }

  /**
   * Divide imagem em regiões e analisa características
   */
  analyzeRegions(imageData) {
    const regions = []
    const { width, height, data } = imageData
    
    // Dividir em grid 3x3
    const regionWidth = Math.floor(width / 3)
    const regionHeight = Math.floor(height / 3)

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const regionId = row * 3 + col
        const x = col * regionWidth
        const y = row * regionHeight
        
        const region = this.analyzeRegion(data, x, y, regionWidth, regionHeight, width)
        regions.push({
          id: regionId,
          x, y, width: regionWidth, height: regionHeight,
          ...region
        })
      }
    }

    return regions
  }

  /**
   * Analisa uma região específica da imagem
   */
  analyzeRegion(data, startX, startY, regionWidth, regionHeight, imageWidth) {
    let totalR = 0, totalG = 0, totalB = 0
    let pixelCount = 0
    let luminanceSum = 0
    let luminanceSquaredSum = 0
    let edgeCount = 0

    for (let y = startY; y < startY + regionHeight; y++) {
      for (let x = startX; x < startX + regionWidth; x++) {
        const index = (y * imageWidth + x) * 4
        
        if (index + 2 < data.length) {
          const r = data[index]
          const g = data[index + 1]
          const b = data[index + 2]
          
          totalR += r
          totalG += g
          totalB += b
          
          // Calcular luminância
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b
          luminanceSum += luminance
          luminanceSquaredSum += luminance * luminance
          
          // Detectar bordas (diferença com pixel adjacente)
          if (x < startX + regionWidth - 1) {
            const nextIndex = (y * imageWidth + (x + 1)) * 4
            if (nextIndex + 2 < data.length) {
              const nextLuminance = 0.299 * data[nextIndex] + 0.587 * data[nextIndex + 1] + 0.114 * data[nextIndex + 2]
              if (Math.abs(luminance - nextLuminance) > 30) {
                edgeCount++
              }
            }
          }
          
          pixelCount++
        }
      }
    }

    if (pixelCount === 0) {
      return {
        averageColor: { r: 0, g: 0, b: 0 },
        variance: 0,
        edgeCount: 0
      }
    }

    const avgR = Math.round(totalR / pixelCount)
    const avgG = Math.round(totalG / pixelCount)
    const avgB = Math.round(totalB / pixelCount)
    
    const avgLuminance = luminanceSum / pixelCount
    const variance = (luminanceSquaredSum / pixelCount) - (avgLuminance * avgLuminance)
    const normalizedEdgeCount = edgeCount / pixelCount

    return {
      averageColor: { r: avgR, g: avgG, b: avgB },
      variance: variance,
      edgeCount: normalizedEdgeCount
    }
  }

  /**
   * Compara dois screenshots e calcula diferença
   */
  compareScreenshots(screenshot1, screenshot2) {
    // Comparação rápida por hash
    if (screenshot1.hash === screenshot2.hash) {
      return { difference: 0.0, details: 'Imagens idênticas' }
    }

    // Comparação detalhada por regiões
    const regionDifferences = []
    let totalDifference = 0

    for (let i = 0; i < screenshot1.regions.length; i++) {
      const region1 = screenshot1.regions[i]
      const region2 = screenshot2.regions[i]

      // Diferença de cor
      const colorDiff = this.calculateColorDifference(region1.averageColor, region2.averageColor)
      
      // Diferença de variância (textura)
      const varianceDiff = Math.abs(region1.variance - region2.variance) / Math.max(region1.variance, region2.variance, 1)
      
      // Diferença de bordas
      const edgeDiff = Math.abs(region1.edgeCount - region2.edgeCount)

      // Combinar diferenças com pesos
      const regionDifference = (colorDiff * 0.5) + (varianceDiff * 0.3) + (edgeDiff * 0.2)

      regionDifferences.push({
        regionId: i,
        difference: regionDifference,
        colorDiff,
        varianceDiff,
        edgeDiff
      })

      totalDifference += regionDifference
    }

    return {
      difference: totalDifference / screenshot1.regions.length,
      regions: regionDifferences,
      significantChanges: regionDifferences.filter(r => r.difference > this.threshold)
    }
  }

  /**
   * Calcula diferença entre duas cores
   */
  calculateColorDifference(color1, color2) {
    const rDiff = Math.abs(color1.r - color2.r) / 255
    const gDiff = Math.abs(color1.g - color2.g) / 255
    const bDiff = Math.abs(color1.b - color2.b) / 255
    
    return (rDiff + gDiff + bDiff) / 3
  }

  /**
   * Analisa ociosidade baseado nos screenshots coletados
   */
  analyzeIdleness() {
    if (this.screenshots.length < 2) {
      return {
        isIdle: false,
        idlenessPercentage: 0,
        totalIdleTime: 0,
        totalActiveTime: 0,
        longIdlePeriods: [],
        analysis: {
          totalScreenshots: this.screenshots.length,
          timeSpan: 0,
          averageInterval: 0
        },
        summary: 'Dados insuficientes para análise (mínimo 2 screenshots)'
      }
    }

    const comparisons = []
    let totalIdleTime = 0
    let totalActiveTime = 0
    const longIdlePeriods = []
    let currentIdlePeriod = null

    // Comparar screenshots consecutivos
    for (let i = 1; i < this.screenshots.length; i++) {
      const prev = this.screenshots[i - 1]
      const current = this.screenshots[i]
      
      const comparison = this.compareScreenshots(prev, current)
      const timeDiff = current.timestamp - prev.timestamp
      const isActive = comparison.difference >= this.threshold

      comparisons.push({
        from: prev.filename,
        to: current.filename,
        timeDiff,
        difference: comparison.difference,
        isActive,
        significantChanges: comparison.significantChanges ? comparison.significantChanges.length : 0
      })

      if (isActive) {
        totalActiveTime += timeDiff
        
        // Finalizar período ocioso se existir
        if (currentIdlePeriod) {
          currentIdlePeriod.end = prev.timestamp
          currentIdlePeriod.duration = currentIdlePeriod.end - currentIdlePeriod.start
          
          if (currentIdlePeriod.duration >= this.maxIdleTime) {
            longIdlePeriods.push(currentIdlePeriod)
          }
          
          currentIdlePeriod = null
        }
      } else {
        totalIdleTime += timeDiff
        
        // Iniciar novo período ocioso
        if (!currentIdlePeriod) {
          currentIdlePeriod = {
            start: prev.timestamp,
            end: null,
            duration: 0
          }
        }
      }
    }

    // Finalizar último período ocioso se existir
    if (currentIdlePeriod) {
      currentIdlePeriod.end = this.screenshots[this.screenshots.length - 1].timestamp
      currentIdlePeriod.duration = currentIdlePeriod.end - currentIdlePeriod.start
      
      if (currentIdlePeriod.duration >= this.maxIdleTime) {
        longIdlePeriods.push(currentIdlePeriod)
      }
    }

    // Análise detalhada de tempo de ociosidade
    const timeAnalysis = this.analyzeIdleTimeDetails(comparisons, totalIdleTime, totalActiveTime)

    const totalTime = totalIdleTime + totalActiveTime
    const idlenessPercentage = totalTime > 0 ? (totalIdleTime / totalTime) * 100 : 0
    // Thresholds configuráveis via .env
    const highIdlenessThreshold = parseFloat(import.meta.env.VITE_IDLENESS_HIGH_THRESHOLD) || 70;
    const moderateIdlenessThreshold = parseFloat(import.meta.env.VITE_IDLENESS_MODERATE_THRESHOLD) || 40;
    const isIdle = idlenessPercentage > highIdlenessThreshold

    // Análise temporal
    const firstTime = this.screenshots[0].timestamp
    const lastTime = this.screenshots[this.screenshots.length - 1].timestamp
    const timeSpan = lastTime - firstTime
    const averageInterval = timeSpan / (this.screenshots.length - 1)

    // Gerar resumo
    let summary = ''
    if (isIdle) {
      summary = `Alta ociosidade detectada (${idlenessPercentage.toFixed(1)}%). Usuário predominantemente inativo.`
    } else if (idlenessPercentage > moderateIdlenessThreshold) {
      summary = `Ociosidade moderada (${idlenessPercentage.toFixed(1)}%). Períodos de inatividade identificados.`
    } else {
      summary = `Atividade normal (${idlenessPercentage.toFixed(1)}% ocioso). Usuário ativo e produtivo.`
    }

    if (longIdlePeriods.length > 0) {
      summary += ` ${longIdlePeriods.length} período(s) longo(s) de inatividade detectado(s).`
    }

    return {
      isIdle,
      idlenessPercentage,
      totalIdleTime,
      totalActiveTime,
      longIdlePeriods,
      comparisons,
      timeAnalysis, // Nova análise detalhada
      analysis: {
        totalScreenshots: this.screenshots.length,
        timeSpan,
        averageInterval
      },
      summary
    }
  }

  /**
   * Análise detalhada de tempo de ociosidade
   * @param {Array} comparisons - Comparações entre screenshots
   * @param {number} totalIdleTime - Tempo total ocioso
   * @param {number} totalActiveTime - Tempo total ativo
   * @returns {Object} Análise detalhada
   */
  analyzeIdleTimeDetails(comparisons, totalIdleTime, totalActiveTime) {
    const analysis = {
      // Contadores básicos
      totalIdleTime,
      totalActiveTime,
      totalTime: totalIdleTime + totalActiveTime,
      
      // Contadores específicos
      veryLowActivityTime: 0,    // Movimento mínimo (0.01-0.05)
      lowActivityTime: 0,        // Movimento baixo (0.05-0.15)
      moderateActivityTime: 0,   // Movimento moderado (0.15-0.30)
      highActivityTime: 0,       // Movimento alto (>0.30)
      
      // Períodos contínuos
      idlePeriods: [],
      activePeriods: [],
      
      // Estatísticas por horário
      hourlyActivity: {},
      
      // Padrões de trabalho
      workPatterns: {
        consecutiveIdleMinutes: 0,
        longestIdlePeriod: 0,
        averageIdleInterval: 0,
        productiveHours: [],
        unproductiveHours: []
      }
    }

    // Analisar cada comparação
    let currentPeriod = null
    let currentPeriodType = null

    for (let i = 0; i < comparisons.length; i++) {
      const comp = comparisons[i]
      const hour = new Date(comp.timeDiff > 0 ? 
        this.screenshots[i].timestamp : 
        this.screenshots[i + 1].timestamp
      ).getHours()
      
      // Inicializar estatísticas horárias
      if (!analysis.hourlyActivity[hour]) {
        analysis.hourlyActivity[hour] = {
          totalTime: 0,
          idleTime: 0,
          activeTime: 0,
          veryLowActivity: 0,
          lowActivity: 0,
          moderateActivity: 0,
          highActivity: 0,
          screenshots: 0
        }
      }

      analysis.hourlyActivity[hour].totalTime += comp.timeDiff
      analysis.hourlyActivity[hour].screenshots++

      // Classificar nível de atividade (configurável via .env)
      const veryLowThreshold = parseFloat(import.meta.env.VITE_VERY_LOW_ACTIVITY_THRESHOLD) || 0.01;
      const lowThreshold = parseFloat(import.meta.env.VITE_LOW_ACTIVITY_THRESHOLD) || 0.05;
      const moderateThreshold = parseFloat(import.meta.env.VITE_MODERATE_ACTIVITY_THRESHOLD) || 0.15;
      const highThreshold = parseFloat(import.meta.env.VITE_HIGH_ACTIVITY_THRESHOLD) || 0.30;

      if (comp.difference < veryLowThreshold) {
        // Praticamente sem movimento
        analysis.veryLowActivityTime += comp.timeDiff
        analysis.hourlyActivity[hour].veryLowActivity += comp.timeDiff
        analysis.hourlyActivity[hour].idleTime += comp.timeDiff
      } else if (comp.difference < this.threshold) {
        // Movimento mínimo (ainda considerado ocioso)
        analysis.veryLowActivityTime += comp.timeDiff
        analysis.hourlyActivity[hour].veryLowActivity += comp.timeDiff
        analysis.hourlyActivity[hour].idleTime += comp.timeDiff
      } else if (comp.difference < moderateThreshold) {
        // Movimento baixo
        analysis.lowActivityTime += comp.timeDiff
        analysis.hourlyActivity[hour].lowActivity += comp.timeDiff
        analysis.hourlyActivity[hour].activeTime += comp.timeDiff
      } else if (comp.difference < highThreshold) {
        // Movimento moderado
        analysis.moderateActivityTime += comp.timeDiff
        analysis.hourlyActivity[hour].moderateActivity += comp.timeDiff
        analysis.hourlyActivity[hour].activeTime += comp.timeDiff
      } else {
        // Movimento alto
        analysis.highActivityTime += comp.timeDiff
        analysis.hourlyActivity[hour].highActivity += comp.timeDiff
        analysis.hourlyActivity[hour].activeTime += comp.timeDiff
      }

      // Rastrear períodos contínuos
      const isIdle = comp.difference < this.threshold
      
      if (currentPeriodType !== (isIdle ? 'idle' : 'active')) {
        // Finalizar período anterior
        if (currentPeriod) {
          currentPeriod.end = this.screenshots[i].timestamp
          currentPeriod.duration = currentPeriod.end - currentPeriod.start
          
          if (currentPeriodType === 'idle') {
            analysis.idlePeriods.push(currentPeriod)
          } else {
            analysis.activePeriods.push(currentPeriod)
          }
        }
        
        // Iniciar novo período
        currentPeriod = {
          start: this.screenshots[i].timestamp,
          end: null,
          duration: 0,
          averageDifference: comp.difference,
          screenshots: 1
        }
        currentPeriodType = isIdle ? 'idle' : 'active'
      } else if (currentPeriod) {
        // Continuar período atual
        currentPeriod.averageDifference = 
          (currentPeriod.averageDifference * currentPeriod.screenshots + comp.difference) / 
          (currentPeriod.screenshots + 1)
        currentPeriod.screenshots++
      }
    }

    // Finalizar último período
    if (currentPeriod && this.screenshots.length > 0) {
      currentPeriod.end = this.screenshots[this.screenshots.length - 1].timestamp
      currentPeriod.duration = currentPeriod.end - currentPeriod.start
      
      if (currentPeriodType === 'idle') {
        analysis.idlePeriods.push(currentPeriod)
      } else {
        analysis.activePeriods.push(currentPeriod)
      }
    }

    // Calcular estatísticas de padrões de trabalho
    this.calculateWorkPatterns(analysis)
    
    return analysis
  }

  /**
   * Calcular padrões de trabalho baseados na análise
   * @param {Object} analysis - Análise de tempo
   */
  calculateWorkPatterns(analysis) {
    const patterns = analysis.workPatterns

    // Maior período ocioso
    patterns.longestIdlePeriod = Math.max(
      ...analysis.idlePeriods.map(p => p.duration),
      0
    )

    // Tempo ocioso consecutivo em minutos
    patterns.consecutiveIdleMinutes = Math.floor(patterns.longestIdlePeriod / (60 * 1000))

    // Intervalo médio de ociosidade
    if (analysis.idlePeriods.length > 0) {
      patterns.averageIdleInterval = analysis.idlePeriods.reduce((sum, p) => sum + p.duration, 0) / analysis.idlePeriods.length
    }

    // Horas produtivas vs improdutivas (configurável via .env)
    const productiveThreshold = parseFloat(import.meta.env.VITE_PRODUCTIVE_HOUR_THRESHOLD) || 0.6;
    const unproductiveThreshold = parseFloat(import.meta.env.VITE_UNPRODUCTIVE_HOUR_THRESHOLD) || 0.3;

    Object.entries(analysis.hourlyActivity).forEach(([hour, data]) => {
      const productivityRatio = data.activeTime / (data.totalTime || 1)
      
      if (productivityRatio > productiveThreshold) {
        patterns.productiveHours.push({
          hour: parseInt(hour),
          productivity: productivityRatio,
          totalTime: data.totalTime,
          activeTime: data.activeTime
        })
      } else if (productivityRatio < unproductiveThreshold) {
        patterns.unproductiveHours.push({
          hour: parseInt(hour),
          productivity: productivityRatio,
          totalTime: data.totalTime,
          idleTime: data.idleTime
        })
      }
    })

    // Ordenar por produtividade
    patterns.productiveHours.sort((a, b) => b.productivity - a.productivity)
    patterns.unproductiveHours.sort((a, b) => a.productivity - b.productivity)
  }

  /**
   * Formatar duração em formato legível
   * @param {number} milliseconds - Duração em milissegundos
   * @returns {string} Duração formatada
   */
  formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  /**
   * Limpar todos os screenshots armazenados
   */
  clear() {
    this.screenshots = []
    console.log('🧹 Detector de ociosidade limpo')
  }
}

export default IdlenessDetector
