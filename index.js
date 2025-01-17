import express from 'express';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { isHexAddress, isBech32Address } from './utils.js';
import process from 'process';
import cluster from 'cluster';
import os from 'os';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const grpcAddress = process.env.grpcAddress || 'grpc.sei-apis.com:443';
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

  // Health check and root endpoint to prevent 404s
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

  const client = new seiProto.Query(grpcAddress, grpc.credentials.createSsl());

  async function querySeiToEvm(seiAddress) {
    return new Promise((resolve) => {
      client.EVMAddressBySeiAddress({ sei_address: seiAddress }, (err, response) => {
        if (err) {
          console.error(`Error querying Sei -> EVM: ${err.message}`);
          return resolve({ evm_address: null, associated: false });
        }
        resolve(response);
      });
    });
  }

  async function queryEvmToSei(evmAddress) {
    return new Promise((resolve) => {
      client.SeiAddressByEVMAddress({ evm_address: evmAddress }, (err, response) => {
        if (err) {
          console.error(`Error querying EVM -> Sei: ${err.message}`);
          return resolve({ sei_address: null, associated: false });
        }
        resolve(response);
      });
    });
  }

  async function fetchAddress(address) {
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

  // Existing POST endpoint for multiple addresses
  app.post('/query-address', async (req, res) => {
    const { addresses } = req.body;

    if (!addresses || (!Array.isArray(addresses) && typeof addresses !== 'string')) {
      return res.status(400).json({ error: 'Invalid input. Provide a string or array of addresses.' });
    }

    const addressList = Array.isArray(addresses) ? addresses : [addresses];

    console.log('Incoming addresses:', addressList);

    const results = await Promise.all(addressList.map(fetchAddress));

    console.log('Query results:', results);
    res.json(results);
  });

  // New GET endpoint for single address lookup
  app.get('/:address', async (req, res) => {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({ error: 'Address parameter is required.' });
    }

    console.log(`Fetching address: ${address}`);
    const result = await fetchAddress(address);

    if (result) {
      return res.json({ original: address, result });
    }

    return res.status(404).json({ error: 'Address not found or invalid format.' });
  });

  app.listen(port, () => {
    console.log(`Worker ${process.pid} is running API on http://localhost:${port}`);
  });
}
