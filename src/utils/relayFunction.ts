import axios from 'axios';
import { ethers } from 'ethers';
import { relayerRequestData, RelayRequestResponse } from '../types';

export enum RelayMethodFunctionCall {
  REGISTER,
  ADD_APPROVER,
  REMOVE_APPROVER,
  CLAIM,
  BURN,
  APPROVE,
}

export const getSignatureParameters = (signature: string) => {
  if (!ethers.utils.isHexString(signature)) {
    throw new Error(
      'Given value "'.concat(signature, '" is not a valid hex string.')
    );
  }
  var r = signature.slice(0, 66);
  var s = '0x'.concat(signature.slice(66, 130));
  var v: any = '0x'.concat(signature.slice(130, 132));
  v = ethers.BigNumber.from(v).toNumber();
  if (![27, 28].includes(v)) v += 27;
  return {
    r: r,
    s: s,
    v: v,
  };
};

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
