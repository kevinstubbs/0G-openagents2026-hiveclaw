// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Phase 1 bootstrap contract: proves Foundry → deploy → config wiring. Phase 2 uses `HiveRegistry` for hives and memory.
contract HiveClawBootstrap {
    function version() external pure returns (uint256) {
        return 1;
    }

    function ping() external pure returns (string memory) {
        return "pong";
    }
}
