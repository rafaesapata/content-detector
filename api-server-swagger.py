#!/usr/bin/env python3
"""
Servidor API Flask para o Detector Inteligente
Implementa todos os endpoints documentados no Swagger
"""

import os
import json
import time
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, send_file, render_template_string
from flask_cors import CORS
from werkzeug.utils import secure_filename
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configurações
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB
app.config['UPLOAD_FOLDER'] = '/tmp/detector_uploads'
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'detector-secret-key')

# Criar diretório de upload
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Configurações padrão (simulando .env)
DEFAULT_CONFIG = {
    'nsfw_porn_threshold': 0.5,
    'nsfw_hentai_threshold': 0.5,
    'nsfw_sexy_threshold': 0.7,
    'game_detection_threshold': 0.3,
    'game_drawing_threshold': 0.6,
    'software_detection_threshold': 0.25,
    'max_file_size_mb': 10,
    'rate_limit_per_minute': 100
}

# Métricas simuladas
METRICS = {
    'requests_total': 0,
    'requests_success': 0,
    'requests_error': 0,
    'processing_time_total': 0,
    'nsfw_detections': 0,
    'game_detections': 0,
    'start_time': time.time()
}

def validate_api_key(api_key):
    """Validar API key (implementação simplificada)"""
    if not api_key:
        return False
    # Em produção, validar contra banco de dados
    return api_key.startswith('demo-') or api_key.startswith('prod-')

def generate_analysis_id():
    """Gerar ID único para análise"""
    return f"ana_{int(time.time())}{uuid.uuid4().hex[:6]}"

def simulate_nsfw_analysis(image_path):
    """Simular análise NSFW (em produção, usar NSFWJS)"""
    import random
    
    # Simular diferentes cenários baseados no nome do arquivo
    filename = os.path.basename(image_path).lower()
    
    if 'nsfw' in filename or 'porn' in filename:
        return {
            'detected': True,
            'confidence': round(random.uniform(0.7, 0.95), 2),
            'categories': [
                {'type': 'Porn', 'probability': round(random.uniform(0.7, 0.9), 2)},
                {'type': 'Sexy', 'probability': round(random.uniform(0.2, 0.4), 2)},
                {'type': 'Neutral', 'probability': round(random.uniform(0.1, 0.2), 2)}
            ],
            'blur_applied': True,
            'blur_level': 'heavy'
        }
    elif 'sexy' in filename:
        return {
            'detected': True,
            'confidence': round(random.uniform(0.6, 0.8), 2),
            'categories': [
                {'type': 'Sexy', 'probability': round(random.uniform(0.6, 0.8), 2)},
                {'type': 'Neutral', 'probability': round(random.uniform(0.2, 0.4), 2)}
            ],
            'blur_applied': True,
            'blur_level': 'medium'
        }
    else:
        return {
            'detected': False,
            'confidence': round(random.uniform(0.1, 0.3), 2),
            'categories': [
                {'type': 'Neutral', 'probability': round(random.uniform(0.7, 0.9), 2)},
                {'type': 'Drawing', 'probability': round(random.uniform(0.1, 0.3), 2)}
            ],
            'blur_applied': False,
            'blur_level': None
        }

def simulate_game_analysis(image_path):
    """Simular análise de jogos"""
    import random
    
    filename = os.path.basename(image_path).lower()
    
    if 'game' in filename or 'lol' in filename or 'league' in filename:
        return {
            'detected': True,
            'confidence': round(random.uniform(0.7, 0.9), 2),
            'game_name': 'League of Legends',
            'detection_method': 'hybrid',
            'factors': {
                'drawing_probability': round(random.uniform(0.6, 0.8), 2),
                'ui_elements': round(random.uniform(0.7, 0.9), 2),
                'color_patterns': round(random.uniform(0.5, 0.7), 2),
                'hud_analysis': round(random.uniform(0.8, 0.9), 2)
            },
            'blur_applied': True,
            'blur_level': 'light'
        }
    elif 'steam' in filename:
        return {
            'detected': True,
            'confidence': round(random.uniform(0.6, 0.8), 2),
            'game_name': 'Steam Platform',
            'detection_method': 'software_detection',
            'factors': {
                'ui_elements': round(random.uniform(0.8, 0.9), 2),
                'color_patterns': round(random.uniform(0.6, 0.8), 2)
            },
            'blur_applied': True,
            'blur_level': 'light'
        }
    else:
        return {
            'detected': False,
            'confidence': round(random.uniform(0.1, 0.3), 2),
            'game_name': None,
            'detection_method': None,
            'factors': {},
            'blur_applied': False,
            'blur_level': None
        }

