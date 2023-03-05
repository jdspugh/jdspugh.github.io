---
layout: post
title: Checking Decentralisation of Smart Contracts
---
# Blockchains & Decentralisation

One of the main purposes of blockchain technology is to provide decentralisation.

As part of human nature it seems that power and corruption more than often go hand in hand. One of the main aims of blockchain technology is to distribute power so that all members of a community hold the power rather than a single person or small group of people. This is essentially democracy embraced and enforced by technology. No central entity can overcome the group when blockchain technology is in use.

When it comes to blockchains themselves there are varying degrees of decentralisation amongst different blockchains. Ethereum at this point in time is the most decentralised smart contract blockchain so we will focus on this one for the time being to keep things simple.

Even though Ethereum is decentralised, centralised distributed applications (Dapps) can still be written. These recentralise power and go against the ethos of blackchain technology.

Dapps can be centralised in many ways and it's often not possible to thouroughly check a Dapp's smart contracts for signs of centralisation if the smart contracts are large and complex.

What I aim to do here is write some code to provide a guide to determining whether a smart contract could be centralised or not.

# Proxy Contracts

Currently the number one risk factor for Dapp users is the use of proxy contracts by the Dapp developer. Proxy contracts (sometimes called upgradeable contracts) allow the smart contract code to be replaced by new code by redirecting calls to the original code to another smart contract's code.

Proxy contracts can be a good thing if the developer wants to upgrade the existing functionality or fix bugs or exploits. Of course there is also the risk that they inadvertantly introduce new bugs, which is a risk even with the most well meaning developers.

The proxy contract pattern is of short term benefit only. The problems comes when the Dapp becomes successful. Now the temptation to abuse the power comes into play and there is little stopping it. Most proxy contracts today are protected by a single admin. Potentially a vote from the community members could be used to guard the code changes instead of a single admin. This could provide adequate decentralisation but I don't know of any proxy contracts using this method as of yet. Even so there is still the risk the new code could introduce unforseen bugs.

The proxy contract allows the admin to completely override the smart contract and run any other code in its place. The new code could be specifically designed to steal user's funds held or controlled by the smart contract.

In my view Dapps should be deployed as immutable, decentralised smart contracts (i.e. avoiding the proxy contract pattern). They may well contain bugs in which case they will hopefully soon be found before too much investment has been made in the Dapp. Bugs can also be largely mitigated by reserving a significant portion of its funds for bug bounty programs that white hat hackers can mutually benefit from. Hackers would rather benefit from legal rewards than have the complications of covering their tracks and risking jail time or other repercussions.

In the long term, as time progresses, certain immutable, decentralised smart contracts will prove themselves to be bullet proof and will last forever on blockchains, bug free, efficiently automating tasks for years to come.

# Other forms of Smart Contract Centralisation

It is often the case that an admin is assigned to a smart contract upon creation. The admin privleges can be transfered to other users after creation. The privleges can be used to activate features of the smart contract not available to other users. This is risky to the users if the smart contract allows admins to do things that could be detrimental to other users of the Dapp.

This form of centralisation differs significantly from certralisation due to proxy contracts. The smart contract code is on the blockchain, is immutable, and can be audited by anyone at anytime. So you can know what exploits (if any) the admin may attempt. In the case of a proxy contract you have no way to predict what the new smart contract might do and how you could be exploited. This is what makes them the most dangerous of all and is why they will be the focus of the rest of this article.

# Project Goals

To automate the analysis of smart contracts and determine if they are proxy contracts or not.

# Phase 1: Opcode Checker

A simple checker can be built by checking the opcodes used in building proxy smart contract. The three main opcodes used are:

|Opcode|Hex|Centralisation Risk|
|-|-|-|
| `DELEGATECALL` | F4 | 🔴🔴🔴 |
|`CALLCODE` | F2 | 🔴🔴 |
| `CALL` | F1 | 🔴 |

The most commononly used for proxy smart contracts is `DELEGATECALL`, then `CALLCODE`, then `CALL`. The results of the code will reflect this by counting the appearance of these opcodes in the bytecode and marking the centralisation risk with with red dots. Three red dots indicating the highest chance of centralisation i.e. the use of `DELEGATECALL`. This is the code:

