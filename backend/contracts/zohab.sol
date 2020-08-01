pragma solidity ^0.5.6;

import "./KIP17.sol";

contract zohabToken is KIP17 {
    
    // 구매기록 저장
    struct purchaseRecord {
        address userAddress; // 유저 지갑주소
        string marketPlace; // 구매 장소
        uint24 count; // 구매 잔 수
    }
    
    // 토큰들 저장
    struct _roundOneFreeToken {
        address account;
    }
    
    struct _roundOnePlusToken {
        address account;
    }
    
    struct _roundTwoFreeToken {
        address account;
    }
    
    struct _roundTwoPlusToken {
        address account;
    }
    
    purchaseRecord[] public record;
    _roundOneFreeToken[] public roundOneFreeList;
    _roundOnePlusToken[] public roundOnePlusList;
    _roundTwoFreeToken[] public roundTwoFreeList;
    _roundTwoPlusToken[] public roundTwoPlusList;
    address public owner;
    
    constructor () public {
        owner = msg.sender; // Token 발행 가능한 컨트랙트 소유자
    }
    
    function updateRecord(address _userAddress, string memory place, uint24 count) public {
        record.push(purchaseRecord(_userAddress, place, count));
    }
    
    function mintRoundOneFreeToken(address account) public {
        require(owner == msg.sender);
        uint256 tokenId = roundOneFreeList.length;
        roundOneFreeList.push(_roundOneFreeToken(account));
        _mint(account, tokenId);
    }
    
    function mintRoundOnePlusToken(address account) public {
        require(owner == msg.sender);
        uint256 tokenId = roundOnePlusList.length;
        roundOnePlusList.push(_roundOnePlusToken(account));
        _mint(account, tokenId);
    }
    
    function mintRoundTwoFreeToken(address account) public {
        require(owner == msg.sender);
        uint256 tokenId = roundTwoFreeList.length;
        roundTwoFreeList.push(_roundTwoFreeToken(account));
        _mint(account, tokenId);
    }
    
    function mintRoundTwoPlusToken(address account) public {
        require(owner == msg.sender);
        uint256 tokenId = roundTwoPlusList.length;
        roundTwoPlusList.push(_roundTwoPlusToken(account));
        _mint(account, tokenId);
    }
}