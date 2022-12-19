/**
 * @Function: 目录初始折叠
 * @Reference: https://zh.moegirl.org.cn/widget:tochide
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
'use strict';
(() => {
	const main = () => {
		$('#toctogglecheckbox').prop('checked', mw.config.get('skin') === 'vector');
		$('#toc').addClass('tochide');
	};
	if (window.jQuery) {
		main();
	} else {
		window.addEventListener('jquery', main);
	}
})();
