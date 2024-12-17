# Improved Associated Wallet Query API

A simple API for querying the associated Sei and EVM wallet addresses using gRPC and Express.

## Features
- Convert Sei (Bech32) addresses to EVM addresses.
- Convert EVM (Hex) addresses to Sei addresses.
- Handles multiple address inputs in a single request.
- Clustered Node.js process for improved performance.

## Requirements
- Node.js v18+
- Yarn or npm for dependency management
- `grpc` and `protobuf` libraries

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

#### **POST** `/query-address`

**Description**: Converts provided Sei or EVM addresses to their associated format.

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
Send a `GET` request to `/` to verify the server is running:
```bash
curl http://localhost:3000
```

## Systemd Service (Optional)
To deploy the API as a system service, create a `systemd` unit file like:

```ini
[Unit]
Description=Sei-associated wallet query API
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/repo
ExecStart=/usr/bin/node /path/to/repo/index.js
Restart=on-failure
User=root
Environment=PORT=3009

[Install]
WantedBy=multi-user.target
```

Reload and start the service:
```bash
systemctl daemon-reload
systemctl enable associatedwalletgrpc.service
systemctl start associatedwalletgrpc.service
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
