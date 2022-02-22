// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.6.12;

interface IUniswapV2Router02 {
  function WETH() external pure returns (address);

  function swapETHForExactTokens(
    uint256 amountOut,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external payable returns (uint256[] memory amounts);
}