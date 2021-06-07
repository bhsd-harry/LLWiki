/**
 * @Function: 高亮JavaScript、CSS、HTML和Lua，按行号跳转，并添加行号和指示色块
 * @Dependencies: ext.gadget.site-lib
 * @Source: https://zh.moegirl.org.cn/mediawiki:gadget-code-prettify.js和https://zh.moegirl.org.cn/User:机智的小鱼君/gadget/Highlight.js
 * @EditedBy: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/*global hljs */
(() => {
const acceptLangs = {js: 'javascript', javascript: 'javascript', json: 'json', css: 'css', html: 'xml',
    scribunto: 'lua', lua: 'lua', 'sanitized-css': 'css'},
    contentModel = mw.config.get( 'wgPageContentModel' ).toLowerCase();
mw.hook( 'wikipage.content' ).add(function($content) {
    if (contentModel in acceptLangs) {
        $content.find( '.mw-code' ).addClass('hljs linenums ' + acceptLangs[contentModel]);
    }
    $content.find('pre[lang], code[lang]').addClass(function() {
        const $self = $(this),
            lang = $self.attr( 'lang' ).toLowerCase();
        if (lang in acceptLangs) { return 'hljs ' + acceptLangs[lang] + ($self.is('pre') ? ' linenums' : ''); }
    });
    $content.find( '.prettyprint' ).addClass( 'hljs' );
    $content.find( '.lang-js' ).addClass( 'javascript' );
    $content.find( '.lang-css' ).addClass( 'css' );
    $content.find( '.lang-lua' ).addClass( 'lua' );
    $content.find( '.lang-html' ).addClass( 'xml' );
    const $block = $content.find( '.hljs:not(.highlighted)' ); // 不重复高亮
    if ($block.length === 0) { return; }
    console.log('Hook: wikipage.content, 开始执行语法高亮');
    const path = '//cdn.jsdelivr.net/gh/highlightjs/cdn-release@10.5.0/build/highlight.min.js';
    (window.hljs ? Promise.resolve() : $.ajax(path, {dataType: 'script', cache: true})).then(() => { // 不重复下载脚本
        // 1. 语法高亮
        $block.each(function() { hljs.highlightBlock( this ); }).addClass( 'highlighted' ).filter( '.linenums' )
            .html(function() { // 添加行号。这里不使用<table>排版，而是使用<ol>
            const $this = $(this),
                start = $this.data( 'start' ) || 1;
            $this.children( ':contains(\n)' ).replaceWith(function() { // 先处理跨行元素
                const $self = $(this);
                return $self.html().split( '\n' )
                    .map(ele => $self.clone().html( ele ).prop( 'outerHTML' )).join('\n');
            });
            var lines = $this.html().replace(/\n$/, '').split('\n');
            return $('<ol>', { start: start,
                html: lines.map((ele, i) => $('<li>', {html: ele, id: 'L' + (i + start)}))
            }).css('padding-left', (lines.length + start - 1).toString().length + 2.5 + 'ch');
        });
        mw.hook( 'code.prettify' ).fire( $block );
        // 2. 手动跳转
        const fragment = decodeURIComponent( location.hash.slice(1) ),
            target = document.getElementById( fragment || null ); // 用户输入内容，禁止使用$()
        if (/^L\d+$/.test( fragment ) && target) { target.scrollIntoView({ behavior: 'smooth' }); }
        // 3. 对CSS代码添加指示色块
        const $cssblock = $block.filter( '.css' );
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
            return $color.clone().css({ color: color[0].slice(0, 3) + color.slice(1, 7).join('') + ')',
                opacity: color[8] });
        });
    }, () => { mw.notify('无法下载highlight.js，代码高亮失败！', {type: 'error'}); });
});
}) ();
