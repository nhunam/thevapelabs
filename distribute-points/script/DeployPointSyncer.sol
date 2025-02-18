// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script} from "forge-std/Script.sol";
import {PointSyncer} from "src/PointSyncer.sol";

contract DeployPointSyncer is Script {
    function run(address mistTokenAddress) external returns (PointSyncer) {
        vm.startBroadcast();
        PointSyncer pointSyncer = new PointSyncer(mistTokenAddress);
        vm.stopBroadcast();

        return pointSyncer;
    }
}