```javascript
import dotenv from 'dotenv';dotenv.config()
import EVM from 'evm'
import Web3 from 'web3'
import { markdownTable } from 'markdown-table'

async function check(blockchain, address, name='') {
  const web3 = new Web3('https://mainnet.infura.io/v3/'+process.env.INFURA_API_KEY)
  const r = []// result
  await web3.eth.getCode(web3.utils.toChecksumAddress(address)).then(code=>{
    const evm = new EVM.EVM(code)
    let o = evm.getOpcodes()
    r.push(o.filter(o=>'DELEGATECALL'==o.name).length||'')// opcode F4
    r.push(o.filter(o=>'CALLCODE'==o.name).length||'')// opcode F2
    r.push(o.filter(o=>'CALL'==o.name).length||'')// opcode F1
  })
  return r
}

let tokens = (await(await fetch('https://api.ethplorer.io/getTop?criteria=cap&apiKey='+(process.env.ETHPLORER_API_KEY||'freekey'))).json()).tokens.map(t=>{t.blockchain='ETH';return t})
tokens = tokens.slice(0,10)
const table = [['DELEGATECALL', 'CALLCODE', 'CALL', 'Address', 'Name', 'Symbol', 'Decentralisation']];
for (const token of tokens) {
  const r = await check(token.blockchain, token.address, token.symbol)// opcode counts
  let d = '✅ Decentralised'// decentralised?
  if (r[0]+r[1]+r[2]>0) {
    if (r[0]>0) d = '🔴🔴🔴'
    else if (r[1]>0) d = '🔴🔴'
    else if (r[2]>0) d = '🔴'
    d += ' Potentially Centralised'
  }
  table.push([
    ...r,
    token.address,
    token.name,
    token.symbol,
    d,
  ])
}
console.log(markdownTable(table))
```

You can run the code above and it will produce a table which lists the top tokens on the Ethereum blockchain by market cap. Each token's smart contract is checked for the three opcodes we are looking for. Based on the results a decentralisatin rating is given.

| DELEGATECALL | CALLCODE | CALL | Address                                    | Name              | Symbol | Decentralisation               |
| ------------ | -------- | ---- | ------------------------------------------ | ----------------- | ------ | ------------------------------ |
|              |          |      | 0x0000000000000000000000000000000000000000 | Ethereum          | ETH    | ✅ Decentralised                |
|              |          | 6    | 0xdac17f958d2ee523a2206206994597c13d831ec7 | Tether USD        | USDT   | 🔴 Potentially Centralised     |
|              | 1        | 1    | 0xb8c77482e45f1f44de1745f52c74426c631bdd52 | Binance Coin      | BNB    | 🔴🔴 Potentially Centralised   |
| 1            |          | 1    | 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 | USD Coin          | USDC   | 🔴🔴🔴 Potentially Centralised |
|              |          | 2    | 0x2b591e99afe9f32eaa6214f7b7629768c40eeb39 | HEX               | HEX    | 🔴 Potentially Centralised     |
|              |          |      | 0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0 | Matic Network     | MATIC  | ✅ Decentralised                |
| 1            |          | 1    | 0x4fabb145d64652a948d72533023f6e7a623c7c53 | Binance USD       | BUSD   | 🔴🔴🔴 Potentially Centralised |
|              |          |      | 0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce | Shiba Inu         | SHIB   | ✅ Decentralised                |
| 1            |          | 1    | 0xae7ab96520de3a18e5e111b5eaab095312d7fe84 | Lido Staked Ether | STETH  | 🔴🔴🔴 Potentially Centralised |
|              |          |      | 0x6b175474e89094c44da98b954eedeac495271d0f | Dai               | DAI    | ✅ Decentralised                |

Ideally you want to be using smart contracts that are marked as decentralised (✅). If you are not you should look further into the smart contract and check the audit reports if available before investing too much into them.

We will go through these top 10 tokens and cross check the results of this simple bytecode analysis with the source code and audit reports to see how accurate the calculated centralisation risk ratings are.

Check back soon. Cross check audit results comming!