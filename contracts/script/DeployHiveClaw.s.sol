// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {HiveClawBootstrap} from "../src/HiveClawBootstrap.sol";
import {HiveRegistry} from "../src/HiveRegistry.sol";

/// @notice Orchestrated deploy: one broadcast, contracts deployed in order.
/// @dev Foundry pattern for multi-step deploys: deploy earlier contracts first, then pass
///      `address(previous)` into later constructors when wiring dependencies.
///      This script persists addresses under `contracts/deployments/<chainId>.json`.
contract DeployHiveClaw is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);

        HiveClawBootstrap bootstrap = new HiveClawBootstrap();
        HiveRegistry registry = new HiveRegistry();

        vm.stopBroadcast();

        _persistDeployment(address(bootstrap), address(registry));
        _printEnvSnippet(address(bootstrap), address(registry));
    }

    function _persistDeployment(address bootstrap, address registry) internal {
        string memory path = string.concat("deployments/", vm.toString(block.chainid), ".json");
        string memory json = string.concat(
            "{\n",
            '  "chainId": "',
            vm.toString(block.chainid),
            '",\n',
            '  "HiveClawBootstrap": "',
            vm.toString(bootstrap),
            '",\n',
            '  "HiveRegistry": "',
            vm.toString(registry),
            '"\n',
            "}\n"
        );
        vm.writeFile(path, json);
        console2.log("Wrote", path);
    }

    function _printEnvSnippet(address bootstrap, address registry) internal pure {
        console2.log("");
        console2.log("=== Paste into .env (same addresses as JSON file) ===");
        console2.log("HIVECLAW_BOOTSTRAP_CONTRACT", bootstrap);
        console2.log("HIVECLAW_HIVE_REGISTRY_CONTRACT", registry);
        console2.log("NEXT_PUBLIC_HIVECLAW_BOOTSTRAP_CONTRACT", bootstrap);
        console2.log("NEXT_PUBLIC_HIVECLAW_HIVE_REGISTRY_CONTRACT", registry);
        console2.log("======================================================");
    }
}
