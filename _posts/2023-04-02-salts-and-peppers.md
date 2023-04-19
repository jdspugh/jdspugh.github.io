---
layout: post
title: Salts and Peppers
---
# Goal

We are going to take a deep dive into salts and peppers and their use for safely storing passwords.

# What are Salts & Peppers?

A salt or pepper is a random value added as additional input to a password hash function to **protect** the resulting hash **from reverse hash lookups** (and optimised versions of reverse hash lookups such as rainbow tables).

Salts are stored in the user table in the database, one random salt per user, whereas a pepper is a single random value specific to an application and is stored outside of the database (preferably in some form of secure storage). Below we will explain in detail the use of salts and peppers and what reverse hash lookups are.

<figure>
  <img src="/image/blog/2023-04-02-salts-and-peppers/salt-and-pepper-locations.svg" alt="Salts and Pepper Locations"/>
  <figcaption>Salts and Pepper Locations</figcaption>
</figure>

# Storing Passwords

Consider a typical application that stores usernames and passwords. The naive strategy would be to store the usernames and password in a database without encryption:

| Username | Password |
|-|-|
| user1 | qwerty |
| user2 | 12345678 |

<figcaption>Unencrypted User Table</figcaption>

If the database is compromised (e.g. through direct access or SQL injection attacks) the usernames and password are directly exposed and can be used to login to any user's account.

# Password Hashing

