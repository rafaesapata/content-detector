# Sistema de Borramento Automático de Evidências - v7.3.2

## 🎯 **Funcionalidade Principal**

Sistema inteligente que aplica borramento automático em conteúdo detectado como NSFW ou jogos, preservando evidências para validação de acuidade sem exposição completa do material.

## 🔒 **Objetivo**

- **Preservar evidências** para conferência e validação
- **Permitir identificação superficial** do conteúdo
- **Evitar exposição completa** de material sensível
- **Facilitar auditoria** dos resultados de detecção
- **Manter conformidade** com políticas de segurança

## 📊 **Níveis de Borramento**

### 🟡 **Light (Leve) - 3px**
- **Uso**: Conteúdo de jogos
- **Finalidade**: Preservar identificação visual básica
- **Cor do marcador**: Laranja (#FFA500)

### 🟠 **Medium (Médio) - 8px**
- **Uso**: Conteúdo sexy/sugestivo
- **Finalidade**: Reduzir detalhes mantendo contexto
- **Cor do marcador**: Vermelho claro (#FF6B6B)

### 🔴 **Heavy (Pesado) - 15px**
- **Uso**: Conteúdo explícito (Porn/Hentai)
- **Finalidade**: Ocultar detalhes preservando forma geral
- **Cor do marcador**: Vermelho (#FF0000)

### ⚫ **Extreme (Extremo) - 25px**
- **Uso**: Conteúdo altamente explícito (>80% confiança)
- **Finalidade**: Máxima proteção mantendo identificação mínima
- **Cor do marcador**: Vermelho escuro (#8B0000)

## 🎮 **Critérios de Ativação**

### **Para Jogos**
```javascript
// Ativa quando:
- gameResults.isGaming === true OU
- Drawing > 60% + gameDetection.confidence > 20%
- Nível aplicado: LIGHT (configurável)
```

### **Para Conteúdo NSFW**
```javascript
// Ativa quando:
- Porn > 50% → HEAVY/EXTREME
- Hentai > 50% → HEAVY/EXTREME  
- Sexy > 70% → MEDIUM/HEAVY
```

## 🖼️ **Processamento da Imagem**

### **1. Análise de Conteúdo**
- Verifica resultados NSFW e detecção de jogos
- Determina nível de borramento apropriado
- Aplica critérios configuráveis via .env

### **2. Aplicação do Borramento**
- Usa Canvas API para processamento
- Aplica filtro blur com intensidade específica
- Mantém dimensões originais da imagem

### **3. Marca d'Água de Evidência**
- **Texto central**: "EVIDÊNCIA PROCESSADA"
- **Descrição**: Tipo de conteúdo detectado
- **Timestamp**: Data/hora do processamento
- **Marcadores nos cantos**: Indicadores coloridos por nível

### **4. Geração do Arquivo**
- Formato: JPEG (configurável)
- Qualidade: 90% (configurável)
- Nome: `original_BORRADO_NIVEL_timestamp.jpg`

## 🎛️ **Configurações Disponíveis**

### **Ativação/Desativação**
```env
VITE_BLUR_GAMES=true              # Borrar jogos
VITE_BLUR_NSFW=true               # Borrar conteúdo NSFW
```

### **Níveis e Intensidade**
```env
VITE_GAME_BLUR_LEVEL=light        # Nível para jogos
VITE_BLUR_IMAGE_QUALITY=0.9       # Qualidade da imagem
VITE_BLUR_IMAGE_FORMAT=jpeg       # Formato de saída
```

### **Marca d'Água**
```env
VITE_SHOW_EVIDENCE_WATERMARK=true # Mostrar marca d'água
VITE_SHOW_CORNER_MARKERS=true     # Mostrar marcadores
```

### **Thresholds NSFW**
```env
VITE_NSFW_PORN_THRESHOLD=0.5      # Limite para Porn
VITE_NSFW_HENTAI_THRESHOLD=0.5    # Limite para Hentai  
VITE_NSFW_SEXY_THRESHOLD=0.7      # Limite para Sexy
```

## 🖥️ **Interface do Usuário**

### **Controles de Visualização**
- **Botão "Original"**: Mostra imagem sem borramento
- **Botão "Ocultar"**: Volta para versão borrada
- **Botão "Baixar"**: Download da versão processada

### **Indicadores Visuais**
- **Badge inferior**: "🔒 EVIDÊNCIA PROCESSADA - NÍVEL"
- **Controles flutuantes**: Botões no canto superior direito
- **Seção informativa**: Detalhes do processamento

### **Informações Detalhadas**
- **Nível de borramento** aplicado
- **Intensidade** em pixels
- **Motivo** do processamento
- **Nome do arquivo** gerado
- **Timestamp** do processamento

## 📋 **Fluxo de Processamento**

### **1. Detecção**
```
Imagem → NSFWJS → Resultados NSFW
       → GameDetector → Resultados Jogos
       → Análise combinada → Decisão de borramento
```

### **2. Processamento**
```
Decisão → Determinar nível → Aplicar borramento
        → Adicionar marca d'água → Gerar arquivo
        → Atualizar interface → Disponibilizar download
```

### **3. Exibição**
```
Interface → Mostrar versão borrada por padrão
         → Controles para alternar visualização
         → Informações detalhadas do processamento
```

## 🔍 **Casos de Uso**

### **Auditoria de Segurança**
- Validar acuidade dos algoritmos de detecção
- Revisar falsos positivos/negativos
- Documentar evidências para relatórios

### **Conformidade Corporativa**
- Cumprir políticas de conteúdo
- Proteger funcionários de exposição
- Manter registros para compliance

### **Análise Forense**
- Preservar evidências digitais
- Permitir análise sem exposição completa
- Facilitar investigações internas

## ⚙️ **Configurações Recomendadas**

### **Ambiente Corporativo Rigoroso**
```env
VITE_BLUR_GAMES=true
VITE_BLUR_NSFW=true
VITE_GAME_BLUR_LEVEL=medium
VITE_NSFW_SEXY_THRESHOLD=0.5
VITE_SHOW_EVIDENCE_WATERMARK=true
```

### **Ambiente de Desenvolvimento**
```env
VITE_BLUR_GAMES=false
VITE_BLUR_NSFW=true
VITE_GAME_BLUR_LEVEL=light
VITE_NSFW_SEXY_THRESHOLD=0.8
VITE_SHOW_EVIDENCE_WATERMARK=false
```

### **Análise Forense**
```env
VITE_BLUR_GAMES=true
VITE_BLUR_NSFW=true
VITE_GAME_BLUR_LEVEL=light
VITE_SHOW_EVIDENCE_WATERMARK=true
VITE_SHOW_CORNER_MARKERS=true
```

## 🛡️ **Segurança e Privacidade**

### **Processamento Local**
- Todo borramento é feito no navegador
- Nenhuma imagem é enviada para servidores
- Máxima privacidade dos dados

### **Preservação de Evidências**
- Imagem original permanece acessível
- Versão borrada é gerada dinamicamente
- Metadados de processamento são mantidos

### **Auditabilidade**
- Logs detalhados de decisões
- Timestamps precisos
- Critérios transparentes

## 📈 **Benefícios**

### **Para Administradores**
- **Conformidade**: Atende políticas de segurança
- **Auditoria**: Facilita revisão de resultados
- **Proteção**: Evita exposição desnecessária

### **Para Analistas**
- **Validação**: Permite verificar acuidade
- **Contexto**: Mantém identificação superficial
- **Eficiência**: Acelera processo de revisão

### **Para Usuários**
- **Segurança**: Protege contra conteúdo sensível
- **Transparência**: Mostra o que foi detectado
- **Controle**: Permite alternar visualização

## 🔧 **Implementação Técnica**

### **Componentes**
- `ImageBlurProcessor.jsx`: Lógica principal
- `App.jsx`: Integração com interface
- `.env`: Configurações personalizáveis

### **Dependências**
- Canvas API para processamento
- Lucide React para ícones
- Tailwind CSS para estilização

### **Performance**
- Processamento assíncrono
- Otimização de qualidade configurável
- Cache de versões processadas

---

**Versão**: 7.3.2  
**Data**: 22/09/2025  
**Funcionalidade**: Sistema de Borramento Automático de Evidências  
**Configurações**: 10+ parâmetros específicos de borramento
