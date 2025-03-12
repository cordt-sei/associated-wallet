# Improved Associated Wallet Query API

A straightforward API to query associated Sei (Bech32) and EVM (Hex) wallet addresses using gRPC and Express.

## Features
- Convert Sei addresses to EVM addresses and vice versa.
- Batch queries for multiple addresses.
- Validates address formats before processing.
- Node.js clustering for improved performance.
- Health check endpoint for monitoring.

## Requirements
- Node.js v18+
- Yarn (recommended) or npm
- Dependencies: `@grpc/grpc-js`, `@grpc/proto-loader`, `express`, `dotenv`, `bech32`

## Installation

1. Clone the repository:

```bash
git clone https://github.com/cordt-sei/associated-wallet.git
cd associated-wallet
```

2. Install dependencies:

```bash
yarn install
```

3. Configure environment variables in `.env`:

```env
PORT=3000
grpcAddress=grpc.sei-apis.com:443
```

4. Ensure `sei_evm.proto` is in the root directory.

## Running the API Server

```bash
node index.js
```

The server will start on port `3000` by default (configurable in `.env`).

## API Endpoints

### GET `/address`

Converts a single Sei or EVM address. Accessible directly via browser or `curl`.

Example:

```bash
curl -s https://wallets.sei.basementnodes.ca/sei1address...
```

Response:

```json
{
  "original": "sei1address...",
  "result": "0xaddress..."
}
```

- Returns `null` for invalid or unassociated addresses.

### POST `/query-address`

Convert multiple Sei/EVM addresses simultaneously.

**Request Body**:

```json
{
  "addresses": ["sei1exampleaddress123", "0xExampleEVMAddress456"]
}
```

Response:

```json
[
  "0xAssociatedEVMAddress",
  "sei1AssociatedSeiAddress"
]
```

- Single or multiple addresses are accepted.
- Invalid addresses yield `null`.

## Health Check

Check server status:

```bash
curl http://localhost:3000
```

## Deploy as Systemd Service (Optional)

Create a systemd unit file `associatedwalletgrpc.service`:

```ini
[Unit]
Description=Sei Associated Wallet API
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/repo
ExecStart=/usr/bin/node /path/to/repo/index.js
Restart=on-failure
User=root
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Activate the service:

```bash
systemctl daemon-reload
systemctl enable associatedwalletgrpc.service
systemctl start associatedwalletgrpc.service
```

## Caddy Reverse Proxy Configuration

Serve behind Caddy with the following configuration:

```caddyfile
your.domain.ca {
    log {
        output file /var/log/sub_seiapi.log
        format json
    }

    reverse_proxy http://0.0.0.0:3000 {
        header_up Strict-Transport-Security "max-age=31536000"
        header_up X-Content-Type-Options "nosniff"
        header_up X-Frame-Options "DENY"
        header_up X-XSS-Protection "1; mode=block"
        header_down Access-Control-Allow-Origin "*"
        header_down Access-Control-Allow-Methods "GET, POST, OPTIONS"
        header_down Access-Control-Allow-Headers "Content-Type"
    }
}
```

## Contributing

Pull requests welcome. For significant changes, please open an issue first.

## License

MIT License.

