/**
 * @Function: 设置桌面版的页面背景图片
 * @Source: https://zh.moegirl.org.cn/Widget:SideBarPic
 * @EditedBy: https://llwiki.org/zh/User:Bhsd
 */
'use strict';
(() => {
	const main = $content => {
			const $ele = $content.find('.bgimage'),
				$img = $ele.children('img').css('object-position', $ele.data('position'));
			if ($ele.length === 0) {
				return;
			}
			console.log('Hook: wikipage.content, 开始添加背景图片');
			// Wikiplus能预览到真实效果，且关闭Wikiplus时不会留下
			$ele.closest('body, #Wikiplus-Quickedit-Preview-Output').append($ele)
				.find('#p-logo').css('visibility', $ele.data('logo') === 'off' ? 'hidden' : ''); // Wikiplus预览不隐藏logo
			$img.on('load', () => {
				$ele.fadeIn('slow');
			});
			if ($img.prop('complete')) {
				$img.triggerHandler('load');
			}
		},
		handler = () => {
			mw.widget = mw.widget || {};
			if (mw.widget.bgimage || mw.config.get('skin') === 'minerva') {
				return;
			}
			mw.hook('wikipage.content').add(main);
			mw.widget.bgimage = true;
		};
	if (window.jQuery) {
		handler();
	} else {
		window.addEventListener('jquery', handler);
	}
})();
