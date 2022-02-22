import { expect } from "chai"
import { contractAt } from "../shared/fixtures"
import { swapETHForExactTokens } from "../shared/UniswapV2Router"
import { expandDecimals, convertToNormalNumber } from "../shared/utilities"
import { ethers } from "hardhat"


describe("MirrorTrading", async () => {
  const provider = ethers.getDefaultProvider()
  const [wallet, user0, user1, user2, user3] = await ethers.getSigners()

  const reader = await (await ethers.getContractFactory("Reader")).deploy()
  const mirrorTrading = await (await ethers.getContractFactory("TradeGmx")).deploy(reader.address)



  const vault = await contractAt(
    "Vault",
    "0x489ee077994B6658eAfA855C308275EAd8097C4A"
  )
  const router = await contractAt(
    "Router",
    "0xaBBc5F99639c9B6bCb58544ddf04EFA6802F4064"
  )
  const weth = await contractAt(
    "Token",
    "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
  )

  //GETS THIS DATA FROM API - https://api.gmx.io/actions
  // USE AN ADDRESS THAT HAS THE INCREASE POSITION WITH USDC COLLATERAL
  const masterToFollow = "0xe00a0612e4c64cafddcf78a6cd2d04447ab40249"
  const decreaseMasterToFollow = "0xa2683c71becb07e21155313f46f6ba00986414c3"
  // collateralToken = await contractAt("Token", "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8")//USDC
  // collateralTokenDecimals = 6 //USDC
  const collateralToken = await contractAt(
    "Token",
    "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
  )
  const indexToken = await contractAt(
    "Token",
    "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
  )
  const collateralTokenDecimals = 18 //6 for usdc
  const isLong = true

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
    //ADDS PUPPET TO FOLLOW A MASTER
    await expect(mirrorTrading.followTrader(user1.address)).to.emit(
      mirrorTrading,
      "FollowingTrader"
    )

    //APPROVES MIRROR CONTRACT TO TRADE ON BEHALF OF PUPPET
    await vault.addRouter(mirrorTrading.address)

    if (collateralToken.address !== weth.address) {
      // Swap ETH for USDC
      await swapETHForExactTokens(
        expandDecimals("10", 18),
        expandDecimals("10000", collateralTokenDecimals),
        collateralToken.address,
        wallet.address,
        wallet
      )
    } else {
      // let balanceOfCollateral = await collateralToken.balanceOf(wallet.address);
      const balance0ETH = (await provider.getBalance(wallet.address)).div(2)
      await collateralToken.connect(wallet).deposit({ value: balance0ETH })
    }

    await collateralToken.approve(
      mirrorTrading.address,
      collateralToken.balanceOf(wallet.address)
    )

    //CALL TO SET A MIRROR TRADE - INCRASE POSITION TO MIMIC MASTER
    const position1 = mirrorTrading.increasePosition(
      vault.address,
      masterToFollow, //master account
      collateralToken.address, // collateral token
      indexToken.address, // index token
      isLong, //isLong
      wallet.address,
      vault.address,
      { gasPrice: "100000000000" }
    )
    await expect(position1).to.be.revertedWith(
      "Mirror: Not following this master"
    )

    await expect(mirrorTrading.followTrader(masterToFollow)).to.emit(
      mirrorTrading,
      "FollowingTrader"
    )

    const position2 = await mirrorTrading.increasePosition(
      vault.address,
      masterToFollow, //master account
      collateralToken.address, // collateral token
      indexToken.address, // index token
      isLong, //isLong
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
      "PUPPET REALIZED PnL => ",
      convertToNormalNumber(positionOpened[5], 30)
    )
    console.log("PUPPET PnL POSITIVE => ", positionOpened[6])
    console.log("PUPPET TIME => ", positionOpened[5].toNumber())
    console.log("***********************************************")
  })

  it("DecreasePosition", async () => {
    /*IT WILL SIMULATE A DECREASE POSITION BUT NOT FOLLOW ONE*/

    //ADDS PUPPET TO FOLLOW A MASTER
    await expect(
      mirrorTrading.connect(user1).followTrader(user2.address)
    ).to.emit(mirrorTrading, "FollowingTrader")

    //APPROVES MIRROR CONTRACT TO TRADE ON BEHALF OF PUPPET
    await vault.connect(user1).addRouter(mirrorTrading.address)

    if (collateralToken.address !== weth.address) {
      // Swap ETH for USDC
      await swapETHForExactTokens(
        expandDecimals("10", 18),
        expandDecimals("10000", collateralTokenDecimals),
        collateralToken.address,
        user1.address,
        user1
      )
    } else {
      // let balanceOfCollateral = await collateralToken.balanceOf(wallet.address);
      const balance0ETH = (await provider.getBalance(user1.address)).div(2)
      await collateralToken.connect(user1).deposit({ value: balance0ETH })
    }

    await collateralToken
      .connect(user1)
      .approve(mirrorTrading.address, collateralToken.balanceOf(user1.address))

    //CALL TO SET A MIRROR TRADE - INCRASE POSITION TO MIMIC MASTER
    const position1 = mirrorTrading.increasePosition(
      vault.address,
      masterToFollow, //master account
      collateralToken.address, // collateral token
      indexToken.address, // index token
      isLong, //isLong
      user1.address,
      vault.address,
      { gasPrice: "100000000000" }
    )
    await expect(position1).to.be.revertedWith(
      "Mirror: Not following this master"
    )

    await expect(
      mirrorTrading.connect(user1).followTrader(masterToFollow)
    ).to.emit(mirrorTrading, "FollowingTrader")

    await mirrorTrading.increasePosition(
      vault.address,
      masterToFollow, //master account
      collateralToken.address, // collateral token
      indexToken.address, // index token
      isLong, //isLong
      user1.address,
      vault.address,
      { gasPrice: "100000000000" }
    )

    await expect(
      mirrorTrading.connect(user1).followTrader(decreaseMasterToFollow)
    ).to.emit(mirrorTrading, "FollowingTrader")

    await mirrorTrading.decreasePosition(
      vault.address,
      decreaseMasterToFollow, //master account
      collateralToken.address, // collateral token
      indexToken.address, // index token
      isLong, //isLong
      user1.address,
      vault.address,
      { gasPrice: "100000000000" }
    )

    const positionOpened = await vault
      .connect(user1)
      .getPosition(
        user1.address,
        collateralToken.address,
        indexToken.address,
        isLong
      )

    console.log("**************DECREASE POSITION****************")
    console.log("** FROM FRONTEND PUPPET DECREASE POSITION    **")
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
      "PUPPET REALIZED PnL => ",
      convertToNormalNumber(positionOpened[5], 30)
    )
    console.log("PUPPET PnL POSITIVE => ", positionOpened[6])
    console.log("PUPPET TIME => ", positionOpened[5].toNumber())
    console.log("***********************************************")
  })
})
