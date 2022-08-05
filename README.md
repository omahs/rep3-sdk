# POCP Service SDK

POCP (or Proof of Contribution Protocol) is the beta version of the REP3 Protocol--a credential management tool for DAOs and their members. 

Simply put, this tool enables DAOs to give their contributors a stamp of approval via badges, which the contributors can then collect and proudly show-off to their family, friends and potential employers. 

The badges are [Soulbound](https://vitalik.ca/general/2022/01/26/soulbound.html) ERC-721 tokens. In the current version, each new badge corresponds to a single contribution, however, in the next version, badges will be upgradable (meaning multiple contributions will be tracked in a single badge).

The rest of this document details the technical specifications and integration process of REP3 Protocol's beta version.

## Installation

Install the package with yarn or npm:

```bash
npm install pocp-service-sdk
yarn add pocp-service-sdk
```

## Getting Started

The three main functions of this protocol are registering community on the protocol, approving and claiming membership badges and issuing contribution/appreciation/pariticipation badges on memberships. These functions (as found in pocp-service-sdk/src/pocp/index.ts/) are described below. Let's go through them one-by-one. 
>Note: These three interactions (and others mentioned later) can be done directly through interacting with contracts or through a relayer.

### 1. Instantiating Pocp
>Note: `callback_function_tx_reciept` in many functions sends transaction reciept as params, and `callback_function_confirming_events` send contract emmitted events as params

```javascript
import Pocp from "pocp-service-sdk"

# add relyer_token for a gasless transaction


// For Polygon mainnet
chainId = 137
contractAddressConfig ={
      pocpManger: "0xDA6F4387C344f1312439E05E9f9580882abA6958",
      pocpBeacon: "0x083842b3F6739948D26C152C137929E0D3a906b9",
      pocpRouter: "0xB9Acf5287881160e8CE66b53b507F6350d7a7b1B",
}

// For Polygon Mumbai
chainId = 80001
contractAddressConfig = {
      pocpManger: "0xf00eAbb380752fed6414f3C12e3D8F976C7D024d",
      pocpBeacon: "0xDcc7133abBA15B8f4Bf155A372C17744E0941f28",
      pocpRouter: "0x1C6D20042bfc8474051Aba9FB4Ff85880089A669",
}

import { Biconomy } from "@biconomy/mexa"
config = {
      biconomyInstance:Biconomy,
      apiKey: <api-key-biconomy>,
      relayURL: <rpc-url>,
}

const pocp = new Pocp(
      signer, null, walletProvider, chainId,
      contractAddressConfig
      config
)
await pocp.createInstance()

```



### 1. Registering community
The first step to using this protocol is registering community on the protocol. This is done by the community admin(s) using the `daoDeploy` function. This takes the name of the DAO and an array of owners' addresses as parameters. In case you want to listen to the event emitted, you can pass it as an  callbackFunction which takes the event emitted as its parameter.

>Note: callback functions can be listened for transaction hash which can be used to get the contract address of a dao.

```javascript

await pocp.daoDeploy(
      "<YourDAOName>", 
      "<YourDAOERC721Symbol>",
      ["<approverAddress_1>", "<approverAddress_2>", ..]
      "0x083842b3F6739948D26C152C137929E0D3a906b9 (for mainnet) / 0xDcc7133abBA15B8f4Bf155A372C17744E0941f28 (for mumbai)",
      "0xB9Acf5287881160e8CE66b53b507F6350d7a7b1B (for mainnet) / 0x1C6D20042bfc8474051Aba9FB4Ff85880089A669 (for mumbai)",,
      callback_function_tx_reciept, //triggered once hash is received
      callback_function_confirming_events, //triggered once tx is confirmed
)

```


### 2. Approving membership
Before contributors can mint the badge to their addresses, the community admins must "ready" the badge for claiming. This is done via the `createMembershipVoucher` function. It takes the proxy contract address of a dao, array of levels in integer,array of category in integer, end is the array of index <explain from somesh>, string of arweave or ipfs metadata hash seperating it by comma. For supporting back versioning of rep3 protocol, we have sign type version for different updates. The current rep3 Protocol supports "signTypedDatav2.0" and should be passed as a params.

```javascript
const signedVoucher:<signedVoucher> = await pocp.createMembershipVoucher(
            contractAddress,
            [1,2],      // [<Levels of membership represented in 0,1...etc.>]
            [2,4],      // [<Levels of categories represented in 0,1...etc.>]
            [],
            ["0x0EB...4b53","0x0FG...3s67"],   // [<claimer address>]
            "AdaDsjj...DGdI,Sdgguedsj...sfgadfD,",    //<string of metadata_hash seperated by comma>
            "signTypedDatav2.0"     //<Type of signature version>
        )
 // returns object of signed voucher
      {
            "data":[257],
            "end":[],
            "to":["0x2669B5e41a56989EE58a2195f2bC54337c48c670"],
            "tokenUris":"GrMjwgeaivFF0kkculkkzGeoxJUD0ChSiBpXc8DPPME,",
      "signature":"0xc7453943fc82666aa5352d7a6fad6ca017eb4ce97d750a7f84604c501d5778ea06e61ffab6f7b56bfba765809376dbc0407639b3c923168f7c4cd7c5543cf28a1c"
      }
```

### 3. Claiming membership NFT
The voucher created by the admin or approver of dao by signing the membership approval can be used to claim membership NFT by the contributor or the member of dao by using `claimMembershipNft`. The function takes proxy contract address of a dao, signed voucher, index of address in signed voucher, version of sign used while approving membership. In case you want to listen to the event emitted, you can pass it as an callbackFunction which takes the event emitted as its parameter. Or you can get the transaction reciept by getting the params of transaction hash callback function.

```javascript

await pocp.claimMembershipNft(
        contractAddress,
        <Signed-Voucher>,
        0,  //<index of address in signed voucher>
        "signTypedDatav2.0",  //<Type of signature version>
        callback_function_tx_reciept, //triggered once hash is received
       callback_function_confirming_events, //triggered once tx is confirmed
  )
```


### 4. Upgrading membership NFT
Approver of a dao can upgrade or downgrade membership NFTs of a contributor or a member of dao via `upgradeMembershipNft` by passing dao's contract address, tokenId of the membership NFT, level to which it should be upgraded or downgraded, category to which it should be upgraded or downgraded, ipfs or arweave hash for the NFT. In case you want to listen to the event emitted, you can pass it as an  callbackFunction which takes the event emitted as its parameter. Or you can get the transaction reciept by getting the params of transaction hash callback function.

```javascript

await pocp.upgradeMembershipNft(
        contractAddress,
        1,  //<membershipNft token id>
        2,  //<Upgrading level represented in number>
        3,  //<Upgrading category represented in number>
      "AdaDsjj...DGdI", //<metadata_hash of upgrading NFT>
      callback_function_tx_reciept, //triggered once hash is received
      callback_function_confirming_events, //triggered once tx is confirmed
    )
```

### 5. Claiming Association Badges
The voucher created by the admin or approver of dao by signing the contribution approval can be used to claim association NFT by the contributor or the member of dao by using `claimContributionBadges`. The function takes proxy contract address of a dao, signed voucher,membershipNFT token Id of contributor, index of address in signed voucher. In case you want to listen to the event emitted, you can pass it as an  callbackFunction which takes the event emitted as its parameter. Or you can get the transaction reciept by getting the params of transaction hash callback function.

`>Note : It is adviced to keep the length of array same as the array of address. Keep an element in arrayOfData to be 0 as default.`

```javascript

await pocp.claimContributionBadges(
            contractAddress,
            <Signed_Voucher>,
            1,    //<membershipNft token id>
            1,    //<index of address in signed voucher>
            callback_function_tx_reciept, //triggered once hash is received
            callback_function_confirming_events, //triggered once tx is confirmed
        )
```

## Some Other Functions 

There are also some other functions that can, in general, help teams get their usage history of the protocol. These functions (as found in 
pocp-service-sdk/src/pocpGetters/index.ts) are described below. Let's go through them one-by-one.
>Note: These three interactions (and others mentioned later) can be done directly through interacting with contracts or through a relayer.

>Note: As Rep3 Protocol makes uses of subgraphs for quering contract. Devs can write their custom logics on rep3 subgraph

```
      Rep3 Subgraph Urls
      mumbai https://api.thegraph.com/subgraphs/name/eth-jashan/rep3-mumbai
      matic https://api.thegraph.com/subgraphs/name/eth-jashan/rep3-matic
```

### 1. Initialize pocp getter instance
The PocpGetters class is initiated by the subgraph url.

```javascript
 import { PocpGetters } from "pocp-service-sdk"
      
 const pocpGetter = new PocpGetters(<Mumbai-Subgraph-url/Matic-Subgraph-url>)

```
### 2. Get dao contract address from transaction hash
The `getdaoInfoForHash` getter function takes the transaction hash of `daoDeploy`, and returns the details of dao in contract.

```javascript
 const daoInfo:<DaoDetails> = await pocpGetter.getdaoInfoForHash(
       `0xfsfs...sfaiee` // transaction hash
 )
 
      // returns value DaoDetail
      {
        "id": "0x00c51890d6c9da0a7e85ed6682b8b59249f60f5f", // proxy contract address
        "name": "",
        "symbol": "",
        "txHash": "0x104d4adb421cb0b3e81b05549488e1fd3f75132bafe451971505607e419fd6f3"
      },
 
```

### 3. Get membershipNft from transaction hash
The `getMembershipNftsForHash` getter function takes the transaction hash of `claimMembershipNft` function , and returns the details of membership NFTs.

```javascript
      
 const membershipNft<MembershipNftDetaails> = await pocpGetter.getMembershipNftsForHash(
       `0xfje...vdvd` // transaction hash
 )
      // returns value MembershipNftDetaail
      {
        "id": "0x00c51890d6c9da0a7e85ed6682b8b59249f60f5f", // proxy contract address
        "name": "",
        "symbol": "",
        "txHash": "0x104d4adb421cb0b3e81b05549488e1fd3f75132bafe451971505607e419fd6f3"
      },

 
```

### 4. Get membershipNft for a claimer address and contract address
The `membershipNftWithClaimerOfDao` getter function takes the `claimer address` and `contract address` of `daoDeploy`, and returns the array of details of membership NFTs.

```javascript
      
 const membershipNfts = await pocpGetter.membershipNftWithClaimerOfDao(<Claimer-Address>,<Contract-Address>)
 
      // returns value MembershipNftDetaails
      [{
        "id": "0x00c51890d6c9da0a7e85ed6682b8b59249f60f5f", // proxy contract address
        "name": "",
        "symbol": "",
        "txHash": "0x104d4adb421cb0b3e81b05549488e1fd3f75132bafe451971505607e419fd6f3"
      }{
        "id": "0x00c51890d6c9da0a7e85ed6682b8b59249f60f5f", // proxy contract address
        "name": "",
        "symbol": "",
        "txHash": "0x104d4adb421cb0b3e81b05549488e1fd3f75132bafe451971505607e419fd6f3"
      }],
 
```

### 4. Custom Query for getters
The `getForCustomQuery` getter function takes the `custom the graph protcol query` and `object of variables`, and returns the array of details of membership NFTs.

```javascript

const associationBadgeQuery = `
query($claimer: String,$contractAddress:String ) {
  associationBadges(where:{claimer:$claimer,contractAddress:$contractAddress}){
    id
    metadatUri
    claimer
    type
    txHash
    membershipId
    contractAddress{
      id
    }
    tokenID
  }
}
`;

const associationBadgeVariable = {claimer:"0x565CB...e9C7",contractAddress:"0x5544...fdq31" }
      
 const customResult = await pocpGetter.subgraphGetterFunction(associationBadgeQuery,associationBadgeVariable)
 
```

## License
[MIT](https://choosealicense.com/licenses/mit/)
