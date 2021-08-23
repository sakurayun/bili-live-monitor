/* 
 * 前端js
 * by JellyBlack (https://github.com/JellyBlack/bili-live-monitor)
 */
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
	})



	// 以下是ECharts的示例
	var myChart = echarts.init(document.getElementById('main'));
	// 指定图表的配置项和数据
	var option = {
		title: {
			text: 'ECharts 入门示例'
		},
		tooltip: {},
		legend: {
			data:['销量']
		},
		xAxis: {
			data: ["衬衫","羊毛衫","雪纺衫","裤子","高跟鞋","袜子"]
		},
		yAxis: {},
		series: [{
			name: '销量',
			type: 'bar',
			data: [5, 20, 36, 10, 10, 20]
		}]
	};
	// 使用刚指定的配置项和数据显示图表。
	myChart.setOption(option);
	
});

function databaseOnChange(obj){
	var index = obj.selectedIndex;
	var value = obj.options[index].value;
	console.log(`索引：${index}  值：${value}`);
}

function chartOnChange(obj){
	var index = obj.selectedIndex;
	var value = obj.options[index].value;
	console.log(`索引：${index}  值：${value}`);
}