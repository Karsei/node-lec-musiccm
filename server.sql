CREATE TABLE `mc_boardinfo` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `tablename` varchar(64) NOT NULL,
  `name` varchar(64) NOT NULL,
  `desc` varchar(45) NOT NULL,
  `color` varchar(32) DEFAULT NULL,
  `identify` varchar(32) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8

CREATE TABLE `mc_cate_play` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(64) NOT NULL,
  `identify` varchar(64) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8

CREATE TABLE `mc_cate_sheet` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(64) NOT NULL,
  `identify` varchar(64) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=utf8

CREATE TABLE `mc_mentorboard` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user` int(10) NOT NULL,
  `title` varchar(128) NOT NULL,
  `content` varchar(45) DEFAULT NULL,
  `adate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `replyid` int(10) NOT NULL DEFAULT '0',
  `atype` tinyint(3) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8

CREATE TABLE `mc_noticeboard` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `title` varchar(128) NOT NULL,
  `content` text,
  `user` int(10) NOT NULL,
  `adate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `view` int(10) NOT NULL DEFAULT '0',
  `category` tinyint(3) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8

CREATE TABLE `mc_playboard` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user` int(10) unsigned NOT NULL,
  `title` varchar(128) NOT NULL,
  `content` text,
  `adate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `view` int(10) unsigned NOT NULL DEFAULT '0',
  `category` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `youtubeid` varchar(128) DEFAULT NULL,
  `youtubethum` varchar(128) NOT NULL DEFAULT 'http://placehold.it/120x96',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=20 DEFAULT CHARSET=utf8

CREATE TABLE `mc_searchlist` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `board` varchar(64) NOT NULL,
  `keyword` varchar(64) NOT NULL,
  `searchdate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user` int(10) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8

CREATE TABLE `mc_sheetboard` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user` int(10) NOT NULL,
  `title` varchar(100) NOT NULL,
  `content` text,
  `adate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `view` int(10) unsigned NOT NULL DEFAULT '0',
  `like` int(10) unsigned NOT NULL DEFAULT '0',
  `heart` int(10) unsigned NOT NULL DEFAULT '0',
  `category` tinyint(3) unsigned DEFAULT '0',
  `thumurl` varchar(256) NOT NULL DEFAULT 'http://placehold.it/127x166',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=37 DEFAULT CHARSET=utf8

CREATE TABLE `mc_users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `aid` varchar(128) NOT NULL,
  `nickname` varchar(32) NOT NULL DEFAULT '익명',
  `rcategory` tinyint(3) NOT NULL DEFAULT '0',
  `grade` tinyint(3) NOT NULL DEFAULT '0',
  `rdate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `method` tinyint(3) NOT NULL DEFAULT '0',
  `password` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mc_users_UN` (`aid`),
  KEY `mc_users_mc_rcategory_FK` (`rcategory`),
  KEY `mc_users_mc_grade_FK` (`grade`)
) ENGINE=MyISAM AUTO_INCREMENT=22 DEFAULT CHARSET=utf8
