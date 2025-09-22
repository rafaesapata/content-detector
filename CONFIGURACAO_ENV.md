# Configuração de Variáveis de Ambiente - Detector v7.3.0-final

## 📋 Visão Geral

Todas as configurações da aplicação foram transferidas para variáveis de ambiente, permitindo ajustes finos sem necessidade de modificar o código fonte. Este documento descreve cada parâmetro disponível.

## 🔧 Como Usar

1. **Copie o arquivo de exemplo:**
   ```bash
   cp .env.example .env
   ```

2. **Edite o arquivo .env** com seus valores preferidos

3. **Reconstrua a aplicação:**
   ```bash
   pnpm run build
   ```

## 📊 Categorias de Configuração

### 🎯 **CONFIGURAÇÕES GERAIS**

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `VITE_APP_TITLE` | "Detector Inteligente" | Título exibido na interface |
| `VITE_APP_VERSION` | "7.3.0-final" | Versão exibida no rodapé |
| `VITE_MAX_FILE_SIZE_MB` | 10 | Tamanho máximo de arquivo em MB |

### 🔞 **DETECÇÃO NSFW**

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `VITE_NSFW_PORN_THRESHOLD` | 0.5 | Threshold para classificar como Pornográfico (0.0-1.0) |
| `VITE_NSFW_HENTAI_THRESHOLD` | 0.5 | Threshold para classificar como Hentai (0.0-1.0) |
| `VITE_NSFW_SEXY_THRESHOLD` | 0.7 | Threshold para classificar como Sexy (0.0-1.0) |
| `VITE_NSFW_MIN_DISPLAY_THRESHOLD` | 0.1 | Threshold mínimo para exibir badges (0.0-1.0) |
| `VITE_NSFW_SEXY_DESTRUCTIVE_THRESHOLD` | 0.5 | Threshold para badges destrutivos em Sexy (0.0-1.0) |

**💡 Dicas NSFW:**
- **Valores mais baixos** = mais sensível, mais detecções
- **Valores mais altos** = menos sensível, menos falsos positivos
- **Sexy** geralmente tem threshold mais alto que Porn/Hentai

### 🎮 **DETECÇÃO DE JOGOS**

#### Thresholds Principais
| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `VITE_GAME_DETECTION_THRESHOLD` | 0.30 | Threshold principal para detecção de jogos (0.0-1.0) |
| `VITE_GAME_DRAWING_THRESHOLD` | 0.6 | Threshold para considerar Drawing como jogo (0.0-1.0) |
| `VITE_GAME_MIN_CONFIDENCE_FOR_DRAWING` | 0.2 | Confiança mínima para combinar com Drawing (0.0-1.0) |

#### Pesos de Análise (devem somar 1.0)
| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `VITE_GAME_COLOR_WEIGHT` | 0.20 | Peso da análise de cores (20%) |
| `VITE_GAME_HUD_WEIGHT` | 0.40 | Peso da análise de HUD (40%) |
| `VITE_GAME_PERSPECTIVE_WEIGHT` | 0.25 | Peso da análise de perspectiva (25%) |
| `VITE_GAME_COMPLEXITY_WEIGHT` | 0.15 | Peso da análise de complexidade (15%) |
| `VITE_GAME_TEXT_WEIGHT` | 0.00 | Peso da análise de texto (desabilitado) |

#### Configurações de Cores
| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `VITE_GAME_SATURATION_THRESHOLD` | 0.3 | Threshold para alta saturação (0.0-1.0) |
| `VITE_GAME_SATURATION_BONUS` | 0.2 | Bonus por alta saturação (0.0-1.0) |

**💡 Dicas de Jogos:**
- **HUD_WEIGHT** é o mais importante (40%) - detecta minimapa, barras de vida
- **DETECTION_THRESHOLD** baixo (0.30) captura mais jogos como LoL
- **DRAWING_THRESHOLD** alto (0.6) evita falsos positivos em arte

