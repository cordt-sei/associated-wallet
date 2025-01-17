import express from 'express';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { isHexAddress, isBech32Address } from './utils.js';
import cluster from 'cluster';
import os from 'os';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const grpcAddress = process.env.grpcAddress || 'grpc.sei.basementnodes.ca:443';
const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  // Middleware to parse JSON
  app.use(express.json({ limit: '10mb' }));

  // Health check and root endpoint
  app.get('/', (req, res) => res.status(200).send('Sei Wallet API is running'));
  app.get('/favicon.ico', (req, res) => res.status(204).end());

  // Load gRPC Protobuf definitions
  const PROTO_PATH = './sei_evm.proto';
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const seiProto = grpc.loadPackageDefinition(packageDefinition).seiprotocol.seichain.evm;

  // Determine credentials based on environment
  const useTls = process.env.USE_TLS === 'true';
  const grpcCredentials = useTls
    ? grpc.credentials.createSsl() // SSL/TLS
    : grpc.credentials.createInsecure(); // Non-SSL/TLS

const client = new seiProto.Query(grpcAddress, grpc.credentials.createSsl());

async function querySeiToEvm(seiAddress) {
  console.log(`querySeiToEvm called with seiAddress: ${seiAddress}`);
  return new Promise((resolve) => {
    const deadline = new Date(Date.now() + 5000); // 5-second timeout
    client.EVMAddressBySeiAddress({ sei_address: seiAddress }, { deadline }, (err, response) => {
      if (err) {
        console.error(`Error querying Sei -> EVM for seiAddress: ${seiAddress}`);
        console.error(`gRPC Error: ${err.message}`);
        return resolve({ evm_address: null, associated: false });
      }
      console.log(`gRPC Response for Sei -> EVM: ${JSON.stringify(response)}`);
      resolve(response);
    });
  });
}

async function queryEvmToSei(evmAddress) {
  console.log(`queryEvmToSei called with evmAddress: ${evmAddress}`);
  return new Promise((resolve) => {
    const deadline = new Date(Date.now() + 5000); // 5-second timeout
    client.SeiAddressByEVMAddress({ evm_address: evmAddress }, { deadline }, (err, response) => {
      if (err) {
        console.error(`Error querying EVM -> Sei for evmAddress: ${evmAddress}`);
        console.error(`gRPC Error: ${err.message}`);
        return resolve({ sei_address: null, associated: false });
      }
      console.log(`gRPC Response for EVM -> Sei: ${JSON.stringify(response)}`);
      resolve(response);
    });
  });
}

  async function fetchAddress(address) {
    console.log(`fetchAddress called with: ${address}`);
    try {
      if (isBech32Address(address)) {
        const response = await querySeiToEvm(address);
        return response?.evm_address || null;
      } else if (isHexAddress(address)) {
        const response = await queryEvmToSei(address);
        return response?.sei_address || null;
      }
      console.warn(`Invalid address format: ${address}`);
      return null;
    } catch (err) {
      console.error(`Error processing address: ${err.message}`);
      return null;
    }
  }

// JSON payload POST endpoint
app.post('/query-address', async (req, res) => {
  const { addresses } = req.body;

  if (!addresses || (!Array.isArray(addresses) && typeof addresses !== 'string')) {
    return res.status(400).json({ error: 'Invalid input. Provide a string or array of addresses.' });
  }

  const addressList = Array.isArray(addresses) ? addresses : [addresses];

  console.log('Incoming addresses:', addressList);

  try {
    const results = await Promise.all(addressList.map(fetchAddress));
    console.log('Query results:', results);
    res.json(results);
  } catch (err) {
    console.error('Error processing addresses:', err.message);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
});

// Query parameter GET endpoint
app.get('/query-address', async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Missing address query parameter.' });
  }

  console.log('Incoming address:', address);

  try {
    const result = await fetchAddress(address);
    console.log('Query result:', result);
    res.json(result);
  } catch (err) {
    console.error('Error processing address:', err.message);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
});

  app.listen(port, () => {
    console.log(`Worker ${process.pid} is running API on http://localhost:${port}`);
  });
}
