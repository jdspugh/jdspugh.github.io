---
layout: post
title: Salts and Peppers
---
# Goal

We are going to take a deep dive into salts and peppers and, specifically, their use for safely storing passwords in a username/password login system.

# What are Salts & Peppers?

A **salt** is a random value added as additional input to a password hash function to protect the resulting hash from reverse hash table lookups (and optimised versions of reverse hash table lookups such as rainbow tables).

A **pepper** is a random value added as additional input to a password hash function to protect the resulting hash from dictionary and brute force attacks.

Salts are stored in the user table in the database, one random salt per user, whereas a pepper is a single random value specific to an application and is stored outside of the database (preferably in some form of secure storage). This way if the system is attacked and the database is breached (e.g. through direct access or SQL injection attacks) the pepper would need to be compromised separately since both live in their own security enclaves.

<figure>
  <img src="/image/blog/2023-04-02-salts-and-peppers/salt-and-pepper-locations.svg" alt="Salts and Pepper Locations"/>
  <figcaption>Salts and Pepper Locations</figcaption>
</figure>

In the following sections we will explain in detail the use of salts and peppers and what reverse hash table lookups are.

# Storing Passwords

Consider a typical application that stores usernames and passwords. The naive strategy would be to store the usernames and passwords in a database without encryption:

| Username | Password |
|-|-|
| user1 | qwerty |
| user2 | 12345678 |
| ... | ... |

<figcaption>Unencrypted User Table</figcaption>

If the database is compromised the usernames and passwords are directly exposed and can be used to login to any user's account.

# Password Hashing

A better strategy is to store the hash of the password. A hash is a one-way cryptographic function. Once hashed, the password cannot be unhashed. Thus a hash is ideal for use in storing passwords.

Note that the passwords are not encrypted. Encryption is a two-way cryptographic function. This means the original password can be recovered from the encrypted password if the encryption key is known. Recovery of the original password is not needed for password storage and just adds another attack vector.

In this article we are using the SHA256 hash function for simplicity. **Do not use SHA256 password hashing** in a production environment because it is a _fast_ hashing algorithm and it will be easy to crack weaker passwords it has hashed by using dictionary or brute force attacks on salted passwords with a known pepper, as we will discuss later on.

