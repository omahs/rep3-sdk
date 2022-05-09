# POCP Service SDK

Inspired by POAP(Proof of Attendance Protocol), the Proof of Contribution protocol (or POCP for short) allows communities to mint contribution badges for the contributions by their community members.
Badges are Soulbound and verified by peers
This document details the technical specifications and integration process. 


## Installation

Install the package with yarn or npm:

```bash
npm install pocp-service-sdk
yarn add pocp-service-sdk
```

## Getting Started

The following steps show how to set up the POCP Service SDK, signup for a new Community, approve a POCP badge and claim the approved badge for the contributor. These interaction can be done directly through contract interaction or a relayer

### 1. Registring the DAO with POCP

Register function takes the name of Dao and an array of owners as required parameters. For listening to the event emitted you could pass it as event callback which gets event emitted as parameter

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

### 2. Approving a POCP badge for contributors
Approve function takes the community Id, array of claimer's addresses, array of IPFS URL, and array of identifiers. For listening to the event emitted you could pass it as an event callback which gets the event emitted as a parameter

```javascript

 const res = await pocp.approveBadgeToContributor(
       12, // community id as int *required
       ["0x0EB...4b53"], // array of claimer's addresses *required
       ["ipfs://baf.....di"],// array of ipfs metadata uri *required
       ["afk..13"], // array of identifier or id *required
       (eventEmitted)=>{} // callback function fires when event is emmitted
 )
```

### 3. Claiming a POCP badge by contributors
The claim function takes an array of token Ids as parameters For listening to the event emitted you could pass it as an event callback which gets the event emitted as a parameter

```javascript

 const res = await pocp.claimBadgesByClaimers(
       [1], //aray of token ids to be claimed
       (eventEmitted)=>{} // callback function fires when event is emmitted
 )
```

### 4. Get all approved POCP badges for a community
This getter function takes the community Id as parameters and returns the list of approved tokens for the Dao

```javascript
 import { PocpGetters } from "pocp-service-sdk"

 const pocpGetter = new PocpGetters()
 const approvedToken = await pocpGetter.getApproveBadges(
       "1" // community id * required
 )
```
### 5. Get all claimed POCP badges for a community
This getter function takes the community Id as parameters and returns the list of claimed tokens for the Dao

```javascript

 const claimedToken = await pocpGetter.getClaimedBadges(
       "1" // community id * required
 )
```
### 6. Get all claimed POCP badges for a contributor to a community
This getter function takes the community Id and address as parameters and returns the list of claimed tokens for the contributor of a Dao

```javascript

 const claimedToken = await pocpGetter.getClaimedBadgesOfClaimers(
       "1", // community id * required
       "0x0EB...4b53"
 )
```
### 7. Get all unclaimed POCP badges for a community
This getter function takes the community Id as parameters and returns the list of unclaimed tokens for the Dao

```javascript

 const unclaimedToken = await pocpGetter.getUnclaimedBadges(
       "1" // community id * required
 )
```


## License
[MIT](https://choosealicense.com/licenses/mit/)
