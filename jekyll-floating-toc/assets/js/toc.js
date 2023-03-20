document.addEventListener("DOMContentLoaded", () => {
  var toc = ""
  var level = 0

  document.getElementById("main-content").innerHTML
    .replace(/<(h[1-6])[^>]*>([^<]+)<\/\1>/g, (str, openTag, title) => {
      var openLevel = parseInt(openTag.charAt(1))

      if (openLevel > level) {
        toc += (new Array(openLevel - level + 1)).join("<ul>")
      } else if (openLevel < level) {
        toc += (new Array(level - openLevel + 1)).join("</ul>")
      }

      level = parseInt(openTag.charAt(1))
      return "<" + openTag + "><a name=\"" + title + "\"></a>" + title + "</" + openTag + ">"
    })

  toc += (new Array(level + 1)).join("</ul>")
  document.getElementById("toc").innerHTML += toc
})