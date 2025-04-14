// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract MistStakingPool is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    IERC20 public stakingToken;

    uint256 public constant COLLECT_FEE = 0.00001 * (10**18);

    address public immutable backendSigner;
    mapping(address => uint256) public latestNonce;
    mapping(address => uint256) public stakeBalances;

    event Collected(address indexed user, uint256 amount);
    event Staked(address indexed user, uint256 amount, uint256 nonce);
    event Unstaked(address indexed user, uint256 amount, uint256 nonce);

    constructor(address _backendSigner, address _mistTokenAddress) Ownable(msg.sender) ReentrancyGuard() {
        require(_backendSigner != address(0), "Invalid backend signer");
        require(_mistTokenAddress != address(0), "Invalid MistToken address");
        stakingToken = IERC20(_mistTokenAddress); 
        backendSigner = _backendSigner;
    }

    /**
     * @notice Allows the user to collect rewards by sending a small fee.
     * @dev The fee is transferred directly to the contract owner. The amount sent
     * must be exactly equal to the defined COLLECT_FEE.
     * Emits a {Collected} event.
     */
    function collect() external payable nonReentrant {
        require(msg.value == COLLECT_FEE, "Invalid amount!");

        payable(owner()).transfer(msg.value);
        emit Collected(msg.sender, msg.value);
    }

    /**
     * @notice Stake MIST tokens into the pool.
     * @dev User must provide a valid backend-generated signature based on their address,
     * the stake amount, and a unique nonce to prevent replay attacks.
     * The function will update the user’s stake balance and transfer tokens from the user to this contract.
     * Emits a {Staked} event.
     * @param _amount The amount of MIST tokens to stake.
     * @param _userNonce A unique nonce to ensure the stake request is not replayed.
     * @param _signature Backend-signed signature verifying the request.
     */
    function stake(uint256 _amount, uint256 _userNonce, bytes memory _signature) external nonReentrant {
        require(_amount > 0, "Invalid amount");
        require(_userNonce > latestNonce[msg.sender], "Invalid nonce");

        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, _amount, _userNonce));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));

        require(recoverSigner(ethSignedMessageHash, _signature) == backendSigner, "Invalid signature");

        latestNonce[msg.sender] = _userNonce;

        require(stakingToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        stakeBalances[msg.sender] += _amount;

        emit Staked(msg.sender, _amount, _userNonce);
    }

    /**
     * @notice Unstake previously staked MIST tokens from the pool.
     * @dev Requires a valid backend-generated signature based on the user’s address,
     * the unstake amount, and a nonce. This ensures only valid and unique requests are processed.
     * Emits an {Unstaked} event.
     * @param _amount The amount of MIST tokens to unstake.
     * @param _userNonce A unique nonce to ensure the unstake request is not replayed.
     * @param _signature Backend-signed signature verifying the request.
     */
    function unstake(uint256 _amount, uint256 _userNonce, bytes memory _signature) external nonReentrant {
        require(_amount > 0, "Invalid amount");
        require(_userNonce > latestNonce[msg.sender], "Invalid nonce");
        require(stakeBalances[msg.sender] >= _amount, "Not enough balance");

        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, _amount, _userNonce));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));

        require(recoverSigner(ethSignedMessageHash, _signature) == backendSigner, "Invalid signature");

        latestNonce[msg.sender] = _userNonce;

        stakeBalances[msg.sender] -= _amount;
        require(stakingToken.transfer(msg.sender, _amount), "Transfer failed");

        emit Unstaked(msg.sender, _amount, _userNonce);
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
