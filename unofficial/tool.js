/**
 * @Description: 自用的工具函数
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/**
 * @Function: 批量添加文件授权协议，只能处理不超过500个文件的分类
 * @Dependencies: mediawiki.api, ext.gadget.site-lib
 * @Param {String} cmtitle 分类名，默认为当前所在分类页
 */
mw.myCopyright = (cmtitle = mw.config.get( 'wgTitle' )) => {
    const cats = ['原作者保留权利的文件', '可自由使用的文件', 'LLWiki版权所有的文件', '使用CC Zero协议的文件'],
        api = new mw.Api();
    mw.timedQuery(api, { prop: 'categories', generator: 'categorymembers', gcmtitle: `Category:${cmtitle}`,
        gcmtype: 'file', gcmlimit: 'max', clcategories: cats.map(ele => `Category:${ele}`).join( '|' ), cllimit: 'max'
    }, '分类下无授权协议的文件').then(res => {
        res.query.pages.filter(ele => !ele.categories).forEach(ele => {
            api.postWithToken('csrf', {action: 'edit', pageid: ele.pageid, minor: 1, bot: 1,
                prependtext: '==授权协议==\n{{copyright}}\n', summary: '使用API批量添加授权协议',
            }).catch(reason => { console.error( `页面${ele.pageid}无法添加授权协议，错误原因：${reason}` ); });
        });
    }, () => {});
};
/**
 * @Function: 查询JS页面大小
 * @Dependencies: mediawiki.api, ext.gadget.site-lib
 */
mw.myJsSize = () => {
    const $table = $('.jsTable'), // 总是获取当前页面中的表格
        $items = $table.find( 'tr:nth-child(n+1)' ),
        titles = $items.find( 'a' ).toArray().map(ele => ele.title);
    mw.timedQuery(new mw.Api(), {prop: 'info', titles: titles.join( '|' )}, 'JS页面大小').then(data => {
        $table.toggleClass( 'jsTable jsTable2' );
        // 注意返回的结果可能顺序不同
        const lengths = Object.fromEntries( data.query.pages.map(ele => [ele.title, ele.length]) );
        $items.children( 'td:last-child' ).text(i => (lengths[ titles[i] ] / 1024).toFixed(1));
    }, () => { $('#myJsSize').off( 'click' ).one('click', mw.myJsSize); });
};
mw.hook( 'wikipage.content' ).add($content => {
    const $btn = $content.find( '#myJsSize' ).one('click', mw.myJsSize);
    if ($btn.length === 0) { return; }
    console.log('Hook: wikipage.content, 开始添加JS大小查询按钮');
});
(() => {
    /**
     * @Function: 记录所有触发的Hook
     */
    const start = mw.now();
    ['postEdit', 'wikipage.content', 'wikipage.collapsibleContent', 'wikipage.categories', 'wikipage.diff',
        'wikipage.editform', 'structuredChangeFilters.ui.initialized', 'codeEditor.configure', // MW原生Hook
        'code.prettify', 'wikiplus.dialog', 'transclusion.preview', 'local.comments', 'hotcat.ready',
        'settings.dialog', 'to.bottom', 'mobile.menu' // 小工具Hook
    ].forEach(ele => {
        mw.hook( ele ).add(x => {
            console.log(`Hook: ${ele} after ${mw.now() - start} ms`);
            if (x) { console.info(x); }
        });
    });
}) ();
