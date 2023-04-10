---
layout: post
title: Salts and Peppers
---
# Goal

Here we are going to take a deep dive into salts and peppers and their use in the context of cyber-security.

# What are Salts & Peppers?

A salt or pepper is a value added as additional input to a hash function to protect the hash from rainbow table attacks. Below we will explain step-by-step how and why this is done and what rainbow tables are.

# Storing Passwords

Consider a typical application that stores usernames and passwords. The naive strategy would be to store the usernames and password in a database without encryption:

| Username | Password |
|-|-|
| user1 | qwerty |
| user2 | 12345678 |

<figcaption>Application's Unencrypted User Table</figcaption>

If the database is compromised the usernames and password are directly exposed and can be used to login to any user's account.

# Password Hashing

A better strategy is to store the hash of the password. In this case we are using the SHA-256 hash function for simplicity (do not use SHA-256 in a production environment because it is a fast hash and will be easy to crack - see below).

`Hash = SHA-256(password)`

| Username | Hash |
|-|-|
| user1 | 65e84be33532fb784c48129675f9eff3a682b27168c0ea744b2cf58ee02337c5 |
| user2 | ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f |

<figcaption>Application's Password Hashed User Table</figcaption>

# Rainbow Tables

Since the SHA-256 hash function is designed to be irreversible you might think that the passwords are now safe in the database, even if it is compromised. The reality is that users often choose very weak passwords (such as the ones I chose: `qwerty` and `12345678`). What an attacker can do is prepare a table of common passwords and corresponding hashes. This is known as a **rainbow table**:

| Password | Hash |
|-|-|
| qwerty | 65e84be33532fb784c48129675f9eff3a682b27168c0ea744b2cf58ee02337c5 |
| 12345678 | ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f |

<figcaption>Very Short Rainbow Table</figcaption>

By adding a large number of passwords and their hashes to the table the attacker can then search the table for the corresponding `Hash`  in the user table and, if found, retrieve the corresponding `Password` from the rainbow table.

# Pepper

A "pepper" (or secret salt) is a fixed value stored separately from the database. It is combined with the password to produce different hash values compared with the previous table. The pepper is randomly chosen and doesn't change throughout the lifetime of the application:

`Hash = SHA-256(pepper + password)`

| Password | Hash |
|-|-|
| qwerty | df4c1098fd7a782870ff0ffe6a6c6b8620eeec9e1af4ee3d64309890828baf10 |
| 12345678 | 25471749ca6342ea353734f0b63baabab77826edbeb3df886177c47dc3b16ef0 |

<figcaption>Very Short Rainbow Table with Pepper</figcaption>

Now we see that the rainbow table we created before will no longer be applicable to our newly peppered passwords as the SHA-256 values don't match any more. This is secure if the pepper is kept secret. But if the pepper is discovered the attacker can easily make a new rainbow table with the pepper in front of each password and use this to attack the peppered user table.

If the pepper is lost, password verification is no longer possible as the correct hash cannot be generated without the pepper. All users would have to create new passwords.

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

# Salt

Salts, like peppers, are combined with password before hashing for added security. Salts are different to peppers in that they are usually unique and stored in the database alongside the username.

## Unique Salts

One might think that you could then use the username or email address of a user as the salt to ensure uniqueness. While this initially seems a great idea you would not be able to change the username or email address without also creating a new password. Let's look at some other strategies then.

## Sequential Salts

One might also consider using a sequence number as a simple way to ensure unique salts. The vulnerability this approach has is that an attacker may create a rainbow table of known salts combined with likely passwords. This vulnerability can be be mitigated by using pepper in combination with a sequence number. If the pepper is sufficiently large and random the attacker would not know which sequence numbers to use. And even if they did find the range of sequence numbers, their rainbow table could not be reused on other applications or deployments (with different peppers) making them pointless to create.

## Short Salts

If a salt is too short, an attacker may precompute a table of every possible salt combined with every likely password. Using a long salt ensures such a table would be prohibitively large. Another solution is to use a pepper in combination with salts as also suggested with sequential salts.

## 128-Bit Random Salts

The generally accepted best practise for salts is to produce a 128-bit random salt per user that is combined with the password before hashing. The username, salt and hash are stored in the database and the original password is discarded. An attacker then cannot predict the text to be hashed in order to create their rainbow table, thereby rendering rainbow table attacks ineffective.

`Hash = SHA-256(salt + password)`

| Username | Salt | Hash |
|-|-|-|
| user1 | 3299942662eb7925245e6b16a1fb8db4 | 5f9eb7a905e2159f2bcde6414020e03815dc7fd4655841d36d34be091a009d30 |
| user2 | d346a4fa7f9fd6e26efb8e400dd4f3ac | 5631c77a32ec3282bca6c8291f87409b0b5f9442bec280d283efe4e6e976e370 |

