# Guia de Integração API - Detector Inteligente v7.3.2

## 🎯 **Visão Geral**

O Detector Inteligente pode ser integrado via API para análise automatizada de imagens em sistemas externos. Esta documentação fornece instruções completas para integração.

## 🔗 **Endpoints Disponíveis**

### **Base URL**
```
https://seu-dominio.com/api/v1/
```

### **Endpoints Principais**

#### **1. Análise Completa de Imagem**
```http
POST /analyze
Content-Type: multipart/form-data
```

#### **2. Análise NSFW Específica**
```http
POST /analyze/nsfw
Content-Type: multipart/form-data
```

#### **3. Detecção de Jogos**
```http
POST /analyze/games
Content-Type: multipart/form-data
```

#### **4. Detecção de URLs/Software**
```http
POST /analyze/software
Content-Type: multipart/form-data
```

#### **5. Análise de Ociosidade (Múltiplas Imagens)**
```http
POST /analyze/idleness
Content-Type: multipart/form-data
```

## 📝 **Parâmetros de Requisição**

### **Parâmetros Obrigatórios**
- `image`: Arquivo de imagem (JPG, PNG)
- `api_key`: Chave de API para autenticação

### **Parâmetros Opcionais**
- `blur_enabled`: Aplicar borramento (true/false)
- `blur_level`: Nível de borramento (light/medium/heavy/extreme)
- `include_metadata`: Incluir metadados detalhados (true/false)
- `confidence_threshold`: Limite de confiança (0.0-1.0)
- `return_blurred_image`: Retornar imagem borrada (true/false)

## 🔧 **Exemplos de Integração**

