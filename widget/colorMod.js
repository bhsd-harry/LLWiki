/**
 * @Function: 用户可以自行调低某几位角色的应援色亮度。
 * @Dependencies: mediawiki.storage, oojs-ui-windows, ext.gadget.site-lib
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
'use strict';
/* global wgULS*/
(() => {
	const main = () => {
			// 1. 在开头统一处理繁简文字信息
			mw.messages.set($.extend(wgULS({
				'widget-cm-intro': '本页面使用了亮度较高的应援色，您可以在这里调节对应颜色的亮度：', 'widget-cm-rin': '星空凛',
				'widget-cm-dialog': '调节应援色亮度',
				'widget-cm-popup': '本页面使用了亮度较高的角色应援色。为了便于阅读，您可以点击调色板按钮自行调节对应颜色的亮度。',
			}, {
				'widget-cm-intro': '此頁面使用了亮度較高的應援色，您可以在這裡調節對應顏色的亮度：', 'widget-cm-rin': '星空凜',
				'widget-cm-dialog': '調節應援色亮度',
				'widget-cm-popup': '本頁面使用了亮度較高的角色應援色。為了便於閱讀，您可以點擊調色板按鈕自行調節對應顏色的亮度。',
			}), {'widget-cm-keke': '唐可可', 'widget-cm-label': '：亮度降低', 'widget-cm-stop': '不再提示'}));
			let mkeys, mvals, dialog, popup; // 只在必要时生成一次dialog
			// 必须保留rgb中的空格
			const colors = { rin: ['rgb(254, 225, 85)', 'rgb(253, 220, 59)', 'rgb(253, 216, 34)', 'rgb(253, 211, 8)',
					'rgb(235, 195, 1)', 'rgb(210, 174, 1)'],
				keke: ['rgb(160, 255, 249)', 'rgb(134, 255, 247)', 'rgb(109, 255, 245)', 'rgb(83, 254, 244)',
					'rgb(58, 255, 242)', 'rgb(32, 255, 240)', 'rgb(6, 255, 239)', 'rgb(0, 236, 221)'],
				},
				// 调色板对话框的文字提示
				$intro = $('<p>', {text: mw.msg('widget-cm-intro')}),
				// 2. 准备核心元素、函数和事件
				$wrapper = $('<div>', {id: 'colorMod-wrapper'}),
				wrapperPool = {},
				// 这个函数用于生成调色板对话框的select，避免重复劳动。
				generateWrapper = (key, i) => {
					const color = colors[key],
						val = mvals[i];
					wrapperPool[key] = wrapperPool[key] || $('<div>', {html: [
						mw.msg(`widget-cm-${key}`), mw.msg('widget-cm-label'),
						// value不能作为attr
						$('<select>', {html: color.map((_, j) => new Option(`${j * 5}%`, j))}).val(val)
							.change(function() {
								$(this).next().css('color', color[this.value]);
							}),
						$('<span>', {text: '文字'}).css('color', color[val]),
					]});
					return wrapperPool[key];
				},
				style = mw.loader.addStyleTag(''), // 这里不用mw.util.addCSS是为了避免在代码块里定义const
				// 这个函数用于生成CSS
				generateStyle = () => {
					style.textContent = `#mw-content-text .mw-parser-output {${
						mkeys.map((key, i) => `--${key}-color: ${colors[key][mvals[i]]}`).join(';')};}`;
				},
				isMobile = mw.config.get('skin') === 'minerva',
				actions = [{action: 'reject', label: mw.msg('ooui-dialog-message-reject')},
					{action: 'accept', label: mw.msg('ooui-dialog-message-accept'), flags: 'progressive'},
				],
				openDialog = () => {
					dialog = dialog || new OO.ui.MessageDialog();
					mw.dialog(dialog, actions, [$intro, $wrapper], mw.msg('widget-cm-dialog')).then(action => {
						const $select = $wrapper.find('select');
						if (action === 'reject') {
							$select.val(i => mvals[i]).change(); // 还原选项
							return;
						}
						$select.each(function(i) {
							mvals[i] = this.value;
							mw.storage.set(`${mkeys[i]}-color`, this.value);
						});
						generateStyle();
					});
				};
			$('.mw-indicators').on('click', '#mw-indicator-colorMod', openDialog); // 桌面版比较麻烦，采用delegate
			// 3. 首次訪問時顯示提示
			if (!mw.storage.getObject('colorMod-popup')) {
				popup = new OO.ui.PopupWidget({$content: $('<div>', {html: [$('<p>', {text: mw.msg('widget-cm-popup')}),
					$('<a>', {text: mw.msg('widget-cm-stop'), href: '#'}).click(e => {
						e.preventDefault();
					}),
				]}), padded: true, width: 260, classes: ['colorMod-tip']});
				popup.$element.appendTo(document.body).one('click', () => {
					popup.toggle(false);
					mw.storage.setObject('colorMod-popup', true);
				});
			}
			// 4. 更新数据
			mw.hook('wikipage.content').add($content => {
				const $indicator = $content.find('.mw-parser-output .page-actions-menu__list-item');
				if ($indicator.length === 0) {
					return;
				}
				console.log('Hook: wikipage.content, 开始构建应援色调色板');
				mkeys = Object.keys($indicator.children('span').data());
				// 手机版创建调色板按钮，需要防止二次创建
				if (isMobile && $('#page-actions > #mw-indicator-colorMod').length === 0) {
					$indicator.attr('id', 'mw-indicator-colorMod').insertAfter('#language-selector').click(openDialog)
						.children().wrapAll('<a>'); // Wikitext无法添加<a>元素，只能在这里用JS添加
				}
				// 根据localStorage调整初始颜色
				mvals = mkeys.map(key => mw.storage.get(`${key}-color`) || 0);
				generateStyle();
				mkeys.forEach(key => { // 处理渐变色
					$content.find(`.Lyrics_gradient.${key}-lyrics`).css('background-image', (_, val) => {
						// 如果之前已经替换过了也没有关系
						return val.replace(colors[key][0], `var(--${key}-color)`);
					});
				});
				$wrapper.html(mkeys.map(generateWrapper)); // 事件全都绑定在$wrapper上
				if (mw.storage.getObject('colorMod-popup')) {
					return;
				}
				popup.toggle(true).setFloatableContainer($('#mw-indicator-colorMod'));
			});
		},
		handler = async () => {
			mw.widget = mw.widget || {};
			if (mw.widget.colorMod) {
				return;
			}
			mw.widget.colorMod = true;
			await mw.loader.using(['mediawiki.storage', 'oojs-ui-windows', 'ext.gadget.site-lib']);
			main();
		};
	if (window.jQuery) {
		handler();
	} else {
		window.addEventListener('jquery', handler);
	}
})();
