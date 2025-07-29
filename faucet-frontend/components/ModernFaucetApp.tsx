'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { formatEther, parseEther, Address } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CONTRACT_ADDRESSES, FAUCET_ABI } from '@/lib/wagmi';
import { 
  Wallet, Droplets, Settings, TrendingUp, Clock, Shield, Zap, Gift, User, Copy, Check, 
  AlertCircle, Sparkles, Play, Pause, DollarSign, Ban, Download, AlertTriangle, Info,
  XCircle, CheckCircle, Loader
} from 'lucide-react';

// Add type definitions
interface ActivityItem {
  type: 'withdraw' | 'tip';
  amount: string;
  timestamp: number;
  status: 'completed' | 'pending' | 'failed';
  hash?: string;
  errorMessage?: string;
}

// Error message parser for better UX
const parseErrorMessage = (error: any): string => {
  const message = error?.message || error?.toString() || 'Unknown error';
  
  // Check for specific contract errors
  if (message.includes('LimitExceeded')) {
    return 'Amount exceeds the maximum allowed limit';
  }
  if (message.includes('CooldownActive')) {
    return 'Please wait for cooldown period to end';
  }
  if (message.includes('InsufficientFunds')) {
    return 'Faucet has insufficient funds for this request';
  }
  if (message.includes('Daily limit exceeded')) {
    return 'You have reached your daily withdrawal limit';
  }
  if (message.includes('Contract is paused')) {
    return 'Faucet is currently paused by the owner';
  }
  if (message.includes('blacklisted')) {
    return 'Your address is blacklisted';
  }
  if (message.includes('Amount must be greater than zero')) {
    return 'Amount must be greater than zero';
  }
  if (message.includes('Exceeds max allowed amount per transaction')) {
    return 'Amount exceeds per-transaction limit';
  }
  if (message.includes('Faucet balance limit reached')) {
    return 'Faucet is at maximum capacity - tip will be refunded';
  }
  if (message.includes('Not Owner')) {
    return 'Only the contract owner can perform this action';
  }
  if (message.includes('user rejected') || message.includes('User denied')) {
    return 'Transaction was rejected by user';
  }
  if (message.includes('insufficient funds')) {
    return 'Insufficient ETH balance for gas fees';
  }
  
  return 'Transaction failed. Please try again.';
};

