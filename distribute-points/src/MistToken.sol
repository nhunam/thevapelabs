// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract MistToken is ERC20, Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    mapping(address => bool) public burnWhitelist;
    uint256 public constant CHECKIN_FEE = 0.00001 * (10**18);
    uint256 public constant MAX_CHECKIN_FEE = 0.1 * (10**18);
    uint256 public constant MAX_FAUCET_TOKENS = 0.1 * (10**18);
    mapping(address => uint256) public lastCheckInDate;
    mapping(address => bool) public hasClaimedFaucet;

    address public immutable backendSigner;
    mapping(address => uint256) public latestNonce;

    event CheckedIn(address indexed user, uint256 amount);
    event FaucetSent(address indexed user, uint256 amount);
    event Claimed(address indexed user, uint256 amount, uint256 nonce);

    constructor(address _backendSigner) ERC20("MistToken", "MIST") Ownable(msg.sender) {
        require(_backendSigner != address(0), "Invalid backend signer");
        backendSigner = _backendSigner;
    }

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
     * No approval needed for whitelisted contracts.
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

        // Direct burn without approval check
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
     * @dev User check in by sending min fee to owner.
     */
    function checkIn() external payable nonReentrant {
        uint256 currentDate = block.timestamp / 86400;
        require(lastCheckInDate[msg.sender] < currentDate, "Already checked in today!");
        require(msg.value >= CHECKIN_FEE && msg.value <= MAX_CHECKIN_FEE, "Invalid amount!");

        lastCheckInDate[msg.sender] = currentDate;
        payable(owner()).transfer(msg.value);
        emit CheckedIn(msg.sender, msg.value);
    }

    /**
     * @dev User faucet to claim MON token. Each address can claim only once.
     * @param _to The address that will receive MON tokens.
     */
    function faucet(address _to) external payable nonReentrant onlyOwner {
        require(_to != address(0), "Cannot send faucet tokens to the zero address.");
        require(msg.value > 0 && msg.value <= MAX_FAUCET_TOKENS, "Amount must be greater than 0 and at most 0.1 MON");
        require(!hasClaimedFaucet[_to], "User has already claimed faucet!");

        hasClaimedFaucet[_to] = true;
        (bool success, ) = payable(_to).call{value: msg.value}("");
        require(success, "Transfer failed");

        emit FaucetSent(_to, msg.value);
    }

    /**
     * @dev Allows a user to claim MIST tokens if they provide a valid cryptographic signature.
     * The signature is generated off-chain based on the user's address, 
     * the claim amount, and a nonce to ensure uniqueness and prevent replay attacks.
     * @param _amount The amount of MIST tokens to be minted for the user.
     * @param _userNonce A unique nonce for the user to ensure each claim request is unique.
     * @param _signature A cryptographic signature that verifies the legitimacy of the claim request.
     */
    function claim(uint256 _amount, uint256 _userNonce, bytes memory _signature) external nonReentrant {
        require(_amount > 0, "Invalid amount");
        require(_userNonce > latestNonce[msg.sender], "Invalid nonce");

        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, _amount, _userNonce));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));

        require(recoverSigner(ethSignedMessageHash, _signature) == backendSigner, "Invalid signature");

        latestNonce[msg.sender] = _userNonce;

        _mint(msg.sender, _amount);
        emit Claimed(msg.sender, _amount, _userNonce);
    }

    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature) public pure returns (address) {
        require(_signature.length == 65, "invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

    assembly {
        r := mload(add(_signature, 32))
        s := mload(add(_signature, 64))
        v := byte(0, mload(add(_signature, 96)))
    }

    // v {0, 1} to {27, 28}
    if (v < 27) {
        v += 27;
    }

    return ecrecover(_ethSignedMessageHash, v, r, s);
    }
}