<figcaption>Application's Unencrypted User Table</figcaption>

### Collisions

If you wish to optimise the length of your salt to save on storage space you can choose the bit size of your random salt based on the table below. If you have a lot of users and only a few salts (due to choosing a small salt bit size) then rainbow tables can be made that attack all the users with that same salt, making it more efficient for the attacker.

From the below table we can see that 2<sup>64</sup> will be just enough if we're expecting ≈8 000 000 000 users i.e. one account for everyone in the world. You'll be getting on average 2 collisions per salt, which is acceptable. So we can optimise our salt to be 64-bit. Bear in mind, as mentioned before, the generally accepted best practise is 128-bits.

<table>
<tbody>
<tr>
  <th rowspan="2">Bits</th>
  <th rowspan="2">Possible Outputs</th>
  <th colspan="10">Desired Probability of Random Collision</th>
</tr>
<tr>
  <th><span>10<sup>−18</sup></span></th>
  <th><span>10<sup>−15</sup></span></th>
  <th><span>10<sup>−12</sup></span></th>
  <th><span>10<sup>−9</sup></span></th>
  <th><span>10<sup>−6</sup></span></th>
  <th>0.1%</th>
  <th>1%</th>
  <th>25%</th>
  <th>50%</th>
  <th>75%</th>
</tr>
<tr>
  <th scope="row">16</th>
  <th scope="row">2<sup>16</sup> (~6.5 x 10<sup>4</sup>)</th>
  <td>&lt;2</td>
  <td>&lt;2</td>
  <td>&lt;2</td>
  <td>&lt;2</td>
  <td>&lt;2</td>
  <td>11</td>
  <td>36</td>
  <td>190</td>
  <td>300</td>
  <td>430</td>
</tr>
<tr>
  <th scope="row">32</th>
  <th scope="row">2<sup>32</sup> (~<span><4.3<span>×</span>10<sup>9</sup></span>)</th>
  <td>&lt;2</td>
  <td>&lt;2</td>
  <td>&lt;2</td>
  <td>3</td>
  <td>93</td>
  <td>2900</td>
  <td>9300</td>
  <td>50,000</td>
  <td>77,000</td>
  <td>110,000</td>
</tr>
<tr>
  <th scope="row">64</th>
  <th scope="row">2<sup>64</sup> (~<span>1.8<span>×</span>10<sup>19</sup></span>)</th>
  <td>6</td>
  <td>190</td>
  <td>6100</td>
  <td>190,000</td>
  <td>6,100,000</td>
  <td><span>1.9<span>×</span>10<sup>8</sup></span></td>
  <td><span>6.1<span>×</span>10<sup>8</sup></span></td>
  <td><span>3.3<span>×</span>10<sup>9</sup></span></td>
  <td><span>5.1<span>×</span>10<sup>9</sup></span></td>
  <td><span>7.2<span>×</span>10<sup>9</sup></span></td>
</tr>
<tr>
  <th scope="row">128</th>
  <th scope="row">2<sup>128</sup> (~<span>3.4<span>×</span>10<sup>38</sup></span>)</th>
  <td><span>2.6<span>×</span>10<sup>10</sup></span></td>
  <td><span>8.2<span>×</span>10<sup>11</sup></span></td>
  <td><span>2.6<span>×</span>10<sup>13</sup></span></td>
  <td><span>8.2<span>×</span>10<sup>14</sup></span></td>
  <td><span>2.6<span>×</span>10<sup>16</sup></span></td>
  <td><span>8.3<span>×</span>10<sup>17</sup></span></td>
  <td><span>2.6<span>×</span>10<sup>18</sup></span></td>
  <td><span>1.4<span>×</span>10<sup>19</sup></span></td>
  <td><span>2.2<span>×</span>10<sup>19</sup></span></td>
  <td><span>3.1<span>×</span>10<sup>19</sup></span></td>
</tr>
<tr>
  <th scope="row">256</th>
  <th scope="row">2<sup>256</sup> (~<span>1.2<span>×</span>10<sup>77</sup></span>)</th>
  <td><span>4.8<span>×</span>10<sup>29</sup></span></td>
  <td><span>1.5<span>×</span>10<sup>31</sup></span></td>
  <td><span>4.8<span>×</span>10<sup>32</sup></span></td>
  <td><span>1.5<span>×</span>10<sup>34</sup></span></td>
  <td><span>4.8<span>×</span>10<sup>35</sup></span></td>
  <td><span>1.5<span>×</span>10<sup>37</sup></span></td>
  <td><span>4.8<span>×</span>10<sup>37</sup></span></td>
  <td><span>2.6<span>×</span>10<sup>38</sup></span></td>
  <td><span>4.0<span>×</span>10<sup>38</sup></span></td>
  <td><span>5.7<span>×</span>10<sup>38</sup></span></td>
