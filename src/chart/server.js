/* 
 * HTTP服务器
 * by JellyBlack (https://github.com/JellyBlack/bili-live-monitor)
 */
const http = require('http');
const url = require('url');
const Log = require('../log');
const Database = require('../database');
const fs = require('fs');
const config = require('../../config');

var log = new Log();
var databases = [];

async function main(){
	// 访问数据库
	log.v1(`正在获取数据库列表`);
	var database = new Database();
	var existing_dbs = [];
	var conn;
	var json = [];
	try{
		database.createPool();
		conn = await database.createConn();
		var rows = await database.query(conn, "SHOW DATABASES;");
		rows.forEach(function(element){
			existing_dbs.push(element.Database);
		});
		log.v1(`服务器的数据库列表：${existing_dbs}`);
		conn.release();
	}
	catch(e){
		log.v2(`数据库连接失败：${e}`);
		log.v2("请检查config.js关于数据库的配置。");
		process.exit(0);
	}
	log.v1(`正在读取历史记录文件`);
	var exists = await new Promise((resolve, reject) => {
		fs.exists("../../histroy/database_histroy.json", function(exists){
			resolve(exists);
		});
	});
	if(exists){
		try{
			json = JSON.parse(fs.readFileSync("../../histroy/database_histroy.json", "utf8"));
		}
		catch(e){
			log.v2(`无法读取历史记录文件：${e}`);
		}
	}
	label:for(var i = 0; i < existing_dbs.length; i ++){
		var db = existing_dbs[i];
		// 跳过一些数据库
		if(db == "information_schema" || db == "performance_schema" || db == "sys" || db == "mysql"){
			continue label;
		}
		if(json.length != 0){
			// 只读取历史记录里有的数据库
			for(var j = 0; j < json.length; j ++){
				if(json[j].database_name == db){
					databases.push({
						database_name : db,
						display : `${db} - ${json[j].anchor_name}`
					});
					continue label;
				}
			}
		}
		else{
			databases.push({
				database_name : db,
				display : db
			});
		}
	}
	
	// 配置服务器
	var host = "localhost";
	if(config.server.host != ""){
		host = config.server.host;
	}
	server.listen(config.server.port, host, function(){
		log.v2(`服务器正在${config.server.port}端口上侦听`);
	});
}

// 入口
main();

const server = http.createServer(function(req, res){
	var obj = url.parse(req.url);
	var pathname = obj.pathname;
	if(pathname == "/"){
		res.setHeader("Content-Type", "text/html");
		res.end(fs.readFileSync("chart.html"));
	}
	else if(pathname == "/chart.js"){
		res.setHeader("Content-Type", "text/javascript");
		res.end(fs.readFileSync("chart.js"));
	}
	else if(pathname == "/getDatabases"){
		res.setHeader("Content-Type", "application/json");
		res.end(JSON.stringify(databases));
	}
	else{
		res.setHeader("Content-Type", "text/plain");
		res.setStatusCode = 404;
		res.end("404 Not Found.");
	}
});