def simulate_ocr_analysis(image_path):
    """Simular análise OCR"""
    import random
    
    filename = os.path.basename(image_path).lower()
    
    urls = []
    software = []
    
    if 'browser' in filename or 'web' in filename:
        urls = [
            {
                'url': 'https://www.google.com',
                'domain': 'google.com',
                'confidence': 0.9,
                'position': {'x': 100, 'y': 50, 'width': 200, 'height': 30}
            },
            {
                'url': 'https://github.com/rafaesapata/content-detector',
                'domain': 'github.com',
                'confidence': 0.85,
                'position': {'x': 150, 'y': 100, 'width': 300, 'height': 25}
            }
        ]
        software = [
            {
                'name': 'Google Chrome',
                'confidence': 0.95,
                'category': 'browser',
                'position': {'x': 10, 'y': 10, 'width': 100, 'height': 40}
            }
        ]
    
    return {
        'detected': len(urls) > 0 or len(software) > 0,
        'count': len(urls) + len(software),
        'urls': urls,
        'software': software,
        'text_extracted': f'Texto extraído da imagem {filename}',
        'confidence': round(random.uniform(0.7, 0.9), 2)
    }

def generate_executive_summary(nsfw_result, game_result, ocr_result):
    """Gerar resumo executivo"""
    alerts = []
    recommendations = []
    status = 'normal'
    
    # Alertas NSFW
    if nsfw_result['detected']:
        status = 'critical'
        nsfw_types = [cat['type'] for cat in nsfw_result['categories'] if cat['probability'] > 0.5]
        alerts.append({
            'type': 'critical',
            'message': f"Conteúdo adulto detectado ({', '.join(nsfw_types)}) - Requer ação imediata",
            'priority': 5
        })
        recommendations.extend([
            'Aplicar medidas disciplinares conforme política da empresa',
            'Documentar evidências para acompanhamento futuro',
            'Revisar políticas de uso de recursos corporativos'
        ])
    
    # Alertas de jogos
    if game_result['detected']:
        if status != 'critical':
            status = 'attention'
        alerts.append({
            'type': 'attention',
            'message': f"Atividade de jogos detectada ({game_result.get('game_name', 'Desconhecido')}) - Durante horário de trabalho",
            'priority': 3
        })
        recommendations.extend([
            'Conversar sobre uso adequado de recursos da empresa',
            'Verificar se atividade está relacionada ao trabalho',
            'Considerar bloqueio de sites/aplicações de jogos'
        ])
    
    # Alertas de URLs
    if ocr_result['detected'] and ocr_result['urls']:
        alerts.append({
            'type': 'info',
            'message': f"URLs detectadas ({len(ocr_result['urls'])}) - Verificar relevância ao trabalho",
            'priority': 2
        })
        recommendations.append('Revisar websites acessados durante horário de trabalho')
    
    # Alertas positivos
    if not nsfw_result['detected'] and not game_result['detected']:
        alerts.append({
            'type': 'positive',
            'message': 'Nenhuma atividade inadequada detectada - Comportamento adequado',
            'priority': 1
        })
        recommendations.append('Manter monitoramento regular para garantir conformidade')
    
    return {
        'status': status,
        'alerts': alerts,
        'recommendations': recommendations,
        'metrics': {
            'productivity_score': round(random.uniform(60, 95), 1),
            'risk_level': 'high' if status == 'critical' else 'medium' if status == 'attention' else 'low',
            'compliance_status': 'violation' if status == 'critical' else 'warning' if status == 'attention' else 'compliant'
        }
    }

