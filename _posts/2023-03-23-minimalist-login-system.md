---
layout: post
title: Minimalist Login System using Node.js
---
# Goal

To produce a login system that is simpler and more secure than traditional username/password login systems.

# Terminology

* **UPL** - traditional Username/Password Login

* **MLS** - new Minimalist Login System

# Background

I was using the iOS app that comes with my Roidme Eve robot vacuum cleaner and was impressed by its login system. I'm so used to using the conventional UPL system that I didn't really think of any other way of implementing it. The Roidme app doesn't store the password but rather sends a verification code to your email which you enter at the app's login screen in order to enter the app. I found it quick, convenient, and simple. Since I had recently gone through the process of designing a UPL system I immediately recognised the potential to greatly simplify the user interface complexity, and likewise, the code complexity.

There has also been a spate of **password thefts** and in light of this and the 664 (and growing) hacked websites listed on [';--have i been pwned?](https://haveibeenpwned.com/) I realised that a user authentication system that does **not store passwords** would be **hugely beneficial** to internet users around the world.

# UX

## UPL Flow

The traditional UPL flow looks something like this:

<figure>
  <img src="/image/blog/2023-03-23-minimalist-login-system/username-password-login-flow.svg" alt="UPL Flow"/>
  <figcaption>UPL Flow</figcaption>
</figure>

## MLS Flow

Our MLS approach gives a much simpler flow. In terms of the number of screen that need to be designed and developed, it is a lot fewer:

<figure>
  <img src="/image/blog/2023-03-23-minimalist-login-system/verification-code-login-flow.svg" alt="MLS Flow"/>
  <figcaption>MLS Flow</figcaption>
</figure>

# Database Schema

## UPL Fields

| Field Name    | Data Type |
|---------------|-----------|
|`password_salt`| TEXT      |
|`password_hash`| TEXT      |

UPL systems can store plaintext passwords, but this is a major security weakness as if the database is compromised - by internal or external actors - all the users' accounts will be accessible by the attacker.

In order to mitigate this risk, passwords are usually hashed with a one-way hash function and stored as hashes in the database. This way the plain text is not viewable, nor calculable, as the hash function is one-way only.

One-way hashes do still have the vulnerability of rainbow table attacks on the hashes. To mitigate these, each password needs to be stored with its own random salt - hence the `password_salt` field.

## MLS Fields

| Field Name                | Data Type |
|---------------------------|-----------|
| `verificationCode`        | TEXT      |

* `verificationCode` - A 12-character base64 string. This gives 72 bits of entropy which is considered [strong and sufficient for securing financial information][1].

  The `verificationCode` cannot be salted

  Note: The `verificationCode` should be removed from the database upon successful login to minimise risks of phishing attacks, replay attacks, email breaches and database breaches.

## Common Fields

| Field Name                | Data Type |
|---------------------------|-----------|
| `email`                   | TEXT      |
| `token`                   | TEXT      |

* `email` - The user's email address is not strictly necessary in a UPL system, but without it there would be no mechanism for password recovery. The user's email address is always required for MLS.

* `token` - Both database schemas will use a random token that is stored in the database and also in a browser cookie upon successful login in order to identify the logged-in user between requests and can also persist between browser sessions.

  The `token`/cookie will be a 12-character base64 string. This gives 72 bits of entropy which is considered [strong and sufficient for securing financial information][1].

# Session Cookie

A secure `token` gets created on the server when a user correctly enters their verification code. The cookie is sent with the attributes `HttpOnly`, `Secure` and `SameSite`. It gets stored in the browser's cookie cache.

* `HttpOnly` - This attribute prevents JavaScript from accessing the cookie, which can help protect against cross-site scripting (XSS) attacks. By marking a cookie as HttpOnly, it can only be accessed by the server only and not client-side scripts.

* `Secure` - The Secure attribute ensures that the cookie is only sent over HTTPS connections. This prevents the cookie from being transmitted over insecure HTTP connections, protecting it from eavesdropping and man-in-the-middle attacks.

* `SameSite` - With the "Strict" setting, the cookie is only sent for requests from the browser that come pages under our domain name. This prevents Cross-Site Request Forgery (CSRF).

The cookie is sent to the server with every browser request. The server will cross reference the cookie's value with the `token` stored in the database to make sure that the user is still logged in.

# MLS vs UPL

Here is a comparison of MLS vs UPL. The issues are listed in rough order of importance. Green cells indicate a positive outcomes and red cells a negative outcome. Technically we can see a many more advantages in using the MLS vs the UPL system.

<table>
  <tr>
    <th>Issue</th>
    <th>MLS</th>
    <th>UPL</th>
  </tr>
  <tr>
    <td>Credential theft</td>
    <td style="background-color: #D4E7CE">Lower risk, temporary verification codes. A new one is created each time the user logs into a new session.</td>
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

Both UPL and MLS are vulnerable to server-side password logging attacks. This is where the server logs (or otherwise displays) the incoming password from the client (or verification code in the case of MLS).

To prevent this in UPL the user's password salt can be sent to the client with which the password can be hashed client-side before sending to the server. The password hashes are then compared

<figure>
  <img src="/image/blog/2023-03-23-minimalist-login-system/upl-client-side-salting.svg" alt="UPL Flow"/>
  <figcaption>UPL Client Side Salting</figcaption>
</figure>

# Next Steps

At the moment we use 72 bits of entropy for the verification code. This prevents brute force attacks. The disadvantage is that it can be inconvenient for the user trying to login as they need to either copy-paste the code or type all 12 base64 characters. Other minor problems that would need to be worked around are that characters such as `0` / `O` or `1` / `I` can potentially look similar to each other and cause frustration if not identified correctly by the user (we could provide a clickable link that contains the verification code in the email but this introduces a potential additional phishing attack vector). Additionally there is a small chance that random offensive words could be accidentally created with the base64 character set.

**A more convenient way** would be using a **6-digit code** that would not have any of the aforementioned problems. Using 6 digits would mean that the system would be vulnerable to brute-force attacks as it would be easy to automate 999999 login attempts in a short space of time. In order to prevent this, we can create a rate limiter that would allow only a small number of incorrect attempts over time per user. Using the proposed 6-digit code will improve the user experience at the cost of some code additional complexity. In this case we consider it worth implementing considering the trade offs.

[1]: https://www.pleacher.com/mp/mlessons/algebra/mobentr2.html