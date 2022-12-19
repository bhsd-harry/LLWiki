/**
 * @Description: 这里是桌面版和手机版通用的全局JS
 * @Functions: 1. 除[[Special:前缀索引]]外移除页面名称最后的"/"
 *             2. [[MediaWiki:Edittools]]可定制的快速插入工具
 *             3. 取消编辑按钮添加边框
 *             4. 防止错误创建其他用户的用户页
 *             5. 正确显示[[特殊:前缀索引/LLWiki:首页/当年今日/]]
 *             6. [[特殊:链入页面]]检索正确的繁简转换页面
 *             7. 分类栏正确显示小写标题
 *             8. 分类栏正确显示词曲作者的日文名
 *             9. 触摸屏将packed-hover模式的gallery替换为packed
 *             10. 禁止使用InPageEdit快速编辑和快速重定向
 * @Dependencies: mediawiki.api, mediawiki.Uri, mediawiki.Title, ext.gadget.site-lib
 * @Author: 如无特殊说明，均为https://llwiki.org/zh/User:Bhsd
 */
'use strict';
/* global mw, $, wgULS */
/* eslint prefer-arrow-callback: 0, no-var: 0, prefer-destructuring: 0, prefer-template: 0 */
const pagename = mw.config.get('wgPageName'),
	action = mw.config.get('wgAction'),
	specialPage = mw.config.get('wgCanonicalSpecialPageName'),
	hook = mw.hook('wikipage.content');
/**
 * @Function: 除Special:前缀索引外去掉地址栏最后的"/"
 * @Dependencies: mediawiki.Uri
 * @Author: https://en.wikipedia.org/wiki/User:Majavah
 * @EditedBy: https://llwiki.org/zh/User:Bhsd
 */
if (pagename.endsWith('/') && specialPage != 'Prefixindex') {
	const uri = new mw.Uri();
	uri.query.title = pagename.slice(0, -1);
	uri.path = '/zh'; // 原本title可能不在query参数里，而是在path里
	location.replace(uri.toString());
}
if (['edit', 'submit'].includes(action) && mw.config.get('wgIsProbablyEditable')) {
	/**
	 * @Function: 更复杂的快速插入
	 * @Source: https://www.mediawiki.org/wiki/Extension:CharInsert
	 * @Dependencies: jquery.textSelection（已由CharInsert扩展加载）
	 */
	// 这个事件不能重复添加，但#editform可能会重建
	$('#bodyContent').on('click', 'span.mw-charinsert-item', function() {
		$('#wpTextbox1').textSelection('encapsulateSelection', {pre: this.dataset.start, post: this.dataset.end});
	});
	/**
	 * @Function: 取消编辑按钮添加边框
	 */
	$('#mw-editform-cancel').toggleClass('oo-ui-buttonElement-frameless oo-ui-buttonElement-framed');
}
/**
 * @Function: 点击其他用户主页面的红链不会进入创建页面
 * @Dependencies: mediawiki.Title
 */
hook.add(function($content) { // 必须立即解决，否则手机版会生成drawer
	console.log('Hook: wikipage.content, 开始处理其他用户主页面的红链');
	$content.find('.new').attr('href', function(_, val) {
		const query = mw.util.getParamValue('title', val);
		if (!query) {
			return;
		} // 特殊页面
		const title = new mw.Title(query),
			name = title.getMainText(); // 借助mediawiki.Title规范用户名格式
		// 不处理非用户空间或用户子页面
		if (title.namespace != 2 || name.includes('/') || name == mw.config.get('wgUserName')) {
			return;
		}
		return title.getUrl();
	});
});
/**
 * @Function: 正确显示特殊:前缀索引/LLWiki:首页/当年今日/
 */
