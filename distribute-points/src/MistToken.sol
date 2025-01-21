// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MistToken is ERC20, Ownable, ReentrancyGuard {
    mapping(address => bool) public burnWhitelist;

    constructor() ERC20("MistToken", "MIST") Ownable(msg.sender) {}

    /**
     * @dev Sets the whitelisted status of a contract for burning tokens.
     * Only the owner can call this function.
     * @param _contract The address of the contract to whitelist/unwhitelist.
     * @param _status The status to set (true for whitelisted, false for not whitelisted).
     */
    function setBurnWhitelist(
        address _contract,
        bool _status
    ) public onlyOwner {
        burnWhitelist[_contract] = _status;
    }

    /**
     * @dev Burns tokens from a user's account. Only whitelisted contracts can call this function.
     * @param _from The address of the user whose tokens will be burned.
     * @param _amount The amount of tokens to burn.
     */
    function burnFrom(address _from, uint256 _amount) public nonReentrant {
        require(
            burnWhitelist[msg.sender],
            "Caller is not whitelisted to burn tokens."
        );
        require(_from != address(0), "Cannot burn from zero address.");
        require(_amount > 0, "Amount must be greater than zero.");
        uint256 fromBalance = balanceOf(_from);
        require(
            fromBalance >= _amount,
            "Burn amount exceeds available balance."
        );

        _spendAllowance(_from, msg.sender, _amount);
        _burn(_from, _amount);
    }

    /**
     * @dev Burns tokens from the caller's own account. This is the standard ERC20 burn function.
     * @param _amount The amount of tokens to burn.
     */
    function burn(uint256 _amount) public virtual nonReentrant {
        _burn(msg.sender, _amount);
    }

    /**
     * @dev Function to mint tokens. Only the owner can mint.
     * @param _to The address that will receive the minted tokens.
     * @param _amount The amount of tokens to mint.
     */
    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }
}
