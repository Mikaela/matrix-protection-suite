/**
 * Copyright (C) 2022-2023 Gnuxie <Gnuxie@protonmail.com>
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

import { ActionError, ActionResult, Ok } from '../Interface/Action';

export interface ProtectionSetting<
  TSettings extends Record<string, unknown> = Record<string, unknown>
> {
  readonly key: keyof TSettings;
  setValue(settings: TSettings, value: unknown): ActionResult<TSettings>;
}

export class AbstractProtectionSetting<
  TSettings extends Record<string, unknown> = Record<string, unknown>
> {
  protected constructor(public readonly key: keyof TSettings) {
    // nothing to do.
  }
  public setParsedValue(
    settings: TSettings,
    value: TSettings[keyof TSettings]
  ) {
    const clone = structuredClone(settings);
    clone[this.key] = value;
    return Ok(clone);
  }
}

export class SafeIntegerProtectionSetting<
    TSettings extends Record<string, number> = Record<string, number>
  >
  extends AbstractProtectionSetting<TSettings>
  implements ProtectionSetting<TSettings>
{
  public constructor(
    key: keyof TSettings,
    public readonly min?: number,
    public readonly max?: number
  ) {
    super(key);
  }

  public setValue(
    settings: TSettings,
    value: unknown
  ): ActionResult<TSettings> {
    if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
      return ActionError.Result(
        `The value ${value} for the setting ${String(
          this.key
        )} is not a safe integer`
      );
    } else if (this.min !== undefined && this.min > value) {
      return ActionError.Result(
        `The value ${value} for the setting ${String(
          this.key
        )} is less than the minimum ${this.min}`
      );
    } else if (this.max !== undefined && this.max < value) {
      return ActionError.Result(
        `The value ${value} for the setting ${String(
          this.key
        )} is greater than the maximum ${this.max}`
      );
    } else {
      return this.setParsedValue(settings, value as TSettings[keyof TSettings]);
    }
  }
}
