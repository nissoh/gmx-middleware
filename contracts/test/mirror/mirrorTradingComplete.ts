import { expect } from "chai"
import { swapETHForExactTokens } from "../shared/UniswapV2Router"
import { expandDecimals, convertToNormalNumber } from "../shared/utilities"
import { toChainlinkPrice } from "../shared/chainlink"
import { toUsd } from "../shared/units"
import { initVault, getEthConfig } from "../core/Vault/helpers"
import { ethers } from "hardhat"


describe("MirrorTrading", async () => {
  const provider = ethers.getDefaultProvider()
  const [wallet, user0, user1, user2, user3] = await ethers.getSigners()


  const btc = await (await ethers.getContractFactory("Token")).deploy()
  const btcPriceFeed = await (await ethers.getContractFactory("PriceFeed")).deploy()

  const dai = await deployContract("Token", [])
  const daiPriceFeed = await deployContract("PriceFeed", [])

  const weth = await deployContract("Token", [])
  const wethPriceFeed = await deployContract("PriceFeed", [])

  const vault = await deployContract("Vault", [])
  const vaultPriceFeed = await deployContract("VaultPriceFeed", [])

  const usdg = await deployContract("USDG", [vault.address])
  const router = await deployContract("Router", [
    vault.address,
    usdg.address,
    weth.address,
  ])

  await initVault(vault, router, usdg, vaultPriceFeed)

  const distributor0 = await deployContract("TimeDistributor", [])
  const yieldTracker0 = await deployContract("YieldTracker", [usdg.address])

  await yieldTracker0.setDistributor(distributor0.address)
  await distributor0.setDistribution(
    [yieldTracker0.address],
    [1000],
    [weth.address]
  )

  await weth.mint(distributor0.address, expandDecimals(5000, 18))
  await usdg.setYieldTrackers([yieldTracker0.address])

  await vaultPriceFeed.setTokenConfig(
    btc.address,
    btcPriceFeed.address,
    8,
    false
  )
  await vaultPriceFeed.setTokenConfig(
    dai.address,
    daiPriceFeed.address,
    8,
    false
  )
  await vaultPriceFeed.setTokenConfig(
    weth.address,
    wethPriceFeed.address,
    8,
    false
  )

  const glp = await deployContract("GLP", [])
  const glpManager = await deployContract("GlpManager", [
    vault.address,
    usdg.address,
    glp.address,
    24 * 60 * 60,
  ])

  const reader = await deployContract("Reader", [], "Reader")
  const mirrorTrading = await deployContract("MirrorTrading", [reader.address])

  const collateralToken = weth
  const indexToken = weth
  const collateralTokenDecimals = await weth.decimals


  const mintCollateral = async (
    collateralToken,
    weth,
    collateralTokenDecimals,
    account
  ) => {
    if (collateralToken.address !== weth.address) {
      // Swap ETH for USDC
      await swapETHForExactTokens(
        expandDecimals("10", 18),
        expandDecimals("10000", collateralTokenDecimals),
        collateralToken.address,
        account.address,
        account
      )
    } else {
      //DEPOSIT SOME WETH AS COLLATERAL
      const balance0ETH = (await provider.getBalance(account.address)).div(2)
      await collateralToken.connect(account).deposit({ value: balance0ETH })
    }
  }



  it("followTrader", async () => {
    //starts following and checks follow event
    await expect(mirrorTrading.followTrader(user1.address)).to.emit(
      mirrorTrading,
      "FollowingTrader"
    )
    const puppetIsCreated = await mirrorTrading.puppetExists(wallet.address)
    await expect(puppetIsCreated).eq(true)
    //checks that only allows to follow once a master
    await expect(mirrorTrading.followTrader(user1.address)).to.be.revertedWith(
      "Mirror: Already Following this master"
    )
    const allPuppets = await mirrorTrading.getPuppets()
    await expect(allPuppets.length).eq(1)
  })

  it("getPuppet", async () => {
    await expect(mirrorTrading.followTrader(user1.address)).to.emit(
      mirrorTrading,
      "FollowingTrader"
    )
    const gettingPuppet = await mirrorTrading.getPuppet(wallet.address)
    await expect(gettingPuppet).to.be.above(0)
  })

  it("getAllFollows", async () => {
    await expect(mirrorTrading.followTrader(user1.address)).to.emit(
      mirrorTrading,
      "FollowingTrader"
    )
    await mirrorTrading.followTrader(user2.address)
    const allFollows = await mirrorTrading.getAllFollows()
    await expect(allFollows.length).eq(2)
  })

  it("unFollow", async () => {
    await expect(mirrorTrading.followTrader(user1.address)).to.emit(
      mirrorTrading,
      "FollowingTrader"
    )
    await mirrorTrading.unFollow(user1.address)
    const getFollowing = await mirrorTrading.getIfFollowing(user1.address)
    await expect(getFollowing).eq(false)
  })

  it("IncreasePosition", async () => {
    await wethPriceFeed.setLatestAnswer(toChainlinkPrice(1))
    await vault.setMaxGasPrice("1000000000000")
    await vault.setTokenConfig(...getEthConfig(weth, wethPriceFeed))
    await vault.setIsLeverageEnabled(true)

    console.log("*** VAULT IS INITIATED INCREASE POSITION ****")

    const positionToFollow = {
      master: user1.address,
      collateral: weth.address,
      indexToken: weth.address,
      sizeDelta: toUsd(50),
      isLong: true,
    }

    await weth.mint(user1.address, expandDecimals(5000, 18))
    console.log("*** MINTED COLLATERAL FOR MASTER ****")
    await weth.connect(user1).transfer(vault.address, expandDecimals(1000, 18))
    await vault.buyUSDG(weth.address, user1.address)
    await weth.connect(user1).transfer(vault.address, expandDecimals(30, 18))
    console.log("*** MASTER TRANSFERED COLLATERAL TO VAULT ****")
    await vault
      .connect(user1)
      .increasePosition(
        positionToFollow.master,
        positionToFollow.collateral,
        positionToFollow.indexToken,
        positionToFollow.sizeDelta,
        positionToFollow.isLong
      )
    console.log("*** POSITION INCREASE FROM MASTER ****")

    //APPROVES MIRROR CONTRACT TO TRADE ON BEHALF OF PUPPET
    await vault.addRouter(mirrorTrading.address)
    console.log("*** PUPPET ADDS MIRROR CONTRACT AS ROUTER ****")

    await mintCollateral(
      collateralToken,
      weth,
      collateralTokenDecimals,
      wallet
    )
    console.log("*** COLLATERAL FROM PUPPET MINTED ****")

    await collateralToken.approve(
      mirrorTrading.address,
      collateralToken.balanceOf(wallet.address)
    )
    console.log(
      "*** COLLATERAL TOKEN APPROVED FROM PUPPET TO MIRROR CONTRACT ****"
    )

    //CALL TO SET A MIRROR TRADE - INCRASE POSITION TO MIMIC MASTER - DATA WILL COME FROM THE KEEPER
    const position1 = mirrorTrading.increasePosition(
      vault.address,
      positionToFollow.master, //master account
      positionToFollow.collateral, // collateral token
      positionToFollow.indexToken, // index token
      positionToFollow.isLong, //isLong
      wallet.address,
      vault.address,
      { gasPrice: "100000000000" }
    )

    await expect(position1).to.be.revertedWith(
      "Mirror: Not following this master"
    )

    await expect(mirrorTrading.followTrader(positionToFollow.master)).to.emit(
      mirrorTrading,
      "FollowingTrader"
    )

    //CALL TO SET A MIRROR TRADE - INCRASE POSITION TO MIMIC MASTER - DATA WILL COME FROM THE KEEPER
    await mirrorTrading.increasePosition(
      vault.address,
      positionToFollow.master, //master account
      positionToFollow.collateral, // collateral token
      positionToFollow.indexToken, // index token
      positionToFollow.isLong, //isLong
      wallet.address,
      vault.address,
      { gasPrice: "100000000000" }
    )

    const positionOpened = await vault.getPosition(
      wallet.address,
      collateralToken.address,
      indexToken.address,
      isLong
    )

    console.log("***********************************************")
    console.log("** FROM FRONTEND PUPPET INCREASE POSITION    **")
    console.log(
      "PUPPET OPENED POSITION SIZE USD=> ",
      convertToNormalNumber(positionOpened[0], 30)
    )
    console.log(
      "PUPPET OPENED POSITION COLLATERAL USD=> ",
      convertToNormalNumber(positionOpened[1], 30)
    )
    console.log(
      "PUPPET OPENED POSITION LEVERAGE=> ",
      convertToNormalNumber(positionOpened[0], 30) /
        convertToNormalNumber(positionOpened[1], 30)
    )
    console.log(
      "PUPPET OPENED POSITION AVG.PRICE USD=> ",
      convertToNormalNumber(positionOpened[2], 30)
    )
    console.log(
      "PUPPET ENTRY FUNDING RATE AVG.PRICE USD=> ",
      convertToNormalNumber(positionOpened[3], 30)
    )
    console.log(
      "PUPPET RESERVE AMOUNT => ",
      convertToNormalNumber(positionOpened[4], 30)
    )
    console.log(
      "RPUPPET EALIZED PnL => ",
      convertToNormalNumber(positionOpened[5], 30)
    )
    console.log("PUPPET PnL POSITIVE => ", positionOpened[6])
    console.log("PUPPET TIME => ", positionOpened[5].toNumber())
    console.log("***********************************************")
  })

  it("DecreasePosition", async () => {
    await wethPriceFeed.setLatestAnswer(toChainlinkPrice(1))
    await vault.setMaxGasPrice("1000000000000")
    await vault.setTokenConfig(...getEthConfig(weth, wethPriceFeed))
    await vault.setIsLeverageEnabled(true)

    console.log("*** VAULT IS INITIATED DECREASE POSITION ****")

    const positionToFollow = {
      master: user1.address,
      collateral: weth.address,
      indexToken: weth.address,
      sizeDelta: toUsd(50),
      isLong: true,
    }

    await weth.mint(user1.address, expandDecimals(5000, 18))
    console.log("*** MINTED COLLATERAL FOR MASTER ****")
    await weth.connect(user1).transfer(vault.address, expandDecimals(1000, 18))
    await vault.buyUSDG(weth.address, user1.address)
    await weth.connect(user1).transfer(vault.address, expandDecimals(30, 18))
    console.log("*** MASTER TRANSFERED COLLATERAL TO VAULT ****")
    await vault
      .connect(user1)
      .increasePosition(
        positionToFollow.master,
        positionToFollow.collateral,
        positionToFollow.indexToken,
        positionToFollow.sizeDelta,
        positionToFollow.isLong
      )
    console.log("*** POSITION INCREASE FROM MASTER ****")

    //APPROVES MIRROR CONTRACT TO TRADE ON BEHALF OF PUPPET
    await vault.addRouter(mirrorTrading.address)
    console.log("*** PUPPET ADDS MIRROR CONTRACT AS ROUTER ****")

    await mintCollateral(
      collateralToken,
      weth,
      collateralTokenDecimals,
      wallet
    )
    console.log("*** COLLATERAL FROM PUPPET MINTED ****")

    await collateralToken.approve(
      mirrorTrading.address,
      collateralToken.balanceOf(wallet.address)
    )
    console.log(
      "*** COLLATERAL TOKEN APPROVED FROM PUPPET TO MIRROR CONTRACT ****"
    )

    //CALL TO SET A MIRROR TRADE - INCRASE POSITION TO MIMIC MASTER - DATA WILL COME FROM THE KEEPER
    const position1 = mirrorTrading.increasePosition(
      vault.address,
      positionToFollow.master, //master account
      positionToFollow.collateral, // collateral token
      positionToFollow.indexToken, // index token
      positionToFollow.isLong, //isLong
      wallet.address,
      vault.address,
      { gasPrice: "100000000000" }
    )

    await expect(position1).to.be.revertedWith(
      "Mirror: Not following this master"
    )

    await expect(mirrorTrading.followTrader(positionToFollow.master)).to.emit(
      mirrorTrading,
      "FollowingTrader"
    )

    //CALL TO SET A MIRROR TRADE - INCRASE POSITION TO MIMIC MASTER - DATA WILL COME FROM THE KEEPER
    await mirrorTrading.increasePosition(
      vault.address,
      positionToFollow.master, //master account
      positionToFollow.collateral, // collateral token
      positionToFollow.indexToken, // index token
      positionToFollow.isLong, //isLong
      wallet.address,
      vault.address,
      { gasPrice: "100000000000" }
    )

    const positionOpened = await vault.getPosition(
      wallet.address,
      collateralToken.address,
      indexToken.address,
      isLong
    )

    console.log("***********************************************")
    console.log("** FROM FRONTEND PUPPET INCREASE POSITION    **")
    console.log(
      "PUPPET OPENED POSITION SIZE USD=> ",
      convertToNormalNumber(positionOpened[0], 30)
    )
    console.log(
      "PUPPET OPENED POSITION COLLATERAL USD=> ",
      convertToNormalNumber(positionOpened[1], 30)
    )
    console.log(
      "PUPPET OPENED POSITION LEVERAGE=> ",
      convertToNormalNumber(positionOpened[0], 30) /
        convertToNormalNumber(positionOpened[1], 30)
    )
    console.log(
      "PUPPET OPENED POSITION AVG.PRICE USD=> ",
      convertToNormalNumber(positionOpened[2], 30)
    )
    console.log(
      "PUPPET ENTRY FUNDING RATE AVG.PRICE USD=> ",
      convertToNormalNumber(positionOpened[3], 30)
    )
    console.log(
      "PUPPET RESERVE AMOUNT => ",
      convertToNormalNumber(positionOpened[4], 30)
    )
    console.log(
      "RPUPPET EALIZED PnL => ",
      convertToNormalNumber(positionOpened[5], 30)
    )
    console.log("PUPPET PnL POSITIVE => ", positionOpened[6])
    console.log("PUPPET TIME => ", positionOpened[5].toNumber())
    console.log("***********************************************")

    const collateralDelta = 0
    const sizeDelta = toUsd(50)
    await vault
      .connect(user1)
      .decreasePosition(
        positionToFollow.master,
        positionToFollow.collateral,
        positionToFollow.indexToken,
        collateralDelta,
        sizeDelta,
        positionToFollow.isLong,
        positionToFollow.master
      )
    console.log("*** POSITION DECREASE FROM MASTER ****")

    await mirrorTrading.decreasePosition(
      vault.address,
      positionToFollow.master, //master account
      positionToFollow.collateral, // collateral token
      positionToFollow.indexToken, // index token
      positionToFollow.isLong, //isLong
      wallet.address,
      vault.address,
      { gasPrice: "100000000000" }
    )

    const positionDecreased = await vault
      .connect(wallet)
      .getPosition(
        wallet.address,
        positionToFollow.collateral,
        positionToFollow.indexToken,
        positionToFollow.isLong
      )

    console.log("**************DECREASE POSITION****************")
    console.log("** FROM FRONTEND PUPPET DECREASE POSITION    **")
    console.log(
      "PUPPET OPENED POSITION SIZE USD=> ",
      convertToNormalNumber(positionDecreased[0], 30)
    )
    console.log(
      "PUPPET OPENED POSITION COLLATERAL USD=> ",
      convertToNormalNumber(positionDecreased[1], 30)
    )
    console.log(
      "PUPPET OPENED POSITION LEVERAGE=> ",
      convertToNormalNumber(positionDecreased[0], 30) /
        convertToNormalNumber(positionDecreased[1], 30)
    )
    console.log(
      "PUPPET OPENED POSITION AVG.PRICE USD=> ",
      convertToNormalNumber(positionDecreased[2], 30)
    )
    console.log(
      "PUPPET ENTRY FUNDING RATE AVG.PRICE USD=> ",
      convertToNormalNumber(positionDecreased[3], 30)
    )
    console.log(
      "PUPPET RESERVE AMOUNT => ",
      convertToNormalNumber(positionDecreased[4], 30)
    )
    console.log(
      "RPUPPET EALIZED PnL => ",
      convertToNormalNumber(positionDecreased[5], 30)
    )
    console.log("PUPPET PnL POSITIVE => ", positionDecreased[6])
    console.log("PUPPET TIME => ", positionDecreased[5].toNumber())
    console.log("***********************************************")
  })
})
