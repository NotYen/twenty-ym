#!/usr/bin/env node

/**
 * GraphQL Schema 导出到 Swagger/OpenAPI 工具
 *
 * 本脚本仅用于导出和查看，不会修改任何系统代码
 *
 * 使用方法:
 * 1. 确保服务器正在运行
 * 2. 运行: node packages/twenty-server/scripts/export-graphql-to-swagger.js
 * 3. 查看生成的文档: api-docs/swagger.json
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8867';
const OUTPUT_DIR = path.join(__dirname, '..', '..', '..', 'api-docs');

console.log('========================================');
console.log('Twenty CRM GraphQL to Swagger 转换工具');
console.log('========================================');
console.log('');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`✓ 创建输出目录: ${OUTPUT_DIR}`);
}

// GraphQL Introspection 查询
const introspectionQuery = `
  query IntrospectionQuery {
    __schema {
      queryType {
        name
        fields {
          name
          description
          args {
            name
            description
            type {
              name
              kind
              ofType {
                name
                kind
              }
            }
          }
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
      mutationType {
        name
        fields {
          name
          description
          args {
            name
            description
            type {
              name
              kind
              ofType {
                name
                kind
              }
            }
          }
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
      types {
        name
        kind
        description
        fields {
          name
          description
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
        enumValues {
          name
          description
        }
      }
    }
  }
`;

// 执行 GraphQL 查询
function fetchGraphQLSchema() {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SERVER_URL}/graphql`);
    const client = url.protocol === 'https:' ? https : http;

    const postData = JSON.stringify({
      query: introspectionQuery,
    });

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    console.log(`正在从 ${SERVER_URL}/graphql 获取 Schema...`);

    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.errors) {
            reject(
              new Error(`GraphQL 错误: ${JSON.stringify(response.errors)}`),
            );
          } else {
            resolve(response.data);
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// 将 GraphQL Schema 转换为 OpenAPI/Swagger 格式
function convertToSwagger(schema) {
  const swagger = {
    openapi: '3.0.0',
    info: {
      title: 'Twenty CRM API',
      version: '1.0.0',
      description: 'Twenty CRM GraphQL API 文档（自动生成）',
      contact: {
        name: 'Twenty CRM',
        url: 'https://twenty.com',
      },
    },
    servers: [
      {
        url: SERVER_URL,
        description: 'API Server',
      },
    ],
    paths: {},
    components: {
      schemas: {},
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: '使用 JWT Token 进行认证',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-KEY',
          description: '使用 API Key 进行认证',
        },
      },
    },
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    tags: [
      { name: 'Query', description: 'GraphQL 查询操作' },
      { name: 'Mutation', description: 'GraphQL 变更操作' },
    ],
  };

  // 处理 Query 类型
  if (schema.__schema.queryType && schema.__schema.queryType.fields) {
    schema.__schema.queryType.fields.forEach((field) => {
      const path = `/graphql (Query: ${field.name})`;
      swagger.paths[path] = {
        post: {
          tags: ['Query'],
          summary: field.name,
          description: field.description || `执行 ${field.name} 查询`,
          operationId: `query_${field.name}`,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    query: {
                      type: 'string',
                      example: `query { ${field.name} ${field.args.length > 0 ? '(...)' : ''} { ... } }`,
                    },
                    variables: {
                      type: 'object',
                      description: '查询变量',
                    },
                  },
                  required: ['query'],
                },
              },
            },
          },
          responses: {
            200: {
              description: '成功响应',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/GraphQLResponse',
                  },
                },
              },
            },
          },
        },
      };
    });
  }

  // 处理 Mutation 类型
  if (schema.__schema.mutationType && schema.__schema.mutationType.fields) {
    schema.__schema.mutationType.fields.forEach((field) => {
      const path = `/graphql (Mutation: ${field.name})`;
      swagger.paths[path] = {
        post: {
          tags: ['Mutation'],
          summary: field.name,
          description: field.description || `执行 ${field.name} 变更`,
          operationId: `mutation_${field.name}`,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    query: {
                      type: 'string',
                      example: `mutation { ${field.name} ${field.args.length > 0 ? '(...)' : ''} { ... } }`,
                    },
                    variables: {
                      type: 'object',
                      description: '变更变量',
                    },
                  },
                  required: ['query'],
                },
              },
            },
          },
          responses: {
            200: {
              description: '成功响应',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/GraphQLResponse',
                  },
                },
              },
            },
          },
        },
      };
    });
  }

  // 处理类型定义
  if (schema.__schema.types) {
    schema.__schema.types.forEach((type) => {
      // 跳过内置类型
      if (type.name.startsWith('__')) {
        return;
      }

      if (type.kind === 'OBJECT' && type.fields) {
        const schemaObj = {
          type: 'object',
          description: type.description || `${type.name} 类型`,
          properties: {},
        };

        type.fields.forEach((field) => {
          schemaObj.properties[field.name] = {
            description: field.description || '',
            type: mapGraphQLTypeToSwagger(field.type),
          };
        });

        swagger.components.schemas[type.name] = schemaObj;
      } else if (type.kind === 'ENUM' && type.enumValues) {
        swagger.components.schemas[type.name] = {
          type: 'string',
          description: type.description || `${type.name} 枚举`,
          enum: type.enumValues.map((v) => v.name),
        };
      }
    });
  }

  // 添加通用响应 Schema
  swagger.components.schemas.GraphQLResponse = {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        description: '返回的数据',
      },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: '错误信息',
            },
            locations: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
            path: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
        description: '错误列表（如果有）',
      },
    },
  };

  return swagger;
}

// 映射 GraphQL 类型到 Swagger 类型
function mapGraphQLTypeToSwagger(graphqlType) {
  if (!graphqlType) {
    return 'string';
  }

  const typeName =
    graphqlType.name || (graphqlType.ofType && graphqlType.ofType.name);

  switch (typeName) {
    case 'String':
      return 'string';
    case 'Int':
      return 'integer';
    case 'Float':
      return 'number';
    case 'Boolean':
      return 'boolean';
    case 'ID':
      return 'string';
    default:
      return 'object';
  }
}

// 主函数
async function main() {
  try {
    // 1. 获取 GraphQL Schema
    const schema = await fetchGraphQLSchema();
    console.log('✓ 成功获取 GraphQL Schema');
    console.log('');

    // 保存原始 Introspection 结果
    const introspectionPath = path.join(
      OUTPUT_DIR,
      'graphql-introspection.json',
    );
    fs.writeFileSync(introspectionPath, JSON.stringify(schema, null, 2));
    console.log(`✓ 保存 Introspection 结果: ${introspectionPath}`);

    // 2. 转换为 Swagger 格式
    console.log('');
    console.log('正在转换为 Swagger/OpenAPI 格式...');
    const swagger = convertToSwagger(schema);

    // 保存 Swagger 文档
    const swaggerPath = path.join(OUTPUT_DIR, 'swagger.json');
    fs.writeFileSync(swaggerPath, JSON.stringify(swagger, null, 2));
    console.log(`✓ 保存 Swagger 文档: ${swaggerPath}`);

    // 3. 生成统计信息
    console.log('');
    console.log('========================================');
    console.log('API 统计信息');
    console.log('========================================');
    console.log('');

    const queryCount = schema.__schema.queryType
      ? schema.__schema.queryType.fields.length
      : 0;
    const mutationCount = schema.__schema.mutationType
      ? schema.__schema.mutationType.fields.length
      : 0;
    const typeCount = schema.__schema.types.filter(
      (t) => !t.name.startsWith('__'),
    ).length;

    console.log(`查询操作 (Queries): ${queryCount} 个`);
    console.log(`变更操作 (Mutations): ${mutationCount} 个`);
    console.log(`类型定义 (Types): ${typeCount} 个`);
    console.log('');

    // 4. 提供后续步骤
    console.log('========================================');
    console.log('后续步骤');
    console.log('========================================');
    console.log('');
    console.log('1. 查看 Swagger 文档:');
    console.log(`   ${swaggerPath}`);
    console.log('');
    console.log('2. 使用 Swagger UI 查看（推荐）:');
    console.log('   - 访问 https://editor.swagger.io/');
    console.log('   - 导入生成的 swagger.json 文件');
    console.log('');
    console.log('3. 或者在 GraphQL Playground 中查看:');
    console.log(`   ${SERVER_URL}/graphql`);
    console.log('');
    console.log('✅ 导出完成!');
    console.log('');
  } catch (error) {
    console.error('');
    console.error('❌ 错误:', error.message);
    console.error('');
    console.error('请确保:');
    console.error('1. 服务器正在运行');
    console.error('2. GraphQL 端点可访问');
    console.error('3. 您有足够的权限');
    console.error('');
    process.exit(1);
  }
}

// 运行
main();
