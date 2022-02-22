import { ethers } from "hardhat"


export async function contractAt(name: string, address: string) {
  const contractFactory = await ethers.getContractFactory(name)
  return contractFactory.attach(address)
}

