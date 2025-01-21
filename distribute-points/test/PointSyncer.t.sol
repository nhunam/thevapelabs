// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Test} from "forge-std/Test.sol";
import "../src/MistToken.sol";
import "../src/PointSyncer.sol";

contract PointSyncerTest is Test {
    MistToken public mistToken;
    PointSyncer public pointSyncer;

    address public owner;
    address public user1;
    address public user2;
    address public user3;

    uint256 public constant INITIAL_SUPPLY = 1000000 * 10 ** 18; // 1 million tokens
    uint256 public constant FUND_AMOUNT = 100000 * 10 ** 18; // 100k tokens

    event Funded(uint256 amount);
    event Distributed(uint256 totalAmount);
    event Burned(uint256 totalAmount);

    function setUp() public {
        // Setup accounts
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");

        // Deploy contracts as owner
        vm.startPrank(owner);

        mistToken = new MistToken();
        pointSyncer = new PointSyncer(address(mistToken));

        // Mint initial supply to owner
        mistToken.mint(owner, INITIAL_SUPPLY);

        // Whitelist PointSyncer for burning
        mistToken.setBurnWhitelist(address(pointSyncer), true);

        vm.stopPrank();
    }

    function testInitialSetup() public view {
        assertEq(address(pointSyncer.mistToken()), address(mistToken));
        assertEq(pointSyncer.owner(), owner);
        assertEq(mistToken.balanceOf(owner), INITIAL_SUPPLY);
        assertTrue(mistToken.burnWhitelist(address(pointSyncer)));
    }

    function testFundSuccess() public {
        vm.startPrank(owner);
        // Approve tokens first
        mistToken.approve(address(pointSyncer), FUND_AMOUNT);

        // Expect Funded event
        vm.expectEmit(true, true, true, true);
        emit Funded(FUND_AMOUNT);

        // Fund the contract
        pointSyncer.fund(FUND_AMOUNT);
        vm.stopPrank();

        assertEq(mistToken.balanceOf(address(pointSyncer)), FUND_AMOUNT);
        assertEq(mistToken.balanceOf(owner), INITIAL_SUPPLY - FUND_AMOUNT);
    }

    function testFundFailsWithoutApproval() public {
        vm.prank(owner);
        vm.expectRevert();
        pointSyncer.fund(FUND_AMOUNT);
    }

    function testDistributeSuccess() public {
        // Setup: Fund the contract first
        vm.startPrank(owner);
        mistToken.approve(address(pointSyncer), FUND_AMOUNT);
        pointSyncer.fund(FUND_AMOUNT);

        address[] memory recipients = new address[](3);
        recipients[0] = user1;
        recipients[1] = user2;
        recipients[2] = user3;

        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 1000 * 10 ** 18;
        amounts[1] = 2000 * 10 ** 18;
        amounts[2] = 3000 * 10 ** 18;

        uint256 totalAmount = amounts[0] + amounts[1] + amounts[2];

        // Expect Distributed event
        vm.expectEmit(true, true, true, true);
        emit Distributed(totalAmount);

        // Distribute tokens
        pointSyncer.distribute(recipients, amounts);
        vm.stopPrank();

        // Check balances
        assertEq(mistToken.balanceOf(user1), amounts[0]);
        assertEq(mistToken.balanceOf(user2), amounts[1]);
        assertEq(mistToken.balanceOf(user3), amounts[2]);
    }

    function testBurnSuccess() public {
        // Setup: Fund and distribute tokens first
        vm.startPrank(owner);
        mistToken.approve(address(pointSyncer), FUND_AMOUNT);
        pointSyncer.fund(FUND_AMOUNT);

        address[] memory recipients = new address[](2);
        recipients[0] = user1;
        recipients[1] = user2;

        uint256[] memory distributeAmounts = new uint256[](2);
        distributeAmounts[0] = 1000 * 10 ** 18;
        distributeAmounts[1] = 2000 * 10 ** 18;

        pointSyncer.distribute(recipients, distributeAmounts);
        vm.stopPrank();

        // Approve PointSyncer to burn tokens
        vm.prank(user1);
        mistToken.approve(address(pointSyncer), distributeAmounts[0]);
        vm.prank(user2);
        mistToken.approve(address(pointSyncer), distributeAmounts[1]);

        address[] memory burnAddresses = new address[](2);
        burnAddresses[0] = user1;
        burnAddresses[1] = user2;

        uint256[] memory burnAmounts = new uint256[](2);
        burnAmounts[0] = 500 * 10 ** 18;
        burnAmounts[1] = 1000 * 10 ** 18;

        uint256 totalBurnAmount = burnAmounts[0] + burnAmounts[1];

        // Expect Burned event
        vm.expectEmit(true, true, true, true);
        emit Burned(totalBurnAmount);

        // Burn tokens as owner
        vm.prank(owner);
        pointSyncer.burn(burnAddresses, burnAmounts);

        // Check remaining balances
        assertEq(
            mistToken.balanceOf(user1),
            distributeAmounts[0] - burnAmounts[0]
        );
        assertEq(
            mistToken.balanceOf(user2),
            distributeAmounts[1] - burnAmounts[1]
        );
    }

    function testDistributeFailsWithUnequalArrays() public {
        vm.prank(owner);
        address[] memory recipients = new address[](2);
        uint256[] memory amounts = new uint256[](3);

        vm.expectRevert("Arrays must have the same length");
        pointSyncer.distribute(recipients, amounts);
    }

    function testBurnFailsWithUnequalArrays() public {
        vm.prank(owner);
        address[] memory froms = new address[](2);
        uint256[] memory amounts = new uint256[](3);

        vm.expectRevert("Arrays must have the same length");
        pointSyncer.burn(froms, amounts);
    }

    function testOnlyOwnerCanFund() public {
        vm.prank(user1);
        vm.expectRevert();
        pointSyncer.fund(FUND_AMOUNT);
    }

    function testOnlyOwnerCanDistribute() public {
        vm.prank(user1);
        vm.expectRevert();
        pointSyncer.distribute(new address[](0), new uint256[](0));
    }

    function testOnlyOwnerCanBurn() public {
        vm.prank(user1);
        vm.expectRevert();
        pointSyncer.burn(new address[](0), new uint256[](0));
    }

    function testDistributeFailsWithZeroAddress() public {
        vm.prank(owner);
        address[] memory recipients = new address[](1);
        recipients[0] = address(0);

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1000 * 10 ** 18;

        vm.expectRevert("Recipient address cannot be zero");
        pointSyncer.distribute(recipients, amounts);
    }

    function testBurnFailsWithZeroAddress() public {
        vm.prank(owner);
        address[] memory froms = new address[](1);
        froms[0] = address(0);

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1000 * 10 ** 18;

        vm.expectRevert("Cannot burn from zero address.");
        pointSyncer.burn(froms, amounts);
    }

    function testDistributeFailsWithZeroAmount() public {
        vm.prank(owner);
        address[] memory recipients = new address[](1);
        recipients[0] = user1;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 0;

        vm.expectRevert("Amount must be greater than zero");
        pointSyncer.distribute(recipients, amounts);
    }

    function testBurnFailsWithZeroAmount() public {
        vm.prank(owner);
        address[] memory froms = new address[](1);
        froms[0] = user1;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 0;

        vm.expectRevert("Amount must be greater than zero");
        pointSyncer.burn(froms, amounts);
    }

    receive() external payable {}
}
