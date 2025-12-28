import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    @IsOptional()
    name?: string;

    @IsEmail()
    @IsOptional()
    email?: string;
}