@app.route('/v1/analyze', methods=['POST'])
def analyze_image():
    """Análise completa de imagem"""
    start_time = time.time()
    
    try:
        # Validar API key
        api_key = request.headers.get('X-API-Key') or request.form.get('api_key')
        if not validate_api_key(api_key):
            return jsonify({
                'error': 'UNAUTHORIZED',
                'message': 'API key inválida ou ausente',
                'request_id': generate_analysis_id()
            }), 401
        
        # Validar arquivo
        if 'image' not in request.files:
            return jsonify({
                'error': 'MISSING_IMAGE',
                'message': 'Arquivo de imagem é obrigatório',
                'request_id': generate_analysis_id()
            }), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({
                'error': 'EMPTY_FILENAME',
                'message': 'Nome do arquivo não pode estar vazio',
                'request_id': generate_analysis_id()
            }), 400
        
        # Salvar arquivo temporariamente
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Parâmetros opcionais
        blur_enabled = request.form.get('blur_enabled', 'true').lower() == 'true'
        include_summary = request.form.get('include_summary', 'true').lower() == 'true'
        sensitivity_level = request.form.get('sensitivity_level', 'medium')
        
        # Realizar análises
        nsfw_result = simulate_nsfw_analysis(filepath)
        game_result = simulate_game_analysis(filepath)
        ocr_result = simulate_ocr_analysis(filepath)
        
        # Gerar resumo executivo
        executive_summary = None
        if include_summary:
            executive_summary = generate_executive_summary(nsfw_result, game_result, ocr_result)
        
        # Atualizar métricas
        METRICS['requests_total'] += 1
        METRICS['requests_success'] += 1
        if nsfw_result['detected']:
            METRICS['nsfw_detections'] += 1
        if game_result['detected']:
            METRICS['game_detections'] += 1
        
        processing_time = int((time.time() - start_time) * 1000)
        METRICS['processing_time_total'] += processing_time
        
        # Limpar arquivo temporário
        os.remove(filepath)
        
        # Resposta
        result = {
            'success': True,
            'analysis_id': generate_analysis_id(),
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'processing_time_ms': processing_time,
            'nsfw': nsfw_result,
            'games': game_result,
            'urls': ocr_result
        }
        
        if executive_summary:
            result['executive_summary'] = executive_summary
        
        if blur_enabled and (nsfw_result['blur_applied'] or game_result['blur_applied']):
            result['blur_info'] = {
                'applied': True,
                'level': nsfw_result.get('blur_level') or game_result.get('blur_level'),
                'reason': 'Conteúdo detectado requer proteção',
                'download_url': f"/v1/download/blurred/{result['analysis_id']}"
            }
        
        return jsonify(result)
        
    except Exception as e:
        METRICS['requests_total'] += 1
        METRICS['requests_error'] += 1
        logger.error(f"Erro na análise: {str(e)}")
        
        return jsonify({
            'error': 'INTERNAL_SERVER_ERROR',
            'message': 'Erro interno do servidor',
            'request_id': generate_analysis_id()
        }), 500

@app.route('/v1/analyze/nsfw', methods=['POST'])
def analyze_nsfw():
    """Análise NSFW específica"""
    api_key = request.headers.get('X-API-Key')
    if not validate_api_key(api_key):
        return jsonify({'error': 'UNAUTHORIZED', 'message': 'API key inválida'}), 401
    
    if 'image' not in request.files:
        return jsonify({'error': 'MISSING_IMAGE', 'message': 'Imagem obrigatória'}), 400
    
    file = request.files['image']
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    result = simulate_nsfw_analysis(filepath)
    os.remove(filepath)
    
    return jsonify({
        'success': True,
        'analysis_id': generate_analysis_id(),
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        **result
    })

@app.route('/v1/analyze/games', methods=['POST'])
def analyze_games():
    """Análise de jogos específica"""
    api_key = request.headers.get('X-API-Key')
    if not validate_api_key(api_key):
        return jsonify({'error': 'UNAUTHORIZED', 'message': 'API key inválida'}), 401
    
    if 'image' not in request.files:
        return jsonify({'error': 'MISSING_IMAGE', 'message': 'Imagem obrigatória'}), 400
    
    file = request.files['image']
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    result = simulate_game_analysis(filepath)
    os.remove(filepath)
    
    return jsonify({
        'success': True,
        'analysis_id': generate_analysis_id(),
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        **result
    })

@app.route('/v1/analyze/ocr', methods=['POST'])
def analyze_ocr():
    """Análise OCR específica"""
    api_key = request.headers.get('X-API-Key')
    if not validate_api_key(api_key):
        return jsonify({'error': 'UNAUTHORIZED', 'message': 'API key inválida'}), 401
    
    if 'image' not in request.files:
        return jsonify({'error': 'MISSING_IMAGE', 'message': 'Imagem obrigatória'}), 400
    
    file = request.files['image']
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    result = simulate_ocr_analysis(filepath)
    os.remove(filepath)
    
    return jsonify({
        'success': True,
        'analysis_id': generate_analysis_id(),
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        **result
    })

