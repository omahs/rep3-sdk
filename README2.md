# rep3 protocol SDK

`rep3-sdk` is the ts package for projects to integrate rep3-protocol and services in their projects. This documentation will provide various ways and code snippets for the same. To know more about the protocol head over to our [docs](https://docs.rep3.gg/)


## rep3 protocol
rep3-protocol enables communities to
- create and distribute membership badges
- create and distribute contribution/participation badges with membership badge as owner
- distribute consent-first soulbound ERC721s
- and more..



## sdk

### => Installation

Install the package with yarn or npm:

```bash
npm i rep3-sdk
yarn add rep3-sdk
```

---

### => Configure rep3 client

```javascript
import Rep3 from "rep3-sdk"


// configure chains
// For Polygon mainnet
chainId = 137
contractAddressConfig ={
      manager: "0xDA6F4387C344f1312439E05E9f9580882abA6958",
      beacon: "0x083842b3F6739948D26C152C137929E0D3a906b9",
      router: "0xB9Acf5287881160e8CE66b53b507F6350d7a7b1B",
}

// For Polygon Mumbai
chainId = 80001
contractAddressConfig = {
      manager: "0xf00eAbb380752fed6414f3C12e3D8F976C7D024d",
      beacon: "0xDcc7133abBA15B8f4Bf155A372C17744E0941f28",
      router: "0x1C6D20042bfc8474051Aba9FB4Ff85880089A669",
}


// Biconomy if you want use their relayer service for gasless experience on your project https://www.biconomy.io/
import { Biconomy } from "@biconomy/mexa"
config = {
      biconomyInstance:Biconomy,
      apiKey: "<api_key_biconomy>",    // get it once you setup biconomy
      relayURL: "<rpc_url>",           // get it once you setup biconomy
}

// instantiate the client

const rep3 = new Rep3(
      signer, null, walletProvider, chainId,
      contractAddressConfig
      config
)
await rep3.createInstance()
```

---

### => Register a new community on rep3 (deploy a new ERC 721 contract)

Registering community is equivalent to creating a new erc721 collective. Community has `approvers` with permission to dsitribute badges, upgrade/downgrade membership levels etc. Sender of this transaction becomes default `owner` of the community

```javascript
await rep3.deploy(
      "<community_name__erc721_name>", 
      "<community_badge_symbol__erc721_symbol>",
      ["<approver_address>", "<approver_address>", ..]
      callback_function_tx_reciept,        //triggered once hash is received
      callback_function_confirming_events, //triggered once tx is confirmed
)
```
>Note: `callback_function_tx_reciept` callback will be triggered with transaction reciept as parameter and `callback_function_confirming_events` callback will be triggered with contract emmitted events as parameters

>Note: callbacks can be configured throughout sdk in other functions as well 

---

### => Membership badges

rep3-protocol is consent first protocol for soulbound tokens. Direct minting of these tokens is not possible. Every membership badge **must** go through the following steps

- approve membership (by approver)
-- Membership badges can only be approved by approvers defined while deploying the community contract. Approval creates a `MembershipVoucher` based on [EIP-712](https://eips.ethereum.org/EIPS/eip-712) using `createMembershipVoucher`. 
Details on the voucher specs below

- claim memberships (by claimer)
-- MembershipVoucher can be claimed by the user/member of the community using `claimMembership`

- upgrade memberships (by approver)
-- memberships can optionally be upgraded to new levels and categories

#### 1. Approve membership badge

`createMembershipVoucher` takes following parameters:

- community contract address
- array of levels as integer array
- array of categories as integer array
- array of member/claimer address
- comma seperated string of arweave or ipfs metadata hash
  


>Note: Length of all the arrays and number of hashes MUST be same

```javascript
const signedVoucher:<signedVoucher> = await rep3.createMembershipVoucher(
            contractAddress,
            [1,2],                                    // [<Levels of membership represented in 0,1...etc.>]
            [2,4],                                    // [<Levels of categories represented in 0,1...etc.>]
            ["0x0EB...4b53","0x0FG...3s67"],          // [<claimer address>]
            "AdaDsjj...DGdI,Sdgguedsj...sfgadfD,",    //<string of metadata_hash seperated by comma>
        )
```
>Note: metadata string MUST have a `,` at the end

returns a signed voucher (slightly modified). you can store this object in your database, ipfs, arweave or even transfer this to the claimer and they should be able to claim the appropriate badge

```javascript
{
    "data":[257, 128],  // level and category are packed together as data to save some storage slots
    "end":[1],          // ignore this.. this is internal implementation to save some computation
    "to":["0x0EB...4b53","0x0FG...3s67"],
    "tokenUris":"AdaDsjj...DGdI,Sdgguedsj...sfgadfD,",
    "signature":"0xc7453943fc...c5543cf28a1c"
}
```

#### 2. Claim membership
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
        0,                                   //<index of address in signed voucher>
        callback_function_tx_reciept,        //triggered once hash is received
        callback_function_confirming_events, //triggered once tx is confirmed
  )
```


#### 3. Upgrade / Downgrade memberships

Memberships can be pnly be upgraded / downgraded by `approver` using `upgradeMembership`

`upgradeMembership` takes the following parameters
- community contract address
- membership token id to be upgraded
- new level of membership
- new categroy of membership
- new metadata hash of membership token
- callback_function_tx_reciept
- callback_function_confirming_events
```javascript

await rep3.upgradeMembership(
        contractAddress,
        1,                                 //<membershipNft token id>
        2,                                 //<Upgrading level represented in number>
        3,                                 //<Upgrading category represented in number>
      "adadsjj...dgdi",                    //<metadata_hash of upgrading NFT>
      callback_function_tx_reciept,        //triggered once hash is received
      callback_function_confirming_events, //triggered once tx is confirmed
    )
```
---

### => Association Badges
Association badges are the badges that are attached to membership badges. There can be `255` types of association badges starting from 1 (membership badge is of type `0` by default). Association badges can be issued via `BadgeVoucher` where `approver` signs a voucher and `claimer` claims. They can also be directly minted (not recommended as it does not involve consent).



#### 1. Approve association badge
`createAssociationBadgeVoucher` takes the following parameters
- community contract address
- array of member token ids
- array of badge types
- comma seperated string of arweave or ipfs metadata hash
- array of member nonces ([how does nonce work?](#how-does-nonce-work))
- array of data (optional and can be ignored)

```javascript
await rep3.createAssociationBadgeVoucher(
            contractAddress,
            [1, 2],                                // membership token ids
            [1, 1],                                // array of badge types
            "AdaDsjj...DGdI,Sdgguedsj...sfgadfD,", // metadata
            [1, 3],                                // array of nonces
        )
```
returns a signed voucher similar to membership voucher

```javascript
{
    index: 0,
    memberTokenIds: [1, 2],
    type_: [1, 1],
    tokenUri: "AdaDsjj...DGdI,Sdgguedsj...sfgadfD,",
    data: [0, 0], // ignore this
    nonces: [1, 3],
    signature: "signature":"0xc7453943fc...c5543cf28a1c"
}
```

#### 2. claim association badge
`claimAssociationBadges` takes the following parameters
- community contract address
- signed badge voucher
- claimer's membership token id
- index of claimer membership token id in voucher (starting from 0) 
- callback_function_tx_reciept
- callback_function_confirming_events


```javascript
await rep3.claimAssociationBadges(
            contractAddress,
            "<signed_voucher>",
            1,                                  //<membershipNft token id>
            1,                                  //<index of address in signed voucher>
            callback_function_tx_reciept,       //triggered once hash is received
            callback_function_confirming_events, //triggered once tx is confirmed
        )
```

---

### => Utility functions 

Utitlity functions are getter function that get the data from subgraphs

>Note: These three interactions (and others mentioned later) can be done directly through interacting with contracts or through a relayer.

>Note: As Rep3 Protocol makes uses of subgraphs for quering contract. Devs can write their custom logics on rep3 subgraph

```
      Rep3 Subgraph Urls
      mumbai https://api.thegraph.com/subgraphs/name/eth-jashan/rep3-mumbai
      matic https://api.thegraph.com/subgraphs/name/eth-jashan/rep3-matic
```

#### 1. Initialization
The PocpGetters class is initiated by the subgraph url.

```javascript
 import { Rep3Getters } from "rep3-sdk"
      
 const rep3Getter = new Rep3Getters(<Mumbai-Subgraph-url/Matic-Subgraph-url>)

```
#### 2. Get community contract address from transaction hash

`getCommunutyFromTx` takes the following parameters
- transaction hash (from `deploy`)

```javascript
 const community = await rep3Getter.getCommunutyFromTx(
       `0xfsfs...sfaiee`         // transaction hash
 )
```
and returns the details of community contract
```javascript
{
      "id": "0x00c51890d...249f60f5f",                      // community contract address
      "name": "<community_name__erc721_name>",
      "symbol": "<community_badge_symbol__erc721_symbol>",
      "txHash": "0x104d4adb421....fe451971505607e419fd6f3"
}
```

#### 3. Get membership from transaction hash
`getMembershipFromTx` takes the following parameters
- transaction hash (from `claimMembershipNft` )

```javascript
      
 const membership = await rep3Getter.getMembershipFromTx(
       `0xfje...vdvd` // transaction hash
 )
 ```
 and returns the membership details
 ```javascript
{
      "id": "0x00c5189...b8b59249f60f5f",                 // proxy contract address
      "name": "",
      "symbol": "",
      "txHash": "0x104d4adb42...e451971505607e419fd6f3"
},
```

#### 4. Get membership for a claimer address and contract address
`membershipFromClaimerCommunity` takes the following parameters
- claimer address
- community contract address

```javascript 
 const membershipNfts = await pocpGetter.membershipFromClaimerCommunity("<claimer_address>","<contract_address>")
```

returns array of membership details
```javascript
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

#### 4. Custom Query

Developers can send custom graph query using `getForCustomQuery`

`getForCustomQuery` takes the following parameters 
- graph protcol query` and `
- object of variables

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

### => Internals

#### How does nonce work?

Nonces are used as anti-replay attack mechanism, so that same voucher can not be claimed more than once. Contract stores a mapping of membership token id and last used nonce which can be obtained via contract call (we'll create a simpler api for this very soon in the sdk itself)

Vouchers approved by approvers should have different nonce. for eg

If current nonce from contract is 1, voucher signed for the user should be 2 and next one should be 3 (even if first voucher with nonce 2 is not claimed. We expect implementors to create a mechanism to manage nonces, although soon we'll open up API support which will abstract out the implementation).

>Note: Member is expected to claim voucher with nonce 2 first and then 3. If member claims voucher with nonce 3 before voucher with nonce 2, voucher nonce 2 will be discarded and can not be claimed.


### => License
[MIT](https://choosealicense.com/licenses/mit/)
