-- handle_video_done() est une fonction TRIGGER : elle ne doit jamais être
-- appelée directement via l'API REST. On révoque EXECUTE pour anon/authenticated
-- (le trigger continue de fonctionner, il s'exécute dans le contexte du moteur).
-- Lève le WARN advisor "anon/authenticated_security_definer_function_executable".
revoke execute on function public.handle_video_done() from public, anon, authenticated;