### 🗺️ **REGIÕES HUD (coordenadas relativas 0.0-1.0)**

#### Minimapa (canto inferior direito)
| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `VITE_GAME_MINIMAP_X` | 0.75 | Posição X do minimapa (75% da largura) |
| `VITE_GAME_MINIMAP_Y` | 0.75 | Posição Y do minimapa (75% da altura) |
| `VITE_GAME_MINIMAP_WIDTH` | 0.25 | Largura do minimapa (25% da tela) |
| `VITE_GAME_MINIMAP_HEIGHT` | 0.25 | Altura do minimapa (25% da tela) |

#### Barra de Vida/Mana (centro inferior)
| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `VITE_GAME_HEALTHBAR_X` | 0.3 | Posição X da barra de vida (30%) |
| `VITE_GAME_HEALTHBAR_Y` | 0.85 | Posição Y da barra de vida (85%) |
| `VITE_GAME_HEALTHBAR_WIDTH` | 0.4 | Largura da barra de vida (40%) |
| `VITE_GAME_HEALTHBAR_HEIGHT` | 0.1 | Altura da barra de vida (10%) |

#### Inventário (centro inferior)
| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `VITE_GAME_INVENTORY_X` | 0.25 | Posição X do inventário (25%) |
| `VITE_GAME_INVENTORY_Y` | 0.8 | Posição Y do inventário (80%) |
| `VITE_GAME_INVENTORY_WIDTH` | 0.5 | Largura do inventário (50%) |
| `VITE_GAME_INVENTORY_HEIGHT` | 0.15 | Altura do inventário (15%) |

#### Região Superior Direita (timer, FPS)
| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `VITE_GAME_TOPRIGHT_X` | 0.7 | Posição X da região superior (70%) |
| `VITE_GAME_TOPRIGHT_Y` | 0.0 | Posição Y da região superior (0%) |
| `VITE_GAME_TOPRIGHT_WIDTH` | 0.3 | Largura da região superior (30%) |
| `VITE_GAME_TOPRIGHT_HEIGHT` | 0.15 | Altura da região superior (15%) |

### ⚖️ **PESOS DAS REGIÕES HUD (devem somar ~1.0)**

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `VITE_GAME_MINIMAP_WEIGHT` | 0.35 | Peso do minimapa (35%) |
| `VITE_GAME_HEALTHBAR_WEIGHT` | 0.30 | Peso da barra de vida (30%) |
| `VITE_GAME_INVENTORY_WEIGHT` | 0.25 | Peso do inventário (25%) |
| `VITE_GAME_TOPRIGHT_WEIGHT` | 0.10 | Peso da região superior (10%) |

**💡 Dicas de Regiões:**
- **Coordenadas** são relativas: 0.0 = início, 1.0 = fim
- **Minimapa** tem maior peso (35%) - mais confiável para detecção
- **Ajuste as regiões** conforme o jogo específico que deseja detectar

### 😴 **ANÁLISE DE OCIOSIDADE**

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `VITE_IDLENESS_CHANGE_THRESHOLD` | 0.05 | Diferença mínima para considerar atividade (5%) |
| `VITE_IDLENESS_MAX_IDLE_TIME` | 300000 | Tempo máximo de inatividade em ms (5 min) |
| `VITE_IDLENESS_HIGH_THRESHOLD` | 70 | Porcentagem para alta ociosidade (70%) |
| `VITE_IDLENESS_MODERATE_THRESHOLD` | 40 | Porcentagem para ociosidade moderada (40%) |
| `VITE_IDLENESS_MAX_RESOLUTION` | 800 | Resolução máxima para processamento (800px) |

**💡 Dicas de Ociosidade:**
- **CHANGE_THRESHOLD** baixo (0.05) detecta mudanças sutis
- **MAX_IDLE_TIME** define períodos longos de inatividade
- **MAX_RESOLUTION** menor = processamento mais rápido

