CREATE DATABASE IF NOT EXISTS BingeBaddies;
USE BingeBaddies;

CREATE TABLE IF NOT EXISTS Users (
    user_id      INT AUTO_INCREMENT PRIMARY KEY,
    username     VARCHAR(50)  NOT NULL,
    email        VARCHAR(100) NOT NULL,
    password     VARCHAR(255) NOT NULL
)

CREATE TABLE IF NOT EXISTS Room (
    room_id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT          NOT NULL,
    video_link   VARCHAR(255) DEFAULT NULL,
    code         VARCHAR(6)   NOT NULL,
    active_users TEXT         DEFAULT NULL,
    CONSTRAINT fk_room_creator
        FOREIGN KEY (user_id)
        REFERENCES Users (user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)


CREATE TABLE IF NOT EXISTS Messages (
    message_id   INT AUTO_INCREMENT PRIMARY KEY,
    message_text TEXT    NOT NULL,
    room_id      INT     NOT NULL,
    user_id      INT     NOT NULL,
    CONSTRAINT fk_messages_room
        FOREIGN KEY (room_id)
        REFERENCES Room (room_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_messages_user
        FOREIGN KEY (user_id)
        REFERENCES Users (user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
