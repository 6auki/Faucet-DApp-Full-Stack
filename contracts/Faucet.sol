// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Faucet is ReentrancyGuard {
    // Errors
    error CooldownActive(uint lastAccess, uint nowTime);
    error LimitExceeded(uint attempted, uint limit);
    error InsufficientFunds(uint requested, uint available);
    error ZeroAddress();

    // State variables
    string public description;
    uint public maxBalance = 10 ether;
    address public owner;
    uint public coolDown = 5 minutes;
    uint public perTransactionLimit = 0.05 ether;
    uint public dailyLimit = 0.1 ether;
    bool public paused;
    uint public totalTipReceived;

    uint public withdrawalCount;
    uint public constant WITHDRAWAL_CAP = 100;
    Withdrawal[WITHDRAWAL_CAP] public recentWithdrawals;
    uint public withdrawalIndex;

    struct UserData {
        uint lastRequest;
        uint lastWithdrawnDay;
        uint dailyWithdrawn;
    }

    struct Withdrawal {
        address user;
        uint amount;
        uint timestamp;
    }
    
    mapping(address => UserData) public users;
    mapping(address => bool) public blacklisted;
    mapping(address => uint) public refundsOwed;

    // Events
    event Received(address account, uint amount);
    event Withdraw(address indexed user, uint amount, uint totalWithdrawn);
    event AllWithdrawn(address sender, string text);
    event CoolDownChanged(uint initial, uint changedTo);
    event WithdrawLimitChanged(uint initial, uint changedTo);
    event DailyLimitChanged(uint initial, uint changedTo);
    event Paused(address account);
    event Unpaused(address account);
    event TipReceived(address indexed from, uint amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event BlacklistAdded(address indexed account);
    event BlacklistRemoved(address indexed account);
    event ERC20Withdrawn(address indexed token, uint amount);
    event RefundOwed(address indexed from, uint amount);
    event RefundWithdrawn(address indexed user, uint amount);
    event RefundPaid(address indexed user, uint amount);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not Owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused for now!");
        _;
    }

    modifier whenPaused() {
        require(paused, "Contract is not paused");
        _;
    }

    modifier checkDailyLimit(address account, uint amount) {
        uint today = block.timestamp / 1 days;

        // Reset daily counter if it's a new day
        if (users[account].lastWithdrawnDay != today) {
            users[account].dailyWithdrawn = 0;
            users[account].lastWithdrawnDay = today;
        }

        // Check if this withdrawal would exceed daily limit
        uint newDailyTotal = users[account].dailyWithdrawn + amount;
        require(newDailyTotal <= dailyLimit, "Daily limit exceeded!");
        _;
        
        // Update daily withdrawn amount after successful withdrawal
        users[account].dailyWithdrawn = newDailyTotal;
    }

    modifier notBlacklisted() {
        require(!blacklisted[msg.sender], "This address is blacklisted");
        _;
    }

    // Constructor
    constructor() {
        owner = msg.sender;
    }

    // Owner-only functions
    function setDescription(string calldata _description) external onlyOwner {
        description = _description;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        if (_newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }

    function setMaxBalance(uint _newMaxBalance) external onlyOwner {
        maxBalance = _newMaxBalance;
    }

    function setPerTransactionLimit(uint _newAmount) external onlyOwner {
        emit WithdrawLimitChanged(perTransactionLimit, _newAmount);
        perTransactionLimit = _newAmount;
    }

    function setDailyLimit(uint _newAmount) external onlyOwner {
        emit DailyLimitChanged(dailyLimit, _newAmount);
        dailyLimit = _newAmount;
    }

    function setCoolDown(uint _newCoolDown) external onlyOwner {
        emit CoolDownChanged(coolDown, _newCoolDown);
        coolDown = _newCoolDown;
    }

    function pause() external onlyOwner {
        require(!paused, "Contract is already paused!");
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        require(paused, "Contract is not paused yet, can't unpause");
        paused = false;
        emit Unpaused(msg.sender);
    }

    function addToBlackList(address account) external onlyOwner {
        if (account == address(0)) revert ZeroAddress();
        blacklisted[account] = true;
        emit BlacklistAdded(account);
    }

    function removeFromBlackList(address account) external onlyOwner {
        if (account == address(0)) revert ZeroAddress();
        blacklisted[account] = false;
        emit BlacklistRemoved(account);
    }

    function recoverERC20(address tokenAddress, uint256 tokenAmount) external onlyOwner {
        bool success = IERC20(tokenAddress).transfer(owner, tokenAmount);
        require(success, "Token transfer failed");
        emit ERC20Withdrawn(tokenAddress, tokenAmount);
    }

    function emergencyWithdrawAll() external onlyOwner whenPaused {
        payable(owner).transfer(address(this).balance);
    }

    function withdrawAll() external onlyOwner whenNotPaused {
        payable(owner).transfer(address(this).balance);
        emit AllWithdrawn(owner, "Owner took all the money.");
    }

    // User functions
    function withdraw(uint amount) external whenNotPaused nonReentrant checkDailyLimit(msg.sender, amount) notBlacklisted {
        uint timestamp = block.timestamp;

        require(amount > 0, "Amount must be greater than zero");
        require(amount <= perTransactionLimit, "Exceeds max allowed amount per transaction");
        
        if (address(this).balance < amount) {
            revert InsufficientFunds(amount, address(this).balance);
        }
        if (timestamp < users[msg.sender].lastRequest + coolDown) {
            revert CooldownActive(users[msg.sender].lastRequest, timestamp);
        }

        users[msg.sender].lastRequest = timestamp;

        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Failed to send ETH");

        recentWithdrawals[withdrawalIndex] = Withdrawal({
            user: msg.sender,
            amount: amount,
            timestamp: timestamp
        });

        withdrawalIndex = (withdrawalIndex + 1) % WITHDRAWAL_CAP;
        withdrawalCount = withdrawalCount < WITHDRAWAL_CAP ? withdrawalCount + 1 : WITHDRAWAL_CAP;

        emit Withdraw(msg.sender, amount, users[msg.sender].dailyWithdrawn);
    }

    function getRecentWithdrawals() external view returns (Withdrawal[] memory) {
        uint count = withdrawalCount;
        Withdrawal[] memory recent = new Withdrawal[](count);
        
        if (count == 0) {
            return recent;
        }
        
        uint startIndex = 0;
        if (count == WITHDRAWAL_CAP) {
            startIndex = withdrawalIndex;
        }

        for (uint i = 0; i < count; i++) {
            uint arrayIndex = (startIndex + i) % WITHDRAWAL_CAP;
            recent[i] = recentWithdrawals[arrayIndex];
        }

        return recent;
    }

    function tip() external payable notBlacklisted nonReentrant whenNotPaused {
        require(msg.value > 0, "Tip must be greater than zero");

        // Calculate balance before this transaction (subtract the incoming value)
        uint balanceBeforeTip = address(this).balance - msg.value;
        
        // If already at max, reject entirely
        require(balanceBeforeTip < maxBalance, "Faucet already at maximum capacity");

        uint spaceAvailable = maxBalance - balanceBeforeTip;
        uint acceptedAmount = msg.value;
        uint refundAmount = 0;

        // If tip exceeds available space, calculate refund
        if (msg.value > spaceAvailable) {
            acceptedAmount = spaceAvailable;
            refundAmount = msg.value - spaceAvailable;
            
            // Store refund for later withdrawal
            refundsOwed[msg.sender] += refundAmount;
            emit RefundOwed(msg.sender, refundAmount);
        }

        // Update total tips received (only count accepted amount)
        totalTipReceived += acceptedAmount;
        emit TipReceived(msg.sender, acceptedAmount);
        
        // Send refund back immediately if there is one
        if (refundAmount > 0) {
            (bool refundSent, ) = msg.sender.call{value: refundAmount}("");
            if (!refundSent) {
                // If immediate refund fails, it's already stored in refundsOwed
                // The RefundOwed event was already emitted above
            } else {
                // If immediate refund succeeds, clear the stored refund and emit different event
                refundsOwed[msg.sender] -= refundAmount;
                emit RefundPaid(msg.sender, refundAmount);
            }
        }
    }

    function withdrawRefund() external nonReentrant notBlacklisted {
        uint amount = refundsOwed[msg.sender];
        require(amount > 0, "No refund to withdraw");

        refundsOwed[msg.sender] = 0;

        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Refund withdrawal failed");

        emit RefundWithdrawn(msg.sender, amount);
    }

    // View functions
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function getUserStats(address user) external view returns (
        uint lastRequest,
        uint dailyWithdrawn,
        uint lastWithdrawnDay
    ) {
        return (
            users[user].lastRequest,
            users[user].dailyWithdrawn,
            users[user].lastWithdrawnDay
        );
    }

    function getRemainingDailyLimit(address user) external view returns (uint) {
        uint today = block.timestamp / 1 days;
        
        if (users[user].lastWithdrawnDay != today) {
            return dailyLimit; // Full limit available for new day
        }
        
        if (users[user].dailyWithdrawn >= dailyLimit) {
            return 0;
        }
        
        return dailyLimit - users[user].dailyWithdrawn;
    }

    // Receive/Fallback functions
    receive() external payable {
        require(address(this).balance <= maxBalance, "Faucet balance limit reached");
        emit Received(msg.sender, msg.value);
    }

    fallback() external payable {
        revert("Direct call with data not allowed!");
    }
}