CREATE TABLE `team_members` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `firstname` varchar(100) NOT NULL,
  `lastname` varchar(100) NOT NULL,
  `role` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `projects` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `github_repo` varchar(255) DEFAULT NULL,
  `github_owner` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `projects_UN` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `cards` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` text NOT NULL,
  `description` text,
  `created_by` bigint NOT NULL,
  `assignee` bigint DEFAULT NULL,
  `status` varchar(100) NOT NULL,
  `created_date` datetime NOT NULL,
  `updated_date` datetime NOT NULL,
  `project_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `cards_assignee_fk` (`assignee`),
  KEY `cards_created_by_fk` (`created_by`),
  KEY `cards_project_fk` (`project_id`),
  CONSTRAINT `cards_assignee_fk` FOREIGN KEY (`assignee`) REFERENCES `team_members` (`id`),
  CONSTRAINT `cards_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `team_members` (`id`),
  CONSTRAINT `cards_project_fk` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `project_team_members` (
  `project_id` bigint NOT NULL,
  `team_member_id` bigint NOT NULL,
  UNIQUE KEY `project_team_members_UN` (`project_id`,`team_member_id`),
  KEY `ptm_team_members_fk` (`team_member_id`),
  CONSTRAINT `ptm_projects_fk` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `ptm_team_members_fk` FOREIGN KEY (`team_member_id`) REFERENCES `team_members` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;