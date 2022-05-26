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

The three main functions of this protocol are creating a community, approving a badge and claiming the approved badge. These functions (as found in pocp-service-sdk/src/pocp/index.ts/) are described below. Let's go through them one-by-one. 
>Note: These three interactions (and others mentioned later) can be done directly through interacting with contracts or through a relayer.

### 1. Creating a community
The first step to using this protocol is creating a community. This is done by the community admin(s) using the `registerDaoToPocp` function. This takes the name of the DAO and array of owners' addresses as parameters. In case you want to listen to the event emitted, you can pass it as an event callback which takes the event emitted as its parameter.

```javascript
import Pocp from "pocp-service-sdk"

# add relyer_token for a gasless transaction
 const pocp = new Pocp(signer, provider,
 {
   relayer_token: "f1xxxxx-b2xx-44xx-9xxd-218xxxxxxf" //optional
 })
 await pocp.createInstance()
 const res = await pocp.registerDaoToPocp(
       "Drepute", // name *required
      ["0x0EB...4b53"], // array of string *required 
       (eventEmitted)=>{} // callback function fires when event is emmitted
 )
```

### 2. Approving a badge
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
