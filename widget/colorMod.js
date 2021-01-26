/**
 * @Function: 用户可以自行调低某几位角色的应援色亮度。
 * @Dependencies: mediawiki.storage, oojs-ui-core, oojs-ui-windows, ext.gadget.site-lib
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/*global mw, $, OO, wgULS*/
(() => {
    const main = () => {
        // 在开头统一处理繁简文字信息
        mw.messages.set( $.extend( wgULS({
            'widget-cm-intro': '本页面使用了亮度较高的应援色，您可以在这里调节对应颜色的亮度：', 'widget-cm-rin': '星空凛',
             'widget-cm-dialog': '调节应援色亮度'
        }, {
            'widget-cm-intro': '此頁面使用了亮度較高的應援色，您可以在這裡調節對應顏色的亮度：', 'widget-cm-rin': '星空凜',
            'widget-cm-dialog': '調節應援色亮度'
        }), {'widget-cm-keke': '唐可可', 'widget-cm-label': '：亮度降低'}) );
        let mkeys, mvals, dialog, actionP, actionD, $wrapper;
        // 必须保留rgb中的空格
        const colors = { rin: ["rgb(254, 225, 85)", "rgb(253, 220, 59)", "rgb(253, 216, 34)", "rgb(253, 211, 8)",
            "rgb(235, 195, 1)", "rgb(210, 174, 1)"],
            keke: ["rgb(160, 255, 249)", "rgb(134, 255, 247)", "rgb(109, 255, 245)", "rgb(83, 254, 244)",
            "rgb(58, 255, 242)", "rgb(32, 255, 240)", "rgb(6, 255, 239)", "rgb(0, 236, 221)"]
        },
            // 调色板对话框的文字提示
            $intro = $('<p>', {text: mw.msg( 'widget-cm-intro' )}),
            wrapperPool = {},
            // 这个函数用于生成调色板对话框的select，避免重复劳动。返回一个HTML元素。
            generateWrapper = (key) => {
            wrapperPool[key] = wrapperPool[key] || $('<div>', {class: 'colorMod-wrapper', html: [
                mw.msg( `widget-cm-${key}` ), mw.msg('widget-cm-label'),
                // 只会在第一次生成时初始化，以后总是继承改变过的选项。value不能作为attr。
                $('<select>', {html: colors[key].map((ele, i) => new Option(`${i * 5}%`, i))}).val( mvals[key] )
                    .change(function() { $(this).next().css('color', colors[key][ this.value ]); }),
                $('<span>', {text: '文字'}).css('color', colors[key][ mvals[key] ])
            ]})[0];
            return wrapperPool[key];
        },
            style = mw.loader.addStyleTag(''), // 这里不用mw.util.addCSS是为了避免在代码块里定义const
            // 这个函数用于生成CSS
            generateStyle = () => {
            style.textContent = '#mw-content-text .mw-parser-output {' +
                mkeys.map(key => `--${key}-color: ${colors[key][ mvals[key] ]}`).join(';') + ';}';
        };
        // delegate事件
        $('body').on('click', '#mw-indicator-colorMod', () => {
            mw.loader.using(['oojs-ui-core', 'oojs-ui-windows']).then(() => {
                dialog = dialog || new OO.ui.MessageDialog();
                actionP = actionP || new OO.ui.ActionWidget({label: mw.msg( "ooui-dialog-message-accept" ),
                    flags: 'progressive'}),
                actionD = actionD || new OO.ui.ActionWidget({label: mw.msg( "ooui-dialog-message-reject" )});
                mw.dialog(dialog, [actionD, actionP], [$intro, $wrapper], mw.msg( 'widget-cm-dialog' )).then(() => {
                    actionP.$button.click(() => {
                        // 防止再次打開時丟失事件
                        $wrapper.detach().find( 'select' ).each(function(i) {
                            const key = mkeys[i];
                            mvals[key] = this.value;
                            mw.storage.set(`${key}-color`, this.value);
                        });
                        generateStyle();
                    });
                    actionD.$button.click(() => {
                        $wrapper.detach().find( 'select' ).val(i => mvals[ mkeys[i] ]).change(); // 还原选项
                    });
                });
            });
        });
        mw.hook( 'wikipage.content' ).add($content => {
            const $indicator = $content.find( '.mw-parser-output .page-actions-menu__list-item' );
            if ($indicator.length === 0) { return; }
            console.log('Hook: wikipage.content, 开始构建应援色调色板');
            // 更新数据
            mkeys = Object.keys( $indicator.children( 'span' ).data() );
            // 手机版创建调色板按钮，需要防止二次创建
            if (mw.config.get('skin') == 'minerva' && $('#page-actions > #mw-indicator-colorMod').length === 0) {
                $indicator.attr('id', 'mw-indicator-colorMod').insertAfter( '#language-selector' )
                    .children().wrapAll('<a>');
            }
            // 根据localStorage调整初始颜色
            mvals = Object.fromEntries( mkeys.map(key => [key, mw.storage.get( `${key}-color` ) || 0]) );
            generateStyle();
            mkeys.forEach(key => { // 处理渐变色
                $content.find( `.Lyrics_gradient.${key}-lyrics` ).css('background-image', (i, val) => {
                    // 如果之前已经替换过了也没有关系
                    return val.replace( colors[key][0], `var(--${key}-color)` );
                });
            });
            $wrapper = $( mkeys.map( generateWrapper ) );
        });
    },
        timer = setInterval(() => {
        if (!window.jQuery) { return; }
        clearInterval(timer);
        mw.widget = mw.widget || {};
        if (mw.widget.colorMod) { return; }
        console.log('End setInterval: jQuery加载完毕，开始执行Widget:colorMod');
        mw.loader.using(['mediawiki.storage', 'ext.gadget.site-lib']).then(main);
        mw.widget.colorMod = true;
    }, 500);
}) ();
