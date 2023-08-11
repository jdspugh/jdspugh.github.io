---
layout: post
title: Email based OTP Login System using Node.js
---
# Goal

To produce a login system to authenticate users that is simpler and more secure than traditional username/password login systems. We will make an implementation using Node.js and Express.

# What is Authentication?

Authentication is a way to prove who you are. This can be done in several ways:

* By revealing what you know:
  * Username / password
  * Secret key
* By revealing where you are:
  * IP address
  * Physical location
* By revealing what you are:
  * Biometrics
    * Fingerprints
    * Face recognition
    * Voice recognition
* By revealing what you have:
  * Security token
  * Phone via
    * SMS One-Time-Password (OTP)
    * Voice call One-Time-Password (OTP)
    * Authenticator app One-Time-Password (OTP)

For simplicity we will focus only on username/password authentication.

# Terminology

* **UPL** - traditional Username/Password Login system

* **OPT** - email based One-Time-Password login system

# Background

I was using the iOS app that comes with my Roidme Eve robot vacuum cleaner and was impressed by its login system. I'm so used to using the conventional UPL system that I didn't really think of any other way of implementing it. The Roidme app doesn't store the password but rather sends a verification code to your email which you enter at the app's login screen in order to enter the app. I found it quick, convenient, and simple. Since I had recently gone through the process of designing a UPL system I immediately recognised the potential to greatly simplify the user interface complexity, and likewise, the code complexity.

