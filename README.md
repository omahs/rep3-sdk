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
      Biconomy,
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
The first step to using this protocol is registering community on the protocol. This is done by the community admin(s) using the `daoDeploy` function. This takes the name of the DAO and an array of owners' addresses as parameters. In case you want to listen to the event emitted, you can pass it as an event callback which takes the event emitted as its parameter.

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
      "<biconomy-trusted-forwarder>",
      callback_function, //triggered once hash is received
      callback_function, //triggered once tx is confirmed
)
```

### 2. Approving membership
Before contributors can mint the badge to their addresses, the community admins must "ready" the badge for claiming. This is done via the `approveBadgeToContributor` function. It takes the community ID and three arrays (of IPFS URLs, claimers' addresses, and Identifiers) as parameters. In case you want to listen to the event emitted, you can pass it as an event callback which takes the event emitted as its parameter.

```javascript

 const res = await pocp.approveBadgeToContributor(
       12, // community id as int *required
       ["0x0EB...4b53"], // array of claimer's addresses *required
       ["ipfs://baf.....di"],// array of ipfs metadata uri *required
       ["afk..13"], // array of identifier or id *required
       (eventEmitted)=>{} // callback function fires when event is emmitted
 )
```

### 3. Claiming the approved badge 
Finally, the contributors can claim the approved badges which mints them to their addresses. This happens via the `claimBadgesByClaimers` function, which takes an array of token IDs as its parameter. In case you want to listen to the event emitted, you can pass it as an event callback which takes the event emitted as its parameter.

```javascript

 const res = await pocp.claimBadgesByClaimers(
       [1], //array of token ids to be claimed
       (eventEmitted)=>{} // callback function fires when event is emmitted
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
