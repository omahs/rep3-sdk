export const claimedTokenQuery_claimer = `
query($communityId: String, $claimerAddress:String) {
    pocpTokens( where:{community:$communityId,claimer:$claimerAddress}) {
      id
    community {
      id
      name
      txSigner
      txhash
    }
      ipfsMetaUri
      claimer
      approver    
    }
  }
`;

export const claimedTokenQuery = `
query($communityId: String) {
    pocpTokens( where:{community:$communityId}) {
      id
    community {
      id
      name
      txSigner
      txhash
    }
      ipfsMetaUri
      claimer
      approver    
    }
  }
`;

export const approveTokenQuery = `
query($communityId: String) {
    approvedTokens( where:{community:$communityId}) {
        id
        community {
          id
          name
          txSigner
          txhash
        }
        identifier 
    }
}
`;

export const communityWithTxHash = `
query($txhash: String) {
communities ( where:{txhash:$txhash}){
    id
    name
    approver{
      id
    }
    txSigner
    txhash
  }
}
`;

export const membershipNFTs = `
query($claimer: String) {
  membershipNfts ( where:{claimer:$claimer}){
    id
    claimer
    level
    category
    ipfsMetaUri
    tx_hash
  }
}
`;

export const membershipNFTsWithHash = `
query($tx_hash: String) {
  membershipNfts ( where:{tx_hash:$tx_hash}){
    id
    claimer
    level
    category
    ipfsMetaUri
    tx_hash
  }
}
`;