const ModernFaucetApp = () => {
  const { address, chain, isConnected } = useAccount();
  const [withdrawAmount, setWithdrawAmount] = useState('0.05');
  const [tipAmount, setTipAmount] = useState('0.1');
  const [copied, setCopied] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  
  // Error states
  const [withdrawError, setWithdrawError] = useState<string>('');
  const [tipError, setTipError] = useState<string>('');
  const [adminError, setAdminError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Admin form states
  const [newPerTxLimit, setNewPerTxLimit] = useState('');
  const [newDailyLimit, setNewDailyLimit] = useState('');
  const [newCooldown, setNewCooldown] = useState('');
  const [blacklistAddress, setBlacklistAddress] = useState('');
  
  const [userActivity, setUserActivity] = useState<ActivityItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('faucet-activity');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (withdrawError) {
      const timer = setTimeout(() => setWithdrawError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [withdrawError]);

  useEffect(() => {
    if (tipError) {
      const timer = setTimeout(() => setTipError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [tipError]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (adminError) {
      const timer = setTimeout(() => setAdminError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [adminError]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('faucet-activity', JSON.stringify(userActivity));
      } catch (error) {
        console.warn('Could not save activity:', error);
      }
    }
  }, [userActivity]);

  const contractAddress = chain?.id ? CONTRACT_ADDRESSES[chain.id as keyof typeof CONTRACT_ADDRESSES] : undefined;
  const queryClient = useQueryClient();

  // Contract reads
  const { data: owner } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'owner',
  });

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'getBalance',
    query: {
      refetchInterval: 3000,
    }
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

  const { data: totalTips, refetch: refetchTotalTips } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'totalTipReceived',
    query: {
      refetchInterval: 2000,
    }
  });

  const { data: paused, refetch: refetchPaused } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'paused',
    query: {
      refetchInterval: 3000,
    }
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
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    }
  });

  const { data: remainingDailyLimit } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'getRemainingDailyLimit',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    }
  });

  const { data: userBalance, refetch: refetchUserBalance } = useBalance({
    address: address,
    query: {
      refetchInterval: 3000,
    }
  });

  // Contract writes with enhanced error handling
  const { writeContract: withdrawWrite, isPending: isWithdrawPending, data: withdrawHash } = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        setWithdrawError('');
        setSuccessMessage(`Withdrawal submitted! Transaction: ${hash.slice(0, 10)}...`);
        setUserActivity((prev) => 
          prev.map(item => 
            item.status === 'pending' && item.type === 'withdraw'
              ? { ...item, hash: hash }
              : item
          )
        );
      },
      onError: (error) => {
        const errorMsg = parseErrorMessage(error);
        setWithdrawError(errorMsg);
        setUserActivity((prev) => 
          prev.map(item => 
            item.status === 'pending' && item.type === 'withdraw'
              ? { ...item, status: 'failed', errorMessage: errorMsg }
              : item
          )
        );
      }
    }
  });

  const { writeContract: tipWrite, isPending: isTipPending, data: tipHash } = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        setTipError('');
        setSuccessMessage(`Tip submitted! Transaction: ${hash.slice(0, 10)}...`);
        setUserActivity((prev) => 
          prev.map(item => 
            item.status === 'pending' && item.type === 'tip'
              ? { ...item, hash: hash }
              : item
          )
        );
        setTimeout(() => {
          refetchTotalTips();
          refetchBalance();
        }, 1000);
      },
      onError: (error) => {
        const errorMsg = parseErrorMessage(error);
        setTipError(errorMsg);
        setUserActivity((prev) => 
          prev.map(item => 
            item.status === 'pending' && item.type === 'tip'
              ? { ...item, status: 'failed', errorMessage: errorMsg }
              : item
          )
        );
      }
    }
  });

  // Admin functions
  const { writeContract: pauseWrite, isPending: isPausePending } = useWriteContract({
    mutation: {
      onSuccess: () => {
        setSuccessMessage('Faucet paused successfully!');
        setTimeout(() => refetchPaused(), 1000);
      },
      onError: (error) => setAdminError(parseErrorMessage(error))
    }
  });

  const { writeContract: unpauseWrite, isPending: isUnpausePending } = useWriteContract({
    mutation: {
      onSuccess: () => {
        setSuccessMessage('Faucet unpaused successfully!');
        setTimeout(() => refetchPaused(), 1000);
      },
      onError: (error) => setAdminError(parseErrorMessage(error))
    }
  });

  const { writeContract: withdrawAllWrite, isPending: isWithdrawAllPending } = useWriteContract({
    mutation: {
      onSuccess: () => {
        setSuccessMessage('All funds withdrawn successfully!');
        setTimeout(() => {
          refetchBalance();
          refetchUserBalance();
        }, 1000);
      },
      onError: (error) => setAdminError(parseErrorMessage(error))
    }
  });

  const { writeContract: setPerTxLimitWrite, isPending: isSetPerTxPending } = useWriteContract({
    mutation: {
      onSuccess: () => {
        setSuccessMessage('Per-transaction limit updated!');
        setNewPerTxLimit('');
      },
      onError: (error) => setAdminError(parseErrorMessage(error))
    }
  });

  const { writeContract: setDailyLimitWrite, isPending: isSetDailyPending } = useWriteContract({
    mutation: {
      onSuccess: () => {
        setSuccessMessage('Daily limit updated!');
        setNewDailyLimit('');
      },
      onError: (error) => setAdminError(parseErrorMessage(error))
    }
  });

  const { writeContract: setCooldownWrite, isPending: isSetCooldownPending } = useWriteContract({
    mutation: {
      onSuccess: () => {
        setSuccessMessage('Cooldown period updated!');
        setNewCooldown('');
      },
      onError: (error) => setAdminError(parseErrorMessage(error))
    }
  });

  const { writeContract: addBlacklistWrite, isPending: isAddBlacklistPending } = useWriteContract({
    mutation: {
      onSuccess: () => {
        setSuccessMessage('Address added to blacklist!');
        setBlacklistAddress('');
      },
      onError: (error) => setAdminError(parseErrorMessage(error))
    }
  });

  // Watch for transaction confirmations
  const { data: withdrawTxReceipt } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  const { data: tipTxReceipt } = useWaitForTransactionReceipt({
    hash: tipHash,
  });

  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase();

  // Update status when transactions are confirmed
  useEffect(() => {
    if (withdrawTxReceipt) {
      setUserActivity((prev) => 
        prev.map(item => 
          item.hash === withdrawHash && item.status === 'pending'
            ? { ...item, status: 'completed' }
            : item
        )
      );
      queryClient.invalidateQueries();
    }
  }, [withdrawTxReceipt, withdrawHash, queryClient]);

  useEffect(() => {
    if (tipTxReceipt) {
      setUserActivity((prev) => 
        prev.map(item => 
          item.hash === tipHash && item.status === 'pending'
            ? { ...item, status: 'completed' }
            : item
        )
      );
      setTimeout(() => {
        refetchTotalTips();
        refetchBalance();
        refetchUserBalance();
      }, 1000);
    }
  }, [tipTxReceipt, tipHash, refetchTotalTips, refetchBalance, refetchUserBalance]);

  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setInterval(() => {
        setCooldownTime(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownTime]);

  // Validation functions
  const validateWithdrawAmount = () => {
    const amount = parseFloat(withdrawAmount);
    if (amount <= 0) return 'Amount must be greater than zero';
    if (perTransactionLimit && amount > parseFloat(formatEther(perTransactionLimit))) {
      return `Amount exceeds per-transaction limit of ${formatEther(perTransactionLimit)} ETH`;
    }
    if (remainingDailyLimit && amount > parseFloat(formatEther(remainingDailyLimit))) {
      return `Amount exceeds remaining daily limit of ${formatEther(remainingDailyLimit)} ETH`;
    }
    if (balance && amount > parseFloat(formatEther(balance))) {
      return 'Faucet has insufficient funds';
    }
    return '';
  };

  const validateTipAmount = () => {
    const amount = parseFloat(tipAmount);
    if (amount <= 0) return 'Tip amount must be greater than zero';
    return '';
  };

  // Helper functions
  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (seconds > 10) return `${seconds} seconds ago`;
    return 'Just now';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Main functions
  const handleWithdraw = () => {
    if (!contractAddress || !withdrawAmount) return;
    
    const validationError = validateWithdrawAmount();
    if (validationError) {
      setWithdrawError(validationError);
      return;
    }
    
    const newActivity: ActivityItem = {
      type: 'withdraw',
      amount: withdrawAmount,
      timestamp: Date.now(),
      status: 'pending'
    };
    setUserActivity((prev) => [newActivity, ...prev].slice(0, 10));
    
    withdrawWrite({
      address: contractAddress as Address,
      abi: FAUCET_ABI,
      functionName: 'withdraw',
      args: [parseEther(withdrawAmount)],
    });
  };

  const handleTip = () => {
    if (!contractAddress || !isConnected) return;
    
    const validationError = validateTipAmount();
    if (validationError) {
      setTipError(validationError);
      return;
    }
    
    const newActivity: ActivityItem = {
      type: 'tip',
      amount: tipAmount,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    setUserActivity(prev => [newActivity, ...prev]);
    
    tipWrite({
      address: contractAddress as Address,
      abi: FAUCET_ABI,
      functionName: 'tip',
      value: parseEther(tipAmount),
    });
  };

  // Admin functions
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

  const handleWithdrawAll = () => {
    if (!contractAddress) return;
    const confirmed = window.confirm('Are you sure you want to withdraw all funds from the faucet?');
    if (confirmed) {
      withdrawAllWrite({
        address: contractAddress as Address,
        abi: FAUCET_ABI,
        functionName: 'withdrawAll',
      });
    }
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
      args: [BigInt(Number(newCooldown))],
    });
  };

  const handleAddBlacklist = () => {
    if (!contractAddress || !blacklistAddress) return;
    try {
      // Basic address validation
      if (!blacklistAddress.startsWith('0x') || blacklistAddress.length !== 42) {
        setAdminError('Invalid address format');
        return;
      }
      addBlacklistWrite({
        address: contractAddress as Address,
        abi: FAUCET_ABI,
        functionName: 'addToBlackList',
        args: [blacklistAddress as Address],
      });
    } catch (error) {
      setAdminError('Invalid address format');
    }
  };

  // Calculate tip capacity info
  const getTipCapacityInfo = () => {
    if (!balance || !maxBalance) return null;
    
    const currentBalance = parseFloat(formatEther(balance));
    const maxBalanceEth = parseFloat(formatEther(maxBalance));
    const availableSpace = maxBalanceEth - currentBalance;
    const percentageFull = (currentBalance / maxBalanceEth) * 100;
    
    return {
      availableSpace,
      percentageFull,
      isNearFull: percentageFull > 90,
      isFull: currentBalance >= maxBalanceEth
    };
  };

  const tipCapacity = getTipCapacityInfo();

  // Message Components
  const ErrorMessage = ({ message, onClose }: { message: string; onClose?: () => void }) => (
    <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
      <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-red-800 font-medium text-sm">{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-red-400 hover:text-red-600">
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  const SuccessMessage = ({ message, onClose }: { message: string; onClose?: () => void }) => (
    <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start space-x-3">
      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-green-800 font-medium text-sm">{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-green-400 hover:text-green-600">
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  const InfoMessage = ({ message }: { message: string }) => (
    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
      <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-blue-800 font-medium text-sm">{message}</p>
      </div>
    </div>
  );

  // Check if unsupported network
  if (isConnected && !contractAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-8 text-center shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-3">Network Not Supported</h2>
          <p className="text-red-700 mb-6 text-lg">
            Please switch to <span className="font-semibold">Localhost 8545</span> network to use the faucet
          </p>
          <div className="bg-white bg-opacity-80 rounded-lg p-4 text-left">
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

  const StatCard = ({ icon: Icon, label, value, subtext, gradient, percentage }: {
    icon: any;
    label: string;
    value: string;
    subtext?: string;
    gradient: string;
    percentage?: number;
  }) => (
    <div className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${gradient} p-3 shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {percentage !== undefined && (
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{percentage.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">capacity</div>
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">{label}</h3>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          {subtext && <p className="text-sm text-gray-500">{subtext}</p>}
        </div>
      </div>
      
      {percentage !== undefined && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );

  const ActionButton = ({ onClick, disabled, gradient, children, className = "" }: {
    onClick: () => void;
    disabled?: boolean;
    gradient: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden px-8 py-4 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${className}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient}`} />
      <div className="relative z-10 flex items-center justify-center space-x-2">
        {children}
      </div>
    </button>
  );

  const AdminControls = () => (
    <div className="mt-8 space-y-6">
      {/* Global Admin Messages */}
      {adminError && <ErrorMessage message={adminError} onClose={() => setAdminError('')} />}
      
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contract Controls */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Contract Controls
          </h3>

          <div className="space-y-4">
            {/* Pause/Unpause */}
            <div className="flex space-x-3">
              <ActionButton
                onClick={handlePause}
                disabled={isPausePending || paused}
                gradient="from-red-500 to-red-600"
                className="flex-1"
              >
                {isPausePending ? <Loader className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                <span>{isPausePending ? 'Pausing...' : 'Pause Faucet'}</span>
              </ActionButton>
              
              <ActionButton
                onClick={handleUnpause}
                disabled={isUnpausePending || !paused}
                gradient="from-green-500 to-green-600"
                className="flex-1"
              >
                {isUnpausePending ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>{isUnpausePending ? 'Unpausing...' : 'Unpause Faucet'}</span>
              </ActionButton>
            </div>

            {/* Withdraw All */}
            <ActionButton
              onClick={handleWithdrawAll}
              disabled={isWithdrawAllPending}
              gradient="from-purple-500 to-purple-600"
              className="w-full"
            >
              {isWithdrawAllPending ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{isWithdrawAllPending ? 'Withdrawing...' : 'Withdraw All Funds'}</span>
            </ActionButton>
            
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <strong>Note:</strong> Withdraw All will transfer all ETH from the faucet to your wallet.
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Limits & Settings
          </h3>

          <div className="space-y-4">
            {/* Per Transaction Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Per Transaction Limit (ETH)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="0.01"
                  value={newPerTxLimit}
                  onChange={(e) => setNewPerTxLimit(e.target.value)}
                  placeholder={perTransactionLimit ? formatEther(perTransactionLimit) : "0.05"}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <ActionButton
                  onClick={handleSetPerTxLimit}
                  disabled={isSetPerTxPending || !newPerTxLimit}
                  gradient="from-blue-500 to-blue-600"
                >
                  {isSetPerTxPending ? <Loader className="w-4 h-4 animate-spin" /> : <span>Set</span>}
                </ActionButton>
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
                  step="0.01"
                  value={newDailyLimit}
                  onChange={(e) => setNewDailyLimit(e.target.value)}
                  placeholder={dailyLimit ? formatEther(dailyLimit) : "0.1"}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <ActionButton
                  onClick={handleSetDailyLimit}
                  disabled={isSetDailyPending || !newDailyLimit}
                  gradient="from-blue-500 to-blue-600"
                >
                  {isSetDailyPending ? <Loader className="w-4 h-4 animate-spin" /> : <span>Set</span>}
                </ActionButton>
              </div>
            </div>

            {/* Cooldown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cooldown (seconds)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={newCooldown}
                  onChange={(e) => setNewCooldown(e.target.value)}
                  placeholder={coolDown ? coolDown.toString() : "300"}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <ActionButton
                  onClick={handleSetCooldown}
                  disabled={isSetCooldownPending || !newCooldown}
                  gradient="from-blue-500 to-blue-600"
                >
                  {isSetCooldownPending ? <Loader className="w-4 h-4 animate-spin" /> : <span>Set</span>}
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blacklist Management */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Ban className="w-5 h-5 mr-2" />
          Blacklist Management
        </h3>

        <div className="space-y-4">
          <div className="flex space-x-3">
            <input
              type="text"
              value={blacklistAddress}
              onChange={(e) => setBlacklistAddress(e.target.value)}
              placeholder="0x742d35Cc6663C0532CA3..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <ActionButton
              onClick={handleAddBlacklist}
              disabled={isAddBlacklistPending || !blacklistAddress}
              gradient="from-red-500 to-red-600"
            >
              {isAddBlacklistPending ? <Loader className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              <span>{isAddBlacklistPending ? 'Adding...' : 'Add to Blacklist'}</span>
            </ActionButton>
          </div>
          
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <strong>Warning:</strong> Blacklisted addresses cannot withdraw from or tip the faucet.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Droplets className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ETH Faucet
                </h1>
                <p className="text-xs text-gray-500">Local Development Network</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {isOwner && (
                <button
                  onClick={() => setShowAdmin(!showAdmin)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    showAdmin 
                      ? 'bg-orange-100 text-orange-800 border border-orange-300' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Admin Panel
                </button>
              )}
              
              {isConnected ? (
                <div className="flex items-center space-x-3 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-xl border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-green-800">Connected</span>
                  <div 
                    className="text-xs text-green-600 cursor-pointer hover:text-green-800 flex items-center space-x-1"
                    onClick={copyAddress}
                  >
                    <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </div>
                </div>
              ) : (
                <ConnectButton />
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Global Messages */}
        {successMessage && <SuccessMessage message={successMessage} onClose={() => setSuccessMessage('')} />}
        
        {!isConnected ? (
          // Connection Prompt
          <div className="text-center py-20">
            <div className="relative inline-block mb-8">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                Get Test ETH Instantly
              </h1>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
              </div>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
              Free testnet Ethereum for development and testing. Fast, reliable, and always available.
            </p>
            
            <div className="max-w-md mx-auto bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white border-opacity-20">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h3>
                <p className="text-gray-600 mb-6">
                  Connect your wallet to start receiving test ETH
                </p>
                <ConnectButton />
                <div className="pt-4 border-t border-gray-200 mt-6">
                  <p className="text-sm text-gray-500 text-center">
                    Make sure you are connected to <span className="font-semibold">Localhost 8545</span> network
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="relative inline-block">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                  Get Test ETH Instantly
                </h1>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
                </div>
              </div>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Free testnet Ethereum for development and testing. Fast, reliable, and always available.
              </p>
              {isOwner && (
                <div className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-full shadow-lg">
                  <span className="mr-2">👑</span>
                  <span className="font-bold">Contract Owner</span>
                </div>
              )}
            </div>

            {/* Faucet Paused Warning */}
            {paused && (
              <div className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-6">
                <div className="flex items-center justify-center space-x-3">
                  <Pause className="w-6 h-6 text-red-600" />
                  <h3 className="text-xl font-bold text-red-800">Faucet is Currently Paused</h3>
                </div>
                <p className="text-center text-red-700 mt-2">Withdrawals are temporarily disabled by the contract owner</p>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={Droplets}
                label="Faucet Balance"
                value={balance ? `${Number(formatEther(balance)).toFixed(3)} ETH` : '0 ETH'}
                subtext="Available funds"
                gradient="from-blue-500 to-cyan-500"
                percentage={balance && maxBalance ? (Number(formatEther(balance)) / Number(formatEther(maxBalance))) * 100 : 0}
              />
              <StatCard
                icon={Zap}
                label="Per Transaction"
                value={perTransactionLimit ? `${formatEther(perTransactionLimit)} ETH` : '0 ETH'}
                subtext="Maximum per request"
                gradient="from-purple-500 to-pink-500"
              />
              <StatCard
                icon={Clock}
                label="Daily Limit"
                value={dailyLimit ? `${formatEther(dailyLimit)} ETH` : '0 ETH'}
                subtext="Per user per day"
                gradient="from-orange-500 to-red-500"
              />
              <StatCard
                icon={Gift}
                label="Total Tips"
                value={totalTips ? `${Number(formatEther(totalTips)).toFixed(3)} ETH` : '0 ETH'}
                subtext="Community contributions"
                gradient="from-green-500 to-emerald-500"
              />
            </div>

            {/* Main Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Faucet Card */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">Request Test ETH</h2>
                        <p className="text-blue-100">Get ETH for testing your dApps</p>
                      </div>
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Droplets className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="space-y-6">
                      {/* Withdraw Error */}
                      {withdrawError && <ErrorMessage message={withdrawError} onClose={() => setWithdrawError('')} />}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Amount to Request
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={withdrawAmount}
                            onChange={(e) => {
                              setWithdrawAmount(e.target.value);
                              if (withdrawError) setWithdrawError(''); // Clear error on change
                            }}
                            className="w-full px-4 py-4 text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                            step="0.01"
                            max={perTransactionLimit ? formatEther(perTransactionLimit) : '0.05'}
                          />
                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                            ETH
                          </div>
                        </div>
                        <div className="flex justify-between mt-2 text-sm text-gray-500">
                          <span>Min: 0.001 ETH</span>
                          <span>Max: {perTransactionLimit ? formatEther(perTransactionLimit) : '0.05'} ETH</span>
                        </div>
                        
                        {/* Real-time validation feedback */}
                        {withdrawAmount && validateWithdrawAmount() && (
                          <div className="mt-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
                            <AlertTriangle className="w-4 h-4 inline mr-1" />
                            {validateWithdrawAmount()}
                          </div>
                        )}
                      </div>

                      {cooldownTime > 0 ? (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                          <div className="flex items-center space-x-3">
                            <Clock className="w-5 h-5 text-orange-500" />
                            <div>
                              <p className="font-medium text-orange-800">Cooldown Active</p>
                              <p className="text-orange-600">Please wait {formatTime(cooldownTime)} before next request</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <ActionButton
                          gradient="from-blue-500 to-purple-600"
                          disabled={!isConnected || parseFloat(withdrawAmount) <= 0 || isWithdrawPending || paused || !!validateWithdrawAmount()}
                          className="w-full"
                          onClick={handleWithdraw}
                        >
                          {isWithdrawPending ? <Loader className="w-5 h-5 animate-spin" /> : <Droplets className="w-5 h-5" />}
                          <span>{isWithdrawPending ? 'Processing...' : `Request ${withdrawAmount} ETH`}</span>
                        </ActionButton>
                      )}

                      {/* Tip Section */}
                      <div className="border-t pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Support the Faucet 💝</h3>
                          {tipCapacity && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              tipCapacity.isFull ? 'bg-red-100 text-red-800' :
                              tipCapacity.isNearFull ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {tipCapacity.percentageFull.toFixed(1)}% Full
                            </span>
                          )}
                        </div>
                        
                        {/* Tip Error */}
                        {tipError && <ErrorMessage message={tipError} onClose={() => setTipError('')} />}
                        
                        <div className="mb-4">
                          {tipCapacity && tipCapacity.isNearFull && (
                            <InfoMessage 
                              message={tipCapacity.isFull 
                                ? `Faucet is at maximum capacity (${formatEther(maxBalance!)} ETH). Tips over capacity will be automatically refunded.`
                                : `Faucet is ${tipCapacity.percentageFull.toFixed(1)}% full. Available space: ${tipCapacity.availableSpace.toFixed(3)} ETH`
                              } 
                            />
                          )}
                          <p className="text-sm text-gray-600">
                            Tips help fund more test ETH for the community. <strong></strong>
                            {tipCapacity && tipCapacity.availableSpace < 1 && (
                              <span className="text-orange-600"> Tips over capacity are automatically refunded.</span>
                            )}
                          </p>
                        </div>
                        
                        <div className="flex space-x-4">
                          <input
                            type="number"
                            value={tipAmount}
                            onChange={(e) => {
                              setTipAmount(e.target.value);
                              if (tipError) setTipError(''); // Clear error on change
                            }}
                            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100"
                            placeholder="Any amount (no limits)"
                            step="0.01"
                          />
                          <ActionButton
                            gradient="from-green-500 to-emerald-500"
                            disabled={!isConnected || parseFloat(tipAmount) <= 0 || isTipPending || !!validateTipAmount()}
                            onClick={handleTip}
                          >
                            {isTipPending ? <Loader className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                            <span>{isTipPending ? 'Processing...' : 'Tip'}</span>
                          </ActionButton>
                        </div>
                        
                        {/* Real-time tip validation */}
                        {tipAmount && validateTipAmount() && (
                          <div className="mt-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
                            <AlertTriangle className="w-4 h-4 inline mr-1" />
                            {validateTipAmount()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Stats Sidebar */}
              <div className="space-y-6">
                {/* User Balance */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Your Stats</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Current Balance</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {userBalance ? `${Number(formatEther(userBalance.value)).toFixed(4)} ETH` : '0 ETH'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Used Today</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {userStats ? `${Number(formatEther(userStats[1])).toFixed(3)} ETH` : '0 ETH'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Remaining</p>
                        <p className="text-lg font-semibold text-green-600">
                          {remainingDailyLimit ? `${Number(formatEther(remainingDailyLimit)).toFixed(3)} ETH` : '0 ETH'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Network Info */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-blue-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Info</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Network</span>
                      <span className="font-medium">{chain?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Chain ID</span>
                      <span className="font-medium">{chain?.id || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">RPC</span>
                      <span className="font-medium text-green-600">Connected</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cooldown</span>
                      <span className="font-medium">{coolDown ? `${coolDown}s` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status</span>
                      <span className={`font-medium ${paused ? 'text-red-600' : 'text-green-600'}`}>
                        {paused ? 'Paused' : 'Active'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tip Capacity</span>
                      <span className="font-medium">
                        {tipCapacity ? `${tipCapacity.availableSpace.toFixed(2)} ETH` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Panel */}
            {isOwner && showAdmin && <AdminControls />}

            {/* Recent Activity */}
            <div className="mt-12">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">Your Recent Activity</h3>
                </div>
                <div className="p-6">
                  {userActivity.length > 0 ? (
                    <div className="space-y-4">
                      {userActivity.map((activity: ActivityItem, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              activity.type === 'withdraw' 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'bg-green-100 text-green-600'
                            }`}>
                              {activity.type === 'withdraw' ? <Droplets className="w-4 h-4" /> : <Gift className="w-4 h-4" />}
                              </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {activity.type === 'withdraw' ? 'Withdrawal' : 'Tip'}: {activity.amount} ETH
                              </p>
                              <p className="text-sm text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                              {activity.errorMessage && (
                                <p className="text-xs text-red-600 mt-1">
                                  <XCircle className="w-3 h-3 inline mr-1" />
                                  {activity.errorMessage}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                              activity.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : activity.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {activity.status === 'pending' && <Loader className="w-3 h-3 animate-spin" />}
                              {activity.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                              {activity.status === 'failed' && <XCircle className="w-3 h-3" />}
                              <span>{activity.status}</span>
                            </span>
                            {activity.hash && activity.status === 'completed' && (
                              <button
                                onClick={() => window.open(`https://etherscan.io/tx/${activity.hash}`, '_blank')}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                View Tx
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No recent activity</p>
                      <p className="text-sm">Your faucet requests will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ModernFaucetApp;