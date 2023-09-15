# [Bun](https://bun.sh/) web socket server network adapter for nengi v2

> **Warning**
> This adapter is written and tested only on nengi v2.0.0-alpha.138, this is an unstable version, the api of which may change in the future

### Install

```bash
bun add nengi-bun-server-adapter
```

### Usage

#### Server-side

```ts
import { Instance, Context } from "nengi";
import { BunServerAdapter } from "nengi-bun-server-adapter";

const ctx = new Context();
// <...>
const instance = new Instance(ctx);

const adapter = new BunServerAdapter(instance.network);
adapter.listen(PORT);
```

Adapter internally uses Bun.serve so if you want to pass additional options for the Bun.serve you can pass them as the second argument

```ts
const adapter = new BunServerAdapter(instance.network, {
  lowMemoryMode: true,
  websocket: {
    sendPings: false,
  },
});
```

All available Bun.serve options is described here https://bun.sh/docs/api/websockets

#### Client-side

For client-side you need any web socket adapter, for example [nengi-websocket-client-adapter](https://github.com/timetocode/nengi-websocket-client-adapter)
