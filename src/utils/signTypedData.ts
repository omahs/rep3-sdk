// import { ethers } from 'ethers';
// import { IContract, IContractAddress, relayerData } from '../types';

// export enum SignMethodFunctionCall {
//   Register = 'register',
//   ApproveBadge = 'approveBadge',
//   ClaimBadge = 'claim',
// }

// const dataObjectBuilder = (
//   data: relayerData,
//   functionCall: SignMethodFunctionCall | undefined,
//   contractInstance: IContract
// ) => {
//   switch (functionCall) {
//     case SignMethodFunctionCall.Register:
//       return {
//         data: contractInstance.pocp?.interface.encodeFunctionData(
//           functionCall,
//           [data?.daoName, data?.approverAddresses]
//         ),
//       };
//     case SignMethodFunctionCall.ApproveBadge:
//       return {
//         data: contractInstance.pocp?.interface.encodeFunctionData(
//           functionCall,
//           [
//             data?.communityId,
//             data?.claimerAddresses,
//             data?.ipfsUrls,
//             data?.arrayOfIdentifiers,
//           ]
//         ),
//       };
//     case SignMethodFunctionCall.ClaimBadge:
//       return {
//         data: contractInstance.pocp?.interface.encodeFunctionData(
//           functionCall,
//           [data?.tokenIds]
//         ),
//       };
//     default:
//       return { data: false };
//   }
// };

// export const signedTypedData = async (
//   signer: ethers.Signer | any,
//   signerAddress: string,
//   contractInstance: IContract,
//   ContractAddress: IContractAddress,
//   signingData: relayerData,
//   chainId: number,
//   functionCall: SignMethodFunctionCall | undefined
// ) => {
//   const nonceBigNumber = await contractInstance.forwarder?.getNonce(
//     signerAddress.toString()
//   );
//   const nonce = parseInt(nonceBigNumber);

//   const ForwardRequest = [
//     { name: 'from', type: 'address' },
//     { name: 'to', type: 'address' },
//     { name: 'value', type: 'uint256' },
//     { name: 'gas', type: 'uint256' },
//     { name: 'nonce', type: 'uint256' },
//     { name: 'data', type: 'bytes' },
//   ];

//   const typeSigningObject = {
//     types: {
//       ForwardRequest,
//     },
//     domain: {
//       name: 'DreputeForwarder',
//       version: '0.0.1',
//       chainId,
//       verifyingContract: ContractAddress.forwarder,
//     },
//     primaryType: 'ForwardRequest',
//   };

//   const data = {
//     from: signerAddress,
//     to: ContractAddress.pocp,
//     nonce,
//     value: 0,
//     gas: 1e6,
//     data: dataObjectBuilder(signingData, functionCall, contractInstance).data,
//   };
//   let signature;
//   try {
//     signature = await signer._signTypedData(
//       typeSigningObject.domain,
//       typeSigningObject.types,
//       data
//     );
//     return { data, signature };
//   } catch (error) {
//     throw error;
//   }
// };
