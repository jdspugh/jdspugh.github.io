---
layout: post
title: Checking Decentralisation of Smart Contracts
---
# Blockchains & Decentralisation

One of the main purposes of blockchain technology is to provide decentralisation.

As part of human nature it seems that power and corruption more than often go hand in hand. One of the main aims of blockchain technology is to distribute power so that all members of a community hold the power rather than a single person or small group of people. This is essentially democracy embraced and enforced by technology. No central entity can overcome the group when blockchain technology is in use.

When it comes to blockchains themselves there are varying degrees of decentralisation amongst different blockchains. Ethereum at this point in time is one of the most decentralised smart contract blockchain so we will focus on this one for the time being to keep things simple.

Even though Ethereum is decentralised, centralised distributed applications (Dapps) can still be written. These recentralise power and go against the ethos of blockchain technology.

Dapps can be centralised in many ways and it's often not possible to thoroughly check a Dapp's smart contracts for signs of centralisation if the smart contracts are large and complex. What I aim to do here is write some code to provide a guide to determining whether a smart contract could be centralised or not.

# Proxy Contracts

Currently the number one risk factor for Dapp users is the use of proxy contracts by the Dapp developer. Proxy contracts (sometimes called upgradeable contracts) allow the smart contract code to be replaced by new code by redirecting calls to the original code to another smart contract's code.

Proxy contracts can be a good thing if the developer wants to upgrade the existing functionality or fix bugs or exploits. Of course there is also the risk that they inadvertently introduce new bugs, which is a risk even with the most well meaning developers.

The proxy contract pattern is of short term benefit only. The problems comes when the Dapp becomes successful. Now the temptation to abuse the power comes into play and there is little stopping it. Most proxy contracts today are protected by a single admin.

Potentially a vote from the community members could be used to guard the code changes instead of a single admin. This could provide adequate decentralisation but I don't know of any proxy contracts using this method as of yet. Even with decentralised proxy contracts there is still the risk that the new code could introduce unforeseen bugs. But it's a much better option that a centralised admin.

Proxy contracts allow the admins to completely override the smart contract and run any other code in its place. The new code, in the worst case, could be specifically designed to steal user's funds held or to be otherwise controlled by the smart contract.

In my view, to stay with the ethos of blockchain decentralisation, Dapps should be deployed as immutable smart contracts (i.e. avoiding the proxy contract pattern). They may well contain bugs in which case they will hopefully soon be found (through auditing or experience using the contract) before too much investment has been made in the Dapp. Bugs can also be largely mitigated by reserving a significant portion of its funds for bug bounty programs that white hat hackers can mutually benefit from. Hackers would rather benefit from legal rewards than have the complications of covering their tracks and risking jail time or other repercussions.

In the long term, as time progresses, certain immutable, decentralised smart contracts will prove themselves to be bullet proof and will last forever on blockchains, bug free, efficiently automating tasks for years to come.

# Other forms of Smart Contract Centralisation

Apart from proxy contracts, in the case of decentralised smart contract, is often the case that a single centralised admin is assigned to the smart contract upon the contract's creation. The admin privileges can often be allowed to be transferred to other users after creation. The privileges can be used to activate features of the smart contract not available to other users. This is risky to the users if the smart contract allows admins to do things that could be detrimental to other users of the Dapp.

An example of detrimental actions would be minting new tokens for an ERC-20 contract and squandering them (if they are put to good use then minting can be beneficial). If there is no limit on this it's possible for the admin to mint a lot of new tokens and sell them causing the price of the token to fall and diluting the worth of the other holders of the token. Again it's the temptation of centralised power on powerful smart contracts that should be avoided.

This form of centralisation in decentralised smart contracts differs significantly from centralised proxy contracts. The decentralised smart contract code is immutably on the blockchain and can be audited by anyone at anytime. So you can know what exploits (if any) the admin may attempt. In the case of any proxy contract you have no way to predict what the new smart contract might do and how it could be exploited. This is what makes them the most dangerous of all for the users and is why they will be the focus of the rest of this article.

