import { Schema } from "effect";

export class SoilParseError extends Schema.TaggedErrorClass<SoilParseError>()("SoilParseError", {
  message: Schema.String,
  path: Schema.optional(Schema.String),
}) {}

export class SoilValidationError extends Schema.TaggedErrorClass<SoilValidationError>()(
  "SoilValidationError",
  {
    message: Schema.String,
    path: Schema.optional(Schema.String),
  },
) {}

export class SoilEtagMismatchError extends Schema.TaggedErrorClass<SoilEtagMismatchError>()(
  "SoilEtagMismatchError",
  {
    message: Schema.String,
    expected: Schema.String,
    actual: Schema.String,
  },
) {}

export class SoilFileNotFoundError extends Schema.TaggedErrorClass<SoilFileNotFoundError>()(
  "SoilFileNotFoundError",
  {
    message: Schema.String,
    path: Schema.String,
  },
) {}

export class SoilConfigError extends Schema.TaggedErrorClass<SoilConfigError>()("SoilConfigError", {
  message: Schema.String,
  path: Schema.optional(Schema.String),
}) {}

export type SoilError =
  | SoilParseError
  | SoilValidationError
  | SoilEtagMismatchError
  | SoilFileNotFoundError
  | SoilConfigError;
