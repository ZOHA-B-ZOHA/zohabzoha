pragma solidity ^0.5.6;

import "./KIP17.sol";

contract zohabToken is KIP17 {
    
    struct _token {
        uint256 phoneNumber;
    }
    
    _token[] public incentiveList;
    address public owner;
    
    constructor () public {
        owner = msg.sender;
    }
    
    function mintToken(uint256 _phoneNumber, address account) public {
        require(owner == msg.sender);
        uint256 tokenId = incentiveList.length;
        incentiveList.push(_token(_phoneNumber));
        _mint(account, tokenId);
    }
}