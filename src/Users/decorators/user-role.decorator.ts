import { SetMetadata } from "@nestjs/common";
import { UserType } from "src/untils/enums";

// Roles decorator
export const Roles = (...roles: UserType[]) => SetMetadata('roles', roles);
