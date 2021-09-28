/**
 * @Function: 高亮JavaScript、CSS、HTML、Lua和Wikitext，按行号跳转，并添加行号和指示色块
 * @Source: https://zh.moegirl.org.cn/mediawiki:gadget-code-prettify.js
 *          https://zh.moegirl.org.cn/User:机智的小鱼君/gadget/Highlight.js
 *          https://codemirror.net/addon/runmode/runmode.js
 * @EditedBy: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global mw, $, hljs, CodeMirror */
(() => {
    const style = `.runmode pre { border: 0; padding: 0; margin: 0; background-color: transparent; color: #000; }
code.runmode, code.runmode pre { display: inline-block; }
.runmode pre::before { content: ''; display: inline-block; }
.runmode.linenums { padding: 0; color: #999; background-color: #f7f7f7; border-color: #000; }
.runmode.linenums > ol > li { background-color: #fff; border-left: 1px solid #ddd; }`,
        langs = {js: 'javascript', javascript: 'javascript', json: 'json', css: 'css', html: 'xml',
        scribunto: 'lua', lua: 'lua', 'sanitized-css': 'css'},
        contentModel = langs[ mw.config.get( 'wgPageContentModel' ).toLowerCase() ],
        highlight_path = [ '//cdn.jsdelivr.net/gh/highlightjs/cdn-release@10.5.0/build/highlight.min.js',
        '//cdn.jsdelivr.net/gh/bhsd-harry/LLWiki@2.11/otherwiki/gadget-code-prettify.min.css'
    ],
        codemirror_path = [ '//cdn.jsdelivr.net/gh/bhsd-harry/LLWiki@2.9/otherwiki/codemirror.min.js',
        '//cdn.jsdelivr.net/gh/bhsd-harry/LLWiki@2.9/otherwiki/codemirror.min.css',
        '//cdn.jsdelivr.net/gh/bhsd-harry/LLWiki@latest/otherwiki/gadget-site-lib.codemirror.min.js'
    ],
        main = async $content => {
        if (contentModel) { $content.find( '.mw-code' ).addClass(`hljs linenums ${contentModel}`); }
        else {
            $content.find('pre[lang], code[lang]').addClass(function() {
                const lang = langs[ this.lang.toLowerCase() ];
                if (lang) { return `hljs ${lang}${this.tagName == 'PRE' ? ' linenums' : ''}`; }
            });
            $content.find( '.lang-wiki' ).removeClass( 'prettyprint' );
            $content.find( '.prettyprint' ).addClass( 'hljs' );
            $content.find( '.lang-js' ).addClass( 'javascript' );
            $content.find( '.lang-css' ).addClass( 'css' );
            $content.find( '.lang-lua' ).addClass( 'lua' );
            $content.find( '.lang-html' ).addClass( 'xml' );
        }

        const $code = $content.find( '.lang-wiki' );
        if ($code.length) { // 高亮Wikitext
            console.debug('Hook: wikipage.content, 开始执行Wikitext高亮');
            try {
                await (window.CodeMirror ? Promise.resolve() : Promise.all([
                    $.ajax(codemirror_path[0], {dataType: 'script', cache: true}),
                    mw.loader.load(codemirror_path[1], 'text/css')
                ]));
                await (CodeMirror.runmode ? Promise.resolve() : Promise.all([
                    $.ajax(codemirror_path[2], {dataType: 'script', cache: true}),
                    mw.loader.addStyleTag( style )
                ]));
                $code.each(function() { CodeMirror.runmode( this ); });
            } catch { mw.notify('无法下载CodeMirror扩展，Wikitext高亮失败！', {type: 'error'}); }
        }

        const $block = $content.find( '.hljs:not(.highlighted)' );
        if ($block.length === 0) { return; } // 高亮非Wikitext代码
        console.debug('Hook: wikipage.content, 开始执行语法高亮');
        try {
            await (window.hljs ? Promise.resolve() : Promise.all([
                $.ajax(highlight_path[0], {dataType: 'script', cache: true}),
                mw.loader.load(highlight_path[1], 'text/css')
            ]));
            // 1. 语法高亮
            $block.each(function() { hljs.highlightBlock( this ); }).addClass( 'highlighted' ).filter( '.linenums' )
                .html(function() { // 添加行号。这里不使用<table>排版，而是使用<ol>
                const $this = $(this),
                    start = $this.data( 'start' ) || $this.data( 'line-from' ) || 1;
                $this.children( ':contains(\n)' ).replaceWith(function() { // 先处理跨行元素
                    const $self = $(this);
                    return $self.html().split( '\n' )
                        .map(ele => $self.clone().html( ele ).prop( 'outerHTML' )).join('\n');
                });
                const lines = $this.html().replace(/\n$/, '').split( '\n' );
                return $('<ol>', { start,
                    html: lines.map((ele, i) => $('<li>', {html: ele, id: `L${i + start}`}))
                }).css('padding-left', `${(lines.length + start - 1).toString().length + 2.5}ch`);
            });
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
                    color = [...$siblings.slice(index, index + n)].map(({textContent: text}) => text);
                return $color.clone().css({ color: color[0].slice(0, 3) + color.slice(1, 7).join('') + ')', // eslint-disable-line
                    opacity: color[8] });
            });
        } catch { mw.notify('无法下载highlight.js，代码高亮失败！', {type: 'error'}); }
    };
    mw.hook( 'wikipage.content' ).add($content => { main($content); });
})();