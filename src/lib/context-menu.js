module.exports = function ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject) {
	'use strict';
	const self = this,
		onClick = function (tabId, itemMenuValue) {
			const falsyButNotEmpty = function (v) {
					return !v && typeof (v) !== 'string';
				},
				toValue = function (itemMenuValue) {
					if (typeof (itemMenuValue) === 'string') {
						return { '_type': 'literal', 'value': itemMenuValue};
					}
					return itemMenuValue;
				},
				valueToInsert = toValue(itemMenuValue);
			if (falsyButNotEmpty(valueToInsert)) {
				return;
			};
			return browserInterface.executeScript(tabId, '/content-script.js')
				.then(() => browserInterface.sendMessage(tabId, valueToInsert));
		},
		loadAdditionalMenus = function (additionalMenus, rootMenu) {
			if (additionalMenus && Array.isArray(additionalMenus) && additionalMenus.length) {
				additionalMenus.forEach(function (configItem) {
					const object = {};
					object[configItem.name] = configItem.config;
					processMenuObject(object, menuBuilder, rootMenu, onClick);
				});
			}
		},
		addGenericMenus = function (rootMenu) {
			menuBuilder.separator(rootMenu);
			menuBuilder.menuItem('Configure BugMagnet', rootMenu, browserInterface.openSettings);
		},
		rebuildMenu = function (options) {
			const rootMenu =  menuBuilder.rootMenu('Bug Magnet'),
				additionalMenus = options && options.additionalMenus;
			processMenuObject(standardConfig, menuBuilder, rootMenu, onClick);
			if (additionalMenus) {
				loadAdditionalMenus(additionalMenus, rootMenu);
			}
			addGenericMenus(rootMenu);
		},
		wireStorageListener = function () {
			browserInterface.addStorageListener(function () {
				return menuBuilder.removeAll()
					.then(browserInterface.getOptionsAsync)
					.then(rebuildMenu);
			});
		};
	self.init = function () {
		return browserInterface.getOptionsAsync()
			.then(rebuildMenu)
			.then(wireStorageListener);
	};
};
