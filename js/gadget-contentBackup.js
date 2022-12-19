/**
 * @Function: 点击“提交编辑、显示预览、显示更改”中任意一个按钮，或在编辑页面每隔一段时间自动备份当前的编辑。
 *            备份会保存一段时间后自动清除。支持Wikiplus和代码编辑器。
 * @Dependencies: ext.gadget.SettingsDialog, localforage
 * @Source: https://zh.moegirl.org.cn/User:东东君/js/contentBackup.js
 * @EditedBy: https://llwiki.org/zh/User:Bhsd
 */
'use strict';
/* global mw, $, OO, wgULS, localforage */
/* eslint no-var: 0, prefer-template: 0, prefer-arrow-callback: 0, object-shorthand: 0 */
// 默认只用于桌面版、备份保存12小时、每隔30分钟自动更新备份
mw.gadgets.contentBackup = $.extend({range: ['vector'], exp: 12, stay: 30},
	mw.storage.getObject('gadget-contentBackup'),
	mw.gadgets.contentBackup
);
const action = mw.config.get('wgAction'),
	isEditable = mw.config.get('wgIsProbablyEditable'),
	skin = mw.config.get('skin'),
	isWikiplus = action == 'view' && (mw.isModule('Wikiplus', true) || mw.isModule('mobile-Wikiplus', true)),
	settings = mw.gadgets.contentBackup;
