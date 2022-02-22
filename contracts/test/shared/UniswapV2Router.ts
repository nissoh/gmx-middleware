import { BigNumber, BigNumberish, Signer } from "ethers"
import { ethers } from "hardhat"

const UniswapV2ROUTER = "0x1b02da8cb0d097eb8d57a175b88c7d8b47997506"

export async function swapETHForExactTokens(amountIn: BigNumber, amountExactOut: BigNumberish, token: string, recipient: string, signer: Signer | undefined) {
  const v2Router = await ethers.getContractAt("IUniswapV2Router02", UniswapV2ROUTER, signer)
  const weth = await v2Router.WETH()
  const timestamp = new Date().getTime()

  await v2Router.swapETHForExactTokens(
    amountExactOut,
    [weth, token],
    recipient,
    Math.round(timestamp / 1000) + 10 * 60,
    {
      value: amountIn,
    },
  )
}

