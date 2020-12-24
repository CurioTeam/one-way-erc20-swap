const fs = require("fs");
const path = require("path");

const {
    BN,
    ether
} = require("@openzeppelin/test-helpers");

const TokenSwaps = artifacts.require("TokenSwaps.sol");
const IERC20 = artifacts.require("IERC20.sol");

module.exports = async function(deployer, network) {
    if (network === "test") return; // skip migrations if use test network

    if (network === "kovan") {
        const tokenFromAddress = "0x42Bbfc77Ee4Ed0efC608634859a672D0cf49e1b4"; // Kovan tCUR
        const tokenToAddress = "0x2f4d4cFAb714e4573189B300293944673Fe0efF7";   // Kovan tCGT

        const tokenToAmt = ether(new BN(2e6));  // tCGT for swaps

        const owner = "0xB844C65F3E161061bA5D5dD8497B3C04B71c4c83";
        const wallet = "0xB844C65F3E161061bA5D5dD8497B3C04B71c4c83";

        // TokenSwaps deployment
        await deployer.deploy(TokenSwaps,
            tokenFromAddress,
            tokenToAddress,
            wallet
        );
        let tokenSwaps = await TokenSwaps.deployed();
        console.log("tokenSwaps address: ", tokenSwaps.address);

        // transfer tokenTo to TokenSwaps
        let tokenTo = await IERC20.at(tokenToAddress);
        await tokenTo.transfer(
            tokenSwaps.address,
            tokenToAmt
        );

        // transfer owner permission
        await tokenSwaps.transferOwnership(
            owner
        );

        // use swap
        let tokenFrom = await IERC20.at(tokenFromAddress);
        await tokenFrom.approve(
            tokenSwaps.address,
            ether("1")
        );
        await tokenSwaps.swap(
            ether("1")
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
    }
};
