
/* Drop Tables */

DROP TABLE IF EXISTS MAIL_TEMPLATE;
DROP TABLE IF EXISTS group_icon;
DROP TABLE IF EXISTS user_icon;
DROP TABLE IF EXISTS icon;
DROP TABLE IF EXISTS user_role;
DROP TABLE IF EXISTS "role";



/* Drop Sequences */

DROP SEQUENCE IF EXISTS icon_id_seq;




/* Create Tables */

CREATE TABLE MAIL_TEMPLATE
(
    id serial NOT NULL,
    template_name varchar(50) NOT NULL UNIQUE,
    subject varchar(255) NOT NULL,
    content text NOT NULL,
    PRIMARY KEY (id)
) WITHOUT OIDS;


CREATE TABLE group_icon
(
    contract_id varchar(32) NOT NULL,
    group_id bigint NOT NULL,
    icon_id bigint NOT NULL,
    CONSTRAINT group_icon_uq UNIQUE (contract_id, group_id, icon_id)
) WITHOUT OIDS;


CREATE TABLE icon
(
    id bigserial NOT NULL,
    contract_id varchar(32),
    filename varchar(255) NOT NULL,
    icon_type int NOT NULL,
    owner_user_id bigint,
    owner_group_id bigint,
    CONSTRAINT icon_pkey PRIMARY KEY (id)
) WITHOUT OIDS;


CREATE TABLE "role"
(
    /*1:システム管理者*/
    /*2:グループ管理者*/
    /*3:一般ユーザ*/
    id bigint PRIMARY KEY,

    /*ビットマスク*/
    /*1:グループへのメンバ追加削除*/
    /*2:グループ作成*/
    /*4:グループ削除*/
    /*8:グループ管理者登録削除*/
    /*16:システム管理者登録削除*/
    /*32:アカウント登録削除*/
    priviledge bigint
    /*CONSTRAINT role_pkey PRIMARY KEY (id)*/
) WITHOUT OIDS;


CREATE TABLE user_icon
(
    contract_id varchar(32) NOT NULL,
    user_id bigint NOT NULL,
    icon_id bigint NOT NULL,
    CONSTRAINT user_icon_uq UNIQUE (contract_id, user_id, icon_id)
) WITHOUT OIDS;


CREATE TABLE user_role
(
    contract_id varchar(32) NOT NULL,
    user_id bigint NOT NULL,
    group_id bigint NOT NULL,
    role_id bigint NOT NULL,
    CONSTRAINT user_role_uq UNIQUE (contract_id, user_id, group_id, role_id)
) WITHOUT OIDS;



/* Create Foreign Keys */

ALTER TABLE user_icon
    ADD FOREIGN KEY (icon_id)
    REFERENCES icon (id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT
;


ALTER TABLE group_icon
    ADD FOREIGN KEY (icon_id)
    REFERENCES icon (id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT
;


ALTER TABLE user_role
    ADD CONSTRAINT user_role_role_id_fkey FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON UPDATE NO ACTION
    ON DELETE CASCADE
;


/*組み込みアイコン登録*/
INSERT INTO icon (contract_id, filename, icon_type, owner_user_id, owner_group_id) VALUES (NULL, 'id01.png', 1, 0, NULL);
INSERT INTO icon (contract_id, filename, icon_type, owner_user_id, owner_group_id) VALUES (NULL, 'id02.png', 1, 0, NULL);
INSERT INTO icon (contract_id, filename, icon_type, owner_user_id, owner_group_id) VALUES (NULL, 'id03.png', 1, 0, NULL);
INSERT INTO icon (contract_id, filename, icon_type, owner_user_id, owner_group_id) VALUES (NULL, 'id04.png', 1, 0, NULL);
INSERT INTO icon (contract_id, filename, icon_type, owner_user_id, owner_group_id) VALUES (NULL, 'id05.png', 1, 0, NULL);
INSERT INTO icon (contract_id, filename, icon_type, owner_user_id, owner_group_id) VALUES (NULL, 'gr01.png', 2, NULL, 0);
INSERT INTO icon (contract_id, filename, icon_type, owner_user_id, owner_group_id) VALUES (NULL, 'gr02.png', 2, NULL, 0);
INSERT INTO icon (contract_id, filename, icon_type, owner_user_id, owner_group_id) VALUES (NULL, 'gr03.png', 2, NULL, 0);
INSERT INTO icon (contract_id, filename, icon_type, owner_user_id, owner_group_id) VALUES (NULL, 'gr04.png', 2, NULL, 0);
INSERT INTO icon (contract_id, filename, icon_type, owner_user_id, owner_group_id) VALUES (NULL, 'gr05.png', 2, NULL, 0);

INSERT INTO user_icon VALUES('logindex',4,1);
INSERT INTO user_icon VALUES('logindex',5,2);
INSERT INTO user_icon VALUES('logindex',6,3);
INSERT INTO user_icon VALUES('logindex',7,4);
INSERT INTO user_icon VALUES('logindex',8,5);
INSERT INTO group_icon VALUES('logindex',1,6);
INSERT INTO group_icon VALUES('logindex',2,7);

INSERT INTO "role" (id,priviledge) VALUES (1,63);
INSERT INTO "role" (id,priviledge) VALUES (2,15);
INSERT INTO "role" (id,priviledge) VALUES (3,11);

/*メールテンプレート登録*/
INSERT INTO mail_template (template_name,subject,content) VALUES('finish_tmp_register_user', '音声ビューア　アカウント仮登録完了通知', E'$DISPNAME$　様\n\n音声ビューアのアカウント仮登録が完了しました。\n下記URLをクリックすることで本登録となります。\n\nアカウント本登録URL\n$REGISTER_ACCOUNT_URL$\n');
INSERT INTO mail_template (template_name,subject,content) VALUES('finish_register_user', '音声ビューア　アカウント本登録完了通知', E'$DISPNAME$　様\n\n音声ビューアのアカウント本登録が完了しました。\n');
INSERT INTO mail_template (template_name,subject,content) VALUES('reset_password', '音声ビューア　パスワード再設定通知', E'$DISPNAME$　様\n\n下記URLからパスワードの再設定が可能です。\n\n$RESET_PASSWORD_URL$\n');