There has also been a spate of **password thefts** and in light of this and the 650+ hacked websites listed on [';--have i been pwned?](https://haveibeenpwned.com/) I realised that a user authentication system that does **not store passwords** (or even hashes of the passwords) would be **hugely beneficial** to internet users around the world.

# UX

## UPL Flow

The traditional UPL flow looks something like this. It requires 8 UI screens to be designed:

<figure>
  <img src="/image/blog/2023-03-23-minimalist-login-system/username-password-login-flow.svg" alt="UPL Flow"/>
  <figcaption>UPL Flow</figcaption>
</figure>

## OPT Flow

Our OPT approach gives a much simpler flow with only 3 UI screens to be designed:

<figure>
  <img src="/image/blog/2023-03-23-minimalist-login-system/verification-code-login-flow.svg" alt="OPT Flow"/>
  <figcaption>OPT Flow</figcaption>
</figure>

# Sequence Diagrams

<!-- ## UPL

```mermaid
sequenceDiagram
  actor User
  participant Browser
  participant Email
  participant Server
  participant Database  
  autonumber
  User->>Browser: Enter login page url
  Browser->>Server: Request login page
  Server->>Browser: Return login page
  User->>Browser: Enter email address
  User->>Browser: Request verification code
  Browser->>Server: Request verification code (email)
  Server->>Email: Send verification code to user's email
  Server->>Database: Save hashed verification code
  Email->>User: Retrieve verification code
  User->>Browser: Enter verification code
  Browser->>Server: Submit hashed verification code
  Note right of Browser: Hashed to prevent server-side<br />credential harvesting
  Server->>Database: Find hashed verification code
  Database->>Server: Result
  alt Found
    Server->>Browser: Return dashboard page
  else Not found
    Server->>Browser: Show error message
  end
``` -->

## OPT

```mermaid
sequenceDiagram
  actor User
  participant Browser
  participant Email
  participant Server
  participant Database  
  autonumber
  User->>Browser: Enter login page url
  Browser->>Server: Request login page
  Server->>Browser: Return login page
  User->>Browser: Enter email address
  User->>Browser: Request verification code
  Browser->>Server: Request verification code (email)
  Note over Server: Generate salt
  Server->>Browser: Return salt
  Note over Server: Generate verification code
  Server->>Email: Email verification code
  Note over Server: hash = SHA256(pepper + Argon2(salt + verification code))
  Server->>Database: Save (hash, salt)
  Email->>User: Retrieve verification code
  User->>Browser: Enter verification code
  Note over Browser: hash1 = Argon2(salt + verification code)
  Browser->>Server: Submit (hash1)
%%   Note right of Browser: Hashed to prevent server-side<br />credential harvesting
  Note over Server: hash2 = SHA256(pepper + hash1)
  Server->>Database: Exists (hash2) ?
  Database->>Server: Result
  alt Exists
    Server->>Browser: Return dashboard page
  else Doesn't Exist
    Server->>Browser: Return error message
  end
```

# Database Schema

## UPL Fields

| Field Name    | Data Type |
|---------------|-----------|
|`password_hash`| TEXT      |
|`password_salt`| TEXT      |

* `password_hash` - UPL systems can store plaintext passwords, but this is a major security weakness as if the database is compromised - by internal or external actors - all the users' accounts will be accessible by the attacker.

  In order to mitigate this risk, passwords should be hashed with a strong one-way hash function (e.g. SHA256 or SHA512) and stored as hashes in the database. This way the plain text is not viewable, nor decodable, as the hash function is one-way only.

* `password_salt` - One-way hashes do still have the vulnerability of rainbow table attacks on the hashes. To mitigate these, each password needs to be stored with its own random salt - hence the `password_salt` field.

## OPT Fields

| Field Name                | Data Type |
|---------------------------|-----------|
| `verification_code_hash`  | TEXT      |
| `verification_code_salt`  | TEXT      |

* `verificationCode` - A 12-character base64 string. This gives 72 bits of entropy which is considered [strong and sufficient for securing financial information][1].

  The `verificationCode` cannot be salted

  Note: The `verificationCode` should be removed from the database upon successful login to minimise risks of phishing attacks, replay attacks, email breaches and database breaches.

## Common Fields

| Field Name                | Data Type |
|---------------------------|-----------|
| `email`                   | TEXT      |
| `token`                   | TEXT      |

* `email` - The user's email address is not strictly necessary in a UPL system, but without it there would be no mechanism for password recovery. The user's email address is always required for OPT.

* `token` - Both database schemas will use a random token that is stored in the database and also in a browser cookie upon successful login in order to identify the logged-in user between requests and can also persist between browser sessions.

  The `token`/cookie will be a 12-character base64 string. This gives 72 bits of entropy which is considered [strong and sufficient for securing financial information][1].

# Hashing vs Encryption

**Encryption** is a _two-way_ process. You can encrypt passwords with a private key, and decrypt them with the same private key. If the private key is discovered by an outsider then they can decrypt your passwords also.

**Hashing** is a _one-way_ process. A well designed hashing algorithm cannot be reversed. If you hash passwords the original password can never be recovered again. The exception being for weak passwords which are vulnerable to _brute force_ (attacks short passwords), _dictionary_ (attacks common passwords) and _rainbow table_ attacks (attacks short and/or common passwords).

# Client-Side Hashing

## OPT

For extra security we can hash the incoming verification code from the client before it is sent. This will prevent server-side credential harvesting.

# Password Character Sets

To create a strong and secure password we recommend using the full list of 96 printable ASCII characters that are easily typed on a standard keyboard:

| Character Type | Count | Characters |
|-|-|-|
| Uppercase letters       | 26    | `ABCDEFGHIJKLMNOPQRSTUVWXYZ` |
| Lowercase letters       | 26    | `abcdefghijklmnopqrstuvwxyz` |
| Digits                  | 10    | `0123456789` |
| Punctuation characters  | 33    | ```!"#$%&'()*+,-./:;<=>?@[]^_`{|}~``` |
| Space                   | 1     | ` ` |

<figcaption>Recommended Character Set for Strong Passwords</figcaption>

Including a mix of these character types when creating a password helps to improve its strength and security. The more diverse the character set used, the harder it is for an attacker to guess or crack it using brute force or dictionary attacks in the case where the password hashes, their salts and the pepper have been discovered.

In the case where user table or the pepper remain secure the passwords are guaranteed safe regardless of password strength.

# Password Strength

Ideally we would like users to have strong passwords (e.g. 10+ random characters). Enforcing strong passwords can introduce usability issues as it's difficult to remember long random passwords. It may introduce new security issues. Users may potentially store them electronically or write them down which adds further attack vectors. They will also be more likely to forget them, introducing more customer support requests.

Using salts and a pepper any length password is safe while the pepper remains undiscovered. If the salts and pepper are found out the password hashes will be vulnerable to dictionary and brute force attacks.

Even with Argon2 slow hashing weak passwords (short, common or dictionary based) could be discovered.

We recommend 8+ ASCII characters to thwart brute force attacks.

We recommend a filter to filter out dictionary words or combinations of them to thwart dictionary attacks. The ideal filter would cover all the potential words and combinations an attacker would use. If this is the case even in the case of a database breach and discovered pepper the user passwords would still be safe.

# Session Cookie

A secure `token` gets created on the server when a user correctly enters their verification code. The cookie is sent with the attributes `HttpOnly`, `Secure` and `SameSite`. It gets stored in the browser's cookie cache.

* `HttpOnly` - This attribute prevents JavaScript from accessing the cookie, which can help protect against cross-site scripting (XSS) attacks. By marking a cookie as HttpOnly, it can only be accessed by the server only and not client-side scripts.

* `Secure` - The Secure attribute ensures that the cookie is only sent over HTTPS connections. This prevents the cookie from being transmitted over insecure HTTP connections, protecting it from eavesdropping and man-in-the-middle attacks.

* `SameSite` - With the "Strict" setting, the cookie is only sent for requests from the browser that come pages under our domain name. This prevents Cross-Site Request Forgery (CSRF).

The cookie is sent to the server with every browser request. The server will cross reference the cookie's value with the `token` stored in the database to make sure that the user is still logged in.

# OPT vs UPL

Here is a comparison of OPT vs UPL. The issues are listed in rough order of importance. Green cells indicate a positive outcomes and red cells a negative outcome. Technically we can see a many more advantages in using the OPT vs the UPL system.

<table>
  <tr>
    <th>Issue</th>
    <th>OPT</th>
    <th>UPL</th>
  </tr>
  <tr>
    <td>Credential theft</td>
    <td style="background-color: #D4E7CE">Lower risk, temporary verification codes.<br /><br />A new random verification code is created each time the user requests one and it is removed from the database once they have successfully logged in. Codes should be removed after a few minutes for added security.<br /><br />If all credentials are stolen all users can be safely logged out in order to invalidate the stolen credentials.</td>
    <td style="background-color: #F2C5C6">Higher risk, static passwords can be stolen and remain valid until the user changes their password.</td>
  </tr>
  <tr>
    <td>Backend security complexity</td>
    <td style="background-color: #D4E7CE">Simplified security requirements</td>
    <td style="background-color: #F2C5C6">Requires secure storage and handling of passwords</td>
  </tr>
  <tr>
    <td>Phishing attacks</td>
    <td style="background-color: #D4E7CE">Lower susceptibility</td>
    <td style="background-color: #F2C5C6">Higher susceptibility</td>
  </tr>
  <tr>
    <td>Brute force and dictionary attacks</td>
    <td style="background-color: #D4E7CE">Reduced attack surface</td>
    <td style="background-color: #F2C5C6">Vulnerable to such attacks</td>
  </tr>
  <tr>
    <td>Compliance with data protection regulations</td>
    <td style="background-color: #D4E7CE">Potentially simpler compliance</td>
    <td style="background-color: #F2C5C6">Requires secure storage and handling of passwords</td>
  </tr>
  <tr>
    <td>System admin</td>
    <td style="background-color: #D4E7CE">Reduced maintenance overhead for system administrators</td>
    <td style="background-color: #F2C5C6">Requires regular monitoring and updating of password policies</td>
  </tr>
  <tr>
    <td>Password-related support</td>
    <td style="background-color: #D4E7CE">Reduced volume of password-related support requests</td>
    <td style="background-color: #F2C5C6">Higher volume of password-related support requests</td>
  </tr>
  <tr>
    <td>Password management</td>
    <td style="background-color:#D4E7CE">No need to remember or manage passwords</td>
    <td style="background-color:#F2C5C6">Requires remembering and managing passwords</td>
  </tr>
  <tr>
    <td>Adaptability to different user groups</td>
    <td style="background-color: #D4E7CE">More accessible and user-friendly for users with cognitive or memory impairments</td>
    <td style="background-color: #F2C5C6">May be less accessible for some user groups</td>
  </tr>
  <tr>
    <td>Security for shared devices</td>
    <td style="background-color: #D4E7CE">Reduced risk of password theft</td>
    <td style="background-color: #F2C5C6">Higher risk of password theft on shared or public devices</td>
  </tr>
  <tr>
    <td>Risk of password reuse</td>
    <td style="background-color: #D4E7CE">Eliminates concern of password reuse</td>
    <td style="background-color: #F2C5C6">Higher risk of account compromise due to password reuse</td>
  </tr>
  <tr>
    <td>One-time-use verification codes</td>
    <td style="background-color: #D4E7CE">Each verification code is generated for a single login attempt and expires after a short period of time or upon successful login</td>
    <td style="background-color: #F2C5C6">N/A</td>
  </tr>
  <tr>
    <td>Login speed</td>
    <td style="background-color: #F2C5C6">Potentially slower, requires email verification code</td>
    <td style="background-color: #D4E7CE">Faster for users with memorized credentials</td>
  </tr>
  <tr>
    <td>Offline access</td>
    <td style="background-color: #F2C5C6">Requires email access to retrieve verification code</td>
    <td style="background-color: #D4E7CE">Login possible with stored credentials</td>
  </tr>  
  <tr>
    <td>Email dependency</td>
    <td style="background-color: #F2C5C6">Dependent on email service availability</td>
    <td style="background-color: #D4E7CE">Independent of email services</td>
  </tr>  
  <tr>
    <td>User trust</td>
    <td style="background-color: #F2C5C6">May need time to gain user trust</td>
    <td style="background-color: #D4E7CE">Well-established and trusted by users</td>
  </tr>
  <tr>
    <td>Familiarity</td>
    <td style="background-color: #F2C5C6">Less familiar, may require user education and adaptation</td>
    <td style="background-color: #D4E7CE">Widely used and familiar, easier adoption</td>
  </tr>  
  <tr>
    <td>Email security awareness</td>
    <td style="background-color: #D4E7CE">Encourages users to secure their email accounts</td>
    <td style="background-color: #F2C5C6">No direct impact on email security awareness</td>
  </tr>  
  <tr>
    <td>User registration</td>
    <td style="background-color: #D4E7CE">Faster and more seamless registration process</td>
    <td style="background-color: #F2C5C6">Potentially slower registration and authentication process</td>
  </tr>  
  <tr>
    <td>Password change process</td>
    <td style="background-color: #D4E7CE">No need for a password change process</td>
    <td style="background-color: #F2C5C6">Requires password change process</td>
  </tr>
</table>

## Password logging

Both UPL and OPT are vulnerable to server-side password logging attacks. This is where the server logs (or otherwise displays) the incoming password from the client (or verification code in the case of OPT).

To prevent this in UPL the user's password salt can be sent to the client with which the password can be hashed client-side before sending to the server. The password hashes are then compared

<figure>
  <img src="/image/blog/2023-03-23-minimalist-login-system/upl-client-side-salting.svg" alt="UPL Flow"/>
  <figcaption>UPL Client Side Salting</figcaption>
</figure>

# Implementation Checklist

Email

1. User email validation: Ensure that the user provides a valid email address during the login process.

1. Email delivery: Send the generated verification code to the user's email address securely and promptly.

Verification code

1. Unique verification code generation: Generate unique codes for each login attempt.

1. Code expiration: Implement a time limit for verification code validity (e.g., 10-15 minutes).

1. Verification code input: Provide a user interface for the user to input the received verification code.

1. Code validation: Verify the inputted code against the stored code for the email address, considering the expiration time.

1. Authentication: Grant access to the user upon successful code validation.

1. User session management: Create and manage user sessions after successful authentication, including session expiration and handling of concurrent sessions.

1. User data protection: Ensure the secure storage and handling of user data (e.g., email addresses).

1. Logging and monitoring: Implement logging and monitoring for login attempts, successful logins, and other relevant events.

1. Error handling: Handle errors gracefully, providing informative error messages to users when appropriate.

1. Responsive: Test on differing screen sizes on mobile and desktop devices.

# Attack Vectors

Online

* Try username / password
  * Mitigation
    * rate limit

Offline

* Crack username / password from database
* Phishing
* Shoulder surfing

## OPT

| | Server-Side Credential Harvesting | Brute Force | Rainbow Tables | Pass-the-Hash | Same Hash | Replay Attack | Sign Up DOS |
|-|-|-|-|-|-|-|-|
| Client side hashing | Mitigated |
| Cpu + memory intensive hash (e.g. Argon2 with large hash 256/512 bits) |
| Salt |
| Server side hashing |
| Rate limiting |
| HTTPS / WSS |
| Email Verification |

# UI

# Next Steps

## Reducing the Verification Code Size

At the moment we use 72 bits of entropy for the verification code. This prevents brute force attacks. The disadvantage is that it can be inconvenient for the user trying to login as they need to either copy-paste the code or type all 12 base64 characters. Other minor problems that would need to be worked around are that characters such as `0` / `O` or `1` / `I` can potentially look similar to each other and cause frustration if not identified correctly by the user (we could provide a clickable link that contains the verification code in the email but this introduces an additional phishing attack vector). Additionally there is a small chance that random offensive words could be accidentally created with the base64 character set.

**A more convenient way** would be using a **6-digit code** that would not have any of the aforementioned problems. Using 6 digits would mean that the system would be vulnerable to brute-force attacks as it would be easy to automate 999999 login attempts in a short space of time. In order to prevent this, we can create a rate limiter that would allow only a small number of incorrect login attempts over time per user. Using the proposed 6-digit code will improve the user experience at the cost of some code additional complexity. In this case we consider it worth implementing considering the trade offs.

## Web Authentication API

A new option is using the Web Authentication API. It is supported by all major browsers now and has the potential improve the usability and security of our login system further.

References:

* _Web Authentication:
An API for accessing Public Key Credentials
Level 2_, W3C Recommendation, 2021, <https://www.w3.org/TR/webauthn-2>
* _Web Authentication API_, MDN Web Docs, 2023, <https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API>
* WebAuthn, <https://webauthn.guide>

[1]: https://www.pleacher.com/mp/mlessons/algebra/mobentr2.html