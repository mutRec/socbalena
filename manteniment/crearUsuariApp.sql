--crear un usuari per l'aplicatiu i poder autenticar a la BBDD.
--el hash equival a 'ivanA0Jofre'
--si vull cambiar la clau (nou usuari, per exemple...) per generar el hash corresponent a la clau que es vulgui podem anar a:
--https://bcrypt-generator.com/?spm=a2ty_o01.29997173.0.0.5bdc55fbxq76TS (posar Rounds 10).
INSERT INTO usuaris (
    id,
    nom,
    email,
    password_hash,
    rol,
    avatar_url,
    creat_a
) VALUES (
    gen_random_uuid(),
    'Jordi',
    'jordi@abellot.net',
    '$2a$10$thytkr2UL/yX8iun.FcXmeL8r.3Ap6dMfLLGKGCTj0hc3UWa0wmvG',
    'bussejador',
    NULL,
    NOW()
);