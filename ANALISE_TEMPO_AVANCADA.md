# Análise Avançada de Tempo de Ociosidade - v7.3.1

## 🎯 **Nova Funcionalidade**

Sistema avançado de contagem e análise de tempo de ociosidade baseado no horário das fotos, que identifica períodos de baixíssima atividade e padrões de trabalho detalhados.

## 📊 **Principais Recursos**

### 🕒 **Contagem Detalhada de Tempo**
- **Sem Movimento**: Praticamente parado (< 1% de diferença)
- **Movimento Baixo**: Atividade mínima (1-15% de diferença)
- **Movimento Moderado**: Atividade leve (15-30% de diferença)
- **Movimento Alto**: Atividade intensa (> 30% de diferença)

### 📈 **Análise de Padrões de Trabalho**
- **Maior Período Ocioso**: Tempo consecutivo sem atividade significativa
- **Períodos Contínuos**: Rastreamento de sequências de atividade/ociosidade
- **Intervalo Médio**: Duração média dos períodos ociosos
- **Estatísticas Horárias**: Produtividade por hora do dia

### 🎯 **Classificação de Produtividade**
- **Horas Produtivas**: Períodos com > 60% de atividade
- **Horas Improdutivas**: Períodos com < 30% de atividade
- **Ranking**: Ordenação por nível de produtividade

## 🔧 **Configurações Disponíveis**

### **Thresholds de Atividade**
```env
VITE_VERY_LOW_ACTIVITY_THRESHOLD=0.01    # Sem movimento
VITE_LOW_ACTIVITY_THRESHOLD=0.05         # Movimento baixo
VITE_MODERATE_ACTIVITY_THRESHOLD=0.15    # Movimento moderado
VITE_HIGH_ACTIVITY_THRESHOLD=0.30        # Movimento alto
```

### **Configurações de Produtividade**
```env
VITE_PRODUCTIVE_HOUR_THRESHOLD=0.6       # Hora produtiva (60%+)
VITE_UNPRODUCTIVE_HOUR_THRESHOLD=0.3     # Hora improdutiva (30%-)
VITE_MAX_PRODUCTIVE_HOURS_DISPLAY=3      # Máximo a exibir
VITE_MAX_UNPRODUCTIVE_HOURS_DISPLAY=3    # Máximo a exibir
```

### **Configurações de Análise**
```env
VITE_MIN_SIGNIFICANT_PERIOD=2            # Período mínimo (minutos)
VITE_MAX_IDLE_PERIODS_ANALYSIS=10        # Máximo períodos ociosos
VITE_MAX_ACTIVE_PERIODS_ANALYSIS=10      # Máximo períodos ativos
```

## 📱 **Interface Aprimorada**

### **Contadores Visuais**
- 🔴 **Sem Movimento**: Tempo e porcentagem em vermelho
- 🟡 **Movimento Baixo**: Tempo e porcentagem em amarelo
- 🔵 **Movimento Moderado**: Tempo e porcentagem em azul
- 🟢 **Movimento Alto**: Tempo e porcentagem em verde

### **Padrões de Trabalho**
- ⏰ **Maior Período Ocioso**: Exibido em minutos
- 📊 **Número de Períodos**: Contagem total de períodos ociosos
- 📈 **Estatísticas**: Análise temporal detalhada

### **Horas Produtivas/Improdutivas**
- ✅ **Horas Produtivas**: Lista das horas mais produtivas
- ❌ **Horas Improdutivas**: Lista das horas menos produtivas
- 📊 **Porcentagem**: Nível de produtividade por hora

## 🧮 **Algoritmo de Análise**

### **1. Classificação de Atividade**
```javascript
if (diferença < 0.01) → Sem Movimento
else if (diferença < 0.05) → Movimento Baixo
else if (diferença < 0.15) → Movimento Moderado
else → Movimento Alto
```

### **2. Análise Horária**
- Agrupa screenshots por hora
- Calcula tempo total, ativo e ocioso por hora
- Classifica produtividade baseada no ratio ativo/total

