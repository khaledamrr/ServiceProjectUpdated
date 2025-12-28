import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
    @IsString()
    @MinLength(8)
    oldPassword: string;

    @IsString()
    @MinLength(8)
    @MaxLength(100)
    newPassword: string;
}
