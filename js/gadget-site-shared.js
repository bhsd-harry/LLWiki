/**
 * @Description: 这里是桌面版和手机版通用的全局JS
 * @Functions: 1. 除Special:前缀索引外移除页面名称最后的"/"
 *             2. MediaWiki:Edittools可定制的快速插入工具
 *             3. 嵌入外部站点时通知并建议跳转
 *             4. 防止错误创建其他用户的用户页
 *             5. 正确显示特殊:前缀索引/LLWiki:首页/当年今日/
 *             6. 特殊:链入页面检索正确的繁简转换页面
 *             7. 分类栏正确显示小写标题
 * @Dependencies: mediawiki.api, mediawiki.Uri, mediawiki.Title, oojs-ui-windows, ext.gadget.site-lib
 * @Author: 如无特殊说明，均为https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global OO, wgULS */
const pagename = mw.config.get( 'wgPageName' ),
    action = mw.config.get( 'wgAction' ),
    specialPage = mw.config.get( 'wgCanonicalSpecialPageName' );
/**
 * @Function: 除Special:前缀索引外去掉地址栏最后的"/"
 * @Dependencies: mediawiki.Uri
 * @Author: https://en.wikipedia.org/wiki/User:Majavah
 * @EditedBy: https://llwiki.org/zh/User:Bhsd
 */
if (pagename.endsWith( '/' ) && specialPage != 'Prefixindex') {
    const uri = new mw.Uri();
    uri.query.title = pagename.slice(0, -1);
    uri.path = '/zh'; // 原本title可能不在query参数里，而是在path里
    location.replace( uri.toString() );
}
/**
 * @Function: 更复杂的快速插入
 * @Source: https://www.mediawiki.org/wiki/Extension:CharInsert
 * @Dependencies: jquery.textSelection（已由CharInsert扩展加载）
 */
if (['edit', 'submit'].includes( action ) && mw.config.get( 'wgIsProbablyEditable' )) {
    $('#editform').on('click', 'span.mw-charinsert-item', function() {
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
 * @EditedBy: https://llwiki.org/zh/User:Bhsd
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
 * @Function: 正确显示特殊:前缀索引/LLWiki:首页/当年今日/
 */
if (pagename.startsWith( 'LLWiki:首页/当年今日/' ) && action == 'view') {
    // 非管理员不需要关心未创建的页面
    var downloaded = mw.config.get( 'wgArticleId' ) === 0 && !mw.config.get( 'wgUserGroups' ).includes( 'sysop' );
    mw.hook( 'wikipage.content' ).add(function($content) {
        const $output = $content.children( '.mw-parser-output' ).addClass( 'mainpage-flex' );
        // 避免不必要的下载。注意:contains选择器里不能有多余的空格。
        if ($output.find( 'style:contains(mainpage)' ).length || downloaded) { return; }
        console.log('Hook: wikipage.content, 开始下载主页样式表');
        mw.loader.load( '//cdn.jsdelivr.net/gh/bhsd-harry/LLWiki@1.2/widget/mainpage.min.css', 'text/css' );
        downloaded = true;
    });
}
/**
 * @Function: 链入页面自动繁简转换
 * @Dependencies: mediawiki.api, mediawiki.Uri
 */
if (specialPage == 'Whatlinkshere' && $('#contentSub > .new, .minerva__subtitle > .new').length &&
    $('#mw-whatlinkshere-list').length === 0) { // 不存在的页面且不存在链入
    const target = $('#mw-whatlinkshere-target').val();
    if (/[\u4E00-\u9FCC\u3400-\u4DB5]/.test( target )) { // 不含中文字符不需要繁简转换
        mw.timedQuery(new mw.Api(), {titles: target, converttitles: 1}, '繁简页面标题').then(function(data) {
            const converted = data.query.pages[0];
            if (converted.missing) { return; }
            const uri = new mw.Uri();
            uri.query.target = converted.title;
            uri.query.title = 'Special:链入页面';
            uri.path = '/zh';
            location.replace( uri.toString() );
        }, function() {});
    }
}
/**
 * @Function: 分类栏显示小写标题
 */
mw.hook( 'wikipage.categories' ).add(function($content) {
    console.log('Hook: wikipage.categories, 开始替换小写分类');
    $content.find( "a:contains(Μ's)" ).text(function(i, text) { return text.replace(/^Μ's/, "μ's"); });
    $content.find( 'a:contains(Lily white)' ).text(function(i, text) {
        return text.replace(/^Lily white/, 'lily white');
    });
});
