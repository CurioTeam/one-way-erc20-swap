const fs = require("fs");
const path = require("path");

const {
    BN,
    ether
} = require("@openzeppelin/test-helpers");

const TokenSwaps = artifacts.require("TokenSwaps.sol");
const IERC20 = artifacts.require("IERC20.sol");

const tokenFromAddress = "0x42Bbfc77Ee4Ed0efC608634859a672D0cf49e1b4"; // tCUR
const tokenToAddress = "0x2f4d4cFAb714e4573189B300293944673Fe0efF7";   // tCGT

const tokenToAmt = ether(new BN(2e6));  //  tCGT for swaps

const owner = "0xB844C65F3E161061bA5D5dD8497B3C04B71c4c83";
const wallet = "0xB844C65F3E161061bA5D5dD8497B3C04B71c4c83";

module.exports = async function(deployer, network) {
    // get the current deployer address
    const accounts = await web3.eth.getAccounts();
    const curDeployer = accounts[0];

    // TokenSwaps deployment
    let tokenSwaps = await deployer.deploy(TokenSwaps,
        tokenFromAddress,
        tokenToAddress,
        wallet
    );
    console.log("tokenSwaps address: ", tokenSwaps.address);

    // get tokenTo from address
    let tokenTo = await IERC20.at(tokenToAddress);

    // transfer tokenTo to TokenSwaps
    await tokenTo.transfer(
        tokenSwaps.address,
        tokenToAmt
    );

    // transfer owner permission
    await tokenSwaps.transferOwnership(
        owner
    );

    // write addresses and ABI to files
    const contractsAddresses = {
        tokenSwaps: tokenSwaps.address,
        tokenFrom: tokenFromAddress,
        tokenTo: tokenToAddress
    };

    const contractsAbi = {
        tokenSwaps: tokenSwaps.abi
    };

    const deployDirectory = `${__dirname}/../deployed`;
    if (!fs.existsSync(deployDirectory)) {
        fs.mkdirSync(deployDirectory);
    }

    fs.writeFileSync(path.join(deployDirectory, `${network}_token_swaps_addresses.json`), JSON.stringify(contractsAddresses, null, 2));
    fs.writeFileSync(path.join(deployDirectory, `${network}_token_swaps_abi.json`), JSON.stringify(contractsAbi, null, 2));
};