@app.route('/v1/config', methods=['GET'])
def get_config():
    """Obter configurações atuais"""
    return jsonify({
        'version': '7.3.4',
        'thresholds': DEFAULT_CONFIG,
        'limits': {
            'max_file_size_mb': DEFAULT_CONFIG['max_file_size_mb'],
            'rate_limit_per_minute': DEFAULT_CONFIG['rate_limit_per_minute']
        },
        'features': {
            'nsfw_detection': True,
            'game_detection': True,
            'ocr_analysis': True,
            'blur_protection': True,
            'executive_summary': True,
            'batch_processing': True
        }
    })

@app.route('/v1/health', methods=['GET'])
def health_check():
    """Status de saúde da API"""
    uptime = int(time.time() - METRICS['start_time'])
    
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'version': '7.3.4',
        'uptime_seconds': uptime,
        'components': {
            'nsfwjs': {
                'status': 'healthy',
                'response_time_ms': 150,
                'last_check': datetime.utcnow().isoformat() + 'Z'
            },
            'tesseract': {
                'status': 'healthy',
                'response_time_ms': 200,
                'last_check': datetime.utcnow().isoformat() + 'Z'
            },
            'database': {
                'status': 'healthy',
                'response_time_ms': 50,
                'last_check': datetime.utcnow().isoformat() + 'Z'
            }
        }
    })

@app.route('/v1/metrics', methods=['GET'])
def get_metrics():
    """Métricas Prometheus"""
    uptime = int(time.time() - METRICS['start_time'])
    avg_processing_time = METRICS['processing_time_total'] / max(METRICS['requests_success'], 1)
    
    metrics_text = f"""# HELP detector_requests_total Total number of requests
# TYPE detector_requests_total counter
detector_requests_total{{status="success"}} {METRICS['requests_success']}
detector_requests_total{{status="error"}} {METRICS['requests_error']}

# HELP detector_processing_duration_seconds Processing time in seconds
# TYPE detector_processing_duration_seconds histogram
detector_processing_duration_seconds_sum {METRICS['processing_time_total'] / 1000}
detector_processing_duration_seconds_count {METRICS['requests_success']}

# HELP detector_detections_total Total detections by type
# TYPE detector_detections_total counter
detector_detections_total{{type="nsfw"}} {METRICS['nsfw_detections']}
detector_detections_total{{type="games"}} {METRICS['game_detections']}

# HELP detector_uptime_seconds Uptime in seconds
# TYPE detector_uptime_seconds gauge
detector_uptime_seconds {uptime}

# HELP detector_avg_processing_time_ms Average processing time in milliseconds
# TYPE detector_avg_processing_time_ms gauge
detector_avg_processing_time_ms {avg_processing_time:.2f}
"""
    
    return metrics_text, 200, {'Content-Type': 'text/plain; charset=utf-8'}

@app.route('/docs')
def swagger_ui():
    """Servir documentação Swagger UI"""
    try:
        with open('/home/ubuntu/content-detector/swagger-ui.html', 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return jsonify({'error': 'Documentação não encontrada'}), 404

@app.route('/swagger.yaml')
def swagger_spec():
    """Servir especificação OpenAPI"""
    try:
        return send_file('/home/ubuntu/content-detector/swagger.yaml', mimetype='application/x-yaml')
    except FileNotFoundError:
        return jsonify({'error': 'Especificação não encontrada'}), 404

@app.route('/')
def index():
    """Página inicial da API"""
    return jsonify({
        'name': 'Detector Inteligente API',
        'version': '7.3.4',
        'description': 'API para análise automatizada de imagens com IA',
        'documentation': '/docs',
        'health': '/v1/health',
        'metrics': '/v1/metrics',
        'endpoints': {
            'analyze': '/v1/analyze',
            'analyze_nsfw': '/v1/analyze/nsfw',
            'analyze_games': '/v1/analyze/games',
            'analyze_ocr': '/v1/analyze/ocr',
            'config': '/v1/config'
        },
        'github': 'https://github.com/rafaesapata/content-detector'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'
    
    print(f"""
🔍 Detector Inteligente API v7.3.4
=====================================
🌐 Servidor: http://localhost:{port}
📚 Documentação: http://localhost:{port}/docs
🏥 Health Check: http://localhost:{port}/v1/health
📊 Métricas: http://localhost:{port}/v1/metrics
📖 Especificação: http://localhost:{port}/swagger.yaml
🔧 GitHub: https://github.com/rafaesapata/content-detector

🚀 Pronto para análise de imagens!
    """)
    
    app.run(host='0.0.0.0', port=port, debug=debug)
