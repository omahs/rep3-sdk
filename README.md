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

```javascript

      daoName: string,
      daoSymbol: string,
      approverAddresses: [string],
      upgradeableBeacon: string,
      _trustedForwarder: string,
      transactionHashCallback: Function,
      callbackFunction?: Function

const res = await pocp.registerDaoToPocp(
      "<YourDAOName>", 
      "<YourDAOERC721Symbol>",
      ["<approverAddress_1>", "<approverAddress_2>", ..]
      "0x083842b3F6739948D26C152C137929E0D3a906b9 (for mainnet) / 0xDcc7133abBA15B8f4Bf155A372C17744E0941f28 (for mumbai)",
      "0xB9Acf5287881160e8CE66b53b507F6350d7a7b1B (for mainnet) / 0x1C6D20042bfc8474051Aba9FB4Ff85880089A669 (for mumbai)",,
      callback_function, //triggered once hash is received
      callback_function, //triggered once tx is confirmed
)
```
### 2. Approving membership
Before contributors can mint the badge to their addresses, the community admins must "ready" the badge for claiming. This is done via the `createMembershipVoucher` function. It takes the proxy contract address of a dao, array of levels in int,array of category in int, to is the array of index <explain from somesh>, string of arweave or ipfs metadata hash seperating it by comma. For supporting back versioning of rep3 protocol, we have sign type version for different updates. The current rep3 Protocol supports "signTypedDatav2.0" and should be passed as a params.

```javascript

      proxyAddress: string,
      levels: [number],
      categories: [number],
      end: [number],
      to: [string],
      tokenUris: string,
      signType: string

 const res = await pocp.createMembershipVoucher(
            contractAddress,
            [1,2],
            [2,4],
            [],
            ["0x0EB...4b53","0x0FG...3s67"],
            "AdaDsjj...DGdI,Sdgguedsj...sfgadfD,",
            "signTypedDatav2.0"
        )
```

### 3. Claiming membership NFT
The voucher created by the admin or approver of dao by signing the membership approval can be used to claim membership NFT by the contributor or the member of dao by using `claimMembershipNft`. The function takes proxy contract address of a dao, signed voucher, index of address in signed voucher, version of sign used while approving membership. In case you want to listen to the event emitted, you can pass it as an  callbackFunction which takes the event emitted as its parameter. Or you can get the transaction reciept by getting the params of transaction hash callback function.

      ```javascript

      contractAddress: string,
      voucher: any,
      approvedAddressIndex: number,
      signType: string,
      transactionHashCallback: Function,
      callbackFunction?: Function

      await pocp.claimMembershipNft(
            contractAddress,
            <Signed-Voucher>,
            0, //index of address in signed voucher
            "signTypedDatav2.0",
            (x) => console.log("Tranaction Reciept callback", x),
            (x) => console.log("Transaction Confirmation callback", x),
      )
      ```

### 4. Upgrading membership NFT
Approver of a dao can upgrade or downgrade membership NFTs of a contributor or a member of dao via `upgradeMembershipNft` by passing dao's contract address, tokenId of the membership NFT, level to which it should be upgraded or downgraded, category to which it should be upgraded or downgraded, ipfs or arweave hash for the NFT. In case you want to listen to the event emitted, you can pass it as an  callbackFunction which takes the event emitted as its parameter. Or you can get the transaction reciept by getting the params of transaction hash callback function.

```javascript

      contractAddress: string,
      tokenId: any,
      level: number,
      category: number,
      metaDataHash: string,
      transactionHashCallback: Function,
      callbackFunction?: Function

await pocp.upgradeMembershipNft(
        contractAddress,
        1,
        2,
        3,
      "AdaDsjj...DGdI",
       (x) => console.log("Tranaction Reciept callback", x),
       (x) => console.log("Transaction Confirmation callback", x)
    )
```

### 5. Claiming Association Badges
The voucher created by the admin or approver of dao by signing the contribution approval can be used to claim association NFT by the contributor or the member of dao by using `claimContributionBadges`. The function takes proxy contract address of a dao, signed voucher,membershipNFT token Id of contributor, index of address in signed voucher. In case you want to listen to the event emitted, you can pass it as an  callbackFunction which takes the event emitted as its parameter. Or you can get the transaction reciept by getting the params of transaction hash callback function.

`Note : It is adviced to keep the length of array same as the array of address. Keep an element in arrayOfData to be 0 as default.`

```javascript

      contractAddress: string,
      voucher: any,
      memberTokenId: number,
      approveIndex: [number],
      transactionHashCallback: Function,
      callbackFunction?: Function

await pocp.claimContributionBadges(
            contractAddress,
            voucher,
            1,
            1,
            (x) => console.log("Tranaction Reciept callback", x),
            (x) => console.log("Transaction Confirmation callback", x)
        )
```

## Some Other Functions 

There are also some other functions that can, in general, help teams get their usage history of the protocol. These functions (as found in 
pocp-service-sdk/src/pocpGetters/index.ts) are described below. Let's go through them one-by-one.
>Note: These three interactions (and others mentioned later) can be done directly through interacting with contracts or through a relayer.

### 1. Get all approved badges for a community
The `getApproveBadges` getter function takes the community ID as a parameter, and returns the list of approved tokens for the DAO.

```javascript
 import { PocpGetters } from "pocp-service-sdk"

 const pocpGetter = new PocpGetters()
 const approvedToken = await pocpGetter.getApproveBadges(
       "1" // community id * required
 )
```
### 2. Get all claimed badges for a community
The `getClaimedBadges` getter function takes the community ID as a parameter, and returns the list of claimed tokens for the DAO.

```javascript

 const claimedToken = await pocpGetter.getClaimedBadges(
       "1" // community id * required
 )
```
### 3. Get all claimed POCP badges for a contributor to a community
The `getClaimedBadgesOfClaimers` getter function takes the community ID and claimer's address as parameters, and returns the list of claimed tokens for that specific contributor of the DAO.

```javascript

 const claimedToken = await pocpGetter.getClaimedBadgesOfClaimers(
       "1", // community id * required
       "0x0EB...4b53"
 )
```
### 4. Get all unclaimed badges for a community
The `getUnclaimedBadges` getter function takes the community ID as a parameter, and returns the list of unclaimed tokens for the DAO. 

```javascript

 const unclaimedToken = await pocpGetter.getUnclaimedBadges(
       "1" // community id * required
 )
```

### 5. Get community ID from transaction hash
The `getCommunityIdOfHash` getter function takes the transaction hash as a parameter, and returns the community details associated with the hash.

```javascript

 const communityIfo = await pocpGetter.getCommunityIdOfHash(
       "0xxsde...234" // transaction hash * required
 )
```

## License
[MIT](https://choosealicense.com/licenses/mit/)
