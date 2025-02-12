/**
 * Copyright (C) 2023 Gnuxie <Gnuxie@protonmail.com>
 * All rights reserved.
 */

import { RoomEvent } from '../MatrixTypes/Events';
import { StringRoomID, StringUserID } from '../MatrixTypes/StringlyTypedMatrix';
import { PolicyRoomManager } from '../PolicyList/PolicyRoomManger';
import { EventReport } from '../Reporting/EventReport';
import { RoomMembershipManager } from '../StateTracking/RoomMembershipManager';
import { RoomStateManager } from '../StateTracking/StateRevisionIssuer';

// TODO: if ever `Client` needs access to `ClientRooms` please note
// that `ClientRooms` has to inform `Client`'s `handleTimelineEvent` method.
// Therefore I suggest adding some method to `setClientRooms` which
// throws if used more than once, and a getter (the only public one within a `Client`) that throws
// when the associated place for `ClientRooms` is undefined.
export interface Client {
  readonly clientUserID: StringUserID;
  readonly roomStateManager: RoomStateManager;
  readonly policyRoomManager: PolicyRoomManager;
  readonly roomMembershipManager: RoomMembershipManager;
  /**
   * This should be called by the associated `ClientRooms`,
   * so that any membership changes can be properly processed and verified.
   * @param roomID The room ID that there was an event within.
   * @param event The event.
   */
  handleTimelineEvent(roomID: StringRoomID, event: RoomEvent): void;
  handleEventReport(report: EventReport): void;
}
