---
layout: post
title: Minimalist Login System using Node.js
---
# UX

<figure>
  <img src="/image/blog/2023-03-23-minimalist-login-system/username-password-login-flow.svg" alt="Username/Password Login Flow"/>
  <figcaption>Username/Password Login Flow</figcaption>
</figure>

<figure>
  <img src="/image/blog/2023-03-23-minimalist-login-system/verification-code-login-flow.svg" alt="Verification Code Login Flow"/>
  <figcaption>Verification Code Login Flow</figcaption>
</figure>

# Background

I was using the app that comes with my Roidme Eve robot vacuum cleaner and was impressed by its login system. I'm so used to using the conventional Username/Password system that I didn't really think of any other way of implementing it. The Roidme app doesn't store the password but rather sends a verification code to your email which you enter in order to enter the app. The verification code is sent to your email address.