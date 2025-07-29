'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther, Address } from 'viem';
import { CONTRACT_ADDRESSES, FAUCET_ABI } from '@/lib/wagmi';

export function AdminPanel() {
  const { address, chain } = useAccount();
  const [newDescription, setNewDescription] = useState('');
  const [newMaxBalance, setNewMaxBalance] = useState('');
  const [newPerTxLimit, setNewPerTxLimit] = useState('');
  const [newDailyLimit, setNewDailyLimit] = useState('');
  const [newCooldown, setNewCooldown] = useState('');
  const [blacklistAddress, setBlacklistAddress] = useState('');
  
  const contractAddress = chain?.id ? CONTRACT_ADDRESSES[chain.id as keyof typeof CONTRACT_ADDRESSES] : undefined;

  // Check if current user is owner
  const { data: owner } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'owner',
  });

  const { data: paused } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'paused',
  });

  const { data: maxBalance } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'maxBalance',
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

  const { data: description } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'description',
  });

  // Contract writes for admin functions
  const { writeContract: setDescriptionWrite, isPending: isSetDescPending } = useWriteContract();
  const { writeContract: setMaxBalanceWrite, isPending: isSetMaxBalPending } = useWriteContract();
  const { writeContract: setPerTxLimitWrite, isPending: isSetPerTxPending } = useWriteContract();
  const { writeContract: setDailyLimitWrite, isPending: isSetDailyPending } = useWriteContract();
  const { writeContract: setCooldownWrite, isPending: isSetCooldownPending } = useWriteContract();
  const { writeContract: pauseWrite, isPending: isPausePending } = useWriteContract();
  const { writeContract: unpauseWrite, isPending: isUnpausePending } = useWriteContract();
  const { writeContract: addBlacklistWrite, isPending: isAddBlacklistPending } = useWriteContract();
  const { writeContract: removeBlacklistWrite, isPending: isRemoveBlacklistPending } = useWriteContract();
  const { writeContract: withdrawAllWrite, isPending: isWithdrawAllPending } = useWriteContract();
  const { writeContract: emergencyWithdrawWrite, isPending: isEmergencyPending } = useWriteContract();

  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase();

  if (!isOwner) {
    return null; // Don't show admin panel to non-owners
  }

  const handleSetDescription = () => {
    if (!contractAddress || !newDescription) return;
    setDescriptionWrite({
      address: contractAddress as Address,
      abi: FAUCET_ABI,
      functionName: 'setDescription',
      args: [newDescription],
    });
  };

  const handleSetMaxBalance = () => {
    if (!contractAddress || !newMaxBalance) return;
    setMaxBalanceWrite({
      address: contractAddress as Address,
      abi: FAUCET_ABI,
      functionName: 'setMaxBalance',
      args: [parseEther(newMaxBalance)],
    });
  };

  const handleSetPerTxLimit = () => {
    if (!contractAddress || !newPerTxLimit) return;
    setPerTxLimitWrite({
      address: contractAddress as Address,
      abi: FAUCET_ABI,
      functionName: 'setPerTransactionLimit',
      args: [parseEther(newPerTxLimit)],
    });
  };

  const handleSetDailyLimit = () => {
    if (!contractAddress || !newDailyLimit) return;
    setDailyLimitWrite({
      address: contractAddress as Address,
      abi: FAUCET_ABI,
      functionName: 'setDailyLimit',
      args: [parseEther(newDailyLimit)],
    });
  };

  const handleSetCooldown = () => {
    if (!contractAddress || !newCooldown) return;
    setCooldownWrite({
      address: contractAddress as Address,
      abi: FAUCET_ABI,
      functionName: 'setCoolDown',
      args: [BigInt(Number(newCooldown) * 60)], // Convert minutes to seconds
    });
  };

  const handlePause = () => {
    if (!contractAddress) return;
    pauseWrite({
      address: contractAddress as Address,
      abi: FAUCET_ABI,
      functionName: 'pause',
    });
  };

  const handleUnpause = () => {
    if (!contractAddress) return;
    unpauseWrite({
      address: contractAddress as Address,
      abi: FAUCET_ABI,
      functionName: 'unpause',
    });
  };

  const handleAddBlacklist = () => {
    if (!contractAddress || !blacklistAddress) return;
    addBlacklistWrite({
      address: contractAddress as Address,
      abi: FAUCET_ABI,
      functionName: 'addToBlackList',
      args: [blacklistAddress as Address],
    });
  };

  const handleRemoveBlacklist = () => {
    if (!contractAddress || !blacklistAddress) return;
    removeBlacklistWrite({
      address: contractAddress as Address,
      abi: FAUCET_ABI,
      functionName: 'removeFromBlackList',
      args: [blacklistAddress as Address],
    });
  };

  const handleWithdrawAll = () => {
    if (!contractAddress) return;
    withdrawAllWrite({
      address: contractAddress as Address,
      abi: FAUCET_ABI,
      functionName: 'withdrawAll',
    });
  };

  const handleEmergencyWithdraw = () => {
    if (!contractAddress) return;
    emergencyWithdrawWrite({
      address: contractAddress as Address,
      abi: FAUCET_ABI,
      functionName: 'emergencyWithdrawAll',
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-orange-200 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">👑</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-orange-900">Owner Panel</h2>
              <p className="text-orange-700">Administrative controls for the faucet</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-orange-600 font-medium">Status</p>
            <p className={`text-lg font-bold ${paused ? 'text-red-600' : 'text-green-600'}`}>
              {paused ? '⏸️ Paused' : '▶️ Active'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contract Settings */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-2">⚙️</span>
            Contract Settings
          </h3>

          <div className="space-y-6">
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Faucet Description
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder={description || "Current description"}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSetDescription}
                  disabled={isSetDescPending || !newDescription}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {isSetDescPending ? '...' : 'Update'}
                </button>
              </div>
            </div>

            {/* Max Balance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Balance (ETH)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="0.1"
                  value={newMaxBalance}
                  onChange={(e) => setNewMaxBalance(e.target.value)}
                  placeholder={maxBalance ? formatEther(maxBalance) : "10"}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSetMaxBalance}
                  disabled={isSetMaxBalPending || !newMaxBalance}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {isSetMaxBalPending ? '...' : 'Set'}
                </button>
              </div>
            </div>

            {/* Per Transaction Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Per Transaction Limit (ETH)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="0.001"
                  value={newPerTxLimit}
                  onChange={(e) => setNewPerTxLimit(e.target.value)}
                  placeholder={perTransactionLimit ? formatEther(perTransactionLimit) : "0.05"}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSetPerTxLimit}
                  disabled={isSetPerTxPending || !newPerTxLimit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {isSetPerTxPending ? '...' : 'Set'}
                </button>
              </div>
            </div>

            {/* Daily Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Limit (ETH)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="0.001"
                  value={newDailyLimit}
                  onChange={(e) => setNewDailyLimit(e.target.value)}
                  placeholder={dailyLimit ? formatEther(dailyLimit) : "0.1"}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSetDailyLimit}
                  disabled={isSetDailyPending || !newDailyLimit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {isSetDailyPending ? '...' : 'Set'}
                </button>
              </div>
            </div>

            {/* Cooldown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cooldown (minutes)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={newCooldown}
                  onChange={(e) => setNewCooldown(e.target.value)}
                  placeholder={coolDown ? String(Number(coolDown) / 60) : "5"}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSetCooldown}
                  disabled={isSetCooldownPending || !newCooldown}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {isSetCooldownPending ? '...' : 'Set'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Controls */}
        <div className="space-y-6">
          {/* Pause/Unpause */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">⏯️</span>
              Contract Control
            </h3>
            <div className="flex space-x-4">
              <button
                onClick={handlePause}
                disabled={isPausePending || paused}
                className="flex-1 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 transition-colors font-semibold"
              >
                {isPausePending ? 'Pausing...' : paused ? 'Already Paused' : '⏸️ Pause Contract'}
              </button>
              <button
                onClick={handleUnpause}
                disabled={isUnpausePending || !paused}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-semibold"
              >
                {isUnpausePending ? 'Unpausing...' : !paused ? 'Already Active' : '▶️ Unpause Contract'}
              </button>
            </div>
          </div>

          {/* Blacklist Management */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🚫</span>
              Blacklist Management
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={blacklistAddress}
                onChange={(e) => setBlacklistAddress(e.target.value)}
                placeholder="0x... address to blacklist/whitelist"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleAddBlacklist}
                  disabled={isAddBlacklistPending || !blacklistAddress}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                >
                  {isAddBlacklistPending ? '...' : 'Add to Blacklist'}
                </button>
                <button
                  onClick={handleRemoveBlacklist}
                  disabled={isRemoveBlacklistPending || !blacklistAddress}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
                >
                  {isRemoveBlacklistPending ? '...' : 'Remove from Blacklist'}
                </button>
              </div>
            </div>
          </div>

          {/* Emergency Withdrawals */}
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center">
              <span className="mr-2">🚨</span>
              Emergency Controls
            </h3>
            <p className="text-red-700 text-sm mb-4">
              ⚠️ These actions will withdraw all funds from the contract
            </p>
            <div className="space-y-3">
              <button
                onClick={handleWithdrawAll}
                disabled={isWithdrawAllPending || paused}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors font-semibold"
              >
                {isWithdrawAllPending ? 'Withdrawing...' : '💸 Withdraw All (Normal)'}
              </button>
              <button
                onClick={handleEmergencyWithdraw}
                disabled={isEmergencyPending || !paused}
                className="w-full px-4 py-3 bg-red-800 text-white rounded-lg hover:bg-red-900 disabled:bg-gray-400 transition-colors font-semibold"
              >
                {isEmergencyPending ? 'Emergency Withdrawing...' : '🆘 Emergency Withdraw (Paused Only)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}