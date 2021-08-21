/* 
 * 监控的配置文件
 * by JellyBlack (https://github.com/JellyBlack/bili-live-monitor)
 */
var config = {
	// 房间号，填非正数表示禁用，长号短号均可，可指定多个，用半角逗号分隔。
	"live_room" : [5440, 544614, 7734200],
	
	// 可选的监控数据
	"data" : {
		// 以下数据可选，如需要记录，则指定为true，反之为false
		
		// 人气值（每次发心跳包时更新）
		"popularity" : true,
		
		// 主播粉丝数
		"followers" : false,
		
		// 粉丝数更新间隔，单位为秒
		"followers_interval" : 60,
		
		// 购买舰长
		"new_guards" : true,
		
		// 入场效果（比如欢迎舰长进入直播间）
		"entry_effect" : true,
		
		// 醒目留言（Super Chat）
		"superchat" : true,
		
		// 所有直播事件json（非常占空间，一般用于调试）
		// 受限于MySQL版本问题，json统一存储为文本格式
		"json" : false
	},
	
	// 其他监控选项
	"extra" : {
		// 【当前版本未实现，敬请期待】
		// 仅监控开播时的数据，关播或轮播时的数据不记录
		"live_only" : false,
		
		// 【当前版本未实现，敬请期待】
		// 关播则停止监控
		// 注：如果主播临时掉线，也会停止监控，以后的数据都不会记录
		"auto_stop" : false,
		
		// 是否启用数据覆盖
		// 启用：采集到的用户信息等将保持最新，但可能造成很多重复的写入操作
		// 禁用：用户信息在采集一次之后不再更新，短期监控（数小时内）建议禁用
		"override" : true,
		
		// 监控(bili-live-monitor.js)和控制台(monitor_console.js)通信时使用的端口
		"console_port" : 4553
	},
	
	// 数据库（勿手动更改生成的数据库的结构）
	"database" : {
		// 是否写入数据库，指定为false则数据不会写入数据库中，以下数据库设置无效
		"enable_database" : true,
		
		// 数据库地址，本机地址则填localhost
		"host" : "localhost",
		
		// 端口，默认3306（MySQL）
		"port" : 3306,
		
		// 用户
		"user" : "live-monitor",
		
		// 密码，若无需密码登录则指定为空字符串
		"password" : "",
		
		/* 
		 * 数据库名称，指定为空则默认“live_%roomid%_stats"
		 * 注意：如同时监控多个直播间，数据库勿指定为静态名称
		 * 支持的动态填充字段：
		 * %roomid% 房间号
		 * %mid% 主播的mid
		 * %date% 当前日期，格式为yyyyMMdd
		 * %time% 当前时间，格式为HHmmss
		 * %random% 创建1位随机数字，如需要3位，则应写为%random%%random%%random%
		 */
		"database_name" : "",
		
		/* 
		 * 数据库已存在的处理方案
		 * "APPEND"（默认） : 追加数据到已有数据库中
		 * "NEW" : 尝试在名称后面追加8位随机数字，并创建数据库
		 * "RECREATE" : 删除数据库并重新创建（危险！）
		 * "NOTHING" : 不处理并报告异常
		 */
		"what_to_do_when_existing" : "APPEND",
		
		// 说明：以下三个选项仅第一次创建数据库时有效
		// 是否启用外键
		// 警告：启用外键可能造成因SQL执行顺序不确定导致的无法插值问题
		"enable_foreign_key" : false,
		
		// 是否除主键、外键外为某些字段创建索引，建议开启
		"enable_index" : true,
		
		// 是否为数据表、字段添加注释
		"enable_comment" : true,
		
		// 批量插值数量，记录数达到此值后运行SQL查询。不建议设置过小
		"amount" : 50,
		
		// 插值时间间隔，定时运行SQL查询，即使没达到批量插值数量。可防止数据滞留过久。单位为秒
		"sql_interval" : 10,
		
		// 缓冲区监测间隔，每隔多久检测一次是否达到批量插值数量或插值时间间隔。单位为毫秒
		"buf_interval" : 1000
	},
	
	// 日志输出
	"log" : {
		// 是否启用日志输出，指定为false则控制台不会打印日志，也不会写入日志文件，以下日志输出设置无效
		"enable_log" : true,
		
		/* 
		 * 日志等级
		 * 0 : 打印所有日志信息，比如弹幕、送礼、错误信息（记得清理日志文件！）
		 * 1 : 打印较少信息，比如一分钟内接收到的弹幕数量。包含错误信息
		 * 2 : 仅打印错误信息
		 */
		 "log_level" : 1
	},
	
	// 网络连接，该部分可参考https://github.com/simon300000/bilibili-live-ws
	"connection" : {
		// 是否启用HTTPS
		"https" : true,
		
		// 协议，可选TCP和WS
		"protocol" : "TCP",
		
		// 是否断线重新连接
		"doKeep" : true,
		
		// WebSocket连接的地址，留空则为默认
		"address" : "",
		
		// TCP连接的地址，留空则为默认
		"host" : "",
		
		// TCP连接的端口，默认为2243
		"port" : 2243,
		
		// 默认为2
		"protover" : 2,
		
		// 可选, WS握手的Token
		"key" : ""
	}
}

// 封装配置文件
module.exports = config;
