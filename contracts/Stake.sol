/**
  * stake users levs
  * get fee from trading contract
  * get eth from trading contract
  * calculate fee tokens to be generated
  * distribute fee tokens and lev to users in chunks.
  * re-purpose it for next trading duration.
  * what happens to extra fee if not enough trading happened? destroy it.
  * Stake will have full control over FEE.sol
  */

pragma solidity ^0.4.11;


import "tokens/Token.sol";


import "./SafeMath.sol";
import "./Fee.sol";


contract Stake {

    event StakeEvent(address indexed _user, uint256 _levs, string action);
    /* user address to (lev tokens)*(blocks left to expiry) */
    mapping (address => uint256) public levBlocks;
    /*user address to lev tokens at stake*/
    mapping (address => uint256) public stakes;

    //todo: total lev tokens. This may not be required. revisit
    uint256 public totalLevs;

    /*total lev blocks. this will be help not to iterate through full mapping*/
    uint256 public totalLevBlocks;

    /*wei for each Fee token*/
    uint256 public weiPerFee;
    /* total fee to be distributed */
    uint256 public feeForThePeriod;

    /*Lev token reference*/
    address public tokenid;

    Token public token;

    uint public startBlock;

    uint public expiryBlock;

    /*owner address for admin functions*/
    address public owner;

    address public wallet;

    /* fee token reference*/
    address public feeTokenId;

    Fee public fee;

    /* wei owned by contarct */
    uint256 public weiAsFee;

    bool public feeCalculated = false;

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    modifier started{
        require(block.number >= startBlock);
        _;
    }

    modifier notExpired{
        require(block.number < expiryBlock);
        _;
    }

    modifier hasExpired{
        require(block.number >= expiryBlock);
        _;
    }

    function getLevBlocks(address _for) constant returns (uint256 levBlock){
        return levBlocks[_for];
    }

    function getStakes(address _for) constant returns (uint256 stake){
        return stakes[_for];
    }

    function Stake(address _owner, address _wallet, uint256 _weiPerFee, address _tokenid, uint _expiryBlock){
        require(_weiPerFee > 0);
        tokenid = _tokenid;
        expiryBlock = _expiryBlock;
        owner = _owner;
        wallet = _wallet;
        token = Token(_tokenid);
        weiPerFee = _weiPerFee;
    }

    function setToken(address _tokenid) onlyOwner {
        tokenid = _tokenid;
        token = Token(_tokenid);
    }

    function setFeeToken(address _feeTokenId) onlyOwner {
        feeTokenId = _feeTokenId;
        fee = Fee(_feeTokenId);
    }

    function setWallet(address _wallet) onlyOwner returns (bool result){
        wallet = _wallet;
        return true;
    }

    function setBlocks(uint _start, uint _expiry) onlyOwner {
        require(_expiry > _start);
        startBlock = _start;
        expiryBlock = _expiry;
    }


    /**
      * staking function for user.
      * User has to approve staking contract on token before calling this function.
      * refer to tests.
      */
    function stakeTokens(uint256 _quantity) started notExpired returns (bool result){
        require(token.balanceOf(msg.sender) >= _quantity);
        levBlocks[msg.sender] = SafeMath.add(levBlocks[msg.sender], SafeMath.mul(_quantity , SafeMath.sub(expiryBlock , block.number)));
        stakes[msg.sender] = SafeMath.add(stakes[msg.sender],_quantity);
        totalLevBlocks = SafeMath.add(totalLevBlocks, SafeMath.mul(_quantity, SafeMath.sub(expiryBlock ,block.number)));
        totalLevs = SafeMath.add(totalLevs,_quantity);
        token.transferFrom(msg.sender, this, _quantity);
        StakeEvent(msg.sender, _quantity, "STAKED");
        return true;
    }

    function() payable {
        weiAsFee += msg.value;
    }

    function updateFeeForCurrentPeriod() onlyOwner hasExpired returns (bool result){
        require(feeCalculated == false);
        uint256 feeFromExchange = fee.balanceOf(this);
        feeForThePeriod = SafeMath.add(feeFromExchange, SafeMath.div(this.balance , weiPerFee));
        feeCalculated = true;
        fee.burnTokens(feeFromExchange);
        wallet.transfer(this.balance);
        weiAsFee = 0;
        return true;
    }

    function redeemLevAndFee(address _user) hasExpired returns (bool result){
        require(msg.sender == _user || msg.sender == owner);
        require(feeCalculated);
        uint256 levBlock = levBlocks[_user];
        uint256 stake = stakes[_user];
        require(stake > 0);
        uint256 feeEarned = SafeMath.div(SafeMath.mul(levBlock, feeForThePeriod) , totalLevBlocks);
        delete stakes[_user];
        delete levBlocks[_user];
        if (feeEarned > 0) fee.sendTokens(_user, feeEarned);
        totalLevs = SafeMath.sub(totalLevs, stake);
        token.transfer(_user, stake);
        StakeEvent(_user, stake, "CLAIMED");
        return true;
    }

    function startNewTradingPeriod(uint _start, uint _expiry) onlyOwner returns (bool result){
        require(totalLevs == 0);
        startBlock = _start;
        expiryBlock = _expiry;
        totalLevBlocks = 0;
        feeForThePeriod = 0;
        weiAsFee = 0;
        feeCalculated = false;
        return true;
    }
}