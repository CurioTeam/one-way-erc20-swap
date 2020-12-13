const { accounts, contract } = require('@openzeppelin/test-environment');

const {
    BN,
    ether,
    expectRevert,
} = require('@openzeppelin/test-helpers');

require('chai').should();

const TokenSwaps = contract.fromArtifact('TokenSwaps');
const ERC20Mock = contract.fromArtifact('ERC20Mock');

describe('Contract TokenSwaps.sol', function () {
    const [
        owner,
        wallet,
        walletToChange,
        swapper,
        recipient,
        anyone,
    ] = accounts;

    const INITIAL_SUPPLY = ether(new BN(2e6));

    beforeEach(async function () {
        this.tokenFrom = await ERC20Mock.new(
            'Test From Token',
            'TFT',
            owner,
            ether('0')
        );

        this.tokenTo = await ERC20Mock.new(
            'Test To Token',
            'TTT',
            owner,
            ether('0')
        );

        this.tokenSwaps = await TokenSwaps.new(
            this.tokenFrom.address,
            this.tokenTo.address,
            wallet,
            { from: owner });
    });

    describe('initialization', function () {
        it('should initialize with correct state', async function () {
            (await this.tokenSwaps.tokenFrom()).should.be.equal(this.tokenFrom.address);
            (await this.tokenSwaps.tokenTo()).should.be.equal(this.tokenTo.address);
            (await this.tokenSwaps.wallet()).should.be.equal(wallet);
            (await this.tokenSwaps.swapped()).should.be.bignumber.equal(new BN(0));
            (await this.tokenSwaps.owner()).should.be.equal(owner);
            (await this.tokenSwaps.paused()).should.be.equal(false);
        });
    });

    describe('pausable functionality', function () {
        it('should initialize with unpaused state', async function () {
            (await this.tokenSwaps.paused()).should.be.equal(false);
        });

        it('should pause by owner)', async function () {
            await this.tokenSwaps.pause({ from: owner });
        });

        it('should fail on pause by anyone (only owner)', async function () {
            await expectRevert(
                this.tokenSwaps.pause({
                    from: anyone
                }),
                'Ownable: caller is not the owner'
            );
        });

        context('when paused', function () {
            beforeEach(async function () {
                await this.tokenSwaps.pause({ from: owner });
            });

            it('should be with paused state', async function () {
                (await this.tokenSwaps.paused()).should.be.equal(true);
            });

            it('should unpause by owner', async function () {
                await this.tokenSwaps.unpause({ from: owner });
            });

            it('should fail on unpause by anyone (only owner)', async function () {
                await expectRevert(
                    this.tokenSwaps.unpause({
                        from: anyone
                    }),
                    'Ownable: caller is not the owner'
                );
            });
        });
    });

    describe('change wallet functionality', function () {
        it('should change wallet by owner)', async function () {
            await this.tokenSwaps.setWallet(walletToChange, { from: owner });

            (await this.tokenSwaps.wallet()).should.be.equal(walletToChange);
        });

        it('should fail on change wallet by anyone (only owner)', async function () {
            await expectRevert(
                this.tokenSwaps.setWallet(walletToChange, {
                    from: anyone
                }),
                'Ownable: caller is not the owner'
            );
        });

    });

    describe('swap functionality', function () {
        beforeEach(async function () {
            this.initialSwapperBalance = ether('1000');
            this.swapAmount = ether('1');
            this.amountGreaterInitialSupplyFrom = INITIAL_SUPPLY.add(new BN(1));

            await this.tokenTo.mint(this.tokenSwaps.address, INITIAL_SUPPLY);

            await this.tokenFrom.mint(swapper, this.initialSwapperBalance);

            await this.tokenFrom.approve(
                this.tokenSwaps.address,
                this.amountGreaterInitialSupplyFrom,
                { from: swapper });
        });

        it('should make swap', async function () {
            (await this.tokenFrom.balanceOf(swapper))
                .should.be.bignumber.equal(this.initialSwapperBalance);
            (await this.tokenTo.balanceOf(swapper))
                .should.be.bignumber.equal(ether('0'));

            await this.tokenSwaps.swap(this.swapAmount, { from: swapper });

            (await this.tokenFrom.balanceOf(swapper))
                .should.be.bignumber.equal(this.initialSwapperBalance.sub(this.swapAmount));
            (await this.tokenTo.balanceOf(swapper))
                .should.be.bignumber.equal(ether('0').add(this.swapAmount));
        });

        it('should make swap with another recipient', async function () {
            (await this.tokenFrom.balanceOf(swapper))
                .should.be.bignumber.equal(this.initialSwapperBalance);
            (await this.tokenTo.balanceOf(swapper))
                .should.be.bignumber.equal(ether('0'));

            (await this.tokenTo.balanceOf(recipient))
                .should.be.bignumber.equal(ether('0'));

            (await this.tokenSwaps.swapped())
                .should.be.bignumber.equal(ether('0'));

            (await this.tokenFrom.balanceOf(wallet))
                .should.be.bignumber.equal(ether('0'));

            (await this.tokenTo.balanceOf(this.tokenSwaps.address))
                .should.be.bignumber.equal(INITIAL_SUPPLY);

            await this.tokenSwaps.swapToAddress(this.swapAmount, recipient, { from: swapper });

            (await this.tokenFrom.balanceOf(swapper))
                .should.be.bignumber.equal(this.initialSwapperBalance.sub(this.swapAmount));
            (await this.tokenTo.balanceOf(swapper))
                .should.be.bignumber.equal(ether('0'));

            (await this.tokenTo.balanceOf(recipient))
                .should.be.bignumber.equal(ether('0').add(this.swapAmount));

            (await this.tokenSwaps.swapped())
                .should.be.bignumber.equal(ether('0').add(this.swapAmount));

            (await this.tokenFrom.balanceOf(wallet))
                .should.be.bignumber.equal(ether('0').add(this.swapAmount));

            (await this.tokenTo.balanceOf(this.tokenSwaps.address))
                .should.be.bignumber.equal(INITIAL_SUPPLY.sub(this.swapAmount));
        });

        context('when paused', function () {
            beforeEach(async function () {
                await this.tokenSwaps.pause({ from: owner });
            });

            it('should fail on swap', async function () {
                await expectRevert(
                    this.tokenSwaps.swap(this.swapAmount, {
                        from: swapper
                    }),
                    'Pausable: paused'
                );

                await expectRevert(
                    this.tokenSwaps.swapToAddress(
                        this.swapAmount,
                        recipient,
                        { from: swapper }),
                    'Pausable: paused'
                );
            });
        })
    })

    describe('withdraw any funds from contract by owner', function() {
        beforeEach(async function () {
            this.supplyTokenOther = ether('1000');
            this.supplyTokenOtherSecond = ether('500');

            this.tokenOther = await ERC20Mock.new(
                'Test Other Token',
                'TOT',
                this.tokenSwaps.address,
                this.supplyTokenOther
            );

            this.tokenOtherSecond = await ERC20Mock.new(
                'Test Other Token Second',
                'TOTS',
                this.tokenSwaps.address,
                this.supplyTokenOtherSecond
            );
        });

        it('should withdraw unsold tokenTo by owner', async function () {
            await this.tokenTo.mint(this.tokenSwaps.address, INITIAL_SUPPLY);

            const ownerBalanceBefore = await this.tokenTo.balanceOf(owner);
            const contractBalanceBefore = await this.tokenTo.balanceOf(
                this.tokenSwaps.address
            );
            const amount = ether('200');

            await this.tokenSwaps.withdrawFunds(
                this.tokenTo.address,
                amount,
                { from: owner });

            (await this.tokenTo.balanceOf(this.tokenSwaps.address))
                .should.be.bignumber.equal(contractBalanceBefore.sub(amount));
            (await this.tokenTo.balanceOf(owner))
                .should.be.bignumber.equal(ownerBalanceBefore.add(amount));
        });

        it('should withdraw tokens by owner', async function () {
            const ownerBalanceBefore = await this.tokenOther.balanceOf(owner);
            const contractBalanceBefore = await this.tokenOther.balanceOf(
                this.tokenSwaps.address
            );
            const amount = ether('200');

            await this.tokenSwaps.withdrawFunds(
                this.tokenOther.address,
                amount,
                { from: owner });

            (await this.tokenOther.balanceOf(this.tokenSwaps.address))
                .should.be.bignumber.equal(contractBalanceBefore.sub(amount));
            (await this.tokenOther.balanceOf(owner))
                .should.be.bignumber.equal(ownerBalanceBefore.add(amount));
        });

        it('should fail on withdraw tokens by anyone', async function () {
            await expectRevert(
                this.tokenSwaps.withdrawFunds(
                    this.tokenOther.address,
                    this.supplyTokenOther,
                    { from: anyone }),
                'Ownable: caller is not the owner'
            );
        });

        it('should withdraw tokens by owner', async function () {
            const ownerBalanceBefore = await this.tokenOther.balanceOf(owner);
            const contractBalanceBefore = await this.tokenOther.balanceOf(
                this.tokenSwaps.address
            );
            const contractBalanceBeforeSecond = await this.tokenOtherSecond.balanceOf(
                this.tokenSwaps.address
            );

            await this.tokenSwaps.withdrawAllFunds(
                [this.tokenOther.address, this.tokenOtherSecond.address],
                { from: owner });

            (await this.tokenOther.balanceOf(this.tokenSwaps.address))
                .should.be.bignumber.equal(ether('0'));
            (await this.tokenOther.balanceOf(owner))
                .should.be.bignumber.equal(ownerBalanceBefore.add(contractBalanceBefore));

            (await this.tokenOtherSecond.balanceOf(this.tokenSwaps.address))
                .should.be.bignumber.equal(ether('0'));
            (await this.tokenOtherSecond.balanceOf(owner))
                .should.be.bignumber.equal(ownerBalanceBefore.add(contractBalanceBeforeSecond));
        });

        it('should fail on withdraw all tokens by anyone', async function () {
            await expectRevert(
                this.tokenSwaps.withdrawAllFunds(
                    [this.tokenOther.address, this.tokenOtherSecond.address],
                    { from: anyone }),
                'Ownable: caller is not the owner'
            );
        });
    });

    it('should fail on sending ether direct to contract', async function () {
        await expectRevert(
            this.tokenSwaps.sendTransaction({ from: anyone, value: ether('1') }),
            'TokenSwaps: sending eth is prohibited'
        );
    });
});
