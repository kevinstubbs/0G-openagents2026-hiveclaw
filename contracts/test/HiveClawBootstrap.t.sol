// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {HiveClawBootstrap} from "../src/HiveClawBootstrap.sol";

contract HiveClawBootstrapTest is Test {
    function test_version_and_ping() public {
        HiveClawBootstrap b = new HiveClawBootstrap();
        assertEq(b.version(), 1);
        assertEq(b.ping(), "pong");
    }
}
