// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {HiveClawBootstrap} from "../src/HiveClawBootstrap.sol";

contract DeployBootstrap is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        HiveClawBootstrap b = new HiveClawBootstrap();
        vm.stopBroadcast();
        console2.log("HiveClawBootstrap:", address(b));
    }
}
