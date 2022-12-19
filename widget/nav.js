/**
 * @Function: 移除插入图片造成的指向自身的导航链接
 * @Dependencies: mediawiki.util
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
'use strict';
(() => {
	let href, isMobile;
	const main = $content => {
			const $nav = $content.find(`.start-screen${isMobile ? '' : ':has(img)'}`);
			if ($nav.length === 0) {
				return;
			}
			console.log('Hook: wikipage.content, 开始处理导航链接');
			// 1. 移除图片造成的指向自身的链接，注意手机版的懒加载
			$nav.find(`a[href="${href}"]`).removeAttr('href title').addClass('mw-selflink selflink');
			// 2. 手机版强制加载图片，并将导航移出折叠段落
			if (!isMobile) {
				return;
			}
			$nav.find('.lazy-image-placeholder').replaceWith(function() {
				return $(this).prev('noscript').text();
			});
			$nav.appendTo($content.find('.mw-parser-output'))
				.animate({scrollLeft: ($nav[0].scrollWidth - $nav.outerWidth()) / 2}, 'slow'); // 窄屏上初始滚动一半
		},
		handler = async () => {
			mw.widget = mw.widget || {};
			if (mw.widget.nav) {
				return;
			}
			isMobile = mw.config.get('skin') === 'minerva';
			mw.widget.nav = true;
			await mw.loader.using('mediawiki.util');
			href = mw.util.getUrl();
			mw.hook('wikipage.content').add(main);
		};
	if (window.jQuery) {
		handler();
	} else {
		window.addEventListener('jquery', handler);
	}
})();
