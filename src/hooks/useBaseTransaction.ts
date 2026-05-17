import { useSendTransaction, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther } from 'viem';

export const BUILDER_CODE = 'bc_p79gvh9g';
export const ENCODED_BUILDER_STRING = '0x62635f70373967766839670b0080218021802180218021802180218021';
export const DEAD_ADDRESS = '0x0000000000000000000000000000000000000000';

export function useBaseTransaction() {
  const { data: hash, isPending, sendTransaction, error } = useSendTransaction();
  const { address } = useAccount();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({
      hash,
    });

  const sendActivityTransaction = async () => {
    if (!address) throw new Error("Wallet not connected");
    
    // We send a 0 ETH transaction to the dead address
    // with the encoded builder string in the data field to track activity
    sendTransaction({
      to: DEAD_ADDRESS,
      value: parseEther('0'),
      data: ENCODED_BUILDER_STRING as `0x${string}`,
    });
  };

  return {
    sendActivityTransaction,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash
  };
}
