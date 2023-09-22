---
layout: post
title: Hash Algorithms
---
# Goal

We will look at established and modern hash algorithms and their characteristics so developers can select which algorithms to use for their specific use cases.

# Fast Algorithms

Some hashing algorithms are designed to the fast e.g.:

* BLAKE3
* BLAKE2
* SHA-512
* SHA-256

BLAKE3 is a modern fast hashing algorithm that exploits parallelism in order to run very fast on modern computers. It is a much improved version of BLAKE2, although BLAKE2 has the advantage of being more established.

SHA-256 is an established and well known older fast hashing algorithm (older than BLAKE2). It does not support parallelism. SHA-512 is similar but can compute faster on 64 bit architectures and offers a larger output hash size. The larger hash size offers future proofing against brute force attacks, which has arguable benefits since even a 256 hash should not be able to be brute forced eons into the future (see the calculations at [Pepper Bits](https://jdspugh.github.io/2023/04/02/salts-and-peppers.html#pepper-bits) in my [Salts and Peppers](https://jdspugh.github.io/2023/04/02/salts-and-peppers.html) article).

When choosing which algorithm to use the main consideration will be balancing modern algorithms with established ones. Modern algorithms can have many benefits but are not as tried and tested as the more established algorithms.

| Algorithm | Cryptographic Security | Speed | Parallelism | Software Complexity | Resource Usage | Release Year |
|-|-|-|-|-|-|-|
| BLAKE3	| High | Very Fast | Yes	| Low     | Low      | 2020 |
| BLAKE2	| High | Fast      | Yes | Low      | Low      | 2012 |
| SHA-256	| High | Moderate  | No  | Moderate | Moderate | 2001 |
| SHA-512	| High | Moderate  | No  | Moderate | Moderate | 2001 |

<figcaption>Fast Hashing Algorithms Summary</figcaption>

# Slow Algorithms

Some hashing algorithms are designed to be slow e.g. Argon2, scrypt and bcrypt.

Each has their own use cases. For password hashing, for example, a slow algorithm is required. A slow algorithm makes it much more costly to perform dictionary and brute force attacks, and precomputed reverse hash lookup attacks such as rainbow table attacks.

Let's take a look at dictionary and brute force attacks now.

# CPU vs GPU Parallelism

Hashing algorithms that are designed to perform well in parallel computing environments can benefit greatly from the parallelisation offered by modern GPUs. This benefit can be mitigated by the overheads involved in transferring the code and data from the CPU to the GPU, initiating the GPU calculation, and receiving the results.

In the case where there is a bulk of data on which hashes need to be calculated, GPU implementations can outperform CPU based implementations. This applies to blockchain mining applications.

In the case of calculating the hash of a password for a username/password authentication system the overheads will likely outweigh the costs and CPU implementations will win.

<table>
<tr><th></th><th>CPU</th><th>GPU</th></tr>
<tr><th>Latency</th><td style="background-color:#D4E7CE">Lower</td><td style="background-color:#F2C5C6">Higher</td></tr>
<tr><th>Memory Bandwidth</th><td style="background-color:#F2C5C6">Lower</td><td style="background-color:#D4E7CE">Higher</td></tr>
<tr><th>Parallelism</th><td style="background-color:#F2C5C6">Lower</td><td style="background-color:#D4E7CE">Higher</td></tr>
<tr><th>Use Cases</th><td>Password Hashing</td><td>Blockchain Mining</td></tr>
</table>
<figcaption>CPU vs GPU Hashing</figcaption>

# Dictionary & Brute Force Attacks

These days hashes can be computed very quickly. This is mainly due to the rise of cryptocurrencies and the advent of specialised mining hardware. Because of this, if the correct hashing algorithm and parameters are not used then user tables can be vulnerable to dictionary and brute force attacks.

A single piece of consumer-grade hardware these days can compute over 100 000 000 000 000 SHA-256 hashes per second. So weak passwords hashed with a known salt using SHA-256 can be cracked in sub second time. This can be prevented by using sufficiently slow hashing algorithm. Note that consumer-grade hardware can also compute 10 000 000 000 000 scrypt hashes per second and scrypt is considered a slow hash - so check the algorithm you want to use and its parameters.

We recommend using **Argon2**. Argon2 can only be hashed at about 1 000 hashes per second on consumer grade hardware. Even still you will need to **tune the parameters** for your application’s needs - making it fast enough that the user experience is not compromised, and slow enough that it remains secure.

We used these Argon2 settings using the WebAssembly implementation at https://antelle.net/argon2-browser:

Argon2 settings:
* Memory: see table below
* Iterations: 1
* Hash Length: 32 bytes
* Parallelism: 2
* Type: Argon2d

| Memory | Macbook Pro 16<br />Hash Time |
|:-:|:-:|
| 512 KB (64 MB) | 1 ms (.001s) 
| 65536 KB (64 MB) | 70 ms (.07s) |
| 262144 KB (256 MB) | 210 ms (.21s) |
| 1048576 KB (1 GB) | 770 ms (.77s) |

<figcaption>Memory vs Hash Time for Argon2 Rust Reference Implementation on Different Devices<br />(<a href="https://github.com/p-h-c/phc-winner-argon2">https://github.com/p-h-c/phc-winner-argon2</a>)</figcaption>

| Memory | Macbook Pro 16<br />Hash Time | iPhone SE<br />Hash Time |
|:-:|:-:|:-:|
| 512 KB (64 MB) | 5 ms (.005s) | 5ms (.005s) |
| 65536 KB (64 MB) | 120 ms (.12s) | 330ms (.33s) |
| 262144 KB (256 MB) | 410 ms (.41s) | 1300ms (1.3s) |
| 1048576 KB (1 GB) | 3900 ms (3.9s) | Out of memory error |

<figcaption>Memory vs Hash Time for Argon2 Browser Implementation on Different Devices<br />(<a href="https://antelle.net/argon2-browser">https://antelle.net/argon2-browser</a>)</figcaption>

# Fast vs Slow

The speed of hashing functions is by design. Some are designed to be fast. Some are designed to be deliberately slow i.e. computationally and/or memory intensive. In most cases you want fast hash functions for better performance, efficiency and responsiveness of your application.

## Slow Hashing Algorithms

| Algorithm | Description |
|-|-|
| bcrypt | computational cost |
| scrypt | computational and memory cost |
| Argon2 | configurable computational and memory cost |

<figcaption>Slow Hashing Algorithms<br />(see <a href="https://informatika.stei.itb.ac.id/~rinaldi.munir/Matdis/2019-2020/Makalah2019/13516132.pdf">Argon2: The Better Password Hashing Function Than
Bcrypt)</a></figcaption>

Another little know algorithm with potential is **bscrypt** (<https://github.com/Sc00bz/bscrypt>). It targets cache bottlenecks leading to greater hardness than memory focused algorithms. Since there is no browser implementation of bscrypt yet I won't be covering it here.

# Fast Hashing Algorithms

## Crypto Mining Rigs

| Algorithm | Hardware | ASIC | Hardware Cost (USD) | Hash Rate | Cost (USD) |
|-|-|-|-|-|-|
| SHA-256 | Antminer S19 Pro | Yes |3200 | 110 Th/s | $0.000000000029 per h/s |
| SHA-256 | Antminer S19j Pro | Yes | 2260 | 104 Th/s | $0.000000000022 per h/s |
| scrypt | Antminer L7 | Yes | 9899 | 9.16 Th/s | $0.000000001081 per h/s |
| scrypt | Antminer L7 | Yes | 7331 | 8.8 Th/s | $0.000000000833 per h/s |
| Argon2 | Radeon VII graphic card | Not available | 1816 | 800 h/s | $2.27 per h/s |
| Argon2 | Radeon RX 5700xt graphics card | Not available | 300 | 550 h/s | $0.55 per h/s |

From the results we can see that scrypt is about 10x slower than SHA-256 and Argon2 is about 10000000000x (10<sup>10</sup>) slower than scrypt. These results are approximate and will vary widely based on the parameters used in the scrypt and Argon2 algorithms.

# Slow Hashing Algorithms

## Memory Hardness

* bcrypt - 4kb
* scrypt - configurable
* Argon2 - configurable

## Crypto Mining

Here are some statistics from cryptocurrency mining rigs that are the fastest consumer grade devices for hashing as of April 2023. We can see that Argon2 is very slow compared with the other algorithms, which makes it very good for password hashing.

### scrypt

The cryptocurrencies Litecoin & Dogecoin use the scrypt algorithm.

Fastest consumer grade hardware (ASICs):

| Hardware | USD | Hash Rate | Cost (USD) |
|-|-|-|-|
| Antminer L7 | 9899 | 9.16 Th/s | $0.000000001081 per h/s |
| Antminer L7 | 7331 | 8.8 Th/s | $0.000000000833 per h/s |

### Argon2

The cryptocurrency, Nimiq, uses Argon2 with these settings:

| Settings | Parameter | Value |
|-|-|-|
| Algorithm variant || Argon2d |
| Memory cost | m | 512 Kb |
| Time cost | t | 1 iteration |
| Parallelism | p | 1 lane and 1 thread |

The fastest consumer grade hardware (GPUs, as no ASICs are available as of yet), as of April 2023, gives:

| Hardware | USD | Hash Rate | Cost (USD) |
|-|-|-|-|
| Radeon VII graphic card | 1816 | 800 h/s | $2.27 per h/s |
| Radeon RX 5700xt graphics card | 300 | 550 h/s | $0.55 per h/s |

<figcaption>Fastest and Most Efficient Argon2 Hash Rates<br />(Source <a href="https://acemining.co">https://acemining.co</a>)</figcaption>

Argon2 has three variants that have slightly different characteristics. They are summarised in the table below:

| Property | Argon2d | Argon2i | Argon2id |
|-|-|-|-|
| GPU Resistance | 
| Memory Access Pattern | Data-dependent | Data-independent | Hybrid (Argon2i + Argon2d) |
| Recommended Use Cases | General password hashing, less concerned about side-channel attacks | Use in cases where there is higher risk of side-channel attacks | General purpose, combines the advantages of Argon2i and Argon2d |
| Side-Channel Attack Resistance | Lower | Higher | Higher (depends on configuration) |

<figcaption>Argon2 Variants</figcaption>

#### Introduction

Argon2 was the winner of [Password Hashing Competition (PHC)](https://www.password-hashing.net/) 2013 to 2015. Argon2 is a slow one-way hash function. You can read about different types of hash function, their characteristics and their uses in my post [Hash Algorithms](https://jdspugh.github.io/2023/04/06/hash-algorithms.html). Here we will look at different **implementations** of Argon2 and the **parameters** Argon2 accepts.

We will be looking at two main implementations:

* Reference C implementation: <https://github.com/P-H-C/phc-winner-argon2>
* Browser WASM implementation: <https://github.com/antelle/argon2-browser>

#### Use in Cryptocurrency

The cryptocurrency, Nimiq, uses Argon2 with these settings:

| Settings | Parameter | Value |
|-|-|-|
| Algorithm variant || Argon2d |
| Memory cost | m | 512 Kb |
| Time cost | t | 1 iteration |
| Parallelism | p | 1 lane and 1 thread |

The fastest consumer grade hardware (GPUs, as no ASICs are available as of yet), as of April 2023, gives:

| Hardware | USD | Hash Rate | Cost (USD) |
|-|-|-|-|
| Radeon VII graphic card | 1816 | 800 h/s | $2.27 per h/s |
| Radeon RX 5700xt graphics card | 300 | 550 h/s | $0.55 per h/s |

<figcaption>Fastest and Most Efficient Argon2 Hash Rates<br />(Source <a href="https://acemining.co">https://acemining.co</a>)</figcaption>

Argon2 has three variants that have slightly different characteristics. They are summarised in the table below:

| Property | Argon2d | Argon2i | Argon2id |
|-|-|-|-|
| GPU Resistance | Highest | High | Mix |
| Memory Access Pattern | Data-dependent | Data-independent | Hybrid (Argon2i + Argon2d) |
| Recommended Use Cases | Password hashing | Use in cases where there is risk of side-channel attacks | Mix |
| Side-Channel Attack Resistance | No | Yes | Mix |

<figcaption>Argon2 Variants</figcaption>

We used these Argon2 settings using the WebAssembly implementation at https://antelle.net/argon2-browser:

Argon2 settings:
* Memory: see table below
* Iterations: 1
* Hash Length: 8 bytes
* Parallelism: 1
* Type: Argon2d

| Memory | Macbook Pro 16<br />Hash Time |
|:-:|:-:|
| 512 KB (64 MB) | 1 ms (.001s) 
| 65536 KB (64 MB) | 70 ms (.07s) |
| 262144 KB (256 MB) | 210 ms (.21s) |
| 1048576 KB (1 GB) | 770 ms (.77s) |

<figcaption>Memory vs Hash Time for Argon2 Rust Reference Implementation<br />(<a href="https://github.com/p-h-c/phc-winner-argon2">https://github.com/p-h-c/phc-winner-argon2</a>)</figcaption>

| Memory | Macbook Pro 16<br />Hash Time |
|:-:|:-:|
| 512 KiB (64 MiB) | - |
| 65536 KiB (64 MiB) | 67 ms (.067s) |
| 262144 KiB (256 MiB) | 290 ms (.29s) |
| 1048576 KiB (1 GiB) | 1200 ms (1.2s) |

<figcaption>Memory vs Hash Time for Argon2 Node.js Implementation<br />{type: argon2.argon2id, hashLength: 8, timeCost: 2, parallelism: 1}<br />(<a href="https://github.com/ranisalt/node-argon2">https://github.com/ranisalt/node-argon2</a>)</figcaption>

| Memory | Macbook Pro 16<br />Hash Time | iPhone SE<br />Hash Time |
|:-:|:-:|:-:|
| 512 KB (64 MB) | 5 ms (.005s) | 5ms (.005s) |
| 65536 KB (64 MB) | 120 ms (.12s) | 330ms (.33s) |
| 262144 KB (256 MB) | 410 ms (.41s) | 1300ms (1.3s) |
| 1048576 KB (1 GB) | 3900 ms (3.9s) | Out of memory error |

<figcaption>Memory vs Hash Time for Argon2 Browser Implementation on Different Devices<br />(<a href="https://antelle.net/argon2-browser">https://antelle.net/argon2-browser</a>)</figcaption>

| Year | Memory (RAM) | Memory Type |
|-|-|-|
| Early 2000s    | 64 MB - 128 MB | CPU |
| Mid-2000s      | 256 MB - 512 MB | CPU |
| Late 2000s     | 1 GB | CPU |
| Early 2010s    | 2 GB - 4 GB | GPU |
| Mid-2010s      | 4 GB - 8 GB | GPU |
| Late 2010s to Early 2020s | 8 GB - 32 GB | GPU |

<figcaption>Memory Trends</figcaption>

Using the Argon2 hash algorithm configured to use 1 GB, the best consumer grade GPU hardware as of the "Late 2010s to Early 2020s" will be able to process up to 32 hashes in parallel:

`Maximum GPU RAM / Argon2 memory = 32 GB / 1 GB = 32`



To summarise:
* Use **CPU** hashing for **one-off** hashes
* Use **GPU** hashing for **bulk** hashes

# References

* _Argon2: The Better Password Hashing Function Than Bcrypt_, Daniel Ryan Levyson, 2019, https://informatika.stei.itb.ac.id/~rinaldi.munir/Matdis/2019-2020/Makalah2019/13516132.pdf

* _Argon2 Memory-Hard Function for Password Hashing and Proof-of-Work Applications_, Internet Research Task Force, RFC9106, 2021, https://datatracker.ietf.org/doc/html/rfc9106