### 🖥️ **CONFIGURAÇÕES DE INTERFACE**

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `VITE_UI_MAX_SERVICES_DISPLAY` | 5 | Máximo de serviços a exibir |
| `VITE_UI_MAX_SOFTWARE_DISPLAY` | 3 | Máximo de software a exibir |
| `VITE_UI_MAX_DETECTION_LOGS` | 5 | Máximo de logs de detecção |
| `VITE_UI_MAX_IDLE_PERIODS` | 3 | Máximo de períodos de ociosidade |

### 🐛 **CONFIGURAÇÕES DE DEBUG**

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `VITE_DEBUG_ENABLED` | true | Habilitar logs detalhados |
| `VITE_DEBUG_SOFTWARE_DETECTION` | true | Logs de detecção de software |
| `VITE_DEBUG_GAME_ANALYSIS` | true | Logs de análise de jogos |
| `VITE_DEBUG_OCR` | true | Logs de OCR |

## 🎯 **Cenários de Configuração**

### 🔥 **Alta Sensibilidade (mais detecções)**
```env
VITE_NSFW_PORN_THRESHOLD=0.3
VITE_NSFW_HENTAI_THRESHOLD=0.3
VITE_NSFW_SEXY_THRESHOLD=0.5
VITE_GAME_DETECTION_THRESHOLD=0.25
VITE_IDLENESS_CHANGE_THRESHOLD=0.03
```

### 🛡️ **Baixa Sensibilidade (menos falsos positivos)**
```env
VITE_NSFW_PORN_THRESHOLD=0.7
VITE_NSFW_HENTAI_THRESHOLD=0.7
VITE_NSFW_SEXY_THRESHOLD=0.8
VITE_GAME_DETECTION_THRESHOLD=0.45
VITE_IDLENESS_CHANGE_THRESHOLD=0.08
```

### 🎮 **Otimizado para League of Legends**
```env
VITE_GAME_DETECTION_THRESHOLD=0.25
VITE_GAME_DRAWING_THRESHOLD=0.5
VITE_GAME_HUD_WEIGHT=0.45
VITE_GAME_MINIMAP_WEIGHT=0.40
VITE_GAME_SATURATION_THRESHOLD=0.25
```

### 💼 **Ambiente Corporativo (conservador)**
```env
VITE_NSFW_PORN_THRESHOLD=0.8
VITE_NSFW_HENTAI_THRESHOLD=0.8
VITE_NSFW_SEXY_THRESHOLD=0.9
VITE_IDLENESS_HIGH_THRESHOLD=60
VITE_IDLENESS_MODERATE_THRESHOLD=30
```

## ⚠️ **Considerações Importantes**

### 🔄 **Rebuild Necessário**
Após alterar o arquivo `.env`, é necessário reconstruir a aplicação:
```bash
pnpm run build
```

### 📊 **Balanceamento de Pesos**
- Pesos de análise de jogos devem somar ~1.0
- Pesos de regiões HUD devem somar ~1.0
- Valores fora dessa faixa podem causar resultados inesperados

### 🎯 **Thresholds Recomendados**
- **NSFW**: 0.3-0.8 (0.5 é equilibrado)
- **Jogos**: 0.2-0.5 (0.3 é equilibrado)
- **Ociosidade**: 0.03-0.1 (0.05 é equilibrado)

### 🔍 **Debug e Logs**
- Mantenha `VITE_DEBUG_ENABLED=true` durante ajustes
- Use o console do navegador (F12) para monitorar
- Logs mostram valores calculados em tempo real

## 📞 **Suporte**

Para dúvidas sobre configuração:
1. Consulte os logs no console (F12)
2. Teste com valores padrão primeiro
3. Ajuste gradualmente um parâmetro por vez
4. Documente configurações que funcionam bem

---

**Versão**: 7.3.0-final  
**Data**: 22/09/2025  
**Configurações**: 40+ parâmetros configuráveis
