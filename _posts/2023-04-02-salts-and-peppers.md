---
layout: post
title: Salts and Peppers
---
# Goal

We are going to take a deep dive into salts and peppers and, specifically, their use for safely storing passwords in a username/password authentication system.

# Authentication Overview

Authentication is a way to prove who you are. This can be done in several ways:

* **By revealing what you know (Knowledge-based):**
  * **Username/password**
  * PIN
  * Security questions
* By revealing what you hold (Possession-based):
  * Physical items
    * Security token
    * Mobile phone (identified using unique attributes like IMEI number)
    * Passport or Driver's License (or other physical ID cards)
  * Digital items
    * Authenticator app via a Time-Based One-Time-Password (TOTP)
    * One-Time-Password (OTP) delivered via
      * Email
      * SIM card
        * via an SMS
        * via a Voice Call
  * Physical or Digital items
    * Digital Certificate
    * QR Code
* By revealing what you are (Inherence-based):
  * Fingerprints or Hand Geometry
  * Voiceprint
  * Face recognition
  * Retina or Iris scan
  * Behaviour (like typing rhythm)
* By revealing where you are (Location-based):
  * GPRS location
  * Wi-Fi router location
  * IP address geolocation
  
Authentication can be achieved using one or more of the mechanisms. Depending on the application, the authentication system may choose to use more than one authentication category. This is called **two factor authentication** (2FA). It is **less convenient** for the user **but adds more security**.

A username/password authentication system is a knowledge-based system. We are going to only look at this mechanism as it is simple and convenient, and doesn't require any additional hardware. It is also very secure if implemented correctly by understanding the recommendations in this article.

# Password Human Factors

## Human Memory

