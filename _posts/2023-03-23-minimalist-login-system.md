---
layout: post
title: Minimalist Login System using Node.js
---
# Goal

To produce a login system that is simpler, more secure than traditional username/password login systems.

# Background

I was using the app that comes with my Roidme Eve robot vacuum cleaner and was impressed by its login system. I'm so used to using the conventional **username/password login** system (let's call it **UPL**) that I didn't really think of any other way of implementing it. The Roidme app doesn't store the password but rather sends a verification code to your email which you enter in order to enter the app. Let's abbreviate this **minimalist login system** to **MLS**.

# UX

## Username/Password Login Flow

The traditional UPL login flow looks something like this:

<figure>
  <img src="/image/blog/2023-03-23-minimalist-login-system/username-password-login-flow.svg" alt="Username/Password Login Flow"/>
  <figcaption>UPL Login Flow</figcaption>
</figure>

## Minimalist Login Flow

Our MLS approach gives a much simpler flow:

<figure>
  <img src="/image/blog/2023-03-23-minimalist-login-system/verification-code-login-flow.svg" alt="Verification Code Login Flow"/>
  <figcaption>MLS Flow</figcaption>
</figure>

# Database Schema

Both database schemas will use a random token that is stored in the database and also in a secure cookie upon successful login in order to remember that the user is still logged in between browser sessions. The cookie's contents can be compared with the value stored in the database.

## UPL DB Fields

| Field Name    | Data Type |
|---------------|-----------|
| email         | TEXT      |
| password_hash | TEXT      |

## MLS DB Fields

| Field Name                | Type    |
|---------------------------|---------|
| email                     | TEXT    |
| verificationCode          | INTEGER |

## Common Fields

| Field Name                | Type    |
|---------------------------|---------|
| token                     | TEXT    |

# Session Cookie

A secure token gets created on the server when a user correctly enters their verification code. The cookie is sent with the attributes `HttpOnly`, `Secure` and `SameSite`. It gets stored in the browser's cookie cache.

The cookie is sent to the server with every browser request. The server will cross reference the cookie's value with the `token` stored in the database to make sure that the user is still logged in.

### HttpOnly
This attribute prevents JavaScript from accessing the cookie, which can help protect against cross-site scripting (XSS) attacks. By marking a cookie as HttpOnly, it can only be accessed by the server only and not client-side scripts.

### Secure
The Secure attribute ensures that the cookie is only sent over HTTPS connections. This prevents the cookie from being transmitted over insecure HTTP connections, protecting it from eavesdropping and man-in-the-middle attacks.

### SameSite
With the "Strict" setting, the cookie is only sent for requests originating from the same site. With the "Lax" setting, the cookie is sent for same-site requests and some cross-site requests.

# Security

If the verification code is removed from the database upon successful login the risk of phising can be greatly reduced.

## Data Breaches

## Password Management

In the MLS users do not have to remember or manage passwords, which simplifies the login process and eliminates the risk of weak passwords.

# MLS Pros

1. **No password management** - Users do not have to remember or manage passwords for their accounts, reducing the risk of weak or reused passwords and simplifying the login process.

1. **Lower risk of credential theft** - Since there is no static password to steal, attackers have a more difficult time accessing accounts through phishing or other means. Temporary verification codes are less valuable to attackers compared to static passwords.

1. **One-time-use verification codes** - Each verification code is generated for a single login attempt and expires after a short period of time or upon successful login, reducing the risk of unauthorized access.

1. **Lower susceptibility to phishing attacks** - Since the verification code is temporary and sent to the user's email, phishing attacks become less effective as capturing a user's email address alone is not enough to gain access to their account.

1. **Potentially faster account setup** - With an MLS, users can quickly create an account or log in by providing their email address and using the verification code sent to them, without the need to create and remember a unique password.

1. **Reduced attack surface** - Since there are no passwords to crack or guess in an MLS, attackers have fewer options for gaining unauthorized access to user accounts through methods like brute force or dictionary attacks.

1. **Easier password change process** - In an MLS, users do not need to go through a password change process. Instead, they simply request a new verification code whenever they want to log in, which can be more convenient for users and reduce the risk of forgotten passwords.

1. **No risk of password reuse** - Users often reuse the same password across multiple services, increasing the risk of account compromise. In an MLS, there is no password to reuse, which eliminates this concern.

1. **Simplified backend security** - Without the need to store and secure user passwords, the backend security requirements for an MLS can be less complex than for a UPL. However, it's important to still secure tokens and other sensitive data properly.

1. **Encourages email security awareness** - Since the MLS relies on email for account access, users may be more inclined to ensure their email accounts are secure, such as by enabling two-factor authentication or using strong, unique passwords.

1. **Easier compliance with some data protection regulations** - The MLS does not store passwords, which could potentially simplify compliance with some data protection regulations that require secure storage and handling of passwords.

1. **Lower maintenance burden** - In a UPL, organizations must regularly monitor and update password policies, enforce complexity rules, and deal with password resets and account recovery. An MLS simplifies these tasks by removing the need for password management, which can result in reduced maintenance overhead for system administrators.

1. **Adaptability to different user groups** - For users with cognitive or memory impairments, an MLS can be more accessible and user-friendly, as there is no need to remember and input a password. This can lead to a more inclusive user experience for a wider range of individuals.

1. **Improved user onboarding** - The MLS can streamline user onboarding by reducing the steps needed to create an account or authenticate. Users simply provide their email address and enter the verification code they receive, which can result in a faster and more seamless registration process, potentially leading to higher user adoption rates.

1. **Password-related support reduction** - By eliminating the need for users to manage passwords, the MLS can reduce the volume of password-related support requests, such as password resets and account recovery. This can lead to decreased support costs and increased efficiency for support teams.

1. **Enhanced security for shared devices** - On shared or public devices, the MLS can reduce the risk of password theft by eliminating the need to enter a password. Users only need to access their email account to retrieve the verification code, which can minimize the potential for password theft through keyloggers, shoulder surfing, or other similar methods.

# MLS Cons

1. **Offline email access** - In scenarios where a user has limited or no access to their email account (e.g., connectivity issues, email service outages, or while traveling), they may still be able to log in using their stored username/password credentials with the UPL. In contrast, the MLS requires access to the user's email to receive and enter the verification code.

1. **Independence from email providers** - The UPL doesn't rely on email services for authentication, which can be beneficial in cases where email providers experience downtime, delays, or deliverability issues. In contrast, the MLS is dependent on the email service to send and receive verification codes for successful login.

1. **Familiarity** - The UPL is widely used and familiar to most users. People are accustomed to using a username and password to log in to various services, which may result in a smoother user experience and easier adoption.

1. **User trust** - As users are more familiar with the UPL, they may have more trust in it compared to the MLS. Adopting a new authentication system can be met with skepticism by some users, who may feel more secure using the traditional username/password method they are accustomed to.

1. **Login speed** - Once users memorize their credentials, the UPL could potentially provide a faster login experience, as users can directly enter their username and password without having to wait for an email with a verification code or launch their email app, as required by the MLS.

# Next Steps

Rate limiting. A rate limiter will be built so that we can have 6-digit verification codes. This will improve the user experience at the cost of some code complexity.