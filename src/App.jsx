import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Upload, AlertTriangle, CheckCircle, X, Gamepad2, Globe, Monitor, Eye, EyeOff, Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import * as nsfwjs from 'nsfwjs'
import GameDetectorImproved from './components/GameDetectorImproved.jsx'
import URLSoftwareDetector from './components/URLSoftwareDetector.jsx'
import IdlenessDetector from './components/IdlenessDetector.jsx'
import ImageBlurProcessor from './components/ImageBlurProcessor.jsx'
import JSZip from 'jszip'
import './App.css'

// Função para sanitizar strings removendo caracteres nulos e inválidos
const sanitizeString = (str) => {
  if (!str) return ''
  return str.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [model, setModel] = useState(null)
  const [gameDetector, setGameDetector] = useState(null)
  const [urlDetector, setUrlDetector] = useState(null)
  const [results, setResults] = useState(null)
  const [gameResults, setGameResults] = useState(null)
  const [urlResults, setUrlResults] = useState(null)
  const [idlenessDetector, setIdlenessDetector] = useState(null)
  const [idlenessResults, setIdlenessResults] = useState(null)
  const [screenshotMode, setScreenshotMode] = useState(false)
  const [blurProcessor, setBlurProcessor] = useState(null)
  const [blurredImage, setBlurredImage] = useState(null)
  const [showOriginal, setShowOriginal] = useState(false)
  const [error, setError] = useState(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const fileInputRef = useRef(null)
  const imageRef = useRef(null)

  // Carregar modelos NSFWJS e Game Detector
  const loadModel = async () => {
    try {
      setIsLoading(true)
      setLoadingProgress(10)
      
      // Carregar modelo NSFW
      const loadedModel = await nsfwjs.load()
      setModel(loadedModel)
      // Carregar detector de jogos melhorado
      console.log('🎮 Carregando detector de jogos melhorado...')
      const gameDetectorInstance = new GameDetectorImproved()
      await gameDetectorInstance.load()
      setGameDetector(gameDetectorInstance)
      setLoadingProgress(66)
      
      // Carregar detector de URL/software
      const urlDetectorInstance = new URLSoftwareDetector()
      await urlDetectorInstance.load()
      setUrlDetector(urlDetectorInstance)
      setLoadingProgress(80)
      
      // Carregar detector de ociosidade
      const idlenessDetectorInstance = new IdlenessDetector()
      setIdlenessDetector(idlenessDetectorInstance)
      setLoadingProgress(90)
      
      // Carregar processador de borramento
      const blurProcessorInstance = new ImageBlurProcessor()
      setBlurProcessor(blurProcessorInstance)
      setLoadingProgress(100)
      
      setError(null)
    } catch (err) {
      setError(`Erro ao carregar modelos: ${sanitizeString(err.message)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Proces  // Selecionar arquivo(s)
  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files)
    if (!files.length) return
    
    if (screenshotMode) {
      // Verificar se é um arquivo ZIP
      const zipFile = files.find(file => file.name.toLowerCase().endsWith('.zip'))
      if (zipFile) {
        await handleZipFile(zipFile)
      } else if (files.length > 1) {
        // Múltiplos arquivos de imagem
        await handleMultipleScreenshots(files)
      } else {
        // Um único arquivo de imagem no modo screenshot
        await handleMultipleScreenshots(files)
      }
    } else {
      // Modo normal: processar um arquivo
      const file = files[0]
      
      // Validar tipo de arquivo
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        setError('Apenas arquivos JPG e PNG são aceitos')
        return
      }

      // Validar tamanho (configurável via .env)
      const maxSizeMB = import.meta.env.VITE_MAX_FILE_SIZE_MB || 10;
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`Arquivo muito grande. Máximo ${maxSizeMB}MB`)
        return
      }

      setSelectedFile(file)
      setError(null)
      setResults(null)
      setGameResults(null)
      setUrlResults(null)
      setIdlenessResults(null)

      // Criar preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Processar arquivo ZIP
  const handleZipFile = async (zipFile) => {
    if (!idlenessDetector) {
      setError('Detector de ociosidade não foi inicializado')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      console.log(`📦 Extraindo arquivo ZIP: ${zipFile.name}`)
      
      // Ler arquivo ZIP
      const zip = new JSZip()
      const zipContent = await zip.loadAsync(zipFile)
      
      // Extrair arquivos de imagem
      const imageFiles = []
      const supportedExtensions = ['.jpg', '.jpeg', '.png']
      
      for (const [filename, file] of Object.entries(zipContent.files)) {
        if (!file.dir) {
          const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
          if (supportedExtensions.includes(extension)) {
            // Verificar se o nome tem o formato correto
            if (!filename.match(/_\d{14}/)) {
              console.warn(`⚠️ Arquivo ignorado (formato inválido): ${filename}`)
              continue
            }
            
            // Converter para Blob e depois para File
            const blob = await file.async('blob')
            const imageFile = new File([blob], filename, { type: `image/${extension.substring(1)}` })
            imageFiles.push(imageFile)
          }
        }
      }
      
      if (imageFiles.length === 0) {
        throw new Error('Nenhuma imagem válida encontrada no ZIP. Verifique se os nomes seguem o formato: nome_AAAAMMDDHHMMSS.ext')
      }
      
      console.log(`📸 Encontradas ${imageFiles.length} imagens válidas no ZIP`)
      
      // Processar imagens extraídas
      await handleMultipleScreenshots(imageFiles)
      
      // Marcar origem como ZIP nos resultados
      if (idlenessResults) {
        setIdlenessResults(prev => ({ ...prev, source: 'zip' }))
      }
      
    } catch (error) {
      console.error('❌ Erro ao processar arquivo ZIP:', error)
      setError(`Erro ao processar ZIP: ${error.message}`)
      setIsLoading(false)
    }
  }

  // Processar múltiplos screenshots para análise de ociosidade
  const handleMultipleScreenshots = async (files) => {
    if (!idlenessDetector) {
      setError('Detector de ociosidade não foi inicializado')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      console.log(`📸 Processando ${files.length} screenshots...`)
      
      // Validar formato dos nomes dos arquivos
      const invalidFiles = files.filter(file => !file.name.match(/_\d{14}/))
      if (invalidFiles.length > 0) {
        console.warn('⚠️ Arquivos com formato inválido encontrados:', invalidFiles.map(f => f.name))
        throw new Error(`Arquivos com formato inválido: ${invalidFiles.map(f => f.name).join(', ')}. Esperado: nome_AAAAMMDDHHMMSS.ext`)
      }
      
      // Ordenar arquivos por timestamp
      const sortedFiles = files.sort((a, b) => {
        const timestampA = a.name.match(/_(\d{14})/)?.[1] || '0'
        const timestampB = b.name.match(/_(\d{14})/)?.[1] || '0'
        return timestampA.localeCompare(timestampB)
      })
      
      console.log(`📊 Arquivos ordenados por timestamp:`, sortedFiles.map(f => f.name))
      
      // Limpar detector anterior
      idlenessDetector.clear()
      
      // Adicionar screenshots ao detector (usando arquivos ordenados)
      for (const file of sortedFiles) {
        await idlenessDetector.addScreenshot(file)
      }
      
      // Analisar ociosidade
      const analysis = idlenessDetector.analyzeIdleness()
      analysis.source = 'files' // Marcar origem como arquivos individuais
      setIdlenessResults(analysis)
      
      console.log('✅ Análise de ociosidade concluída:', analysis)
      
      // Criar preview do último screenshot (mais recente)
      const lastFile = sortedFiles[sortedFiles.length - 1]
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target.result)
      }
      reader.readAsDataURL(lastFile)
      setSelectedFile(lastFile)
      
    } catch (error) {
      console.error('❌ Erro ao processar screenshots:', error)
      setError(`Erro na análise de ociosidade: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Analisar imagem
  const analyzeImage = async () => {
    if (!selectedFile || !model || !gameDetector || !urlDetector) return

    try {
      setIsLoading(true)
      setError(null)

      // Aguardar carregamento da imagem
      await new Promise((resolve) => {
        if (imageRef.current.complete) {
          resolve()
        } else {
          imageRef.current.onload = resolve
        }
      })

      // Classificar NSFW
      const predictions = await model.classify(imageRef.current)
      
      // Sanitizar resultados NSFW
      const sanitizedResults = predictions.map(pred => ({
        className: sanitizeString(pred.className),
        probability: pred.probability
      }))

      setResults(sanitizedResults)

      // Detectar jogos
      try {
        const gameDetection = await gameDetector.classify(imageRef.current)
        setGameResults(gameDetection)
      } catch (gameErr) {
        console.warn('Erro na detecção de jogos:', gameErr)
        setGameResults({
          isGaming: false,
          confidence: 0,
          features: {}
        })
      }

      // Detectar URLs e software
      try {
        console.log('🔍 Iniciando detecção de URL/software...')
        const urlDetection = await urlDetector.analyze(imageRef.current)
        console.log('🔍 Resultado URL/software:', urlDetection)
        setUrlResults(urlDetection)
      } catch (urlErr) {
        console.error('❌ Erro na detecção de URL/software:', urlErr)
        setUrlResults({
          urls: [],
          domains: [],
          software: [],
          confidence: 0,
          error: urlErr.message
        })
      }

      // Processar borramento se necessário
      if (blurProcessor) {
        try {
          const isLikelyGame = gameDetection && (
            gameDetection.isGaming || 
            (sanitizedResults.find(r => r.className === 'Drawing')?.probability > (import.meta.env.VITE_GAME_DRAWING_THRESHOLD || 0.6) && 
             gameDetection.confidence > (import.meta.env.VITE_GAME_MIN_CONFIDENCE_FOR_DRAWING || 0.2))
          );

          if (blurProcessor.shouldBlur(sanitizedResults, gameDetection, isLikelyGame)) {
            const blurLevel = blurProcessor.determineBlurLevel(sanitizedResults, gameDetection, isLikelyGame);
            console.log(`🔒 Aplicando borramento nível: ${blurLevel}`);
            
            const blurredVersion = await blurProcessor.createBlurredVersion(
              imageRef.current, 
              blurLevel, 
              selectedFile.name
            );
            
            setBlurredImage(blurredVersion);
            console.log('🔒 Imagem borrada criada com sucesso');
          } else {
            setBlurredImage(null);
          }
        } catch (blurErr) {
          console.error('❌ Erro no processamento de borramento:', blurErr);
          setBlurredImage(null);
        }
      }
    } catch (err) {
      setError(`Erro na análise: ${sanitizeString(err.message)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Limpar seleção
  const clearSelection = () => {
    setSelectedFile(null)
    setPreview(null)
    setResults(null)
    setGameResults(null)
    setUrlResults(null)
    setIdlenessResults(null)
    setBlurredImage(null)
    setShowOriginal(false)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (idlenessDetector) {
      idlenessDetector.clear()
    }
  }

  // Determinar se conteúdo é NSFW
  const isNSFW = results && (
    results.find(r => r.className === 'Porn')?.probability > (import.meta.env.VITE_NSFW_PORN_THRESHOLD || 0.5) ||
    results.find(r => r.className === 'Hentai')?.probability > (import.meta.env.VITE_NSFW_HENTAI_THRESHOLD || 0.5) ||
    results.find(r => r.className === 'Sexy')?.probability > (import.meta.env.VITE_NSFW_SEXY_THRESHOLD || 0.7)
  )

  // Lógica melhorada para detecção de jogos considerando Drawing
  const isLikelyGame = results && gameResults && (
    gameResults.isGaming || 
    (results.find(r => r.className === 'Drawing')?.probability > (import.meta.env.VITE_GAME_DRAWING_THRESHOLD || 0.6) && 
     gameResults.confidence > (import.meta.env.VITE_GAME_MIN_CONFIDENCE_FOR_DRAWING || 0.2))
  )

  // Obter cor do badge baseado na categoria
  const getBadgeVariant = (className, probability) => {
    if (probability < (import.meta.env.VITE_NSFW_MIN_DISPLAY_THRESHOLD || 0.1)) return 'secondary'
    if (className === 'Porn' || className === 'Hentai') return 'destructive'
    if (className === 'Sexy' && probability > (import.meta.env.VITE_NSFW_SEXY_DESTRUCTIVE_THRESHOLD || 0.5)) return 'destructive'
    if (className === 'Drawing' || className === 'Neutral') return 'default'
    return 'secondary'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            {import.meta.env.VITE_APP_TITLE || 'Detector Inteligente'}
          </h1>
          <p className="text-slate-600">
            Análise completa: NSFW, jogos, URLs e software em imagens JPG/PNG
          </p>
        </div>

        {/* Carregar Modelo */}
        {!model && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Inicializar Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={loadModel}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Carregando...' : 'Carregar Modelos de IA'}
              </Button>
              {isLoading && (
                <div className="mt-4">
                  <Progress value={loadingProgress} className="w-full" />
                  <p className="text-sm text-slate-600 mt-2">
                    Carregando modelos de IA (NSFW, Jogos, URL/Software)...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upload de Arquivo */}
        {model && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Selecionar Imagem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Toggle para modo screenshot */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Modo Análise de Ociosidade</p>
                    <p className="text-sm text-slate-600">Analisar múltiplos screenshots ou ZIP</p>
                  </div>
                  <Button
                    onClick={() => setScreenshotMode(!screenshotMode)}
                    variant={screenshotMode ? "default" : "outline"}
                    size="sm"
                  >
                    {screenshotMode ? "Ativado" : "Desativado"}
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={screenshotMode ? ".jpg,.jpeg,.png,.zip" : ".jpg,.jpeg,.png"}
                  onChange={handleFileSelect}
                  multiple={screenshotMode}
                  className="hidden"
                />
                
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full h-20 border-dashed"
                >
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    {screenshotMode ? (
                      <>
                        <p>Selecionar Screenshots ou ZIP</p>
                        <p className="text-sm text-slate-500">Formato: nome_AAAAMMDDHHMMSS.ext</p>
                      </>
                    ) : (
                      <>
                        <p>Clique para selecionar JPG ou PNG</p>
                        <p className="text-sm text-slate-500">Máximo 10MB</p>
                      </>
                    )}
                  </div>
                </Button>

                {selectedFile && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium">
                      {sanitizeString(selectedFile.name)}
                    </span>
                    <Button
                      onClick={clearSelection}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview e Análise */}
        {preview && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Análise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Preview da Imagem */}
                <div className="relative">
                  <img
                    ref={imageRef}
                    src={blurredImage && !showOriginal ? blurredImage.url : preview}
                    alt="Preview"
                    className="w-full max-h-96 object-contain rounded-lg border"
                    crossOrigin="anonymous"
                  />
                  
                  {/* Controles de Visualização */}
                  {blurredImage && (
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        onClick={() => setShowOriginal(!showOriginal)}
                        variant={showOriginal ? "destructive" : "secondary"}
                        size="sm"
                        className="bg-white/90 hover:bg-white"
                      >
                        {showOriginal ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            Ocultar
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            Original
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = blurredImage.url;
                          link.download = blurredImage.filename;
                          link.click();
                        }}
                        variant="outline"
                        size="sm"
                        className="bg-white/90 hover:bg-white"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Baixar
                      </Button>
                    </div>
                  )}
                  
                  {/* Indicador de Borramento */}
                  {blurredImage && !showOriginal && (
                    <div className="absolute bottom-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      🔒 EVIDÊNCIA PROCESSADA - {blurredImage.level.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Controles e Resultados */}
                <div className="space-y-4">
                  <Button
                    onClick={analyzeImage}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Analisando...' : 'Analisar Imagem'}
                  </Button>

                  {/* Resultado Principal */}
                  {results && (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-lg border-2 ${
                        isNSFW 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-green-50 border-green-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {isNSFW ? (
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                          <span className={`font-bold ${
                            isNSFW ? 'text-red-800' : 'text-green-800'
                          }`}>
                            {isNSFW ? 'CONTEÚDO NSFW DETECTADO' : 'CONTEÚDO SEGURO'}
                          </span>
                        </div>
                      </div>

                      {/* Detecção de Jogos */}
                      {gameResults && (
                        <div className={`p-4 rounded-lg border-2 ${
                          isLikelyGame 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Gamepad2 className={`w-5 h-5 ${
                              isLikelyGame ? 'text-blue-600' : 'text-gray-600'
                            }`} />
                            <span className={`font-bold ${
                              isLikelyGame ? 'text-blue-800' : 'text-gray-800'
                            }`}>
                              {isLikelyGame ? 'TELA DE JOGO DETECTADA' : 'NÃO É TELA DE JOGO'}
                            </span>
                          </div>
                          <div className="text-sm text-slate-600">
                            Confiança: {(gameResults.confidence * 100).toFixed(1)}%
                            {results?.find(r => r.className === 'Drawing')?.probability > (parseFloat(import.meta.env.VITE_GAME_DRAWING_THRESHOLD) || 0.6) && (
                              <span className="ml-2 text-blue-600">
                                + Drawing: {(results.find(r => r.className === 'Drawing').probability * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Detecção de URL/Software - Sempre mostrar quando há análise */}
                      {urlResults && (
                        <div className="p-4 rounded-lg border-2 bg-purple-50 border-purple-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Globe className="w-5 h-5 text-purple-600" />
                            <span className="font-bold text-purple-800">
                              URL/SOFTWARE DETECTADO
                            </span>
                          </div>
                          
                          {urlResults.urls.length > 0 && (
                            <div className="mb-2">
                              <h5 className="font-semibold text-sm text-slate-700 mb-1">URLs:</h5>
                              {urlResults.urls.map((url, idx) => (
                                <div key={idx} className="text-sm text-slate-600 break-all">{url}</div>
                              ))}
                            </div>
                          )}
                          
                          {urlResults.domains.length > 0 && (
                            <div className="mb-2">
                              <h5 className="font-semibold text-sm text-slate-700 mb-1">Domínios:</h5>
                              <div className="flex flex-wrap gap-1">
                                {urlResults.domains.map((domain, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {urlDetector?.mapDomainToService(domain) || domain}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {urlResults.software.length > 0 && (
                            <div className="mb-2">
                              <h5 className="font-semibold text-sm text-slate-700 mb-1">Software:</h5>
                              <div className="flex flex-wrap gap-1">
                                {urlResults.software.slice(0, import.meta.env.VITE_UI_MAX_SOFTWARE_DISPLAY || 3).map((software, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    <Monitor className="w-3 h-3 mr-1" />
                                    {software.name} ({(software.confidence * 100).toFixed(0)}%)
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {urlResults.services && urlResults.services.length > 0 && (
                            <div className="mb-2">
                              <h5 className="font-semibold text-sm text-slate-700 mb-1">🔑 Serviços por Palavra-chave:</h5>
                              <div className="space-y-1">
                                {urlResults.services.slice(0, import.meta.env.VITE_UI_MAX_SERVICES_DISPLAY || 5).map((service, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-sm bg-blue-50 p-2 rounded border">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{service.name || service.service}</span>
                                      <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">
                                        {service.type === 'keyword_detection' ? '🔑' : service.type === 'visual_logo' ? '🎨' : '🔍'}
                                      </span>
                                    </div>
                                    <span className="text-xs text-blue-600 font-medium">
                                      {(service.confidence * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                ))}
                                {urlResults.services.length > (import.meta.env.VITE_UI_MAX_SERVICES_DISPLAY || 5) && (
                                  <div className="text-xs text-slate-500">
                                    +{urlResults.services.length - (import.meta.env.VITE_UI_MAX_SERVICES_DISPLAY || 5)} serviços adicionais...
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="text-sm text-slate-600">
                            Confiança geral: {(urlResults.confidence * 100).toFixed(1)}%
                          </div>
                          
                          {/* Mostrar erro se houver */}
                          {urlResults.error && (
                            <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-700">
                              <strong>Erro:</strong> {urlResults.error}
                            </div>
                          )}
                          
                          {/* Mostrar se não há resultados */}
                          {!urlResults.urls.length && !urlResults.domains.length && !urlResults.software.length && !urlResults.services?.length && !urlResults.error && (
                            <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-700">
                              Nenhuma URL ou software detectado nesta imagem.
                            </div>
                          )}
                          
                          {/* Logs de Detecção Visíveis */}
                          {window.softwareDetectionLogs && window.softwareDetectionLogs.length > 0 && (
                            <div className="mt-4 p-3 bg-slate-100 rounded-lg">
                              <h5 className="font-semibold text-sm text-slate-700 mb-2">📊 Logs de Detecção:</h5>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {window.softwareDetectionLogs.slice(0, import.meta.env.VITE_UI_MAX_DETECTION_LOGS || 5).map((log, idx) => (
                                  <div key={idx} className="text-xs bg-white p-2 rounded border">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-semibold text-slate-800">{log.software}</span>
                                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        log.decision === 'DETECTADO' 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {log.decision}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                                      <div>Cores: {(log.colorScore * 100).toFixed(1)}%</div>
                                      <div>UI: {(log.uiScore * 100).toFixed(1)}%</div>
                                      <div>Final: {(log.finalScore * 100).toFixed(1)}%</div>
                                    </div>
                                    {log.penalties && log.penalties.length > 0 && (
                                      <div className="mt-1 text-xs text-red-600">
                                        ⚠️ {log.penalties.slice(0, 2).join(', ')}
                                        {log.penalties.length > 2 && '...'}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 text-xs text-slate-500">
                                💡 Abra o Console (F12) para logs completos
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Informações sobre Borramento */}
                      {blurredImage && (
                        <div className="p-4 rounded-lg border-2 bg-orange-50 border-orange-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Eye className="w-5 h-5 text-orange-600" />
                            <span className="font-bold text-orange-800">
                              🔒 EVIDÊNCIA PROCESSADA
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-700">Nível de Borramento:</p>
                              <p className="text-lg font-bold text-orange-700 capitalize">{blurredImage.level}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-700">Intensidade:</p>
                              <p className="text-lg font-bold text-orange-700">
                                {blurProcessor?.blurLevels[blurredImage.level] || 'N/A'}px
                              </p>
                            </div>
                          </div>

                          <div className="mb-3">
                            <p className="text-sm font-semibold text-slate-700 mb-1">Motivo do Processamento:</p>
                            <p className="text-sm text-slate-600">
                              {blurProcessor?.getDetectionText(blurredImage.level)}
                            </p>
                          </div>

                          <div className="mb-3">
                            <p className="text-sm font-semibold text-slate-700 mb-1">Arquivo Processado:</p>
                            <p className="text-xs text-slate-600 break-all font-mono bg-white p-2 rounded border">
                              {blurredImage.filename}
                            </p>
                          </div>

                          <div className="text-xs text-slate-500 bg-white p-2 rounded border">
                            <strong>📋 Finalidade:</strong> Esta imagem foi automaticamente processada para preservar evidências 
                            mantendo identificação superficial do conteúdo. O borramento permite validação da acuidade 
                            dos resultados sem exposição completa do material detectado.
                          </div>

                          <div className="text-xs text-slate-500 mt-2">
                            🕒 Processado em: {new Date(blurredImage.timestamp).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      )}

                      {/* Resultados de Análise de Ociosidade */}
                      {idlenessResults && (
                        <div className={`p-4 rounded-lg border-2 mb-4 ${
                          idlenessResults.isIdle 
                            ? 'bg-red-50 border-red-200' 
                            : idlenessResults.idlenessPercentage > 40
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-green-50 border-green-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-3">
                            <Monitor className={`w-5 h-5 ${
                              idlenessResults.isIdle 
                                ? 'text-red-600' 
                                : idlenessResults.idlenessPercentage > 40
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            }`} />
                            <h4 className={`font-bold ${
                              idlenessResults.isIdle 
                                ? 'text-red-800' 
                                : idlenessResults.idlenessPercentage > 40
                                ? 'text-yellow-800'
                                : 'text-green-800'
                            }`}>
                              {idlenessResults.isIdle 
                                ? '🔴 ALTA OCIOSIDADE DETECTADA' 
                                : idlenessResults.idlenessPercentage > 40
                                ? '🟡 OCIOSIDADE MODERADA'
                                : '🟢 ATIVIDADE NORMAL'
                              }
                            </h4>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-sm font-semibold">Ociosidade Total:</p>
                              <p className="text-lg font-bold">{idlenessResults.idlenessPercentage.toFixed(1)}%</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">Screenshots:</p>
                              <p className="text-lg font-bold">{idlenessResults.analysis.totalScreenshots}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-sm font-semibold">Tempo Ativo:</p>
                              <p className="text-sm">{idlenessDetector?.formatDuration(idlenessResults.totalActiveTime)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">Tempo Ocioso:</p>
                              <p className="text-sm">{idlenessDetector?.formatDuration(idlenessResults.totalIdleTime)}</p>
                            </div>
                          </div>

                          {idlenessResults.longIdlePeriods.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-semibold text-red-700">
                                ⚠️ Períodos Longos de Inatividade ({idlenessResults.longIdlePeriods.length}):
                              </p>
                              {idlenessResults.longIdlePeriods.slice(0, 3).map((period, idx) => (
                                <div key={idx} className="text-xs bg-red-100 p-2 rounded mt-1">
                                  {period.start.toLocaleTimeString()} - {period.end.toLocaleTimeString()} 
                                  ({idlenessDetector?.formatDuration(period.duration)})
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Análise Detalhada de Tempo */}
                          {idlenessResults.timeAnalysis && (
                            <div className="mt-4 p-3 bg-slate-50 rounded-lg border">
                              <h5 className="font-semibold text-sm text-slate-800 mb-3">📊 Análise Detalhada de Tempo</h5>
                              
                              {/* Contadores de Atividade */}
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="bg-red-100 p-2 rounded text-xs">
                                  <div className="font-semibold text-red-800">Sem Movimento</div>
                                  <div>{idlenessDetector?.formatDuration(idlenessResults.timeAnalysis.veryLowActivityTime)}</div>
                                  <div className="text-red-600">
                                    {((idlenessResults.timeAnalysis.veryLowActivityTime / idlenessResults.timeAnalysis.totalTime) * 100).toFixed(1)}%
                                  </div>
                                </div>
                                <div className="bg-yellow-100 p-2 rounded text-xs">
                                  <div className="font-semibold text-yellow-800">Movimento Baixo</div>
                                  <div>{idlenessDetector?.formatDuration(idlenessResults.timeAnalysis.lowActivityTime)}</div>
                                  <div className="text-yellow-600">
                                    {((idlenessResults.timeAnalysis.lowActivityTime / idlenessResults.timeAnalysis.totalTime) * 100).toFixed(1)}%
                                  </div>
                                </div>
                                <div className="bg-blue-100 p-2 rounded text-xs">
                                  <div className="font-semibold text-blue-800">Movimento Moderado</div>
                                  <div>{idlenessDetector?.formatDuration(idlenessResults.timeAnalysis.moderateActivityTime)}</div>
                                  <div className="text-blue-600">
                                    {((idlenessResults.timeAnalysis.moderateActivityTime / idlenessResults.timeAnalysis.totalTime) * 100).toFixed(1)}%
                                  </div>
                                </div>
                                <div className="bg-green-100 p-2 rounded text-xs">
                                  <div className="font-semibold text-green-800">Movimento Alto</div>
                                  <div>{idlenessDetector?.formatDuration(idlenessResults.timeAnalysis.highActivityTime)}</div>
                                  <div className="text-green-600">
                                    {((idlenessResults.timeAnalysis.highActivityTime / idlenessResults.timeAnalysis.totalTime) * 100).toFixed(1)}%
                                  </div>
                                </div>
                              </div>

                              {/* Padrões de Trabalho */}
                              <div className="bg-white p-2 rounded border mb-3">
                                <div className="font-semibold text-xs text-slate-800 mb-2">🕒 Padrões de Trabalho</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-slate-600">Maior período ocioso:</span>
                                    <div className="font-semibold text-red-700">
                                      {idlenessResults.timeAnalysis.workPatterns.consecutiveIdleMinutes} minutos
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-slate-600">Períodos ociosos:</span>
                                    <div className="font-semibold">
                                      {idlenessResults.timeAnalysis.idlePeriods.length} períodos
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Horas Produtivas/Improdutivas */}
                              {(idlenessResults.timeAnalysis.workPatterns.productiveHours.length > 0 || 
                                idlenessResults.timeAnalysis.workPatterns.unproductiveHours.length > 0) && (
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {idlenessResults.timeAnalysis.workPatterns.productiveHours.length > 0 && (
                                    <div className="bg-green-50 p-2 rounded border">
                                      <div className="font-semibold text-green-800 mb-1">✅ Horas Produtivas</div>
                                      {idlenessResults.timeAnalysis.workPatterns.productiveHours.slice(0, import.meta.env.VITE_MAX_PRODUCTIVE_HOURS_DISPLAY || 3).map((hour, idx) => (
                                        <div key={idx} className="text-green-700">
                                          {hour.hour}h: {(hour.productivity * 100).toFixed(0)}%
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {idlenessResults.timeAnalysis.workPatterns.unproductiveHours.length > 0 && (
                                    <div className="bg-red-50 p-2 rounded border">
                                      <div className="font-semibold text-red-800 mb-1">❌ Horas Improdutivas</div>
                                      {idlenessResults.timeAnalysis.workPatterns.unproductiveHours.slice(0, import.meta.env.VITE_MAX_UNPRODUCTIVE_HOURS_DISPLAY || 3).map((hour, idx) => (
                                        <div key={idx} className="text-red-700">
                                          {hour.hour}h: {(hour.productivity * 100).toFixed(0)}%
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Resumo Gerencial Completo */}
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200 mt-4">
                            <h5 className="font-bold text-blue-800 mb-3 flex items-center">
                              📊 RESUMO EXECUTIVO PARA GESTÃO
                            </h5>
                            
                            {/* Status Geral */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              {/* Conteúdo NSFW */}
                              <div className={`p-3 rounded-lg border-2 ${
                                isNSFW 
                                  ? 'bg-red-100 border-red-300' 
                                  : 'bg-green-100 border-green-300'
                              }`}>
                                <div className="font-semibold text-sm">🔞 Conteúdo Adulto</div>
                                <div className={`text-lg font-bold ${
                                  isNSFW ? 'text-red-700' : 'text-green-700'
                                }`}>
                                  {isNSFW ? 'DETECTADO' : 'NÃO DETECTADO'}
                                </div>
                                {isNSFW && results && (
                                  <div className="text-xs mt-1">
                                    {results.find(r => r.className === 'Porn')?.probability > (parseFloat(import.meta.env.VITE_NSFW_PORN_THRESHOLD) || 0.5) && (
                                      <span className="bg-red-200 text-red-800 px-1 rounded">Pornografia</span>
                                    )}
                                    {results.find(r => r.className === 'Sexy')?.probability > (parseFloat(import.meta.env.VITE_NSFW_SEXY_THRESHOLD) || 0.7) && (
                                      <span className="bg-orange-200 text-orange-800 px-1 rounded ml-1">Conteúdo Sexy</span>
                                    )}
                                    {results.find(r => r.className === 'Hentai')?.probability > (parseFloat(import.meta.env.VITE_NSFW_HENTAI_THRESHOLD) || 0.5) && (
                                      <span className="bg-purple-200 text-purple-800 px-1 rounded ml-1">Hentai</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Jogos */}
                              <div className={`p-3 rounded-lg border-2 ${
                                isLikelyGame 
                                  ? 'bg-orange-100 border-orange-300' 
                                  : 'bg-gray-100 border-gray-300'
                              }`}>
                                <div className="font-semibold text-sm">🎮 Atividade de Jogos</div>
                                <div className={`text-lg font-bold ${
                                  isLikelyGame ? 'text-orange-700' : 'text-gray-700'
                                }`}>
                                  {isLikelyGame ? 'DETECTADO' : 'NÃO DETECTADO'}
                                </div>
                                {/* Mostrar detalhes de jogos detectados */}
                                {isLikelyGame && (
                                  <div className="text-xs mt-1 space-y-1">
                                    {gameResults && gameResults.detectedGame && (
                                      <div className="bg-orange-200 text-orange-800 px-2 py-1 rounded inline-block">
                                        🎯 {gameResults.detectedGame}
                                      </div>
                                    )}
                                    {results && results.find(r => r.className === 'Drawing')?.probability > (parseFloat(import.meta.env.VITE_GAME_DRAWING_THRESHOLD) || 0.6) && (
                                      <div className="bg-blue-200 text-blue-800 px-2 py-1 rounded inline-block ml-1">
                                        🎨 Drawing: {(results.find(r => r.className === 'Drawing')?.probability * 100).toFixed(0)}%
                                      </div>
                                    )}
                                    {gameResults && gameResults.confidence && (
                                      <div className="text-orange-600 mt-1">
                                        Confiança: {(gameResults.confidence * 100).toFixed(1)}%
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Ociosidade */}
                              <div className={`p-3 rounded-lg border-2 ${
                                idlenessResults.isIdle 
                                  ? 'bg-red-100 border-red-300' 
                                  : idlenessResults.idlenessPercentage > 40
                                  ? 'bg-yellow-100 border-yellow-300'
                                  : 'bg-green-100 border-green-300'
                              }`}>
                                <div className="font-semibold text-sm">⏱️ Nível de Atividade</div>
                                <div className={`text-lg font-bold ${
                                  idlenessResults.isIdle 
                                    ? 'text-red-700' 
                                    : idlenessResults.idlenessPercentage > 40
                                    ? 'text-yellow-700'
                                    : 'text-green-700'
                                }`}>
                                  {idlenessResults.isIdle 
                                    ? 'ALTA OCIOSIDADE' 
                                    : idlenessResults.idlenessPercentage > 40
                                    ? 'OCIOSIDADE MODERADA'
                                    : 'ATIVIDADE NORMAL'
                                  }
                                </div>
                                <div className="text-xs mt-1 space-y-1">
                                  <div className="bg-slate-200 text-slate-800 px-2 py-1 rounded inline-block">
                                    📊 {idlenessResults.idlenessPercentage.toFixed(1)}% ocioso
                                  </div>
                                  {idlenessResults.timeAnalysis && (
                                    <div className="bg-red-200 text-red-800 px-2 py-1 rounded inline-block ml-1">
                                      ⏰ {idlenessDetector?.formatDuration(idlenessResults.timeAnalysis.veryLowActivityTime)} sem movimento
                                    </div>
                                  )}
                                  {idlenessResults.timeAnalysis?.workPatterns.consecutiveIdleMinutes > 0 && (
                                    <div className="text-red-600 mt-1">
                                      Maior período ocioso: {idlenessResults.timeAnalysis.workPatterns.consecutiveIdleMinutes} min
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Métricas de Produtividade */}
                            {idlenessResults.timeAnalysis && (
                              <div className="bg-white p-3 rounded-lg border mb-4">
                                <div className="font-semibold text-sm text-slate-800 mb-2">📈 Métricas de Produtividade</div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                  <div className="text-center">
                                    <div className="font-bold text-lg text-red-600">
                                      {((idlenessResults.timeAnalysis.veryLowActivityTime / idlenessResults.timeAnalysis.totalTime) * 100).toFixed(0)}%
                                    </div>
                                    <div className="text-slate-600">Sem Atividade</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-bold text-lg text-yellow-600">
                                      {((idlenessResults.timeAnalysis.lowActivityTime / idlenessResults.timeAnalysis.totalTime) * 100).toFixed(0)}%
                                    </div>
                                    <div className="text-slate-600">Atividade Baixa</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-bold text-lg text-blue-600">
                                      {((idlenessResults.timeAnalysis.moderateActivityTime / idlenessResults.timeAnalysis.totalTime) * 100).toFixed(0)}%
                                    </div>
                                    <div className="text-slate-600">Atividade Moderada</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-bold text-lg text-green-600">
                                      {((idlenessResults.timeAnalysis.highActivityTime / idlenessResults.timeAnalysis.totalTime) * 100).toFixed(0)}%
                                    </div>
                                    <div className="text-slate-600">Alta Atividade</div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Alertas e Recomendações */}
                            <div className="bg-slate-100 p-3 rounded-lg">
                              <div className="font-semibold text-sm text-slate-800 mb-2">⚠️ Alertas e Recomendações</div>
                              <div className="space-y-1 text-xs">
                                {isNSFW && (
                                  <div className="flex items-center text-red-700">
                                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                    <strong>CRÍTICO:</strong> Conteúdo adulto detectado
                                    {results && (
                                      <span className="ml-2 text-xs">
                                        {results.find(r => r.className === 'Porn')?.probability > (parseFloat(import.meta.env.VITE_NSFW_PORN_THRESHOLD) || 0.5) && '(Pornografia)'}
                                        {results.find(r => r.className === 'Sexy')?.probability > (parseFloat(import.meta.env.VITE_NSFW_SEXY_THRESHOLD) || 0.7) && '(Conteúdo Sexy)'}
                                        {results.find(r => r.className === 'Hentai')?.probability > (parseFloat(import.meta.env.VITE_NSFW_HENTAI_THRESHOLD) || 0.5) && '(Hentai)'}
                                      </span>
                                    )}
                                    - Requer ação imediata
                                  </div>
                                )}
                                {isLikelyGame && (
                                  <div className="flex items-center text-orange-700">
                                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                                    <strong>ATENÇÃO:</strong> Atividade de jogos detectada
                                    {gameResults && gameResults.detectedGame && (
                                      <span className="ml-2 text-xs">({gameResults.detectedGame})</span>
                                    )}
                                    {results && results.find(r => r.className === 'Drawing')?.probability > (parseFloat(import.meta.env.VITE_GAME_DRAWING_THRESHOLD) || 0.6) && (
                                      <span className="ml-2 text-xs">(Drawing: {(results.find(r => r.className === 'Drawing')?.probability * 100).toFixed(0)}%)</span>
                                    )}
                                    - Durante horário de trabalho
                                  </div>
                                )}
                                {idlenessResults.isIdle && (
                                  <div className="flex items-center text-red-700">
                                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                    <strong>ALERTA:</strong> Alta ociosidade detectada ({idlenessResults.idlenessPercentage.toFixed(1)}%)
                                    {idlenessResults.timeAnalysis?.workPatterns.consecutiveIdleMinutes > 0 && (
                                      <span className="ml-2 text-xs">- Maior período: {idlenessResults.timeAnalysis.workPatterns.consecutiveIdleMinutes} min</span>
                                    )}
                                  </div>
                                )}
                                {idlenessResults.idlenessPercentage > 60 && (
                                  <div className="flex items-center text-yellow-700">
                                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                                    <strong>OBSERVAÇÃO:</strong> Baixa produtividade detectada - Considerar treinamento ou redistribuição de tarefas
                                  </div>
                                )}
                                {urlResults && urlResults.urls.length > 0 && (
                                  <div className="flex items-center text-blue-700">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    <strong>INFO:</strong> Acesso a websites detectado - Verificar se relacionado ao trabalho
                                  </div>
                                )}
                                {!isNSFW && !isLikelyGame && idlenessResults.idlenessPercentage < 40 && (
                                  <div className="flex items-center text-green-700">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    <strong>POSITIVO:</strong> Comportamento adequado e produtivo detectado
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Ações Recomendadas */}
                            <div className="mt-3 p-3 bg-blue-100 rounded-lg border border-blue-300">
                              <div className="font-semibold text-sm text-blue-800 mb-2">🎯 Ações Recomendadas</div>
                              <div className="space-y-1 text-xs text-blue-700">
                                {isNSFW && (
                                  <div>• <strong>Conteúdo NSFW:</strong> Aplicar medidas disciplinares conforme política da empresa</div>
                                )}
                                {isLikelyGame && (
                                  <div>• <strong>Jogos detectados:</strong> Conversar sobre uso adequado de recursos da empresa
                                    {gameResults && gameResults.detectedGame && (
                                      <span className="text-orange-600"> ({gameResults.detectedGame})</span>
                                    )}
                                  </div>
                                )}
                                {idlenessResults.isIdle && (
                                  <div>• <strong>Alta ociosidade:</strong> Verificar carga de trabalho e necessidade de suporte adicional</div>
                                )}
                                {idlenessResults.idlenessPercentage > 60 && (
                                  <div>• <strong>Baixa produtividade:</strong> Avaliar treinamento em ferramentas de produtividade</div>
                                )}
                                {idlenessResults.timeAnalysis?.workPatterns.productiveHours.length > 0 && (
                                  <div>• <strong>Otimização:</strong> Ajustar horários baseado nos picos de produtividade identificados</div>
                                )}
                                {urlResults && urlResults.urls.length > 0 && (
                                  <div>• <strong>URLs detectadas:</strong> Verificar se o acesso a websites está relacionado ao trabalho</div>
                                )}
                                <div>• <strong>Documentação:</strong> Registrar evidências para acompanhamento e auditoria futura</div>
                                <div>• <strong>Monitoramento:</strong> Agendar revisão em 7-14 dias para avaliar melhorias</div>
                              </div>
                            </div>
                          </div>

                          {idlenessResults.source && (
                            <div className="text-xs text-slate-500 mt-2">
                              📊 Origem: {idlenessResults.source === 'zip' ? 'Arquivo ZIP' : 'Arquivos individuais'}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Detalhes da Classificação NSFW */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-slate-700">
                          Classificação NSFW:
                        </h4>
                        {results
                          .sort((a, b) => b.probability - a.probability)
                          .map((result, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <Badge variant={getBadgeVariant(result.className, result.probability)}>
                                {result.className}
                              </Badge>
                              <span className="text-sm font-mono">
                                {(result.probability * 100).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Erro */}
        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <footer className="text-center text-sm text-slate-500 mt-8">
          <p>{import.meta.env.VITE_APP_VERSION || 'v7.3.4-resumo-detalhado'} | Build: {new Date().toLocaleString('pt-BR')}</p>
          <p>Processamento 100% local • Borramento automático de evidências • NSFW + Gaming + URL + Análise de Ociosidade • Validação de acuidade</p>
        </footer>
      </div>
    </div>
  )
}

export default App