### **1. JavaScript/Node.js**

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function analyzeImage(imagePath, apiKey) {
  const form = new FormData();
  form.append('image', fs.createReadStream(imagePath));
  form.append('api_key', apiKey);
  form.append('blur_enabled', 'true');
  form.append('include_metadata', 'true');

  try {
    const response = await axios.post('https://seu-dominio.com/api/v1/analyze', form, {
      headers: {
        ...form.getHeaders(),
        'Accept': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Erro na análise:', error.response?.data || error.message);
    throw error;
  }
}

// Uso
analyzeImage('./imagem.jpg', 'sua-api-key')
  .then(result => {
    console.log('Resultado:', result);
    
    if (result.nsfw.isNSFW) {
      console.log('⚠️ Conteúdo NSFW detectado!');
    }
    
    if (result.games.isGaming) {
      console.log('🎮 Jogo detectado!');
    }
    
    if (result.blurred_image) {
      // Salvar imagem borrada
      fs.writeFileSync('./imagem_borrada.jpg', result.blurred_image, 'base64');
    }
  })
  .catch(error => {
    console.error('Falha na análise:', error);
  });
```

### **2. Python**

```python
import requests
import base64
import json

def analyze_image(image_path, api_key):
    url = "https://seu-dominio.com/api/v1/analyze"
    
    with open(image_path, 'rb') as image_file:
        files = {
            'image': image_file,
        }
        data = {
            'api_key': api_key,
            'blur_enabled': 'true',
            'include_metadata': 'true',
            'confidence_threshold': '0.7'
        }
        
        response = requests.post(url, files=files, data=data)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Erro na API: {response.status_code} - {response.text}")

# Uso
try:
    result = analyze_image('./imagem.jpg', 'sua-api-key')
    
    print(f"Status: {result['status']}")
    print(f"NSFW: {result['nsfw']['isNSFW']}")
    print(f"Jogo: {result['games']['isGaming']}")
    
    # Salvar imagem borrada se disponível
    if result.get('blurred_image'):
        with open('./imagem_borrada.jpg', 'wb') as f:
            f.write(base64.b64decode(result['blurred_image']))
        print("Imagem borrada salva!")
        
except Exception as e:
    print(f"Erro: {e}")
```

### **3. PHP**

```php
<?php
function analyzeImage($imagePath, $apiKey) {
    $url = 'https://seu-dominio.com/api/v1/analyze';
    
    $postData = [
        'image' => new CURLFile($imagePath),
        'api_key' => $apiKey,
        'blur_enabled' => 'true',
        'include_metadata' => 'true'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        return json_decode($response, true);
    } else {
        throw new Exception("Erro na API: $httpCode - $response");
    }
}

// Uso
try {
    $result = analyzeImage('./imagem.jpg', 'sua-api-key');
    
    echo "Status: " . $result['status'] . "\n";
    echo "NSFW: " . ($result['nsfw']['isNSFW'] ? 'Sim' : 'Não') . "\n";
    echo "Jogo: " . ($result['games']['isGaming'] ? 'Sim' : 'Não') . "\n";
    
    // Salvar imagem borrada
    if (isset($result['blurred_image'])) {
        file_put_contents('./imagem_borrada.jpg', base64_decode($result['blurred_image']));
        echo "Imagem borrada salva!\n";
    }
    
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
?>
```

### **4. cURL (Linha de Comando)**

```bash
# Análise completa
curl -X POST \
  https://seu-dominio.com/api/v1/analyze \
  -H "Accept: application/json" \
  -F "image=@./imagem.jpg" \
  -F "api_key=sua-api-key" \
  -F "blur_enabled=true" \
  -F "include_metadata=true"

# Apenas NSFW
curl -X POST \
  https://seu-dominio.com/api/v1/analyze/nsfw \
  -H "Accept: application/json" \
  -F "image=@./imagem.jpg" \
  -F "api_key=sua-api-key" \
  -F "confidence_threshold=0.8"
```

## 📊 **Formato de Resposta**

### **Resposta de Sucesso (200)**

```json
{
  "status": "success",
  "timestamp": "2025-09-22T15:30:45.123Z",
  "processing_time_ms": 1250,
  "image_info": {
    "filename": "imagem.jpg",
    "size_bytes": 245760,
    "dimensions": {
      "width": 1920,
      "height": 1080
    },
    "format": "JPEG"
  },
  "nsfw": {
    "isNSFW": false,
    "confidence": 0.95,
    "classifications": [
      {
        "className": "Neutral",
        "probability": 0.85
      },
      {
        "className": "Drawing",
        "probability": 0.12
      },
      {
        "className": "Sexy",
        "probability": 0.03
      }
    ]
  },
  "games": {
    "isGaming": true,
    "confidence": 0.78,
    "detected_game": "League of Legends",
    "features": {
      "hud_elements": 0.82,
      "game_ui": 0.75,
      "minimap": 0.68
    }
  },
  "software": {
    "detected": true,
    "confidence": 0.65,
    "software_list": [
      {
        "name": "Steam",
        "confidence": 0.85,
        "type": "gaming_platform"
      }
    ],
    "urls": [
      "https://store.steampowered.com"
    ],
    "domains": [
      "steampowered.com"
    ]
  },
  "blur_info": {
    "applied": true,
    "level": "light",
    "reason": "gaming_content",
    "intensity_px": 3
  },
  "blurred_image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "metadata": {
    "model_versions": {
      "nsfw": "1.0.0",
      "games": "2.1.0",
      "ocr": "4.0.6"
    },
    "processing_details": {
      "nsfw_time_ms": 450,
      "games_time_ms": 380,
      "ocr_time_ms": 420
    }
  }
}
```

### **Resposta de Erro (400/401/500)**

```json
{
  "status": "error",
  "error_code": "INVALID_API_KEY",
  "message": "Chave de API inválida ou expirada",
  "timestamp": "2025-09-22T15:30:45.123Z",
  "details": {
    "provided_key": "abc123...",
    "valid_format": true,
    "expired": true
  }
}
```

## 🔑 **Autenticação**

### **Obter Chave de API**
1. Acesse o painel de administração
2. Vá para "Configurações" → "API Keys"
3. Clique em "Gerar Nova Chave"
4. Configure permissões e limites
5. Copie a chave gerada

### **Tipos de Chave**
- **Básica**: Análise NSFW e jogos
- **Avançada**: Inclui OCR e análise de ociosidade
- **Premium**: Todas as funcionalidades + borramento

### **Limites de Rate**
- **Básica**: 100 requisições/hora
- **Avançada**: 500 requisições/hora
- **Premium**: 2000 requisições/hora

## ⚙️ **Configuração do Servidor**

### **1. Criar Backend API**

```javascript
// server.js (Node.js + Express)
const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware de autenticação
function authenticateAPI(req, res, next) {
  const apiKey = req.body.api_key || req.headers['x-api-key'];
  
  if (!isValidAPIKey(apiKey)) {
    return res.status(401).json({
      status: 'error',
      error_code: 'INVALID_API_KEY',
      message: 'Chave de API inválida'
    });
  }
  
  req.apiKey = apiKey;
  next();
}

// Endpoint principal
app.post('/api/v1/analyze', upload.single('image'), authenticateAPI, async (req, res) => {
  try {
    const startTime = Date.now();
    const imagePath = req.file.path;
    
    // Executar análise usando o detector
    const result = await analyzeImageWithDetector(imagePath, req.body);
    
    // Limpar arquivo temporário
    fs.unlinkSync(imagePath);
    
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      processing_time_ms: Date.now() - startTime,
      ...result
    });
    
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error_code: 'PROCESSING_ERROR',
      message: error.message
    });
  }
});