# Project Goals

To automate the analysis of smart contracts and determine if they are proxy contracts or not.

# Phase 1: Opcode Checker

A simple checker can be built by checking the opcodes used in building proxy smart contract. The three main opcodes used are:

| Opcode | Hex | Centralisation Risk |
|-|-|-|
| `DELEGATECALL` | F4 | 🔴🔴🔴 |
| `CALLCODE` | F2 | 🔴🔴 |
| `CALL` | F1 | 🔴 |

(It should be noted that `CALLCODE` is deprecated and has been replaced by `DELEGATECALL`, even so we should still check for it in case it is still being used.)

The most commonly used opcodes for proxy smart contracts are `DELEGATECALL`, then `CALLCODE`, then `CALL`. The results of the code tool will reflect this ordering by counting the appearance of these opcodes in the bytecode and marking the centralisation risk with with red dots. Three red dots indicating the highest chance of centralisation i.e. the use of `DELEGATECALL`. This is the code:

`phase1.mjs`
```js
import dotenv from 'dotenv';dotenv.config()
import EVM from 'evm'
import Web3 from 'web3'
import { markdownTable } from 'markdown-table'

async function check(address, name='') {
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

let tokens = (await(await fetch('https://api.ethplorer.io/getTop?criteria=cap&apiKey='+(process.env.ETHPLORER_API_KEY||'freekey'))).json()).tokens
tokens = tokens.slice(0,10)
const table = [['DELEGATECALL', 'CALLCODE', 'CALL', 'Address', 'Name', 'Symbol', 'Decentralisation']];
for (const token of tokens) {
  const r = await check(token.address, token.symbol)// opcode counts
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

`.env`
```
INFURA_API_KEY=<your infura api key>
ETHPLORER_API_KEY=freekey
```

You can run the code above and it will produce a table which lists the top tokens on the Ethereum blockchain by market cap. Each token's smart contract is checked for the three opcodes we are looking for. Based on the results a decentralisation rating is given.

`$ node phase1.mjs`

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

You don't want to invest much into centralised smart contract projects because it is impossible to audit something that can change at any moment. Your investment is completely under the control of the centralised hands of the admin.

Ideally you want to be using the smart contracts that are marked as "✅ Decentralised". In this case you can be sure that the code will not change. You can get an independent audit, or check existing public audits, and have a degree of confidence based on the results of these reports knowing that the code will never change.

## Auditing Cross Check

We will go through these top 10 tokens (by market capitalisation) and cross check the centralised smart contracts that the bytecode analysis tool detected with the source code and public audit reports to see how accurate the tool's calculated centralisation risk ratings are. There is no need to check the "✅ Decentralised" contracts as they are, for sure, immutable decentralised contracts.

### USDT - Tether

<https://etherscan.io/address/0xdac17f958d2ee523a2206206994597c13d831ec7#code>

The above link's page contains the Contract Security Audit [Callisto Network - July 10th, 2019](https://callisto.network/tether-token-usdt-security-audit/). The report states:

_"4 owner privileges (the ability of an owner to manipulate contract, may be risky for investors)"_

_"Owner can upgrade contract using deprecate and implement any logic in the new contract. And even if the new contract will be audited, at any time possible to change the address of the new contract again to not audited and insecure."_

This is the code of the `deprecate()` method:

```solidity
    // deprecate current contract in favour of a new one
    function deprecate(address _upgradedAddress) public onlyOwner {
        deprecated = true;
        upgradedAddress = _upgradedAddress;
        Deprecate(_upgradedAddress);
    }
