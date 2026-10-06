CREATE TABLE IF NOT EXISTS `demo_ai_usage` (
  `day` text NOT NULL,
  `scope` text NOT NULL,
  `requests` integer NOT NULL DEFAULT 0,
  PRIMARY KEY (`day`, `scope`)
);
