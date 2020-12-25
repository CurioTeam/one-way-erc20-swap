const fs = require("fs");
const path = require("path");

const {
    BN,
    ether
} = require("@openzeppelin/test-helpers");

const TokenSwaps = artifacts.require("TokenSwaps.sol");
const IERC20 = artifacts.require("IERC20.sol");

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

    if (network === "kovan") {
        const TOKEN_FROM_ADDRESS = "0x42Bbfc77Ee4Ed0efC608634859a672D0cf49e1b4"; // Kovan tCUR
        const TOKEN_TO_ADDRESS = "0x2f4d4cFAb714e4573189B300293944673Fe0efF7";   // Kovan tCGT

        const OWNER = "0xB844C65F3E161061bA5D5dD8497B3C04B71c4c83";
        const WALLET = "0xB844C65F3E161061bA5D5dD8497B3C04B71c4c83";

        const tokenToAmt = ether(new BN(2e6));  // tCGT for swaps



        console.log(">>> DEPLOYING TokenSwaps");

        // 1. TokenSwaps deployment
        let tokenSwaps = await swapDeploy(
            deployer,
            TOKEN_FROM_ADDRESS,
            TOKEN_TO_ADDRESS,
            WALLET
        );

        // 2. Transfer tokenTo to TokenSwaps
        let tokenTo = await IERC20.at(TOKEN_TO_ADDRESS);
        await tokenTo.transfer(
            tokenSwaps.address,
            tokenToAmt
        );

        // 3. Set owner
        await setOwner(
            tokenSwaps,
            OWNER
        );

        // 4. Use swap
        let tokenFrom = await IERC20.at(TOKEN_FROM_ADDRESS);
        await tokenFrom.approve(
            tokenSwaps.address,
            ether("1")
        );
        await tokenSwaps.swap(
            ether("1")
        );

        // 5. Save TokenSwaps address
        contractsAddresses.tokenSwaps = tokenSwaps.address;
        contractsAddresses.tokenFrom = tokenFrom.address;
        contractsAddresses.tokenTo = tokenTo.address;

        // 6. Save TokenSwaps ABI
        contractsAbi.tokenSwaps = tokenSwaps.abi;

        console.log(">>> END DEPLOYING TokenSwaps");
    } else if (network === "mainnet") {
        // Main addresses setup
        const TOKEN_FROM_ADDRESS = "0x13339fD07934CD674269726EdF3B5ccEE9DD93de"; // Mainnet CUR
        const TOKEN_TO_ADDRESS = "0xF56b164efd3CFc02BA739b719B6526A6FA1cA32a"; // Mainnet CGT

        const OWNER = "0x94ddecAFF0109b615e51C482e07312abce704042"; // Development fund multisig
        const WALLET = "0x42A9bF91864b1cd0FCcF6D8292c94758C69d440F"; // Destination wallet for CUR



        console.log(">>> DEPLOYING TokenSwaps");

        // 1. TokenSwaps deployment
        let tokenSwaps = await swapDeploy(
            deployer,
            TOKEN_FROM_ADDRESS,
            TOKEN_TO_ADDRESS,
            WALLET
        );

        // 2. Set owner for TokenSwaps
        await setOwner(
            tokenSwaps,
            OWNER
        );

        // 3. Save TokenSwaps address
        contractsAddresses.tokenSwaps = tokenSwaps.address;
        contractsAddresses.tokenFrom = TOKEN_FROM_ADDRESS;
        contractsAddresses.tokenTo = TOKEN_TO_ADDRESS;

        // 4. Save TokenSwaps ABI
        contractsAbi.tokenSwaps = tokenSwaps.abi;

        console.log(">>> END DEPLOYING TokenSwaps");
    }

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
