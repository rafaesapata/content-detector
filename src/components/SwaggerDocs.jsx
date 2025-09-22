import React, { useEffect } from 'react';

const SwaggerDocs = () => {
  useEffect(() => {
    // Carregar Swagger UI dinamicamente
    const loadSwaggerUI = async () => {
      // Carregar CSS do Swagger UI
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = 'https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui.css';
      document.head.appendChild(link);

      // Carregar JavaScript do Swagger UI
      const script1 = document.createElement('script');
      script1.src = 'https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-bundle.js';
      script1.onload = () => {
        const script2 = document.createElement('script');
        script2.src = 'https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-standalone-preset.js';
        script2.onload = initSwagger;
        document.body.appendChild(script2);
      };
      document.body.appendChild(script1);
    };

    const initSwagger = () => {
      if (window.SwaggerUIBundle) {
        const ui = window.SwaggerUIBundle({
          url: './swagger.yaml',
          dom_id: '#swagger-ui-container',
          deepLinking: true,
          presets: [
            window.SwaggerUIBundle.presets.apis,
            window.SwaggerUIStandalonePreset
          ],
          plugins: [
            window.SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: "StandaloneLayout",
          defaultModelsExpandDepth: 1,
          defaultModelExpandDepth: 1,
          docExpansion: "list",
          filter: true,
          showExtensions: true,
          showCommonExtensions: true,
          tryItOutEnabled: true,
          requestInterceptor: function(request) {
            // Adicionar API key automaticamente se disponível
            const apiKey = localStorage.getItem('detector-api-key');
            if (apiKey && !request.headers['X-API-Key']) {
              request.headers['X-API-Key'] = apiKey;
            }
            return request;
          },
          onComplete: function() {
            console.log('Swagger UI carregado com sucesso');
          },
          validatorUrl: null
        });
      }
    };

    loadSwaggerUI();

    // Cleanup
    return () => {
      // Remover scripts e links adicionados
      const scripts = document.querySelectorAll('script[src*="swagger-ui"]');
      const links = document.querySelectorAll('link[href*="swagger-ui"]');
      scripts.forEach(script => script.remove());
      links.forEach(link => link.remove());
    };
  }, []);

  return (
    <div className="swagger-docs-container">
      {/* Header personalizado */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 px-4 text-center">
        <h1 className="text-4xl font-bold mb-2">🔍 Detector Inteligente API</h1>
        <p className="text-xl opacity-90">Documentação Swagger/OpenAPI v7.3.4</p>
      </div>

      {/* Estatísticas */}
      <div className="bg-gray-50 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">93%</div>
              <div className="text-sm text-gray-600">Precisão NSFW</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">60+</div>
              <div className="text-sm text-gray-600">Parâmetros Configuráveis</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-purple-600">8</div>
              <div className="text-sm text-gray-600">Endpoints Principais</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-orange-600">100%</div>
              <div className="text-sm text-gray-600">Processamento Local</div>
            </div>
          </div>
        </div>
      </div>

      {/* Início rápido */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-blue-800 mb-4">🚀 Início Rápido</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-blue-700">1. Obter API Key</h3>
              <code className="block bg-gray-800 text-green-400 p-2 rounded mt-1 text-sm">
                curl -X POST /v1/auth/register -d '{"email": "seu@email.com"}'
              </code>
            </div>
            <div>
              <h3 className="font-semibold text-blue-700">2. Análise de Imagem</h3>
              <code className="block bg-gray-800 text-green-400 p-2 rounded mt-1 text-sm">
                curl -X POST /v1/analyze -H "X-API-Key: demo-key-123" -F "image=@screenshot.jpg"
              </code>
            </div>
          </div>
        </div>

        {/* Campo para API Key */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">🔑 Configurar API Key</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Sua API Key (ex: demo-key-123)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded"
              id="api-key-input"
            />
            <button
              onClick={() => {
                const apiKey = document.getElementById('api-key-input').value.trim();
                if (apiKey) {
                  localStorage.setItem('detector-api-key', apiKey);
                  alert('API Key salva com sucesso!');
                  document.getElementById('api-key-input').value = '';
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
          <p className="text-sm text-yellow-700 mt-2">
            Use <code>demo-key-123</code> para testes. A chave será aplicada automaticamente nas requisições.
          </p>
        </div>
      </div>

      {/* Container do Swagger UI */}
      <div className="max-w-full">
        <div id="swagger-ui-container"></div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>&copy; 2025 Detector Inteligente. Desenvolvido por Rafael Sapata</p>
          <div className="mt-2 space-x-4">
            <a href="https://github.com/rafaesapata/content-detector" className="text-blue-400 hover:text-blue-300">
              GitHub
            </a>
            <a href="https://github.com/rafaesapata/content-detector/blob/main/LICENSE" className="text-blue-400 hover:text-blue-300">
              Licença MIT
            </a>
            <a href="https://github.com/rafaesapata/content-detector/issues" className="text-blue-400 hover:text-blue-300">
              Suporte
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwaggerDocs;
