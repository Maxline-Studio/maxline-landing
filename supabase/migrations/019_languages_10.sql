-- Extension aux 10 langues les plus parlées (codes ISO-639-1, compatibles
-- Whisper + Claude). On relâche les CHECK source_lang/target_lang de videos et
-- glossaries de ('fr','en') vers les 10 langues.
alter table public.videos drop constraint if exists videos_source_lang_check;
alter table public.videos add constraint videos_source_lang_check
  check (source_lang in ('fr','en','es','de','it','pt','ru','zh','ja','ar'));
alter table public.videos drop constraint if exists videos_target_lang_check;
alter table public.videos add constraint videos_target_lang_check
  check (target_lang in ('fr','en','es','de','it','pt','ru','zh','ja','ar'));

alter table public.glossaries drop constraint if exists glossaries_source_lang_check;
alter table public.glossaries add constraint glossaries_source_lang_check
  check (source_lang in ('fr','en','es','de','it','pt','ru','zh','ja','ar'));
alter table public.glossaries drop constraint if exists glossaries_target_lang_check;
alter table public.glossaries add constraint glossaries_target_lang_check
  check (target_lang in ('fr','en','es','de','it','pt','ru','zh','ja','ar'));
