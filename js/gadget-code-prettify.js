// 由ResourceLoader直接调用，不可使用ES6语法
/**
 * @Function: 高亮JavaScript、CSS、HTML和Lua，并添加行号和指示色块
 * @Source: https://zh.moegirl.org.cn/mediawiki:gadget-code-prettify.js和https://zh.moegirl.org.cn/user:机智的小鱼君/gadget/Highlight.js
 * @EditedBy: https://llwiki.org/zh/user:bhsd
 */
"use strict";
/*global hljs */
const acceptLangs = {js: "javascript", javascript: "javascript", json: "json", css: "css", html: "xml",
    scribunto: "lua", lua: "lua"},
    contentModel = mw.config.get( "wgPageContentModel" ).toLowerCase();
mw.hook( 'wikipage.content' ).add(function($content) {
    if (contentModel in acceptLangs) {
        $content.find( '.mw-code' ).addClass('hljs linenums ' + acceptLangs[contentModel]);
    }
    $content.find('pre[lang], code[lang]').addClass(function() {
        const $self = $(this),
            lang = $self.attr( "lang" ).toLowerCase();
        if (lang in acceptLangs) { return "hljs " + acceptLangs[lang] + ($self.is('pre') ? " linenums" : ""); }
    });
    const $block = $content.find( '.hljs:not(.highlighted)' ); // 不重复高亮
    if ($block.length === 0) { return; }
    console.log('Hook: wikipage.content, 开始执行语法高亮');
    const path = '//cdn.jsdelivr.net/gh/highlightjs/cdn-release@10.5.0/build/highlight.min.js';
    // polyfill，用于低版本维基站点，这里用了ES6语法
    if (!mw.loader.getScript) {
        mw.loader.getScript = (url) => $.get({url, dataType: 'script', cache: true});
    }
    (window.hljs ? Promise.resolve() : mw.loader.getScript( path )).then(function() { // 不重复下载脚本
        $block.each(function() { hljs.highlightBlock( this ); }).addClass( 'highlighted' ).filter( '.linenums' )
            .html(function() { // 添加行号。这里不使用<table>排版，而是使用<ol>
            const $this = $(this);
            $this.children( ':contains(\n)' ).replaceWith(function() { // 先处理跨行元素
                const $self = $(this);
                return $self.html().split( '\n' ).map(function(ele) {
                    return $self.clone().html( ele ).prop( 'outerHTML' );
                }).join('\n');
            });
            var lines = $this.html().replace(/\n$/, '').split('\n');
            if (mw.config.get( 'wgNamespaceNumber' ) == 274) { lines = lines.slice(1, -1); } // 扔掉首尾的Wikitext注释
            return $('<ol>', {html: lines.map(function(ele) { return $('<li>', {html: ele}); })})
                .css('padding-left', lines.length.toString().length + 2.5 + 'ch');
        });
        mw.hook( 'code.prettify' ).fire( $block );
        const $cssblock = $block.filter( '.css' ); // 对CSS代码添加指示色块
        if ($cssblock.length === 0) { return; }
        const $color = $('<span>', {class: 'hljs-color'});
        $cssblock.find( '.hljs-number:contains(#)' ).before(function() { // 16进制颜色
            const color = this.textContent,
                n = color.length,
                alpha = n == 5 ? color[4].repeat(2) : color.slice(7);
            return $color.clone().css({ color: color.slice(0, n > 5 ? 7 : 4),
                opacity: alpha ? parseInt(alpha, 16) / 255 : undefined });
        });
        $cssblock.find( '.hljs-built_in:contains(rgb), .hljs-built_in:contains(hsl)' ).before(function() { // RGB颜色
            const $siblings = $(this).parent().contents(), // 标点符号都是text节点，所以需要使用contents
                index = $siblings.index( this ),
                n = this.textContent.length == 4 ? 9 : 7, // rgba/hsla或rgb/hsl
                // 右半括号那一项可能有分号
                color = $siblings.slice(index, index + n).map(function() { return this.textContent; }).toArray();
            return $color.clone().css({ color: color[0].slice(0, 3) + color.slice(1, 7).join('') + ')'
                opacity: color[8] });
        });
    }, function(reason) { mw.apiFailure(reason, 'highlight.js'); });
});
