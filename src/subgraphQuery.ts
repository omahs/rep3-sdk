export const daoWithTxHash = `
query($txHash: String) {
  daos(where:{claimer:$claimer,contractAddress:$contractAddress}) {
    id
    name
    symbol
    totalSupply
    txHash
  }
`;

export const membershipNFTs = `
query($claimer: String,$contractAddress:String ) {
  membershipNFTs ( where:{claimer:$claimer,contractAddress:$contractAddress}){
    id
    claimer
    level
    category
    metadatUri
    contractAddress {
      id
    }
  }
}
`;

export const membershipNFTsWithHash = `
query($id: String) {
  membershipNFTs(where:{id:$id}) {
    id
    tokenID
    metadatUri
    level
    category
    claimer
  }
}
`;
