/**
 * Copyright (C) 2023 Gnuxie <Gnuxie@protonmail.com>
 * All rights reserved.
 */

import { randomUUID } from 'crypto';
import { ActionError, ActionResult } from './Action';
import { Logger } from '../Logging/Logger';

const log = new Logger('ActionException');

export enum ActionExceptionKind {
  /**
   * This class is for exceptions that need to be reported to the user,
   * but are mostly irrelevant to the developers because the behaviour is well
   * understood and expected. These exceptions will never be logged to the error
   * level.
   */
  Known = 'Known',
  /**
   * This class is to be used for reporting unexpected or unknown exceptions
   * that the developers need to know about.
   */
  Unknown = 'Unknown',
}

// TODO: I wonder if we could allow message to be JSX?
export class ActionException extends ActionError {
  public readonly uuid = randomUUID();

  constructor(
    public readonly exceptionKind: ActionExceptionKind,
    public readonly exception: Error | unknown,
    message: string
  ) {
    super(message);
    this.log();
  }

  public static Result<Ok>(
    message: string,
    options: { exception: Error; exceptionKind: ActionExceptionKind }
  ): ActionResult<Ok, ActionException> {
    return ActionResult.Err(
      new ActionException(options.exceptionKind, options.exception, message)
    );
  }

  protected log(): void {
    const logArguments: Parameters<InstanceType<typeof Logger>['info']> = [
      'ActionException',
      this.exceptionKind,
      this.uuid,
      this.message,
      this.exception,
    ];
    if (this.exceptionKind === ActionExceptionKind.Known) {
      log.info(...logArguments);
    } else {
      log.error(...logArguments);
    }
  }
}
