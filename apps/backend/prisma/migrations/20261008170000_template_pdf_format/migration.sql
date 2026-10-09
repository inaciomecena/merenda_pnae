ALTER TABLE `pnae_templates_documento`
  MODIFY `formato` ENUM('HTML', 'DOCX', 'TEXTO', 'PDF') NOT NULL DEFAULT 'HTML';

ALTER TABLE `pnae_template_versoes`
  MODIFY `formato` ENUM('HTML', 'DOCX', 'TEXTO', 'PDF') NOT NULL;
