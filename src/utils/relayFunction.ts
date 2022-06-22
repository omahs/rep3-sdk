import axios from 'axios';
import { relayerRequestData, RelayRequestResponse } from '../types';

export enum RelayMethodFunctionCall {
  REGISTER,
  ADD_APPROVER,
  REMOVE_APPROVER,
  CLAIM,
  BURN,
  APPROVE,
}

export const relayerServerCall = async (
  relayerUrl: string,
  relayerToken: string,
  functionCall: RelayMethodFunctionCall,
  request: relayerRequestData,
  signature: string,
  chainId: number
): Promise<RelayRequestResponse> => {
  const data = {
    function: functionCall,
    request_data: request,
    signature,
    chain_id: chainId,
    callback_api: 'https://staging.api.drepute.xyz/eth/callback',
  };
  try {
    const res = await axios.post(`${relayerUrl}/eth/relay`, data, {
      headers: {
        'X-Authentication': relayerToken,
      },
    });

    return { transactionHash: res.data.data.hash };
  } catch (error) {
    throw error;
  }
};