```

The Tether smart contract is unusual in that it uses `CALL` rather than `DELEGATECALL` to implement its proxy contract functionality. This makes it harder to detect by an automated tool such as ours. Even so, we can see manually that in the code below 6 calls made with the `StandardToken(upgradedAddress)` prefix. This accounts for the 6 `CALL` opcodes found by the tool and verifies the statement made above in the public audit about the owner being able to change the contract at any time (i.e. it is a proxy contract).

```
    // Forward ERC20 methods to upgraded contract if this one is deprecated
    function transfer(address _to, uint _value) public whenNotPaused {
        require(!isBlackListed[msg.sender]);
        if (deprecated) {
            return UpgradedStandardToken(upgradedAddress).transferByLegacy(msg.sender, _to, _value);
        } else {
            return super.transfer(_to, _value);
        }
    }

    // Forward ERC20 methods to upgraded contract if this one is deprecated
    function transferFrom(address _from, address _to, uint _value) public whenNotPaused {
        require(!isBlackListed[_from]);
        if (deprecated) {
            return UpgradedStandardToken(upgradedAddress).transferFromByLegacy(msg.sender, _from, _to, _value);
        } else {
            return super.transferFrom(_from, _to, _value);
        }
    }

    // Forward ERC20 methods to upgraded contract if this one is deprecated
    function balanceOf(address who) public constant returns (uint) {
        if (deprecated) {
            return UpgradedStandardToken(upgradedAddress).balanceOf(who);
        } else {
            return super.balanceOf(who);
        }
    }

    // Forward ERC20 methods to upgraded contract if this one is deprecated
    function approve(address _spender, uint _value) public onlyPayloadSize(2 * 32) {
        if (deprecated) {
            return UpgradedStandardToken(upgradedAddress).approveByLegacy(msg.sender, _spender, _value);
        } else {
            return super.approve(_spender, _value);
        }
    }

    // Forward ERC20 methods to upgraded contract if this one is deprecated
    function allowance(address _owner, address _spender) public constant returns (uint remaining) {
        if (deprecated) {
            return StandardToken(upgradedAddress).allowance(_owner, _spender);
        } else {
            return super.allowance(_owner, _spender);
        }
    }

    // deprecate current contract in favour of a new one
    function deprecate(address _upgradedAddress) public onlyOwner {
        deprecated = true;
        upgradedAddress = _upgradedAddress;
        Deprecate(_upgradedAddress);
    }

    // deprecate current contract if favour of a new one
    function totalSupply() public constant returns (uint) {
        if (deprecated) {
            return StandardToken(upgradedAddress).totalSupply();
        } else {
            return _totalSupply;
        }
    }
```

Conclusion: USDT is ❌ Centralised

### BNB - Binance Coin

<https://etherscan.io/token/0xB8c77482e45F1F44dE1745F52C74426C631bDD52#code>

From the Etherscan link we can see this function sends ETH from the contract to the `owner` via the `transfer` function. This will be compiled into bytecode which contains one `CALL` opcode.

```solidity
	// transfer balance to owner
	function withdrawEther(uint256 amount) {
		if(msg.sender != owner)throw;
		owner.transfer(amount);
	}
```

The `CALLCODE` opcode is located in the Swarm Source metadata that has been embedded in the bytecode (see the `f2` value in bold). This opcode will not be called because it is metadata rather than code:

bzzr://082734e053ffbd**f2**a3195354a3210dff3723c239a1e76ae3be0936f6aed31bee

Conclusion: BNB is ✅ Decentralised

### USDC - USD Coin

<https://etherscan.io/token/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48#code>

From the Etherscan link we can see the proxy implementation and the `delegatecall()` in this section of code confirming USDC is indeed a proxy smart contract.

```solidity
/**
 * @title Proxy
 * @dev Implements delegation of calls to other contracts, with proper
 * forwarding of return values and bubbling of failures.
 * It defines a fallback function that delegates all calls to the address
 * returned by the abstract _implementation() internal function.
 */
