/**
 * @Function: 用于 https://llwiki.org/zh/LoveLive!学园偶像祭歌曲列表 的表格折叠
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
'use strict';
(() => {
	let isMobile;
	const formatData = ({textContent: text}) => text.toLowerCase().replace(/[^a-z0-9]/g, ''),
		main = $content => {
			const $dropdown = $content.find('.sif-song-table .tabs-content')
				.attr({lang: 'ja', style: 'height: auto !important; left: -1000000px;'});
			if ($dropdown.length === 0) {
				return;
			}
			console.log('Hook: wikipage.content, 开始折叠SIF歌曲列表的下拉选单');
			// 手机版的下拉菜单解析有误
			if (isMobile) {
				$dropdown.append(function() {
					return $(this).next();
				});
			}
			$dropdown.parent().one('mouseenter', function() {
				const $this = $(this),
					$menu = $this.children('.tabs-content');
				$this.css('width', $this.children('.tabs-content').width());
				$menu.css('height', $menu.height());
			});
			$dropdown.find('li').not(function() {
				return $(this).closest('.sif-song-table').find(`[data-${formatData(this)}]`).length;
			}).remove();
		},
		handler = () => {
			mw.widget = mw.widget || {};
			if (mw.widget.sifSongTable) {
				return;
			}
			isMobile = mw.config.get('skin') === 'minerva';
			mw.hook('wikipage.content').add(main);
			$('#bodyContent').on('click', '.sif-song-table .tabs-content', function({target: option}) {
				const lvl = formatData(option);
				$(this).css('left', '-1000000px').prev().text(option.textContent).closest('.sif-song-table')
					.find('.sif-song-option').html(function() {
						const data = this.dataset[lvl] || '';
						return [data.replace(/\D/g, '') || '/', data.endsWith('swing') ? $('<i>', {class: 'swing'}) : null];
					});
			}).on('mouseenter', '.sif-song-table .tabs-label', function() {
				$(this).next().css('left', '');
			});
			mw.widget.sifSongTable = true;
		};
	if (window.jQuery) {
		handler();
	} else {
		window.addEventListener('jquery', handler);
	}
})();
