/* 
 * 主文件
 * by JellyBlack (https://github.com/JellyBlack/bili-live-monitor)
 */
var config;
// 检查config.js是否有误
try{
	config = require('../config');
}
catch(e){
	// config.js有语法错误
	console.log("无法读取config.js！请检查括号是否成对，以及是否使用半角符号。");
	console.log(e);
	process.exit(0);
}

const fs = require('fs');
const net = require('net');
const Log = require('./log');
const Database = require('./database');
const Connection = require('./connection');
const LiveroomHandler = require('./liveroom_handler');
const queries = require('./queries');

// 监控直播间的id列表
var rooms = [];

// 直播间对象
var Room = function(){
	var roomid;// 房间号
	var anchor_mid;// 主播mid
	var database_name;// 数据库名称
	var conn;// 数据库连接
}

var log = new Log();
var database;
var liveroomHandler = new LiveroomHandler();
var conns = [];// 直播间连接列表
var all_ready = false;// 是否准备就绪，用于控制台连接

async function main(){
	// 获取版本
	var version;
	try{
		var pkg = fs.readFileSync("package.json");
		version = JSON.parse(pkg).version;
	}
	catch(e){
		log.v2("无法获取版本信息！");
		process.exit(0);
	}
	// 打印版本信息
	log.v2(`bili-live-monitor v${version}`);
	log.v2("https://github.com/JellyBlack/bili-live-monitor");
	log.init();// 初始化日志服务
	// 开启本地TCP服务器，用于与控制台通信
	
	var server = net.createServer(function(socket) {
		log.v2("控制台已连接");
		// 打印版本信息
		socket.write(`bili-live-monitor v${version}\n`);
		socket.write(getState());
		socket.write("输入房间号并回车可切换状态，输入y并回车可安全结束监控，输入q退出控制台，直接回车刷新状态");
		
		if(!all_ready){
			socket.write("监控未准备就绪，请稍候尝试连接\n");
			socket.write("/disconnect");
		}
		
		socket.on('data', async function(data){
			var cmd = data.toString().toLowerCase();
			// 刷新
			if(new RegExp("^/refresh$").test(cmd)){
				socket.write(getState());
			}
			
			// 切换状态
			else if(new RegExp("^[0-9]+$").test(cmd)){
				for(var i = 0; i < conns.length; i ++){
					if(conns[i].roomid == cmd){
						conns[i].running = !conns[i].running;
						socket.write(getState());
						return;
					}
				}
				socket.write("未找到指定直播间\n");
			}
			
			// 安全退出
			else if(new RegExp("^y$").test(cmd)){
				socket.write("正在安全退出");
				log.v2("正在安全退出");
				// 将状态设为暂停，避免新数据进入缓冲区
				for(var i = 0; i < conns.length; i ++){
					conns[i].running = false;
				}
				conns[0].finish();// 立即插值
				setTimeout(async function(){
					for(var i = 0; i < conns.length; i ++){
						conns[i].live_conn.close();// 关闭直播间连接
						if(config.database.enable_database){
							try{
								await conns[i].database_conn.release();// 关闭数据库连接
							}
							catch(e){
								log.v2(e);
							}
						}
						log.v0(`已安全关闭直播间${conns[i].roomid}的连接`);
					}
					log.v2("已安全退出监控");
					socket.write("已安全退出监控\n");
					socket.write("/disconnect");// 请求客户端断开连接
					setTimeout(() => {process.exit(0);}, 1000);
				}, 1000);
			}
			
			else{
				socket.write("未知命令\n");
			}
		});
		
		socket.on('end', function() {
			log.v2("控制台断开连接");
		});
		socket.on('error', function() {
			log.v2("控制台断开连接");
		});
	});
	
	server.listen(config.extra.console_port, function() {
		log.v0(`在${config.extra.console_port}端口上侦听控制台连接`);
	});
	
	// 检查要监控的直播间
	log.v1("正在检查待监控的直播间");
	if(config.live_room.length == 0){
		log.v2("没有配置任何直播间，已终止运行。请检查config.js文件。");
		process.exit(0);
	}
	
	var currentRoom = 0; //当前检查的房间
	config.live_room.forEach(function(element){
		currentRoom ++;
		log.v0(`正在检查第${currentRoom}个直播间配置`);
		if(element <= 0){
			log.v0(`第${currentRoom}个直播间未配置，已跳过\n`);
			return;
		}
		try{
			var trueId;
			var mid;
			if(config.extra.room_check){
				// 测试直播间可用性
				liveroomHandler.testRoomAvailability(element);
				log.v0(`第${currentRoom}个直播间检查通过`);
				sleep();// 请求间隔
				// 获取真实id
				trueId = liveroomHandler.getTrueId(element);
				log.v0(`第${currentRoom}个直播间的真实id为${trueId}`);
				sleep();
				// 获取主播信息
				mid = liveroomHandler.getMid(trueId);
				var data = liveroomHandler.getAnchorInfo(mid);
				log.v0(`直播间#${currentRoom}    主播：${data.info.uname}（mid:${mid}）    ${data.info.official_verify.num == -1 ? '' : '√认证主播    '}等级：${data.exp.master_level.level}`);
				log.v0(`粉丝勋章：${data.medal_name}    粉丝数：${data.follower_num}    公告：${data.room_news.content}`);
				sleep();
			}
			else{
				trueId = element;
				mid = 0;
				log.v0("已跳过房间校验");
			}
			// 构造Room对象
			var room = new Room();
			room.roomid = trueId;
			room.anchor_mid = mid;
			// 检查是否重复
			var flag = false;
			rooms.forEach(function(element){
				if(element.roomid == trueId){
					if(!flag){
						log.v0('该直播间与先前配置的直播间重复\n');
					}
					flag = true;
				}
			});
			// 将直播间添加到数组
			if(!flag){
				rooms.push(room);
				log.v0('');
			}
		}
		catch(e){
			log.v2(`第${currentRoom}个直播间出错：${e}\n`);
			return;
		}
	});
	// 没有任何直播间，则退出
	if(rooms.length == 0){
		log.v2("没有配置任何直播间，已终止运行。请检查config.js文件。");
		process.exit(0);
	}
	log.v1(`成功配置了${rooms.length}个直播间\n`);
	
	if(config.database.enable_database){
		// 检查数据库名称是否重复
		var pattern = /%(roomid|mid|date|time|random)%/;
		if(config.database.database_name != ""){
			if(rooms.length > 1 && !pattern.test(config.database.database_name)){
				log.v2("您为多个直播间指定了相同的数据库，程序已终止运行。");
				process.exit(0);
			}
		}
		var date_str = getDateStr();
		var time_str = getTimeStr();
		rooms.forEach(function(element){
			// 替换待填充字段
			var name = config.database.database_name;
			if(name == ""){
				name = "live_%roomid%_stats";
			}
			name = name.replace(/%roomid%/g, element.roomid);
			name = name.replace(/%mid%/g, element.mid);
			name = name.replace(/%date%/g, date_str);
			name = name.replace(/%time%/g, time_str);
			while(/%random%/.test(name)){
				name = name.replace("%random%", rnd());
			}
			element.database_name = name;
		});
		// 检查数据库名称是否重复
		for(var i = 0; i < rooms.length; i++){
			for(var j = 0; j < i; j++){
				if(rooms[i].database_name == rooms[j].database_name){
					log.v2("您为多个直播间指定了相同的数据库，程序已终止运行。");
					process.exit(0);
				}
			}
		}
		// 服务器已有的数据库列表
		var existing_dbs = [];
		// 连接数据库
		log.v1(`正在测试数据库连接`);
		log.v0(`数据库地址：${config.database.host}`);
		log.v0(`端口：${config.database.port}`);
		log.v0(`用户名：${config.database.user}`);
		log.v0("密码：***");
		database = new Database();
		var conn;
		try{
			database.createPool();
			conn = await database.createConn();
			var rows = await database.query(conn, "SHOW DATABASES;");
			rows.forEach(function(element){
				existing_dbs.push(element.Database);
			});
			log.v0(`服务器的数据库列表：${existing_dbs}`);
			conn.release();
		}
		catch(e){
			log.v2(`数据库连接失败：${e}`);
			log.v2("请检查config.js关于数据库的配置。");
			process.exit(0);
		}
		if(config.database.enable_database){
			log.v1("数据库连接成功");
		}
		
		// 对每个直播间的数据库进行初始化
		for(var i = 0; i < rooms.length; i ++){
			try{
				log.v0(`直播间${rooms[i].roomid}：正在建立数据库连接`);
				rooms[i].conn = await database.createConn();
				log.v0(`直播间${rooms[i].roomid}：目标数据库为${rooms[i].database_name}`);
				var need_to_create = true;// 是否要新建数据库
				// 检查是否已存在
				for(var j = 0; j < existing_dbs.length; j ++){
					if(existing_dbs[j] == rooms[i].database_name){
						log.v0(`直播间${rooms[i].roomid}：目标数据库已存在`);
						if(config.database.what_to_do_when_existing.toUpperCase() == "NOTHING"){
							// 报错
							log.v2(`直播间${rooms[i].roomid}对应的数据库（${rooms[i].database_name}）已存在，根据您的要求，已终止运行`);
							finishConns();
							process.exit(0);
						}
						else if(config.database.what_to_do_when_existing.toUpperCase() == "RECREATE"){
							// 删库跑路
							await database.query(rooms[i].conn, `DROP DATABASE ${rooms[i].database_name};`);
							log.v1(`直播间${rooms[i].roomid}：已删除原数据库`);
						}
						else if(config.database.what_to_do_when_existing.toUpperCase() == "NEW"){debugger
							// 追加随机字符
							var string = '';
							for(var k = 0; k < 8; k ++){
								string += rnd();
							}
							rooms[i].database_name += string;
							log.v1(`直播间${rooms[i].roomid}：已追加随机字符，新名称为${rooms[i].database_name}`);
						}
						else if(config.database.what_to_do_when_existing.toUpperCase() == "APPEND"){
							// 调整结构
							need_to_create = false;
						}
						else{
							log.v2(`无法识别您的处理方案“${config.database.what_to_do_when_existing}”！请检查config.js`);
							finishConns();
							process.exit(0);
						}
					}
				}
				if(need_to_create){
					// 新建数据库
					await database.query(rooms[i].conn, `CREATE DATABASE ${rooms[i].database_name};`);
					log.v0(`直播间${rooms[i].roomid}：已新建数据库`);
				}
				// 进入数据库
				await database.query(rooms[i].conn, `USE ${rooms[i].database_name};`);
				log.v0(`直播间${rooms[i].roomid}：已进入数据库`);
				// 创建数据表
				await database.query(rooms[i].conn, queries.fans_medal);
				log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表fans_medal`);
				await database.query(rooms[i].conn, queries.users_from_danmaku);
				log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表users_from_danmaku`);
				await database.query(rooms[i].conn, queries.users_from_gifts);
				log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表users_from_gifts`);
				await database.query(rooms[i].conn, queries.users_from_welcome);
				log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表users_from_welcome`);
				await database.query(rooms[i].conn, queries.gifts);
				log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表gifts`);
				await database.query(rooms[i].conn, queries.welcome_msg);
				log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表welcome_msg`);
				await database.query(rooms[i].conn, queries.danmaku);
				log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表danmaku`);
				if(config.data.popularity){
					await database.query(rooms[i].conn, queries.popularity);
					log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表popularity`);
				}
				else{
					log.v0(`直播间${rooms[i].roomid}：根据您的要求，popularity未创建`);
				}
				if(config.data.followers){
					if(!config.extra.room_check){
						throw "禁用房间校验时，不能启用粉丝数监控";
					}
					await database.query(rooms[i].conn, queries.followers);
					log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表followers`);
				}
				else{
					log.v0(`直播间${rooms[i].roomid}：根据您的要求，followers未创建`);
				}
				if(config.data.new_guards){
					await database.query(rooms[i].conn, queries.new_guards);
					log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表new_guards`);
				}
				else{
					log.v0(`直播间${rooms[i].roomid}：根据您的要求，new_guards未创建`);
				}
				if(config.data.entry_effect){
					await database.query(rooms[i].conn, queries.entry_effect);
					log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表entry_effect`);
				}
				else{
					log.v0(`直播间${rooms[i].roomid}：根据您的要求，entry_effect未创建`);
				}
				if(config.data.superchat){
					await database.query(rooms[i].conn, queries.superchat);
					log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表superchat`);
					await database.query(rooms[i].conn, queries.users_from_superchat);
					log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表users_from_superchat`);
				}
				else{
					log.v0(`直播间${rooms[i].roomid}：根据您的要求，superchat未创建`);
					log.v0(`直播间${rooms[i].roomid}：根据您的要求，users_from_superchat未创建`);
				}
				if(config.data.json){
					await database.query(rooms[i].conn, queries.json);
					log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表json`);
				}
				else{
					log.v0(`直播间${rooms[i].roomid}：根据您的要求，json未创建`);
				}
				log.v0(`直播间${rooms[i].roomid}：数据表创建或确认完毕`);
				// 为fans_medal表添加一条缺省记录
				await database.query(rooms[i].conn, "INSERT IGNORE INTO fans_medal (anchor_room_id, anchor_name, medal_name) VALUES (0, '无勋章或主播无效', 'NO MEDAL OR INVALID ANCHOR')");
				log.v1(`直播间${rooms[i].roomid}：数据库初始化完毕`);
			}
			catch(e){
				log.v2(`初始化直播间${rooms[i].roomid}的数据库时出错：${e}`);
				log.v2("已终止运行");
				finishConns();
				process.exit(0);
			}
		}
	}
	else{
		log.v1(`已禁用数据库`);
	}
	
	// 建立直播连接
	log.v0(`您指定的连接协议为${config.connection.protocol}`);
	log.v0(`您已${config.connection.doKeep ? "开启" : "关闭"}断线重连功能`);
	for (var i = 0; i < rooms.length; i ++){
		var live_conn = new Connection();
		await live_conn.create(rooms[i].roomid, rooms[i].anchor_mid, database, rooms[i].conn, true);
		live_conn.init();
		conns.push(live_conn);
	}
	
	// 此处已全部准备完毕
	all_ready = true;
	log.v2("\n所有监控已设立完毕。");
	log.v2("请使用“npm run console”安全退出，避免数据丢失");
}