contract Proxy {
  /**
   * @dev Fallback function.
   * Implemented entirely in `_fallback`.
   */
  function () payable external {
    _fallback();
  }

  /**
   * @return The Address of the implementation.
   */
  function _implementation() internal view returns (address);

  /**
   * @dev Delegates execution to an implementation contract.
   * This is a low level function that doesn't return to its internal call site.
   * It will return to the external caller whatever the implementation returns.
   * @param implementation Address to delegate.
   */
  function _delegate(address implementation) internal {
    assembly {
      // Copy msg.data. We take full control of memory in this inline assembly
      // block because it will not return to Solidity code. We overwrite the
      // Solidity scratch pad at memory position 0.
      calldatacopy(0, 0, calldatasize)

      // Call the implementation.
      // out and outsize are 0 because we don't know the size yet.
      let result := delegatecall(gas, implementation, 0, calldatasize, 0, 0)

      // Copy the returned data.
      returndatacopy(0, 0, returndatasize)

      switch result
      // delegatecall returns 0 on error.
      case 0 { revert(0, returndatasize) }
      default { return(0, returndatasize) }
    }
  }

  /**
   * @dev Function that is run as the first thing in the fallback function.
   * Can be redefined in derived contracts to add functionality.
   * Redefinitions must call super._willFallback().
   */
  function _willFallback() internal {
  }

  /**
   * @dev fallback implementation.
   * Extracted to enable manual triggering.
   */
  function _fallback() internal {
    _willFallback();
    _delegate(_implementation());
  }
}
```

Conclusion: USDC is ❌ Centralised

### HEX

<https://etherscan.io/address/0x2b591e99afe9f32eaa6214f7b7629768c40eeb39#code>

From the Etherscan link we can see this function sends ETH from the contract to the `FLUSH_ADDR` via the `transfer` function. This will be compiled into bytecode which contains one `CALL` opcode.

```solidity
    /**
     * @dev PUBLIC FACING: Release any value that has been sent to the contract
     */
    function xfLobbyFlush()
        external
    {
        require(address(this).balance != 0, "HEX: No value");

        FLUSH_ADDR.transfer(address(this).balance);
    }
```

The second `CALL` opcode is located in the Swarm Source metadata that has been appended at the end of the bytecode (see the `f1` value in bold). This opcode will not be called because it is metadata rather than code:

bzzr://e1386410ff82a380822a5c5fb950ec31ad42ac34**f1**e670c4d9b8c7329878472b

Conclusion: HEX is ✅ Decentralised

### BUSD - Binance USD

<https://etherscan.io/token/0x4fabb145d64652a948d72533023f6e7a623c7c53#code>

From the Etherscan link we can see the proxy implementation and the `delegatecall()` in this section of code confirming BUSD is indeed a proxy smart contract.

```solidity
/**
 * @title Proxy
 * @dev Implements delegation of calls to other contracts, with proper
 * forwarding of return values and bubbling of failures.
 * It defines a fallback function that delegates all calls to the address
 * returned by the abstract _implementation() internal function.
 */
