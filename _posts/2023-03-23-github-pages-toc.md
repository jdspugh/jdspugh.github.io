---
layout: post
title: Floating Table of Contents for Github Pages Posts
---
# Introduction

In this post we are going to create a responsive table of contents for your Github Pages blog. As this code is implemented in this blog you should be able to see the table of contents right now and play around with it. The implementation should work with any theme without modification but in this case I'm working with the Minima theme.

I created the table of contents code because I wanted an easy way to navigate to sections of my blog posts. Since most of the content is reference material it is really convenient to be able to jump to the relevant section at the click of a button.

If you have not already setup your Github Pages blog, follow my instructions at [Setting up a Blog with GitHub Pages](https://jdspugh.github.io/2023/02/25/github-pages-jekyll-setup.html).

# UX Design

I wanted a floating table of contents for desktop devices that sits to the side of the article and is always visible. Any heading can be clicked in order bring that section into view.

On mobile devices I wanted the table of contents to appear at the top of the article only. Since scrolling is an easy and fast operation on modern mobile devices it was enough that the user could scroll back to the top of the article if they wanted to navigate using the table of contents again.

# Implementation

## Copy your theme's post.html

The first step will be to make a copy of your theme's `_layouts/post.html` file into your blog's repo. Create a `_layouts ` folder if you don't already have one in your blog's repo and make a copy of the `post.html` file there.

In my case (using the Minima theme) the `post.html` file it's located at <https://github.com/jekyll/minima/blob/2.5-stable/_layouts/post.html>. Since Github Pages currently uses Minima version 2.5 I needed to select the `2.5-stable` branch and use the file there. Here is the contents:

```html
---
layout: default
---
<article class="post h-entry" itemscope itemtype="http://schema.org/BlogPosting">

  <header class="post-header">
    <h1 class="post-title p-name" itemprop="name headline">{{ page.title | escape }}</h1>
    <p class="post-meta">
      <time class="dt-published" datetime="{{ page.date | date_to_xmlschema }}" itemprop="datePublished">
        {%- assign date_format = site.minima.date_format | default: "%b %-d, %Y" -%}
        {{ page.date | date: date_format }}
      </time>
      {%- if page.author -%}
        • <span itemprop="author" itemscope itemtype="http://schema.org/Person"><span class="p-author h-card" itemprop="name">{{ page.author }}</span></span>
      {%- endif -%}</p>
  </header>

  <div class="post-content e-content" itemprop="articleBody">
    {{ content }}
  </div>

  {%- if site.disqus.shortname -%}
    {%- include disqus_comments.html -%}
  {%- endif -%}

  <a class="u-url" href="{{ page.url | relative_url }}" hidden></a>
</article>
```

We are going to be modifying this file only to create the table of contents.

## Modify your local copy of post.html

This is the modified version of `post.html` with all the code we require for the table of contents:

```html
---
layout: default
---
<article class="post h-entry" itemscope itemtype="http://schema.org/BlogPosting">

  <header class="post-header">
    <h1 class="post-title p-name" itemprop="name headline">{{ page.title | escape }}</h1>
    <p class="post-meta">
      <time class="dt-published" datetime="{{ page.date | date_to_xmlschema }}" itemprop="datePublished">
        {%- assign date_format = site.minima.date_format | default: "%b %-d, %Y" -%}
        {{ page.date | date: date_format }}
      </time>
      {%- if page.author -%}
        • <span itemprop="author" itemscope itemtype="http://schema.org/Person"><span class="p-author h-card" itemprop="name">{{ page.author }}</span></span>
      {%- endif -%}</p>
  </header>

  <!-- jdspugh start -->
  <div id="toc-outer">
    <h2>Table of Contents</h2>
    <div id="toc"></div>
  </div>

  <style>
  /* set anchor scroll-to position */
  :target { scroll-margin-top: 70px }

  #toc-outer {
    width: 100%;
    overflow-y: auto;
    max-height: 80vh;
    z-index: 1000;
  }

  #toc-outer h2 {
    margin-top: 0;
    margin-bottom: 10px;
  }

  #toc ul:first-child {
    margin-left: 0;
  }

  #toc ul {
    margin-left: 1em;
    margin-bottom: 0;
  }

  #toc li {
    outline: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  #toc h1, #toc h2, #toc h3 {
    font-weight: normal;
    margin: 0;
  }

  #toc {
    counter-reset: ta;
  }
  #toc h1:before {
    content: counter(ta)" ";
  }
  #toc h1 {
    font-size: 16px;
    counter-increment: ta;
    counter-reset: tb;
  }
  #toc h2:before {
    content: counter(ta)"."counter(tb)" ";
  }
  #toc h2 {
    margin-left: 1em;
    font-size: 14px;
    counter-increment: tb;
    counter-reset: tc;
  }
  #toc h3:before {
    content: counter(ta)"."counter(tb)"."counter(tc)" ";
  }
  #toc h3 {
    margin-left: 2em;
    font-size: 12px;
    counter-increment: tc;
  }

  /* Desktop */
  @media screen and (min-width: 1400px) {
    #toc-outer {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 300px;
      background-color: #f9f9f9;
      border: 1px solid #ddd;
      padding: 8px 20px 12px;
      box-sizing: border-box;
    }
  }
  </style>

  <script>
  document.addEventListener('DOMContentLoaded', () => {
    const elPostContent = document.querySelector('.post-content')
    const elsH = elPostContent.querySelectorAll('h1,h2,h3,h4,h5,h6')

    let t = ''// toc html
    elsH.forEach(e => {
      const l = parseInt(e.tagName.charAt(1))// heading level
      t += `<a href="#${e.id}"><h${l}>${e.textContent}</h${l}></a>`
    })
    document.querySelector('#toc').innerHTML += t
  })
  </script>
  <!-- jdspugh end -->

  <div class="post-content e-content" itemprop="articleBody">
    {{ content }}
  </div>

  {%- if site.disqus.shortname -%}
    {%- include disqus_comments.html -%}
  {%- endif -%}

  <a class="u-url" href="{{ page.url | relative_url }}" hidden></a>
</article>
```

Note that the new code must be added between the `<head>` and `<div class="post-content" ...>` tags of your `post.html` file so that it appears at the top of the post when viewing on mobile devices.

# Explanation

I will briefly explain each section of the code so you understand how it works.

## html

The html is a simple placeholder that will get filled by some javascript code that runs after the post's web page has loaded.

```html
  <div id="toc-outer">
    <h2>Table of Contents</h2>
    <div id="toc"></div>
  </div>
```

## javascript

`elsH` becomes filled with references to all the header elements in the blog post. `<a>` elements are created for each header element in `elsH` that link to the relevant heading's anchor in the post. These are then inserted into the html placeholder I talked about above.

```js
  <script>
  document.addEventListener('DOMContentLoaded', () => {
    const elPostContent = document.querySelector('.post-content')
    const elsH = elPostContent.querySelectorAll('h1,h2,h3,h4,h5,h6')

    let t = ''// toc html
    elsH.forEach(e => {
      const l = parseInt(e.tagName.charAt(1))// heading level
      t += `<a href="#${e.id}"><h${l}>${e.textContent}</h${l}></a>`
    })
    document.querySelector('#toc').innerHTML += t
  })
  </script>
```

## CSS

This CSS applies formatting to the table of contents for mobile devices. The CSS also includes some code for numbering the table of contents headings.

```css
#toc-outer {
    width: 100%;
    overflow-y: auto;
    max-height: 80vh;
    z-index: 1000;
  }

  #toc-outer h2 {
    margin-top: 0;
    margin-bottom: 10px;
  }

  #toc ul:first-child {
    margin-left: 0;
  }

  #toc ul {
    margin-left: 1em;
    margin-bottom: 0;
  }

  #toc li {
    outline: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  #toc h1, #toc h2, #toc h3 {
    font-weight: normal;
    margin: 0;
  }

  #toc {
    counter-reset: ta;
  }
  #toc h1:before {
    content: counter(ta)" ";
  }
  #toc h1 {
    font-size: 16px;
    counter-increment: ta;
    counter-reset: tb;
  }
  #toc h2:before {
    content: counter(ta)"."counter(tb)" ";
  }
  #toc h2 {
    margin-left: 1em;
    font-size: 14px;
    counter-increment: tb;
    counter-reset: tc;
  }
  #toc h3:before {
    content: counter(ta)"."counter(tb)"."counter(tc)" ";
  }
  #toc h3 {
    margin-left: 2em;
    font-size: 12px;
    counter-increment: tc;
  }
```

### Responsive

Once the screen width is over `1400px` some new styling is applied that floats the table of contents to the right. The `position: fixed` floats it. The `top: 20px` and `right: 20px` pin it to the top right of the screen. The rest of the CSS is just styling.

```css
  /* Desktop */
  @media screen and (min-width: 1400px) {
    #toc-outer {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 300px;
      background-color: #f9f9f9;
      border: 1px solid #ddd;
      padding: 8px 20px 12px;
      box-sizing: border-box;
    }
  }
```

### Anchors

One final piece of the puzzle is setting the `scroll-margin-top`. You can adjust or remove this piece of code depending on how your theme works. But if you have a floating nav bar at the top of your theme you will find this useful to position the document correctly when any of the table of contents items are clicked. Without it you may find the heading hidden underneath the nav bar after clicking in the table of contents.

```css
/* set anchor scroll-to position */
:target { scroll-margin-top: 70px }
```

# Summary

I hope you can use this code for your Github Pages blog also. Your main trouble will be getting the right version of your theme's `post.html` to modify. Once you have it a straight copy and paste of the table of contents code into the file should have it working in no time!