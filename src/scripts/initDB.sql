CREATE DATABASE `dots`;

CREATE TABLE `dots`.`Scores` (
    `Id` int unsigned NOT NULL AUTO_INCREMENT,
    `Name` varchar(255) NOT NULL,
    `Score` int unsigned NOT NULL,
    `TimeTaken` int unsigned NOT NULL,
    `TimeSubmitted` int NOT NULL,
    PRIMARY KEY (`Id`),
    KEY `idx_TimeSubmitted` (`TimeSubmitted`) USING BTREE,
    KEY `idx_Score_TimeTaken` (`Score`,`TimeTaken`) USING BTREE
);
