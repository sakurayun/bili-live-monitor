/* 
 * 前端js
 * by JellyBlack (https://github.com/JellyBlack/bili-live-monitor)
 */
var echart;
var option;
var width = 60;
var chart_type;
var data;
$(function(){
	// 获取可用的数据库列表
	$.get("getDatabases", function(data, status){
		if(status == "success"){
			data.forEach((element) => {
				$("#database_selector").append(`<option value="${element.database_name}">${element.display}</option>`);
			});
		}
		else{
			alert("无法加载数据库列表！");
		}
	});
	
	// 初始化ECharts
	echart = echarts.init(document.getElementById('main'));
});

var database_index = 0;
var chart_type = "";

function databaseOnChange(obj){
	var index = obj.selectedIndex;
	var value = obj.options[index].value;
	console.log(`索引：${index}  值：${value}`);
	database_index = index - 1;
	onChange();
}

function chartOnChange(obj){
	var index = obj.selectedIndex;
	var value = obj.options[index].value;
	console.log(`索引：${index}  值：${value}`);
	chart_type = value;
	onChange(value);
}

function onChange(value){
	$.get(`getData?database=${database_index}&chart=${chart_type}`, function(response, status){
		if(status == "success"){
			if(response.code == 0){
				data = response.data;
				update();
			}
			else{
				// TODO 处理异常
			}
		}
		else{
			alert("无法加载数据！");
		}
	});
}

function update(){
	if(chart_type == "gifts"){
		option = {
			dataset : {
				dimensions : ["num", "time"],
				source : generateData()
			},
			title : {
				text : "送礼数量折线图"
			},
			xAxis : {
				type : "time",
				axisPointer : {
					show : true
				}
			},
			tooltip : {
				show : true
			},
			toolbox : {
				show : true,
				feature : {
					dataZoom : {
						yAxisIndex : "none"
					},
					magicType : {
						type : ["line", "bar"],
					},
					saveAsImage : {},
					restore : {}
				}
			},
			yAxis : {
				name : "件/秒"
			},
			dataZoom : [
				{
					type : "inside"
				},
				{
					type : "slider"
				}
			],
			series : [
				{
					name : "送礼数量（件/秒）",
					type : "line",
					encode : {
						x : "time",
						y : "num"
					},
					symbol : "none"
				}
			]
		}
	}
	echart.setOption(option);
}

// 滑动条改变
function onWidthInput(){
	width = convert(document.getElementById("width").value);
	if(width < 300){
		$("#width_label").text(`${width}秒`);
	}
	else if(width < 7200){
		$("#width_label").text(`${width / 60}分钟`);
	}
	else{
		$("#width_label").text(`${width / 3600}小时`);
	}
}

// 滑动条改变
function onWidthChange(){
	update();
}

// 将滑动条的值转变为时间粒度
function convert(value){
	/*
	 * 1-30 每单位增减1秒，30对应30秒 y=x
	 * 31-45 每单位增减2秒，45对应60秒 y=30+(x-30)*2
	 * 46-65 每单位增减3秒，65对应120秒 y=60+(x-45)*3
	 * 66-77 每单位增减5秒，77对应180秒 y=120+(x-65)*5
	 * 78-89 每单位增减10秒，89对应300秒 y=180+(x-77)*10
	 * 90-99 每单位增减30秒，99对应600秒 y=300+(x-89)*30
	 * 100-119 每单位增减1分钟，119对应30分钟 y=600+(x-99)*60
	 * 120-128 每单位增减10分钟，128对应2小时 y=1800+(x-119)*600
	 * 129-150 每单位增减1小时，150对应24小时 y=7200+(x-128)*3600
	 */
	if(value < 31){
		return value;
	}
	else if(value < 46){
		return 30 + (value - 30) * 2
	}
	else if(value < 66){
		return 60 + (value - 45) * 3
	}
	else if(value < 78){
		return 120 + (value - 65) * 5
	}
	else if(value < 90){
		return 180 + (value - 77) * 10
	}
	else if(value < 100){
		return 300 + (value - 89) * 30
	}
	else if(value < 120){
		return 600 + (value - 99) * 60
	}
	else if(value < 129){
		return 1800 + (value - 119) * 600
	}
	else{
		return 7200 + (value - 128) * 3600
	}
}

// 根据时间粒度生成数据
function generateData(){
	// 每组数据包含开始时刻，不包含结束时刻
	var start_time = data[0].time;
	var end_time = data[data.length - 1].time;
	var cursor = start_time;
	var export_data = [];
	var i = 0;
	while(cursor <= end_time){
		var total_num = 0;
		for(; i < data.length; i ++){
			if(data[i].time < cursor + width * 1000){
				total_num += data[i].num;
			}
			else{
				break;
			}
		}
		export_data.push({
			num : Math.round((total_num / width) * 100) / 100,
			time : cursor
		});
		cursor += width * 1000;
	}
	return export_data;
}