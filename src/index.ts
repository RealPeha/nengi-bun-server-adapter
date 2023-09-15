import {
  ServerWebSocket,
  TLSOptions,
  GenericServeOptions,
  WebSocketHandler,
} from "bun";
import { IServerNetworkAdapter, User, InstanceNetwork } from "nengi";
import { BufferReader, BufferWriter } from "nengi-buffers";

interface UserData {
  user: User;
}

declare module "nengi" {
  interface User {
    ws: ServerWebSocket<UserData>;
  }
}

export interface BunServerAdapterOptions extends GenericServeOptions {
  ca?: TLSOptions["ca"];
  cert?: TLSOptions["cert"];
  dhParamsFile?: TLSOptions["dhParamsFile"];
  hostname?: string;
  key?: TLSOptions["key"];
  lowMemoryMode?: TLSOptions["lowMemoryMode"];
  passphrase?: TLSOptions["passphrase"];
  secureOptions?: TLSOptions["secureOptions"];
  serverName?: TLSOptions["serverName"];
  serverNames?: Record<string, TLSOptions>;
  tls?: TLSOptions;
  unix?: string;
  websocket?: Omit<WebSocketHandler<UserData>, "open" | "message" | "close">;
}

export class BunServerAdapter implements IServerNetworkAdapter {
  network: InstanceNetwork;
  options: BunServerAdapterOptions = {};

  constructor(network: InstanceNetwork, options: BunServerAdapterOptions = {}) {
    this.network = network;
    this.options = options;
  }

  listen(port: number, ready?: () => void) {
    const { websocket = {}, ...options } = this.options;

    Bun.serve<UserData>({
      ...options,
      port,
      websocket: {
        ...websocket,
        open: (ws) => {
          const user = new User(ws, this);
          user.ws = ws;
          ws.data = { user };
          user.remoteAddress = Buffer.from(ws.remoteAddress).toString("utf8");
          this.network.onOpen(user);
        },
        message: (ws, message) => {
          this.network.onMessage(ws.data.user, Buffer.from(message));
        },
        close: (ws, code, reason) => {
          this.network.onClose(ws.data.user);
        },
      },
      fetch(req, server) {
        const upgraded = server.upgrade(req);
        if (!upgraded) {
          return new Response("Upgrade failed");
        }
      },
    });

    ready?.();
  }

  disconnect(user: User, reason: any): void {
    user.ws.close(1000, JSON.stringify(reason));
  }

  send(user: User, buffer: Buffer): void {
    user.ws.sendBinary(buffer, true);
  }

  createBuffer(lengthInBytes: number) {
    return Buffer.allocUnsafe(lengthInBytes);
  }

  createBufferWriter(lengthInBytes: number) {
    return new BufferWriter(this.createBuffer(lengthInBytes));
  }

  createBufferReader(buffer: Buffer) {
    return new BufferReader(buffer);
  }
}
