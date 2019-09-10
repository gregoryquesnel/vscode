/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from 'vs/nls';
import { ServicesAccessor } from 'vs/platform/instantiation/common/instantiation';
import { IQuickInputService, IQuickPickItem } from 'vs/platform/quickinput/common/quickInput';
import { IStorageService, StorageScope } from 'vs/platform/storage/common/storage';
import { IProductService } from 'vs/platform/product/common/product';

/**
 * 4 actions:
 * - Open all links with/without promt
 * - Add trusted domain / 2nd action
 * - Configure trusted domains / 2nd action
 * - Reset trusted domains setting
 */

export const enum ConfigureTrustedDomainActionType {
	ToggleAll = 'toggleAll',
	Add = 'add',
	Configure = 'configure',
	Reset = 'reset'
}

export const configureTrustedDomainSettingsCommand = {
	id: 'workbench.action.configureTrustedDomainSettings',
	description: {
		description: localize('configureTrustedDomainSettings', 'Configure Trusted Domains Settings for Link Protection'),
		args: []
	},
	handler: async (accessor: ServicesAccessor) => {
		const quickInputService = accessor.get(IQuickInputService);
		const storageService = accessor.get(IStorageService);
		const productService = accessor.get(IProductService);

		let trustedDomains: string[] = productService.linkProtectionTrustedDomains
			? [...productService.linkProtectionTrustedDomains]
			: [];

		try {
			const trustedDomainsSrc = storageService.get('http.linkProtectionTrustedDomains', StorageScope.GLOBAL);
			if (trustedDomainsSrc) {
				trustedDomains = JSON.parse(trustedDomainsSrc);
			}
		} catch (err) {}

		const trustOrUntrustAll: IQuickPickItem =
			trustedDomains.indexOf('*') === -1
				? {
						id: ConfigureTrustedDomainActionType.ToggleAll,
						label: localize('trustedDomain.trustAll', 'Open all links without prompt')
				  }
				: {
						id: ConfigureTrustedDomainActionType.ToggleAll,
						label: localize('trustedDomain.untrustAll', 'Open all links with prompt')
				  };

		const result = await quickInputService.pick(
			[
				trustOrUntrustAll,
				{ id: ConfigureTrustedDomainActionType.Add, label: localize('trustedDomain.add', 'Add Trusted Domain') },
				{
					id: ConfigureTrustedDomainActionType.Configure,
					label: localize('trustedDomain.edit', 'View and configure Trusted Domains')
				},
				{ id: ConfigureTrustedDomainActionType.Reset, label: localize('trustedDomain.reset', 'Reset Trusted Domains') }
			],
			{}
		);

		if (result) {
			switch (result.id) {
				case ConfigureTrustedDomainActionType.ToggleAll:
					toggleAll(trustedDomains, storageService);
					break;
				case ConfigureTrustedDomainActionType.Add:
					addDomain(trustedDomains, storageService, quickInputService);
					break;
				case ConfigureTrustedDomainActionType.Configure:
					configureDomains(trustedDomains, storageService, quickInputService);
					break;
				case ConfigureTrustedDomainActionType.Reset:
					resetDomains(storageService, productService);
					break;
			}
		}
	}
};

function toggleAll(trustedDomains: string[], storageService: IStorageService) {
	if (trustedDomains.indexOf('*') === -1) {
		storageService.store(
			'http.linkProtectionTrustedDomains',
			JSON.stringify(trustedDomains.concat(['*'])),
			StorageScope.GLOBAL
		);
	} else {
		storageService.store(
			'http.linkProtectionTrustedDomains',
			JSON.stringify(trustedDomains.filter(x => x !== '*')),
			StorageScope.GLOBAL
		);
	}
}

function addDomain(trustedDomains: string[], storageService: IStorageService, quickInputService: IQuickInputService) {
	quickInputService
		.input({
			placeHolder: 'https://www.microsoft.com',
			validateInput: i => {
				if (!i.match(/^https?:\/\//)) {
					return Promise.resolve(undefined);
				}

				return Promise.resolve(i);
			}
		})
		.then(result => {
			storageService.store(
				'http.linkProtectionTrustedDomains',
				JSON.stringify(trustedDomains.concat([result])),
				StorageScope.GLOBAL
			);
		});
}

function configureDomains(
	trustedDomains: string[],
	storageService: IStorageService,
	quickInputService: IQuickInputService
) {
	const domainQuickPickItems: IQuickPickItem[] = trustedDomains
		.filter(d => d !== '*')
		.map(d => {
			return {
				type: 'item',
				label: d,
				id: d,
				picked: true
			};
		});

	quickInputService.pick(domainQuickPickItems, { canPickMany: true }).then(result => {
		const pickedDomains: string[] = result.map(r => r.id!);
		storageService.store('http.linkProtectionTrustedDomains', JSON.stringify(pickedDomains), StorageScope.GLOBAL);
	});
}

function resetDomains(storageService: IStorageService, productService: IProductService) {
	if (productService.linkProtectionTrustedDomains) {
		storageService.store('http.linkProtectionTrustedDomains', JSON.stringify(productService.linkProtectionTrustedDomains), StorageScope.GLOBAL);
	}
}
