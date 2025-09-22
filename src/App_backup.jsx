import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Upload, AlertTriangle, CheckCircle, X, Gamepad2, Globe, Monitor } from 'lucide-react'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import * as nsfwjs from 'nsfwjs'
import GameDetector from './components/GameDetector.jsx'
import URLSoftwareDetector from './components/URLSoftwareDetector.jsx'
import IdlenessDetector from './components/IdlenessDetector.jsx'
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
      setLoadingProgress(33)
      
      // Carregar detector de jogos
      const gameDetectorInstance = new GameDetector()
      await gameDetectorInstance.load()
      setGameDetector(gameDetectorInstance)
      setLoadingProgress(66)
      
      // Carregar detector de URL/software
      console.log('🔧 Carregando detector de URL/software...')
      const urlDetectorInstance = new URLSoftwareDetector()
      await urlDetectorInstance.load()
      console.log('✅ Detector de URL/software carregado:', urlDetectorInstance)
      setUrlDetector(urlDetectorInstance)
      setLoadingProgress(90)
      
      // Inicializar detector de ociosidade
      console.log('🔧 Inicializando detector de ociosidade...')
      const idlenessDetectorInstance = new IdlenessDetector()
      setIdlenessDetector(idlenessDetectorInstance)
      console.log('✅ Detector de ociosidade inicializado')
      setLoadingProgress(100)
      
      setError(null)
    } catch (err) {
      setError(`Erro ao carregar modelos: ${sanitizeString(err.message)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Processar arquivo selecionado
  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      setError('Apenas arquivos JPG e PNG são aceitos')
      return
    }

    // Validar taman  // Selecionar arquivo(s)
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
      
    } catch (error) {
      console.error('❌ Erro na análise de ociosidade:', error)
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
        console.log('📷 Elemento de imagem:', imageRef.current)
        console.log('🤖 Detector URL:', urlDetector)
        
        if (!urlDetector) {
          throw new Error('Detector de URL não foi carregado')
        }
        
        const urlDetection = await urlDetector.analyze(imageRef.current)
        console.log('✅ Resultado da detecção URL/software:', urlDetection)
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
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Determinar se conteúdo é NSFW
  const isNSFW = results && (
    results.find(r => r.className === 'Porn')?.probability > 0.5 ||
    results.find(r => r.className === 'Hentai')?.probability > 0.5 ||
    results.find(r => r.className === 'Sexy')?.probability > 0.7
  )

  // Obter cor do badge baseado na categoria
  const getBadgeVariant = (className, probability) => {
    if (probability < 0.1) return 'secondary'
    if (className === 'Porn' || className === 'Hentai') return 'destructive'
    if (className === 'Sexy' && probability > 0.5) return 'destructive'
    if (className === 'Drawing' || className === 'Neutral') return 'default'
    return 'secondary'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Detector Inteligente
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
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-900">Modo Análise de Ociosidade</p>
                    <p className="text-sm text-blue-700">Selecione múltiplos screenshots com timestamp para detectar inatividade</p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={screenshotMode}
                      onChange={(e) => setScreenshotMode(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      screenshotMode ? 'bg-blue-600' : 'bg-gray-200'
                    }`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        screenshotMode ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </div>
                  </label>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={screenshotMode ? ".jpg,.jpeg,.png,.zip" : ".jpg,.jpeg,.png"}
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple={screenshotMode}
                />
                
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full h-20 border-dashed"
                >
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p>{screenshotMode ? 'Selecionar screenshots ou arquivo ZIP' : 'Clique para selecionar JPG ou PNG'}</p>
                    <p className="text-sm text-slate-500">
                      {screenshotMode ? 'Formato: nome_AAAAMMDDHHMMSS.ext ou arquivo.zip' : 'Máximo 10MB'}
                    </p>
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
                <div>
                  <img
                    ref={imageRef}
                    src={preview}
                    alt="Preview"
                    className="w-full max-h-96 object-contain rounded-lg border"
                    crossOrigin="anonymous"
                  />
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
                          gameResults.isGaming 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Gamepad2 className={`w-5 h-5 ${
                              gameResults.isGaming ? 'text-blue-600' : 'text-gray-600'
                            }`} />
                            <span className={`font-bold ${
                              gameResults.isGaming ? 'text-blue-800' : 'text-gray-800'
                            }`}>
                              {gameResults.isGaming ? 'TELA DE JOGO DETECTADA' : 'NÃO É TELA DE JOGO'}
                            </span>
                          </div>
                          <div className="text-sm text-slate-600">
                            Confiança: {(gameResults.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                      )}

                      {/* Detecção de URL/Software */}
                      {urlResults && (urlResults.urls.length > 0 || urlResults.domains.length > 0 || urlResults.software.length > 0 || urlResults.error) && (
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
                                {urlResults.software.slice(0, 3).map((software, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    <Monitor className="w-3 h-3 mr-1" />
                                    {software.name} ({(software.confidence * 100).toFixed(0)}%)
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="text-sm text-slate-600">
                            Confiança geral: {(urlResults.confidence * 100).toFixed(1)}%
                          </div>
                          
                          {urlResults.error && (
                            <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                              <strong>Erro:</strong> {urlResults.error}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Resultados de Análise de Ociosidade */}
                      {idlenessResults && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`w-3 h-3 rounded-full ${
                              idlenessResults.isIdle ? 'bg-red-500' : 
                              idlenessResults.idlenessPercentage > 40 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}></div>
                            <h4 className="font-semibold text-slate-800">
                              {idlenessResults.isIdle ? '🔴 ALTA OCIOSIDADE DETECTADA' : 
                               idlenessResults.idlenessPercentage > 40 ? '🟡 OCIOSIDADE MODERADA' : '🟢 ATIVIDADE NORMAL'}
                            </h4>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-sm text-slate-600">Ociosidade Total</p>
                              <p className="text-lg font-bold text-slate-800">
                                {idlenessResults.idlenessPercentage.toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-600">Screenshots Analisados</p>
                              <p className="text-lg font-bold text-slate-800">
                                {idlenessResults.analysis.totalScreenshots}
                              </p>
                              <p className="text-xs text-slate-500">
                                {idlenessResults.source === 'zip' ? '📦 Extraído de ZIP' : '📁 Arquivos individuais'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-sm text-slate-600">Tempo Ocioso</p>
                              <p className="text-sm font-medium text-red-600">
                                {idlenessDetector?.formatDuration(idlenessResults.totalIdleTime)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-600">Tempo Ativo</p>
                              <p className="text-sm font-medium text-green-600">
                                {idlenessDetector?.formatDuration(idlenessResults.totalActiveTime)}
                              </p>
                            </div>
                          </div>
                          
                          {idlenessResults.longIdlePeriods.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-semibold text-red-700 mb-1">
                                ⚠️ Períodos Longos de Inatividade:
                              </p>
                              {idlenessResults.longIdlePeriods.slice(0, 3).map((period, idx) => (
                                <div key={idx} className="text-xs text-red-600 bg-red-100 p-2 rounded mb-1">
                                  {idlenessDetector?.formatDuration(period.duration)} 
                                  ({period.start.toLocaleTimeString()} - {period.end.toLocaleTimeString()})
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="text-xs text-slate-600 bg-white p-2 rounded border">
                            <strong>Resumo:</strong> {idlenessResults.summary}
                          </div>
                        </div>
                      )}

                      {/* Detalhes da Classificação NSFW */}
                      {results && (
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
                      )}
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
          <p>v6.0.0 | Build: {new Date().toLocaleString('pt-BR')}</p>
          <p>Processamento 100% local • OCR alta precisão • Detecção avançada de software • NSFW + Gaming + URL + Análise de Ociosidade</p>
        </footer>
      </div>
    </div>
  )
}

export default App
