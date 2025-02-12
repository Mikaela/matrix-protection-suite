/**
 * Copyright (C) 2023 Gnuxie <Gnuxie@protonmail.com>
 * All rights reserved.
 *
 * This file is modified and is NOT licensed under the Apache License.
 * This modified file incorperates work from mjolnir
 * https://github.com/matrix-org/mjolnir
 * which included the following license notice:

Copyright 2022 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 *
 * However, this file is modified and the modifications in this file
 * are NOT distributed, contributed, committed, or licensed under the Apache License.
 */

import { ActionError, ActionResult } from '../../Interface/Action';
import { ConsequenceProviderDescription } from '../Consequence/Consequence';
import { ProtectedRoomsSet } from '../ProtectedRoomsSet';
import { Protection, ProtectionDescription } from '../Protection';
import { UnknownSettings } from '../ProtectionSettings/ProtectionSetting';

/**
 * The idea needs to be that protections are defined using a state event
 * that contains their settings. so e.g.
 * ge.applied-langua.ge.draupnir.protection with state key "TrustedReporters"
 * would have a `settings` key that would initialize the `TrustedReporters`
 * protection with `settings` as options. If `settings` doesn't validate
 * you just give the user the option to use the default settings.
 */

/**
 * A callback that will be called when a protection fails to start
 * for the first time when loading protections.
 */
/**
 * Callback when a protection failed to start.
 */
export type ProtectionFailedToStartCB = (
  /** The problem leading to the failure. */
  Error: ActionError,
  /** The name of the protection as given in the `enabled_protections` config. */
  protectionName: string,
  /** The protection description, if it can be found. */
  ProtectionDescription?: ProtectionDescription
) => Promise<void>;

export interface ProtectionsConfig<Context = unknown> {
  readonly allProtections: Protection[];
  addProtection(
    protectionDescription: ProtectionDescription,
    consequenceProviderDescription: ConsequenceProviderDescription,
    protectedRoomsSet: ProtectedRoomsSet,
    context: Context
  ): Promise<ActionResult<void>>;
  removeProtection(
    protection: ProtectionDescription
  ): Promise<ActionResult<void>>;
  /**
   * Load protections for the first time after instantiating ProtectionsConfig
   * and the entire ProtectedRoomsSet.
   * This would be done within the factory method to ProtectionsConfig implementations
   * if there wasn't a dependency for protections on the ProtectedRoomsSet, which
   * has a dependency on ProtectionsConfig.
   * @param consequenceProvider A provider to the consequences of all protections,
   * this will be changed in a future version where consequence providers will be per protection.
   * @param protectedRoomsSet The protected rooms set that the protection is being used within.
   * @param protectionFailedToStart A callback to be called should one of the protections fail to start.
   */
  loadProtections(
    protectedRoomsSet: ProtectedRoomsSet,
    context: Context,
    protectionFailedToStart: ProtectionFailedToStartCB
  ): Promise<ActionResult<void>>;

  /**
   * Change the protection settings.
   * If the protection is currently enabled, then the protection will be stopped,
   * removed recreated from the description and restarted.
   * @param protectionDescription The protection whose settings need to change.
   * @param settings The parsed settings for the protection. If these are wrong,
   * then this method will fail.
   */
  changeProtectionSettings<
    TSettings extends UnknownSettings<string> = UnknownSettings<string>,
    TProtectionDescription extends ProtectionDescription<
      Context,
      TSettings
    > = ProtectionDescription<Context, TSettings>
  >(
    protectionDescription: TProtectionDescription,
    protectedRoomsSet: ProtectedRoomsSet,
    context: Context,
    settings: TSettings
  ): Promise<ActionResult<void>>;

  /**
   * Return the consequence provider description that has been set for a protection.
   * @param protectionDescription The protection description to find the configured
   * consequence provider description for.
   */
  getConsequenceProviderDescriptionForProtection<
    TProtectionDescription extends ProtectionDescription = ProtectionDescription
  >(
    protectionDescription: TProtectionDescription
  ): Promise<ActionResult<ConsequenceProviderDescription>>;

  getProtectionSettings<
    TSettings extends UnknownSettings<string> = UnknownSettings<string>
  >(
    protectionDescription: ProtectionDescription<Context, TSettings>
  ): Promise<ActionResult<TSettings>>;

  isEnabledProtection(protectionDescription: ProtectionDescription): boolean;
}
