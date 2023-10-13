/**
 * Copyright (C) 2023 Gnuxie <Gnuxie@protonmail.com>
 * All rights reserved.
 */

import { TSchema, StaticDecode, TypeBoxError, Static } from '@sinclair/typebox';
import { TypeCheck, TypeCompiler } from '@sinclair/typebox/compiler';
import { ActionResult, Ok } from './Action';
import { ActionException, ActionExceptionKind } from './ActionException';

export class Value {
  private static compiledSchema = new Map<TSchema, TypeCheck<TSchema>>();
  public static Compile<T extends TSchema>(schema: T): TypeCheck<T> {
    const entry = this.compiledSchema.get(schema);
    if (entry === undefined) {
      const compiledCheck = TypeCompiler.Compile(schema);
      this.compiledSchema.set(schema, compiledCheck);
      return compiledCheck;
    }
    return entry as TypeCheck<T>;
  }
  public static Decode<T extends TSchema, D = StaticDecode<T>>(
    schema: T,
    value: unknown
  ): ActionResult<D> {
    return this.resultify<T, D>(
      schema,
      (decoder) => decoder.Decode(value) as D
    );
  }
  public static Check<T extends TSchema>(
    schema: T,
    value: unknown
  ): value is Static<T> {
    const decoder = this.Compile(schema);
    return decoder.Check(value);
  }
  private static resultify<T extends TSchema, R>(
    schema: T,
    continuation: (decoder: TypeCheck<T>) => R
  ): ActionResult<R> {
    try {
      const decoder = this.Compile(schema);
      return Ok(continuation(decoder));
    } catch (e) {
      if (!(e instanceof TypeBoxError)) {
        throw e;
      } else {
        return ActionException.Result(`Unable to decode schema from value`, {
          exception: e,
          exceptionKind: ActionExceptionKind.Unknown,
        });
      }
    }
  }
}