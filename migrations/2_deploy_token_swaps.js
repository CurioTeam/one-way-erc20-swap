const fs = require("fs");
const path = require("path");

const TokenSwaps = artifacts.require("TokenSwaps.sol");

const tokenFrom = ""; // TODO: set
const tokenTo = ""; // TODO: set
const ownerAddress = ""; // TODO: set
const walletAddress = ""; // TODO: set

// TokenSwaps deployment
async function swapDeploy(
    deployer,
    tokenFromAddress,
    tokenToAddress,
    wallet
) {
    await deployer.deploy(TokenSwaps,
        tokenFromAddress,
        tokenToAddress,
        wallet
    );
    let tokenSwaps = await TokenSwaps.deployed();
    console.log(`>>> RESULT: tokenSwaps address: ${ tokenSwaps.address }`);
    return tokenSwaps;
}

// Set owner for TokenSwaps
async function setOwner(
    tokenSwaps,
    owner
) {
    await tokenSwaps.transferOwnership(
        owner
    );
    console.log(`>>> RESULT: set owner as ${ owner }`);
}

module.exports = async function(deployer, network) {
    if (network === "test") return; // skip migrations if use test network

    // Addresses and ABI
    const contractsAddresses = {};
    const contractsAbi = {};

    // 1. TokenSwaps deployment
    let tokenSwaps = await swapDeploy(
      deployer,
      tokenFrom,
      tokenTo,
      walletAddress
    );

    // 2. Set owner for TokenSwaps
    await setOwner(
      tokenSwaps,
      ownerAddress
    );

    // 3. Save TokenSwaps address
    contractsAddresses.tokenSwaps = tokenSwaps.address;
    contractsAddresses.tokenFrom = tokenFrom;
    contractsAddresses.tokenTo = tokenTo;

    // 4. Save TokenSwaps ABI
    contractsAbi.tokenSwaps = tokenSwaps.abi;

    // Write addresses and ABI to files
    if (contractsAddresses && contractsAbi) {
        const deployDirectory = `${__dirname}/../deployed`;
        if (!fs.existsSync(deployDirectory)) {
            fs.mkdirSync(deployDirectory);
        }

        fs.writeFileSync(path.join(deployDirectory, `${network}_token_swaps_addresses.json`), JSON.stringify(contractsAddresses, null, 2));
        fs.writeFileSync(path.join(deployDirectory, `${network}_token_swaps_abi.json`), JSON.stringify(contractsAbi, null, 2));
    }
};
