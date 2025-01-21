// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract DistributePoint is Ownable, ReentrancyGuard {
    // State variables
    IERC20 public immutable token;

    // Events
    event Funded(uint256 amount);
    event Distributed(address[] recipients, uint256[] amounts);

    /**
     * @notice Constructor sets the token address and owner
     * @param _token The ERC20 token address that will be distributed
     */
    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "Invalid token address");
        token = IERC20(_token);
    }

    /**
     * @notice Fund the contract with ERC20 tokens
     * @param amount Amount of tokens to transfer
     */
    function fund(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");

        bool success = token.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");

        emit Funded(amount);
    }

    /**
     * @notice Distribute tokens to multiple recipients
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to distribute to each recipient
     */
    function distribute(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner nonReentrant {
        require(recipients.length > 0, "Empty recipients array");
        require(recipients.length == amounts.length, "Arrays length mismatch");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient address");
            require(amounts[i] > 0, "Amount must be greater than 0");
            totalAmount += amounts[i];
        }

        require(
            token.balanceOf(address(this)) >= totalAmount,
            "Insufficient balance"
        );

        for (uint256 i = 0; i < recipients.length; i++) {
            bool success = token.transfer(recipients[i], amounts[i]);
            require(success, "Transfer failed");
        }

        emit Distributed(recipients, amounts);
    }
}
