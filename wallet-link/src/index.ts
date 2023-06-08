import { BaseProvider, TransactionReceipt, Web3Provider } from "@ethersproject/providers"
import { CHAIN } from "gmx-middleware-const"
import { awaitPromises, constant, map, merge, mergeArray, snapshot } from "@most/core"
import { Stream } from "@most/types"
import { EIP1193Provider, ProviderInfo, ProviderRpcError } from "eip1193-provider"
import { parseError, providerAction } from "./common.js"


export interface IWalletLink<T extends EIP1193Provider = EIP1193Provider> {
  account: Stream<string | null>
  network: Stream<CHAIN | null>
  disconnect: Stream<ProviderRpcError>
  connect: Stream<ProviderInfo>

  provider: Stream<Web3Provider | null>
  wallet: Stream<T | null>
}


export const getTxDetails = (provider: Stream<BaseProvider>) => (txHash: string): Stream<TransactionReceipt | null> => {
  return providerAction(provider)(
    350,
    map(provider => provider.getTransactionReceipt(txHash))
  )
}


// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md
// walletconnect chaining chain issue https://github.com/WalletConnect/walletconnect-monorepo/issues/612
// attempting to manage wallet connection and event flow
export function initWalletLink<T extends EIP1193Provider>(walletChange: Stream<T | null>): IWalletLink<T> {
  const ethersWeb3Wrapper = awaitPromises(map(async wallet => {
    if (wallet) {
      const w3p = new Web3Provider(wallet)
      await w3p.getNetwork()
      return w3p
    }

    return null
  }, walletChange))

  const walletEvent = eip1193ProviderEvent(walletChange)

  const connect = walletEvent('connect')
  const disconnect = walletEvent('disconnect')
  
  const networkChange = map(Number, walletEvent('chainChanged'))
  const accountChange = map(list => list[0], walletEvent('accountsChanged'))
  const proivderChange = awaitPromises(snapshot(async (walletProvider, net) => {
    if (walletProvider === null) {
      return null
    }

    const w3p = new Web3Provider(walletProvider)
    await w3p.getNetwork()

    return w3p
  }, walletChange, networkChange))


  const currentAccount = awaitPromises(map(async (provi) => {
    if (provi === null) {
      return null
    }

    await provi.getNetwork()
    return (await provi.listAccounts())[0] || null
  }, ethersWeb3Wrapper))


  const account = merge(accountChange, currentAccount)
  const onDisconnect = constant(null, disconnect)
  const provider = mergeArray([ethersWeb3Wrapper, proivderChange, onDisconnect])

  const network = awaitPromises(map(async w3p => {
    if (w3p) {
      // @ts-ignore
      const newLocal = w3p.getNetwork()
      return (await newLocal).chainId
    }

    return null
  }, provider))

  return { account, network, provider, disconnect, connect, wallet: walletChange }
}



export { parseError }
 