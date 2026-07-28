export const OPENAPI_EXAMPLE_ID = 'openapi-exemplo'

const viacepOpenApi = {
  openapi: '3.1.0',
  info: {
    title: 'ViaCEP',
    version: '1.0',
    description: 'Consulta pública de endereços e CEPs brasileiros.',
  },
  servers: [
    {
      url: 'https://viacep.com.br',
      description: 'Servidor público',
    },
  ],
  tags: [
    {
      name: 'CEP',
      description: 'Operações para localizar endereços e códigos postais.',
    },
  ],
  paths: {
    '/ws/{cep}/json/': {
      get: {
        operationId: 'buscarEnderecoPorCep',
        tags: ['CEP'],
        summary: 'Buscar endereço por CEP',
        description: 'Retorna o endereço correspondente a um CEP com oito dígitos.',
        parameters: [
          {
            name: 'cep',
            in: 'path',
            required: true,
            description: 'CEP com oito dígitos, sem pontuação.',
            example: '01001000',
            schema: {
              type: 'string',
              pattern: '^\\d{8}$',
            },
          },
        ],
        responses: {
          200: {
            description: 'Endereço encontrado ou indicação de CEP inexistente.',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/Endereco' },
                    { $ref: '#/components/schemas/NaoEncontrado' },
                  ],
                },
                examples: {
                  encontrado: {
                    value: {
                      cep: '01001-000',
                      logradouro: 'Praça da Sé',
                      complemento: 'lado ímpar',
                      bairro: 'Sé',
                      localidade: 'São Paulo',
                      uf: 'SP',
                      ddd: '11',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'CEP com formato inválido.',
          },
        },
      },
    },
    '/ws/{uf}/{cidade}/{logradouro}/json/': {
      get: {
        operationId: 'buscarCepPorEndereco',
        tags: ['CEP'],
        summary: 'Buscar CEP por endereço',
        description: 'Retorna até 50 CEPs candidatos para um endereço parcial.',
        parameters: [
          {
            name: 'uf',
            in: 'path',
            required: true,
            description: 'Sigla do estado.',
            example: 'SP',
            schema: { type: 'string', minLength: 2, maxLength: 2 },
          },
          {
            name: 'cidade',
            in: 'path',
            required: true,
            description: 'Nome da cidade, com ao menos três caracteres.',
            example: 'Sao Paulo',
            schema: { type: 'string' },
          },
          {
            name: 'logradouro',
            in: 'path',
            required: true,
            description: 'Nome do logradouro.',
            example: 'Vergueiro',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Lista de endereços candidatos.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Endereco' },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Endereco: {
        type: 'object',
        required: ['cep', 'logradouro', 'localidade', 'uf'],
        properties: {
          cep: { type: 'string', description: 'CEP formatado com hífen.', example: '01001-000' },
          logradouro: { type: 'string', description: 'Rua, avenida ou praça.', example: 'Praça da Sé' },
          complemento: { type: 'string', description: 'Informação complementar.', example: 'lado ímpar' },
          bairro: { type: 'string', description: 'Bairro.', example: 'Sé' },
          localidade: { type: 'string', description: 'Município.', example: 'São Paulo' },
          uf: { type: 'string', description: 'Sigla do estado.', example: 'SP' },
          ddd: { type: 'string', description: 'Código de discagem.', example: '11' },
        },
      },
      NaoEncontrado: {
        type: 'object',
        required: ['erro'],
        properties: {
          erro: { type: 'boolean', description: 'Indica que o CEP não existe.', example: true },
        },
      },
    },
  },
}

export function buildReferenceExamplePublication() {
  return {
    schemaVersion: 2,
    renderMode: 'reference',
    id: OPENAPI_EXAMPLE_ID,
    title: 'ViaCEP — Referência da API',
    date: '2026-07-28',
    from: 'Sistema · Exemplo OpenAPI',
    intro: [
      '**Uma referência técnica gerada a partir do contrato OpenAPI.** Navegue pelas operações, parâmetros e respostas sem manter uma página manual.',
    ],
    source: {
      type: 'openapi',
      document: viacepOpenApi,
    },
    settings: {
      colorIndex: 0,
      fontIndex: 0,
      chartStyleIndex: 2,
      widthMode: 'full',
      fontScale: 'default',
      componentStyle: 'editorial',
    },
    body: [
      {
        type: 'callout',
        id: 'usage-warning',
        tone: 'warning',
        label: 'Uso responsável',
        text: 'Use cache local e evite consultas em massa ao serviço público.',
      },
    ],
  }
}

