/**
 * @Description: 这里是桌面版和手机版通用的全局JS
 * @Author: 如无特殊说明，均为https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global OO, wgULS */
/**
 * @Function: 除Special:前缀索引外去掉地址栏最后的"/"
 * @Dependencies: mediawiki.Uri
 * @Author: https://en.wikipedia.org/wiki/User:Majavah
 * @EditedBy: User:Bhsd
 */
const pagename = mw.config.get('wgPageName');
if (pagename.endsWith( '/' ) && mw.config.get( 'wgCanonicalSpecialPageName' ) != 'Prefixindex') {
    const uri = new mw.Uri();
    uri.query.title = pagename.slice(0, -1);
    location.replace('/zh?' + uri.getQueryString()); // 原本title可能不在query参数里
}
/**
 * @Function: 更复杂的快速插入
 * @Source: https://www.mediawiki.org/wiki/Extension:CharInsert
 * @Dependencies: jquery.textSelection（已由CharInsert扩展加载）
 */
if (['edit', 'submit'].includes( mw.config.get('wgAction') ) && mw.config.get( 'wgIsProbablyEditable' )) {
    $('body').on('click', 'span.mw-charinsert-item', function() {
        const $this = $(this);
        $('#wpTextbox1').textSelection( 'encapsulateSelection', {
            pre: $this.data( 'mw-charinsert-start' ) || $this.data( 'start' ), // undefined也没关系
            post: $this.data( 'mw-charinsert-end' ) || $this.data( 'end' )
        } );
    });
}
/**
 * @Function: 嵌入外部站点时进行提示
 * @Dependencies: oojs-ui-windows, ext.gadget.site-lib
 * @Source: https://zh.moegirl.org.cn/mediawiki:common.js
 * @EditedBy: User:Bhsd
 */
if (top !== window || location.host != 'llwiki.org') { // 不一定是嵌入
    mw.messages.set( $.extend( wgULS({
        'gadget-ss-title': '<p>LLWiki提醒您</p><p>您正在非LLWiki域名访问</p>',
        'gadget-ss-label': '<p>请注意不要在此域名下输入您的用户名或密码，以策安全！</p>' +
            '<p>LLWiki的域名为 <a href="#" onclick="return false;">llwiki.org</a></p>'
    }, {
        'gadget-ss-title': '<p>LLWiki提醒您</p><p>您正在非LLWiki域名訪問</p>',
        'gadget-ss-label': '<p>請注意不要在此域名下輸入您的用戶名或密碼，以策安全！</p>' +
            '<p>LLWiki的域名為 <a href="#" onclick="return false;">llwiki.org</a></p>'
    }), {'gadget-ss-jump': '前往LLWiki', 'gadget-ss-continue': '我知道了'}) ); // 不需要繁简转换的文字
    const dialog = new OO.ui.MessageDialog();
    mw.dialog(dialog, [ {label: mw.msg('gadget-ss-continue'), flags: ['primary', 'destructive']},
        {label: mw.msg('gadget-ss-jump'), flags: ['primary', 'progressive'], target: '_blank', // 必须打开新标签页
        href: top === window ? 'https://llwiki.org' : location.href}
    ], mw.msg('gadget-ss-label'), mw.msg('gadget-ss-title'));
}
/**
 * @Function: 点击其他用户主页面的红链不会进入创建页面
 * @Dependencies: mediawiki.Title
 */
mw.hook( 'wikipage.content' ).add(function($content) { // 必须立即解决，否则手机版会生成drawer
    console.log('Hook: wikipage.content, 开始处理其他用户主页面的红链');
    $content.find( '.new' ).attr('href', function(i, val) {
        const query = mw.util.getParamValue('title', val);
        if (!query) { return; } // 特殊页面
        const title = new mw.Title( query ),
            name = title.getMainText(); // 借助mediawiki.Title规范用户名格式
        // 不处理非用户空间或用户子页面
        if (title.namespace != 2 || name.includes( '/' ) || name == mw.config.get('wgUserName')) { return; }
        return title.getUrl();
    });
});
/**
 * @Function: 分类栏显示小写标题
 */
mw.hook( 'wikipage.categories' ).add(function($content) {
    console.log('Hook: wikipage.categories, 开始替换小写分类');
    $content.find( 'a:contains("Μ\'s")' ).text(function(i, text) { return text.replace("Μ's", "μ's"); });
    $content.find( 'a:contains("Lily white")' ).text(function(i, text) { return text.replace('Lily', 'lily'); });
});
