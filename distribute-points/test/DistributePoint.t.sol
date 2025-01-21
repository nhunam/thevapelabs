// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/DistributePoint.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(address initialOwner) ERC20("Mock Token", "MTK") {
        _mint(initialOwner, 1000000 * 10 ** decimals());
    }
}

contract DistributePointTest is Test {
    DistributePoint public distributePoint;
    MockERC20 public mockToken;

    address public owner = makeAddr("owner");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public user3 = makeAddr("user3");

    uint256 public constant INITIAL_SUPPLY = 1000000 * 10 ** 18; // 1 million tokens

    event Funded(uint256 amount);
    event Distributed(address[] recipients, uint256[] amounts);

    function setUp() public {
        vm.startPrank(owner);
        // Pass owner address to MockERC20 constructor
        mockToken = new MockERC20(owner);
        distributePoint = new DistributePoint(address(mockToken));
        vm.stopPrank();
    }

    function testConstructor() public view {
        assertEq(address(distributePoint.token()), address(mockToken));
        assertEq(distributePoint.owner(), owner);
    }

    function testConstructorZeroAddress() public {
        vm.startPrank(owner);
        vm.expectRevert("Invalid token address");
        new DistributePoint(address(0));
        vm.stopPrank();
    }

    function testFundFailures() public {
        uint256 fundAmount = 1000 * 10 ** 18;

        // Test fund with zero amount
        vm.startPrank(owner);
        vm.expectRevert("Amount must be greater than 0");
        distributePoint.fund(0);
        vm.stopPrank();

        // Test fund without approval
        vm.startPrank(owner);
        vm.expectRevert();
        distributePoint.fund(fundAmount);
        vm.stopPrank();

        // Test fund from non-owner
        vm.startPrank(user1);
        vm.expectRevert(
            abi.encodeWithSignature(
                "OwnableUnauthorizedAccount(address)",
                user1
            )
        );
        distributePoint.fund(fundAmount);
        vm.stopPrank();
    }

    function testFundSuccess() public {
        uint256 fundAmount = 1000 * 10 ** 18;

        vm.startPrank(owner);
        mockToken.approve(address(distributePoint), fundAmount);

        vm.expectEmit(true, true, true, true);
        emit Funded(fundAmount);

        distributePoint.fund(fundAmount);
        vm.stopPrank();

        assertEq(mockToken.balanceOf(address(distributePoint)), fundAmount);
    }

    function testDistributeFailures() public {
        address[] memory recipients = new address[](2);
        recipients[0] = user1;
        recipients[1] = user2;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 100 * 10 ** 18;
        amounts[1] = 200 * 10 ** 18;

        vm.startPrank(user1);
        vm.expectRevert(
            abi.encodeWithSignature(
                "OwnableUnauthorizedAccount(address)",
                user1
            )
        );
        distributePoint.distribute(recipients, amounts);
        vm.stopPrank();

        vm.startPrank(owner);

        vm.expectRevert("Empty recipients array");
        distributePoint.distribute(new address[](0), new uint256[](0));

        uint256[] memory wrongAmounts = new uint256[](1);
        wrongAmounts[0] = 100 * 10 ** 18;
        vm.expectRevert("Arrays length mismatch");
        distributePoint.distribute(recipients, wrongAmounts);

        recipients[0] = address(0);
        vm.expectRevert("Invalid recipient address");
        distributePoint.distribute(recipients, amounts);

        recipients[0] = user1;
        amounts[0] = 0;
        vm.expectRevert("Amount must be greater than 0");
        distributePoint.distribute(recipients, amounts);

        amounts[0] = 100 * 10 ** 18;
        vm.expectRevert("Insufficient balance");
        distributePoint.distribute(recipients, amounts);

        vm.stopPrank();
    }

    function testDistributeSuccess() public {
        uint256 fundAmount = 1000 * 10 ** 18;

        vm.startPrank(owner);
        mockToken.approve(address(distributePoint), fundAmount);
        distributePoint.fund(fundAmount);

        address[] memory recipients = new address[](3);
        recipients[0] = user1;
        recipients[1] = user2;
        recipients[2] = user3;

        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100 * 10 ** 18;
        amounts[1] = 200 * 10 ** 18;
        amounts[2] = 300 * 10 ** 18;

        vm.expectEmit(true, true, true, true);
        emit Distributed(recipients, amounts);

        distributePoint.distribute(recipients, amounts);
        vm.stopPrank();

        assertEq(mockToken.balanceOf(user1), amounts[0]);
        assertEq(mockToken.balanceOf(user2), amounts[1]);
        assertEq(mockToken.balanceOf(user3), amounts[2]);
    }

    function testFuzzFund(uint256 amount) public {
        amount = bound(amount, 1, INITIAL_SUPPLY);

        vm.startPrank(owner);
        mockToken.approve(address(distributePoint), amount);
        distributePoint.fund(amount);
        vm.stopPrank();

        assertEq(mockToken.balanceOf(address(distributePoint)), amount);
    }

    function testFuzzDistribute(uint256[] memory amounts) public {
        vm.assume(amounts.length > 0 && amounts.length <= 100);

        address[] memory recipients = new address[](amounts.length);
        uint256 totalAmount = 0;

        for (uint256 i = 0; i < amounts.length; i++) {
            amounts[i] = bound(amounts[i], 1, 1000 * 10 ** 18);
            totalAmount += amounts[i];
            recipients[i] = address(uint160(i + 1));
        }

        vm.startPrank(owner);
        mockToken.approve(address(distributePoint), totalAmount);
        distributePoint.fund(totalAmount);
        distributePoint.distribute(recipients, amounts);
        vm.stopPrank();

        for (uint256 i = 0; i < recipients.length; i++) {
            assertEq(mockToken.balanceOf(recipients[i]), amounts[i]);
        }
    }
}
