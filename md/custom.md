## Serialized Headers

### Test {.test .fu #bar style="color:red; font-style:italic;" data-is-cool="'tis true" lang=en_us}
### test
### tEst

---

## ReadMore

```md
[readMore:%LINK_TEXT%|%URL%]

I'm the middle of a long paragraph [readMore] more content...
[readMore:] hello
[readMore:View More] hello
[readMore:View More|http://blah.com/zip?blah=asdf&asdfas] hello
[readMore:View Morez|http://blah.com/zip?fu=bar  ] hello
```

I'm the middle of a long paragraph [readMore] more content...
[readMore:] hello
[readMore:View More] hello
[readMore:View More|http://blah.com/zip?blah=asdf&asdfas] hello
[readMore:View Morez|http://blah.com/zip?fu=bar  ] hello

---

## SlideShowImg

```md
[slideShowImg:%IMAGE_NAME%|%TITLE%|%DURATION%|%ALIGN%|%BG_COLOR%]

[slideShowImg:./imgs/meme_rage.jpg|Image 01|2|center|#ff00ff]
```

[slideShowImg:./imgs/meme_rage.jpg|Image 01|2|center|#ff00ff]

---

## SlideShow

```md
[slideShow:%WIDTH%|%HEIGHT%]
  %SLIDE_SHOW_IMG%
[/slideShow]

[slideShow:400|200]
  [slideShowImg:./imgs/meme_rage.jpg|Image 01|2|center|#ff00ff]
  [slideShowImg:./imgs/meme_rage.jpg|Image 02]
    [slideShowImg:./imgs/meme_rage.jpg|Image 03|||#ff0000]
[/slideShow]
```

[slideShow:400|200]
  [slideShowImg:./imgs/meme_rage.jpg|Image 01|2|center|#ff00ff]
  [slideShowImg:./imgs/meme_rage.jpg|Image 02]
    [slideShowImg:./imgs/meme_rage.jpg|Image 03|||#ff0000]
[/slideShow]

---

## ImgPopUp

```md
[imgPopUp:%IMAGE_THUMB%|%IMAGE_LARGE%|%EXTRA_CLASSES%]

[imgPopUp:./imgs/meme_rage.jpg|./imgs/meme_rage.jpg|custom-class1 custom-class2]
```

[imgPopUp:./imgs/meme_rage.jpg|./imgs/large/meme_rage.jpg|custom-class1 custom-class2]

---

## HTML5Vid

```md
[html5Video:%WIDTH%|%HEIGHT%|%VID_PATH%|%VID_THUMB%|%VID_NAME%|mp4,ogv,webm]

[html5Video:430|242|./vids|poster.jpg|big_buck_bunny|mp4,ogv,webm]
[html5Video:430||./vids|poster.jpg|big_buck_bunny|mp4,webm]
```

[html5Video:430|242|./vids|poster.jpg|big_buck_bunny|mp4,ogv,webm]
[html5Video:430||./vids|poster.jpg|big_buck_bunny|mp4,webm]