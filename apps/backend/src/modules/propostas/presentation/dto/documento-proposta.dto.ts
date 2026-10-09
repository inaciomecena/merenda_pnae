import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsObject, IsString, ValidateNested } from 'class-validator';

export class EscolhaModeloDto {
  @IsString() templateId!: string;
  @IsString() versaoId!: string;
}

export class DocumentoPropostaDto {
  @IsArray() @ArrayMaxSize(15) @ValidateNested({ each: true }) @Type(() => EscolhaModeloDto)
  modelos!: EscolhaModeloDto[];
  @IsObject() valores!: Record<string, string>;
}