**Use Argon2** or a similar _slow_ hash function instead which will provide resistance against attacks even when both the database and the pepper have been compromised. See my article _[One-Way Cryptographic Algorithms](https://jdspugh.github.io/2023/04/06/one-way-cryptographic-algorithms.html)_ for more details about various one-way cryptographic functions and their characteristics.

`HashedPassword = SHA256(Password)`

| Username | HashedPassword |
|-|-|
| user1 | 65e84be33532fb784c48129675f9eff3a682b27168c0ea744b2cf58ee02337c5 |
| user2 | ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f |
| ... | ... |

<figcaption>Hashed Passwords in a User Table</figcaption>

# Reverse Hash Lookups

Since cryptographic hash functions, including SHA256, are designed to be irreversible you might think that passwords are now safe in the database, even if it is compromised. If all password where strong (e.g. 10+ random characters) and a slow hash function, such as a well configured Argon2, was used this would be the case. The reality is that users often choose very weak passwords such as the ones I chose: `qwerty` and `12345678`. What an attacker can do is prepare a table of common passwords and their corresponding hashes. This is known as a reverse hash lookup table.

Reverse hash lookup tables precompute complex password hashes and store them in a table for easy access. They are most effective against slow hashing algorithms since the computational time to storage space ratio is the highest. For fast hashing algorithms like SHA256 the gains will be much less.

| HashedPassword | Password |
|-|-|
| 65e84be33532fb784c48129675f9eff3a682b27168c0ea744b2cf58ee02337c5 | qwerty |
| ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f | 12345678 |
| ... | ... |

<figcaption>Reverse Hash Lookup Table</figcaption>

By adding a large number of passwords and their hashes to the table the attacker can then rapidly search the table for the corresponding `Hash` in the user table and, if found, retrieve the corresponding `Password` from the reverse hash lookup table.

# Rainbow Tables

The reverse hash lookup process can be highly optimised by using a technique widely known as **rainbow tables**. It can make the lookup tables orders of magnitude smaller with just a slight slowdown in lookup speed.

Further reading:

* _Making a Faster Cryptanalytic Time-Memory
Trade-Of_, Philippe Oechslin, 2003, <https://lasecwww.epfl.ch/pub/lasec/doc/Oech03.pdf>
* _Rainbow Tables (probably) aren’t what you think — Part 1: Precomputed Hash Chains_,
Ryan Sheasby, 2021, <https://rsheasby.medium.com/rainbow-tables-probably-arent-what-you-think-30f8a61ba6a5>

# Salt

Salts, like peppers, are combined with passwords before hashing, effectively increasing the password's complexity, thus adding to the password hash's security. Salts are different to peppers in that they are intended to be unique per user and are stored in the database alongside the username. Salts increase the storage space required for reverse hash lookup tables in proportion to the number of unique salts that can be generated. Long enough salts render reverse hash lookup tables useless.

`HashedPassword = SHA256(Password + Salt)`

| Username | Salt | HashedPassword |
|-|-|-|
| user1 | 3299942662eb7925245e6b16a1fb8db4 | 5f9eb7a905e2159f2bcde6414020e03815dc7fd4655841d36d34be091a009d30 |
| user2 | d346a4fa7f9fd6e26efb8e400dd4f3ac | 5631c77a32ec3282bca6c8291f87409b0b5f9442bec280d283efe4e6e976e370 |

<figcaption>Unencrypted User Table</figcaption>

## Username/Email as Salt

One might think that you could use the username or email address of a user as the salt to ensure uniqueness. While this initially seems a great idea you would not be able to change the username or email address without also creating a new password. Let's look at some other strategies then.

## Sequential Salts

We could use a sequence number as a simple way to ensure unique salts. The vulnerability this approach has is that an attacker may create a reverse hash lookup of known salts (e.g. 1 to 1000) combined with likely passwords. This presents the same vulnerabilities that short salts have.

This vulnerability can be mitigated by using pepper in combination with a sequence number. If the pepper is sufficiently large and random the attacker would not know which sequence numbers to use. And even if they did find the range of sequence numbers by discovering the pepper, their reverse hash lookup table could not be reused on other applications / deployments with different peppers making the reverse hash lookups virtually useless to create. This solution is less secure than large random salts as there is a chance the pepper value could be found.

## Short Salts

If a salt is too short, an attacker may precompute a table of every possible salt combined with every likely password. Using a long salt ensures such a table would be impossibly large.

Another solution is to use a pepper in combination with short salts as also suggested with sequential salts.

## Salt Bits

The generally accepted best practise for salts is to produce a 128-bit random salt per user that is combined with the password before hashing. 128-bits is chosen as it sufficiently raises reverse hash lookup table storage space requirements to currently impossible values.

Depending on your requirements you may be able to use a shorter salt, which will make your application more efficient, particularly in terms of reducing the database size.

# Pepper

A pepper is a fixed value stored separately from the database (preferably in some form of secure storage). The pepper is randomly chosen and doesn't change throughout the lifetime of the application. An attacker may compromise the database and steal the data there, but without the pepper they will have to spend a lot of effort to decode the hashed passwords. If the pepper is sufficiently strong (e.g. 128 random bits) then it will be impossible.

The pepper is combined with the password to produce different hash values compared with the previous table:

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

Now we see that the reverse hash lookup table we created before will no longer be applicable to our newly peppered passwords as the SHA256 values don't match any more.

## Risks

This method is secure if the pepper is kept secret. But if the pepper is discovered the attacker can easily make a reverse hash lookup table with the pepper in appended to each password and use this to attack the peppered user table.

If the pepper is lost (or is changed), password verification is no longer possible as different password hashes will be generated. All users would have to create new passwords.

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

With Argon2, the slowest algorithm we have considered, hashes can be created in the order of thousands per second with today's consumer grade hardware. This means that weak passwords could still be cracked, so the use of a pepper is recommended. Dictionary and Brute force attacks can be prevented by using a **long random pepper**. This is secure even when the database has been compromised but the pepper is still hidden. 

The other option is forcing users to choose **strong passwords**. This will make it difficult or impossible for them to be cracked but also opens other security issues as strong passwords cannot be easily memorized by users. So the user needs to store them in a password manager, on paper or electronically. This comes with its own problems and if we can solve the problem without resorting to strong passwords it will be better for the users and will also result in less customer support requests for us.

Biometric data or QR codes can be used to overcome the problem of forgetting strong passwords but may incur their own sets of security risks.

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

**Note:** The hash returned by the `argon2` npm package is of the form `$id$param1=value1[,param2=value2,...]$salt$hash`. This is the [PHC](https://www.password-hashing.net/)'s standardised hash result format. It includes the salt, the hash, and the parameters the Argon2 algorithm used. This means we don't need a separate `salt` column in our `users` table because the salt is already included in the `password` column. It's also good to store the Argon2 parameters also in case we want to change these at a later point: we won't have to upgrade all the accounts at once. We can even potentially fine tune and algorithmically increase the memory and computational complexity to account for increases in attackers' computational power and memory resources over time.

# Conclusion

Hashing the user's password with a correctly configured **Argon2** algorithm and a long, random, unique **salt** and a long random **pepper** provides very strong password protection, even in the case of a database breach. If the pepper is discovered and the database is breached Argon2 stills offers protection against dictionary and brute force attacks. In this case strong passwords are recommended.

<table>
<thead>
<tr>
<th colspan="2">Data</th>
<th colspan="2">Attack</th>
</tr>
<tr>
<th>User Table</th>
<th>Pepper</th>
<th>Dictionary</th>
<th>Brute Force</th>
</tr>
</thead>
<tbody>
<tr>
<td style="background-color:#D4E7CE">Secure</td>
<td style="background-color:#D4E7CE">Secure</td>
<td style="background-color:#D4E7CE">Ineffective</td>
<td style="background-color:#D4E7CE">Ineffective</td>
</tr>
<tr>
<td style="background-color:#F2C5C6">Compromised</td>
<td style="background-color:#D4E7CE">Secure</td>
<td style="background-color:#D4E7CE">Ineffective</td>
<td style="background-color:#D4E7CE">Ineffective</td>
</tr>
<tr>
<td style="background-color:#F2C5C6">Compromised</td>
<td style="background-color:#F2C5C6">Compromised</td>
<td style="background-color:#F2C5C6">Effective on weak passwords</td>
<td style="background-color:#F2C5C6">Effective on short passwords</td>
</tr>
</tbody>
</table>

Further aspects that should be delved into in-depth are the lengths of the passwords, salts, pepper and the parameters for tuning the Argon2 hashing algorithm.

# Further Reading

* _How to securely hash passwords?_, <https://security.stackexchange.com/questions/211/how-to-securely-hash-passwords>

* _Client-Plus-Server Password Hashing as a Potential Way to Improve Security Against Brute Force Attacks without Overloading the Server_, "Sergeant Major" Hare, 2015, <http://ithare.com/client-plus-server-password-hashing-as-a-potential-way-to-improve-security-against-brute-force-attacks-without-overloading-server/>

* _Method to Protect Passwords in Databases for Web
Applications_, Scott Contini, 2014, <https://eprint.iacr.org/2015/387.pdf>