contract Proxy {
    /**
     * @dev Fallback function.
     * Implemented entirely in `_fallback`.
     */
    function () payable external {
        _fallback();
    }

    /**
     * @return The Address of the implementation.
     */
    function _implementation() internal view returns (address);

    /**
     * @dev Delegates execution to an implementation contract.
     * This is a low level function that doesn't return to its internal call site.
     * It will return to the external caller whatever the implementation returns.
     * @param implementation Address to delegate.
     */
    function _delegate(address implementation) internal {
        assembly {
        // Copy msg.data. We take full control of memory in this inline assembly
        // block because it will not return to Solidity code. We overwrite the
        // Solidity scratch pad at memory position 0.
            calldatacopy(0, 0, calldatasize)

        // Call the implementation.
        // out and outsize are 0 because we don't know the size yet.
            let result := delegatecall(gas, implementation, 0, calldatasize, 0, 0)

        // Copy the returned data.
            returndatacopy(0, 0, returndatasize)

            switch result
            // delegatecall returns 0 on error.
            case 0 { revert(0, returndatasize) }
            default { return(0, returndatasize) }
        }
    }

    /**
     * @dev Function that is run as the first thing in the fallback function.
     * Can be redefined in derived contracts to add functionality.
     * Redefinitions must call super._willFallback().
     */
    function _willFallback() internal {
    }

    /**
     * @dev fallback implementation.
     * Extracted to enable manual triggering.
     */
    function _fallback() internal {
        _willFallback();
        _delegate(_implementation());
    }
}
```

Conclusion: BUSD is ❌ Centralised

### STETH - Lido Staked Ether

<https://etherscan.io/address/0xae7ab96520de3a18e5e111b5eaab095312d7fe84#code>

From the Etherscan link we can see the proxy implementation and the `delegatecall()` in this section of code confirming Lido Staked Ether is indeed a proxy smart contract.

```solidity
contract DelegateProxy is ERCProxy, IsContract {
    uint256 internal constant FWD_GAS_LIMIT = 10000;

    /**
    * @dev Performs a delegatecall and returns whatever the delegatecall returned (entire context execution will return!)
    * @param _dst Destination address to perform the delegatecall
    * @param _calldata Calldata for the delegatecall
    */
    function delegatedFwd(address _dst, bytes _calldata) internal {
        require(isContract(_dst));
        uint256 fwdGasLimit = FWD_GAS_LIMIT;

        assembly {
            let result := delegatecall(sub(gas, fwdGasLimit), _dst, add(_calldata, 0x20), mload(_calldata), 0, 0)
            let size := returndatasize
            let ptr := mload(0x40)
            returndatacopy(ptr, 0, size)

            // revert instead of invalid() bc if the underlying call failed with invalid() it already wasted gas.
            // if the call returned error data, forward it
            switch result case 0 { revert(ptr, size) }
            default { return(ptr, size) }
        }
    }
}
```

Conclusion: STETH is ❌ Centralised

# Phase 2: Bytecode Splicing

## Goals

The next phase of this project will be to **detect and remove bytecode metadata**. As seen above we got two **false positives** returned by the tool that were caused by the metadata being interpreted as bytecode. In order to rectify this we will need to figure out a generic way of slicing metadata from the bytecode and then decompiling the remaining bytecode into opcodes outside of the web3 api (since the api doesn't allow us to slice out any sections of the bytecode).

## Research

According to this brief article on [Solidity bytecode metadata](https://www.badykov.com/ethereum/solidity-bytecode-metadata/) we can see all we need to do it crop the code at the start of the smart contract's metadata section which begins with either `a165627a7a72305820`, `a265627a7a72305820` or `a265627a7a72315820`.

Next we need to process the bytecode to produce the opcodes. Before we were getting the bytecode through the Web3 API. Now we will do it through the `evm` npm package.

`phase2.mjs`
```js
import dotenv from 'dotenv';dotenv.config()
import Web3 from 'web3'
import { markdownTable } from 'markdown-table'
import EVM from 'evm'

async function check(address, name='') {
  const web3 = new Web3('https://mainnet.infura.io/v3/'+process.env.INFURA_API_KEY)
  const r = []// result
  await web3.eth.getCode(web3.utils.toChecksumAddress(address)).then(code=>{
    // crop out metadata
    code = code.toLocaleLowerCase()// ensure we also use lowercase hexadecimal
    let i = code.indexOf('a165627a7a72305820') || code.indexOf('a265627a7a72305820') || code.indexOf('a265627a7a72315820')// see https://www.badykov.com/ethereum/solidity-bytecode-metadata/
    code = code.slice(0,i)
    const o = new EVM.EVM(code).getOpcodes()

    // detect opcodes
    r.push(o.filter(o=>'DELEGATECALL'==o.name).length||'')// opcode F4
    r.push(o.filter(o=>'CALLCODE'==o.name).length||'')// opcode F2
    r.push(o.filter(o=>'CALL'==o.name).length||'')// opcode F1
    r.push(i)
  })
  return r
}