if (isEditable && settings.range.includes(skin) && (['edit', 'submit'].includes(action) || isWikiplus)) {
	var codeEditor, // 实时更新的Ace Editor Session
		backup = '', // 因为localforage提取backup是个Promise，这里先初始化
		expList = mw.storage.getObject('LLWiki-contentBackup-exp') || {}; // 单独存储备份过期时间，这是个Object
	const id = mw.config.get('wgArticleId').toString(), // 所有新建页面共用备份
		btns = '#wpSaveWidget, #wpPreviewWidget, #wpDiffWidget, #wpTemplateSandboxPreview', // MW原生编辑页面
		editor = '#wpTextbox1, #Wikiplus-Quickedit', // 部分编辑器需动态生成，所以这里只保存选择器
		expArray = Object.entries(expList),
		expired = mw.now() - settings.exp * 1000 * 3600,
		stay = settings.stay * 1000 * 60; // 通过设置改动stay时若立即生效会造成bug
	// 1. 设置本地化消息
	mw.messages.set(wgULS({
		'gadget-cb-label': '编辑内容自动备份', 'gadget-cb-range': '使用范围', 'gadget-cb-d': '桌面版',
		'gadget-cb-m': '手机版', 'gadget-cb-rhelp': '可用于代码编辑器和Wikiplus小工具。', 'gadget-cb-text': '还原备份',
		'gadget-cb-exp': '备份有效期（小时）', 'gadget-cb-stay': '自动备份间隔（分）', 'gadget-cb-success': '已还原备份！',
		'gadget-cb-shelp': "仅用于原生编辑页面。值为'0'时不会自动更新备份，变动后需刷新页面才会生效。",
	}, {
		'gadget-cb-label': '編輯內容自動備份', 'gadget-cb-range': '使用範圍', 'gadget-cb-d': '桌面版',
		'gadget-cb-m': '手機版', 'gadget-cb-rhelp': '可用於代碼編輯器和Wikiplus小工具。', 'gadget-cb-text': '還原備份',
		'gadget-cb-exp': '備份有效期（小時）', 'gadget-cb-stay': '自動備份間隔（分）', 'gadget-cb-success': '已還原備份！',
		'gadget-cb-shelp': "僅用於原生編輯頁面。值為'0'時不會自動更新備份，變動後需重新整理頁面才會生效。",
	}));
	// 2. 小工具设置
	mw.settingsDialog.addTab({name: 'contentBackup', label: 'gadget-cb-label', items: [
		{key: 'range', type: 'CheckboxMultiselect', label: 'gadget-cb-range', help: mw.msg('gadget-cb-rhelp'),
			config: {options: [
				{data: 'vector', label: mw.msg('gadget-cb-d')}, {data: 'minerva', label: mw.msg('gadget-cb-m')},
			]},
		}, {key: 'stay', type: 'Number', label: 'gadget-cb-stay', help: mw.msg('gadget-cb-shelp'),
			config: {min: 0, buttonStep: 5, required: true},
		}, {key: 'exp', type: 'Number', label: 'gadget-cb-exp', config: {min: 1, buttonStep: 1, required: true}},
	], help: '编辑内容备份'});
	// 3. 核心函数
	const loadBackup = function() { // 加载备份函数
			// CodeEditor需特殊处理
			if ($('.codeEditor-ui-toolbar').length) {
				codeEditor.setValue(backup);
			} else {
				$(editor).val(backup);
			}
			mw.notify(mw.msg('gadget-cb-success'), {type: 'success'});
			update();
		},
		saveBackup = function() { // 保存备份函数
			// CodeEditor需特殊处理
			if ($('.codeEditor-ui-toolbar').length) {
				backup = codeEditor.getValue();
			} else {
				backup = $(editor).val();
			}
			expList[id] = mw.now();
			mw.storage.setObject('LLWiki-contentBackup-exp', expList);
			localforage.setItem(id, backup);
			update();
		},
		// 自动更新函数，不支持Wikiplus
		update = isWikiplus || stay === 0
			? function() {}
			: mw.util.debounce(stay, function() {
				saveBackup();
				console.log('备份自动更新于' + new Date().toLocaleTimeString('zh'));
			}),
		btn = isWikiplus
			? {setDisabled: function() {}}
			: new OO.ui.ButtonWidget({label: mw.msg('gadget-cb-text'), disabled: true}).on('click', loadBackup);
	mw.loader.getScript('https://cdn.jsdelivr.net/npm/localforage/dist/localforage.min.js').then(function() {
		localforage.config({name: 'LLWiki-contentBackup'});
		// 4. 先更新备份
		if (expArray.length) {
			expArray.filter(function(ele) {
				return ele[1] <= expired;
			})
				.forEach(function(ele) {
					localforage.removeItem(ele[0]);
				});
			expList = Object.fromEntries(expArray.filter(function(ele) {
				return ele[1] > expired;
			}));
			mw.storage.setObject('LLWiki-contentBackup-exp', expList);
		} else {
			mw.storage.remove('LLWiki-contentBackup');
		} // 移除旧版小工具的备份存档
		if (expList[id]) {
			localforage.getItem(id, function(_, item) {
				backup = item;
				btn.setDisabled(!backup);
			});
		}
		// 5. 初始化延时保存备份功能
		update();
		// 6. 添加备份按钮和按键保存备份功能
		if (isWikiplus) {
			const $btnPro = $('<button>', {text: mw.msg('gadget-cb-text')}).click(loadBackup);
			mw.hook('wikiplus.dialog').add(function() { // Wikiplus需动态添加备份按钮
				const $previewBtn = $('#Wikiplus-Quickedit-Preview-Submit');
				if ($previewBtn.next('button').length) {
					return;
				} // 防止按钮已存在
				console.log('Hook: wikiplus.dialog, 开始添加备份按钮');
				const $btn = $btnPro.clone(true).prop('disabled', !backup).insertAfter($previewBtn);
				// Wikiplus的上层为body，delegate效率太低
				$('#Wikiplus-Quickedit-Submit, #Wikiplus-Quickedit-Preview-Submit').mousedown(function() {
					saveBackup();
					$btn.prop('disabled', !backup);
				});
			});
		} else {
			$(function() { // 只添加一次按钮
				btn.$element.insertAfter('#wpDiffWidget');
				// #wpTemplateSandboxPreview可能由小工具生成，这里避免麻烦直接delegate
				$('.editOptions').on('mousedown', btns, function() {
					saveBackup();
					btn.setDisabled(!backup);
				});
			});
		}
	}, function() {
		console.error('无法获得localforage！');
	});
	// 7. 更新Ace Editor Session
	mw.hook('codeEditor.configure').add(function(session) {
		console.log('Hook: codeEditor.configure, 更新CodeEditor编辑器');
		codeEditor = session;
	});
}
