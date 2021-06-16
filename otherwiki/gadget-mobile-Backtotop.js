/**
 * @Function: 在桌面版和手机版的屏幕右方添加按钮，点击后滚动至页面顶部或底部，且页面的滚动位置会影响按钮显隐
 * @Inspiration: CSS设计基于https://www.mediawiki.org/wiki/Extension:MobileFrontend/zh Beta，JS基于https://zh.moegirl.org.cn/Mediawiki:gadget-Backtotop.js
 * @Dependency: ext.gadget.SettingsDialog
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global $ */
// 一个页面只需要执行一次
$(() => {
    const $body = $(document.scrollingElement),
        $win = $(window),
        $doc = $(document),
        debounce = (delay, callback) => {
        let timeout;
        return function() {
            clearTimeout( timeout );
            timeout = setTimeout( Function.prototype.apply.bind(callback, this, arguments), delay );
        };
    },
        // 1. 回到顶部
        $toTop = $('<div>', {class: "backtotop view-border-box", html: $('<div>', {class: "arrow-up"})})
        .click(() => { $body.animate({scrollTop: 0}); }).appendTo( document.body ),
        // 使用debounce降低函数调用频率
        scrollToTop = debounce(400, () => { $toTop.toggleClass('visible', $doc.scrollTop() > 260); }),
        // 2. 前往底部
        $toBottom = $('<div>', {class: "backtotop backtobottom view-border-box",
        html: $('<div>', {class: "arrow-up"})}).click(() => {
        // $doc.height() - $win.height()相当于FireFox独有的window.scrollMaxY
        $body.animate({scrollTop: $doc.height() - $win.height()});
    }).appendTo( document.body ),
        scrollToBottom = debounce(400, () => {
        $toBottom.toggleClass('visible', $doc.scrollTop() < $doc.height() - $win.height() - 260);
    });
    // 人为触发一次scroll事件以初始化
    $win.scroll( scrollToTop ).scroll();
    $win.scroll( scrollToBottom ).scroll();
});
