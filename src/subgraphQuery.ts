export const daoWithTxHash = `
query($txHash: String) {
  daos(where:{txHash:$txHash}){
    id
    txHash
    name
    symbol
    totalSupply
  }
}
`;

export const membershipNFTsForClaimerOfDao = `
query($claimer: String,$contractAddress:String ) {
  membershipNFTs(where:{claimer:$claimer,contractAddress:$contractAddress}){
    id
    metadataUri
    level
    category
    claimer
    contractAddress{
      id
      txHash
      name
      symbol
    }
    tokenID
  }
}
`;

export const membershipNFTsForClaimer = `
query($claimer: String) {
  membershipNFTs(where:{claimer:$claimer}){
    id
    metadataUri
    level
    category
    claimer
    contractAddress{
      id
      txHash
      name
      symbol
    }
    tokenID
  }
}
`;

export const membershipNFTsWithHash = `
query($txHash: String) {
  membershipNFTs(where:{id:$id}){
    id
    metadataUri
    level
    category
    claimer
    contractAddress{
      id
      txHash
      name
      symbol
    }
    tokenID
  }
}
`;

export const getApproversOfDao = `
query($contractAddress: String) {
  daos(where:{id: $contractAddress}){
    id
    approver
  }
}`;
