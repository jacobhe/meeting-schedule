1.安装nodejs
下载nodejs，地址：http://nodejs.org/
编译安装。
ubuntu上面可以使用sudo apt-get install nodejs安装。

2.安装npm
npm网站地址：http://npmjs.org/
安装网站上面的方法安装。
ubuntu可以直接sudo apt-get install npm

3.安装mongodb
mongodb网址：http://www.mongodb.org/
Linux下载对应的版本，安装手册：http://docs.mongodb.org/manual/tutorial/install-mongodb-on-linux/
安装完后启动mongodb。

4.安装forever
运行命令npm install -g forever
ubuntu需要管理员权限来运行:sudo npm install -g forever

5.启动会议预定程序
进入目录：aw-meeting-schedule。
第一次启动前先运行命令：node init-data.js 初始化一些必要的数据。
然后启动运行命令：forever start app.js
以后只要使用启动服务器的命令就可以了。

6.测试安装
在浏览器打开
http://localhost:3000
能看到页面就说明能正常运行了。

7.停止会议预定程序
进入目录：aw-meeting-schedule。
运行命令：forever stop app.js

8.Log文件
在目录aw-meeting-schedule里面有记录服务器运行的log文件：aw-schedule.log
在里面可以看到相关服务器运行的信息。