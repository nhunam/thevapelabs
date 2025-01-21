// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {ERC20} from "solmate/tokens/ERC20.sol";

contract MistToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("MistToken", "MIST", 18) {
        _mint(msg.sender, initialSupply);
    }
}
