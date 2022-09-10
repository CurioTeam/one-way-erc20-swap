# ERC-20 one way swap

Simple contract allowed 1:1 swap of one ERC20 token to another.

## For Developers

When deploying, use the following environment:

- Node: v16.14.0  (Contract verification (truffle-plugin-verify) works well with Node: v10.15.3)
- Npm: 8.12.1
- Truffle: 5.1.56

First you need to set the values in ```.env``` and configure network in ```truffle-config.js```. Then execute at the root:

### Install dependencies

```sh
npm install
```


### Compile contracts

```sh
npm run compile
```

### Run tests

```sh
npm run test:truffle
```

### Deployment

Before executing migrations, it is necessary to review the migration code and set the required values.

```sh
npx truffle migrate --f 2 --to 2 --network {network}
```

### Etherscan verification of contract

Configure ```ETHERSCAN_API_KEY``` variable in ```.env``` file.

```bash
npx truffle run verify {contract_name}@{contract_address} --network {network}
```

## License

[MIT](LICENSE)
