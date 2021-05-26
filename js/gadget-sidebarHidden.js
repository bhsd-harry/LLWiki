/**
 * @Function: Vector皮肤折叠侧边栏
 * @Dependencies: ext.gadget.site-lib, mediawiki.storage
 * @Source: https://zh.moegirl.org.cn/mediawiki:gadget-sidebarHidden.js
 * @OriginalVersion: https://zh.wikipedia.org/wiki/mediawiki:gadget-CollapsibleSidebar.js
 * @EditedBy: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global wgULS */
var state = (mw.gadgets || {}).sidebarHidden;
if (state === undefined) { state = mw.storage.getObject( 'gadget-sidebarHidden' ); }
const $panel = $('#mw-panel'),
    $logo = $('.mw-wiki-logo').clone().hide().appendTo( '#left-navigation' ),
    $body = $(document.body),
    fade = function() {
    (state ? $panel : $logo).fadeOut( 200 );
    (state ? $logo : $panel).delay( 100 ).fadeIn( 200 );
    $body.toggleClass( 'sidebarHidden' );
    $arrow.toggleClass( 'fa-angle-left fa-angle-right' );
},
    $arrow = $('<div>', {id: 'sidebarHidden-arrow', class: 'fa fa-angle-left', title: wgULS('折叠侧边栏', '折疊側邊欄')})
    .click(function() {
    state = !state;
    fade();
    mw.storage.set( 'gadget-sidebarHidden', state );
}).appendTo( $body );
if (state) { fade(); }
