# Improved Associated Wallet Query API

A simple API for querying the associated Sei and EVM wallet addresses using gRPC and Express.

## Features
- Convert Sei (Bech32) addresses to EVM (Hex) addresses.
- Convert EVM (Hex) addresses to Sei (Bech32) addresses.
- Supports querying multiple addresses in a single request.
- Validates input formats before querying.
- Clustered Node.js process for improved performance.
- Health check endpoint for monitoring.

## Requirements
- Node.js v18+
- Yarn or npm for dependency management
- `@grpc/grpc-js` and `@grpc/proto-loader` libraries
- `express` for API handling
- `dotenv` for environment variable management
- `bech32` for address format validation

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

3. Add a `.env` file for environment variables:

   ```plaintext
   PORT=3000
   grpcAddress=grpc.sei-apis.com:443
   ```

4. Ensure the `sei_evm.proto` file is present in the root directory.

## Usage

### Start the API Server
Run the server locally:

```bash
node index.js
```

### API Endpoints

#### **GET /:address**

**Description**: Converts a single address of either format (Sei or EVM). You can enter the URL directly in a browser or use `curl`.

Example request:

```bash
curl -s https://wallets.sei.basementnodes.ca/sei1address...
```

Example response:

```json
{
    "original": "sei1address...",
    "result": "0xaddress..."
}
```

#### **POST /query-address**

**Description**: Converts multiple Sei or EVM addresses to their associated format.

**Request Body**:

```json
{
  "addresses": ["sei1exampleaddress123", "0xExampleEVMAddress456"]
}
```

**Response**:

```json
[
  "0xAssociatedEVMAddress",
  "sei1AssociatedSeiAddress"
]
```

- Accepts either a single address as a string or multiple addresses in an array.
- Invalid or unassociated addresses return `null`.

### Health Check
To verify that the server is running, send a `GET` request to `/`:

```bash
curl http://localhost:3000
```

## Systemd Service (Optional)
To deploy the API as a system service, create a `systemd` unit file like:

```ini
[Unit]
Description=Sei Associated Wallets API
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

Reload and start the service:
```bash
systemctl daemon-reload
systemctl enable associatedwalletgrpc.service
systemctl start associatedwalletgrpc.service
```

## Configuring Caddy as a Reverse Proxy
To serve the API behind a Caddy web server, use the following configuration as a boilerplate:

```caddyfile
<your_domain> {
    log {
        output file /var/log/sei_wallet_api.log
        format json
    }
	# set port in systemd service file
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

## Dependencies
- **@grpc/grpc-js**: gRPC implementation for Node.js
- **@grpc/proto-loader**: Parses `.proto` files
- **express**: HTTP server for API endpoints
- **dotenv**: Environment variable management
- **bech32**: Address format validation

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss your ideas.

## License
This project is licensed under the MIT License.

