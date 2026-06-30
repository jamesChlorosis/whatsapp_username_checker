# Plugin Guide

Generator plugins live under `plugins/`. Each plugin has a `manifest.json` and an entry module.

```json
{
  "id": "animals",
  "name": "Animals",
  "version": "1.0.0",
  "entry": "index.js",
  "description": "Animal-inspired username candidates"
}
```

Core contract:

```ts
interface UsernameGeneratorPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  generate(params: GenerateParams): AsyncIterable<string>;
  validate?(candidate: string): boolean;
  configSchema?: JSONSchema;
}
```

The core validator always runs after plugin generation. Plugin output is tagged by `source`, so disabling or deleting a plugin does not orphan previously generated rows.
