/**
 * Copyright (C) 2023-2024 Gnuxie <Gnuxie@protonmail.com>
 * All rights reserved.
 */

import { MatrixRoomID } from '../MatrixTypes/MatrixRoomReference';
import { RoomStateRevisionIssuer } from '../StateTracking/StateRevisionIssuer';
import { PolicyListRevision, PolicyRoomRevision } from './PolicyListRevision';
import {
  PolicyRoomRevisionIssuer,
  RevisionListener,
} from './PolicyListRevisionIssuer';
import { PolicyRuleChange } from './PolicyRuleChange';
import { RoomStatePolicyRoomRevisionIssuer } from './RoomStatePolicyListRevisionIssuer';

export class FakePolicyRoomRevisionIssuer
  extends RoomStatePolicyRoomRevisionIssuer
  implements PolicyRoomRevisionIssuer
{
  private revisionLog: Parameters<RevisionListener>[] = [];
  public constructor(
    room: MatrixRoomID,
    currentRevision: PolicyRoomRevision,
    roomStateRevisionIssuer: RoomStateRevisionIssuer
  ) {
    super(room, currentRevision, roomStateRevisionIssuer);
  }

  public emit(
    event: 'revision',
    nextRevision: PolicyListRevision,
    changes: PolicyRuleChange[],
    previousRevision: PolicyListRevision
  ): boolean {
    if (event === 'revision') {
      this.revisionLog.push([nextRevision, changes, previousRevision]);
    }
    return super.emit(event, nextRevision, changes, previousRevision);
  }

  // These methods are on the Fake's reflective side
  public getLastRevision(): Parameters<RevisionListener> {
    const revisionEntry = this.revisionLog.at(-1);
    if (revisionEntry === undefined) {
      throw new TypeError(`the revision log is empty`);
    }
    return revisionEntry;
  }

  public getNumberOfRevisions(): number {
    return this.revisionLog.length;
  }
}
