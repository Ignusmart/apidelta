import {
  Controller,
  Post,
  Get,
  Headers,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { McpTools } from './mcp.tools';
import { ApiKeysService } from '../team/api-keys.service';

const MCP_PROTOCOL_VERSION = '2024-11-05';
const SERVER_INFO = { name: 'apidelta-mcp', version: '0.1.0' };

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

/**
 * Hand-rolled MCP server (Streamable HTTP transport, single POST endpoint).
 * The wire format is JSON-RPC 2.0; we implement the three methods needed
 * for a tool-only server: initialize, tools/list, tools/call. No
 * notifications, no SSE — keeps the implementation small and stateless.
 *
 * Auth: `Authorization: Bearer ad_live_...` per request. The team scope
 * comes from the API key, never from a user-supplied header.
 */
@Controller('mcp')
export class McpController {
  constructor(
    private readonly tools: McpTools,
    private readonly apiKeys: ApiKeysService,
  ) {}

  /**
   * Convenience GET for sanity checks (curl https://api.apidelta.dev/api/mcp).
   * The MCP protocol itself only uses POST; this endpoint just returns
   * server identity so users can confirm the URL is reachable.
   */
  @Get()
  async info() {
    return {
      protocol: 'mcp',
      protocolVersion: MCP_PROTOCOL_VERSION,
      transport: 'streamable-http',
      server: SERVER_INFO,
      auth: 'Authorization: Bearer <api-key>',
    };
  }

  @Post()
  async handle(
    @Headers('authorization') authHeader: string | undefined,
    @Body() body: JsonRpcRequest | JsonRpcRequest[],
  ): Promise<JsonRpcResponse | JsonRpcResponse[]> {
    const ctx = await this.authenticate(authHeader);

    if (Array.isArray(body)) {
      return Promise.all(body.map((req) => this.dispatch(req, ctx)));
    }
    return this.dispatch(body, ctx);
  }

  // ── Auth ────────────────────────────────────────

  private async authenticate(authHeader: string | undefined): Promise<{ teamId: string }> {
    const match = authHeader?.match(/^Bearer\s+(\S+)/i);
    if (!match) {
      throw new HttpException(
        'Missing Authorization header. Expected: Bearer <api-key>',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const result = await this.apiKeys.authenticateKey(match[1]);
    if (!result) {
      throw new HttpException('Invalid or revoked API key', HttpStatus.UNAUTHORIZED);
    }
    return { teamId: result.teamId };
  }

  // ── JSON-RPC dispatcher ────────────────────────

  private async dispatch(req: JsonRpcRequest, ctx: { teamId: string }): Promise<JsonRpcResponse> {
    const id = req?.id ?? null;
    if (!req || req.jsonrpc !== '2.0' || typeof req.method !== 'string') {
      return jsonRpcError(id, -32600, 'Invalid Request');
    }

    switch (req.method) {
      case 'initialize':
        return jsonRpcResult(id, {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        });

      case 'notifications/initialized':
      case 'initialized':
        // Notifications carry no `id` — return an empty success that the
        // caller will discard. Some clients still expect a 2xx.
        return jsonRpcResult(id, {});

      case 'ping':
        return jsonRpcResult(id, {});

      case 'tools/list':
        return jsonRpcResult(id, { tools: this.tools.list() });

      case 'tools/call': {
        const params = (req.params ?? {}) as { name?: string; arguments?: Record<string, unknown> };
        const name = params.name;
        if (typeof name !== 'string') {
          return jsonRpcError(id, -32602, 'tools/call requires a `name` parameter');
        }
        const result = await this.tools.call(name, params.arguments ?? {}, ctx);
        return jsonRpcResult(id, result);
      }

      default:
        return jsonRpcError(id, -32601, `Method not found: ${req.method}`);
    }
  }
}

function jsonRpcResult(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

function jsonRpcError(
  id: string | number | null,
  code: number,
  message: string,
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message } };
}
