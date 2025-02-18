// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script} from "forge-std/Script.sol";
import {MistToken} from "src/MistToken.sol";

contract DeployMistToken is Script {
    function run() external returns (MistToken) {
        vm.startBroadcast();
        MistToken mistToken = new MistToken();
        vm.stopBroadcast();

        return mistToken;
    }
}