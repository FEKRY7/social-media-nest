import { IsOptional, IsString, IsDate, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class DateFilterDto {
  @IsOptional()
  @IsString()
  @IsIn(["Today", "Yesterday", "Last 7 Days", "Last 30 Days"], {
    message: 'date must be one of "Today", "Yesterday", "Last 7 Days", "Last 30 Days"',
  })
  date?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'startDateRange must be a valid date' })
  startDateRange?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'endDateRange must be a valid date' })
  endDateRange?: Date;
}
