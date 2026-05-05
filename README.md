# portwatch

Lightweight daemon that monitors port usage and alerts on unexpected bindings.

## Installation

```bash
npm install -g portwatch
```

## Usage

Start the daemon with a configuration file:

```bash
portwatch start --config portwatch.config.json
```

Example `portwatch.config.json`:

```json
{
  "allowedPorts": [80, 443, 3000],
  "alertOn": "unexpected-binding",
  "notify": ["console", "webhook"],
  "webhookUrl": "https://your-alert-endpoint.example.com"
}
```

Once running, portwatch will monitor all active port bindings on the host and emit an alert whenever a process binds to a port not listed in `allowedPorts`.

```bash
# View current port watch status
portwatch status

# Stop the daemon
portwatch stop
```

### Programmatic Usage

```typescript
import { Portwatch } from 'portwatch';

const watcher = new Portwatch({
  allowedPorts: [80, 443, 3000],
  onUnexpectedBinding: (port, pid) => {
    console.warn(`Unexpected binding on port ${port} by PID ${pid}`);
  },
});

watcher.start();
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)