Generally people can remember at most 4-5 distinct passwords  ([Adams &
Sasse, 1999, page 46](https://dl.acm.org/doi/pdf/10.1145/322796.322806)) yet are likely members of dozens of digital services that require username/password authentication. For this reason they are likely to use the same passwords more than once, or variations of them, for different services. This means if a password is stolen it potentially has larger security implications than for just that one service. By applying the practises in this article it will be virtually impossible for one of these passwords to be obtained through one of the most common security breaches: a data breach. For examples of recent data breaches, and their extents, see the [';--have i been pwned?](https://haveibeenpwned.com/) website.

Memory limitations can be overcome by writing down passwords or by using a password manager. Writing down passwords is not secure in that people may find your paper. Using a password manager runs the risk of the manager being compromised and all your passwords being discovered. So in this article we will focus only on username/password authentication and how salts and peppers relate to it.

## Typeability

People must be able to type their passwords on their own devices and also other people's devices in the case that they are away from their own devices or have lost one of more of their devices. For this reason we will focus on the 95 ASCII visible, typeable characters for password calculations in this article. This includes both the upper and lower case alphabet letters (26×2), the numerals (10) and special characters (33) including the space character.

Count|ASCII Code (Decimal)|ASCII Character
-|-|-
1|32|space
2|33|!
3|34|"
4|35|#
5|36|$
6|37|%
7|38|&
8|39|"
9|40|(
10|41|)
11|42|*
12|43|+
13|44|,
14|45|-
15|46|.
16|47|/
17|58|:
18|59|;
19|60|<
20|61|=
21|62|>
22|63|?
23|64|@
24|91|[
25|92|\
26|93|]
27|94|^
28|95|_
29|96|`
30|123|{
31|124|\||
32|125|}
33|126|~

<figcaption>ASCII Visible, Typeable Special Characters</figcaption>

This gives a total of `26x2 + 10 + 33 = 95` characters.

### Emojis & International Characters

Users who want to use international characters or emojis in their passwords can if their authentication system allows it. Emojis in passwords can be easier to remember and add to password entropy ([_UK firm [Intelligent Environments] launches emoji alternative to Pin codes_, 2015](https://www.bbc.com/news/technology-33063344)). Modern web based applications support Unicode characters by default which include **3664 standardised emojis** (as of [Unicode 15.0](https://www.unicode.org/emoji/charts/emoji-counts.html)).

International character and emoji use increase password security in that an attacker will need to include them in their attack dictionary, requiring a significantly larger attack dictionary.

Users must be aware that they may have difficulty typing emoji or international character passwords on devices other than their own. The universality and standardisation of emojis has come far but should still be considered as a factor when creating passwords containing them.

# What are Salts & Peppers?

A **salt** is a random value added as additional input to a password hash function to protect the resulting hash from [reverse hash lookups](#reverse-hash-lookups) (and optimised versions of reverse hash lookups such as [rainbow tables](#rainbow-tables)).

A **pepper** is a random value added as additional input to a password hash function to protect the resulting hash from dictionary and brute force attacks.

Salts are stored in the user table in the database, one random salt per user, whereas a pepper is a single random value specific to an application and is stored outside of the database (preferably in some form of secure storage). This way if the system is attacked and the database is breached (e.g. through direct access or SQL injection attacks) the pepper would need to be compromised separately since both live in their own security enclaves.

<figure>
  <img src="/image/blog/2023-04-02-salts-and-peppers/salt-and-pepper-locations.svg" alt="Salts and Pepper Locations"/>
  <figcaption>Salts and Pepper Locations</figcaption>
</figure>

# Storing Passwords

Consider a typical application that stores usernames and passwords. The naive strategy would be to store the usernames and passwords in a database without encryption:

| Username | Password |
|-|-|
| user1 | qwerty |
| user2 | 12345678 |
| ... | ... |

<figcaption>Unencrypted User Table</figcaption>

If the database is compromised by an external hacker the usernames and passwords are directly exposed and can be used to login to any user's account through the application's login user interface. A rogue employee could also clone usernames and passwords easily with little chance of being caught. They can use them in the same way to login to users' accounts.

# Password Hashing

A better strategy is to store the hash of the password. A hash is the output of a hash function. **A hash function is a one-way cryptographic function** that produce a seemingly random output that aims to be unique per input. Once hashed, the password hash cannot be unhashed. Thus a password hash is ideal for use in storing obscured passwords.

`HashedPassword = SHA256(Password)`

Username | HashedPassword
-|-
user1 | 65e84be33532fb784c48129675f9eff3a682b27168c0ea744b2cf58ee02337c5
user2 | ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f
... | ...

<figcaption>Hashed Passwords in a User Table</figcaption>

In this article we are using the SHA256 hash function for simplicity. **Do not use SHA256 password hashing** in a production environment because if the database and the pepper have been compromised, weaker passwords will be easy to crack through dictionary or brute force attacks. SHA256 is a _fast_ hashing algorithm that is designed to generate hashes very quickly. This aids dictionary and brute force attacks which need to perform hash calculations as fast as possible.

**Use Argon2** or a similar _slow_ hash function instead which will provide effective resistance against these attacks. See my article _[One-Way Cryptographic Algorithms](https://jdspugh.github.io/2023/04/06/one-way-cryptographic-algorithms.html)_ for more details about various one-way cryptographic functions and their characteristics.

Note: People often talk of passwords being encrypted. Technically passwords should hashed, not encrypted. **Encryption is a two-way cryptographic process.** This means the original password can be recovered from the encrypted password if the encryption key is known. Recovery of the original password is not needed for password storage and just adds another attack vector to an authentication system.

# Reverse Hash Lookups

Since cryptographic hash functions are designed to be irreversible you might think that passwords are now safe in the database, even if it is compromised. If all password where strong (e.g. 10+ random characters) and a slow hash function, such as a well configured Argon2, was used this would be the case. The reality is that users often choose very weak passwords such as the ones I chose: `qwerty` and `12345678`. What an attacker can do is prepare a table of common passwords and their corresponding hashes. This is known as a reverse hash lookup table. A specific password hash can be rapidly searched for in the table and the corresponding unhashed password extracted.

| HashedPassword | Password |
|-|-|
| 65e84be33532fb784c48129675f9eff3a682b27168c0ea744b2cf58ee02337c5 | qwerty |
| ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f | 12345678 |
| ... | ... |

<figcaption>Reverse Hash Lookup Table</figcaption>

Reverse hash lookup tables are most useful against slow hashing algorithms since the hash computation time will be large compared with minimal storage space required to store the hash result. For fast hashing algorithms like SHA256 the gains, if any, will be significantly less.

# Rainbow Tables

The reverse hash lookup process can be optimised by using a technique known as **rainbow tables**. It can make the lookup tables orders of magnitude smaller with just a slight slowdown in lookup speed.

Further reading:

* _Making a Faster Cryptanalytic Time-Memory
Trade-Of_, Philippe Oechslin, 2003, <https://lasecwww.epfl.ch/pub/lasec/doc/Oech03.pdf>
* _Rainbow Tables (probably) aren’t what you think — Part 1: Precomputed Hash Chains_,
Ryan Sheasby, 2021, <https://rsheasby.medium.com/rainbow-tables-probably-arent-what-you-think-30f8a61ba6a5>

# Salts

Salts, like peppers, are combined with passwords before hashing, adding to the password hash's security. Salts are different to peppers in that they are intended to be unique per user and are stored in the database alongside the username. Salts increase the storage space required for reverse hash lookup tables in proportion to the number of unique salts used. They can render reverse hash lookup tables useless since a new table needs to be created for each unique salt. Without being able to reuse the tables they only add overhead to password cracking attempts.

`HashedPassword = SHA256(Password + Salt)`

| Username | Salt | HashedPassword |
|-|-|-|
| user1 | 3299942662eb7925245e6b16a1fb8db4 | 5f9eb7a905e2159f2bcde6414020e03815dc7fd4655841d36d34be091a009d30 |
| user2 | d346a4fa7f9fd6e26efb8e400dd4f3ac | 5631c77a32ec3282bca6c8291f87409b0b5f9442bec280d283efe4e6e976e370 |
| ... | ... | ... |

<figcaption>Salts in the User Table</figcaption>

## Username or Email as Salt

One might think that you could use the username or email address of a user as the salt to ensure uniqueness. While this initially seems a great idea you would not be able to change the username or email address without also creating a new password. Let's look at some other strategies then.

## Sequential Salts

We could use a sequence number as a simple way to ensure unique salts. The vulnerability this approach has is that the attacker can predict the salts beforehand and create a reverse hash lookup of known salts (e.g. 1 to 1000) combined with likely passwords. This is the same vulnerabilities that [short salts](#short-salts) have.

The vulnerability can be mitigated by combining a long random pepper ([64 or more bits](#salt-bits)) with the salt sequence number. Any reverse hash lookup tables now cannot be reused on other deployments regardless of if the pepper is known or not. Different peppers make the reverse hash lookups span a different range of values.

## Short Salts

If a salt is too short an attacker may create reverse hash lookup tables containing every possible salt combined with likely passwords. Using a long salt ([64 or more bits](#salt-bits)) ensures these tables would be impossibly large. Another solution is to use a pepper in combination with short salts as also suggested with [sequential salts](#sequential-salts) above.

## Salt Length

The salt needs to be long enough that it is not worth it for an attacker to undertake rainbow table attacks. For simplicity during these calculations let's assume a maximum expected userbase of **8 billion users** (about the number of people on planet Earth currently).

### Salt Collisions

If the salt length is short there will be salt collisions i.e. duplicate salts. The attacker can use their rainbow table on all password hashes that have the same salt. In the case of a 16-bit salt, a single rainbow table would be able to crack 121 896 password hashes on average.

Using the table below we can see that we should choose a **salt of 32-bits or more to avoid excessive collisions**. A collision rate of 1.86 means a generated rainbow table can be used to crack 1.86 password hashes on average which would be barely worth generating for the attacker.

<table>
<thead>
<tr>
<th style="text-align:right"><div style="white-space:nowrap">Salt Bits</div><div style="font-size:60%">&nbsp;</div></th>
<th>Unique Salts<br /><div style="font-size:60%">(2<sup>Salt Bits</sup>)</div></th>
<th>Average Collisions per Salt<br /><div style="font-size:60%">(8 billion / Unique Salts)</div></th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:right">16</td>
<td>65 536</td>
<td>121 896</td>
</tr>
<tr>
<td style="text-align:right">32</td>
<td>4 294 967 296</td>
<td>1.86</td>
</tr>
<tr>
<td style="text-align:right">64</td>
<td>1.84 × 10<sup>19</sup></td>
<td>4.34 × 10<sup>-10</sup></td>
</tr>
<tr>
<td style="text-align:right">96</td>
<td>7.92 × 10<sup>28</sup></td>
<td>1.01 × 10<sup>-21</sup></td>
</tr>
<tr>
<td style="text-align:right">128</td>
<td>3.40 × 10<sup>38</sup></td>
<td>2.35 × 10<sup>-30</sup></td>
</tr>
<tr>
<td style="text-align:right">256</td>
<td>1.16 × 10<sup>77</sup></td>
<td>6.88 × 10<sup>-68</sup></td>
</tr>
</tbody>
</table>

<figcaption>Salt Size vs Collisions (for 8 Billion Users)</figcaption>

### Rainbow Table Storage

Let's start with a table of SI units used for storage. This will make it easier to visualise the quantities we are about to discuss:

| Unit | Bytes |
|-:|-|
| Kilobyte (KB) | 1 000 |
| Megabyte (MB) | 1 000 000 |
| Gigabyte (GB) | 1 000 000 000 |
| Terabyte (TB) | 1 000 000 000 000 |
| Petabyte (PB) | 1 000 000 000 000 000 |
| Exabyte (EX) | 1 000 000 000 000 000 000 |
| Zettabyte (ZB) | 1 000 000 000 000 000 000 000 |

<figcaption>SI Units for Storage</figcaption>

From the figure below we can see that global data storage is predicted to be 16 ZB by 2025 and is doubling every 4 years. A formula to predict the storage available at a given year is thus <code>16 × 2<sup>(year - 2025)/4</sup> ZB</code>. To be safe we want to force our attackers' rainbow tables to be larger this value for some years into the future so that there is no chance of a rainbow table attack.

<figure>
  <img src="/image/blog/2023-04-02-salts-and-peppers/data-growth.png" alt="Global Data Storage Growth 2021-2025 (source: Redgate)"/>
  <figcaption>Global Data Storage Growth 2021-2025 (source: <a href="https://www.red-gate.com/blog/database-development/whats-the-real-story-behind-the-explosive-growth-of-data">Redgate</a>)</figcaption>
</figure>

For reference, readily available public unsalted rainbow tables commonly vary from hundreds of Megabytes to Terabytes in size. Let's consider an extreme case where a rainbow tables is only 1 Megabyte in size for simplification of our calculations. Salting forces the number of rainbow tables needed by an attacker to be equal to the number of unique salts. So we get:

<table>
<thead>
<tr>
<th style="text-align:right"><div>Salt Bits</div><div style="font-size:60%">&nbsp;</div></th>
<th style="text-align:right">Size of all Rainbow Tables (ZB)<br /><div style="font-size:60%">(Unique Salts × 1 MB)</div></th>
<th>Unique Salts<br /><div style="font-size:60%">&nbsp;</div></th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:right">16</td>
<td style="text-align:right">0.000000000065536</td>
<td>65 536</td>
</tr>
<tr>
<td style="text-align:right">32</td>
<td style="text-align:right">0.00000429</td>
<td>4 294 967 296</td>
</tr>
<tr>
<td style="text-align:right">64</td>
<td style="text-align:right">18 446</td>
<td>18 446 744 073 709 551 616</td>
</tr>
<tr>
<td style="text-align:right">96</td>
<td style="text-align:right">79 228 162 514 264</td>
<td>79 228 162 514 264 337 593 543 950 336</td>
</tr>
<tr>
<td style="text-align:right">128</td>
<td style="text-align:right">340 282 366 920 938 463 463 374</td>
<td>340 282 366 920 938 463 463 374 607 431 768 211 456</td>
</tr>
<tr>
<td style="text-align:right">256</td>
<td style="text-align:right">115 792 089 237 316 195 423 570 985 008 687 907 853 269 984 665 640 564 039 457 584</td>
<td>115 792 089 237 316 195 423 570 985 008 687 907 853 269 984 665 640 564 039 457 584 007 913 129 639 936</td>
</tr>
</tbody>
</table>

<figcaption>Salt Bits vs Size of all Rainbow Tables</figcaption>

From the table above we can see that increases in the bits of salt used exponentially increases the minimum storage required for the rainbow tables, and global storage increases at a relatively slower pace over time.

Let's graph the global storage projection over a longer period of time and see how many bits of salt we need to cover those values.

<figure>
  <img src="/image/blog/2023-04-02-salts-and-peppers/global-data-storage-vs-year.svg" alt="Global Data Storage vs Year"/>
  <figcaption>Global Data Storage vs Year</figcaption>
</figure>

From the graph above and the table below we can see that **64-bits of salt** would be more than **sufficient** in all present day cases and **decades into the future** at the current data storage growth rate:

| Salt Bits | Estimated Minimum Years of Protection |
|-:|-|
| 64 | 41 |
| 96 | 161 |
| 128 | 296 |
| 256 | 808 |

<figcaption>Salt Bits vs Estimated Minimum Years of Protection</figcaption>

For reference we show here a couple of other recommendations for salt lengths. We feel these recommendations are somewhat arbitrary since there is no indication how they were derived:

* The [National Institute of Standards and Technology (NIST)](https://www.nist.gov) recommends at least 32-bits in its [Digital Identity Guidelines (SP 800-63B)](https://pages.nist.gov/800-63-3/sp800-63b.html)

* The [Open Web Application Security Project (OWASP)](https://owasp.deteact.com/cheat/cheatsheets/Password_Storage_Cheat_Sheet.html) recommends using salts that are 256 to 512-bits long

# Pepper

A pepper is a single, fixed, random value stored separately from the database (preferably in some form of secure storage). An attacker may compromise the database and steal the data there, but without the pepper they will have to spend brute force effort to find a password and the pepper's value. If the pepper is sufficiently strong then it will be impossible to brute force. 

The pepper is combined with the password to produce different hash values compared with the an unpeppered user table. We see that the reverse hash lookup table we created before will no longer be applicable to our newly peppered passwords above as the SHA256 values do not match any more:

```
PEPPER = wtWy8vb3Ov4FFiFF
HashedPassword = SHA256(Password + PEPPER)
```

| Username | HashedPassword |
|-|-|
| user1 | 2583015da33f1fd72efc0b6384412a9d5443a55f52284fa1f7e0f9b5ebe3f38d |
| user2 | 51d437a138ac402cba22c12349b874259eecd38087728f961e10260308d4ead7 |
| ... | ... |

<figcaption>User Table with Hashed & Peppered Passwords</figcaption>

## Pepper Bits

For simplicity let's first look at SHA256 password hashes and how much effort would be required to crack them. As of April 2023 the highest global Bitcoin hash rate has been 440 EH/s. Since Bitcoin has by far the dominant SHA256 hash rate, the next being Litecoin at 920 TH/s, we can use this as a basis for our calculations.

| Units | Hashes per Second |
|-:|-|
| KiloHashes/s (KH/s) | 1 000 H/s |
| MegaHashes/s (MH/s) | 1 000 000 H/s |
| GigaHashes/s (GH/s) | 1 000 000 000 H/s |
| TeraHashes/s (TH/s) | 1 000 000 000 000 H/s |
| PetaHashes/s (PH/s) | 1 000 000 000 000 000 H/s |
| ExaHashes/s (EH/s) | 1 000 000 000 000 000 000 H/s |

Let's assume one password hash and salt are known. We just need to brute force one salted and peppered password hash in order to retrieve the pepper's value. We will need to try, on average, half of all the possible pepper values in order to obtain the value.

<figure>
  <img src="/image/blog/2023-04-02-salts-and-peppers/sha256-brute-force-time.svg" alt="Pepper Bits vs Years to Brute Force (SHA256)"/>
  <figcaption>Pepper Bits vs Years to Brute Force (SHA256)</figcaption>
</figure>

|Date|Bitcoin Hash Rate (EH/s)|Days until Doubling|
|-:|-:|-:|
|May 2023|380| |
|Jan 2022|190|490|
|Sep 2019|93|850|
|Apr 2019|46|150|
|Feb 2018|23|420|
|Dec 2017|11|62|
|Aug 2017|5.8|120|
|Jan 2017|2.9|210|
|Jun 2016|1.4|210|
|Dec 2015|0.73|180|
|Aug 2015|0.37|120|
|Aug 2014|0.18|370|
|Jun 2014|0.09|61|

<figcaption>Bitcoin Hash Rate Doubling Time</figcaption>

Let's take the worst case of the most acceleration of the Bitcoin hash rate: doubling every 60 days. Then we can set a maximum hash rate using the formula:

<code>Bitcoin hash rate maximum = 380 × 2<sup>(days past May 2023 / 60)</sup> EH/s</code>

<code>hashes = 2<sup>pepper bits</sup></code>

|Time|Bitcoin Hash Rate Upper Limit|
|-|-|
|0 Years|380 EH/s|
|1 Year|26 000 EH/s|
|10 Years|780 000 000 000 000 000 000 EH/s|
|100 Years|5.0 × 10<sup>185</sup> EH/s|
|1 000 Years|
|10 000 Years|
|100 000 Years|
|1 000 000 Years|

If we are using all the world's Bitcoin hash power to crack a peppered password, we can see from the chart that from 94-bits onwards the brute force will take more than a year to complete. Since a long pepper does not take any significant extra storage or computational power you can choose at least 128-bits which will take over 20 000 000 000 years to crack.

## Risks

This method is secure if the pepper is kept secret. But if the pepper is discovered the attacker can easily make a reverse hash lookup table with the pepper in appended to each password and use this to attack the peppered user table.

If the pepper is lost (or is changed) users will have to create new passwords to create newly peppered password hashes.

## Node.js Implementation

In a Node.js implementation we would commonly store the pepper in a `.env` file that can be accessed by the `dotenv` package. For security reasons (especially if using a public code repo) make sure you remove the `.env` file from your version control system by modifying your `.gitignore` file to include:

`.gitignore`
```
.env
```

Add the pepper value to the `.env` file:

`.env`
```shell
PEPPER=wtWy8vb3Ov4FFiFF
```

Now you can read the pepper from your Node.js code:

`app.mjs`
```js
import dotenv from 'dotenv'

dotenv.config()

console.log(process.env.PEPPER)
```

# Dictionary & Brute Force Attacks

A brute force attack will discover any password whereas a dictionary attack will only discover a portion of passwords that is determined by the match between the users' password and the attack dictionary entries. A brute force attack is thus more likely to be used to target an individual user whereas a dictionary attack will obtain a large number of passwords quickly but will only reveal a certain percentage of them (the weaker ones).

If the user table that contains the password hashes and salts is obtained and the pepper is discovered, then an attacker can start using dictionary and brute force attacks on the password hashes. The time it takes to crack them will depend on the password hash length, the hashing algorithm and the hashing algorithm's parameters. By analysing the two types of attack we can quantitatively determine the number of bits needed for the password hashes.

With Argon2, the slowest algorithm we have considered, hashes can be created in the order of thousands per second with today's consumer grade hardware. This means that weak passwords could still be cracked, so the use of a pepper is recommended. Dictionary and Brute force attacks can be prevented by using a **long random pepper**. This is secure even when the database has been compromised but the pepper is still hidden. 

The other option is forcing users to choose **strong passwords**. This will make it difficult or impossible for them to be cracked but also opens other security issues as strong passwords cannot be easily memorized by users. So the user needs to store them in a password manager, on paper or electronically. This comes with its own risks and if we can solve the problem without resorting to strong passwords it will be better for the users and will also result in less customer support requests for us.

Biometric data or QR codes can be used to overcome the problem of forgetting strong passwords but they incur their own sets of security risks. Biometric data needs to be stored securely since its value never changes and additionally it needs to secure the user's privacy. With QR codes, a device could be hacked and the QR code stolen.

## Dictionary Attacks

Dictionary attacks attack weak passwords. Weak passwords are passwords that are short and/or easy-to-guess passwords. The attacker will use a dictionary of common passwords and hash each of them along with the known salt for that user and the application's pepper. Each resulting hash will be compared to the user's password hash from the user table. If a match is found then the attacker has just found the user's unhashed password.

The attack success rate and number of attacks required to find the password will depend on the quality of the attacker's dictionary and its match with the set of passwords being attacked. Password attack dictionaries can contain complex passwords that contain words from various languages that are mixed with combinations of numbers and symbols. These dictionaries can crack up to around 20% of an average users' passwords from a list of over a trillion passwords. It is recommended that your application checks new passwords against such a dictionary and warn the user that they are using a weak password if it is in the list.

In terms of the speed of the attack a dictionary attack may be successful with a fast hashing algorithm like SHA256. A single dedicated consumer SHA256 ASIC cryptocurrency mining rig can, as of May 2023, do more than 100 TH/s. This means that more than 100 passwords could be attacked per second (with up to 20% success rate). Thus it's recommended to use a slow, configurable, hashing algorithm like Argon2 that is orders of magnitude slower when computing a password's hash. It is unlikely that your application will have lots of simultaneous sign ups or password changes which means that you should configure your Argon2 parameters so that the hashes take around a second to complete. This is short enough that the user will not be too disturbed by the delay computing it, but long enough to provide good brute force resistance. Set the memory complexity as high as your computer can handle since this will provide maximum GPU resistance, making it harder for attackers. Your attacker may have a faster computer than you, so let's say your Argon2 hash takes 1 second, the attacker may be able to perform the same hash 10x faster. So each brute force attack will take around `.1s × 1 000 000 000 / 2 = 50 000 000s = 578 days` to complete (with up to 20% success rate). This is very good security considering your system has been completely compromised.

## Brute Force Attacks

Brute force attacks attack short passwords by trying every combination of characters for the password, starting from the shortest and moving up to longer ones. The **number of attempts required to crack a password via brute force** is directly proportional to the **number of unhashed password character combinations**.

The number of unhashed password character combinations will be set by the application's UI and the user will be notified of this when creating their password e.g. "8 characters minimum with at least one capital letter, one lowercase letter, one number and one special character". The application developer needs to balance the password length and complexity requirements with the user's ability to memorise the password. Longer, more complex passwords are more secure against brute force attacks but are difficult to memorise. If the password requirements are too complex the user will be incentivised to write down the password or store it electronically which makes the password less secure again.

The unhashed password complexity dictates the number of brute force attempts required to crack the password.

# Human Factors

## Memory

Users frequently reuse passwords across digital services. Users can remember at most 4-5 unrelated passwords. When users are forced to change passwords frequently they write them down, opening up other attack vectors.

## Typeability



# Password Hash Length

Password hashes are generally stored in databases and are of constant length. The entropy of a single password hash determines the maximum entropy of a user's unhashed password.

Increasing unhashed password entropy makes passwords more difficult for users to remember, so there is a general maximum limit for memorised passwords. When passwords become longer than this limit users will need tend to write them down, store them electronically, or use password managers, which open up another set of attack vectors.

The maximum number of bits a user's password hash can contain determines the maximum number of significant characters a user's unhashed password will have. Any characters beyond that number will not increase the security of the password.

Attackers, in order to not waste attacks, need to copy the general form of the users' passwords e.g. which characters are allowed, the probabilities of specific characters being used, which dictionary words and languages used.

<table>
<thead>
<tr>
<th colspan="2">Password Hash Length</th>
<th rowspan="2">Unique Possible Values</th>
</tr>
<tr>
<th>Bits</th>
<th>Bytes</th>
</tr>
</thead>
<tbody><tr>
<td style="background-color:#FDF3D0">32</td>
<td style="background-color:#FDF3D0">4</td>
<td style="background-color:#FDF3D0">2<sup>32</sup> ≈ 4.29 × 10<sup>09</sup></td>
</tr>
<tr>
<td style="background-color:#D8D3E7">64</td>
<td style="background-color:#D8D3E7">8</td>
<td style="background-color:#D8D3E7">2<sup>64</sup> ≈ 1.84 × 10<sup>19</sup></td>
</tr>
<tr>
<td style="background-color:#D3DFE2">96</td>
<td style="background-color:#D3DFE2">12</td>
<td style="background-color:#D3DFE2">2<sup>96</sup> ≈ 7.92 × 10<sup>28</sup></td>
</tr>
<tr>
<td style="background-color:#DCE9D5">128</td>
<td style="background-color:#DCE9D5">16</td>
<td style="background-color:#DCE9D5">2<sup>128</sup> ≈ 3.40 × 10<sup>38</sup></td>
</tr>
<tr>
<td style="background-color:#F8E6D0">256</td>
<td style="background-color:#F8E6D0">32</td>
<td style="background-color:#F8E6D0">2<sup>256</sup> ≈ 1.16 × 10<sup>77</sup></td>
</tr>
</tbody></table>

<figcaption>Password Hash Length vs Entropy</figcaption>

<table>
<thead>
<tr>
<th>Significant Password Characters (95 chars)</th>
<th>Unique Possible Values</th>
</tr>
</thead>
<tbody>
<tr>
  <td>1</td>
  <td>95<sup>1</sup> ≈ 9.50 × 10<sup>1</sup></td>
</tr>
<tr>
  <td>2</td>
  <td>95<sup>2</sup> ≈ 9.03 × 10<sup>3</sup></td>
</tr>
<tr>
  <td>3</td>
  <td>95<sup>3</sup> ≈ 8.57 × 10<sup>5</sup></td>
</tr>
<tr style="background-color:#FDF3D0">
  <td>4</td>
  <td>95<sup>4</sup> ≈ 8.15 × 10<sup>7</sup></td>
</tr>
<tr>
  <td>5</td>
  <td>95<sup>5</sup> ≈ 7.74 × 10<sup>9</sup></td>
</tr>
<tr>
  <td>6</td>
  <td>95<sup>6</sup> ≈ 7.35 × 10<sup>11</sup></td>
</tr>
<tr>
  <td>7</td>
  <td>95<sup>7</sup> ≈ 6.98 × 10<sup>13</sup></td>
</tr>
<tr>
  <td>8</td>
  <td>95<sup>8</sup> ≈ 6.63 × 10<sup>15</sup></td>
</tr>
<tr style="background-color:#D8D3E7">
  <td>9</td>
  <td>95<sup>9</sup> ≈ 6.30 × 10<sup>17</sup></td>
</tr>
<tr>
  <td>10</td>
  <td>95<sup>10</sup> ≈ 5.99 × 10<sup>19</sup></td>
</tr>
<tr>
  <td>11</td>
  <td>95<sup>11</sup> ≈ 5.69 × 10<sup>21</sup></td>
</tr>
<tr>
  <td>12</td>
  <td>95<sup>12</sup> ≈ 5.40 × 10<sup>23</sup></td>
</tr>
<tr>
  <td>13</td>
  <td>95<sup>13</sup> ≈ 5.13 × 10<sup>25</sup></td>
</tr>
<tr style="background-color:#D3DFE2">
  <td>14</td>
  <td>95<sup>14</sup> ≈ 4.88 × 10<sup>27</sup></td>
</tr>
<tr>
  <td>15</td>
  <td>95<sup>15</sup> ≈ 4.63 × 10<sup>29</sup></td>
</tr>
<tr>
  <td>16</td>
  <td>95<sup>16</sup> ≈ 4.40 × 10<sup>31</sup></td>
</tr>
<tr>
  <td>17</td>
  <td>95<sup>17</sup> ≈ 4.18 × 10<sup>33</sup></td>
</tr>
<tr style="background-color:#DCE9D5">
  <td>18</td>
  <td>95<sup>18</sup> ≈ 3.97 × 10<sup>35</sup></td>
</tr>
<tr>
  <td>19</td>
  <td>95<sup>19</sup> ≈ 3.77 × 10<sup>37</sup></td>
</tr>
<tr>
  <td>20</td>
  <td>95<sup>20</sup> ≈ 3.58 × 10<sup>39</sup></td>
</tr>
<tr>
  <td>21</td>
  <td>95<sup>21</sup> ≈ 3.41 × 10<sup>41</sup></td>
</tr>
<tr>
  <td>22</td>
  <td>95<sup>22</sup> ≈ 3.24 × 10<sup>43</sup></td>
</tr>
<tr>
  <td>23</td>
  <td>95<sup>23</sup> ≈ 3.07 × 10<sup>45</sup></td>
</tr>
<tr>
  <td>24</td>
  <td>95<sup>24</sup> ≈ 2.92 × 10<sup>47</sup></td>
</tr>
<tr>
  <td>25</td>
  <td>95<sup>25</sup> ≈ 2.77 × 10<sup>49</sup></td>
</tr>
<tr>
  <td>26</td>
  <td>95<sup>26</sup> ≈ 2.64 × 10<sup>51</sup></td>
</tr>
<tr>
  <td>27</td>
  <td>95<sup>27</sup> ≈ 2.50 × 10<sup>53</sup></td>
</tr>
<tr>
  <td>28</td>
  <td>95<sup>28</sup> ≈ 2.38 × 10<sup>55</sup></td>
</tr>
<tr>
  <td>29</td>
  <td>95<sup>29</sup> ≈ 2.26 × 10<sup>57</sup></td>
</tr>
<tr>
  <td>30</td>
  <td>95<sup>30</sup> ≈ 2.15 × 10<sup>59</sup></td>
</tr>
<tr>
  <td>31</td>
  <td>95<sup>31</sup> ≈ 2.04 × 10<sup>61</sup></td>
</tr>
<tr>
  <td>32</td>
  <td>95<sup>32</sup> ≈ 1.94 × 10<sup>63</sup></td>
</tr>
<tr>
  <td>33</td>
  <td>95<sup>33</sup> ≈ 1.84 × 10<sup>65</sup></td>
</tr>
<tr>
  <td>34</td>
  <td>95<sup>34</sup> ≈ 1.75 × 10<sup>67</sup></td>
</tr>
<tr>
  <td>35</td>
  <td>95<sup>35</sup> ≈ 1.66 × 10<sup>69</sup></td>
</tr>
<tr>
  <td>36</td>
  <td>95<sup>36</sup> ≈ 1.58 × 10<sup>71</sup></td>
</tr>
<tr>
  <td>37</td>
  <td>95<sup>37</sup> ≈ 1.50 × 10<sup>73</sup></td>
</tr>
<tr style="background-color:#F8E6D0">
  <td>38</td>
  <td>95<sup>38</sup> ≈ 1.42 × 10<sup>75</sup></td>
</tr>
<tr>
  <td>39</td>
  <td>95<sup>39</sup> ≈ 1.35 × 10<sup>77</sup></td>
</tr>
<tr>
  <td>40</td>
  <td>95<sup>40</sup> ≈ 1.29 × 10<sup>79</sup></td>
</tr>
</tbody></table>

<figcaption>Significant Password Characters vs Entropy</figcaption>

The number of bits in password hash alters the number of password hash collisions that will be experienced. The number of password hash collisions will be given by <code>number of unique passwords / 2<sup>password hash bits</sup></code>.

Minimum password length is given by the password hash bits.

Maximum password length is given by the password hash bits. A password hash of 32-bits would effectively mean everything over 

We want passwords from 8 to 16 characters in length.

# Node.js Implementation

Here is an implementation of a web based authentication system that uses Express.js and SQLite. It implements **Argon2** hashing with **unique salts per user** and a **pepper** as recommended.

```js
import express from 'express'
import betterSqlite3 from 'better-sqlite3'// install issues? try https://github.com/WiseLibs/better-sqlite3/issues/866#issuecomment-1457993288
import argon2 from 'argon2'// install issues? try "npm i argon2; npx @mapbox/node-pre-gyp rebuild -C ./node_modules/argon2"
import dotenv from 'dotenv';dotenv.config()

// Init express
const app = express()
app.use(express.urlencoded({extended:false}))

// Init database
const db = betterSqlite3('users.db')
db.exec('CREATE TABLE IF NOT EXISTS users (username TEXT UNIQUE, password TEXT)')

// Show login page
app.get('/', (req, res) => {
  res.send(`
<h1>Login</h1>
<form action="login" method="post">
  <label>Username <input name="u" /></label>
  <label>Password <input name="p" type="password" /></label>
  <input type="submit" />
</form>
  `)
})

// Process login form
app.post('/login', async (req, res) => {
  const { u, p } = req.body // username, password
  const savedPassword = db.prepare(
    'SELECT password FROM users WHERE (username=?)'
  ).get(u)?.password
  if (savedPassword && await argon2.verify(savedPassword, p + process.env.PEPPER)) {
    res.send('Login Success')
  } else {
    res.status(401).send('Login Failure')
  }
})

// Show registration page
app.get('/register', (req, res) => {
  res.send(`
<h1>Register</h1>
<form action="register" method="post">
  <label>Username <input name="u" /></label>
  <label>Password <input name="p" type="password" /></label>
  <input type="submit" />
</form>
  `)
})

// Process registration form
app.post('/register', async (req, res) => {
  const { u, p } = req.body // username, password
  try {
    db.prepare(
      'INSERT INTO users (username, password) VALUES (?, ?)'
    ).run(
      u, await argon2.hash(p + process.env.PEPPER)
    )
    res.send('Registration successful')
  } catch {
    res.send('Username already exists')
  }
})

app.listen(3000)
```

**Note:** The hash returned by the `argon2` npm package is of the form `$id$param1=value1[,param2=value2,...]$salt$hash`. This is the [PHC's standardised hash result format](https://github.com/P-H-C/phc-string-format/blob/master/phc-sf-spec.md). It includes the algorithm, salt, hash, and the algorithm's parameters. This means we don't need a separate `salt` column in our `users` table because the salt is already included in the `password` column. It's also good to store the algorithm and its parameters also in case we want to change these at a later point: we won't have to upgrade all the accounts at once. We can easily fine tune and increase the memory and computational complexity to account for increases in attackers' computational power and memory resources over time.

# Conclusion

Hashing the user's password with a correctly configured **Argon2** algorithm and a long, random, unique **salt** and a long random **pepper** provides very strong password protection, even in the case of a database breach.

If the **pepper is discovered and the database is breached** Argon2 stills offers protection for users using strong passwords. Weak passwords will vulnerable to discovery by dictionary or brute force attacks.

<table style="border:1px solid black !important">
<thead>
<tr>
<th colspan="2" style="text-align:center;background-color:#F8E6D0;border-right:1px solid black !important">Data</th>
<th colspan="2" style="text-align:center;background-color:#CCD9F5">Attack</th>
</tr>
<tr style="border-bottom:1px solid black !important">
<th style="background-color:#F8E6D0">User Table</th>
<th style="background-color:#F8E6D0;border-right:1px solid black !important">Pepper</th>
<th style="background-color:#CCD9F5">Dictionary</th>
<th style="background-color:#CCD9F5">Brute Force</th>
</tr>
</thead>
<tbody>
<tr>
<td style="background-color:#D4E7CE">Secure</td>
<td style="background-color:#D4E7CE;border-right:1px solid black !important">Secure</td>
<td style="background-color:#D4E7CE">Ineffective</td>
<td style="background-color:#D4E7CE">Ineffective</td>
</tr>
<tr>
<td style="background-color:#F2C5C6">Compromised</td>
<td style="background-color:#D4E7CE;border-right:1px solid black !important">Secure</td>
<td style="background-color:#D4E7CE">Ineffective</td>
<td style="background-color:#D4E7CE">Ineffective</td>
</tr>
<tr>
<td style="background-color:#D4E7CE">Secure</td>
<td style="background-color:#F2C5C6;border-right:1px solid black !important">Compromised</td>
<td style="background-color:#D4E7CE">Ineffective</td>
<td style="background-color:#D4E7CE">Ineffective</td>
</tr>
<tr>
<td style="background-color:#F2C5C6">Compromised</td>
<td style="background-color:#F2C5C6;border-right:1px solid black !important">Compromised</td>
<td style="background-color:#F2C5C6">Effective on weak passwords</td>
<td style="background-color:#F2C5C6">Effective on short passwords</td>
</tr>
</tbody>
</table>

<figcaption>Data Compromised vs Attack Possibilities</figcaption>

Even with the most secure username/password authentication system in place users should be aware there are other less technical ways for passwords to be stolen such as over-the-shoulder or phishing attacks. At least we can secure the technical aspects so users have one less problem to worry about.

Further aspects that should be delved into in-depth are the minimum lengths of the passwords, pepper and the parameters for tuning the Argon2 hashing algorithm.

# Further Reading

* _How to securely hash passwords?_, <https://security.stackexchange.com/questions/211/how-to-securely-hash-passwords>

* _Client-Plus-Server Password Hashing as a Potential Way to Improve Security Against Brute Force Attacks without Overloading the Server_, "Sergeant Major" Hare, 2015, <http://ithare.com/client-plus-server-password-hashing-as-a-potential-way-to-improve-security-against-brute-force-attacks-without-overloading-server/>

* _Method to Protect Passwords in Databases for Web
Applications_, Scott Contini, 2014, <https://eprint.iacr.org/2015/387.pdf>