// 生成随机数字
function rnd(){
	return Math.floor(Math.random() * 10);
}

// 获取直播间状态
function getState(){
	var string = "直播间监控列表\n";
	for(var i = 0; i < conns.length; i ++){
		string += `直播间#${i + 1}    房间号：${conns[i].roomid}    状态：${conns[i].running ? "运行中" : "已暂停"}    事件数： ${conns[i].recorded_events}\n`;
	}
	return string;
}

// 销毁已有的连接
function finishConns(){
	rooms.forEach(function(ele){
		try{
			ele.conn.release();
		}
		catch(e){}
	});
}

// 获取日期
function getDateStr(){
	var date = new Date();
    var YY = date.getFullYear();
    var MM = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
    var DD = (date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate());
    return '' + YY + MM + DD ;
}

// 获取时间
function getTimeStr(){
	var date = new Date();
    var hh = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours());
    var mm = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
    var ss = (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
    return '' + hh + mm + ss;
}

// 请求间隔（同步）
function sleep(){
	var min_time = config.extra.interval_base - config.extra.interval_random;
	if(min_time < 0){
		min_time = 0;
	}
	var max_time = config.extra.interval_base + config.extra.interval_random;
	var time = min_time + Math.floor(Math.random() * (max_time - min_time));
	var start_time = Date.now();
	while(true){
		if(Date.now() - start_time >= time){
			break;
		}
	}
}

// 导出模块
module.exports = main;
