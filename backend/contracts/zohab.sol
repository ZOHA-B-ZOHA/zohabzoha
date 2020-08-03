pragma solidity ^0.5.6;

import "./KIP17.sol";

contract zohabToken is KIP17 {
    
    mapping (string => incentiveList) roundOnePlusTokenList;
    mapping (string => incentiveList) roundOneFreeTokenList;
    mapping (string => incentiveList) roundTwoPlusTokenList;
    mapping (string => incentiveList) roundTwoFreeTokenList;
    
    mapping (address => purchaseRecord) roundOneRecordList;
    mapping (address => purchaseRecord) roundTwoRecordList;
    
    event setRecordInList (address buyer, uint24 round, uint24 quantity);
    event setTokenList (address account, uint256 tokenId);
    
    // 구매기록 저장
    struct purchaseRecord {
        uint24 count; // 구매 잔 수
    }
    
    // 토큰들 저장
    struct incentiveList {
        address account;
        uint256 tokenId;
    }
    
    address public owner;
    
    constructor () public {
        owner = msg.sender; // Token 발행 가능한 컨트랙트 소유자
    }
    
    function updateRecord(address _userAddress, uint24 round, uint24 count) public {
        if (round == 1) {
            if (roundOneRecordList[_userAddress].count == 0) {
                roundOneRecordList[_userAddress].count = count;
            } else {
                roundOneRecordList[_userAddress].count += count;
            }
        } else if (round == 2) {
            if (roundTwoRecordList[_userAddress].count == 0) {
                roundTwoRecordList[_userAddress].count = count;
            } else {
                roundTwoRecordList[_userAddress].count += count;
            }
        }
        
        emit setRecordInList(_userAddress, round, count);
    }
    
    function mintToken(string memory phone, address account, uint256 tokenId, uint24 round, string memory couponType) public {
        require(owner == msg.sender);
        string memory plus = 'plus';
        string memory free = 'free';
        _mint(account, tokenId);
        
        if (round == 1) {
            if (keccak256(bytes(plus)) == keccak256(bytes(couponType))) {
                roundOnePlusTokenList[phone].account = account;
                roundOnePlusTokenList[phone].tokenId = tokenId;
            } else if (keccak256(bytes(free)) == keccak256(bytes(couponType))) {
                roundOneFreeTokenList[phone].account = account;
                roundOneFreeTokenList[phone].tokenId = tokenId;
            }
        } else if (round == 2) {
            if (keccak256(bytes(plus)) == keccak256(bytes(couponType))) {
                roundTwoPlusTokenList[phone].account = account;
                roundTwoPlusTokenList[phone].tokenId = tokenId;
            } else if (keccak256(bytes(free)) == keccak256(bytes(couponType))) {
                roundTwoFreeTokenList[phone].account = account;
                roundTwoFreeTokenList[phone].tokenId = tokenId;
            }
        }
        
        emit setTokenList(account, tokenId);
    }
    
    function gasRecords(address _userAddress, uint24 round) public view returns(uint24) {
        if (round == 1) {
            return (
                roundOneRecordList[_userAddress].count
            );
        } else if (round == 2) {
            return (
                roundTwoRecordList[_userAddress].count
            );
        }
    }
    
    function getTokenList(string memory phone, uint24 round) public view returns(uint256, uint256) {
        if (round == 1) {
            return (
                roundOneFreeTokenList[phone].tokenId,
                roundOnePlusTokenList[phone].tokenId
            );
        } else if (round == 2) {
            return (
                roundTwoFreeTokenList[phone].tokenId,
                roundTwoPlusTokenList[phone].tokenId
            );
        }
    }
}