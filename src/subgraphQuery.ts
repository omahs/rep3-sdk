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
