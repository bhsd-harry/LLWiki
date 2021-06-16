/**
 * @Function: 借鉴Chrome和Edge设计的小型音乐播放元件，并提供音量调节（除iOS）和下载功能
 * @Dependencies: jquery.client, oojs-ui-core, ext.gadget.site-lib
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global mw, $, wgULS */
(() => {
    const main = async () => {
        mw.widget = mw.widget ?? {};
        if (mw.widget.listen) { return; }
        let audio, menu, vup, vdown, $download, browser;
        const skin = mw.config.get( 'skin' ) == 'vector',
            initialize = () => { // 调节音量相关，iOS无视就行
            const volume = audio.volume;
            // 以下由于浮点精度不能精确比较
            vup.setDisabled( volume > 0.95 );
            vdown.setDisabled( volume < 0.05 ).$label.children( '.fa' )
                .toggleClass('fa-volume-down', volume > 0.05).toggleClass('fa-volume-mute', volume < 0.05);
        };
        $('#bodyContent').on('click', '.listen > i:first-of-type', function() {
            const $this = $(this).toggleClass( 'fa-play fa-pause' ),
                $ad = $this.prev( 'audio' ),
                ad = $ad[0];
            ad[ad.paused ? 'play' : 'pause']();
            if ($ad.data( 'event' )) { return; }
            $ad.data('event', true).on('ended', () => {
                ad.currentTime = 0;
                $this.toggleClass( 'fa-play fa-pause' );
            });
        }).on('click', '.listen > .fa-ellipsis-v', function() {
            const $this = $(this),
                $audio = $this.prevAll( 'audio' ),
                src = $audio.children( 'source' ).attr( 'src' );
            audio = $audio[0];
            menu.setFloatableContainer( $this ); // 测试表明必须先setFloatableContainer再toggle
            menu.toggle( true );
            $download.attr({href: src, download: src.split( '/' ).pop()});
            if (browser != 'iphone') { initialize(); }
        });
        mw.widget.listen = true;
        await mw.loader.using( ['jquery.client', 'oojs-ui-core', 'ext.gadget.site-lib'] );
        mw.messages.set( wgULS({
            'widget-li-up': '音量上调', 'widget-li-down': '音量下调', 'widget-li-download': '下载'
        }, {
            'widget-li-up': '音量上調', 'widget-li-down': '音量下調', 'widget-li-download': '下載'
        }) );
        browser = $.client.profile().name;
        menu = mw.menu([ ...browser == 'iphone' ? [] : [ // iOS不可通过JavaScript调节音量
            {text: mw.msg( 'widget-li-up' ), icon: 'volume-up', data: 1, click: () => {
            audio.volume += 0.1;
            vup.setSelected( audio.volume < 0.95 );
            initialize();
        }}, {text: mw.msg( 'widget-li-down' ), icon: 'volume-down', data: 2, click: () => {
            audio.volume -= 0.1;
            vdown.setSelected( audio.volume > 0.05 );
            initialize();
        }} ], $.extend( {text: mw.msg( 'widget-li-download' ), icon: 'download', data: 3},
            browser == 'firefox' ? {click: () => { menu.toggle(); }} : null)
        ], {id: 'listen-menu', hideOnChoose: false}, true).on('ready', () => {
            // 有自制icon时，OO.ui自带的isClipped处理不正确
            if (menu.$element.width() > 45 + (skin ? 14 : 16) * (browser == 'iphone' ? 2 : 4)) { return; }
            menu.setHorizontalPosition( menu.horizontalPosition == 'start' ? 'end' : 'start' );
        });
        vup = menu.findItemFromData( 1 );
        vdown = menu.findItemFromData( 2 );
        $download = menu.findItemFromData( 3 ).$label.wrap( '<a>' ).parent();
    };
    if (window.jQuery) { main(); }
    else { window.addEventListener('jquery', main); }
}) ();
