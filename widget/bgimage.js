/**
 * @Function: 设置桌面版的页面背景图片
 * @Source: https://zh.moegirl.org.cn/Widget:SideBarPic
 * @EditedBy: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global mw */
(() => {
    const main = ($content) => {
        const $ele = $content.find( '.bgimage' );
        if ($ele.length === 0) { return; }
        console.log('Hook: wikipage.content, 开始添加背景图片');
        $ele.children( 'img' ).css('object-position', $ele.data( 'position' ));
        $ele.closest('body, #Wikiplus-Quickedit-Preview-Output').append( $ele )
            .find( '#p-logo' ).css('visibility', $ele.data('logo') == 'off' ? 'hidden' : ''); // Wikiplus预览不隐藏logo
    },
        timer = setInterval(() => {
        if (!window.jQuery) { return; }
        clearInterval(timer);
        mw.widget = mw.widget || {};
        if (mw.widget.bgimage || mw.config.get('skin') == 'minerva') { return; }
        console.log('End setInterval: jQuery加载完毕，开始执行Widget:Bgimage');
        mw.hook( 'wikipage.content' ).add(main);
        mw.widget.bgimage = true;
    }, 500);
}) ();
