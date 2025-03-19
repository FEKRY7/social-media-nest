import { IsString, IsNumber, IsNotEmpty, Min, MinLength, MaxLength, Max, Length } from 'class-validator';

export class CreateReviewDto {
    @IsNumber() 
    @Min(1)
    @Max(5)
    rating: number
    
    @IsString() 
    @MinLength(2)
    comment: string;

}