app.listen(3000, () => {
  console.log('API rodando na porta 3000');
});
```

### **2. Configurar Nginx (Proxy Reverso)**

```nginx
# /etc/nginx/sites-available/detector-api
server {
    listen 80;
    server_name seu-dominio.com;
    
    client_max_body_size 50M;
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout para análises longas
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
    
    # Servir interface web
    location / {
        root /var/www/detector;
        try_files $uri $uri/ /index.html;
    }
}
```

### **3. Docker Compose**

```yaml
# docker-compose.yml
version: '3.8'

services:
  detector-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - API_RATE_LIMIT=1000
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - detector-api
    restart: unless-stopped
    
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
```

## 📈 **Monitoramento e Logs**

### **Métricas Importantes**
- Tempo de resposta por endpoint
- Taxa de erro por tipo
- Uso de CPU/memória
- Throughput de requisições

### **Logs Estruturados**
```json
{
  "timestamp": "2025-09-22T15:30:45.123Z",
  "level": "info",
  "endpoint": "/api/v1/analyze",
  "api_key": "abc123...",
  "processing_time_ms": 1250,
  "image_size_bytes": 245760,
  "nsfw_detected": false,
  "game_detected": true,
  "blur_applied": true
}
```

## 🛡️ **Segurança**

### **Boas Práticas**
- Use HTTPS em produção
- Implemente rate limiting
- Valide todos os inputs
- Sanitize nomes de arquivos
- Configure CORS adequadamente
- Use autenticação robusta

### **Validações Recomendadas**
```javascript
function validateImageUpload(file) {
  const allowedTypes = ['image/jpeg', 'image/png'];
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Tipo de arquivo não suportado');
  }
  
  if (file.size > maxSize) {
    throw new Error('Arquivo muito grande');
  }
  
  return true;
}
```

## 🔄 **Integração com Webhooks**

### **Configurar Webhook**
```javascript
// Notificar sistema externo após análise
async function notifyWebhook(result, webhookUrl) {
  try {
    await axios.post(webhookUrl, {
      event: 'analysis_complete',
      timestamp: new Date().toISOString(),
      data: result
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': generateSignature(result)
      }
    });
  } catch (error) {
    console.error('Erro no webhook:', error);
  }
}
```

## 📚 **SDKs Disponíveis**

### **JavaScript/TypeScript**
```bash
npm install detector-inteligente-sdk
```

### **Python**
```bash
pip install detector-inteligente
```

### **PHP**
```bash
composer require detector/inteligente
```

---

**Versão**: 7.3.2  
**Data**: 22/09/2025  
**Tipo**: Guia de Integração API  
**Suporte**: Todas as funcionalidades disponíveis
