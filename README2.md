# rep3 protocol SDK

`rep3-sdk` is the ts package for projects to integrate rep3-protocol and services in their projects. This documentation will provide various ways and code snippets for the same. To know more about the protocol head over to our [docs](https://docs.rep3.gg/)


## rep3 protocol
rep3-protocol enables communities to
- create and distribute membership badges
- create and distribute contribution/participation badges with membership badge as owner
- distribute consent-first soulbound ERC721s
- and more..



## sdk

### Installation

Install the package with yarn or npm:

```bash
npm i rep3-sdk
yarn add rep3-sdk
```

### Configure rep3 client

```javascript
import Rep3 from "rep3-sdk"


// configure chains
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


// Biconomy if you want use their relayer service for gasless experience on your project https://www.biconomy.io/
import { Biconomy } from "@biconomy/mexa"
config = {
      biconomyInstance:Biconomy,
      apiKey: "<api_key_biconomy>", // get it once you setup biconomy
      relayURL: "<rpc_url>", // get it once you setup biconomy
}

// instantiate the client

const rep3 = new Rep3(
      signer, null, walletProvider, chainId,
      contractAddressConfig
      config
)
await rep3.createInstance()
```


### register a new community on rep3 (deploy a new ERC 721 contract)

Registering community is equivalent to creating a new erc721 collective. Community has `approvers` with permission to dsitribute badges, upgrade/downgrade membership levels etc. Sender of this transaction becomes default `owner` of the community

```javascript
await rep3.deploy(
      "<community_name__erc721_name>", 
      "<community_badge_symbol__erc721_symbol>",
      ["<approver_address>", "<approver_address>", ..]
      callback_function_tx_reciept, //triggered once hash is received
      callback_function_confirming_events, //triggered once tx is confirmed
)
```
>Note: `callback_function_tx_reciept` callback will be triggered with transaction reciept as parameter and `callback_function_confirming_events` callback will be triggered with contract emmitted events as parameters


`callback_function_tx_reciept` callback functions can be listened for transaction hash which can be used to get the contract address of community


### Membership badges

rep3-protocol is consent first protocol for soulbound tokens. Direct minting of these tokens is not possible. Every membership badge **must** go through the following steps

- approve membership (by approver)
-- Membership badges can only be approved by approvers defined while deploying the community contract. Approval creates a `MembershipVoucher` based on [EIP-712](https://eips.ethereum.org/EIPS/eip-712) using `createMembershipVoucher`. 
Details on the voucher specs below

- claim memberships (by claimer)
-- MembershipVoucher can be claimed by the user/member of the community using `claimMembership`

#### 1. Approve membership badge

`createMembershipVoucher` takes following parameters:

- community contract address
- array of levels as integer array
- array of categories as integer array
- array of member/claimer address
- comma seperated string of arweave or ipfs metadata hash
  


> Length of all the arrays and number of hashes MUST be same

```javascript
const signedVoucher:<signedVoucher> = await rep3.createMembershipVoucher(
            contractAddress,
            [1,2],      // [<Levels of membership represented in 0,1...etc.>]
            [2,4],      // [<Levels of categories represented in 0,1...etc.>]
            ["0x0EB...4b53","0x0FG...3s67"],   // [<claimer address>]
            "AdaDsjj...DGdI,Sdgguedsj...sfgadfD,",    //<string of metadata_hash seperated by comma>
        )
```
> metadata string MUST have a `,` at the end

returns a signed voucher (slightly modified). you can store this object in your database, ipfs, arweave or even transfer this to the claimer and they should be able to claim the appropriate badge

```javascript
{
    "data":[257, 128], // level and category are packed together as data to save some storage slots
    "end":[1], // ignore this.. this is internal implementation to save some computation
    "to":["0x0EB...4b53","0x0FG...3s67"],
    "tokenUris":"AdaDsjj...DGdI,Sdgguedsj...sfgadfD,",
    "signature":"0xc7453943fc82666aa5352d7a6fad6ca017eb4ce97d750a7f84604c501d5778ea06e61ffab6f7b56bfba765809376dbc0407639b3c923168f7c4cd7c5543cf28a1c"
}
```

### 3. Claiming membership NFT
`claimMembershipNft` takes the following parameters
- community contract address
- signed voucher (see above)
- index of claimer address in voucher (starting from 0)
- callback_function_tx_reciept
- callback_function_confirming_events

```javascript

await rep3.claimMembershipNft(
        contractAddress,
        "<signed_voucher>", 
        0,  //<index of address in signed voucher>
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
      // returns value MembershipNftDetail
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
 
      // returns value MembershipNftDetails
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
