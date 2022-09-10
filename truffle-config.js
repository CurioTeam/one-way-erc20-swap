const HDWalletProvider = require('@truffle/hdwallet-provider');
const web3 = require('web3');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
  path: path.resolve(__dirname, '.env'),
});

function getProvider(rpc) {
  return function() {
    const provider = new web3.providers.WebsocketProvider(rpc);
    return new HDWalletProvider(process.env.DEPLOYMENT_KEY, provider);
  };
}

const config = {
  networks: {
    local: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*'
    },
    test: {
      // https://github.com/trufflesuite/ganache-core#usage
      provider() {
        const { provider } = require('@openzeppelin/test-environment');
        return provider;
      },
      skipDryRun: true,
      network_id: '*'
    },
    kovan: {
      gasPrice: 1000 * 1000 * 1000, // 1 gwei
      gasLimit: 10 * 1000 * 1000,
      provider: getProvider(`wss://kovan.infura.io/ws/v3/${ process.env.INFURA_PROJECT_ID }`),
      websockets: true,
      skipDryRun: true,
      network_id: '42'
    },
    mainnet: {
      gasPrice: 110 * 1000 * 1000 * 1000, // 110 gwei
      gasLimit: 2 * 1000 * 1000, // 2,000,000
      provider: getProvider(`wss://mainnet.infura.io/ws/v3/${ process.env.INFURA_PROJECT_ID }`),
      websockets: true,
      skipDryRun: true,
      network_id: '1'
    },
    goerli: {
      gasPrice: 1e9, // 1 gwei
      gas: 15 * 1e6, // 15,000,000
      provider: getProvider(`wss://goerli.infura.io/ws/v3/${ process.env.INFURA_PROJECT_ID }`),
      websockets: true,
      skipDryRun: true,
      network_id: '5',
      networkCheckTimeout: 500000,
      timeoutBlocks: 500000
    },
  },
  mocha: {
    timeout: 10000
  },
  compilers: {
    solc: {
      version: '0.6.12',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "istanbul"
      }
    }
  },
  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY
  }
};

module.exports = config;
