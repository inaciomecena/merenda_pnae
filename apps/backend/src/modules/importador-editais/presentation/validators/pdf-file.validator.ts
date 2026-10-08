import { BadRequestException } from '@nestjs/common';
import * as path from 'path';

const PDF_MIME_TYPES = ['application/pdf', 'application/x-pdf'];

export function ensurePdfFile(file?: Express.Multer.File) {
  if (!file) {
    throw new BadRequestException('Arquivo PDF é obrigatório.');
  }

  const extension = path.extname(file.originalname || '').toLowerCase();
  const mimeType = (file.mimetype || '').toLowerCase();

  if (extension !== '.pdf' || !PDF_MIME_TYPES.includes(mimeType)) {
    throw new BadRequestException('Somente arquivos PDF são permitidos.');
  }
}
