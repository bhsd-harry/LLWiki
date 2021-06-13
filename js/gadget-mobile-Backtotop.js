/**
 * @Function: 在桌面版和手机版的屏幕右方添加按钮，点击后滚动至页面顶部或底部，且页面的滚动位置会影响按钮显隐
 * @Inspiration: CSS设计基于https://www.mediawiki.org/wiki/Extension:MobileFrontend/zh Beta，JS基于https://zh.moegirl.org.cn/Mediawiki:gadget-Backtotop.js
 * @Dependency: ext.gadget.SettingsDialog
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global wgULS */
mw.gadgets = mw.gadgets || {};
mw.gadgets.mobileBacktotop = $.extend( mw.storage.getObject( 'gadget-mobileBacktotop' ), mw.gadgets.mobileBacktotop );
const settings = mw.gadgets.mobileBacktotop,
    skin = mw.config.get( 'skin' );
settings.mode = settings.mode || ['vector', 'minerva'];
settings.func = settings.func || ['top', 'bottom'];
// 1. 设置本地化消息
mw.messages.set( $.extend( wgULS({
    'gadget-mb-label': '前往页面顶部或底部', 'gadget-cb-range': '使用范围', 'gadget-cb-d': '桌面版', 'gadget-cb-m': '手机版',
    'gadget-mb-f': '启用功能', 'gadget-mb-top': '回到顶部'
}, {
    'gadget-mb-label': '前往頁面頂部或底部', 'gadget-cb-range': '使用範圍', 'gadget-cb-d': '桌面版', 'gadget-cb-m': '手機版',
    'gadget-mb-f': '啟用功能', 'gadget-mb-top': '回到頂部'
}), {'gadget-mb-bottom': '前往底部'}) );
// 一个页面只需要执行一次
$(function() {
    if (!settings.mode.includes( skin )) { return; }
    
    // 2. 小工具设置
    mw.settingsDialog.addTab({name: 'mobileBacktotop', label: 'gadget-mb-label', items: [
        {key: 'mode', type: 'CheckboxMultiselect', label: 'gadget-cb-range', config: {value: settings.mode, options: [
            {data: 'vector', label: mw.msg( 'gadget-cb-d' )}, {data: 'minerva', label: mw.msg( 'gadget-cb-m' )}
        ]} }, {key: 'func', type: 'CheckboxMultiselect', label: 'gadget-mb-f', config: {value: settings.func, options: [
            {data: 'top', label: mw.msg( 'gadget-mb-top' )}, {data: 'bottom', label: mw.msg( 'gadget-mb-bottom' )}
        ]} }
    ], help: '回到顶部'});
    const $body = $(document.scrollingElement),
        $win = $(window),
        $doc = $(document);
    // 3. 回到顶部
    if (settings.func.includes( 'top' )) {
        const $toTop = $('<div>', {class: "backtotop view-border-box", html: $('<div>', {class: "arrow-up"})})
            .click(function() { $body.animate({scrollTop: 0}); }).appendTo( document.body ),
            // 使用mw.util.debounce()方法降低函数调用频率
            scrollToTop = mw.util.debounce(400, function() { $toTop.toggleClass('visible', $doc.scrollTop() > 260); });
        // 人为触发一次scroll事件以初始化
        $win.scroll( scrollToTop ).scroll();
    }
    // 4. 前往底部
    if (settings.func.includes( 'bottom' )) {
        const $toBottom = $('<div>', {class: "backtotop backtobottom view-border-box",
            html: $('<div>', {class: "arrow-up"})}).click(function() {
            // $doc.height() - $win.height()相当于FireFox独有的window.scrollMaxY
            $body.animate({scrollTop: $doc.height() - $win.height()});
        }).appendTo( document.body ),
            scrollToBottom = mw.util.debounce(400, function() {
            $toBottom.toggleClass('visible', $doc.scrollTop() < $doc.height() - $win.height() - 260);
        });
        $win.scroll( scrollToBottom ).scroll();
        // 唤起一个Hook事件供TalkHelper小工具修改按钮的功能
        mw.hook( 'to.bottom' ).fire( $toBottom );
    }
});
