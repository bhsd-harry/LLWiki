/**
 * @Description: 这里是桌面版和手机版通用的全局JS
 * @Functions: 1. 除[[Special:前缀索引]]外移除页面名称最后的"/"
 *             2. [[MediaWiki:Edittools]]可定制的快速插入工具
 *             3. 防止错误创建其他用户的用户页
 *             4. 正确显示[[特殊:前缀索引/LLWiki:首页/当年今日/]]
 *             5. [[特殊:链入页面]]检索正确的繁简转换页面
 *             6. 分类栏正确显示小写标题
 * @Dependencies: mediawiki.api, mediawiki.Uri, mediawiki.Title, ext.gadget.site-lib
 * @Author: 如无特殊说明，均为https://llwiki.org/zh/User:Bhsd
 */
"use strict";
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
    // 这个事件不能重复添加，但#editform可能会重建
    $('#bodyContent').on('click', 'span.mw-charinsert-item', function() {
        const $this = $(this);
        $('#wpTextbox1').textSelection( 'encapsulateSelection', {
            pre: $this.data( 'mw-charinsert-start' ) || $this.data( 'start' ), // undefined也没关系
            post: $this.data( 'mw-charinsert-end' ) || $this.data( 'end' )
        } );
    });
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
        mw.loader.load( '//cdn.jsdelivr.net/gh/bhsd-harry/LLWiki@1.4/widget/mainpage.min.css', 'text/css' );
        downloaded = true;
    });
}
/**
 * @Function: 链入页面自动繁简转换
 * @Dependencies: mediawiki.api, mediawiki.Uri, ext.gadget.site-lib
 */
const $newpage = $('#contentSub > .new, .minerva__subtitle > .new');
// 不存在的页面且不存在链入
if (specialPage == 'Whatlinkshere' && $newpage.length && $('#mw-whatlinkshere-list').length === 0) {
    const target = $newpage.text();
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
const lcCats = ["Μ's", 'Lily white', 'JQuery'];
mw.hook( 'wikipage.categories' ).add(function($content) {
    console.log('Hook: wikipage.categories, 开始替换小写分类');
    lcCats.forEach(function(ele) {
        $content.find( 'a:contains(' + ele + ')' ).text(function(i, text) {
            return text.replace( new RegExp('^' + ele), ele[0].toLowerCase() + ele.slice(1) );
        });
    });
});