// 非管理员不需要关心未创建的页面
if (pagename.startsWith('LLWiki:首页/当年今日/') && action == 'view'
    && (mw.config.get('wgArticleId') > 0 || mw.config.get('wgUserGroups').includes('sysop'))) {
	const download = function() {
		if ($('#mainpage-style').length) {
			return;
		} // 避免不必要的下载
		console.log('Hook: wikipage.content, 开始下载主页样式表');
		mw.loader.load('//cdn.jsdelivr.net/gh/bhsd-harry/LLWiki@1.4/widget/mainpage.min.css', 'text/css');
		hook.remove(download);
	};
	hook.add(download)
		.add(function($content) {
			$content.children('.mw-parser-output').addClass('mainpage-flex');
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
	if (/[\u4E00-\u9FCC\u3400-\u4DB5]/.test(target)) { // 不含中文字符不需要繁简转换
		mw.timedQuery(new mw.Api(), {titles: target, converttitles: 1}, '繁简页面标题').then(function(data) {
			const converted = data.query.pages[0];
			if (converted.missing) {
				return;
			}
			const uri = new mw.Uri();
			uri.query.target = converted.title;
			uri.query.title = 'Special:链入页面';
			uri.path = '/zh';
			location.replace(uri.toString());
		}, function() {});
	}
}
const lcCats = ["Μ's", 'Lily white', 'JQuery'],
	author = /^(作词|作曲|编曲|弦编曲|管弦编曲)：/;
mw.hook('wikipage.categories').add(function($content) {
	/**
	 * @Function: 分类栏显示小写标题
	 */
	console.log('Hook: wikipage.categories, 开始替换小写分类');
	lcCats.forEach(function(ele) {
		const corrected = ele[0].toLowerCase() + ele.slice(1);
		$content.find('a:contains(' + ele + ')').text(function(_, text) {
			return text.replace(RegExp('^' + ele), corrected);
		});
	});
}).add(function($content) {
	/**
	 * @Function: 分类栏显示词曲作者的日文名
	 */
	console.log('Hook: wikipage.categories, 开始替换词曲作者分类');
	$content.children('#mw-normal-catlinks').find('a')
		.filter(function() {
			return author.test(this.textContent);
		}).html(function(_, val) {
			const i = val.indexOf('：');
			return [val.slice(0, i + 1), $('<span>', {lang: 'ja', text: this.title.slice(i + 10)})];
		});
});
/**
 * @Function: 触摸屏代替gallery的hover效果
 */
if (matchMedia('screen and (hover: none)').matches) {
	hook.add(function($content) {
		console.log('Hook: wikipage.content, 开始移除gallery的hover效果');
		$content.find('.mw-gallery-packed-hover ').toggleClass('mw-gallery-packed-hover mw-gallery-packed');
	});
}
/**
 * @Function: 禁止使用InPageEdit快速编辑和快速重定向
 * @Dependecies: ext.gadget.site-lib
 */
mw.messages.set(wgULS({
	'gadget-ipe-warn': '由于InPageEdit小工具$1，LLWiki暂时限制该小工具的使用。', 'gadget-ipe-edit': '易造成编辑冲突',
	'gadget-ipe-redirect': '无法正确判别页面是否已存在',
}, {
	'gadget-ipe-warn': '由於InPageEdit小工具$1，LLWiki暫時限制該小工具的使用。', 'gadget-ipe-edit': '易造成編輯衝突',
	'gadget-ipe-redirect': '無法正確判別頁面是否已存在',
}));
const noIPE = function(msg) {
	mw.notify(mw.msg('gadget-ipe-warn', mw.msg('gadget-ipe-' + (msg || 'redirect'))),
		{type: 'warn', autoHide: false, tag: 'InPageEdit'});
};
mw.hook('InPageEdit.quickEdit').add(function(data) {
	data.$modalWindow.find('.save-btn').prop('disabled', true);
	noIPE('edit');
});
mw.hook('InPageEdit.quickRedirect').add(noIPE);
mw.hook('InPageEdit.quickRename').add(noIPE);
