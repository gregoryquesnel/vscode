/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'vs/nls';
import { Extensions as ConfigurationExtensions, IConfigurationRegistry } from 'vs/platform/configuration/common/configurationRegistry';
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors';
import { registerSingleton } from 'vs/platform/instantiation/common/extensions';
import { LifecyclePhase } from 'vs/platform/lifecycle/common/lifecycle';
import { Registry } from 'vs/platform/registry/common/platform';
import { EditorDescriptor, Extensions as EditorExtensions, IEditorRegistry } from 'vs/workbench/browser/editor';
import { Extensions as WorkbenchExtensions, IWorkbenchContributionsRegistry } from 'vs/workbench/common/contributions';
import { ICustomEditorService } from 'vs/workbench/contrib/customEditor/common/customEditor';
import './commands';
import { CustomEditorContribution, CustomEditorService, CustomFileEditorInput, CustomWebviewEditor } from './customEditors';

registerSingleton(ICustomEditorService, CustomEditorService);

const workbenchContributionsRegistry = Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench);
workbenchContributionsRegistry.registerWorkbenchContribution(CustomEditorContribution, LifecyclePhase.Starting);

Registry.as<IEditorRegistry>(EditorExtensions.Editors).registerEditor(
	new EditorDescriptor(
		CustomWebviewEditor,
		CustomWebviewEditor.ID,
		'Custom Editor',
	), [
		new SyncDescriptor(CustomFileEditorInput)
	]);

// Configuration
(function registerConfiguration(): void {
	const registry = Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration);
	// Telemetry
	registry.registerConfiguration({
		'id': 'workbench',
		'order': 7,
		'title': nls.localize('workbenchConfigurationTitle', "Workbench"),
		'type': 'object',
		'properties': {
			'workbench.editor.custom': {
				'type': 'object',
				'description': nls.localize('editor.custom', "TODO."),
				'default': {}
			}
		}
	});
})();
