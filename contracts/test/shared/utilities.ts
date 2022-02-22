import { ContractTransaction, ethers, providers } from 'ethers'


export function newWallet() {
  return ethers.Wallet.createRandom()
}

export function bigNumberify(n: any) {
  return ethers.BigNumber.from(n)
}

export function expandDecimals(n: any, decimals: ethers.BigNumberish) {
  return bigNumberify(n).mul(bigNumberify(10).pow(decimals))
}

export async function send(provider: providers.JsonRpcProvider, method: string, params: any[] = []) {
  await provider.send(method, params)
}

export async function mineBlock(provider: providers.JsonRpcProvider) {
  await send(provider, "evm_mine")
}

export async function increaseTime(provider: providers.JsonRpcProvider, seconds: number) {
  await send(provider, "evm_increaseTime", [seconds])
}

export async function gasUsed(provider: providers.JsonRpcProvider, tx: ContractTransaction) {
  return (await provider.getTransactionReceipt(tx.hash)).gasUsed
}

export async function getNetworkFee(provider: providers.JsonRpcProvider, tx: ContractTransaction) {
  const gas = await gasUsed(provider, tx)

  if (!tx.gasPrice) {
    throw new Error('could not get gas price')
  }

  return gas.mul(tx.gasPrice)
}

export async function reportGasUsed(provider: providers.JsonRpcProvider, tx: { hash: string }, label: string) {
  const { gasUsed } = await provider.getTransactionReceipt(tx.hash)
  console.info(label, gasUsed.toString())
}

export async function getBlockTime(provider: providers.JsonRpcProvider) {
  const blockNumber = await provider.getBlockNumber()
  const block = await provider.getBlock(blockNumber)
  return block.timestamp
}



// export function getPriceBitArray(prices: string[]) {
//   const priceBitArray = []
//   let shouldExit = false

//   for (let i = 0; i < parseInt((prices.length - 1) / 8) + 1; i++) {
//     let priceBits = new BN('0')
//     for (let j = 0; j < 8; j++) {
//       const index = i * 8 + j
//       if (index >= prices.length) {
//         shouldExit = true
//         break
//       }

//       const price = new BN(prices[index])
//       if (price.gt(new BN("2147483648"))) { // 2^31
//         throw new Error(`price exceeds bit limit ${price.toString()}`)
//       }
//       priceBits = priceBits.or(price.shln(j * 32))
//     }

//     priceBitArray.push(priceBits.toString())

//     if (shouldExit) { break }
//   }

//   return priceBitArray
// }

export const convertToNormalNumber = (bigNum: ethers.BigNumberish, decimals: ethers.BigNumberish) => {
  return ethers.utils.formatUnits(bigNum, decimals)
}