</tr>
<tr>
  <th scope="row">384</th>
  <th scope="row">2<sup>384</sup> (~<span>3.9<span>×</span>10<sup>115</sup></span>)</th>
  <td><span>8.9<span>×</span>10<sup>48</sup></span></td>
  <td><span>2.8<span>×</span>10<sup>50</sup></span></td>
  <td><span>8.9<span>×</span>10<sup>51</sup></span></td>
  <td><span>2.8<span>×</span>10<sup>53</sup></span></td>
  <td><span>8.9<span>×</span>10<sup>54</sup></span></td>
  <td><span>2.8<span>×</span>10<sup>56</sup></span></td>
  <td><span>8.9<span>×</span>10<sup>56</sup></span></td>
  <td><span>4.8<span>×</span>10<sup>57</sup></span></td>
  <td><span>7.4<span>×</span>10<sup>57</sup></span></td>
  <td><span>1.0<span>×</span>10<sup>58</sup></span></td>
</tr>
<tr>
  <th scope="row">512</th>
  <th scope="row">2<sup>512</sup> (~<span>1.3<span>×</span>10<sup>154</sup></span>)</th>
  <td><span>1.6<span>×</span>10<sup>68</sup></span></td>
  <td><span>5.2<span>×</span>10<sup>69</sup></span></td>
  <td><span>1.6<span>×</span>10<sup>71</sup></span></td>
  <td><span>5.2<span>×</span>10<sup>72</sup></span></td>
  <td><span>1.6<span>×</span>10<sup>74</sup></span></td>
  <td><span>5.2<span>×</span>10<sup>75</sup></span></td>
  <td><span>1.6<span>×</span>10<sup>76</sup></span></td>
  <td><span>8.8<span>×</span>10<sup>76</sup></span></td>
  <td><span>1.4<span>×</span>10<sup>77</sup></span></td>
  <td><span>1.9<span>×</span>10<sup>77</sup></span></td>
</tr>
</tbody>
</table>

<figcaption>Random Collision Probabilities<br />(from <a href="https://en.wikipedia.org/wiki/Birthday_attack">Birthday attack - Wikipedia</a>)</figcaption>

# Brute Force Attacks

These days hashes can be computed very quickly. This is mainly due to the rise of cryptocurrencies and the advent of specialised mining hardware. Because of this, if the correct hashing algorithm and parameters are not used then user tables can be vulnerable to brute force attacks.

Consumer grade hardware these days can compute over 100 000 000 000 000 SHA-256 hashes per second. So weak passwords hashed with a known salt using SHA-256 can be cracked in sub second time. This can be prevented by ensuring you are using a sufficiently slow hashing algorithm. Note that consumer grade hardware can compute 10 000 000 000 000 scrypt hashes per second and scrypt is considered a slow hash - so check the algorithm and its parameters. We recommend using **Argon2**. Argon2 can only be hashed at about 1 000 hashes per second on consumer grade hardware. Even still you will need to **tune the parameters** for your application’s needs - making it fast enough that the user experience is not compromised, and slow enough that it remains secure.

Brute force attacks can also be prevented by using a **long random pepper**. This is secure even if the database has been compromised but the pepper is still hidden at some other location. By adding the pepper the attacker cannot compute any reasonable range of known hashes, even when the salt is known. With Argon2, the slowest algorithm we have considered, hashes can be created in the order of hundreds per second with today's consumer grade hardware. This means that common passwords with know salts could still be cracked, so the use of a pepper is still recommended.

The other option is forcing users to choose **strong passwords**. This will make it difficult or impossible for them to be cracked but also opens other security issues as strong passwords cannot be easily memorized by users. So the user needs to store them in a password manager, on paper or electronically. This comes with its own problems and if we can solve the problem without resorting to strong passwords it will be better for the users and will also result in less customer support requests for us.

# Conclusion

Hashing the user's password with a correctly configured Argon2 algorithm and using a random 128-bit salt and random 128-bit pepper provides very strong password protection, even in the case of a database breach. If the pepper is discovered it will still offer good protection.

# Further Reading

* How to securely hash passwords?, <https://security.stackexchange.com/questions/211/how-to-securely-hash-passwords>

* Client-Plus-Server Password Hashing as a Potential Way to Improve Security Against Brute Force Attacks without Overloading the Server, "Sergeant Major" Hare, 2015, <http://ithare.com/client-plus-server-password-hashing-as-a-potential-way-to-improve-security-against-brute-force-attacks-without-overloading-server/>

* Method to Protect Passwords in Databases for Web
Applications, Scott Contini, 2014, <https://eprint.iacr.org/2015/387.pdf>