A better strategy is to store the hash of the password. In this case we are using the SHA256 hash function for simplicity. Do not use SHA256 in a production environment because it is a fast hash and will be easy to crack using dictionary or brute force attacks as we will discuss later. Use Argon2 or a similar slow hash function instead (see my post about [One-Way Cryptographic Algorithms](https://jdspugh.github.io/2023/04/06/one-way-cryptographic-algorithms.html)).

`Password = SHA256(Password)`

| Username | Password |
|-|-|
| user1 | 65e84be33532fb784c48129675f9eff3a682b27168c0ea744b2cf58ee02337c5 |
| user2 | ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f |

<figcaption>Password Hashed User Table</figcaption>

# reverse hash lookups

Since cryptographic hash functions, including SHA256, are designed to be irreversible you might think that passwords are now safe in the database, even if it is compromised. If all password where strong (long and random) this would be the case. The reality is that users often choose very weak passwords (such as the ones I chose: `qwerty` and `12345678`). What an attacker can do is prepare a table of common passwords and their corresponding hashes. This is known as a rainbow table.

reverse hash lookups trade storage space for computation time. The attacker stores a table of common passwords and their corresponding computed hashes. reverse hash lookups are most effective against slow hashing algorithms since the computational time to storage space ratio is the highest. For fast hashing algorithms like SHA256 the gains will be much less.

| Password | Hash |
|-|-|
| qwerty | 65e84be33532fb784c48129675f9eff3a682b27168c0ea744b2cf58ee02337c5 |
| 12345678 | ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f |
| ... | ... |

<figcaption>Rainbow Table</figcaption>

By adding a large number of passwords and their hashes to the table the attacker can then rapidly search the table for the corresponding `Hash`  in the user table and, if found, retrieve the corresponding `Password` from the rainbow table. Note that if user passwords where strong (long and random) then reverse hash lookups would be ineffective.

reverse hash lookups are most effective against slow hashing algorithms. For fast hashing algorithms like SHA256 a brute force attack would be similarly effective.

# Pepper

A pepper (or secret salt) is a fixed value stored separately from the database (preferably in some form of secure storage). It is combined with the password to produce different hash values compared with the previous table. The pepper is randomly chosen and doesn't change throughout the lifetime of the application:

```
Pepper = wtWy8vb3Ov4FFiFF
Password = SHA256(Password + Pepper)
```

| Username | Password |
|-|-|
| user1 | 2583015da33f1fd72efc0b6384412a9d5443a55f52284fa1f7e0f9b5ebe3f38d |
| user2 | 51d437a138ac402cba22c12349b874259eecd38087728f961e10260308d4ead7 |

<figcaption>Password Hashed and Peppered User Table</figcaption>

Now we see that the rainbow table we created before will no longer be applicable to our newly peppered passwords as the SHA256 values don't match any more.

This method is secure if the pepper is kept secret. But if the pepper is discovered the attacker can easily make a new rainbow table with the pepper in front of each password and use this to attack the peppered user table.

If the pepper is lost, password verification is no longer possible as the correct hash cannot be generated. All users would have to create new passwords.

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

Salts, like peppers, are combined with passwords before hashing for added security. Salts are different to peppers in that they are intended to be unique per user and are stored in the database alongside the username.

Salts increase the storage space required for reverse hash lookups used in rainbow table attacks.

`<rainbow table storage space> = <hashed password length> * <number of unique salt values> + <attack dictionary size>`

## Username/Email as Salt

One might think that you could use the username or email address of a user as the salt to ensure uniqueness. While this initially seems a great idea you would not be able to change the username or email address without also creating a new password. Let's look at some other strategies then.

## Sequential Salts

We could use a sequence number as a simple way to ensure unique salts. The vulnerability this approach has is that an attacker may create a rainbow table of known salts combined with likely passwords. This vulnerability can be mitigated by using pepper in combination with a sequence number. If the pepper is sufficiently large and random the attacker would not know which sequence numbers to use. And even if they did find the range of sequence numbers, their rainbow table could not be reused on other applications / deployments with different peppers making the reverse hash lookups pointless to create.

## Short Salts

If a salt is too short, an attacker may precompute a table of every possible salt combined with every likely password. Using a long salt ensures such a table would be prohibitively large. Another solution is to use a pepper in combination with short salts as also suggested with sequential salts.

## Salt Bits

The generally accepted best practise for salts is to produce a 128-bit random salt per user that is combined with the password before hashing. 128-bits is chosen to avoid the chances of hash collisions. Collisions create duplicate salts, reducing the security of the application as duplicate salts mean one cracked salt affects all accounts with that salt.

Depending on your requirements you may be able to use a shorter salt, which will make your application more efficient, particularly in terms of reducing the database size. 

Max Users = 8 billion

Load Factor = Max Users / Possible Salt Values

| Salt Bits | Load Factor | Brute Force Time |
|-|-|-|
| 16 | 122 070 | T / 122070 |
| 32 | 1.86 | T / 2 |
| 64 | 0.000 000 434 | T |
| 128 | 0.000 000 000 000 000 000 000 000 000 023 5 | T |
| Infinite | 0 | T |

<figcaption>Salt Bits vs Load Factor</figcaption>

From the table we can see that if we used a 16-bit salt a single successful brute force attack would crack 122 070 accounts. A 32-bit salt would crack almost 2 accounts on average. With a 64-bit or 128-bit salt the collisions are so few a brute force would be barely faster than with no collisions. Thus we can recommend a **32-bit salt for those who wish to save storage space**, and **64 or 128-bits for those for whom storage space is not a factor**.

The username, salt and hash are stored in the database. An attacker then cannot predict the text to be hashed in order to create their rainbow table, thereby rendering rainbow table attacks ineffective.

`Hash = SHA256(password + salt)`

| Username | Salt | Hash |
|-|-|-|
| user1 | 3299942662eb7925245e6b16a1fb8db4 | 5f9eb7a905e2159f2bcde6414020e03815dc7fd4655841d36d34be091a009d30 |
| user2 | d346a4fa7f9fd6e26efb8e400dd4f3ac | 5631c77a32ec3282bca6c8291f87409b0b5f9442bec280d283efe4e6e976e370 |

<figcaption>Unencrypted User Table</figcaption>

### Collisions

Considering a perfect random number generator, you will get the same number chosen more than once if your range is not large. For instance, if you are rolling a six-sided die, there is a 1 in 6 chance of rolling the same number twice in a row. In hashing this is considered a collision. Hashing algorithms are designed to avoid collisions, but the chance of collision also depends largely on the range of numbers allowed.

If you wish to optimise the length of your salt to save on storage space you can choose the bit size of your random salt based on the table below. The bit size determines the hash range. If you have a lot of users and only a few salts (due to choosing a small salt bit size) then reverse hash lookups can be made that attack all the users with that same salt, making it more efficient for the attacker.

From the below table we can see that 2<sup>64</sup> will be just enough if we're expecting ≈8 000 000 000 users i.e. one account for everyone in the world. You'll be getting on average 2 collisions per salt, which is acceptable. So we can optimise our salt to be 64-bit. Bear in mind, as mentioned before, the generally accepted best practise is 128-bits.

# Dictionary & Brute Force Attacks

Dictionary and Brute force attacks can also be prevented by using a **long random pepper**. This is secure even if the database has been compromised but the pepper is still hidden at some other location. By adding the pepper the attacker cannot compute any reasonable range of known hashes, even when the salt is known. With Argon2, the slowest algorithm we have considered, hashes can be created in the order of hundreds per second with today's consumer grade hardware. This means that common passwords with know salts could still be cracked, so the use of a pepper is still recommended.

The other option is forcing users to choose **strong passwords**. This will make it difficult or impossible for them to be cracked but also opens other security issues as strong passwords cannot be easily memorized by users. So the user needs to store them in a password manager, on paper or electronically. This comes with its own problems and if we can solve the problem without resorting to strong passwords it will be better for the users and will also result in less customer support requests for us.

# Node.js Implementation

Here is an implementation of a web based authentication system that uses Express.js and SQLite. It implements salts and peppers as recommended.

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
  const { u, p } = req.body
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
  const { u, p } = req.body
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

**Note:** The hash returned by the argon2 npm package is of the form `$id$param1=value1[,param2=value2,...]$salt$hash`. This is the [PHC](https://www.password-hashing.net/)'s standardised hash result format. It includes the salt, the hash, and the parameters the Argon2 algorithm used. This means we don't need a separate `salt` column in our `users` table because the salt is already included in the password column. It's also good to store the Argon2 parameters also in case we want to change these at a later point. We won't have to upgrade all the accounts at once.

# Conclusion

Hashing the user's password with a correctly configured **Argon2** algorithm and using a long random **salt** and long random **pepper** provides very strong password protection, even in the case of a database breach. If the pepper is discovered it stills offers good protection against dictionary, brute force and rainbow table attacks.

Two more aspects that should be delved into in more depth are the lengths of the salts and peppers and the parameters for tuning the Argon2 hashing algorithm.

# Further Reading

* _How to securely hash passwords?_, <https://security.stackexchange.com/questions/211/how-to-securely-hash-passwords>

* _Client-Plus-Server Password Hashing as a Potential Way to Improve Security Against Brute Force Attacks without Overloading the Server_, "Sergeant Major" Hare, 2015, <http://ithare.com/client-plus-server-password-hashing-as-a-potential-way-to-improve-security-against-brute-force-attacks-without-overloading-server/>

* _Method to Protect Passwords in Databases for Web
Applications_, Scott Contini, 2014, <https://eprint.iacr.org/2015/387.pdf>