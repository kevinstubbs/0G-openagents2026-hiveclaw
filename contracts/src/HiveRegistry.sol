// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Canonical hive index, membership, and memory commit provenance for HiveClaw.
contract HiveRegistry {
    struct Hive {
        address creator;
        string name;
        uint256 createdAt;
        uint256 currentKeyVersion;
        bool exists;
    }

    struct MemoryCommit {
        uint256 hiveId;
        bytes32 memoryKey;
        bytes32 storagePointer;
        bytes32 contentHash;
        address writer;
        uint256 timestamp;
        uint256 keyVersion;
        string metadataURI;
    }

    uint256 public nextHiveId;

    mapping(uint256 => Hive) public hives;
    mapping(uint256 => mapping(address => bool)) public members;

    /// @dev Per-hive member list for enumeration (UI / CLI).
    mapping(uint256 => address[]) private _hiveMemberList;
    mapping(uint256 => mapping(address => uint256)) private _hiveMemberIndex;

    mapping(uint256 => mapping(bytes32 => MemoryCommit)) private _latestMemory;
    mapping(uint256 => mapping(bytes32 => MemoryCommit[])) private _memoryHistory;

    mapping(address => uint256[]) private _memberHives;
    mapping(address => mapping(uint256 => uint256)) private _memberHivePos;

    event HiveCreated(uint256 indexed hiveId, string name, address indexed creator);
    event MemberAdded(uint256 indexed hiveId, address indexed member);
    event MemberRemoved(uint256 indexed hiveId, address indexed member);
    event MemoryCommitted(
        uint256 indexed hiveId,
        bytes32 indexed memoryKey,
        address indexed writer,
        bytes32 storagePointer,
        bytes32 contentHash,
        uint256 timestamp,
        uint256 keyVersion,
        string metadataURI
    );

    error HiveRegistry__InvalidHive();
    error HiveRegistry__NotCreator();
    error HiveRegistry__NotMember();
    error HiveRegistry__ZeroAddress();
    error HiveRegistry__AlreadyMember();
    error HiveRegistry__NotInHive();
    error HiveRegistry__CannotRemoveCreator();

    function version() external pure returns (uint256) {
        return 1;
    }

    function createHive(string calldata name) external returns (uint256 hiveId) {
        hiveId = ++nextHiveId;
        hives[hiveId] = Hive({
            creator: msg.sender,
            name: name,
            createdAt: block.timestamp,
            currentKeyVersion: 0,
            exists: true
        });
        _addMember(hiveId, msg.sender);
        _pushMemberHive(msg.sender, hiveId);
        emit HiveCreated(hiveId, name, msg.sender);
    }

    function addMember(uint256 hiveId, address member) external {
        _requireHive(hiveId);
        if (msg.sender != hives[hiveId].creator) revert HiveRegistry__NotCreator();
        if (member == address(0)) revert HiveRegistry__ZeroAddress();
        if (members[hiveId][member]) revert HiveRegistry__AlreadyMember();
        _addMember(hiveId, member);
        _pushMemberHive(member, hiveId);
        emit MemberAdded(hiveId, member);
    }

    function removeMember(uint256 hiveId, address member) external {
        _requireHive(hiveId);
        if (msg.sender != hives[hiveId].creator) revert HiveRegistry__NotCreator();
        if (member == address(0)) revert HiveRegistry__ZeroAddress();
        if (member == hives[hiveId].creator) revert HiveRegistry__CannotRemoveCreator();
        if (!members[hiveId][member]) revert HiveRegistry__NotInHive();
        _removeMember(hiveId, member);
        _popMemberHive(member, hiveId);
        emit MemberRemoved(hiveId, member);
    }

    function commitMemory(
        uint256 hiveId,
        bytes32 memoryKey,
        bytes32 storagePointer,
        bytes32 contentHash,
        uint256 keyVersion,
        string calldata metadataURI
    ) external {
        _requireHive(hiveId);
        if (!members[hiveId][msg.sender]) revert HiveRegistry__NotMember();

        MemoryCommit memory commit = MemoryCommit({
            hiveId: hiveId,
            memoryKey: memoryKey,
            storagePointer: storagePointer,
            contentHash: contentHash,
            writer: msg.sender,
            timestamp: block.timestamp,
            keyVersion: keyVersion,
            metadataURI: metadataURI
        });

        _latestMemory[hiveId][memoryKey] = commit;
        _memoryHistory[hiveId][memoryKey].push(commit);

        emit MemoryCommitted(
            hiveId, memoryKey, msg.sender, storagePointer, contentHash, block.timestamp, keyVersion, metadataURI
        );
    }

    function latestMemory(uint256 hiveId, bytes32 memoryKey) external view returns (MemoryCommit memory) {
        _requireHive(hiveId);
        return _latestMemory[hiveId][memoryKey];
    }

    function memoryHistoryLength(uint256 hiveId, bytes32 memoryKey) external view returns (uint256) {
        _requireHive(hiveId);
        return _memoryHistory[hiveId][memoryKey].length;
    }

    function memoryHistoryAt(uint256 hiveId, bytes32 memoryKey, uint256 index)
        external
        view
        returns (MemoryCommit memory)
    {
        _requireHive(hiveId);
        return _memoryHistory[hiveId][memoryKey][index];
    }

    function memberHives(address who) external view returns (uint256[] memory) {
        return _memberHives[who];
    }

    function hiveMemberCount(uint256 hiveId) external view returns (uint256) {
        _requireHive(hiveId);
        return _hiveMemberList[hiveId].length;
    }

    function hiveMemberAt(uint256 hiveId, uint256 index) external view returns (address) {
        _requireHive(hiveId);
        return _hiveMemberList[hiveId][index];
    }

    function _requireHive(uint256 hiveId) internal view {
        if (hiveId == 0 || hiveId > nextHiveId || !hives[hiveId].exists) {
            revert HiveRegistry__InvalidHive();
        }
    }

    function _addMember(uint256 hiveId, address account) internal {
        members[hiveId][account] = true;
        _hiveMemberList[hiveId].push(account);
        _hiveMemberIndex[hiveId][account] = _hiveMemberList[hiveId].length;
    }

    function _removeMember(uint256 hiveId, address account) internal {
        members[hiveId][account] = false;
        address[] storage list = _hiveMemberList[hiveId];
        uint256 idx = _hiveMemberIndex[hiveId][account];
        if (idx == 0) return;
        uint256 i = idx - 1;
        uint256 last = list.length - 1;
        if (i != last) {
            address moved = list[last];
            list[i] = moved;
            _hiveMemberIndex[hiveId][moved] = i + 1;
        }
        list.pop();
        delete _hiveMemberIndex[hiveId][account];
    }

    function _pushMemberHive(address account, uint256 hiveId) internal {
        uint256[] storage arr = _memberHives[account];
        arr.push(hiveId);
        _memberHivePos[account][hiveId] = arr.length;
    }

    function _popMemberHive(address account, uint256 hiveId) internal {
        uint256[] storage arr = _memberHives[account];
        uint256 idx = _memberHivePos[account][hiveId];
        if (idx == 0) return;
        uint256 i = idx - 1;
        uint256 last = arr.length - 1;
        if (i != last) {
            uint256 moved = arr[last];
            arr[i] = moved;
            _memberHivePos[account][moved] = i + 1;
        }
        arr.pop();
        delete _memberHivePos[account][hiveId];
    }
}
