// Copyright 2019 2022 The Matrix.org Foundation C.I.C.
// Copyright 2022 - 2023 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: AFL-3.0 AND Apache-2.0

// This modified file incorporates work from mjolnir
// https://github.com/matrix-org/mjolnir

import { MatrixRoomID } from '../../MatrixTypes/MatrixRoomReference';
import { ActionResult, Ok, isError } from '../../Interface/Action';
import { StringRoomID } from '../../MatrixTypes/StringlyTypedMatrix';
import { MatrixAccountData } from '../../Interface/PersistentMatrixData';
import { MjolnirProtectedRoomsEvent } from './MjolnirProtectedRoomsEvent';
import EventEmitter from 'events';
import AwaitLock from 'await-lock';

export enum ProtectedRoomChangeType {
  Added = 'added',
  Removed = 'removed',
}

export type ProtectedRoomsChangeListener = (
  room: MatrixRoomID,
  changeType: ProtectedRoomChangeType
) => void;

export interface ProtectedRoomsConfig {
  readonly allRooms: MatrixRoomID[];
  isProtectedRoom(roomID: StringRoomID): boolean;
  getProtectedRoom(roomID: StringRoomID): MatrixRoomID | undefined;
  addRoom(room: MatrixRoomID): Promise<ActionResult<void>>;
  removeRoom(room: MatrixRoomID): Promise<ActionResult<void>>;
  on(event: 'change', listener: ProtectedRoomsChangeListener): this;
  off(event: 'change', listener: ProtectedRoomsChangeListener): this;
  emit(
    event: 'change',
    ...args: Parameters<ProtectedRoomsChangeListener>
  ): void;
}

export class MjolnirProtectedRoomsConfig
  extends EventEmitter
  implements ProtectedRoomsConfig
{
  private readonly writeLock = new AwaitLock();
  private constructor(
    private readonly store: MatrixAccountData<MjolnirProtectedRoomsEvent>,
    private readonly protectedRooms: Map<StringRoomID, MatrixRoomID>
  ) {
    super();
  }
  public static async createFromStore(
    store: MatrixAccountData<MjolnirProtectedRoomsEvent>
  ): Promise<ActionResult<ProtectedRoomsConfig>> {
    const data = await store.requestAccountData();
    if (isError(data)) {
      return data.addContext(
        `Failed to load ProtectedRoomsConfig when creating ProtectedRoomsConfig`
      );
    }
    const protectedRooms = new Map();
    for (const ref of data.ok?.rooms ?? []) {
      protectedRooms.set(ref.toRoomIDOrAlias(), ref);
    }
    return Ok(new MjolnirProtectedRoomsConfig(store, protectedRooms));
  }
  public getProtectedRoom(roomID: StringRoomID): MatrixRoomID | undefined {
    return this.protectedRooms.get(roomID);
  }
  public get allRooms() {
    return [...this.protectedRooms.values()];
  }
  public isProtectedRoom(roomID: StringRoomID): boolean {
    return this.protectedRooms.has(roomID);
  }
  public async addRoom(room: MatrixRoomID): Promise<ActionResult<void>> {
    await this.writeLock.acquireAsync();
    try {
      const result = await this.store.storeAccountData({
        rooms: [...this.allRooms, room],
      });
      if (isError(result)) {
        return result.addContext(
          `Failed to add ${room.toPermalink()} to protected rooms set.`
        );
      }
      this.protectedRooms.set(room.toRoomIDOrAlias(), room);
      this.emit('change', room, ProtectedRoomChangeType.Added);
      return Ok(undefined);
    } finally {
      this.writeLock.release();
    }
  }
  public async removeRoom(room: MatrixRoomID): Promise<ActionResult<void>> {
    await this.writeLock.acquireAsync();
    try {
      const result = await this.store.storeAccountData({
        rooms: this.allRooms.filter(
          (ref) => ref.toRoomIDOrAlias() !== room.toRoomIDOrAlias()
        ),
      });
      if (isError(result)) {
        return result.addContext(
          `Failed to remove ${room.toPermalink()} to protected rooms set.`
        );
      }
      this.protectedRooms.delete(room.toRoomIDOrAlias());
      this.emit('change', room, ProtectedRoomChangeType.Removed);
      return Ok(undefined);
    } finally {
      this.writeLock.release();
    }
  }
}
