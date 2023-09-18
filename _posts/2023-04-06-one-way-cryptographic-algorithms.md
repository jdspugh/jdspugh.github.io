---
layout: post
title: One-Way Cryptographic Algorithms
---
# Hashing Algorithms

Some hashing algorithms are designed to the fast e.g. BLAKE3 and SHA-256. Some are designed to be slow e.g. Argon2, scrypt and bcrypt. Both have their own use cases, but for password hashing a slow algorithm is required. A slow algorithm makes it much more costly to generate rainbow tables and to perform dictionary and brute force attacks. Let's take a look at dictionary and brute force attacks now.

# Dictionary & Brute Force Attacks

These days hashes can be computed very quickly. This is mainly due to the rise of cryptocurrencies and the advent of specialised mining hardware. Because of this, if the correct hashing algorithm and parameters are not used then user tables can be vulnerable to dictionary and brute force attacks.

Consumer grade hardware these days can compute over 100 000 000 000 000 SHA-256 hashes per second. So weak passwords hashed with a known salt using SHA-256 can be cracked in sub second time. This can be prevented by ensuring you are using a sufficiently slow hashing algorithm. Note that consumer grade hardware can compute 10 000 000 000 000 scrypt hashes per second and scrypt is considered a slow hash - so check the algorithm and its parameters.

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

# Goal

We will look at the major modern one-way cryptographic algorithms and their characteristics.

# Fast vs Slow

The speed of hashing functions is by design. Some are designed to be fast. Some are designed to be deliberately slow i.e. computationally and/or memory intensive. In most cases you want fast hash functions for better performance, efficiency and responsiveness of your application.

## Fast Hashing Algorithms

* SHA-256
* SHA-512
* BLAKE2
* BLAKE3

In some circumstances it's important to use slow hash functions. Such a case is for hashing passwords. You don't want attackers to be able to compute hashes fast for creating tables of password/hash combinations (see my [Salts and Peppers](https://jdspugh.github.io/2023/04/02/salts-and-peppers.html) post for details about rainbow tables and rainbow table attacks).

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

# References

* _Argon2: The Better Password Hashing Function Than
Bcrypt_, Daniel Ryan Levyson, 2019, https://informatika.stei.itb.ac.id/~rinaldi.munir/Matdis/2019-2020/Makalah2019/13516132.pdf