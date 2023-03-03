---
layout: post
title: Checking Decentralisation of Smart Contracts
---
# Blockchains & Decentralisation

One of the main purposes of blockchain technology is to provide decentralisation.

As part of human nature it seems that power and corruption more than often go hand in hand. One of the main aims of blockchain technology is to distribute power so that all members of a community hold the power rather than a single person or small group of people. This is essentially democracy embraced and enforced by technology. No central entity can overcome the group when blockchain technology is in use.

When it comes to blockchains themselves there are varying degrees of decentralisation amoungst different blockchains. Ethereum at this point in time is the most decentralised smart contract blockchain so we will focus on this one for the time being to keep things simple.

Even though Ethereum is decentralised, centralised distributed applications (Dapps) can still be written. These recentralise power and go against the ethos of blackchain technology.

Dapps can be centralised in many ways and it's often not possible to thouroughly check a Dapp's smart contracts for signs of centralisation if the smart contracts are large and complex.

What I aim to do here is write some code to provide a guide to determining whether a smart contract could be centralised or not.

# Proxy Contracts

The number one risk factor for Dapps is the use of proxy contracts (sometimes called upgradeable contracts). This allows a central entiy to completely override the entire smart contract and place any other code in its place. The new code could have bugs, or worse, be specifically designed to steal user's funds.

Although proxy contracts can potentially be decentralised by being controlled by the Dapp's community at large through an onchain DAO voting process this is not the case with most proxy contracts today. So we will still be marking proxy contracts as the number of risk factor for users via centralised control.

Arguably proxy contracts can be good if you want to fix bugs that could be exploited (or are currently being exploited). But this is a short term viewpoint because if the Dapp becomes very powerful it will be at risk of corruption due to the factors mentioned before.

In my view Dapps should be deployed as immutable, decentralised smart contracts. They may well contain bugs in which case they will hopefully soon be found before too much investment has been made in the Dapp. Bugs can also be largely mitigated by reserving a signification portion of its funds for bug bounty programs that white hat hackers can mutually benefit from. Hackers would rather benefit from legal rewards than have the complications of covering their tracks and risking jail time.

As time progresses certain immutable, decentralised smart contracts will prove themselves to be bullet proof and will last forever on blockchains, bug free, efficiently automating tasks for years to come.

# Other forms of Smart Contract Centralisation

It is often the case that an admin is assigned to a smart contract upon creation. The admin privledges can be transfered to other users after creation. The privledges can be used to activate features of the smart contract not available to other users. This is risky to the users if the smart contract allows admins to do thing that could be detrimental to other users of the Dapp.

This differs significantly from certralisation due to proxy contracts. The smart contract code is immutable and can be autidted by anyone at anytime. So you can know what exploits (if any) the admin may attempt. In the case of a proxy contract you have no way to predict what the new smart contract might do and how you could be exploited. This is what makes them the most dangerous of all and is why they will be the focus of the rest of this article.

# Project Goals

To automate the analysis of smart contracts and determine if they are proxy contracts or not.

# Phase 1: Opcode Checker

A simple checker can be built by checking the opcodes used in building proxy smart contract. The three main opcodes used are:

|Opcode|Hex|
|-|-|
| `DELEGATECALL` | F4 |
|`CALLCODE` | F2 |
| `CALL` | F1 |

Check back here soon. Code coming!