# bili-live-monitor

监控哔哩哔哩直播间数据，并实时保存至数据库。

可部署至Windows, MacOS, Linux云服务器，甚至Android。

**该项目仅用于学习和测试，请勿滥用。该项目处于测试版，以后可能有较大改动。**

**如加载慢，可访问[镜像仓库](https://gitee.com/jellyblack/bili-live-monitor)。**

<details>
    <summary>版本更新记录</summary>

### 0.3.0
支持查看以下统计图：
- 观众入场折线图
- 人气变化折线图
- 粉丝数变化折线图
- 醒目留言折线图
- 购买舰长折线图
- 直播事件折线图
- 入场效果折线图
- 送礼数量折线图
### 0.2.0
- 支持更多监控项：购买舰长、入场效果、醒目留言
- 添加请求间隔，防止触发412错误
- 支持仅监控开播时的数据、关播则停止监控
- 支持钉钉和邮件通知
- 其他细节优化
### 0.1.0
第一个版本

</details>

## 准备

该项目依赖Node.js 7.6（V8版本 5.5）及以上版本。请确保已安装Node.js。运行`node --version`查看Node.js版本号。

### Windows/MacOS安装Node.js
前往Node.js官网（https://nodejs.org/zh-cn/ ）下载对应的安装包，安装即可。建议下载长期支持（LTS）版。

### Linux安装Node.js

```shell
# 先cd到某个目录
wget https://nodejs.org/dist/v14.17.5/node-v14.17.5-linux-x64.tar.xz
tar xf node-v14.17.5-linux-x64.tar.xz
cd node-v14.17.5-linux-x64/
./bin/node -v
# 设置符号链接
ln -s ./bin/npm   /usr/local/bin/ 
ln -s ./bin/node   /usr/local/bin/
```

### Android安装Node.js

访问以下链接下载Termux：https://f-droid.org/zh_Hans/packages/com.termux/

Termux是带有软件包的终端模拟器。打开Termux，执行`pkg install nodejs`即可。

------

该项目需要MySQL数据库以存储数据（你也可以在配置里禁用）。Windows, MacOS, Linux安装MySQL的方法请上网搜索，这里不再赘述。也可以选择各主机商的云数据库。

**注意：最好在同一终端上运行监控和服务器，或两者处在同一内网。**

### Android安装MySQL

打开Termux，执行`pkg install mariadb`即可。

安装后，为bili-live-monitor指定一个用户，至少应拥有以下全局权限：SELECT, INSERT, UPDATE, CREATE, INDEX, DROP, SHOW DATABASES。

------

需要Git克隆项目，请确保已安装Git。Android使用`pkg install git`安装。

## 安装与运行

### 安装

```shell
git clone https://github.com/JellyBlack/bili-live-monitor
cd bili-live-monitor
npm install
```

或者从镜像仓库克隆：

```shell
git clone https://gitee.com/jellyblack/bili-live-monitor
```

### 配置

项目根目录下有一个`config.js`文件，编辑以调整配置。文件内有详细注释。

使用`git checkout config.js`以恢复默认配置。

### 运行

```shell
npm start
```

在Linux环境下，可以使用`nohup npm start &`以不中断地运行项目。

如果想在Android机上不间断地运行，须关闭省电优化等一系列设置，确保Termux始终运行。

### 管理

运行`npm run console`进入监控控制台，可以安全停止监控。

**一定要安全停止！** 使用Ctrl+C停止会丢失缓冲区的数据。

## 统计
**该功能目前处于开发阶段。**

运行`npm run chart`可本地HTTP服务器，访问相应地址（默认为http://localhost:8080）可查看图表。


## 通知
bili-live-monitor支持钉钉通知和邮件通知，便于及时推送统计数据。
### 钉钉通知

在钉钉创建一个群聊，添加自定义机器人。官方文档地址：https://developers.dingtalk.com/document/robots/custom-robot-access 

勾选“自定义关键词”安全设置，关键词填写“bili-live”或“monitor”。

将Webhook地址填入config.js文件中。

![钉钉通知效果（若无法加载请前往Gitee备份仓库）](assets/README/钉钉通知效果.jpg)

### 邮件通知

请参考config.js的注释进行设置。一般在邮箱的设置界面开启SMTP服务。邮件采用HTML格式。

![邮件通知效果（若无法加载请前往Gitee备份仓库）](assets/README/邮件通知效果.jpg)

## 杂项

### 查看直播间房间号

![房间号示例（若无法加载请前往Gitee备份仓库）](assets/README/房间号示例.jpg)

### 开发者

**JellyBlack**

QQ：1574854804

Email：l45531@126.com