### **3. Detecção de Períodos**
- Identifica sequências contínuas de atividade/ociosidade
- Calcula duração e diferença média de cada período
- Registra início, fim e características de cada período

### **4. Padrões de Trabalho**
- Encontra o maior período ocioso consecutivo
- Calcula intervalo médio de ociosidade
- Identifica horas mais e menos produtivas
- Ordena por nível de produtividade

## 📊 **Métricas Calculadas**

### **Tempos Absolutos**
- Tempo total sem movimento
- Tempo total com movimento baixo
- Tempo total com movimento moderado
- Tempo total com movimento alto

### **Porcentagens Relativas**
- % de tempo sem movimento
- % de tempo com movimento baixo
- % de tempo com movimento moderado
- % de tempo com movimento alto

### **Estatísticas de Períodos**
- Número de períodos ociosos
- Número de períodos ativos
- Duração média dos períodos
- Maior período ocioso (em minutos)

### **Análise Horária**
- Produtividade por hora (0-100%)
- Tempo total por hora
- Tempo ativo por hora
- Tempo ocioso por hora

## 🎯 **Casos de Uso**

### **Monitoramento de Produtividade**
- Identificar horários mais produtivos
- Detectar períodos de baixa atividade
- Analisar padrões de trabalho ao longo do dia

### **Análise de Comportamento**
- Detectar pausas prolongadas
- Identificar momentos de alta concentração
- Mapear ritmo de trabalho individual

### **Relatórios Gerenciais**
- Estatísticas detalhadas de atividade
- Classificação de períodos produtivos/improdutivos
- Métricas objetivas de engajamento

## 🔍 **Interpretação dos Resultados**

### **Sem Movimento (Vermelho)**
- **Alto (>50%)**: Possível ausência ou inatividade prolongada
- **Moderado (20-50%)**: Períodos de pausa ou concentração
- **Baixo (<20%)**: Atividade normal com pausas naturais

### **Movimento Baixo (Amarelo)**
- **Alto (>30%)**: Atividade leve, possivelmente leitura/análise
- **Moderado (10-30%)**: Mistura de atividade e pausas
- **Baixo (<10%)**: Predominância de atividade intensa

### **Movimento Alto (Verde)**
- **Alto (>40%)**: Atividade intensa, multitarefas
- **Moderado (20-40%)**: Atividade normal de trabalho
- **Baixo (<20%)**: Possível foco em tarefa específica

## ⚙️ **Configuração Recomendada**

### **Ambiente Corporativo**
```env
VITE_VERY_LOW_ACTIVITY_THRESHOLD=0.005   # Mais sensível
VITE_PRODUCTIVE_HOUR_THRESHOLD=0.7       # Mais rigoroso
VITE_UNPRODUCTIVE_HOUR_THRESHOLD=0.2     # Mais rigoroso
```

### **Uso Pessoal**
```env
VITE_VERY_LOW_ACTIVITY_THRESHOLD=0.02    # Menos sensível
VITE_PRODUCTIVE_HOUR_THRESHOLD=0.5       # Mais flexível
VITE_UNPRODUCTIVE_HOUR_THRESHOLD=0.4     # Mais flexível
```

### **Análise Detalhada**
```env
VITE_DEBUG_TIME_ANALYSIS=true            # Logs detalhados
VITE_ENABLE_HOURLY_ANALYSIS=true         # Análise horária
VITE_ENABLE_WORK_PATTERNS=true           # Padrões de trabalho
```

## 📈 **Benefícios**

### **Para Usuários**
- Autoconhecimento sobre padrões de trabalho
- Identificação de horários mais produtivos
- Consciência sobre períodos de baixa atividade

### **Para Gestores**
- Métricas objetivas de atividade
- Identificação de padrões de equipe
- Base para otimização de processos

### **Para Análise**
- Dados granulares de comportamento
- Estatísticas temporais detalhadas
- Correlação entre horário e produtividade

---

**Versão**: 7.3.1  
**Data**: 22/09/2025  
**Funcionalidade**: Análise Avançada de Tempo de Ociosidade  
**Configurações**: 15+ parâmetros específicos