let tokens = (await(await fetch('https://api.ethplorer.io/getTop?criteria=cap&apiKey='+(process.env.ETHPLORER_API_KEY||'freekey'))).json()).tokens
tokens = tokens.slice(0,10)
const table = [['DELEGATECALL', 'CALLCODE', 'CALL', 'Metadata Index', 'Address', 'Name', 'Symbol', 'Decentralisation']];
for (const token of tokens) {
  const r = await check(token.address, token.symbol)// opcode counts
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

These are our phase 2 results:

| DELEGATECALL | CALLCODE | CALL | Metadata Index | Address                                    | Name              | Symbol | Decentralisation               |
| ------------ | -------- | ---- | -------------- | ------------------------------------------ | ----------------- | ------ | ------------------------------ |
|              |          |      | -1             | 0x0000000000000000000000000000000000000000 | Ethereum          | ETH    | ✅ Decentralised                |
|              |          | 6    | 22066          | 0xdac17f958d2ee523a2206206994597c13d831ec7 | Tether USD        | USDT   | 🔴 Potentially Centralised     |
|              |          | 1    | 10626          | 0xb8c77482e45f1f44de1745f52c74426c631bdd52 | Binance Coin      | BNB    | 🔴 Potentially Centralised     |
| 1            |          | 1    | 4288           | 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 | USD Coin          | USDC   | 🔴🔴🔴 Potentially Centralised |
|              |          | 2    | -1             | 0x2b591e99afe9f32eaa6214f7b7629768c40eeb39 | HEX               | HEX    | 🔴 Potentially Centralised     |
|              |          |      | 5810           | 0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0 | Matic Network     | MATIC  | ✅ Decentralised                |
| 1            |          | 1    | 1986           | 0xae7ab96520de3a18e5e111b5eaab095312d7fe84 | Lido Staked Ether | STETH  | 🔴🔴🔴 Potentially Centralised |
| 1            |          | 1    | 2928           | 0x4fabb145d64652a948d72533023f6e7a623c7c53 | Binance USD       | BUSD   | 🔴🔴🔴 Potentially Centralised |
|              |          |      | 9620           | 0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce | Shiba Inu         | SHIB   | ✅ Decentralised                |
|              |          |      | -1             | 0x6b175474e89094c44da98b954eedeac495271d0f | Dai               | DAI    | ✅ Decentralised                |

## Conclusion

Out of our limited results only the BNB token has a different results to phase 1, showing it's less likely to be a proxy contract, which it is indeed not. Overall it is a relatively simple and effective tool to decrease the amount of false positives with regards to detecting proxy smart contracts.

# Phase 3: EXTCODESIZE

In phase 3 we will detect `EXTCODESIZE` opcodes. If these are used in conjunction with `CALL` opcodes, the chances are that the contract is a proxy contract because the contract wants to ensure its external target contains executable code.

`CALL` opcodes that don't use `EXTCODESIZE` checks are more likely to be simple ETH transfer functions rather than proxy functions.

By seeing an approximately equal number of `CALL` and `EXTCODESIZE` opcodes there is a good chance the contract is a proxy contract.

# Safe Alternatives to Proxy Contracts

In the case of ERC-20 tokens, as an alternative to creating proxy contracts to handle upgrades to smart contracts, a new token can be created with a user-triggered upgrade path (e.g. a one-to-one trade-in swap to the new token) and users can choose to upgrade their tokens to the new token at any point in time. This way the user is in full control of choosing whether to upgrade or not. If the old contract is stable and useful they can stick with it. If the new contract has bugs or scams in it the user is not forced to take the upgrade. Audits can be done before choosing to upgrade and the upgrade can be undertaken with confidence.

# Similar Tools

## Recommended

<https://tokensniffer.com>
* Scam detection, auditing, and metrics
* Support for 12 chains
* Free to use

<https://rugdoc.io>
* Scam detection, auditing, and metrics
* Support for 10 chains
* Free to use

## Not recommended

<https://cer.live>
* Does not detect proxy contracts

# Disclaimer

The information here is provided for educational purposes only. It is not financial advice.