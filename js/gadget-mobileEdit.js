/**
 * @Function: 手机版打开普通编辑界面
 * @Dependencies: mediawiki.util, ext.gadget.site-lib
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
'use strict';
/* global mw, $ */
/* eslint prefer-arrow-callback: 0, object-shorthand: 0 */
const id = mw.config.get('wgRevisionId'),
	cid = mw.config.get('wgCurRevisionId'),
	isText = mw.config.get('wgPageContentModel') == 'wikitext';
// 必须在drawer生成之前执行；这里涵盖了创建新页面、从移动版差异编辑和模板中常见的编辑链接
mw.hook('wikipage.content').add(function($content) {
	console.log('Hook: wikipage.content, 开始更换编辑链接');
	$content.find('a.new, .mw-mf-diff-info__link-latest > a, .plainlinks > a.external')
		.attr('href', function(_, attr) {
			return attr.replaceAll('&action=edit', '&action=submit');
		});
});
$(function() { // Ajax小工具一般不会生成新的.edit-page，所以只需执行一次
	if (!mw.config.get('wgIsArticle')) {
		return;
	}
	// 不能用startsWith，因为data-section可能未定义
	$('a.edit-page').filter(function() {
		return /^T-/.test(this.dataset.section);
	}).remove();
	const notTop = mw.isModule('notEditTopSection', true);
	// 这里希望在MobileFrontEnd的JS加载之前执行，但如果晚了也没问题
	$('a.edit-page').off('click').click(function(e) {
		e.stopImmediatePropagation();
		const section = this.dataset.section || (isText && !notTop ? 0 : undefined);
		location.href = mw.util.getUrl(null, $.extend({action: 'submit'}, // 移除无效的query parameter
			{oldid: id == cid ? undefined : id, section: section}));
	}).removeAttr('href');
});
