// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {HiveRegistry} from "../src/HiveRegistry.sol";

contract HiveRegistryTest is Test {
    HiveRegistry internal reg;
    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);
    address internal carol = address(0xCA01);

    function setUp() public {
        reg = new HiveRegistry();
    }

    function test_version() public view {
        assertEq(reg.version(), 1);
    }

    function test_createHive_increments_id_and_memberHives() public {
        vm.prank(alice);
        uint256 id1 = reg.createHive("a");
        assertEq(id1, 1);
        assertEq(reg.nextHiveId(), 1);

        uint256[] memory hA = reg.memberHives(alice);
        assertEq(hA.length, 1);
        assertEq(hA[0], 1);

        vm.prank(bob);
        uint256 id2 = reg.createHive("b");
        assertEq(id2, 2);

        uint256[] memory hB = reg.memberHives(bob);
        assertEq(hB.length, 1);
        assertEq(hB[0], 2);
    }

    function test_addMember_updates_memberHives_for_both() public {
        vm.prank(alice);
        uint256 hid = reg.createHive("h");

        vm.prank(alice);
        reg.addMember(hid, bob);

        uint256[] memory aH = reg.memberHives(alice);
        assertEq(aH.length, 1);
        assertEq(aH[0], hid);

        uint256[] memory bH = reg.memberHives(bob);
        assertEq(bH.length, 1);
        assertEq(bH[0], hid);
    }

    function test_removeMember_updates_memberHives() public {
        vm.prank(alice);
        uint256 hid = reg.createHive("h");

        vm.prank(alice);
        reg.addMember(hid, bob);

        vm.prank(alice);
        reg.removeMember(hid, bob);

        uint256[] memory bH = reg.memberHives(bob);
        assertEq(bH.length, 0);
    }

    function test_commitMemory_and_latest_and_history() public {
        vm.prank(alice);
        uint256 hid = reg.createHive("h");

        bytes32 key = keccak256("shared/slot");
        bytes32 ptr = bytes32(uint256(0x1234));
        bytes32 h = keccak256("ciphertext");
        string memory meta = "ipfs://x";

        vm.prank(alice);
        reg.commitMemory(hid, key, ptr, h, 0, meta);

        HiveRegistry.MemoryCommit memory latest = reg.latestMemory(hid, key);
        assertEq(latest.hiveId, hid);
        assertEq(latest.memoryKey, key);
        assertEq(latest.storagePointer, ptr);
        assertEq(latest.contentHash, h);
        assertEq(latest.writer, alice);
        assertEq(latest.keyVersion, 0);
        assertEq(latest.metadataURI, meta);
        assertGt(latest.timestamp, 0);

        assertEq(reg.memoryHistoryLength(hid, key), 1);
        HiveRegistry.MemoryCommit memory at0 = reg.memoryHistoryAt(hid, key, 0);
        assertEq(at0.writer, alice);
    }

    function test_non_member_cannot_commit() public {
        vm.prank(alice);
        uint256 hid = reg.createHive("h");

        bytes32 key = keccak256("k");
        vm.prank(bob);
        vm.expectRevert(HiveRegistry.HiveRegistry__NotMember.selector);
        reg.commitMemory(hid, key, bytes32(0), bytes32(0), 0, "");
    }

    function test_member_can_commit() public {
        vm.prank(alice);
        uint256 hid = reg.createHive("h");
        vm.prank(alice);
        reg.addMember(hid, bob);

        bytes32 key = keccak256("k");
        vm.prank(bob);
        reg.commitMemory(hid, key, bytes32(uint256(1)), bytes32(uint256(2)), 0, "m");

        HiveRegistry.MemoryCommit memory latest = reg.latestMemory(hid, key);
        assertEq(latest.writer, bob);
    }

    function test_hiveMember_enumeration() public {
        vm.prank(alice);
        uint256 hid = reg.createHive("h");
        vm.prank(alice);
        reg.addMember(hid, bob);

        assertEq(reg.hiveMemberCount(hid), 2);
        address a0 = reg.hiveMemberAt(hid, 0);
        address a1 = reg.hiveMemberAt(hid, 1);
        assertTrue((a0 == alice && a1 == bob) || (a0 == bob && a1 == alice));
    }
}
