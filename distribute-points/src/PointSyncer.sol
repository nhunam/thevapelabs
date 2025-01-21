// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IMistToken is IERC20 {
    function burnFrom(address from, uint256 amount) external;
}

contract PointSyncer is Ownable, ReentrancyGuard {
    IMistToken public mistToken;

    event Funded(uint256 amount);
    event Distributed(uint256 totalAmount);
    event Burned(uint256 totalAmount);

    constructor(
        address _mistTokenAddress
    ) Ownable(msg.sender) ReentrancyGuard() {
        mistToken = IMistToken(_mistTokenAddress);
    }

    function fund(uint256 _amount) public onlyOwner nonReentrant {
        require(
            mistToken.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );
        emit Funded(_amount);
    }

    function distribute(
        address[] memory _recipients,
        uint256[] memory _amounts
    ) public onlyOwner nonReentrant {
        require(
            _recipients.length == _amounts.length,
            "Arrays must have the same length"
        );
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _recipients.length; i++) {
            require(
                _recipients[i] != address(0),
                "Recipient address cannot be zero"
            );
            uint256 amount = _amounts[i];
            require(amount > 0, "Amount must be greater than zero");
            require(
                mistToken.transfer(_recipients[i], amount),
                "Transfer to recipient failed"
            );
            totalAmount += amount;
        }
        emit Distributed(totalAmount);
    }

    function burn(
        address[] memory _froms,
        uint256[] memory _amounts
    ) public onlyOwner nonReentrant {
        require(
            _froms.length == _amounts.length,
            "Arrays must have the same length"
        );
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _froms.length; i++) {
            require(_froms[i] != address(0), "Cannot burn from zero address.");
            uint256 amount = _amounts[i];
            require(amount > 0, "Amount must be greater than zero");
            mistToken.burnFrom(_froms[i], amount);
            totalAmount += amount;
        }
        emit Burned(totalAmount);
    }
}
