# About

This pseudo plugin will produce a table of contents. It will be floating on the left-side of the screen on wide screens, and at the top of the screen on narrow screens.

# Installation

Copy your theme's latest `_layouts/post.html` from its code repository to your blog. Modify your local copy of the file and add this to the `head` section:

```html
<link rel="stylesheet" href="/jekyll-floating-toc/assets/css/toc.css" />
```

Then add the following right before the closing </body> tag:

```html
{% include_relative jekyll-floating-toc/_includes/toc.html %}
<script src="/jekyll-floating-toc/assets/js/toc.js"></script>
```