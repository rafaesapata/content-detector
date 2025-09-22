# 🔍 Detector Inteligente v7.3.3

## 📋 Visão Geral

O **Detector Inteligente** é uma aplicação web avançada para análise automatizada de imagens com foco em detecção de conteúdo NSFW, jogos, software e monitoramento de atividade. Desenvolvido para ambientes corporativos que necessitam de controle e conformidade.

## ✨ Principais Funcionalidades

### 🔞 **Detecção NSFW**
- **93% de precisão** usando NSFWJS
- Classificação detalhada: Porn, Hentai, Sexy, Drawing, Neutral
- Thresholds configuráveis por categoria

### 🎮 **Detecção de Jogos**
- Algoritmo híbrido: NSFWJS Drawing + GameDetector customizado
- Detecção específica de League of Legends
- Análise de elementos HUD e interface de jogos
- Detecção de plataformas (Steam, Epic Games, etc.)

### 💻 **Detecção de URLs e Software**
- OCR avançado com Tesseract.js
- Extração de URLs, domínios e software
- Detecção visual de logos e interfaces
- Análise de cores e padrões UI

### ⏱️ **Análise de Ociosidade**
- Comparação inteligente de screenshots
- Análise temporal detalhada
- Padrões de produtividade por horário
- Métricas de atividade em 4 níveis

### 🔒 **Borramento Automático de Evidências**
- 4 níveis de borramento (Light, Medium, Heavy, Extreme)
- Preservação de evidências para auditoria
- Marca d'água automática com timestamp
- Download de versões processadas

### 📊 **Resumo Gerencial Executivo**
- Dashboard visual para gestores
- Alertas priorizados por criticidade
- Recomendações específicas de ação
- Métricas de produtividade consolidadas

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+
- npm ou pnpm

### Instalação
```bash
# Clonar repositório
git clone https://github.com/rafaesapata/content-detector.git
cd content-detector

# Instalar dependências
pnpm install

# Configurar ambiente
cp .env.example .env

# Executar em desenvolvimento
pnpm dev

# Build para produção
pnpm build
```

### Configuração
Edite o arquivo `.env` com suas configurações:

```env
# Versão da aplicação
VITE_APP_VERSION=v7.3.3-resumo-gerencial

# Thresholds NSFW
VITE_NSFW_PORN_THRESHOLD=0.5
VITE_NSFW_HENTAI_THRESHOLD=0.5
VITE_NSFW_SEXY_THRESHOLD=0.7

# Detecção de jogos
VITE_GAME_DETECTION_THRESHOLD=0.3
VITE_DRAWING_GAME_THRESHOLD=0.6

# Borramento automático
VITE_BLUR_GAMES=true
VITE_BLUR_NSFW=true
VITE_GAME_BLUR_LEVEL=light
```

## 📁 Estrutura do Projeto

```
content-detector/
├── src/
│   ├── components/
│   │   ├── GameDetectorImproved.jsx     # Detecção avançada de jogos
│   │   ├── AdvancedOCRDetector.jsx      # OCR e detecção de software
│   │   ├── IdlenessDetector.jsx         # Análise de ociosidade
│   │   ├── ImageBlurProcessor.jsx       # Processamento de borramento
│   │   └── ui/                          # Componentes de interface
│   ├── App.jsx                          # Componente principal
│   └── main.jsx                         # Ponto de entrada
├── public/                              # Arquivos estáticos
├── .env                                 # Configurações de ambiente
├── .env.example                         # Exemplo de configurações
└── package.json                         # Dependências do projeto
```

## 🎯 Casos de Uso

### 🏢 **Ambiente Corporativo**
- Monitoramento de conformidade
- Auditoria de atividades
- Detecção de uso inadequado
- Relatórios gerenciais

### 🔍 **Análise Forense**
- Preservação de evidências
- Documentação de violações
- Suporte a investigações
- Compliance regulatório

### 📈 **Gestão de Produtividade**
- Análise de padrões de trabalho
- Identificação de ociosidade
- Otimização de horários
- Treinamento direcionado

## ⚙️ Configurações Avançadas

### **55+ Parâmetros Configuráveis**
- Thresholds de detecção personalizáveis
- Níveis de borramento ajustáveis
- Configurações de interface
- Parâmetros de análise temporal

### **Cenários Pré-configurados**
- **Corporativo Rigoroso**: Máxima detecção
- **Ambiente de Desenvolvimento**: Configuração balanceada
- **Análise Forense**: Foco em evidências
- **Monitoramento Leve**: Configuração permissiva

## 🛡️ Segurança e Privacidade

### **Processamento 100% Local**
- Nenhuma imagem enviada para servidores
- Análise realizada no navegador
- Máxima privacidade dos dados
- Conformidade com LGPD

### **Evidências Protegidas**
- Borramento automático de conteúdo sensível
- Preservação para auditoria
- Logs detalhados de processamento
- Timestamps precisos

## 📊 Métricas de Performance

- **Precisão NSFW**: 93%+
- **Detecção de jogos**: 85%+ (LoL otimizado)
- **OCR**: Suporte a 100+ idiomas
- **Processamento**: <2s por imagem
- **Suporte**: JPG, PNG, ZIP (múltiplas imagens)

## 🔧 Tecnologias Utilizadas

- **Frontend**: React 18 + Vite
- **UI**: Tailwind CSS + Lucide Icons
- **IA/ML**: NSFWJS (TensorFlow.js)
- **OCR**: Tesseract.js
- **Processamento**: Canvas API
- **Build**: Vite + SWC

## 📚 Documentação Adicional

- [Configuração de Ambiente](CONFIGURACAO_ENV.md)
- [Sistema de Borramento](SISTEMA_BORRAMENTO.md)
- [Análise de Tempo](ANALISE_TEMPO_AVANCADA.md)
- [Resumo Gerencial](RESUMO_GERENCIAL.md)
- [Guia de Integração API](GUIA_INTEGRACAO_API.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

**Rafael Sapata**
- GitHub: [@rafaesapata](https://github.com/rafaesapata)
- Email: rafaesapata@gmail.com

## 🙏 Agradecimentos

- [NSFWJS](https://github.com/infinitered/nsfwjs) - Detecção NSFW
- [Tesseract.js](https://github.com/naptha/tesseract.js) - OCR
- [TensorFlow.js](https://www.tensorflow.org/js) - Machine Learning
- [React](https://reactjs.org/) - Framework frontend
- [Tailwind CSS](https://tailwindcss.com/) - Estilização

---

**Versão**: 7.3.3-resumo-gerencial  
**Data**: 22/09/2025  
**Status**: Produção  
**Processamento**: 100% Local
