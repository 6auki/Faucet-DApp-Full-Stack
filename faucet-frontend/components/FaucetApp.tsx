'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { formatEther, parseEther, Address } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CONTRACT_ADDRESSES, FAUCET_ABI } from '@/lib/wagmi';

export function FaucetApp() {
  const { address, chain, isConnected } = useAccount();
  const [withdrawAmount, setWithdrawAmount] = useState('0.01');
  const [tipAmount, setTipAmount] = useState('0.1');
  const [cooldownTime, setCooldownTime] = useState(0);

  const contractAddress = chain?.id ? CONTRACT_ADDRESSES[chain.id as keyof typeof CONTRACT_ADDRESSES] : undefined;

  // Check if current user is owner
  const { data: owner } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'owner',
  });

  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase();

  // Contract reads
  const { data: balance } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'getBalance',
  });

  const { data: description } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'description',
  });

  const { data: perTransactionLimit } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'perTransactionLimit',
  });

  const { data: dailyLimit } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'dailyLimit',
  });

  const { data: coolDown } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'coolDown',
  });

  const { data: userStats } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'getUserStats',
    args: address ? [address] : undefined,
  });

  const { data: remainingDailyLimit } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'getRemainingDailyLimit',
    args: address ? [address] : undefined,
  });

  const { data: userBalance } = useBalance({
    address: address,
  });

  const { data: totalTips } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'totalTipReceived',
  });

  // Contract writes
  const { 
    data: withdrawHash, 
    isPending: isWithdrawPending, 
    writeContract: withdraw,
    error: withdrawError 
  } = useWriteContract();

  const { 
    data: tipHash, 
    isPending: isTipPending, 
    writeContract: tip,
    error: tipError 
  } = useWriteContract();

  const { isLoading: isWithdrawConfirming } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  const { isLoading: isTipConfirming } = useWaitForTransactionReceipt({
    hash: tipHash,
  });

  // Cooldown timer
  useEffect(() => {
    if (userStats && coolDown) {
      const [lastRequest] = userStats;
      const cooldownEnd = Number(lastRequest) + Number(coolDown);
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, cooldownEnd - now);
      setCooldownTime(remaining);

      if (remaining > 0) {
        const timer = setInterval(() => {
          const newRemaining = Math.max(0, cooldownEnd - Math.floor(Date.now() / 1000));
          setCooldownTime(newRemaining);
          if (newRemaining === 0) {
            clearInterval(timer);
          }
        }, 1000);

        return () => clearInterval(timer);
      }
    }
  }, [userStats, coolDown]);

  const handleWithdraw = () => {
    if (!contractAddress) return;
    
    withdraw({
      address: contractAddress as Address,
      abi: FAUCET_ABI,
      functionName: 'withdraw',
      args: [parseEther(withdrawAmount)],
    });
  };

  const handleTip = () => {
    if (!contractAddress) return;
    
    tip({
      address: contractAddress as Address,
      abi: FAUCET_ABI,
      functionName: 'tip',
      value: parseEther(tipAmount),
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show connection prompt if not connected
  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center space-y-8">
          {/* Hero Section */}
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                <span className="text-white text-4xl">⛽</span>
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ETH Faucet
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Get free test ETH for development on Ethereum networks. Connect your wallet to get started!
            </p>
          </div>

          {/* Connection Card */}
          <div className="max-w-md mx-auto bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white border-opacity-20">
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h3>
                <p className="text-gray-600 mb-6">
                  Connect your wallet to start receiving test ETH
                </p>
              </div>
              
              <div className="flex justify-center">
                <ConnectButton />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 text-center">
                  Make sure you are connected to <span className="font-semibold">Localhost 8545</span> network
                </p>
              </div>
            </div>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Free Test ETH</h4>
              <p className="text-sm text-gray-600">Get up to 0.05 ETH per transaction for testing</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Instant Transfer</h4>
              <p className="text-sm text-gray-600">Receive ETH instantly with smart rate limiting</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Secure & Fair</h4>
              <p className="text-sm text-gray-600">Protected by cooldowns and daily limits</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show unsupported network if contract not available
  if (!contractAddress) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-3">Network Not Supported</h2>
          <p className="text-red-700 mb-6 text-lg">
            Please switch to <span className="font-semibold">Localhost 8545</span> network to use the faucet
          </p>
          <div className="bg-white bg-opacity-80 rounded-lg p-4 text-left max-w-md mx-auto">
            <h4 className="font-semibold text-gray-900 mb-2">Add Localhost Network:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Network Name: <code>Localhost 8545</code></li>
              <li>• RPC URL: <code>http://127.0.0.1:8545</code></li>
              <li>• Chain ID: <code>31337</code></li>
              <li>• Currency: <code>ETH</code></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header with better spacing */}
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
            <span className="text-white text-3xl">⛽</span>
          </div>
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          ETH Faucet
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          {description || 'Get free test ETH for development on Ethereum networks'}
        </p>
        
        {/* Owner Badge */}
        {isOwner && (
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-full shadow-lg">
            <span className="mr-2">👑</span>
            <span className="font-bold">Contract Owner</span>
          </div>
        )}
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="text-3xl">💰</div>
            <div className="text-right">
              <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">Faucet Balance</p>
              <p className="text-2xl font-bold text-blue-900">
                {balance ? `${Number(formatEther(balance)).toFixed(3)} ETH` : '0 ETH'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="text-3xl">⚡</div>
            <div className="text-right">
              <p className="text-sm font-medium text-purple-600 uppercase tracking-wide">Per Transaction</p>
              <p className="text-2xl font-bold text-purple-900">
                {perTransactionLimit ? `${formatEther(perTransactionLimit)} ETH` : '0 ETH'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="text-3xl">📅</div>
            <div className="text-right">
              <p className="text-sm font-medium text-green-600 uppercase tracking-wide">Daily Limit</p>
              <p className="text-2xl font-bold text-green-900">
                {dailyLimit ? `${formatEther(dailyLimit)} ETH` : '0 ETH'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="text-3xl">💝</div>
            <div className="text-right">
              <p className="text-sm font-medium text-orange-600 uppercase tracking-wide">Total Tips</p>
              <p className="text-2xl font-bold text-orange-900">
                {totalTips ? `${Number(formatEther(totalTips)).toFixed(3)} ETH` : '0 ETH'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Stats - Enhanced */}
      {address && (
        <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-20 shadow-xl">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">👤</span>
            Your Account Stats
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl">
              <p className="text-sm font-medium text-indigo-600 uppercase tracking-wide mb-2">Your Balance</p>
              <p className="text-2xl font-bold text-indigo-900">
                {userBalance ? `${Number(formatEther(userBalance.value)).toFixed(4)} ETH` : '0 ETH'}
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-xl">
              <p className="text-sm font-medium text-cyan-600 uppercase tracking-wide mb-2">Daily Used</p>
              <p className="text-2xl font-bold text-cyan-900">
                {userStats ? `${formatEther(userStats[1])} ETH` : '0 ETH'}
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl">
              <p className="text-sm font-medium text-teal-600 uppercase tracking-wide mb-2">Remaining Today</p>
              <p className="text-2xl font-bold text-teal-900">
                {remainingDailyLimit ? `${formatEther(remainingDailyLimit)} ETH` : '0 ETH'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Action Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Withdraw Section */}
        <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-20 shadow-xl">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">💸</span>
            Withdraw ETH
          </h3>
          
          {cooldownTime > 0 && (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <span className="text-2xl mr-3">⏰</span>
                <div>
                  <p className="font-semibold text-yellow-800">Cooldown Active</p>
                  <p className="text-yellow-700">Please wait {formatTime(cooldownTime)} before next withdrawal</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Amount (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                max={perTransactionLimit ? formatEther(perTransactionLimit) : "0.05"}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold transition-all duration-200"
                placeholder="0.01"
              />
              <p className="text-sm text-gray-500 mt-2 flex items-center">
                <span className="mr-2">ℹ️</span>
                Maximum: {perTransactionLimit ? formatEther(perTransactionLimit) : '0.05'} ETH per transaction
              </p>
            </div>

            <button
              onClick={handleWithdraw}
              disabled={isWithdrawPending || isWithdrawConfirming || cooldownTime > 0 || !withdrawAmount}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed text-lg shadow-lg"
            >
              {isWithdrawPending || isWithdrawConfirming ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isWithdrawPending ? 'Confirming Transaction...' : 'Processing...'}
                </span>
              ) : cooldownTime > 0 ? (
                `⏰ Cooldown: ${formatTime(cooldownTime)}`
              ) : (
                '💸 Withdraw ETH'
              )}
            </button>

            {withdrawError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-800 font-medium flex items-center">
                  <span className="mr-2">⚠️</span>
                  {withdrawError.message}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tip Section */}
        <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-20 shadow-xl">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">💝</span>
            Support the Faucet
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Help keep this faucet running! Your tips help fund more test ETH for the developer community.
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Tip Amount (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-semibold transition-all duration-200"
                placeholder="0.1"
              />
            </div>

            <button
              onClick={handleTip}
              disabled={isTipPending || isTipConfirming || !tipAmount}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed text-lg shadow-lg"
            >
              {isTipPending || isTipConfirming ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isTipPending ? 'Confirming Tip...' : 'Processing...'}
                </span>
              ) : (
                '💝 Send Tip'
              )}
            </button>

            {tipError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-800 font-medium flex items-center">
                  <span className="mr-2">⚠️</span>
                  {tipError.message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Network Info */}
      <div className="text-center bg-gray-100 rounded-xl p-4">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Network:</span> {chain?.name} (Chain ID: {chain?.id}) • 
          <span className="font-semibold ml-2">Contract:</span> <code className="bg-gray-200 px-2 py-1 rounded text-xs">{contractAddress}</code>
        </p>
      </div>
    </div>
  );
}